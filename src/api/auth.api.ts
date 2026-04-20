/**
 * Auth API Client
 *
 * API functions for authentication
 */

import axios, { type AxiosError } from "axios";
import { AUTH_CONFIG } from "@/lib/auth/config";
import type {
  DeviceFingerprint,
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

// Local fingerprint agent (desktop helper) exposes device info for login.
const FINGERPRINT_URL =
  import.meta.env.VITE_FINGERPRINT_URL || "http://localhost:52100/fingerprint";

/**
 * Fetch device fingerprint from the local agent.
 * Returns null if the agent is unreachable so login can still proceed.
 */
export async function getDeviceFingerprint(): Promise<DeviceFingerprint | null> {
  try {
    const response = await axios.get<DeviceFingerprint>(FINGERPRINT_URL, {
      timeout: 5000,
    });
    return response.data ?? null;
  } catch (error) {
    console.warn("Failed to fetch device fingerprint:", error);
    return null;
  }
}

/**
 * Login API call
 *
 * @param credentials - User credentials (identifier + password)
 * @returns LoginResponse on success
 * @throws Error with errorCode on failure
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const deviceFingerprint = await getDeviceFingerprint();

    const response = await identityClient.post<LoginResponse>("/auth/login", {
      ...credentials,
      clientIp: credentials.clientIp ?? "",
      clientPlatform: credentials.clientPlatform ?? "Web",
      clientType: credentials.clientType ?? 1,
      platformResolutionSource: credentials.platformResolutionSource ?? 1,
      deviceFingerprint: credentials.deviceFingerprint ?? deviceFingerprint,
    });
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
