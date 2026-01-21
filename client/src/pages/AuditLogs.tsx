import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

/* ---------- Minimal inline Modal (uses theme.css .ui-modal__* classes) ---------- */
function OverlayModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="ui-modal__backdrop" onClick={onClose}>
      <div
        className="ui-modal__panel"
        style={{ width: 860, maxWidth: "96vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal__header">
          <div className="ui-modal__title">{title}</div>
          <button
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ================= TYPES ================= */

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "employee";
};

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
};

type Document = {
  id: number;
  title: string;
  employee?: Employee | null; // ✅ allow fallback owner via document.employee
};

type AuditLog = {
  id: number;
  action: string;
  created_at: string;
  ip?: string | null;

  user?: User | null;
  employee?: Employee | null; // ✅ owner via audit_logs.employee_id
  document?: Document | null;

  meta?: Record<string, any> | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

const ACTION_OPTIONS = [
  "",
  "upload",
  "view",
  "download",
  "replace",
  "delete",
  "restore",
  "trash",
] as const;

function actionLabel(a: string) {
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
    case "trash":
      return "Trashed";
    default:
      return a;
  }
}

function formatEmployeeName(e?: Employee | null) {
  if (!e) return "—";
  return `${e.last_name}, ${e.first_name}`;
}

export default function AuditLogs() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // quick search
  const [q, setQ] = useState("");

  // report filters (used both in table fetch + report)
  const [filterUser, setFilterUser] = useState<string>(""); // name/email
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterDocument, setFilterDocument] = useState<string>(""); // title or id
  const [dateFrom, setDateFrom] = useState<string>(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState<string>(""); // yyyy-mm-dd

  // pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const params = useMemo(
    () => ({
      q: q || undefined,
      user: filterUser || undefined,
      action: filterAction || undefined,
      document: filterDocument || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      page,
    }),
    [q, filterUser, filterAction, filterDocument, dateFrom, dateTo, page],
  );

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<AuditLog>>("/audit-logs", {
        params: { ...params, page: p },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setQ("");
    setFilterUser("");
    setFilterAction("");
    setFilterDocument("");
    setDateFrom("");
    setDateTo("");
  };

  const downloadReportPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/reports/audit/pdf", {
        params: {
          q: q || undefined,
          user: filterUser || undefined,
          action: filterAction || undefined,
          document: filterDocument || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        },
        responseType: "blob",
        validateStatus: (s) => s >= 200 && s < 400,
      });

      downloadBlob(
        res.data,
        `audit-report-${dayjs().format("YYYYMMDD-HHmm")}.pdf`,
      );
    } catch (e: any) {
      alert(
        e?.response?.data?.message || "Failed to download audit report PDF.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="light-dash">
      <div className="records-card">
        <div className="card-head">
          <div className="card-title">AUDIT LOGS</div>

          <div className="card-search" style={{ gap: 8, flexWrap: "wrap" }}>
            <Input
              className="thin-search"
              placeholder="Search… (message / user / document / action)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              style={{ minWidth: 320 }}
            />

            <Button className="go-btn" onClick={() => load(1)}>
              {loading ? "…" : "Go"}
            </Button>

            <Button
              className="btn btn-outline"
              onClick={() => setReportOpen(true)}
            >
              Generate Reports
            </Button>
          </div>
        </div>

        <table className="records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Document</th>
              <th>Document Owner</th>
              <th>Role</th>
              <th>IP Address</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="muted">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No audit records found.
                </td>
              </tr>
            )}

            {rows.map((r) => {
              // ✅ owner priority: audit_logs.employee -> document.employee -> —
              const owner = r.employee
                ? formatEmployeeName(r.employee)
                : r.document?.employee
                  ? formatEmployeeName(r.document.employee)
                  : "—";

              return (
                <tr key={r.id}>
                  <td className="muted">
                    {dayjs(r.created_at).format("YYYY-MM-DD HH:mm")}
                  </td>

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

                  <td className="muted">
                    <strong>{actionLabel(r.action)}</strong>
                  </td>

                  <td className="muted">{r.document?.title || "—"}</td>

                  <td className="muted">{owner}</td>

                  <td className="muted" style={{ textTransform: "capitalize" }}>
                    {r.user?.role || "—"}
                  </td>

                  <td className="muted">{r.ip || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* pagination */}
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

      {/* ================= REPORT MODAL ================= */}
      <OverlayModal
        open={reportOpen}
        title="Generate Audit Report"
        onClose={() => setReportOpen(false)}
      >
        <div className="form-grid">
          <div className="full">
            <label className="field-label">User (name/email)</label>
            <Input
              className="pill-input"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="e.g. Juan Dela Cruz / admin@sdo.local"
            />
          </div>

          <div>
            <label className="field-label">Action</label>
            <Select
              className="pill-input"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.filter(Boolean).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Document (title/id)</label>
            <Input
              className="pill-input"
              value={filterDocument}
              onChange={(e) => setFilterDocument(e.target.value)}
              placeholder="e.g. PDS / SALN / 12"
            />
          </div>

          <div>
            <label className="field-label">Date From</label>
            <Input
              type="date"
              className="pill-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Date To</label>
            <Input
              type="date"
              className="pill-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="ui-modal__footer">
          <Button className="btn btn-outline" onClick={resetFilters}>
            Reset
          </Button>

          <Button
            className="btn btn-outline"
            onClick={() => setReportOpen(false)}
          >
            Close
          </Button>

          <Button
            className="btn btn-primary"
            onClick={downloadReportPdf}
            disabled={downloading}
          >
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </OverlayModal>
    </div>
  );
}
