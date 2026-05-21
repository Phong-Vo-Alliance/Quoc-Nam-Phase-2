import { useCallback, useEffect, useRef, useState } from "react";
import { useFileValidation } from "@/hooks/useFileValidation";
import {
  revokeFilePreview,
  validateBatchFileSelection,
} from "@/utils/fileHelpers";
import { toast } from "sonner";
import type { FileUploadProgressState, SelectedFile } from "@/types/files";
import { getMaxSizeForFile } from "@/types/files";
import { useUploadLimits } from "@/config/uploadLimits";
import { formatFileSize } from "../utils/chatHelpers";

export function useFileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, FileUploadProgressState>
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadLimits = useUploadLimits();
  const maxFilesPerMessage = uploadLimits.maxFilesPerMessage;
  const maxTotalSize = uploadLimits.maxTotalSize;

  const { validateAndAdd } = useFileValidation();

  // Compute file limit status
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
  const remainingSize = maxTotalSize - totalSize;

  const isFileLimitReached =
    selectedFiles.length >= maxFilesPerMessage || remainingSize < 1024;

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const currentCount = selectedFiles.length;
      const remainingSlots = maxFilesPerMessage - currentCount;

      // STEP 1: Check total size FIRST
      const currentTotalSize = selectedFiles.reduce(
        (sum, f) => sum + f.file.size,
        0,
      );
      const newFilesSize = fileArray.reduce((sum, f) => sum + f.size, 0);
      const remainingSize = maxTotalSize - currentTotalSize;
      const totalLimitLabel = formatFileSize(maxTotalSize);

      if (currentTotalSize + newFilesSize > maxTotalSize) {
        toast.error(
          remainingSize <= 0
            ? `Đã đạt giới hạn ${totalLimitLabel}. Vui lòng xóa file cũ để chọn file mới.`
            : `Tổng dung lượng vượt quá ${totalLimitLabel}. Còn trống ${formatFileSize(
                remainingSize,
              )}.`,
        );
        e.target.value = "";
        return;
      }

      // STEP 2: Check if already at file count limit
      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${maxFilesPerMessage} file. Vui lòng xóa file cũ để chọn file mới.`,
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
          remainingSlots === maxFilesPerMessage
            ? `Chỉ chọn được ${maxFilesPerMessage} file. Đã tự động bỏ ${discardedCount} file.`
            : `Đã có ${currentCount} file. Chỉ chọn thêm được ${remainingSlots} file nữa.`,
        );
      }

      // Validate batch
      const validationError = validateBatchFileSelection(
        filesToAdd,
        maxFilesPerMessage,
        Math.max(
          uploadLimits.maxImageSize,
          uploadLimits.maxVideoSize,
          uploadLimits.maxFileSize,
        ),
        maxTotalSize,
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
    [selectedFiles, validateAndAdd, uploadLimits, maxFilesPerMessage, maxTotalSize],
  );

  // Handle drag-and-drop files
  const handleDrop = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const currentCount = selectedFiles.length;
      const remainingSlots = maxFilesPerMessage - currentCount;

      const currentTotalSize = selectedFiles.reduce(
        (sum, f) => sum + f.file.size,
        0,
      );
      const newFilesSize = files.reduce((sum, f) => sum + f.size, 0);
      const remainingSize = maxTotalSize - currentTotalSize;
      const totalLimitLabel = formatFileSize(maxTotalSize);

      if (currentTotalSize + newFilesSize > maxTotalSize) {
        toast.error(
          remainingSize <= 0
            ? `Đã đạt giới hạn ${totalLimitLabel}. Vui lòng xóa file cũ để chọn file mới.`
            : `Tổng dung lượng vượt quá ${totalLimitLabel}. Còn trống ${formatFileSize(remainingSize)}.`,
        );
        return;
      }

      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${maxFilesPerMessage} file. Vui lòng xóa file cũ để chọn file mới.`,
        );
        return;
      }

      let filesToAdd = files;
      if (files.length > remainingSlots) {
        filesToAdd = files.slice(0, remainingSlots);
        const discardedCount = files.length - remainingSlots;
        toast.warning(
          remainingSlots === maxFilesPerMessage
            ? `Chỉ chọn được ${maxFilesPerMessage} file. Đã tự động bỏ ${discardedCount} file.`
            : `Đã có ${currentCount} file. Chỉ chọn thêm được ${remainingSlots} file nữa.`,
        );
      }

      const validationError = validateBatchFileSelection(
        filesToAdd,
        maxFilesPerMessage,
        Math.max(
          uploadLimits.maxImageSize,
          uploadLimits.maxVideoSize,
          uploadLimits.maxFileSize,
        ),
        maxTotalSize,
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
    [selectedFiles, validateAndAdd, uploadLimits, maxFilesPerMessage, maxTotalSize],
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
      const remainingSlots = maxFilesPerMessage - currentCount;

      if (remainingSlots === 0) {
        toast.error(
          `Đã đủ ${maxFilesPerMessage} file. Vui lòng xóa file cũ để paste ảnh mới.`,
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
    [selectedFiles.length, maxFilesPerMessage],
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
