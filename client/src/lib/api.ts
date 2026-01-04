import axios from "axios";
import { clearToken } from "./auth";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// if your token is in localStorage, attach it
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sdo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const s = err?.response?.status;
    if (s === 401 || s === 419) {
      clearToken();
      window.location.hash = "#/login";
    }
    return Promise.reject(err);
  }
);
