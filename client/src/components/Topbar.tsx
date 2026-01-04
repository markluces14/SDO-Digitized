// src/components/Topbar.tsx
import React from "react";
import { getCurrentUser, type CurrentUser } from "../lib/auth";

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

  return (
    <header className="topbar">
      {/* Brand (logos + text) */}
      <div className="brand">
        <div className="brand-logos">
          {/* These files should exist under public/logos */}
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

      {/* Role chip (uses current user's role) */}
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
    </header>
  );
}
