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
  "Schools Division Superintendent",
  "Assistant Schools Division Superintendent",
  "Chief Education Supervisor",
  "Public Schools District Supervisor",
  "Education Program Supervisor",
  "Senior Education Program Specialist II",
  "Education Program Specialist",
  "Project Development Officer II",
  "Project Development Officer I",
  "Administrative Officer V",
  "Administrative Officer IV",
  "Administrative Officer II",
  "Administrative Officer I",
  "Administrative Assistant III",
  "Administrative Assistant II",
  "Administrative Assistant I",
  "Administrative Aide VI",
  "Administrative Aide IV",
  "Administrative Aide III",
  "Administrative Aide I",
  "Job Order",
  "Contract of Service",
  "Engineer III",
  "Accountant III",
  "Accountant I",
  "Legal Officer III",
  "Legal Assistant",
  "Medical Officer III",
  "Dentist",
  "Nurse II",
  "Dental Aide IV",
  "School Principal V",
  "School Principal IV",
  "School Principal III",
  "School Principal II",
  "School Principal I",
  "Head Teacher V",
  "Head Teacher IV",
  "Head Teacher III",
  "Head Teacher II",
  "Head Teacher I",
  "Master Teacher III",
  "Master Teacher II",
  "Master Teacher I",
  "Teacher VI",
  "Teacher V",
  "Teacher IV",
  "Teacher III",
  "Teacher II",
  "Teacher I",
  "Substitute Teacher",
  "Librarian III",
  "Librarian II",
  "Guidance Counselor",
  "Registrar I",
] as const;

const GENDER_OPTIONS = ["Male", "Female"] as const;
const YEARS_OPTIONS = Array.from({ length: 41 }, (_, i) => i);

type NewEmployeeForm = {
  employee_no: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  place_of_birth: string;
  birthdate: string;
  date_hired: string;
  gender: string;
  position: string;
  department: string;
};

type Page<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
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

function lettersOnlyName(value: string) {
  return value
    .replace(/[^\p{L}\s-]+/gu, "")
    .replace(/ {2,}/g, " ")
    .replace(/-+/g, "-");
}

