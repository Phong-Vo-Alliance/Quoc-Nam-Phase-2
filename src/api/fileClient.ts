import axios from "axios";

/**
 * Dedicated API client for Vega File API
 * Separate from main apiClient because File API has different baseURL
 */

// Get File API URL based on environment
const getFileApiUrl = (): string => {
  const mode = import.meta.env.MODE;

  if (mode === "production") {
    return import.meta.env.VITE_PROD_FILE_API_URL;
  }

  return import.meta.env.VITE_DEV_FILE_API_URL;
};

/**
 * Axios instance for File API
 * Configured with File API specific baseURL and timeout
 */
export const fileApiClient = axios.create({
  baseURL: getFileApiUrl(),
  timeout: 60000, // 60s for file uploads (longer than default)
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

/**
 * Request interceptor - Add auth token
 */
fileApiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or auth store
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Add cache-busting headers to prevent browser HTTP cache
    // This ensures fresh image data when files are updated on server
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";

    // ✅ For GET requests (images/previews/watermark), add timestamp to force fresh request
    if (
      config.method?.toLowerCase() === "get" &&
      (config.url?.includes("/preview") ||
        config.url?.includes("/watermarked-thumbnail"))
    ) {
      const separator = config.url.includes("?") ? "&" : "?";
      config.url += `${separator}t=${Date.now()}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor - Handle errors
 */
fileApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;

      // Add user-friendly error messages
      switch (status) {
        case 401:
          error.message = "Unauthorized - Please login again";
          break;
        case 400:
          error.message = data?.detail || "Invalid request";
          break;
        case 413:
          error.message = "File too large";
          break;
        case 415:
          error.message = "File type not supported";
          break;
        case 500:
          error.message = "Server error - Please try again";
          break;
      }
    } else if (error.request) {
      error.message = "Network error - Please check your connection";
    }

    return Promise.reject(error);
  },
);

export default fileApiClient;
