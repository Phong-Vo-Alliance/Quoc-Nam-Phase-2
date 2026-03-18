import type { LucideIcon } from "lucide-react";
import { FileText, Sheet, Presentation, File, FileVideo } from "lucide-react";

/**
 * File type categories for icon mapping
 */
export type FileIconType =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "video"
  | "generic";

/**
 * File icon configuration
 */
export interface FileIconConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

/**
 * MIME type to file type mapping
 */
const MIME_TYPE_MAP: Record<string, FileIconType> = {
  // PDF
  "application/pdf": "pdf",

  // Microsoft Word
  "application/msword": "word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "word",

  // Microsoft Excel
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",

  // Microsoft PowerPoint
  "application/vnd.ms-powerpoint": "powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "powerpoint",

  // Video
  "video/mp4": "video",
  "video/webm": "video",
  "video/ogg": "video",
};

/**
 * File icon configurations
 */
export const FILE_ICON_MAP: Record<FileIconType, FileIconConfig> = {
  pdf: {
    icon: FileText,
    color: "text-red-500",
    label: "PDF",
  },
  word: {
    icon: FileText,
    color: "text-blue-500",
    label: "Word",
  },
  excel: {
    icon: Sheet,
    color: "text-green-500",
    label: "Excel",
  },
  powerpoint: {
    icon: Presentation,
    color: "text-orange-500",
    label: "PowerPoint",
  },
  video: {
    icon: FileVideo,
    color: "text-purple-500",
    label: "Video",
  },
  generic: {
    icon: File,
    color: "text-gray-500",
    label: "File",
  },
};

/**
 * Get file icon type from MIME type
 */
export function getFileIconType(contentType: string): FileIconType {
  if (!contentType) {
    return "generic";
  }

  const normalized = contentType.toLowerCase().trim();
  return MIME_TYPE_MAP[normalized] || "generic";
}

/**
 * Get file icon configuration
 */
export function getFileIconConfig(contentType: string): FileIconConfig {
  const type = getFileIconType(contentType);
  return FILE_ICON_MAP[type];
}
