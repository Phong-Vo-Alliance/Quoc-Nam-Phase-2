/**
 * DevTools protection hook
 * Blocks developer tools keyboard shortcuts and detects if DevTools is open
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { detectDevTools } from "@/utils/security/detectDevTools";
import { securityConfig } from "@/config/security.config";

/**
 * Hook to protect against developer tools usage
 * @param enabled - Whether protection is enabled
 */
export function useDevToolsProtection(enabled: boolean) {
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    /**
     * IMPORTANT: Screenshot blocking limitations
     *
     * Browser CANNOT block system-level screenshot tools like:
     * - Win+Shift+S (Windows Snipping Tool) - OS handles this before browser
     * - Win+PrintScreen - OS level
     * - Third-party tools (Snagit, Greenshot, etc.)
     * - Physical cameras/phones
     *
     * What we CAN block:
     * - PrintScreen key alone (may work in some browsers)
     * - Browser DevTools shortcuts (F12, Ctrl+Shift+I, etc.)
     *
     * For real screenshot protection, consider:
     * - Watermarks on sensitive content
     * - Server-side rendering of sensitive data
     * - DRM solutions (video streaming)
     * - Session recording/monitoring
     */

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C (Element picker)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // PrintScreen (Screenshot) - Limited effectiveness
      // Note: This may not work in all browsers and scenarios
      if (e.key === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Chụp màn hình không được phép");
        return false;
      }
    };

    // Detection loop
    const startDetection = () => {
      intervalRef.current = window.setInterval(() => {
        try {
          if (detectDevTools()) {
            const action = securityConfig.devToolsProtection.action;

            if (action === "toast") {
              toast.error("Developer Tools không được phép sử dụng");
            } else if (action === "modal") {
              // Simple blocking alert for now
              alert("Developer Tools không được phép sử dụng");
            } else if (action === "redirect") {
              window.location.href =
                securityConfig.devToolsProtection.redirectUrl || "/blocked";
            }
          }
        } catch (error) {
          console.error("[DevTools Protection] Detection error:", error);
        }
      }, securityConfig.devToolsProtection.detectionInterval);
    };

    // Add keyboard event listener
    document.addEventListener("keydown", handleKeyDown, true);

    startDetection();

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);
}
