/**
 * Error classification utilities for Phase 6
 * Classify errors and generate user-friendly Vietnamese messages
 */

import axios from "axios";

export type ErrorType =
  | "NETWORK_OFFLINE"
  | "NETWORK_TIMEOUT"
  | "SERVER_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "UNKNOWN";

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  isRetryable: boolean;
  statusCode?: number;
}

/**
 * Extract a human-readable message returned by the API, if any.
 * Supports common shapes: { message }, { error }, { detail }, { title },
 * ASP.NET PascalCase { Message }, or a raw string body.
 */
function getServerErrorMessage(error: {
  response?: { data?: unknown };
}): string | undefined {
  const data = error?.response?.data;
  if (!data) return undefined;

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidate = record.message;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
}

/**
 * Extract the API error message, including responses whose body is a Blob.
 *
 * Endpoints that use `responseType: "blob"` (file download/stream/preview)
 * deliver their JSON error body as a Blob, so `error.response.data.message`
 * is undefined. This reads the blob, parses the JSON, and returns its message
 * (e.g. { "message": "...", "reason": "FileFromRecalledMessage" }).
 *
 * @returns the API message if present, otherwise undefined
 */
export async function getApiErrorMessage(
  error: unknown,
): Promise<string | undefined> {
  if (!axios.isAxiosError(error)) return undefined;

  const data = error.response?.data;

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      const text = (await data.text()).trim();
      if (!text) return undefined;
      try {
        const parsed = JSON.parse(text) as unknown;
        return getServerErrorMessage({ response: { data: parsed } });
      } catch {
        // Not JSON — fall back to the raw text body if it is short enough
        return text.length <= 500 ? text : undefined;
      }
    } catch {
      return undefined;
    }
  }

  return getServerErrorMessage({ response: { data } });
}

/**
 * Classify axios error or general error
 * @param error - Error object from API call
 * @returns Classified error with user-friendly message
 */
export function classifyError(error: unknown): ClassifiedError {
  // Check for AbortError (timeout from AbortController)
  if (error instanceof Error && error.name === "AbortError") {
    return {
      type: "NETWORK_TIMEOUT",
      message: "Đã xảy ra lỗi vui lòng thử lại",
      isRetryable: false, // Timeout already exceeded, don't retry automatically
    };
  }

  // Client-side validation errors (check FIRST before navigator.onLine)
  if (error instanceof Error) {
    // if (error.message === "FILE_TOO_LARGE") {
    //   return {
    //     type: "FILE_TOO_LARGE",
    //     message: "File quá lớn. Vui lòng chọn file nhỏ hơn 20MB.",
    //     isRetryable: false,
    //   };
    // }

    if (error.message === "UNSUPPORTED_FILE_TYPE") {
      return {
        type: "UNSUPPORTED_FILE_TYPE",
        message: "Định dạng file không được hỗ trợ",
        isRetryable: false,
      };
    }
  }

  // Check network offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      type: "NETWORK_OFFLINE",
      message: "Không có kết nối mạng. Vui lòng kiểm tra kết nối.",
      isRetryable: true,
    };
  }

  // Check axios error
  if (axios.isAxiosError(error)) {
    // Network error (no response)
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return {
          type: "NETWORK_TIMEOUT",
          message: "Kết nối quá lâu. Vui lòng thử lại.",
          isRetryable: true,
        };
      }

      if (error.code === "ERR_NETWORK") {
        return {
          type: "NETWORK_OFFLINE",
          message: "Không thể kết nối đến máy chủ.",
          isRetryable: true,
        };
      }

      return {
        type: "NETWORK_OFFLINE",
        message: "Không thể kết nối đến máy chủ.",
        isRetryable: true,
      };
    }

    // HTTP status errors
    const status = error.response.status;
    // Prefer the message returned by the API when present, falling back to a
    // friendly Vietnamese default per status code.
    const serverMessage = getServerErrorMessage(error);

    if (status === 401) {
      return {
        type: "UNAUTHORIZED",
        message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        isRetryable: false,
        statusCode: status,
      };
    }

    if (status === 403) {
      return {
        type: "BAD_REQUEST",
        message: serverMessage ?? "Bạn không có quyền thực hiện thao tác này.",
        isRetryable: false,
        statusCode: status,
      };
    }

    if (status === 404) {
      return {
        type: "BAD_REQUEST",
        message:
          serverMessage ?? "Cuộc trò chuyện không tồn tại hoặc đã bị xóa.",
        isRetryable: false,
        statusCode: status,
      };
    }

    if (status === 400) {
      return {
        type: "BAD_REQUEST",
        message: serverMessage ?? "Đã xảy ra lỗi. Vui lòng thử lại",
        isRetryable: false,
        statusCode: status,
      };
    }

    if (status === 413) {
      return {
        type: "FILE_TOO_LARGE",
        message:
          serverMessage ?? "File quá lớn. Vui lòng chọn file nhỏ hơn 20MB.",
        isRetryable: false,
        statusCode: status,
      };
    }

    if (status === 415) {
      return {
        type: "UNSUPPORTED_FILE_TYPE",
        message: serverMessage ?? "Định dạng file không được hỗ trợ",
        isRetryable: false,
        statusCode: status,
      };
    }

    if (status >= 500) {
      return {
        type: "SERVER_ERROR",
        message: serverMessage ?? "Lỗi máy chủ. Vui lòng thử lại sau.",
        isRetryable: true,
        statusCode: status,
      };
    }
  }

  // Unknown error (fallback)
  return {
    type: "UNKNOWN",
    message: "Đã xảy ra lỗi. Vui lòng thử lại.",
    isRetryable: true,
  };
}

/**
 * Check if error is retryable
 * @param error - Error object
 * @returns true if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.isRetryable;
}
