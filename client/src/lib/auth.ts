const KEY = "sdo_token";
const USER_KEY = "sdo_user";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "employee";
  is_active: boolean;
  employee_id?: number | null;
};

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}
export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}
export function clearToken() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthed(): boolean {
  return !!getToken();
}

export function setCurrentUser(u: CurrentUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}
export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}
