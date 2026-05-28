import axios from 'axios';
import { getAccessToken, removeAccessToken } from '@/lib/auth/tokenStorage';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { API_ENDPOINTS } from '@/config/env.config';
import { useDemoConfigStore } from '@/stores/demoConfigStore';

// Use the task API endpoint from env config
const TASK_API_BASE_URL = import.meta.env.VITE_TASK_API_BASE_URL || API_ENDPOINTS.task;

export const taskApiClient = axios.create({
  baseURL: TASK_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
taskApiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
taskApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (useDemoConfigStore.getState().isDemoSession) {
        return Promise.reject(error);
      }

      // Clear stored token
      removeAccessToken();

      // Redirect to login page
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes(AUTH_CONFIG.routes.login)
      ) {
        window.location.href = AUTH_CONFIG.routes.login;
      }
    }

    return Promise.reject(error);
  }
);

export default taskApiClient;
