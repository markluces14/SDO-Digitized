// src/components/Sidebar.tsx
import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/auth";

function useHash() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <a href={href} className={`nav-link ${active ? "active" : ""}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export default function Sidebar() {
  const hash = useHash();
  const me = getCurrentUser();

  const isActive = (prefix: string) =>
    hash === prefix || hash.startsWith(prefix + "/");

  const role = (me?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isEmployee = role === "employee" && !!me?.employee_id;

  const mustChangePassword = !!(me as any)?.must_change_password;

  // 🔐 Password change lock
  if (mustChangePassword) {
    return (
      <aside className="sidebar">
        <div className="logo">SDO eFiles</div>

        <div className="sidebar-section">Account</div>
        <nav style={{ display: "grid", gap: 6 }}>
          <NavLink
            href="#/change-password"
            icon={<span>🔒</span>}
            label="Change Password"
            active={isActive("#/change-password")}
          />
        </nav>

        <div className="sidebar-footer">
          <a href="#/logout" className="nav-link">
            … Log Out …
          </a>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="logo">SDO eFiles</div>

      {/* ================= PAGES ================= */}
      <div className="sidebar-section">Pages</div>
      <nav style={{ display: "grid", gap: 6 }}>
        {(isAdmin || isStaff) && (
          <>
            <NavLink
              href="#/"
              icon={<span>🏠</span>}
              label="Dashboard"
              active={hash === "#/" || hash === ""}
            />

            <NavLink
              href="#/audit-logs"
              icon={<span>📝</span>}
              label="Audit Logs"
              active={isActive("#/audit-logs")}
            />
          </>
        )}

        {isEmployee && (
          <>
            <NavLink
              href="#/me"
              icon={<span>🏠</span>}
              label="Dashboard"
              active={isActive("#/me")}
            />

            <NavLink
              href={`#/employee/${me!.employee_id}`}
              icon={<span>📁</span>}
              label="My File"
              active={isActive(`#/employee/${me!.employee_id}`)}
            />
          </>
        )}
      </nav>

      {/* ================= ACCOUNT PAGES ================= */}
      <div className="sidebar-section">Account Pages</div>
      <nav style={{ display: "grid", gap: 6 }}>
        {isAdmin && (
          <NavLink
            href="#/users"
            icon={<span>👤</span>}
            label="Manage Users"
            active={isActive("#/users")}
          />
        )}

        {/* ✅ SETTINGS FOR ALL ROLES */}
        <NavLink
          href="#/settings"
          icon={<span>⚙️</span>}
          label="Settings"
          active={isActive("#/settings")}
        />
      </nav>

      <div className="sidebar-footer">
        <a href="#/logout" className="nav-link">
          … Log Out …
        </a>
      </div>
    </aside>
  );
}
