import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import type { Employee } from "../types";
import { SCHOOL_GROUPED } from "../data/schools";

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

/* ---------- Helpers ---------- */
const POSITION_OPTIONS = [
  "Teacher",
  "Principal",
  "Professor I",
  "Professor II",
  "Professor III",
  "Professor IV",
] as const;

const GENDER_OPTIONS = ["Male", "Female"] as const;

type NewEmployeeForm = {
  employee_no: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  place_of_birth: string;
  birthdate: string; // yyyy-mm-dd
  date_hired: string; // yyyy-mm-dd (Employment Date)
  gender: string;
  position: string;
  department: string; // School / Office
};

const emptyForm: NewEmployeeForm = {
  employee_no: "",
  email: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  place_of_birth: "",
  birthdate: "",
  date_hired: "",
  gender: "",
  position: "",
  department: "",
};

export default function Employees() {
  const [items, setItems] = useState<Employee[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // modal + form state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewEmployeeForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees", { params: { q } });
      setItems((data?.data ?? data) as Employee[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof NewEmployeeForm>(
    key: K,
    value: NewEmployeeForm[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm({ ...emptyForm });
    setErr(null);
  };

  const validate = () => {
    if (!form.employee_no.trim()) return "Employee # is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim()) return "Last name is required.";
    if (!form.place_of_birth.trim()) return "Place of Birth is required.";
    if (!form.birthdate) return "Birthdate is required.";
    if (!form.date_hired) return "Employment date is required.";
    if (!form.gender) return "Gender is required.";
    if (!form.position) return "Position is required.";
    if (!form.department) return "School is required.";
    return null;
  };

  const save = async () => {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload = { ...form };
      const { data } = await api.post("/employees", payload);
      setOpen(false);
      resetForm();
      const id = Number(data?.id);
      if (id) {
        window.location.hash = `#/employee/${id}`;
      } else {
        load();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to create employee.";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="light-dash">
      {/* Page header */}
      <div className="page-header">
        <div className="page-title">Dashboard</div>
      </div>

      {/* Hero tiles */}
      <div className="hero-row">
        <div className="tile tile-action" onClick={() => setOpen(true)}>
          <div className="tile-icon">
            <span className="plus">＋</span>
          </div>
          <div>
            <div className="tile-title">Create New Record</div>
            <div className="tile-sub">Add a new personnel record</div>
          </div>
        </div>

        <div className="tile tile-count" style={{ cursor: "default" }}>
          <div className="tile-icon doc" />
          <div>
            <div className="tile-title">{items.length}</div>
            <div className="tile-sub">Records List</div>
          </div>
        </div>
      </div>

      {/* Records card */}
      <div className="records-card">
        <div className="card-head">
          <div className="card-title">RECORDS LIST</div>
          <div className="card-search">
            <div className="gear" />
            <Input
              className="thin-search"
              placeholder="Search by name / position / school…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <Button className="go-btn" onClick={load}>
              {loading ? "…" : "Go"}
            </Button>
          </div>
        </div>

        <table className="records-table">
          <thead>
            <tr>
              <th>
                <span className="th-ico user" /> Name
              </th>
              <th>Position</th>
              <th>
                <span className="th-ico school" /> School/Office
              </th>
              <th>
                <span className="th-ico calendar" /> Date of First Employment
              </th>
              <th>
                <span className="th-ico clip" /> File
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => {
              const hiredSrc =
                (e as any).date_hired ||
                (e as any).employment_date ||
                (e as any).hired_at;

              const hired = hiredSrc
                ? dayjs(hiredSrc).format("MMMM DD, YYYY")
                : "—";
              const full = `${(e.last_name || "").trim()}, ${(
                e.first_name || ""
              )
                .trim()
                .replace(/\s+/g, " ")}`.toLowerCase();
              return (
                <tr key={e.id}>
                  <td style={{ textTransform: "capitalize" }}>{full}</td>
                  <td className="muted">{e.position ?? "—"}</td>
                  <td className="muted">{e.department ?? "—"}</td>
                  <td className="muted">{hired}</td>
                  <td>
                    <a href={`#/employee/${e.id}`}>View File</a>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <OverlayModal
        open={open}
        title="Create New Record"
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
      >
        {err && (
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
            {err}
          </div>
        )}

        <div className="form-grid">
          {/* row 1 */}
          <div>
            <label className="field-label" htmlFor="f_empno">
              Employee # *
            </label>
            <Input
              id="f_empno"
              className="pill-input"
              value={form.employee_no}
              onChange={(e) => update("employee_no", e.target.value)}
              placeholder=""
            />
          </div>
          <div>
            <label className="field-label" htmlFor="f_email">
              Email *
            </label>
            <Input
              id="f_email"
              type="email"
              className="pill-input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder=""
            />
          </div>

          {/* row 2 */}
          <div>
            <label className="field-label" htmlFor="f_first">
              First Name *
            </label>
            <Input
              id="f_first"
              className="pill-input"
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="f_middle">
              Middle Name (optional)
            </label>
            <Input
              id="f_middle"
              className="pill-input"
              value={form.middle_name}
              onChange={(e) => update("middle_name", e.target.value)}
            />
          </div>

          {/* row 3 */}
          <div>
            <label className="field-label" htmlFor="f_last">
              Last Name *
            </label>
            <Input
              id="f_last"
              className="pill-input"
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="f_pob">
              Place of Birth *
            </label>
            <Input
              id="f_pob"
              className="pill-input"
              value={form.place_of_birth}
              onChange={(e) => update("place_of_birth", e.target.value)}
            />
          </div>

          {/* row 4 */}
          <div>
            <label className="field-label" htmlFor="f_birthdate">
              Birthdate *
            </label>
            <Input
              id="f_birthdate"
              type="date"
              className="pill-input"
              value={form.birthdate}
              onChange={(e) => update("birthdate", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="f_hired">
              Employment Date *
            </label>
            <Input
              id="f_hired"
              type="date"
              className="pill-input"
              value={form.date_hired}
              onChange={(e) => update("date_hired", e.target.value)}
            />
          </div>

          {/* row 5 */}
          <div>
            <label className="field-label" htmlFor="f_gender">
              Gender *
            </label>
            <Select
              id="f_gender"
              className="pill-input"
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
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
            <label className="field-label" htmlFor="f_position">
              Position *
            </label>
            <Select
              id="f_position"
              className="pill-input"
              value={form.position}
              onChange={(e) => update("position", e.target.value)}
            >
              <option value="">— Select —</option>
              {POSITION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          {/* row 6 (School dropdown with grouped options) */}
          <div className="full">
            <label className="field-label" htmlFor="f_school">
              School *
            </label>
            <Select
              id="f_school"
              className="pill-input"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
            >
              <option value="">— Select School —</option>
              {Object.entries(SCHOOL_GROUPED).map(([label, list]) => (
                <optgroup key={label} label={label}>
                  {list.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
        </div>

        <div className="ui-modal__footer">
          <Button
            className="btn btn-outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </OverlayModal>
    </div>
  );
}
