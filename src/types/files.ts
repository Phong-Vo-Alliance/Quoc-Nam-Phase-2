// File related types

import type { ID, Timestamps } from "./common";
import type { User } from "./auth";
import { FILE_UPLOAD_LIMITS, FILE_ALLOWED_TYPES } from "@/config/env.config";

export interface FileAttachment extends Timestamps {
  id: ID;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedById: ID;
  uploadedBy?: User;
  type: FileType;
}

export type FileType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "pdf"
  | "archive"
  | "other";

// Phase 3.2: Supported file types for preview modal
export type SupportedPreviewFileType =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "text"
  | "video"
  | "image";

export const SUPPORTED_FILE_EXTENSIONS: Record<
  SupportedPreviewFileType,
  readonly string[]
> = {
  pdf: [".pdf"],
  word: [".doc", ".docx"],
  excel: [".xls", ".xlsx"],
  powerpoint: [".ppt", ".pptx"],
  text: [".txt", ".rtf"],
  video: [".mp4", ".webm", ".ogg", ".mov"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"],
} as const;

export const FILE_TYPE_ICONS: Record<SupportedPreviewFileType, string> = {
  pdf: "📄",
  word: "📝",
  excel: "📊",
  powerpoint: "📽️",
  text: "📃",
  video: "🎬",
  image: "🖼️",
};

export const FILE_TYPE_LABELS: Record<SupportedPreviewFileType, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  text: "Text",
  video: "Video",
  image: "Ảnh",
};

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface FileFolder {
  id: ID;
  name: string;
  parentId?: ID;
  groupId: ID;
  fileCount: number;
  assignFrom: ID;
  createdAt: string;
}

// API Request/Response types
export interface UploadFileRequest {
  file: File;
  groupId?: ID;
  folderId?: ID;
  messageId?: ID;
  taskId?: ID;
}

export interface UploadFileResponse {
  file: FileAttachment;
  url: string;
}

export interface FilesQueryParams {
  groupId?: ID;
  folderId?: ID;
  type?: FileType;
  search?: string;
  page?: number;
  pageSize?: number;
}

// File preview
export interface FilePreviewData {
  file: FileAttachment;
  previewUrl: string;
  canPreview: boolean;
  downloadUrl: string;
}

// Phase 1: File Upload UI (client-side only)
export interface SelectedFile {
  file: File;
  id: string; // Unique ID for React key
  preview?: string; // For image preview (optional)
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationRules {
  maxSize: number; // Max file size in bytes
  maxFiles: number; // Max number of files
  allowedTypes: string[]; // MIME types allowed
}

/**
 * Maximum number of files that can be attached to a single message
 * Applies to both images and other file types combined
 * API limit: 10 files, 100MB total
 */
export const MAX_FILES_PER_MESSAGE = FILE_UPLOAD_LIMITS.maxFilesPerMessage;

/**
 * Get max file size based on MIME type
 * Image: VITE_MAX_IMAGE_SIZE_MB (default 10MB)
 * Video: VITE_MAX_VIDEO_SIZE_MB (default 20MB)
 * Other: VITE_MAX_FILE_SIZE_MB (default 10MB)
 */
export function getMaxSizeForFile(file: File): number {
  if (file.type.startsWith("image/")) return FILE_UPLOAD_LIMITS.maxImageSize;
  if (file.type.startsWith("video/")) return FILE_UPLOAD_LIMITS.maxVideoSize;
  return FILE_UPLOAD_LIMITS.maxFileSize;
}

// Default validation rules for client-side validation
export const DEFAULT_FILE_RULES: FileValidationRules = {
  maxSize: FILE_UPLOAD_LIMITS.maxFileSize,
  maxFiles: MAX_FILES_PER_MESSAGE,
  allowedTypes: FILE_ALLOWED_TYPES.all,
};

// File type categories (configurable via env)
export const FILE_CATEGORIES = {
  DOCUMENT: FILE_ALLOWED_TYPES.document,
  SPREADSHEET: FILE_ALLOWED_TYPES.spreadsheet,
  IMAGE: FILE_ALLOWED_TYPES.image,
  VIDEO: FILE_ALLOWED_TYPES.video,
};

// Phase 2: API Integration types

/**
 * Upload file result from Vega File API
 * Response from POST /api/Files endpoint
 */
export interface UploadFileResult {
  /** Unique file ID from server */
  fileId: string;
  /** Storage path where file is saved */
  storagePath: string;
  /** Original filename */
  fileName: string;
  /** MIME type */
  contentType: string;
  /** File size in bytes */
  size: number;
}

/**
 * Phase 2: Batch upload result from Vega File API
 * Response from POST /api/Files/batch endpoint
 */
export interface BatchUploadResult {
  /** Total number of files in the batch */
  totalFiles: number;
  /** Number of successfully uploaded files */
  successCount: number;
  /** Number of failed uploads */
  failedCount: number;
  /** Individual results for each file */
  results: BatchUploadItemResult[];
  /** True if all files succeeded */
  allSuccess: boolean;
  /** True if some (but not all) files succeeded */
  partialSuccess: boolean;
}

/**
 * Phase 2: Individual file result in batch upload
 */
export interface BatchUploadItemResult {
  /** Index of file in the batch (0-based) */
  index: number;
  /** Whether this file uploaded successfully */
  success: boolean;
  /** Server-assigned file ID (only if success) */
  fileId?: string;
  /** Original filename */
  fileName: string | null;
  /** MIME type */
  contentType: string | null;
  /** File size in bytes (only if success) */
  size?: number;
  /** Storage path (only if success) */
  storagePath: string | null;
  /** Error message (only if failed) */
  error: string | null;
}

/**
 * Upload progress state for each file
 * Used to track upload progress in UI
 */
export interface FileUploadProgressState {
  /** SelectedFile.id */
  fileId: string;
  /** File name */
  fileName: string;
  /** Upload status */
  status: "pending" | "uploading" | "success" | "error";
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if failed */
  error?: string;
  /** Server-returned fileId if success */
  uploadedFileId?: string;
}

// ============================================================
// View All Files – shared types
// ============================================================

export interface AttachmentDto {
  fileId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailUrl?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  attachments?: AttachmentDto[];
}

export interface ExtractedFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  senderId: string;
  senderName: string;
  messageId: string;
  dimensions?: { width: number; height: number };
  duration?: number;
}