export default function Employees() {
  const [items, setItems] = useState<Employee[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });
  const getVisiblePages = () => {
    const total = meta.last_page;
    const current = page;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, -1, total];
    }

    if (current >= total - 2) {
      return [1, -1, total - 3, total - 2, total - 1, total];
    }

    return [1, -1, current - 1, current, current + 1, -1, total];
  };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewEmployeeForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterPos, setFilterPos] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [reportOpen, setReportOpen] = useState(false);
  const [yearsMin, setYearsMin] = useState<string>("");
  const [yearsMax, setYearsMax] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get<Page<Employee>>("/employees", {
        params: {
          q: q || undefined,
          department: filterDept || undefined,
          position: filterPos || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          years_min: yearsMin ? Number(yearsMin) : undefined,
          years_max: yearsMax ? Number(yearsMax) : undefined,
          page: p,
          per_page: 20,
        },
      });

      setItems((data as any).data ?? []);
      setMeta({
        current_page: Number((data as any).current_page ?? 1),
        last_page: Number((data as any).last_page ?? 1),
        total: Number((data as any).total ?? 0),
        per_page: Number((data as any).per_page ?? 20),
      });
      setPage(Number((data as any).current_page ?? 1));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);

    const onDataChanged = () => load(page);
    window.addEventListener("app:data-changed", onDataChanged);
    return () => window.removeEventListener("app:data-changed", onDataChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof NewEmployeeForm>(
    key: K,
    value: NewEmployeeForm[K],
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
      const payload = {
        ...form,
        first_name: form.first_name.trim().replace(/\s+/g, " "),
        middle_name: form.middle_name.trim().replace(/\s+/g, " "),
        last_name: form.last_name.trim().replace(/\s+/g, " "),
      };

      const { data } = await api.post("/employees", payload);

      setOpen(false);
      resetForm();

      const id = Number(data?.id);
      if (id) {
        window.location.hash = `#/employee/${id}`;
      } else {
        load(1);
      }

      window.dispatchEvent(new Event("app:data-changed"));
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

  const downloadReportPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/reports/employees/pdf", {
        params: {
          q: q || undefined,
          department: filterDept || undefined,
          position: filterPos || undefined,
          years_min: yearsMin ? Number(yearsMin) : undefined,
          years_max: yearsMax ? Number(yearsMax) : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
        responseType: "blob",
        validateStatus: (s) => s >= 200 && s < 400,
      });

      downloadBlob(
        res.data,
        `employees-report-${dayjs().format("YYYYMMDD-HHmm")}.pdf`,
      );
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to download PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  const resetReportFilters = () => {
    setFilterDept("");
    setFilterPos("");
    setYearsMin("");
    setYearsMax("");
    setDateFrom("");
    setDateTo("");
  };

  const resetTableFilters = () => {
    setFilterDept("");
    setFilterPos("");
    setDateFrom("");
    setDateTo("");
  };

  const applyTableFilters = async () => {
    setFilterOpen(false);
    await load(1);
  };

  return (
    <div className="light-dash">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
      </div>

      <div className="hero-row">
        <div
          className="tile tile-action tile-create"
          onClick={() => setOpen(true)}
        >
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
            <div className="tile-title">{meta.total}</div>
            <div className="tile-sub">
              Records <br />
              List
            </div>
          </div>
        </div>
      </div>

      <div className="records-card">
        <div className="card-head">
          <div className="card-title">RECORDS LIST</div>

          <div className="card-search" style={{ gap: 8, flexWrap: "wrap" }}>
            <div className="gear" />

            <Input
              className="thin-search"
              placeholder="Search by name / position / school…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
            />

            <Button className="go-btn" onClick={() => load(1)}>
              {loading ? "…" : "Go"}
            </Button>

            <Button
              className="btn btn-outline"
              onClick={() => setFilterOpen(true)}
            >
              Filter
            </Button>

            <Button
              className="btn btn-outline"
              onClick={() => setReportOpen(true)}
            >
              Generate Reports
            </Button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            borderTop: "1px solid #e9eff7",
            background: "#fff",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div className="muted">
            Showing page {meta.current_page} of {meta.last_page}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              className="btn btn-outline"
              onClick={() => load(page - 1)}
              disabled={page <= 1 || loading}
            >
              Prev
            </Button>

            {getVisiblePages().map((p, idx) =>
              p === -1 ? (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    minWidth: 36,
                    padding: "0 6px",
                    color: "#6b7280",
                  }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => load(p)}
                  disabled={loading}
                  style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: 10,
                    border:
                      p === page ? "1px solid #f97316" : "1px solid #dbe3f0",
                    background: p === page ? "#f97316" : "#fff",
                    color: p === page ? "#fff" : "#17325c",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    padding: "0 12px",
                  }}
                >
                  {p}
                </button>
              ),
            )}

            <Button
              className="btn btn-outline"
              onClick={() => load(page + 1)}
              disabled={page >= meta.last_page || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <OverlayModal
        open={filterOpen}
        title="Filter Records"
        onClose={() => setFilterOpen(false)}
      >
        <div className="form-grid">
          <div className="full">
            <label className="field-label">School/Office</label>
            <Select
              className="pill-input"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Schools/Offices</option>
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

          <div className="full">
            <label className="field-label">Position</label>
            <Select
              className="pill-input"
              value={filterPos}
              onChange={(e) => setFilterPos(e.target.value)}
            >
              <option value="">All Positions</option>
              {POSITION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Date of Employment (From)</label>
            <Input
              type="date"
              className="pill-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Date of Employment (To)</label>
            <Input
              type="date"
              className="pill-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="full muted" style={{ marginTop: 6 }}>
            Uses your current search text too: <strong>{q || "—"}</strong>
          </div>
        </div>

        <div className="ui-modal__footer">
          <Button className="btn btn-outline" onClick={resetTableFilters}>
            Reset
          </Button>

          <Button
            className="btn btn-outline"
            onClick={() => setFilterOpen(false)}
          >
            Close
          </Button>

          <Button className="btn btn-primary" onClick={applyTableFilters}>
            Apply
          </Button>
        </div>
      </OverlayModal>

      <OverlayModal
        open={reportOpen}
        title="Generate Employee Report"
        onClose={() => setReportOpen(false)}
      >
        <div className="form-grid">
          <div className="full">
            <label className="field-label">School/Office</label>
            <Select
              className="pill-input"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Schools/Offices</option>
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

          <div>
            <label className="field-label">Position</label>
            <Select
              className="pill-input"
              value={filterPos}
              onChange={(e) => setFilterPos(e.target.value)}
            >
              <option value="">All Positions</option>
              {POSITION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Years Employed (Min)</label>
            <Select
              className="pill-input"
              value={yearsMin}
              onChange={(e) => setYearsMin(e.target.value)}
            >
              <option value="">No Min</option>
              {YEARS_OPTIONS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Years Employed (Max)</label>
            <Select
              className="pill-input"
              value={yearsMax}
              onChange={(e) => setYearsMax(e.target.value)}
            >
              <option value="">No Max</option>
              {YEARS_OPTIONS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </div>

          <div className="full muted" style={{ marginTop: 6 }}>
            Uses your current search text too: <strong>{q || "—"}</strong>
          </div>
        </div>

        <div className="ui-modal__footer">
          <Button className="btn btn-outline" onClick={resetReportFilters}>
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

          <div>
            <label className="field-label" htmlFor="f_first">
              First Name *
            </label>
            <Input
              id="f_first"
              className="pill-input"
              value={form.first_name}
              onChange={(e) =>
                update("first_name", lettersOnlyName(e.target.value))
              }
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
              onChange={(e) =>
                update("middle_name", lettersOnlyName(e.target.value))
              }
            />
          </div>

          <div>
            <label className="field-label" htmlFor="f_last">
              Last Name *
            </label>
            <Input
              id="f_last"
              className="pill-input"
              value={form.last_name}
              onChange={(e) =>
                update("last_name", lettersOnlyName(e.target.value))
              }
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
