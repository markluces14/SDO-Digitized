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

function useRoute() {
  const [route, setRoute] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/** ✅ ALWAYS check /me on boot if there’s a token */
function useBootstrapAuth(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const { data: me } = await api.get("/me");
        setCurrentUser(me); // refresh cache every load
      } catch {
        // token invalid/expired — clear and send to login
        clearToken();
        window.location.hash = "#/login";
      } finally {
        setReady(true);
      }
    })();
  }, []);

  return ready;
}

function AuthedRoutes({
  route,
  me,
}: {
  route: string;
  me: CurrentUser | null;
}) {
  // employee landing
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
  if (route.startsWith("#/search")) return <Search />;
  if (route.startsWith("#/documents")) return <Documents />;
  if (route.startsWith("#/reports")) return <Reports />;
  if (route.startsWith("#/settings")) return <Settings />;
  if (route.startsWith("#/users")) return <ManageUsers />;

  return <Employees />;
}

function Router() {
  const route = useRoute();
  const ready = useBootstrapAuth(); // ⬅ we gate rendering on this

  // Public pages (no shell)
  if (route.startsWith("#/login")) return <Login />;
  if (route.startsWith("#/logout")) return <Logout />;

  if (!ready) return null; // or a small spinner while checking /me

  // Require a token after the check above
  if (!isAuthed()) {
    window.location.hash = "#/login";
    return null;
  }

  const me = getCurrentUser();
  return (
    <AppShell>
      <AuthedRoutes route={route} me={me} />
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Router />);
