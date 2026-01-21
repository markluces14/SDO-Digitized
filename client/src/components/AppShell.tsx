import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import DataPrivacyModal from "./DataPrivacyModal";
import { getCurrentUser } from "../lib/auth";

function useHash() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const onUnload = () => {
      sessionStorage.removeItem("sdo_token");
      sessionStorage.removeItem("sdo_user");
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  return hash;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hash = useHash();
  const me = getCurrentUser();

  // Hide layout on auth pages
  const isAuthRoute =
    hash === "#/login" ||
    hash.startsWith("#/login") ||
    hash === "#/logout" ||
    hash.startsWith("#/logout");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  const isChangePasswordRoute =
    hash === "#/change-password" || hash.startsWith("#/change-password");

  return (
    <div className="app">
      <Sidebar />
      <Topbar />

      {/* ✅ Show Privacy Modal on all authed pages (but NOT on Change Password) */}
      {!isChangePasswordRoute && !me?.must_change_password && (
        <DataPrivacyModal />
      )}

      <main className="main">{children}</main>
    </div>
  );
}
