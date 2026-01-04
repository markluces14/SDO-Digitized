import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function useHash() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hash = useHash();

  // Hide chrome on auth pages
  const isAuthRoute =
    hash === "#/login" ||
    hash.startsWith("#/login") ||
    hash === "#/logout" ||
    hash.startsWith("#/logout");

  if (isAuthRoute) {
    // Render the page as-is (your Login already handles its own layout)
    return <>{children}</>;
  }

  return (
    <div className="app">
      <Sidebar />
      <Topbar />
      <main className="main">{children}</main>
    </div>
  );
}
