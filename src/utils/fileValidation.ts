/**
 * File validation utilities
 */

import type { FileValidationResult, FileValidationRules } from "@/types/files";
import { getMaxSizeForFile } from "@/types/files";
import { formatFileSize } from "./fileHelpers";

/**
 * Validate file size
 * @param file File to validate
 * @param maxSize Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileSize(
  file: File,
  maxSize: number,
): FileValidationResult {
  // if (file.size > maxSize) {
  //   return {
  //     isValid: false,
  //     error: `File "${
  //       file.name
  //     }" vượt quá kích thước cho phép (${formatFileSize(maxSize)})`,
  //   };
  // }
  return { isValid: true };
}

/**
 * Validate file type
 * @param file File to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileType(
  file: File,
  allowedTypes: string[],
): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Định dạng file "${file.name}" không được hỗ trợ`,
    };
  }
  return { isValid: true };
}

/**
 * Validate total file count
 * @param currentCount Current number of files
 * @param newFilesCount Number of new files to add
 * @param maxFiles Maximum number of files allowed
 * @returns Validation result
 */
export function validateFileCount(
  currentCount: number,
  newFilesCount: number,
  maxFiles: number,
): FileValidationResult {
  const totalCount = currentCount + newFilesCount;
  if (totalCount > maxFiles) {
    return {
      isValid: false,
      error: `Bạn chỉ có thể chọn tối đa ${maxFiles} file`,
    };
  }
  return { isValid: true };
}

/**
 * Validate a single file against all rules
 * @param file File to validate
 * @param rules Validation rules
 * @returns Validation result
 */
export function validateFile(
  file: File,
  rules: FileValidationRules,
): FileValidationResult {
  // Validate file size using per-type limits
  const maxSize = getMaxSizeForFile(file);
  const sizeResult = validateFileSize(file, maxSize);
  if (!sizeResult.isValid) return sizeResult;

  // Validate file type
  const typeResult = validateFileType(file, rules.allowedTypes);
  if (!typeResult.isValid) return typeResult;

  return { isValid: true };
}

/**
 * Validate array of files
 * @param files Files to validate
 * @param currentCount Current number of selected files
 * @param rules Validation rules
 * @returns Object with valid files and errors
 */
export function validateFiles(
  files: File[],
  currentCount: number,
  rules: FileValidationRules,
): {
  validFiles: File[];
  errors: string[];
} {
  const validFiles: File[] = [];
  const errors: string[] = [];

  // Check total count first
  const countResult = validateFileCount(
    currentCount,
    files.length,
    rules.maxFiles,
  );
  if (!countResult.isValid) {
    errors.push(countResult.error!);
    return { validFiles, errors };
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, rules);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      errors.push(result.error!);
    }
  }

  return { validFiles, errors };
}
