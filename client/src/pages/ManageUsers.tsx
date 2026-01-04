import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "employee"; // fixed typo
  is_active: boolean;
  created_at?: string;
};

type Page<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "employee", label: "Employee" },
] as const;

const ROLES_FILTER = [
  { v: "", label: "— Any role —" },
  ...ROLE_OPTIONS.map((r) => ({ v: r.value, label: r.label })),
];

function roleLabel(value?: string) {
  const v = (value || "").toLowerCase();
  return ROLE_OPTIONS.find((r) => r.value === v)?.label ?? "";
}

export default function ManageUsers() {
  const [items, setItems] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "staff" as User["role"],
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [showPwd, setShowPwd] = useState(false);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get<Page<User>>("/users", {
        params: { q, role, page: p },
      });
      setItems((data as any).data ?? (data as any));
      setMeta({
        current_page: Number((data as any).current_page ?? 1),
        last_page: Number((data as any).last_page ?? 1),
        total: Number((data as any).total ?? (data as any).data?.length ?? 0),
      });
      setPage(Number((data as any).current_page ?? 1));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const openCreate = () => {
    setEdit(null);
    setForm({ name: "", email: "", role: "staff", password: "" });
    setFormErr(null);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEdit(u);
    // normalize role in case backend sends different casing
    const normalizedRole = (u.role || "staff").toLowerCase() as User["role"];
    setForm({
      name: u.name,
      email: u.email,
      role: normalizedRole,
      password: "",
    });
    setFormErr(null);
    setShowForm(true);
  };

  const save = async () => {
    setFormErr(null);
    setSaving(true);
    try {
      // Always send lowercase role values
      const payload = {
        name: form.name,
        email: form.email,
        role: (form.role || "staff").toLowerCase(),
      };

      if (edit) {
        await api.put(`/users/${edit.id}`, payload);
      } else {
        if (!form.password) {
          setFormErr("Password is required for new user.");
          setSaving(false);
          return;
        }
        await api.post("/users", { ...payload, password: form.password });
      }
      setShowForm(false);
      await load(page);
    } catch (e: any) {
      setFormErr(e?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const openResetPwd = (u: User) => {
    setPwdUser(u);
    setPwd1("");
    setPwd2("");
    setPwdErr(null);
    setShowPwd(true);
  };

  const doResetPwd = async () => {
    if (!pwdUser) return;
    if (!pwd1 || pwd1 !== pwd2) {
      setPwdErr("Passwords do not match.");
      return;
    }
    setPwdSaving(true);
    try {
      await api.patch(`/users/${pwdUser.id}/password`, {
        password: pwd1,
        password_confirmation: pwd2,
      });
      setShowPwd(false);
    } catch (e: any) {
      setPwdErr(e?.response?.data?.message || "Reset failed.");
    } finally {
      setPwdSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    await api.patch(`/users/${u.id}/toggle`);
    await load(page);
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete ${u.name}?`)) return;
    await api.delete(`/users/${u.id}`);
    await load(page);
  };

  const next = () => page < meta.last_page && load(page + 1);
  const prev = () => page > 1 && load(page - 1);

  return (
    <div className="light-dash">
      <div className="page-header">
        <div className="page-title">Manage Users</div>
        <div className="hero-actions">
          <Button className="btn btn-primary" onClick={openCreate}>
            + New User
          </Button>
        </div>
      </div>

      <div className="records-card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">FILTERS</div>
          <div className="card-search" style={{ gap: 8, flexWrap: "wrap" }}>
            <Input
              className="thin-search"
              placeholder="Search name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
            />
            <Select
              className="thin-search"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                load(1);
              }}
            >
              {ROLES_FILTER.map((r) => (
                <option key={r.v} value={r.v}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Button className="go-btn" onClick={() => load(1)}>
              {loading ? "…" : "Go"}
            </Button>
          </div>
        </div>

        <table className="records-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 320 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td>{roleLabel(u.role)}</td>
                <td>{u.is_active ? "Active" : "Disabled"}</td>
                <td>
                  <div
                    className="actions"
                    style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                  >
                    <Button
                      className="btn btn-outline btn-xs"
                      onClick={() => openEdit(u)}
                    >
                      Edit
                    </Button>
                    <Button
                      className="btn btn-outline btn-xs"
                      onClick={() => openResetPwd(u)}
                    >
                      Reset Password
                    </Button>
                    <Button
                      className="btn btn-outline btn-xs"
                      onClick={() => toggleActive(u)}
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      className="btn btn-danger btn-xs"
                      onClick={() => remove(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            borderTop: "1px solid #e9eff7",
            background: "#fff",
          }}
        >
          <div className="muted">Total: {meta.total}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              className="btn btn-outline"
              onClick={prev}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <div
              className="muted"
              style={{ display: "grid", placeItems: "center" }}
            >
              Page {page} / {meta.last_page}
            </div>
            <Button
              className="btn btn-outline"
              onClick={next}
              disabled={page >= meta.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="ui-modal__backdrop" onClick={() => setShowForm(false)}>
          <div
            className="ui-modal__panel"
            style={{ width: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal__header">
              <div className="ui-modal__title">
                {edit ? "Edit User" : "New User"}
              </div>
              <button
                className="ui-modal__close"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <div className="ui-modal__body">
              {formErr && (
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
                  {formErr}
                </div>
              )}
              <div className="form-grid">
                <div>
                  <label className="field-label">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Email *</label>
                  <Input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="field-label">Role *</label>
                  <Select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value.toLowerCase() as User["role"],
                      })
                    }
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </div>
                {!edit && (
                  <div>
                    <label className="field-label">Password *</label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="ui-modal__footer">
              <Button
                className="btn btn-outline"
                onClick={() => setShowForm(false)}
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
      )}

      {/* Reset password modal */}
      {showPwd && (
        <div className="ui-modal__backdrop" onClick={() => setShowPwd(false)}>
          <div
            className="ui-modal__panel"
            style={{ width: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal__header">
              <div className="ui-modal__title">Reset Password</div>
              <button
                className="ui-modal__close"
                onClick={() => setShowPwd(false)}
              >
                ✕
              </button>
            </div>
            <div className="ui-modal__body">
              {pwdErr && (
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
                  {pwdErr}
                </div>
              )}
              <div className="form-grid">
                <div>
                  <label className="field-label">New Password *</label>
                  <Input
                    type="password"
                    value={pwd1}
                    onChange={(e) => setPwd1(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Confirm Password *</label>
                  <Input
                    type="password"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="ui-modal__footer">
              <Button
                className="btn btn-outline"
                onClick={() => setShowPwd(false)}
              >
                Cancel
              </Button>
              <Button
                className="btn btn-primary"
                onClick={doResetPwd}
                disabled={pwdSaving}
              >
                {pwdSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
