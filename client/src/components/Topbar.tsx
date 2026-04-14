// src/components/Topbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { getCurrentUser, type CurrentUser } from "../lib/auth";

type Notif = {
  id: number;
  type: string;
  title: string;
  message?: string | null;
  data?: any;
  read_at?: string | null;
  created_at?: string;
};

function roleLabel(user: CurrentUser | null): string {
  const r = (user?.role || "").toLowerCase();
  if (r === "admin") return "ADMIN";
  if (r === "staff") return "STAFF";
  if (r === "employee") return "EMPLOYEE";
  return "GUEST";
}

export default function Topbar() {
  const me = getCurrentUser();
  const label = roleLabel(me);

  // ✅ theme
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDarkMode(isDark);
    document.body.classList.toggle("theme-dark", isDark);
  }, []);

  const toggleTheme = () => {
    setDarkMode((v) => {
      const next = !v;
      document.body.classList.toggle("theme-dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // ✅ notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const loadNotifs = async () => {
    try {
      const { data } = await api.get("/notifications");
      setUnread(Number(data?.unread ?? 0));
      setItems((data?.data ?? []) as Notif[]);
    } catch {
      // ignore if not authed, etc.
    }
  };

  useEffect(() => {
    if (!me) return;
    loadNotifs();
    const t = setInterval(loadNotifs, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!notifOpen) return;
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  const markRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      await loadNotifs();
    } catch {}
  };

  const markAll = async () => {
    try {
      await api.post(`/notifications/read-all`);
      await loadNotifs();
    } catch {}
  };

  const goToMyFile = () => {
    window.location.hash = "#/me";
    setNotifOpen(false);
  };

  return (
    <header
      className="topbar"
      style={{
        top: 0,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Brand (logos + text) */}
      <div className="brand">
        <div className="brand-logos">
          <img
            src="/logos/deped_logo.png"
            alt="DepEd"
            className="brand-logo"
            width={40}
            height={40}
          />
          <img
            src="/logos/bagong_pilipinas_logo.png"
            alt="Bagong Pilipinas"
            className="brand-logo"
            width={40}
            height={40}
          />
          <img
            src="/logos/sdo_seal.png"
            alt="SDO Seal"
            className="brand-logo"
            width={40}
            height={40}
          />
        </div>
        <div className="brand-text">
          <div className="dept">Department of Education</div>
          <div className="division">Schools Division of Roxas City</div>
        </div>
      </div>

      {/* Right side: 🔔 + 🌙 + Role chip */}
      <div className="topbar-actions">
        {/* ✅ Notification bell */}
        {me && (
          <div ref={boxRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen) loadNotifs();
              }}
              title="Notifications"
              className="icon-btn"
              style={{ position: "relative" }}
            >
              🔔
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-head">
                  <strong>Notifications</strong>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={markAll}
                  >
                    Mark all read
                  </button>
                </div>

                <div className="notif-body">
                  {items.length === 0 ? (
                    <div className="muted" style={{ padding: 12 }}>
                      No notifications.
                    </div>
                  ) : (
                    items.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read_at) markRead(n.id);
                          goToMyFile();
                        }}
                        className={`notif-item ${n.read_at ? "" : "unread"}`}
                      >
                        <div className="notif-title">{n.title}</div>
                        {n.message && (
                          <div className="notif-msg">{n.message}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ Dark mode toggle button (right beside bell) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="icon-btn"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Role chip */}
        <div
          className="admin-chip"
          title={me ? `${me.name} • ${label}` : "Not signed in"}
        >
          <div className="avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4z" />
            </svg>
          </div>
          <span className="admin-label">{label}</span>
        </div>
      </div>
    </header>
  );
}
