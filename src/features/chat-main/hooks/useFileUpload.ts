import { useCallback, useEffect, useRef, useState } from "react";
import { useFileValidation } from "@/hooks/useFileValidation";
import {
  revokeFilePreview,
  validateBatchFileSelection,
} from "@/utils/fileHelpers";
import { toast } from "sonner";
import type { FileUploadProgressState, SelectedFile } from "@/types/files";
import { MAX_FILES_PER_MESSAGE, getMaxSizeForFile } from "@/types/files";
import { FILE_UPLOAD_LIMITS } from "@/config/env.config";
import { formatFileSize } from "../utils/chatHelpers";

export function useFileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, FileUploadProgressState>
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { validateAndAdd } = useFileValidation();

  // Compute file limit status
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
  const MAX_TOTAL_SIZE = FILE_UPLOAD_LIMITS.maxTotalSize;
  const remainingSize = MAX_TOTAL_SIZE - totalSize;

  const isFileLimitReached =
    selectedFiles.length >= MAX_FILES_PER_MESSAGE || remainingSize < 1024;

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const currentCount = selectedFiles.length;
      const remainingSlots = MAX_FILES_PER_MESSAGE - currentCount;

      // STEP 1: Check total size FIRST
      const currentTotalSize = selectedFiles.reduce(
        (sum, f) => sum + f.file.size,
        0,
      );
      const newFilesSize = fileArray.reduce((sum, f) => sum + f.size, 0);
      const MAX_TOTAL_SIZE = FILE_UPLOAD_LIMITS.maxTotalSize;
      const remainingSize = MAX_TOTAL_SIZE - currentTotalSize;

      if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
        toast.error(
          remainingSize <= 0
            ? "Đã đạt giới hạn 100MB. Vui lòng xóa file cũ để chọn file mới."
            : `Tổng dung lượng vượt quá 100MB. Còn trống ${formatFileSize(
                remainingSize,
              )}.`,
        );
        e.target.value = "";
        return;
      }

      // STEP 2: Check if already at file count limit
      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${MAX_FILES_PER_MESSAGE} file. Vui lòng xóa file cũ để chọn file mới.`,
        );
        e.target.value = "";
        return;
      }

      // If selecting more than remaining, take only what fits
      let filesToAdd = fileArray;
      if (fileArray.length > remainingSlots) {
        filesToAdd = fileArray.slice(0, remainingSlots);
        const discardedCount = fileArray.length - remainingSlots;
        toast.warning(
          remainingSlots === MAX_FILES_PER_MESSAGE
            ? `Chỉ chọn được ${MAX_FILES_PER_MESSAGE} file. Đã tự động bỏ ${discardedCount} file.`
            : `Đã có ${currentCount} file. Chỉ chọn thêm được ${remainingSlots} file nữa.`,
        );
      }

      // Validate batch
      const validationError = validateBatchFileSelection(
        filesToAdd,
        MAX_FILES_PER_MESSAGE,
        Math.max(
          FILE_UPLOAD_LIMITS.maxImageSize,
          FILE_UPLOAD_LIMITS.maxVideoSize,
          FILE_UPLOAD_LIMITS.maxFileSize,
        ),
        FILE_UPLOAD_LIMITS.maxTotalSize,
      );

      if (validationError) {
        toast.error(validationError.message);
        e.target.value = "";
        return;
      }

      // Add validated files
      const validFiles = validateAndAdd(filesToAdd, currentCount);
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }

      e.target.value = "";
    },
    [selectedFiles, validateAndAdd],
  );

  // Handle drag-and-drop files
  const handleDrop = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const currentCount = selectedFiles.length;
      const remainingSlots = MAX_FILES_PER_MESSAGE - currentCount;

      const currentTotalSize = selectedFiles.reduce(
        (sum, f) => sum + f.file.size,
        0,
      );
      const newFilesSize = files.reduce((sum, f) => sum + f.size, 0);
      const MAX_TOTAL_SIZE = FILE_UPLOAD_LIMITS.maxTotalSize;
      const remainingSize = MAX_TOTAL_SIZE - currentTotalSize;

      if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
        toast.error(
          remainingSize <= 0
            ? "Đã đạt giới hạn 100MB. Vui lòng xóa file cũ để chọn file mới."
            : `Tổng dung lượng vượt quá 100MB. Còn trống ${formatFileSize(remainingSize)}.`,
        );
        return;
      }

      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${MAX_FILES_PER_MESSAGE} file. Vui lòng xóa file cũ để chọn file mới.`,
        );
        return;
      }

      let filesToAdd = files;
      if (files.length > remainingSlots) {
        filesToAdd = files.slice(0, remainingSlots);
        const discardedCount = files.length - remainingSlots;
        toast.warning(
          remainingSlots === MAX_FILES_PER_MESSAGE
            ? `Chỉ chọn được ${MAX_FILES_PER_MESSAGE} file. Đã tự động bỏ ${discardedCount} file.`
            : `Đã có ${currentCount} file. Chỉ chọn thêm được ${remainingSlots} file nữa.`,
        );
      }

      const validationError = validateBatchFileSelection(
        filesToAdd,
        MAX_FILES_PER_MESSAGE,
        Math.max(
          FILE_UPLOAD_LIMITS.maxImageSize,
          FILE_UPLOAD_LIMITS.maxVideoSize,
          FILE_UPLOAD_LIMITS.maxFileSize,
        ),
        FILE_UPLOAD_LIMITS.maxTotalSize,
      );

      if (validationError) {
        toast.error(validationError.message);
        return;
      }

      const validFiles = validateAndAdd(filesToAdd, currentCount);
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [selectedFiles, validateAndAdd],
  );

  // 🆕 v1.3.0: Handle paste image from clipboard
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) return;

      const imageItems = Array.from(clipboardItems).filter((item) =>
        item.type.startsWith("image/"),
      );

      if (imageItems.length === 0) return;

      event.preventDefault();

      const currentCount = selectedFiles.length;
      const remainingSlots = MAX_FILES_PER_MESSAGE - currentCount;

      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${MAX_FILES_PER_MESSAGE} file. Vui lòng xóa file cũ để paste ảnh mới.`,
        );
        return;
      }

      const newFiles: SelectedFile[] = [];
      const timestamp = Date.now();

      imageItems.slice(0, remainingSlots).forEach((item, index) => {
        const file = item.getAsFile();
        if (!file) return;

        const maxSize = getMaxSizeForFile(file);
        if (file.size > maxSize) {
          toast.error(
            `Ảnh vượt quá ${formatFileSize(maxSize)}. Vui lòng chọn ảnh nhỏ hơn.`,
          );
          return;
        }

        const extension = file.type.split("/")[1] || "png";
        const customName = `clipboard-${timestamp}${index > 0 ? `-${index}` : ""}.${extension}`;
        const renamedFile = new File([file], customName, { type: file.type });

        newFiles.push({
          id: `paste-${timestamp}-${index}`,
          file: renamedFile,
          preview: URL.createObjectURL(renamedFile),
        });
      });

      if (newFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Đã paste ${newFiles.length} ảnh`);
      }
    },
    [selectedFiles.length],
  );

  // Handle remove file
  const handleRemoveFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        revokeFilePreview(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  // Clear all files (used after successful send)
  const clearFiles = useCallback(() => {
    selectedFiles.forEach((sf) => revokeFilePreview(sf.preview));
    setSelectedFiles([]);
  }, [selectedFiles]);

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((sf) => revokeFilePreview(sf.preview));
    };
  }, [selectedFiles]);

  return {
    selectedFiles,
    setSelectedFiles,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    fileInputRef,
    imageInputRef,
    isFileLimitReached,
    handleFileSelect,
    handleDrop,
    handlePaste,
    handleRemoveFile,
    clearFiles,
  };
}
