import { useState } from "react";
import { api } from "../lib/api";
import { setToken, setCurrentUser } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("admin@sdo.local");
  const [password, setPassword] = useState("password");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/login", { email, password });
      setToken(data.token);

      // fetch current user and cache it
      const { data: me } = await api.get("/me");
      setCurrentUser(me);

      // redirect based on role
      if (me.role === "employee" && me.employee_id) {
        window.location.hash = "#/me"; // employee goes to EmployeeDashboard
      } else {
        window.location.hash = "#/"; // admin/staff to normal dashboard
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="auth-wrap">
      {/* Left poster */}
      <div className="auth-left">
        <div className="auth-poster">
          <div className="auth-logos">
            <img
              src="/logos/deped_logo.png"
              alt="DepEd"
              className="auth-logo-img"
            />
            <img
              src="/logos/bagong_pilipinas_logo.png"
              alt="Bagong Pilipinas"
              className="auth-logo-img"
            />
            <img
              src="/logos/sdo_seal.png"
              alt="SDO Seal"
              className="auth-logo-img"
            />
          </div>

          <div className="auth-agency">
            <div className="mini">Department of Education</div>
            <div className="agency">Schools Division of Roxas City</div>
          </div>

          <div className="auth-title">
            <div>SDO</div>
            <div>ROXAS</div>
            <div>CITY</div>
          </div>
        </div>
      </div>

      {/* Right login card */}
      <div className="auth-right">
        <div className="login-card">
          <div className="login-title">WELCOME</div>

          {error && <div className="login-error">{error}</div>}

          <div className="input-row">
            <span className="input-icon">👤</span>
            <input
              className="auth-input"
              placeholder="USERNAME"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
              autoFocus
            />
          </div>

          <div className="input-row">
            <span className="input-icon">🔒</span>
            <input
              className="auth-input"
              placeholder="PASSWORD"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShow((s) => !s)}
              aria-label="Toggle password"
              title={show ? "Hide" : "Show"}
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>

          <button className="login-btn" onClick={submit} disabled={loading}>
            {loading ? "…" : "LOG IN"}
          </button>
        </div>
      </div>
    </div>
  );
}
