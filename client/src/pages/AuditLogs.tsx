import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";

/* ================= TYPES ================= */

type User = {
  id: number;
  name: string;
  email: string;
};

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
};

type Document = {
  id: number;
  title: string;
};

type AuditLog = {
  id: number;
  action: string;
  created_at: string;
  ip?: string;
  user?: User | null;
  employee?: Employee | null;
  document?: Document | null;
  meta?: Record<string, any> | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

/* ================= PAGE ================= */

export default function AuditLogs() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<AuditLog>>("/audit-logs", {
        params: {
          q: q || undefined,
          action: action || undefined,
          from: from || undefined,
          to: to || undefined,
          page: p,
        },
      });

      setRows(res.data.data);
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const actionLabel = (a: string) => {
    switch (a) {
      case "upload":
        return "Uploaded";
      case "view":
        return "Viewed";
      case "download":
        return "Downloaded";
      case "replace":
        return "Replaced File";
      case "delete":
        return "Deleted";
      case "restore":
        return "Restored";
      default:
        return a;
    }
  };

  return (
    <div className="light-detail">
      <div className="page-header">
        <div className="page-title">Audit Logs</div>
        <div className="muted">Track who accessed or modified 201 files</div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Search name, email, document..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="input"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">All actions</option>
            <option value="upload">Upload</option>
            <option value="view">View</option>
            <option value="download">Download</option>
            <option value="replace">Replace</option>
            <option value="delete">Delete</option>
            <option value="restore">Restore</option>
          </select>

          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <button className="btn" onClick={() => load(1)}>
            Apply
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card">
        <table className="records-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Employee</th>
              <th>Document</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="muted">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No audit records found.
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id}>
                <td>{dayjs(r.created_at).format("YYYY-MM-DD HH:mm")}</td>
                <td>
                  {r.user ? (
                    <>
                      <div>{r.user.name}</div>
                      <div className="muted">{r.user.email}</div>
                    </>
                  ) : (
                    <span className="muted">System</span>
                  )}
                </td>
                <td>
                  <strong>{actionLabel(r.action)}</strong>
                </td>
                <td>
                  {r.employee
                    ? `${r.employee.last_name}, ${r.employee.first_name}`
                    : "—"}
                </td>
                <td>{r.document?.title || "—"}</td>
                <td className="muted">{r.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= PAGINATION ================= */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <div className="muted">
            Page {page} of {lastPage}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-outline btn-xs"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              Prev
            </button>
            <button
              className="btn btn-outline btn-xs"
              disabled={page >= lastPage}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
