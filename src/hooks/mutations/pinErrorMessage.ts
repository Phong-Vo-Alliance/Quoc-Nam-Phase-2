// Error-message helper scoped to the pin/unpin flows (messages + conversations).
// Pin failures should surface the server's own message when present; this is
// intentionally local to pin and not a shared app-wide util.

import axios from "axios";

/**
 * Pull the failure message for a pin/unpin action, preferring the server's own
 * message (axios response body: `message` / `detail` / `title`). For an axios
 * error without one we use `fallback` rather than the technical `error.message`
 * ("Request failed with status code 400").
 */
export function getPinErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; detail?: string; title?: string }
      | undefined;
    return data?.message || data?.detail || data?.title || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
