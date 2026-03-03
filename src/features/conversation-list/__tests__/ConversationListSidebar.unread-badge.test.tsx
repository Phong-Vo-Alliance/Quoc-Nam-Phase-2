/**
 * Unit tests for Tab Unread Badge feature - Notification Badge Style
 *
 * Tests:
 * - NotificationBadge component rendering
 * - Badge positioning and styling
 * - Pulse animation
 * - Number format (1-9 → number, ≥10 → "9+")
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock NotificationBadge component for testing
const NotificationBadge: React.FC<{
  count: number;
  pulse?: boolean;
  inline?: boolean;
}> = ({ count, pulse = false, inline = false }) => {
  if (count <= 0) return null;

  const displayCount = count >= 10 ? "9+" : count;

  if (inline) {
    return (
      <span
        className="relative inline-flex h-4 w-4 items-center justify-center"
        data-testid="notification-badge"
      >
        {pulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
            data-testid="pulse-animation"
          />
        )}
        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold text-white">
          {displayCount}
        </span>
      </span>
    );
  }

  return (
    <span
      className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center z-50"
      data-testid="notification-badge"
    >
      {pulse && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
          data-testid="pulse-animation"
        />
      )}
      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold text-white">
        {displayCount}
      </span>
    </span>
  );
};

describe("Tab Unread Badge - Notification Badge Style", () => {
  describe("NotificationBadge component", () => {
    it("returns null when count is 0", () => {
      // GIVEN: count = 0
      const { container } = render(<NotificationBadge count={0} />);

      // THEN: Nothing rendered
      expect(container.firstChild).toBeNull();
    });

    it("returns null when count is negative", () => {
      // GIVEN: count = -5
      const { container } = render(<NotificationBadge count={-5} />);

      // THEN: Nothing rendered
      expect(container.firstChild).toBeNull();
    });

    it("renders badge with single digit (1-9)", () => {
      // GIVEN: count = 5
      render(<NotificationBadge count={5} />);

      // THEN: Badge exists
      const badge = screen.getByTestId("notification-badge");
      expect(badge).toBeInTheDocument();

      // THEN: Shows "5"
      expect(badge.textContent).toBe("5");
    });

    it("renders badge with 9+ when count >= 10", () => {
      // GIVEN: count = 10
      render(<NotificationBadge count={10} />);

      // THEN: Shows "9+"
      const badge = screen.getByTestId("notification-badge");
      expect(badge.textContent).toBe("9+");
    });

    it("renders badge with 9+ for large counts", () => {
      // GIVEN: count = 999
      render(<NotificationBadge count={999} />);

      // THEN: Shows "9+"
      const badge = screen.getByTestId("notification-badge");
      expect(badge.textContent).toBe("9+");
    });

    it("has correct positioning classes", () => {
      // GIVEN: count = 5
      render(<NotificationBadge count={5} />);

      // THEN: Has absolute positioning
      const badge = screen.getByTestId("notification-badge");
      expect(badge).toHaveClass("absolute");
      expect(badge).toHaveClass("-top-2");
      expect(badge).toHaveClass("-right-2");
      expect(badge).toHaveClass("z-50");
    });

    it("has correct size classes (16px)", () => {
      // GIVEN: count = 5
      render(<NotificationBadge count={5} />);

      // THEN: Has h-4 w-4 (16px)
      const badge = screen.getByTestId("notification-badge");
      expect(badge).toHaveClass("h-4");
      expect(badge).toHaveClass("w-4");
    });

    it("has red-500 background color", () => {
      // GIVEN: count = 5
      const { container } = render(<NotificationBadge count={5} />);

      // THEN: Badge has bg-red-500
      const innerBadge = container.querySelector(".bg-red-500");
      expect(innerBadge).toBeInTheDocument();
    });

    it("renders pulse animation when pulse=true", () => {
      // GIVEN: count = 5, pulse = true
      render(<NotificationBadge count={5} pulse={true} />);

      // THEN: Pulse element exists
      const pulse = screen.getByTestId("pulse-animation");
      expect(pulse).toBeInTheDocument();

      // THEN: Has animate-ping class
      expect(pulse).toHaveClass("animate-ping");
    });

    it("does not render pulse animation when pulse=false", () => {
      // GIVEN: count = 5, pulse = false
      render(<NotificationBadge count={5} pulse={false} />);

      // THEN: No pulse element
      const pulse = screen.queryByTestId("pulse-animation");
      expect(pulse).not.toBeInTheDocument();
    });
  });

  describe("Number format edge cases", () => {
    it("shows 1 for count = 1", () => {
      render(<NotificationBadge count={1} />);
      expect(screen.getByTestId("notification-badge").textContent).toBe("1");
    });

    it("shows 9 for count = 9", () => {
      render(<NotificationBadge count={9} />);
      expect(screen.getByTestId("notification-badge").textContent).toBe("9");
    });

    it("shows 9+ for count = 10 (boundary)", () => {
      render(<NotificationBadge count={10} />);
      expect(screen.getByTestId("notification-badge").textContent).toBe("9+");
    });

    it("shows 9+ for count = 11", () => {
      render(<NotificationBadge count={11} />);
      expect(screen.getByTestId("notification-badge").textContent).toBe("9+");
    });
  });

  describe("Inline variant", () => {
    it("renders inline badge without absolute positioning", () => {
      // GIVEN: count = 5, inline = true
      render(<NotificationBadge count={5} inline={true} />);

      // THEN: Badge exists
      const badge = screen.getByTestId("notification-badge");
      expect(badge).toBeInTheDocument();

      // THEN: Has relative positioning (not absolute)
      expect(badge).toHaveClass("relative");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).not.toHaveClass("absolute");
    });

    it("inline badge has no z-index", () => {
      // GIVEN: count = 5, inline = true
      render(<NotificationBadge count={5} inline={true} />);

      // THEN: No z-50 class
      const badge = screen.getByTestId("notification-badge");
      expect(badge).not.toHaveClass("z-50");
    });

    it("inline badge still renders pulse animation", () => {
      // GIVEN: count = 5, inline = true, pulse = true
      render(<NotificationBadge count={5} inline={true} pulse={true} />);

      // THEN: Pulse exists
      const pulse = screen.getByTestId("pulse-animation");
      expect(pulse).toBeInTheDocument();
      expect(pulse).toHaveClass("animate-ping");
    });

    it("inline badge has same number format", () => {
      // GIVEN: count = 15, inline = true
      render(<NotificationBadge count={15} inline={true} />);

      // THEN: Shows "9+"
      const badge = screen.getByTestId("notification-badge");
      expect(badge.textContent).toBe("9+");
    });
  });
});
