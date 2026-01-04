import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";
import type { Employee, Document } from "../types";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

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

/* ---------------- page ---------------- */

export default function EmployeeDetail() {
  const id = getEmployeeIdFromHash();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // upload state
  const [title, setTitle] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // change-file inputs
  const changeInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

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

  /* ---------------- actions ---------------- */

  const upload = async () => {
    setErr(null);
    if (!title) return setErr("Please select a Title.");
    if (!file) return setErr("Please choose a file.");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("employee_id", String(id));
      fd.append("title", title);
      if (issuedAt) fd.append("issued_at", issuedAt);
      if (expiresAt) fd.append("expires_at", expiresAt);
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
      setIssuedAt("");
      setExpiresAt("");
      setTags("");
      setFile(null);

      await load();
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Upload failed."
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

      // Prefer filename from server
      const cd =
        res.headers?.["content-disposition"] ||
        res.headers?.["Content-Disposition"];
      let fname = parseFilenameFromDisposition(cd) || "document";

      // Fallback: "Last, First - Title.ext"
      if (employee) {
        const ln =
          (employee as any).last_name ||
          (employee as any).lname ||
          (employee as any).surname ||
          "";
        const fn =
          (employee as any).first_name ||
          (employee as any).fname ||
          (employee as any).given_name ||
          "";
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

  const deleteDoc = async (docId: number) => {
    if (!confirm("Delete this document?")) return;

    try {
      await api.delete(`/documents/${docId}`);

      // ✅ keep it in the list and just refresh so it gets deleted_at
      await load();

      window.dispatchEvent(new Event("app:data-changed"));
    } catch (e: any) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to delete document."
      );
    }
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

  const triggerChangeFile = (docId: number) => {
    changeInputsRef.current[docId]?.click();
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

  /* ---------------- render ---------------- */

  return (
    <div className="light-detail">
      <div style={{ marginBottom: 10 }}>
        <button
          className="back-pill"
          onClick={() => (window.location.hash = "#/")}
        >
          <span className="arrow">←</span> Back to Employees
        </button>
      </div>

      <div className="page-header">
        <div className="page-title">{displayName}</div>
        {employee && (
          <div className="subline">
            ID: {(employee as any).employee_no ?? "—"} •{" "}
            {(employee as any).position ?? "—"} —{" "}
            {(employee as any).department ?? "—"}
          </div>
        )}
      </div>

      {/* Upload card */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Upload Document</h3>
        {err && <div style={{ color: "red", marginBottom: 10 }}>{err}</div>}

        <div className="form-grid">
          <div>
            <label className="field-label">Title *</label>
            <Select value={title} onChange={(e) => setTitle(e.target.value)}>
              <option value="">— Select Title —</option>
              {TITLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="field-label">Issued at</label>
            <Input
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Expires at</label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="full">
            <label className="field-label">Tags</label>
            <Input
              placeholder="e.g. TOR, License"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="full file-row">
            <label className="field-label">File *</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={upload} disabled={saving}>
              {saving ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </div>

      {/* Documents table */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Documents</h3>
        {loadError && (
          <div className="muted" style={{ marginBottom: 8 }}>
            {loadError}
          </div>
        )}
        <table className="records-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Tags</th>
              <th style={{ width: 300 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const issued = d.issued_at
                ? dayjs(d.issued_at).format("YYYY-MM-DD")
                : "—";
              const expires = d.expires_at
                ? dayjs(d.expires_at).format("YYYY-MM-DD")
                : "—";
              const tagStr = (d.tags ?? []).map((t: any) => t.name).join(", ");

              return (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td className="muted">{issued}</td>
                  <td className="muted">{expires}</td>
                  <td className="muted">{tagStr || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        className="link"
                        style={{ cursor: "pointer" }}
                        onClick={() => viewDoc(d.id)}
                        title="View (opens in new tab)"
                      >
                        View
                      </span>
                      <span
                        className="link"
                        style={{ cursor: "pointer" }}
                        onClick={() => downloadDoc(d.id)}
                        title="Download"
                      >
                        Download
                      </span>
                      <Button
                        className="btn btn-outline btn-xs"
                        onClick={() => triggerChangeFile(d.id)}
                      >
                        Change File
                      </Button>
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
                      {(d as any).deleted_at ? (
                        <Button
                          className="btn btn-outline btn-xs"
                          onClick={() => restoreDoc(d.id)}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          className="btn btn-danger btn-xs"
                          onClick={() => deleteDoc(d.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
