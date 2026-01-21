import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";
import { getCurrentUser } from "../lib/auth";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

/* ---------- Minimal inline Modal (uses theme.css .ui-modal__* classes) ---------- */
function OverlayModal({
  open,
  title,
  onClose,
  children,
  width = 860,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="ui-modal__backdrop" onClick={onClose}>
      <div
        className="ui-modal__panel"
        style={{ width, maxWidth: "96vw" }}
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

/* ---------- types ---------- */
type FeedbackRow = {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  subject?: string | null;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: number | null;
  ip?: string | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

/* ---------- helpers ---------- */
function roleLabel(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "ADMIN";
  if (r === "staff") return "STAFF";
  if (r === "employee") return "EMPLOYEE";
  return (role || "—").toUpperCase();
}

export default function Settings() {
  const me = getCurrentUser();
  const role = (me?.role || "").toLowerCase();
  const isAdminOrStaff = role === "admin" || role === "staff";

  /* =========================
     CHANGE PASSWORD (simple)
     ========================= */
  const goChangePassword = () => {
    window.location.hash = "#/change-password";
  };

  /* =========================
     EMPLOYEE FEEDBACK FORM
     ========================= */
  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbOk, setFbOk] = useState<string | null>(null);
  const [fbErr, setFbErr] = useState<string | null>(null);

  const submitFeedback = async () => {
    setFbOk(null);
    setFbErr(null);

    if (!fbMessage.trim() || fbMessage.trim().length < 5) {
      setFbErr("Message must be at least 5 characters.");
      return;
    }

    setFbSending(true);
    try {
      await api.post("/feedback", {
        subject: fbSubject.trim() || null,
        message: fbMessage.trim(),
      });
      setFbSubject("");
      setFbMessage("");
      setFbOk("Thank you! Your feedback has been submitted.");
    } catch (e: any) {
      setFbErr(e?.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setFbSending(false);
    }
  };

  /* =========================
     ADMIN/STAFF FEEDBACK INBOX
     ========================= */
  const [openInbox, setOpenInbox] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "open" | "resolved">("open");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // data + pagination
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const canLoadInbox = useMemo(() => isAdminOrStaff, [isAdminOrStaff]);

  const loadInbox = async (p = 1) => {
    if (!canLoadInbox) return;
    setLoading(true);
    try {
      const res = await api.get<Paginated<FeedbackRow>>("/feedback", {
        params: {
          q: q || undefined,
          status: status || undefined,
          from: from || undefined,
          to: to || undefined,
          page: p,
          per_page: 20,
        },
      });
      setRows(res.data.data);
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  const setRowStatus = async (id: number, next: "open" | "resolved") => {
    try {
      await api.patch(`/feedback/${id}/status`, { status: next });
      await loadInbox(page);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to update status.");
    }
  };

  useEffect(() => {
    if (openInbox) loadInbox(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openInbox]);

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="light-detail">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="muted">Manage your account and support options</div>
      </div>

      {/* ===== Account card ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Account</h3>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div className="muted">
            Signed in as <strong>{me?.name || "—"}</strong> (
            {roleLabel(me?.role)})
          </div>

          <Button className="btn btn-primary" onClick={goChangePassword}>
            Change Password
          </Button>

          {isAdminOrStaff && (
            <Button
              className="btn btn-outline"
              onClick={() => setOpenInbox(true)}
            >
              View Feedback Inbox
            </Button>
          )}
        </div>
      </div>

      {/* ===== Employee feedback card ===== */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Feedback</h3>
        <div className="muted" style={{ marginBottom: 12 }}>
          Report a bug, request a feature, or tell us how we can improve the
          system.
        </div>

        {fbOk && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              border: "1px solid #cfe8d6",
              background: "#f2fbf5",
              color: "#1d5b2b",
              borderRadius: 10,
            }}
          >
            {fbOk}
          </div>
        )}

        {fbErr && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              border: "1px solid #f1caca",
              background: "#fff4f4",
              color: "#7d1b1b",
              borderRadius: 10,
            }}
          >
            {fbErr}
          </div>
        )}

        <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
          <div>
            <label className="field-label">Subject</label>
            <Input
              className="pill-input"
              placeholder="e.g. Can't open PDF"
              value={fbSubject}
              onChange={(e) => setFbSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Message *</label>
            <textarea
              className="input"
              placeholder="Describe the issue or suggestion…"
              value={fbMessage}
              onChange={(e) => setFbMessage(e.target.value)}
              rows={5}
              style={{ width: "100%", resize: "vertical", borderRadius: 14 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button
              className="btn btn-outline"
              onClick={() => {
                setFbSubject("");
                setFbMessage("");
                setFbOk(null);
                setFbErr(null);
              }}
              disabled={fbSending}
            >
              Reset
            </Button>

            <Button
              className="btn btn-primary"
              onClick={submitFeedback}
              disabled={fbSending}
            >
              {fbSending ? "Submitting…" : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Admin/Staff Inbox Modal ===== */}
      <OverlayModal
        open={openInbox}
        title="Feedback Inbox"
        onClose={() => setOpenInbox(false)}
        width={980}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <Input
            className="pill-input"
            placeholder="Search name / email / subject / message…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 320 }}
          />

          <Select
            className="pill-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            style={{ minWidth: 160 }}
            title="Status"
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="">All</option>
          </Select>

          <Input
            type="date"
            className="pill-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            title="From"
          />

          <Input
            type="date"
            className="pill-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            title="To"
          />

          <Button className="go-btn" onClick={() => loadInbox(1)}>
            {loading ? "…" : "Go"}
          </Button>

          <Button
            className="btn btn-outline"
            onClick={() => {
              setQ("");
              setStatus("open");
              setFrom("");
              setTo("");
              setTimeout(() => loadInbox(1), 0);
            }}
          >
            Reset
          </Button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="records-table">
            <thead>
              <tr>
                <th style={{ width: 170 }}>Date</th>
                <th>User</th>
                <th style={{ width: 110 }}>Role</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 180 }}>Subject</th>
                <th>Message</th>
                <th style={{ width: 130 }}>IP</th>
                <th style={{ width: 170 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="muted">
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No feedback found.
                  </td>
                </tr>
              )}

              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted">
                    {dayjs(r.created_at).format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td>
                    <div>{r.user_name || "—"}</div>
                    <div className="muted">{r.user_email || "—"}</div>
                  </td>
                  <td className="muted">{roleLabel(r.user_role)}</td>
                  <td className="muted" style={{ textTransform: "capitalize" }}>
                    {r.status}
                  </td>
                  <td className="muted">{r.subject || "—"}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{r.message}</td>
                  <td className="muted">{r.ip || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {r.status === "open" ? (
                        <Button
                          className="btn btn-primary btn-xs"
                          onClick={() => setRowStatus(r.id, "resolved")}
                        >
                          Resolve
                        </Button>
                      ) : (
                        <Button
                          className="btn btn-outline btn-xs"
                          onClick={() => setRowStatus(r.id, "open")}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
            }}
          >
            <div className="muted">
              Page {page} of {lastPage}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                className="btn btn-outline btn-xs"
                disabled={page <= 1 || loading}
                onClick={() => loadInbox(page - 1)}
              >
                Prev
              </Button>
              <Button
                className="btn btn-outline btn-xs"
                disabled={page >= lastPage || loading}
                onClick={() => loadInbox(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <div className="ui-modal__footer">
          <Button
            className="btn btn-outline"
            onClick={() => setOpenInbox(false)}
          >
            Close
          </Button>
        </div>
      </OverlayModal>
    </div>
  );
}
