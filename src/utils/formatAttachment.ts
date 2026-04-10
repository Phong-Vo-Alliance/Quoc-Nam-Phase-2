/**
 * Utility functions to format file attachments for send message API
 *
 * Converts File objects + upload results into AttachmentInputDto format
 * required by the Vega Chat API (Swagger: SendMessageRequest.attachment)
 *
 * @module utils/formatAttachment
 * @since 2026-01-07
 */

import type { UploadFileResult } from "@/types/files";
import type { AttachmentInputDto } from "@/types/messages";
import { guessMimeType } from "@/utils/fileHelpers";

/**
 * Format a single file + upload result into AttachmentInputDto
 *
 * @param file - Original File object selected by user
 * @param uploadResult - Result from uploadFile API containing fileId
 * @returns AttachmentInputDto object ready for sendMessage API
 *
 * @example
 * ```ts
 * const file = new File(["content"], "report.pdf", { type: "application/pdf" });
 * const uploadResult = { fileId: "uuid-123", ... };
 * const attachment = formatAttachment(file, uploadResult);
 * // Returns: { fileId: "uuid-123", fileName: "report.pdf", fileSize: 7, contentType: "application/pdf" }
 * ```
 */
export function formatAttachment(
  file: File,
  uploadResult: UploadFileResult
): AttachmentInputDto {
  return {
    fileId: uploadResult.fileId,
    fileName: file.name || null,
    fileSize: file.size,
    contentType: guessMimeType(file), // MIME type, inferred from extension if empty
  };
}

/**
 * Format multiple files into array of AttachmentInputDto
 *
 * ⚠️ Note: Send Message API only accepts 1 attachment per message.
 * This is a helper for uploading multiple files, but you'll need to
 * send multiple messages (1 file each) to actually use them.
 *
 * @param files - Array of File objects
 * @param uploadResults - Array of upload results (same order as files)
 * @returns Array of AttachmentInputDto objects
 *
 * @throws Error if files.length !== uploadResults.length
 *
 * @example
 * ```ts
 * const files = [file1, file2, file3];
 * const results = [result1, result2, result3];
 * const attachments = formatAttachments(files, results);
 * // Returns: [AttachmentInputDto, AttachmentInputDto, AttachmentInputDto]
 *
 * // Then send multiple messages (API limitation: 1 file/message)
 * for (const attachment of attachments) {
 *   await sendMessage({ conversationId, content: null, attachment });
 * }
 * ```
 */
export function formatAttachments(
  files: File[],
  uploadResults: UploadFileResult[]
): AttachmentInputDto[] {
  if (files.length !== uploadResults.length) {
    throw new Error(
      `formatAttachments: files.length (${files.length}) !== uploadResults.length (${uploadResults.length})`
    );
  }

  return files.map((file, index) =>
    formatAttachment(file, uploadResults[index])
  );
}
