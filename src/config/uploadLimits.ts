/**
 * Upload limits resolver
 *
 * Source priority: /api/config/me (uploadLimits) > env (VITE_MAX_*_MB) > defaults.
 * API values are in MB; outputs are in bytes (except file count).
 */

import { useMemo } from "react";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { FILE_UPLOAD_LIMITS as ENV_UPLOAD_LIMITS } from "@/config/env.config";
import type { AppUploadLimitsConfig } from "@/types/identity";

const MB = 1024 * 1024;

export interface ResolvedUploadLimits {
  /** Max number of files per message */
  maxFilesPerMessage: number;
  /** Max non-media file size (bytes) */
  maxFileSize: number;
  /** Max image file size (bytes) */
  maxImageSize: number;
  /** Max video file size (bytes) */
  maxVideoSize: number;
  /** Max combined batch size (bytes) */
  maxTotalSize: number;
}

const toBytes = (mb: number | undefined): number | undefined =>
  typeof mb === "number" && Number.isFinite(mb) && mb > 0 ? mb * MB : undefined;

const toCount = (value: number | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;

export function resolveUploadLimits(
  apiLimits?: AppUploadLimitsConfig | null,
): ResolvedUploadLimits {
  return {
    maxFilesPerMessage:
      toCount(apiLimits?.maxFilesPerUpload) ??
      ENV_UPLOAD_LIMITS.maxFilesPerMessage,
    maxFileSize:
      toBytes(apiLimits?.maxFileSizeMB) ?? ENV_UPLOAD_LIMITS.maxFileSize,
    maxImageSize:
      toBytes(apiLimits?.maxImageSizeMB) ?? ENV_UPLOAD_LIMITS.maxImageSize,
    maxVideoSize:
      toBytes(apiLimits?.maxVideoSizeMB) ?? ENV_UPLOAD_LIMITS.maxVideoSize,
    maxTotalSize:
      toBytes(apiLimits?.maxTotalUploadSizeMB) ??
      ENV_UPLOAD_LIMITS.maxTotalSize,
  };
}

/** Non-React getter — reads current store snapshot. */
export function getUploadLimits(): ResolvedUploadLimits {
  return resolveUploadLimits(useAppConfigStore.getState().data?.uploadLimits);
}

/** React hook — re-renders when API config changes. */
export function useUploadLimits(): ResolvedUploadLimits {
  const apiLimits = useAppConfigStore((s) => s.data?.uploadLimits);
  return useMemo(() => resolveUploadLimits(apiLimits), [apiLimits]);
}
