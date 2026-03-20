/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension from filename or MIME type
 */
export function getFileExtension(
  fileName?: string,
  contentType?: string,
): string {
  // Try to get from filename first
  if (fileName) {
    const match = fileName.match(/\.(\w+)$/);
    if (match) return `.${match[1].toLowerCase()}`;
  }

  // Fallback to MIME type mapping
  if (contentType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        ".pptx",
    };
    return mimeMap[contentType] || "";
  }

  return "";
}

// Translate status to Vietnamese
export function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    Active: "Hoạt động",
    Archived: "Đã lưu trữ",
    Muted: "Đã tắt thông báo",
  };
  return statusMap[status] || status;
}

// Format status line
export function formatStatusLine(
  status: string,
  memberCount: number,
  onlineCount?: number,
  isDirect?: boolean,
): string {
  const parts: string[] = [];
  parts.push(translateStatus(status));

  if (!isDirect && memberCount > 0) {
    parts.push(`${memberCount} thành viên`);
  }

  if (onlineCount !== undefined && onlineCount > 0) {
    parts.push(`${onlineCount} đang online`);
  }

  return parts.join(" • ");
}

// Format time for message
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
