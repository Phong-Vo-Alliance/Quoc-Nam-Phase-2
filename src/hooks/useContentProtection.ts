/**
 * Content protection hook
 * Prevents text selection and copy for specific elements (e.g., file previews)
 */

import { useEffect, RefObject } from "react";
import { toast } from "sonner";
import { securityConfig } from "@/config/security.config";
import { isProtectedFileType } from "@/utils/security/protectionHelpers";

interface UseContentProtectionOptions {
  /** Filename to check against protected file types */
  filename?: string;
  /** Override to enable/disable protection for this specific element */
  enabled?: boolean;
}

/**
 * Hook to protect content from being copied or selected
 * @param elementRef - Reference to the HTML element to protect
 * @param options - Configuration options
 */
export function useContentProtection(
  elementRef: RefObject<HTMLElement | null>,
  options: UseContentProtectionOptions = {},
) {
  const { filename, enabled = true } = options;

  useEffect(() => {
    if (!enabled || !securityConfig.contentProtection.enabled) return;
    if (!elementRef.current) return;

    // Check if file type should be protected
    if (
      filename &&
      !isProtectedFileType(filename, securityConfig.contentProtection.fileTypes)
    ) {
      return;
    }

    const element = elementRef.current;

    // Apply CSS user-select: none
    element.style.userSelect = "none";
    element.style.webkitUserSelect = "none";
    // @ts-expect-error - msUserSelect is not in TS types but needed for old IE
    element.style.msUserSelect = "none";

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Prevent copy
    const handleCopy = (e: Event) => {
      e.preventDefault();
      if (securityConfig.contentProtection.showWarning) {
        toast.error("Sao chép nội dung không được phép");
      }
      return false;
    };

    // Prevent drag
    const handleDragStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    element.addEventListener("selectstart", handleSelectStart);
    element.addEventListener("copy", handleCopy);
    element.addEventListener("dragstart", handleDragStart);

    return () => {
      // Cleanup
      element.style.userSelect = "";
      element.style.webkitUserSelect = "";
      // @ts-expect-error - msUserSelect cleanup
      element.style.msUserSelect = "";
      element.removeEventListener("selectstart", handleSelectStart);
      element.removeEventListener("copy", handleCopy);
      element.removeEventListener("dragstart", handleDragStart);
    };
  }, [elementRef, filename, enabled]);
}
