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
  const initialRoute = window.location.hash || (isAuthed() ? "#/" : "#/login");
  const [route, setRoute] = useState(initialRoute);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = isAuthed() ? "#/" : "#/login";
    }

    const onChange = () =>
      setRoute(window.location.hash || (isAuthed() ? "#/" : "#/login"));

    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

/* ================= AUTH BOOTSTRAP ================= */

function useBootstrapAuth(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.startsWith("#/logout")) {
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
      } catch (e: any) {
        const status = e?.response?.status;

        console.log("BOOTSTRAP /me failed:", status, e?.response?.data);

        if (status === 401 || status === 419) {
          clearToken();
          window.location.hash = "#/login";
        }
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
  useEffect(() => {
    if (me?.role === "employee" && me.employee_id) {
      if (route === "#/" || route === "" || route === "#/employees") {
        window.location.hash = "#/me";
      }
    }
  }, [route, me]);

  if (me?.must_change_password) {
    if (!route.startsWith("#/change-password")) {
      window.location.hash = "#/change-password";
      return null;
    }
  }

  if (route === "#/employee/new" || route.startsWith("#/employee/new")) {
    return <EmployeeNew />;
  }

  if (route.startsWith("#/me")) return <EmployeeDashboard />;

  if (/^#\/employee\/\d+$/.test(route)) return <EmployeeDetail />;

  if (route.startsWith("#/audit-logs")) {
    if (me?.role !== "admin" && me?.role !== "staff") {
      return <Employees />;
    }
    return <AuditLogs />;
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

  const authed = isAuthed();
  const me = getCurrentUser();

  if (route.startsWith("#/logout")) return <Logout />;

  if (route.startsWith("#/login")) {
    if (authed) {
      if (me?.must_change_password) {
        window.location.hash = "#/change-password";
        return null;
      }

      if (me?.role === "employee" && me.employee_id) {
        window.location.hash = "#/me";
      } else {
        window.location.hash = "#/";
      }
      return null;
    }

    return <Login />;
  }

  if (route.startsWith("#/change-password")) {
    if (!authed) {
      window.location.hash = "#/login";
      return <Login />;
    }

    return <ChangePassword />;
  }

  if (!authed) {
    window.location.hash = "#/login";
    return <Login />;
  }

  return (
    <AppShell>
      <AuthedRoutes route={route} me={me} />
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Router />);