export interface FileFilters {
  images: boolean;
  videos: boolean;
  pdf: boolean;
  word: boolean;
  excel: boolean;
  powerpoint: boolean;
  other: boolean;
}

export type FileSortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "size-desc"
  | "size-asc";

export type ViewFileType = "media" | "docs";

export interface ViewFilesState {
  // State
  isModalOpen: boolean;
  currentGroupId: string | null;
  currentWorkTypeId: string | null;
  allFiles: ExtractedFile[];
  filteredFiles: ExtractedFile[];
  displayedFiles: ExtractedFile[];
  filters: FileFilters;
  sortBy: FileSortOption;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  totalFiles: number;
  previewFile: ExtractedFile | null;
  previewPosition: number | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  openModal: (
    files: ExtractedFile[],
    groupId: string,
    workTypeId?: string,
  ) => void;
  closeModal: () => void;
  setFilters: (filters: Partial<FileFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sortBy: FileSortOption) => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setPreviewFile: (file: ExtractedFile | null, position?: number) => void;
  nextPreview: () => void;
  prevPreview: () => void;
  clearPreview: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  updateFiles: (files: ExtractedFile[]) => void;
  updateFilesFromMessages: (
    messages: MessageDto[],
    groupId: string,
    workTypeId?: string,
  ) => void;
  reset: () => void;
}

// ============================================================
// Component prop types
// ============================================================

export interface FileCardProps {
  file: ExtractedFile;
  onPreview?: (file: ExtractedFile, position: number) => void;
  position: number;
}

export interface FileListItemProps {
  file: ExtractedFile;
  onPreview?: (file: ExtractedFile, position: number) => void;
  position: number;
}

export interface FileGridProps {
  files: ExtractedFile[];
  onPreviewFile?: (file: ExtractedFile, position: number) => void;
}

export interface FileListProps {
  files: ExtractedFile[];
  onPreviewFile?: (file: ExtractedFile, position: number) => void;
}

export interface FileFiltersProps {
  onFilterChange?: (filters: FileFilters) => void;
  showCounts?: boolean;
}

export interface FilePaginationProps {
  onPageChange?: (page: number) => void;
}

export interface FileSortDropdownProps {
  onSortChange?: (sort: FileSortOption) => void;
  fileType?: ViewFileType;
}

export interface FileSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}
