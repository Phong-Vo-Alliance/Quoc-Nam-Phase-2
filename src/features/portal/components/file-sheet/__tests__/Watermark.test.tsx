import { describe, it, expect } from "vitest";
import { renderHook, render, screen } from "@testing-library/react";
import { useWatermarkStyles, WatermarkOverlay } from "../Watermark";
import type { WatermarkInfoDto } from "@/types/filePreview";

describe("useWatermarkStyles", () => {
  const mockWatermark: WatermarkInfoDto = {
    userIdentifier: "user@example.com",
    timestamp: "2026-01-12T10:30:00Z",
  };

  it("should return watermark background style object", () => {
    const { result } = renderHook(() => useWatermarkStyles(mockWatermark));

    expect(result.current).toHaveProperty("backgroundImage");
    expect(result.current).toHaveProperty("backgroundRepeat", "repeat");
    expect(result.current).toHaveProperty("backgroundPosition", "0 0");
    expect(result.current).toHaveProperty("backgroundSize", "300px 200px");
    expect(result.current).toHaveProperty("backgroundAttachment", "local");
  });

  it("should generate SVG pattern with userIdentifier only (no timestamp)", () => {
    const { result } = renderHook(() => useWatermarkStyles(mockWatermark));

    const bgImage = result.current.backgroundImage as string;

    // Decode the SVG data URL
    const svgMatch = bgImage.match(/data:image\/svg\+xml,(.*)/);
    expect(svgMatch).toBeTruthy();

    const decodedSvg = decodeURIComponent(svgMatch![1]);

    // Should contain userIdentifier
    expect(decodedSvg).toContain("user@example.com");

    // Should NOT contain timestamp or date formatting
    expect(decodedSvg).not.toContain("2026");
    expect(decodedSvg).not.toContain("12/01");
    expect(decodedSvg).not.toContain("10:30");
  });

  it("should use font-weight 400 (normal font)", () => {
    const { result } = renderHook(() => useWatermarkStyles(mockWatermark));

    const bgImage = result.current.backgroundImage as string;
    const svgMatch = bgImage.match(/data:image\/svg\+xml,(.*)/);
    const decodedSvg = decodeURIComponent(svgMatch![1]);

    expect(decodedSvg).toContain('font-weight="400"');
    expect(decodedSvg).not.toContain('font-weight="600"');
  });

  it("should have text rotated -30 degrees", () => {
    const { result } = renderHook(() => useWatermarkStyles(mockWatermark));

    const bgImage = result.current.backgroundImage as string;
    const svgMatch = bgImage.match(/data:image\/svg\+xml,(.*)/);
    const decodedSvg = decodeURIComponent(svgMatch![1]);

    expect(decodedSvg).toContain('transform="rotate(-30 150 100)"');
  });

  it("should have pattern size 300x200px for ~4 watermarks per row", () => {
    const { result } = renderHook(() => useWatermarkStyles(mockWatermark));

    expect(result.current.backgroundSize).toBe("300px 200px");
  });

  it("should return empty object when userIdentifier is null", () => {
    const emptyWatermark: WatermarkInfoDto = {
      userIdentifier: null as any,
      timestamp: "2026-01-12T10:30:00Z",
    };

    const { result } = renderHook(() => useWatermarkStyles(emptyWatermark));

    // Should return empty object when no valid userIdentifier
    expect(result.current).toEqual({});
  });
});

describe("WatermarkOverlay", () => {
  const mockWatermark: WatermarkInfoDto = {
    userIdentifier: "user@example.com",
    timestamp: "2026-01-12T10:30:00Z",
  };

  it("should render overlay div with correct test id", () => {
    render(<WatermarkOverlay watermark={mockWatermark} />);

    expect(screen.getByTestId("watermark-overlay")).toBeInTheDocument();
  });

  it("should have pointer-events none to allow clicks through", () => {
    render(<WatermarkOverlay watermark={mockWatermark} />);

    const overlay = screen.getByTestId("watermark-overlay");
    expect(overlay).toHaveStyle({ pointerEvents: "none" });
  });

  it("should have z-index to render on top of content", () => {
    render(<WatermarkOverlay watermark={mockWatermark} />);

    const overlay = screen.getByTestId("watermark-overlay");
    expect(overlay).toHaveStyle({ zIndex: "10" });
  });

  it("should have absolute positioning to cover parent", () => {
    render(<WatermarkOverlay watermark={mockWatermark} />);

    const overlay = screen.getByTestId("watermark-overlay");
    expect(overlay).toHaveStyle({
      position: "absolute",
      top: "0px",
      left: "0px",
      right: "0px",
      bottom: "0px",
    });
  });

  it("should return null when no watermark provided", () => {
    const { container } = render(<WatermarkOverlay watermark={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("should return null when watermark has no userIdentifier", () => {
    const emptyWatermark: WatermarkInfoDto = {
      userIdentifier: "",
      timestamp: "2026-01-12T10:30:00Z",
    };

    const { container } = render(
      <WatermarkOverlay watermark={emptyWatermark} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
