/**
 * Auth API Client
 *
 * API functions for authentication
 */

import axios, { type AxiosError } from "axios";
import { AUTH_CONFIG } from "@/lib/auth/config";
import type {
  LoginRequest,
  LoginResponse,
  LoginErrorResponse,
} from "@/types/auth";

export interface ExchangeWebSessionRequest {
  token: string;
}

// Create dedicated axios instance for identity API
const identityClient = axios.create({
  baseURL: AUTH_CONFIG.identityApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Login API call
 *
 * @param credentials - User credentials (identifier + password)
 * @returns LoginResponse on success
 * @throws Error with errorCode on failure
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await identityClient.post<LoginResponse>(
      "/auth/login",
      credentials,
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<LoginErrorResponse>;

    // Handle API error response
    if (axiosError.response?.data) {
      const apiError = axiosError.response.data;
      const err = new Error(apiError.message);
      (err as Error & { errorCode: string }).errorCode =
        apiError.errorCode || "UNKNOWN_ERROR";
      throw err;
    }

    // Handle network errors
    if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
      const err = new Error("Network error");
      (err as Error & { errorCode: string }).errorCode = "NETWORK_ERROR";
      throw err;
    }

    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Exchange one-time SSO token from desktop app into normal web JWT session.
 *
 * POST /api/auth/exchange-web-session
 */
export async function exchangeWebSession(
  payload: ExchangeWebSessionRequest,
): Promise<LoginResponse> {
  try {
    const response = await identityClient.post<LoginResponse>(
      "/api/auth/exchange-web-session",
      payload,
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<LoginErrorResponse>;

    if (axiosError.response?.data) {
      const apiError = axiosError.response.data;
      const err = new Error(apiError.message || "Invalid web session token");
      (err as Error & { errorCode: string }).errorCode =
        apiError.errorCode || "INVALID_WEB_SESSION";
      throw err;
    }

    if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
      const err = new Error("Network error");
      (err as Error & { errorCode: string }).errorCode = "NETWORK_ERROR";
      throw err;
    }

    throw error;
  }
}

export type { LoginRequest, LoginResponse };
