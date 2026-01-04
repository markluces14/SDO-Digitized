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

  return (
    <aside className="sidebar">
      <div className="logo">SDO eFiles</div>

      <div className="sidebar-section">Pages</div>
      <nav style={{ display: "grid", gap: 6 }}>
        {(isAdmin || isStaff) && (
          <>
            <NavLink
              href="#/"
              icon={
                <span role="img" aria-label="dashboard">
                  🏠
                </span>
              }
              label="Dashboard"
              active={isActive("#/") || hash === ""}
            />
            <NavLink
              href="#/audit"
              icon={
                <span role="img" aria-label="audit">
                  📝
                </span>
              }
              label="Audit Logs"
              active={isActive("#/audit")}
            />
          </>
        )}

        {isEmployee && (
          <NavLink
            href={`#/employee/${me!.employee_id}`}
            icon={
              <span role="img" aria-label="file">
                📁
              </span>
            }
            label="My File"
            active={isActive(`#/employee/${me!.employee_id}`)}
          />
        )}
      </nav>

      {/* Account pages: ADMIN ONLY */}
      {isAdmin && (
        <>
          <div className="sidebar-section">Account Pages</div>
          <nav style={{ display: "grid", gap: 6 }}>
            <NavLink
              href="#/users"
              icon={
                <span role="img" aria-label="users">
                  👤
                </span>
              }
              label="Manage Users"
              active={isActive("#/users")}
            />
          </nav>
        </>
      )}

      <div className="sidebar-footer">
        <a href="#/logout" className="nav-link">
          … Log Out …
        </a>
      </div>
    </aside>
  );
}
