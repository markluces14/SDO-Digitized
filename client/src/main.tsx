// main.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import EmployeeNew from "./pages/EmployeeNew";
import Search from "./pages/Search";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ManageUsers from "./pages/ManageUsers";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AuditLogs from "./pages/AuditLogs";
import ChangePassword from "./pages/ChangePassword";
import DataPrivacyModal from "./components/DataPrivacyModal";

import { api } from "./lib/api";
import {
  isAuthed,
  getToken,
  getCurrentUser,
  setCurrentUser,
  clearToken,
  type CurrentUser,
} from "./lib/auth";

import "./theme.css";

/* ================= HASH ROUTER ================= */

function useRoute() {
  const [route, setRoute] = useState(window.location.hash || "#/login");

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || "#/login");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

/* ================= AUTH BOOTSTRAP ================= */

function useBootstrapAuth(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ⛔ Do NOT bootstrap auth on login/logout pages
    const hash = window.location.hash;
    if (
      hash.startsWith("#/login") ||
      hash.startsWith("#/logout") ||
      hash.startsWith("#/change-password")
    ) {
      setReady(true);
      return;
    }

    (async () => {
      const token = getToken();
      if (!token) {
        setReady(true);
        return;
      }

      try {
        const { data: me } = await api.get("/me");
        setCurrentUser(me);
      } catch {
        clearToken();
        window.location.hash = "#/login";
      } finally {
        setReady(true);
      }
    })();
  }, []);

  return ready;
}

/* ================= AUTHED ROUTES ================= */

function AuthedRoutes({
  route,
  me,
}: {
  route: string;
  me: CurrentUser | null;
}) {
  // Employee default landing
  useEffect(() => {
    if (me?.role === "employee" && me.employee_id) {
      if (route === "#/" || route === "" || route === "#/employees") {
        window.location.hash = "#/me";
      }
    }
  }, [route, me]);

  if (route === "#/employee/new" || route.startsWith("#/employee/new"))
    return <EmployeeNew />;

  if (route.startsWith("#/me")) return <EmployeeDashboard />;

  if (/^#\/employee\/\d+$/.test(route)) return <EmployeeDetail />;

  // 🔐 ADMIN / STAFF ONLY
  if (route.startsWith("#/audit-logs")) {
    if (me?.role !== "admin" && me?.role !== "staff") {
      return <Employees />;
    }
    return <AuditLogs />;
  }

  // 🔒 Force password change
  if (me?.must_change_password) {
    if (!route.startsWith("#/change-password")) {
      window.location.hash = "#/change-password";
      return null;
    }
  }

  if (route.startsWith("#/search")) return <Search />;
  if (route.startsWith("#/documents")) return <Documents />;
  if (route.startsWith("#/reports")) return <Reports />;
  if (route.startsWith("#/settings")) return <Settings />;
  if (route.startsWith("#/users")) return <ManageUsers />;

  return <Employees />;
}

/* ================= ROOT ROUTER ================= */

function Router() {
  const route = useRoute();
  const ready = useBootstrapAuth();

  if (!ready) return null;

  // Public routes
  if (route.startsWith("#/login")) return <Login />;
  if (route.startsWith("#/logout")) return <Logout />;
  if (route.startsWith("#/change-password")) return <ChangePassword />;

  if (!isAuthed()) {
    window.location.hash = "#/login";
    return <Login />;
  }

  const me = getCurrentUser();

  return (
    <AppShell>
      <AuthedRoutes route={route} me={me} />
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Router />);
