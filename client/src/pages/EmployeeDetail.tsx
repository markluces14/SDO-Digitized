import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Employee, Document } from "../types";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { getCurrentUser } from "../lib/auth";

/* ---------------- helpers ---------------- */

function parseFilenameFromDisposition(header?: string | null) {
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(header);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1].replace(/\"/g, ""));
  } catch {
    return m[1].replace(/\"/g, "");
  }
}

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function triggerDownload(blob: Blob, filename = "download") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function getEmployeeIdFromHash(): number {
  const m = (window.location.hash || "").match(/#\/employee\/(\d+)/);
  return m ? Number(m[1]) : NaN;
}

/* ---------------- constants ---------------- */

const TITLE_OPTIONS = [
  "Appointment (Form 33)",
  "Assumption to Duty",
  "Oath of Office",
  "Personal Data Sheet (CSC Form 212/Updated as of December 2018)",
  "Position Description Form",
  "Certificate of Eligibilities/licenses",
  "Designation Orders, if applicable",
  "Statement of Assets, Liabilities and Networth",
  "Notices of Salary Adjustments/Step Increments",
  "Medical Certificate (CSC Form 211)",
  "NBI Clearance",
  "School Diplomas and Transcript of Records",
  "Marriage Contract/Certificate (if applicable)",
  "Certificate of Leave Balances (for transferees)",
  "Clearance from Property and Money Accountabilities (for Transferees)",
  "Commendations, Certificate of Achievement, Awards, etc.",
  "Disciplinary Action Documents (if any)",
  "Contract of Service (if applicable)",
] as const;

const TITLE_TO_TAG: Record<string, string> = {
  "Appointment (Form 33)": "Employment",
  "Assumption to Duty": "Employment",
  "Oath of Office": "Employment",
  "Personal Data Sheet (CSC Form 212/Updated as of December 2018)":
    "Personal Records",
  "Position Description Form": "Personal Records",
  "Certificate of Eligibilities/licenses": "Performance & Discipline",
  "Designation Orders, if applicable": "Performance & Discipline",
  "Statement of Assets, Liabilities and Networth": "Compensation & Benefits",
  "Notices of Salary Adjustments/Step Increments": "Compensation & Benefits",
  "Medical Certificate (CSC Form 211)": "Health & Clearance",
  "NBI Clearance": "Health & Clearance",
  "School Diplomas and Transcript of Records": "Qualifications",
  "Marriage Contract/Certificate (if applicable)": "Personal Records",
  "Certificate of Leave Balances (for transferees)": "Performance & Discipline",
  "Clearance from Property and Money Accountabilities (for Transferees)":
    "Health & Clearance",
  "Commendations, Certificate of Achievement, Awards, etc.":
    "Performance & Discipline",
  "Disciplinary Action Documents (if any)": "Performance & Discipline",
  "Contract of Service (if applicable)": "Employment",
};

const FILTER_TAG_OPTIONS = [
  "Employment",
  "Personal Records",
  "Performance & Discipline",
  "Compensation & Benefits",
  "Health & Clearance",
  "Qualifications",
] as const;

const POSITION_OPTIONS = [
  "Teacher",
  "Principal",
  "Professor I",
  "Professor II",
  "Professor III",
  "Professor IV",
] as const;

const GENDER_OPTIONS = ["Male", "Female"] as const;

/* ---------------- modal ---------------- */

function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  confirmClassName = "btn btn-danger",
  cancelText = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  confirmClassName?: string;
  cancelText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="ui-modal__backdrop" onClick={onCancel}>
      <div
        className="ui-modal__panel"
        style={{ width: 520, maxWidth: "92vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal__header">
          <div className="ui-modal__title">{title}</div>
          <button
            className="ui-modal__close"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="ui-modal__body">
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{message}</div>
        </div>

        <div className="ui-modal__footer">
          <Button
            className="btn btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            className={confirmClassName}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterModal({
  open,
  titleValue,
  tagValue,
  titleOptions,
  tagOptions,
  onClose,
  onApply,
  onReset,
  setTitleValue,
  setTagValue,
}: {
  open: boolean;
  titleValue: string;
  tagValue: string;
  titleOptions: string[];
  tagOptions: string[];
  setTitleValue: (v: string) => void;
  setTagValue: (v: string) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  if (!open) return null;

  return (
    <div className="ui-modal__backdrop" onClick={onClose}>
      <div
        className="ui-modal__panel"
        style={{ width: 720, maxWidth: "96vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal__header">
          <div className="ui-modal__title">Filter Documents</div>
          <button
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="ui-modal__body">
          <div className="form-grid">
            <div>
              <label className="field-label">Title</label>
              <Select
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
              >
                <option value="">All Titles</option>
                {titleOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="field-label">Tag</label>
              <Select
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
              >
                <option value="">All Tags</option>
                {tagOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div className="full muted" style={{ marginTop: 6 }}>
              Tip: Use <strong>Search</strong> to find by title/tags text, and{" "}
              <strong>Filter</strong> to narrow down.
            </div>
          </div>
        </div>

        <div className="ui-modal__footer">
          <Button className="btn btn-outline" onClick={onReset}>
            Reset
          </Button>
          <Button className="btn btn-outline" onClick={onClose}>
            Close
          </Button>
          <Button className="btn btn-primary" onClick={onApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function EmployeeDetail() {
  const id = getEmployeeIdFromHash();
  const me = getCurrentUser();
  const canEditInfo = me?.role === "admin" || me?.role === "staff";

  const [changeConfirmOpen, setChangeConfirmOpen] = useState(false);
  const [changeTargetDocId, setChangeTargetDocId] = useState<number | null>(
    null,
  );

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    employee_no: "",
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    place_of_birth: "",
    birthdate: "",
    gender: "",
    position: "",
    department: "",
    date_hired: "",
  });

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const changeInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"soft" | "trash">("soft");
  const [confirmDocId, setConfirmDocId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const sanitizeNameValue = (value: string) => {
    return value
      .replace(/[^\p{L}\s-]/gu, "")
      .replace(/\s+/g, " ")
      .replace(/-+/g, "-")
      .replace(/^[-\s]+/, "");
  };

  const handleEditNameChange =
    (k: "first_name" | "middle_name" | "last_name") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = sanitizeNameValue(e.target.value);
      setEditForm((prev) => ({ ...prev, [k]: cleaned }));
    };

  const handleEditNameKeyDown =
    (k: "first_name" | "middle_name" | "last_name") =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedControlKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Tab",
        "Home",
        "End",
      ];

      if (allowedControlKeys.includes(e.key)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === " ") {
        e.preventDefault();
        e.stopPropagation();

        const input = e.currentTarget;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const rawNext =
          input.value.slice(0, start) + " " + input.value.slice(end);
        const next = sanitizeNameValue(rawNext);

        setEditForm((prev) => ({ ...prev, [k]: next }));

        requestAnimationFrame(() => {
          const pos = Math.min(start + 1, next.length);
          input.setSelectionRange(pos, pos);
        });
        return;
      }

      if (e.key === "-") {
        e.preventDefault();
        e.stopPropagation();

        const input = e.currentTarget;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const rawNext =
          input.value.slice(0, start) + "-" + input.value.slice(end);
        const next = sanitizeNameValue(rawNext);

        setEditForm((prev) => ({ ...prev, [k]: next }));

        requestAnimationFrame(() => {
          const pos = Math.min(start + 1, next.length);
          input.setSelectionRange(pos, pos);
        });
        return;
      }

      if (e.key.length === 1 && !/[\p{L}]/u.test(e.key)) {
        e.preventDefault();
      }
    };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const empRes = await api.get(`/employees/${id}`);
      setEmployee(empRes.data);

      const docsRes = await api.get(`/employees/${id}/documents`, {
        params: { with_trashed: 1 },
      });
      setDocs(docsRes.data?.data ?? docsRes.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load employee.";
      setLoadError(msg);
      setEmployee(null);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const openEditInfo = () => {
    if (!employee) return;
    setEditErr(null);
    setEditForm({
      employee_no: (employee as any).employee_no ?? "",
      email: (employee as any).email ?? "",
      first_name: (employee as any).first_name ?? "",
      middle_name: (employee as any).middle_name ?? "",
      last_name: (employee as any).last_name ?? "",
      place_of_birth: (employee as any).place_of_birth ?? "",
      birthdate: (employee as any).birthdate ?? "",
      gender: (employee as any).gender ?? "",
      position: (employee as any).position ?? "",
      department: (employee as any).department ?? "",
      date_hired: (employee as any).date_hired ?? "",
    });
    setEditOpen(true);
  };

  const saveEditInfo = async () => {
    setEditErr(null);
    setEditSaving(true);
    try {
      await api.put(`/employees/${id}`, {
        employee_no: editForm.employee_no,
        email: editForm.email,
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        last_name: editForm.last_name,
        place_of_birth: editForm.place_of_birth,
        birthdate: editForm.birthdate,
        gender: editForm.gender,
        position: editForm.position,
        department: editForm.department,
        date_hired: editForm.date_hired,
      });

      setEditOpen(false);
      await load();
      window.dispatchEvent(new Event("app:data-changed"));
    } catch (e: any) {
      setEditErr(
        e?.response?.data?.message || "Failed to update employee info.",
      );
    } finally {
      setEditSaving(false);
    }
  };

  const displayName = (() => {
    if (!employee) return `Employee #${id}`;
    const ln = (employee as any).last_name;
    const fn = (employee as any).first_name;
    const mn = (employee as any).middle_name;
    if (ln || fn || mn) {
      return [ln, [fn, mn].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ");
    }
    if ((employee as any).full_name) return (employee as any).full_name;
    return `Employee #${id}`;
  })();

  const filteredDocs = useMemo(() => {
    const s = searchText.trim().toLowerCase();

    return docs.filter((d) => {
      const dTitle = String(d.title ?? "");
      const dTags = (d.tags ?? []).map((t: any) => String(t.name));

      if (filterTitle && dTitle !== filterTitle) return false;
      if (filterTag && !dTags.includes(filterTag)) return false;

      if (!s) return true;
      const hay = `${dTitle} ${dTags.join(" ")}`.toLowerCase();
      return hay.includes(s);
    });
  }, [docs, searchText, filterTitle, filterTag]);

  const uploadedDocs = docs.filter((d: any) => !d.deleted_at);

  const upload = async () => {
    setErr(null);
    if (!title) return setErr("Please select a Title.");
    if (!file) return setErr("Please choose a file.");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("employee_id", String(id));
      fd.append("title", title);

      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => fd.append("tags[]", t));

      fd.append("file", file);

      await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setTags("");
      setFile(null);

      await load();
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Upload failed.",
      );
    } finally {
      setSaving(false);
    }
  };

  const viewDoc = async (docId: number) => {
    try {
      const res = await api.get(`/documents/${docId}/view`, {
        responseType: "blob",
        validateStatus: (s) => s >= 200 && s < 400,
      });
      openBlobInNewTab(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to open file.");
    }
  };

  const downloadDoc = async (docId: number) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, {
        responseType: "blob",
        validateStatus: (s) => s >= 200 && s < 400,
      });

      const cd =
        res.headers?.["content-disposition"] ||
        res.headers?.["Content-Disposition"];
      let fname = parseFilenameFromDisposition(cd) || "document";

      if (employee) {
        const ln = (employee as any).last_name || "";
        const fn = (employee as any).first_name || "";
        const empName = [ln, fn].filter(Boolean).join(", ");

        const doc = docs.find((d) => d.id === docId);
        const isPdf = (res.headers?.["content-type"] || "")
          .toString()
          .includes("pdf");
        const ext = isPdf ? ".pdf" : "";

        if (empName || doc?.title) {
          fname = `${empName}${empName && doc?.title ? " - " : ""}${
            doc?.title || "file"
          }${ext}`;
        }
      }

      triggerDownload(res.data, fname);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to download file.");
    }
  };

  const deleteDoc = (docId: number) => {
    setConfirmMode("soft");
    setConfirmDocId(docId);
    setConfirmOpen(true);
  };

  const trashDoc = (docId: number) => {
    setConfirmMode("trash");
    setConfirmDocId(docId);
    setConfirmOpen(true);
  };

  const restoreDoc = async (docId: number) => {
    try {
      await api.post(`/documents/${docId}/restore`);
      await load();
      window.dispatchEvent(new Event("app:data-changed"));
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to restore document.");
    }
  };

  const runConfirmedDelete = async () => {
    if (!confirmDocId) return;

    setConfirmLoading(true);
    try {
      if (confirmMode === "soft") {
        await api.delete(`/documents/${confirmDocId}`);
      } else {
        await api.delete(`/documents/${confirmDocId}/force`);
      }

      setConfirmOpen(false);
      setConfirmDocId(null);

      await load();
      window.dispatchEvent(new Event("app:data-changed"));
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          (confirmMode === "trash"
            ? "Failed to permanently delete document."
            : "Failed to delete document."),
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const triggerChangeFile = (docId: number) => {
    setChangeTargetDocId(docId);
    setChangeConfirmOpen(true);
  };

  const confirmChangeFile = () => {
    if (!changeTargetDocId) return;
    setChangeConfirmOpen(false);

    const target = changeInputsRef.current[changeTargetDocId];
    if (target) {
      target.click();
    }

    setChangeTargetDocId(null);
  };

  const cancelChangeFile = () => {
    setChangeConfirmOpen(false);
    setChangeTargetDocId(null);
  };

  const onChangeFile = async (docId: number, f?: File) => {
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append("file", f);
      await api.post(`/documents/${docId}/file`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to replace file.");
    }
  };

  const applyFilter = () => setFilterOpen(false);

  const resetFilter = () => {
    setFilterTitle("");
    setFilterTag("");
  };

  return (
    <div className="light-detail">
      <div style={{ marginBottom: 10 }}>
        <button
          className="back-pill"
          onClick={() => (window.location.hash = "#/")}
        >
          <span className="arrow">←</span> Back to Dashboard
        </button>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">{displayName}</div>
          {employee && (
            <div className="subline">
              ID: {(employee as any).employee_no ?? "—"} •{" "}
              {(employee as any).position ?? "—"} —{" "}
              {(employee as any).department ?? "—"}
            </div>
          )}
        </div>

        {canEditInfo && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button className="btn btn-outline" onClick={openEditInfo}>
              Edit Info
            </Button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Uploaded Files</h3>

        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <div className="muted">
            Uploaded: <strong>{uploadedDocs.length}</strong>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Upload Document</h3>
        {err && <div style={{ color: "red", marginBottom: 10 }}>{err}</div>}

        <div className="form-grid">
          <div>
            <label className="field-label">Title *</label>
            <Select
              value={title}
              onChange={(e) => {
                const t = e.target.value;
                setTitle(t);
                setTags(TITLE_TO_TAG[t] ?? "");
              }}
            >
              <option value="">— Select Title —</option>
              {TITLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>

          <div className="full">
            <label className="field-label">Tags</label>
            <Input
              placeholder="Auto-generated from title"
              value={tags}
              readOnly
            />
          </div>

          <div className="full file-row">
            <label className="field-label">File *</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              className="btn btn-primary upload-btn"
              onClick={upload}
              disabled={saving}
            >
              {saving ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Documents</h3>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input
              className="thin-search"
              placeholder="Search title or tags…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              className="btn btn-outline"
              onClick={() => setFilterOpen(true)}
            >
              Filter
            </Button>
            <Button className="btn btn-primary" onClick={() => {}}>
              Search
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="muted" style={{ marginBottom: 8 }}>
            {loadError}
          </div>
        )}

        {(filterTitle || filterTag) && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {filterTitle && (
              <span className="badge">
                Title: {filterTitle}{" "}
                <button
                  type="button"
                  onClick={() => setFilterTitle("")}
                  style={{ marginLeft: 6, cursor: "pointer" }}
                >
                  ×
                </button>
              </span>
            )}
            {filterTag && (
              <span className="badge">
                Tag: {filterTag}{" "}
                <button
                  type="button"
                  onClick={() => setFilterTag("")}
                  style={{ marginLeft: 6, cursor: "pointer" }}
                >
                  ×
                </button>
              </span>
            )}
            <Button className="btn btn-outline btn-xs" onClick={resetFilter}>
              Clear Filters
            </Button>
          </div>
        )}

        <table className="records-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tags</th>
              <th style={{ width: 300 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((d) => {
              const tagStr = (d.tags ?? []).map((t: any) => t.name).join(", ");
              return (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td className="muted">{tagStr || "—"}</td>
                  <td>
                    <div className="doc-actions">
                      <div className="doc-links">
                        <button
                          type="button"
                          className="doc-link"
                          onClick={() => viewDoc(d.id)}
                          title="View (opens in new tab)"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="doc-link"
                          onClick={() => downloadDoc(d.id)}
                          title="Download"
                        >
                          Download
                        </button>
                      </div>

                      <div className="doc-buttons">
                        <Button
                          className="btn btn-outline btn-xs"
                          onClick={() => triggerChangeFile(d.id)}
                        >
                          Change File
                        </Button>

                        {(d as any).deleted_at ? (
                          <>
                            <Button
                              className="btn btn-success btn-xs"
                              onClick={() => restoreDoc(d.id)}
                            >
                              Restore
                            </Button>
                            <Button
                              className="btn btn-danger btn-xs"
                              onClick={() => trashDoc(d.id)}
                            >
                              Trash
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="btn btn-danger btn-xs"
                            onClick={() => deleteDoc(d.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>

                      <input
                        ref={(el) => {
                          changeInputsRef.current = {
                            ...changeInputsRef.current,
                            [d.id]: el,
                          };
                        }}
                        type="file"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          onChangeFile(d.id, e.target.files?.[0] || undefined)
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FilterModal
        open={filterOpen}
        titleValue={filterTitle}
        tagValue={filterTag}
        titleOptions={Array.from(TITLE_OPTIONS)}
        tagOptions={Array.from(FILTER_TAG_OPTIONS)}
        setTitleValue={setFilterTitle}
        setTagValue={setFilterTag}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilter}
        onReset={resetFilter}
      />

      <ConfirmModal
        open={confirmOpen}
        title={confirmMode === "trash" ? "Permanent Delete" : "Delete Document"}
        message={
          confirmMode === "trash"
            ? "Are you sure you want to permanently delete this file? This cannot be undone."
            : "Are you sure you want to delete this file?"
        }
        confirmText={confirmMode === "trash" ? "Trash" : "Delete"}
        confirmClassName="btn btn-danger"
        loading={confirmLoading}
        onCancel={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmDocId(null);
        }}
        onConfirm={runConfirmedDelete}
      />

      <ConfirmModal
        open={changeConfirmOpen}
        title="Change File"
        message="Are you sure you want to replace this file?"
        confirmText="Yes, Change File"
        confirmClassName="btn btn-primary"
        onCancel={cancelChangeFile}
        onConfirm={confirmChangeFile}
      />

      {editOpen && (
        <div className="ui-modal__backdrop" onClick={() => setEditOpen(false)}>
          <div
            className="ui-modal__panel"
            style={{ width: 760, maxWidth: "96vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal__header">
              <div className="ui-modal__title">Edit Employee Info</div>
              <button
                className="ui-modal__close"
                onClick={() => setEditOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="ui-modal__body">
              {editErr && (
                <div
                  style={{
                    marginBottom: 10,
                    background: "#fff4f4",
                    border: "1px solid #f0caca",
                    color: "#7d1b1b",
                    padding: "8px 10px",
                    borderRadius: 10,
                  }}
                >
                  {editErr}
                </div>
              )}

              <div className="form-grid">
                <div>
                  <label className="field-label">Employee # *</label>
                  <Input
                    value={editForm.employee_no}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        employee_no: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label">Email *</label>
                  <Input
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label">First Name *</label>
                  <Input
                    value={editForm.first_name}
                    onKeyDown={handleEditNameKeyDown("first_name")}
                    onChange={handleEditNameChange("first_name")}
                  />
                </div>

                <div>
                  <label className="field-label">Middle Name</label>
                  <Input
                    value={editForm.middle_name}
                    onKeyDown={handleEditNameKeyDown("middle_name")}
                    onChange={handleEditNameChange("middle_name")}
                  />
                </div>

                <div>
                  <label className="field-label">Last Name *</label>
                  <Input
                    value={editForm.last_name}
                    onKeyDown={handleEditNameKeyDown("last_name")}
                    onChange={handleEditNameChange("last_name")}
                  />
                </div>

                <div>
                  <label className="field-label">Place of Birth *</label>
                  <Input
                    value={editForm.place_of_birth}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        place_of_birth: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label">Birthdate *</label>
                  <Input
                    type="date"
                    value={editForm.birthdate}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        birthdate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label">Employment Date *</label>
                  <Input
                    type="date"
                    value={editForm.date_hired}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        date_hired: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label">Gender *</label>
                  <Select
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                  >
                    <option value="">— Select —</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="field-label">Position *</label>
                  <Select
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                  >
                    <option value="">— Select —</option>
                    {POSITION_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="full">
                  <label className="field-label">School / Department *</label>
                  <Input
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="ui-modal__footer">
              <Button
                className="btn btn-outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="btn btn-primary"
                onClick={saveEditInfo}
                disabled={editSaving}
              >
                {editSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
