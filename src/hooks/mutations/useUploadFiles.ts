import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadFile } from "@/api/files.api";
import { retryWithBackoff, FILE_RETRY_CONFIG } from "@/utils/retryLogic";
import { classifyError } from "@/utils/errorHandling";
import type { SelectedFile, UploadFileResult } from "@/types/files";
import { DEFAULT_FILE_RULES, getMaxSizeForFile } from "@/types/files";
import { guessMimeType } from "@/utils/fileHelpers";

/**
 * Client-side file validation
 * Uses per-type size limits from env config
 * @throws Error with specific message if validation fails
 */
function validateFile(file: File): void {
  const maxSize = getMaxSizeForFile(file);
  if (file.size > maxSize) {
    throw new Error("FILE_TOO_LARGE");
  }

  const mime = guessMimeType(file);
  if (!DEFAULT_FILE_RULES.allowedTypes.includes(mime)) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }
}

/**
 * Parameters for uploading multiple files
 */
export interface UploadFilesParams {
  /** Array of files to upload */
  files: SelectedFile[];
  /** Source module (0=Task, 1=Chat, 2=Company, 3=User) */
  sourceModule: number;
  /** Optional source entity ID (e.g., conversationId) */
  sourceEntityId?: string;
  /** Optional callback for progress tracking per file */
  onProgress?: (fileId: string, progress: number) => void;
}

/**
 * Uploaded file data including original file and upload result
 *
 * @since 2026-01-07 - Updated to include full file metadata for attachment formatting
 */
export interface UploadedFileData {
  /** Original File object selected by user */
  originalFile: File;
  /** Upload result from API including fileId and metadata */
  uploadResult: UploadFileResult;
}

/**
 * Result after uploading multiple files
 *
 * @since 2026-01-07 - Changed from fileIds array to full file data for attachment support
 */
export interface UploadFilesResult {
  /** Array of successfully uploaded files with full metadata */
  files: UploadedFileData[];
  /** Number of successful uploads */
  successCount: number;
  /** Number of failed uploads */
  failedCount: number;
  /** Array of errors for failed uploads */
  errors: Array<{ file: SelectedFile; error: string }>;
}

/**
 * Hook to upload multiple files sequentially to Vega File API
 *
 * Files are uploaded one-by-one because API only accepts 1 file per request.
 * Progress is tracked per file, errors are collected, and fileIds are returned.
 *
 * @example
 * ```typescript
 * const uploadFiles = useUploadFiles();
 *
 * const handleUpload = async () => {
 *   const result = await uploadFiles.mutateAsync({
 *     files: selectedFiles,
 *     sourceModule: 1, // Chat
 *     sourceEntityId: conversationId,
 *     onProgress: (fileId, progress) => {
 *     },
 *   });
 *
 *   // Updated: result.files instead of result.fileIds
 *
 *   // Access file metadata for attachments
 *   const attachments = result.files.map(({ originalFile, uploadResult }) => ({
 *     fileId: uploadResult.fileId,
 *     fileName: originalFile.name,
 *     fileSize: originalFile.size,
 *     contentType: originalFile.type,
 *   }));
 * };
 * ```
 */
export function useUploadFiles() {
  return useMutation({
    mutationFn: async (
      params: UploadFilesParams,
    ): Promise<UploadFilesResult> => {
      const { files, sourceModule, sourceEntityId, onProgress } = params;

      const uploadedFiles: UploadedFileData[] = [];
      const errors: Array<{ file: SelectedFile; error: string }> = [];

      // Upload files sequentially (one-by-one)
      for (const selectedFile of files) {
        try {
          // Phase 6: Client-side validation BEFORE upload
          validateFile(selectedFile.file);

          // Upload single file with retry logic
          const result: UploadFileResult = await retryWithBackoff(
            () =>
              uploadFile({
                file: selectedFile.file,
                sourceModule,
                sourceEntityId,
                onUploadProgress: (progressEvent) => {
                  // Calculate progress percentage
                  const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );

                  // Call progress callback
                  onProgress?.(selectedFile.id, progress);
                },
              }),
            FILE_RETRY_CONFIG,
          );

          // Collect successful upload with full file data
          uploadedFiles.push({
            originalFile: selectedFile.file,
            uploadResult: result,
          });
        } catch (error: any) {
          // Phase 6: Use error classification
          const classified = classifyError(error);

          // Collect error
          errors.push({
            file: selectedFile,
            error: classified.message,
          });

          // Show error toast
          toast.error(`Lỗi tải lên ${selectedFile.file.name}`, {
            description: classified.message,
          });
        }
      }

      return {
        files: uploadedFiles,
        successCount: uploadedFiles.length,
        failedCount: errors.length,
        errors,
      };
    },
  });
}
