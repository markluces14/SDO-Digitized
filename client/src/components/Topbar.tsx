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
    // only fetch if logged in
    if (!me) return;
    loadNotifs();
    const t = setInterval(loadNotifs, 60_000); // every 1 minute
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
    // ✅ employee dashboard route in your app
    window.location.hash = "#/me";
    setNotifOpen(false);
  };

  return (
    <header className="topbar">
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

      {/* Right side: 🔔 + Role chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* ✅ Notification bell */}
        {me && (
          <div ref={boxRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                // refresh when opening
                if (!notifOpen) loadNotifs();
              }}
              title="Notifications"
              className="btn btn-outline"
              style={{
                position: "relative",
                borderRadius: 999,
                padding: "8px 10px",
                lineHeight: 1,
              }}
            >
              🔔
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    background: "#e11d48",
                    color: "#fff",
                    fontSize: 12,
                    display: "grid",
                    placeItems: "center",
                    padding: "0 6px",
                  }}
                >
                  {unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: 360,
                  background: "#fff",
                  border: "1px solid #e9eff7",
                  borderRadius: 12,
                  boxShadow: "0 12px 30px rgba(0,0,0,.12)",
                  overflow: "hidden",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e9eff7",
                  }}
                >
                  <strong>Notifications</strong>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={markAll}
                  >
                    Mark all read
                  </button>
                </div>

                <div style={{ maxHeight: 360, overflow: "auto" }}>
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
                        style={{
                          padding: 12,
                          cursor: "pointer",
                          borderBottom: "1px solid #e5e7eb",
                          background: n.read_at ? "#ffffff" : "#f0f7ff",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0f172a", // dark slate
                          }}
                        >
                          {n.title}
                        </div>

                        {n.message && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: "#334155", // readable gray
                            }}
                          >
                            {n.message}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
