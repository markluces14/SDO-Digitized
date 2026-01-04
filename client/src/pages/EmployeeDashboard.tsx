import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";
import { getCurrentUser } from "../lib/auth";
import Button from "../components/ui/Button";

/* ---------- types ---------- */
type Employee = {
  id: number;
  employee_no: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  position: string;
  department: string; // school/office
  birthdate?: string | null;
  date_hired?: string | null;
  place_of_birth?: string | null;
};

type DocTag = { id: number; name: string };
type Document = {
  id: number;
  title: string;
  issued_at?: string | null;
  expires_at?: string | null;
  deleted_at?: string | null; // ✅ add this
  tags?: DocTag[];
};

/* ---------- helpers ---------- */
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

/* ============================================================= */

export default function EmployeeDashboard() {
  const me = getCurrentUser();
  const myEmpId = me?.employee_id || null;

  const [emp, setEmp] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // for "Change File"
  const changeInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  const load = async () => {
    if (!myEmpId) return;
    setLoading(true);
    setErr(null);
    try {
      const empRes = await api.get(`/employees/${myEmpId}`);
      setEmp(empRes.data);

      const docsRes = await api.get(`/employees/${myEmpId}/documents`);
      setDocs(docsRes.data?.data ?? docsRes.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load.");
      setEmp(null);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [myEmpId]);

  /* ---------- actions: view / download / change file / delete ---------- */

  const viewDoc = async (id: number) => {
    try {
      const res = await api.get(`/documents/${id}/view`, {
        responseType: "blob",
        // If the backend accidentally returns HTML on error,
        // Axios would still resolve; we’ll guard by size and type:
        validateStatus: (s) => s >= 200 && s < 400,
      });
      openBlobInNewTab(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to open file.");
    }
  };

  const downloadDoc = async (id: number) => {
    try {
      const res = await api.get(`/documents/${id}/download`, {
        responseType: "blob",
        validateStatus: (s) => s >= 200 && s < 400,
      });

      // Prefer the server’s filename if provided
      const cd =
        res.headers?.["content-disposition"] ||
        res.headers?.["Content-Disposition"];
      let filename = parseFilenameFromDisposition(cd) || "document";

      // Fallback to "Last, First - Title.ext"
      if (filename === "document" && emp) {
        const ln = (emp as any).last_name || "";
        const fn = (emp as any).first_name || "";
        const namePart = [ln, fn].filter(Boolean).join(", ");

        const doc = docs.find((d) => d.id === id);
        const isPdf = (res.headers?.["content-type"] || "")
          .toString()
          .includes("pdf");
        const ext = isPdf ? ".pdf" : "";

        if (namePart || doc?.title) {
          filename = `${namePart}${namePart && doc?.title ? " - " : ""}${
            doc?.title || "file"
          }${ext}`;
        }
      }

      triggerDownload(res.data, filename);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to download file.");
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

  const deleteDoc = async (docId: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to delete document.");
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

  /* ---------- render ---------- */

  const fullName =
    emp &&
    [emp.last_name, [emp.first_name, emp.middle_name].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="light-detail">
      <div className="page-header">
        <div className="page-title">My Dashboard</div>
      </div>

      {err && (
        <div
          style={{
            margin: "0 0 12px",
            padding: "10px 12px",
            border: "1px solid #f1caca",
            background: "#fff4f4",
            color: "#7d1b1b",
            borderRadius: 10,
          }}
        >
          {err}
        </div>
      )}

      {/* Profile card — matches your EmployeeDetail look */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        {loading && <div className="muted">Loading…</div>}
        {emp && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <strong>Name:</strong> {fullName}
            </div>
            <div>
              <strong>Employee #:</strong> {emp.employee_no}
            </div>
            <div>
              <strong>Email:</strong> {emp.email}
            </div>
            <div>
              <strong>Position:</strong> {emp.position}
            </div>
            <div>
              <strong>School/Office:</strong> {emp.department}
            </div>
            <div>
              <strong>Birthdate:</strong>{" "}
              {emp.birthdate
                ? dayjs(emp.birthdate).format("MMMM DD, YYYY")
                : "—"}
            </div>
            <div>
              <strong>Date Hired:</strong>{" "}
              {emp.date_hired
                ? dayjs(emp.date_hired).format("MMMM DD, YYYY")
                : "—"}
            </div>
            <div>
              <strong>Place of Birth:</strong> {emp.place_of_birth || "—"}
            </div>
          </div>
        )}
      </div>

      {/* Documents list */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Documents</h3>
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
            {docs.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td className="muted">
                  {d.issued_at ? dayjs(d.issued_at).format("YYYY-MM-DD") : "—"}
                </td>
                <td className="muted">
                  {d.expires_at
                    ? dayjs(d.expires_at).format("YYYY-MM-DD")
                    : "—"}
                </td>
                <td className="muted">
                  {(d.tags ?? []).map((t) => t.name).join(", ") || "—"}
                </td>
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
            ))}
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
