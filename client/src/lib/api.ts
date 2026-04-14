import axios from "axios";
import { clearToken, getToken } from "./auth";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
});

export const webApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = String(err?.config?.url || "");

    console.log("API ERROR", status, url, err?.response?.data);

    const shouldLogout =
      (status === 401 || status === 419) &&
      (url.includes("/me") || url.includes("/logout"));

    if (shouldLogout) {
      clearToken();
      window.location.hash = "#/login";
    }

    return Promise.reject(err);
  }
);