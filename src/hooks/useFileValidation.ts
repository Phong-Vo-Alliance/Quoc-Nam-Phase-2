/**
 * File validation hook with toast notifications
 */

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { FileValidationRules, SelectedFile } from "@/types/files";
import { DEFAULT_FILE_RULES } from "@/types/files";
import { validateFiles } from "@/utils/fileValidation";
import { fileToSelectedFile } from "@/utils/fileHelpers";
import { useUploadLimits } from "@/config/uploadLimits";

interface UseFileValidationOptions {
  rules?: Partial<FileValidationRules>;
  onValidFiles?: (files: SelectedFile[]) => void;
}

interface UseFileValidationReturn {
  validateAndAdd: (
    files: FileList | File[],
    currentCount: number
  ) => SelectedFile[];
}

/**
 * Hook for file validation with toast notifications
 * @param options Validation options
 * @returns Validation function
 */
export function useFileValidation(
  options: UseFileValidationOptions = {}
): UseFileValidationReturn {
  const uploadLimits = useUploadLimits();
  const rules: FileValidationRules = useMemo(
    () => ({
      ...DEFAULT_FILE_RULES,
      maxSize: uploadLimits.maxFileSize,
      maxFiles: uploadLimits.maxFilesPerMessage,
      ...options.rules,
    }),
    [uploadLimits, options.rules],
  );

  const validateAndAdd = useCallback(
    (files: FileList | File[], currentCount: number): SelectedFile[] => {
      // Convert FileList to array
      const fileArray = Array.from(files);

      // Validate files
      const { validFiles, errors } = validateFiles(
        fileArray,
        currentCount,
        rules
      );

      // Show error toasts
      if (errors.length > 0) {
        errors.forEach((error) => {
          toast.error(error);
        });
      }

      // Convert valid files to SelectedFile objects
      const selectedFiles = validFiles.map(fileToSelectedFile);

      // Call callback if provided
      if (selectedFiles.length > 0 && options.onValidFiles) {
        options.onValidFiles(selectedFiles);
      }

      // Show success toast if files added
      if (selectedFiles.length > 0) {
        toast.success(
          `Đã thêm ${selectedFiles.length} file${
            selectedFiles.length > 1 ? "s" : ""
          }`
        );
      }

      return selectedFiles;
    },
    [rules, options]
  );

  return { validateAndAdd };
}
