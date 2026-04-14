import { useEffect, useState } from "react";
import { api, webApi } from "../lib/api";
import { setToken, setCurrentUser } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("admin@sdo.local");
  const [password, setPassword] = useState("password");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Privacy Notice state
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await webApi.get("/privacy/status");
        setPrivacyOpen(!data.accepted);
      } catch {
        setPrivacyOpen(true);
      } finally {
        setPrivacyLoading(false);
      }
    })();
  }, []);

  const acceptPrivacy = async () => {
    setError(null);
    setPrivacyOpen(false); // hide immediately

    try {
      await webApi.get("/privacy/accept");
    } catch {
      setPrivacyOpen(true);
      setError("Unable to record privacy notice acceptance. Please try again.");
    }
  };

  const submit = async () => {
    setError(null);

    if (privacyOpen) {
      setError("Please read and accept the Data Privacy notice to continue.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/login", { email, password });
      setToken(data.token);

      const { data: me } = await api.get("/me");
      setCurrentUser(me);

      // 🔐 FORCE PASSWORD CHANGE ON FIRST LOGIN
      if (me.must_change_password) {
        window.location.hash = "#/change-password";
        return;
      }

      // normal navigation
      if (me.role === "employee" && me.employee_id) {
        window.location.hash = "#/me";
      } else {
        window.location.hash = "#/";
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
      {/* Privacy Notice Modal */}
      {!privacyLoading && privacyOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Data Privacy Notice</h2>
            <p>
              The School Division Office of Roxas is committed to protecting
              your personal information in accordance with the Data Privacy Act
              of 2012 (Republic Act No. 10173). This portal collects and
              processes only the information necessary for official School
              Division Office transactions, including the recording, storage,
              retrieval, and management of important administrative and
              institutional documents. All data are stored securely and are
              accessed only by authorized personnel. You have the right to
              access, correct, request the deletion of your personal data, as
              well as withdraw your consent where applicable. By continuing to
              use this portal, you acknowledge and agree to the terms of this
              Data Privacy Notice. For concerns, please contact us at
              sdo.testproject@gmail.com .
            </p>

            <div className="modal-actions">
              <button className="login-btn" onClick={acceptPrivacy}>
                I AGREE
              </button>
            </div>
          </div>
        </div>
      )}

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
              disabled={privacyOpen}
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
              disabled={privacyOpen}
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShow((s) => !s)}
              aria-label="Toggle password"
              title={show ? "Hide" : "Show"}
              disabled={privacyOpen}
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            className="login-btn"
            onClick={submit}
            disabled={loading || privacyOpen}
          >
            {loading ? "…" : "LOG IN"}
          </button>
        </div>
      </div>
    </div>
  );
}
