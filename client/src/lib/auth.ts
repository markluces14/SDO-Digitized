const KEY = "sdo_token";
const USER_KEY = "sdo_user";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "employee";
  is_active: boolean;
  employee_id?: number | null;
  must_change_password?: boolean;
};

export function getToken(): string | null {
  return sessionStorage.getItem(KEY);
}

export function setToken(t: string) {
  sessionStorage.setItem(KEY, t);
}

export function clearToken() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(USER_KEY);
console.trace("clearToken called");
}

export function isAuthed(): boolean {
  return !!getToken();
}

export function setCurrentUser(u: CurrentUser) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(u));
}

export function getCurrentUser(): CurrentUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}