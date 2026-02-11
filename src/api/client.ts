import axios from "axios";
import { getAccessToken, removeAccessToken } from "@/lib/auth/tokenStorage";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { API_ENDPOINTS } from "@/config/env.config";

// Use the chat API endpoint from env config
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_ENDPOINTS.chat;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Add cache-busting headers for sensitive endpoints to ensure fresh data
    if (
      config.url?.includes("/Files/") ||
      config.url?.includes("/preview") ||
      config.url?.includes("/watermarked-thumbnail")
    ) {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear stored token
      removeAccessToken();

      // Redirect to login page
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes(AUTH_CONFIG.routes.login)
      ) {
        window.location.href = AUTH_CONFIG.routes.login;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
