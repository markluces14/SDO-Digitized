import { useState } from "react";
import { api } from "../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { clearToken, setCurrentUser } from "../lib/auth";

export default function ChangePassword() {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    setOk(null);

    if (!p1 || p1.length < 8) {
      return setErr("Password must be at least 8 characters.");
    }

    if (p1 !== p2) {
      return setErr("Passwords do not match.");
    }

    setSaving(true);
    try {
      await api.post("/me/password", {
        password: p1,
        password_confirmation: p2,
      });

      const { data: me } = await api.get("/me");
      setCurrentUser(me);

      setOk("Password updated. Redirecting…");
      window.location.hash = "#/";
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="light-detail"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 540 }}>
        <div className="page-title" style={{ marginBottom: 18 }}>
          Change Password
        </div>

        <div className="card">
          <div className="muted" style={{ marginBottom: 10 }}>
            For security, you must change your temporary password before
            continuing.
          </div>

          {err && (
            <div style={{ marginBottom: 10, color: "#7d1b1b" }}>{err}</div>
          )}
          {ok && <div style={{ marginBottom: 10, color: "#1b7d3a" }}>{ok}</div>}

          <div className="form-grid">
            <div className="full">
              <label className="field-label">New Password</label>
              <Input
                type="password"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
              />
            </div>

            <div className="full">
              <label className="field-label">Confirm Password</label>
              <Input
                type="password"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Password"}
            </Button>

            <Button
              className="btn btn-outline"
              onClick={() => {
                clearToken();
                window.location.hash = "#/login";
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
