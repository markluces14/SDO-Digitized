import { useState } from "react";
import { api } from "../lib/api";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const POSITIONS = [
  "Teacher",
  "Principal",
  "Professor I",
  "Professor II",
  "Professor III",
  "Professor IV",
] as const;

const GENDERS = ["Male", "Female"] as const;

export default function EmployeeNew() {
  const [form, setForm] = useState({
    employee_no: "",
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    place_of_birth: "",
    date_hired: "",
    gender: "",
    position: "",
    department: "", // School
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setError(null);
    const missing: string[] = [];
    if (!form.employee_no) missing.push("Employee #");
    if (!form.email) missing.push("Email");
    if (!form.first_name) missing.push("First Name");
    if (!form.last_name) missing.push("Last Name");
    if (!form.place_of_birth) missing.push("Place of Birth");
    if (!form.date_hired) missing.push("Employment Date");
    if (!form.gender) missing.push("Gender");
    if (!form.position) missing.push("Position");
    if (!form.department) missing.push("School");
    if (missing.length) {
      setError(`Missing required: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/employees", form);
      const id = Number(data?.id);
      window.location.hash = id ? `#/employee/${id}` : "#/";
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="light-detail">
      <div className="page-header">
        <div className="page-title">Create New Record</div>
      </div>

      <div className="card">
        {error && (
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
            {error}
          </div>
        )}

        <div className="form-grid">
          {/* Employee # */}
          <div>
            <label className="field-label" htmlFor="employee_no">
              Employee # *
            </label>
            <Input
              id="employee_no"
              className="pill-input"
              value={form.employee_no}
              onChange={update("employee_no")}
            />
          </div>

          {/* Email */}
          <div>
            <label className="field-label" htmlFor="email">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              className="pill-input"
              value={form.email}
              onChange={update("email")}
            />
          </div>

          {/* First / Middle */}
          <div>
            <label className="field-label" htmlFor="first_name">
              First Name *
            </label>
            <Input
              id="first_name"
              className="pill-input"
              value={form.first_name}
              onChange={update("first_name")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="middle_name">
              Middle Name (optional)
            </label>
            <Input
              id="middle_name"
              className="pill-input"
              value={form.middle_name}
              onChange={update("middle_name")}
            />
          </div>

          {/* Last / Place of Birth */}
          <div>
            <label className="field-label" htmlFor="last_name">
              Last Name *
            </label>
            <Input
              id="last_name"
              className="pill-input"
              value={form.last_name}
              onChange={update("last_name")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="place_of_birth">
              Place of Birth *
            </label>
            <Input
              id="place_of_birth"
              className="pill-input"
              value={form.place_of_birth}
              onChange={update("place_of_birth")}
            />
          </div>

          {/* Employment Date / Gender */}
          <div>
            <label className="field-label" htmlFor="date_hired">
              Employment Date *
            </label>
            <Input
              id="date_hired"
              type="date"
              className="pill-input"
              value={form.date_hired}
              onChange={update("date_hired")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="gender">
              Gender *
            </label>
            <Select
              id="gender"
              className="pill-input"
              value={form.gender}
              onChange={update("gender")}
            >
              <option value="">— Select —</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>

          {/* Position / School */}
          <div>
            <label className="field-label" htmlFor="position">
              Position *
            </label>
            <Select
              id="position"
              className="pill-input"
              value={form.position}
              onChange={update("position")}
            >
              <option value="">— Select —</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="field-label" htmlFor="department">
              School *
            </label>
            <Input
              id="department"
              className="pill-input"
              value={form.department}
              onChange={update("department")}
            />
          </div>

          {/* Actions */}
          <div
            className="full"
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <Button
              className="btn btn-outline"
              onClick={() => (window.location.hash = "#/")}
            >
              Cancel
            </Button>
            <Button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
