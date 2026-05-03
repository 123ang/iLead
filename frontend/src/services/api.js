import axios from "axios";
import { useAuthStore } from "../store/auth.store.js";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4016/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

/** No Bearer interceptor — avoids infinite loops on `/auth/refresh` */
const bare = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config || {};
    const url = String(original.url || "");
    const isRefresh = url.includes("/auth/refresh");

    if (err.response?.status === 401 && !original.skipAuthRetry) {
      original.skipAuthRetry = true;

      if (isRefresh) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        throw err;
      }

      try {
        const { data } = await bare.post("/auth/refresh");
        useAuthStore.getState().setSession(data);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (_) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        throw err;
      }
    }

    throw err;
  },
);
