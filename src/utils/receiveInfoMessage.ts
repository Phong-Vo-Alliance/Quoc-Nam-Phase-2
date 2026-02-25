/**
 * Utility functions for building "Receive Info" system message content
 *
 * Feature: CHAT-026 - Receive Info System Message
 * When a Leader "receives/accepts" information from a message,
 * a system message is sent to notify all group members.
 *
 * Format: "[Nội dung] đã được tiếp nhận bởi [tên] lúc [hh:mm]"
 */

import type { Message, FileAttachment } from "@/features/portal/types";
import type { ChatMessage, AttachmentDto } from "@/types/messages";

// Constants based on HUMAN decisions
const MAX_TEXT_LENGTH = 60;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

/**
 * Unified attachment interface that works with both FileAttachment and AttachmentDto
 */
interface UnifiedAttachment {
  name: string;
}

/**
 * Normalize attachment to unified format
 * - FileAttachment (portal types): has `name`
 * - AttachmentDto (API types): has `fileName`
 */
function normalizeAttachment(
  attachment: FileAttachment | AttachmentDto,
): UnifiedAttachment {
  // Check if it's AttachmentDto (has fileName property)
  if ("fileName" in attachment) {
    return { name: attachment.fileName || "Tập tin" };
  }
  // It's FileAttachment (has name property)
  return { name: attachment.name || "Tập tin" };
}

/**
 * Check if a file attachment is an image based on file extension
 */
export function isImageAttachment(
  file: FileAttachment | AttachmentDto | UnifiedAttachment,
): boolean {
  const fileName =
    ("fileName" in file ? file.fileName : "name" in file ? file.name : "") ||
    "";
  return IMAGE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
}

/**
 * Classify attachments into images and files
 */
export function classifyAttachments(
  files: (FileAttachment | AttachmentDto | UnifiedAttachment)[],
): {
  images: (FileAttachment | AttachmentDto | UnifiedAttachment)[];
  documents: (FileAttachment | AttachmentDto | UnifiedAttachment)[];
  isAllImages: boolean;
  isAllDocuments: boolean;
  isMixed: boolean;
} {
  const images = files.filter(isImageAttachment);
  const documents = files.filter((f) => !isImageAttachment(f));

  return {
    images,
    documents,
    isAllImages: images.length === files.length && images.length > 0,
    isAllDocuments: documents.length === files.length && documents.length > 0,
    isMixed: images.length > 0 && documents.length > 0,
  };
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncateText(
  text: string,
  maxLength: number = MAX_TEXT_LENGTH,
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Format time to HH:mm (24h format)
 */
export function formatTime24h(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get the content description for a message based on its type and attachments
 *
 * Decision rules (based on HUMAN approval):
 * 1. If message has text content → use text (priority over attachments)
 * 2. If message has only attachments:
 *    - Single file/image → use file name
 *    - Multiple files → "fileName và [n-1] tài liệu khác"
 *    - Multiple images → "imageName và [n-1] ảnh khác"
 *    - Mixed → "fileName và [n-1] tài liệu và ảnh khác"
 *
 * Supports both Message (portal types) and ChatMessage (API types)
 */
export function getMessageContentDescription(
  message: Message | ChatMessage,
): string {
  // Priority 1: Text content (if exists)
  if (message.content && message.content.trim()) {
    return `"${truncateText(message.content.trim())}"`;
  }

  // Priority 2: Attachments
  // Handle both Message.files/fileInfo and ChatMessage.attachments
  let files: (FileAttachment | AttachmentDto)[] = [];

  if ("attachments" in message && message.attachments?.length) {
    // ChatMessage type
    files = message.attachments;
  } else if ("files" in message && message.files?.length) {
    // Message type with files array
    files = message.files;
  } else if ("fileInfo" in message && message.fileInfo) {
    // Message type with single fileInfo
    files = [message.fileInfo];
  }

  if (files.length === 0) {
    // Fallback for empty message
    return '"Tin nhắn"';
  }

  // Get first file name (handle both types)
  const firstFile = files[0];
  const firstName = normalizeAttachment(firstFile).name;
  const remaining = files.length - 1;

  if (files.length === 1) {
    // Single attachment
    return `"${firstName}"`;
  }

  // Multiple attachments
  const { isAllImages, isAllDocuments } = classifyAttachments(files);

  if (isAllImages) {
    return `"${firstName}" và ${remaining} ảnh khác`;
  }

  if (isAllDocuments) {
    return `"${firstName}" và ${remaining} tài liệu khác`;
  }

  // Mixed
  return `"${firstName}" và ${remaining} tài liệu và ảnh khác`;
}

/**
 * Build the complete system message content for "Receive Info" action
 *
 * @param message - The original message being received/accepted (Message or ChatMessage)
 * @param receiverName - Name of the person who received the info
 * @param timestamp - Time of receiving (ISO string or Date). Defaults to current time if not provided.
 * @returns Complete system message content string
 *
 * @example
 * // Text message
 * buildReceiveInfoContent(textMsg, "Nguyễn Văn A", new Date())
 * // Returns: '"Nội dung báo cáo..." đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30'
 *
 * // Multiple files
 * buildReceiveInfoContent(fileMsg, "Nguyễn Văn A", new Date())
 * // Returns: '"report.xlsx" và 2 tài liệu khác đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30'
 */
export function buildReceiveInfoContent(
  message: Message | ChatMessage,
  receiverName: string,
  timestamp: string | Date = new Date(),
): string {
  const contentDesc = getMessageContentDescription(message);
  const timeStr = formatTime24h(timestamp);

  return `${contentDesc} đã được tiếp nhận bởi ${receiverName} lúc ${timeStr}`;
}
