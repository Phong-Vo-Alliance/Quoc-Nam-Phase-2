/**
 * Watermark Components
 *
 * Provides secure watermark for file previews.
 * Uses multiple layers (background + overlay) with tamper detection.
 *
 * @module components/portal/components/file-sheet/Watermark
 */

import { useMemo, CSSProperties, useEffect, useRef, useCallback } from "react";
import type { WatermarkInfoDto } from "@/types/filePreview";

/**
 * Generate SVG watermark pattern as data URL
 */
function generateWatermarkPattern(watermarkText: string): string {
  if (!watermarkText) return "";

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <text
        x="150"
        y="100"
        font-size="16"
        font-weight="400"
        fill="rgba(0, 0, 0, 0.12)"
        text-anchor="middle"
        transform="rotate(-30 150 100)"
        style="user-select: none;"
      >${watermarkText}</text>
    </svg>
  `;

  const encoded = encodeURIComponent(svgContent)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");

  return `data:image/svg+xml,${encoded}`;
}

/**
 * Custom hook to generate watermark background styles
 * @deprecated Use WatermarkOverlay component instead for better visibility over tables
 */
export function useWatermarkStyles(
  watermark: WatermarkInfoDto | undefined | null,
) {
  const watermarkText = watermark?.userIdentifier || "";

  const watermarkPattern = useMemo(
    () => generateWatermarkPattern(watermarkText),
    [watermarkText],
  );

  if (!watermarkPattern) {
    return {};
  }

  return {
    backgroundImage: `url("${watermarkPattern}")`,
    backgroundRepeat: "repeat",
    backgroundPosition: "0 0",
    backgroundSize: "300px 200px",
    backgroundAttachment: "local",
  };
}

interface WatermarkOverlayProps {
  watermark: WatermarkInfoDto | undefined | null;
}

/**
 * Watermark Overlay Component
 *
 * Renders watermark as an overlay ON TOP of content.
 * This ensures watermark is visible even over tables/images with solid backgrounds.
 *
 * @example
 * <div style={{ position: 'relative' }}>
 *   <ContentHere />
 *   <WatermarkOverlay watermark={data?.watermark} />
 * </div>
 */
export function WatermarkOverlay({ watermark }: WatermarkOverlayProps) {
  const watermarkText = watermark?.userIdentifier || "";

  const watermarkPattern = useMemo(
    () => generateWatermarkPattern(watermarkText),
    [watermarkText],
  );

  if (!watermarkPattern) {
    return null;
  }

  const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("${watermarkPattern}")`,
    backgroundRepeat: "repeat",
    backgroundPosition: "0 0",
    backgroundSize: "300px 200px",
    pointerEvents: "none", // Allow clicks to pass through
    zIndex: 10, // On top of content
    userSelect: "none",
  };

  return (
    <div
      style={overlayStyle}
      aria-hidden="true"
      data-testid="watermark-overlay"
    />
  );
}

interface SecureWatermarkContainerProps {
  watermark: WatermarkInfoDto | undefined | null;
  children: React.ReactNode;
  /** Unique ID for CSS scoping */
  contentId: string;
  className?: string;
  "data-testid"?: string;
}

/**
 * Secure Watermark Container
 *
 * Wraps content with multiple security layers:
 * 1. Watermark as BACKGROUND (can't be removed without removing container)
 * 2. CSS to make table backgrounds semi-transparent (watermark shows through)
 * 3. Watermark OVERLAY on top (redundant layer)
 * 4. MutationObserver: if overlay is tampered, content gets blurred
 *
 * Security: Even if user removes overlay via DevTools, they can't easily remove
 * the background watermark, and content styling is affected.
 *
 * @example
 * <SecureWatermarkContainer watermark={data.watermark} contentId={fileId}>
 *   <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
 * </SecureWatermarkContainer>
 */
export function SecureWatermarkContainer({
  watermark,
  children,
  contentId,
  className,
  "data-testid": testId,
}: SecureWatermarkContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const watermarkText = watermark?.userIdentifier || "";

  const watermarkPattern = useMemo(
    () => generateWatermarkPattern(watermarkText),
    [watermarkText],
  );

  // Tamper detection: blur content if overlay is removed
  const handleTamper = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.filter = "blur(20px)";
      containerRef.current.style.pointerEvents = "none";
    }
  }, []);

  // MutationObserver to detect overlay removal
  useEffect(() => {
    if (!watermarkPattern || !containerRef.current) return;

    const container = containerRef.current;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check if overlay was removed from DOM
        if (mutation.type === "childList") {
          for (const removedNode of mutation.removedNodes) {
            if (
              removedNode instanceof HTMLElement &&
              removedNode.dataset.watermarkSecure === "true"
            ) {
              handleTamper();
              return;
            }
          }
        }
        // Check if overlay styles were modified
        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLElement &&
          mutation.target.dataset.watermarkSecure === "true"
        ) {
          const target = mutation.target;
          // If opacity, visibility, or display changed suspiciously
          const style = window.getComputedStyle(target);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            parseFloat(style.opacity) < 0.5
          ) {
            handleTamper();
            return;
          }
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, [watermarkPattern, handleTamper]);

  // Inject CSS to make table backgrounds semi-transparent
  useEffect(() => {
    if (!watermarkPattern) return;

    const styleId = `watermark-transparency-${contentId}`;
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Force table backgrounds to be semi-transparent so watermark shows through */
      .secure-content-${contentId} table,
      .secure-content-${contentId} td,
      .secure-content-${contentId} th,
      .secure-content-${contentId} tr {
        background-color: rgba(255, 255, 255, 0.85) !important;
      }
      
      /* Preserve colored backgrounds but make semi-transparent */
      .secure-content-${contentId} [style*="background"] {
        --bg-opacity: 0.85;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [contentId, watermarkPattern]);

  // Container styles with watermark background
  const containerStyle: CSSProperties = watermarkPattern
    ? {
        position: "relative",
        backgroundImage: `url("${watermarkPattern}")`,
        backgroundRepeat: "repeat",
        backgroundPosition: "0 0",
        backgroundSize: "300px 200px",
        backgroundAttachment: "local",
      }
    : { position: "relative" };

  // Overlay styles
  const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("${watermarkPattern}")`,
    backgroundRepeat: "repeat",
    backgroundPosition: "0 0",
    backgroundSize: "300px 200px",
    pointerEvents: "none",
    zIndex: 10,
    userSelect: "none",
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Content wrapped with secure class */}
      <div className={`secure-content-${contentId} relative z-0`}>
        {children}
      </div>

      {/* Secure overlay - monitored for tampering */}
      {watermarkPattern && (
        <div
          ref={overlayRef}
          style={overlayStyle}
          aria-hidden="true"
          data-watermark-secure="true"
          data-testid="watermark-overlay"
        />
      )}
    </div>
  );
}
