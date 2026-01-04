import { useEffect } from "react";
import { api } from "../lib/api";
import { clearToken, isAuthed } from "../lib/auth";

export default function Logout() {
  useEffect(() => {
    (async () => {
      try {
        if (isAuthed()) await api.post("/logout");
      } catch {}
      clearToken();
      window.location.hash = "#/login";
    })();
  }, []);
  return null;
}
