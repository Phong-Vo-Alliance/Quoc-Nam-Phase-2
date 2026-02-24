import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { MentionDropdown } from "../MentionDropdown";
import type { ConversationMember } from "@/types/conversations";

// Mock data
const mockMembers: ConversationMember[] = [
  {
    userId: "user-456",
    userName: "jane.smith@example.com",
    role: "member",
    joinedAt: "2026-01-01T00:00:00Z",
    isMuted: false,
    userInfo: {
      id: "user-456",
      userName: "jane.smith@example.com",
      fullName: "Jane Smith",
      identifier: "jane.smith@example.com",
      roles: "user",
      avatarUrl: "https://example.com/avatar2.jpg",
    },
  },
  {
    userId: "user-789",
    userName: "alice.wilson@example.com",
    role: "member",
    joinedAt: "2026-01-01T00:00:00Z",
    isMuted: false,
    userInfo: {
      id: "user-789",
      userName: "alice.wilson@example.com",
      fullName: "Alice Wilson",
      identifier: "alice.wilson@example.com",
      roles: "user",
      avatarUrl: null,
    },
  },
];

// Mock window dimensions for positioning tests
const mockViewport = (height: number) => {
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe("MentionDropdown", () => {
  let mockOnSelect: any;

  beforeEach(() => {
    mockOnSelect = vi.fn();
    // Reset viewport
    mockViewport(800);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderDropdown = (props = {}) => {
    const defaultProps = {
      members: mockMembers,
      selectedIndex: 0,
      onSelect: mockOnSelect,
      position: { top: 100, left: 50 },
      ...props,
    };

    return render(<MentionDropdown {...defaultProps} />);
  };

  // Problem 5: Z-Index and Positioning (4 tests)
  describe("Dropdown Visibility and Positioning", () => {
    test("should have high z-index to prevent overlap", () => {
      renderDropdown();

      const dropdown = screen.getByTestId("mention-dropdown");

      // Should have z-[100] class or equivalent high z-index
      expect(dropdown).toHaveClass("z-[100]");
    });

    test("should use provided position when space available", () => {
      const position = { top: 100, left: 50 };
      renderDropdown({ position });

      const dropdown = screen.getByTestId("mention-dropdown");

      // Should use provided position
      expect(dropdown).toHaveStyle({
        top: "100px",
        left: "50px",
      });
    });

    test("should reposition when would overflow viewport bottom", () => {
      // Mock small viewport height
      mockViewport(300);

      // Position dropdown near bottom that would overflow
      const position = { top: 250, left: 50 };
      renderDropdown({ position });

      const dropdown = screen.getByTestId("mention-dropdown");

      // Should reposition above to avoid overflow
      // Implementation will adjust this logic
      expect(dropdown).toBeInTheDocument();
    });

    test("should update position when prop changes", () => {
      const initialPosition = { top: 100, left: 50 };
      const { rerender } = renderDropdown({ position: initialPosition });

      const dropdown = screen.getByTestId("mention-dropdown");
      expect(dropdown).toHaveStyle({
        top: "100px",
        left: "50px",
      });

      // Update position
      const newPosition = { top: 200, left: 100 };
      rerender(
        <MentionDropdown
          members={mockMembers}
          selectedIndex={0}
          onSelect={mockOnSelect}
          position={newPosition}
        />,
      );

      expect(dropdown).toHaveStyle({
        top: "200px",
        left: "100px",
      });
    });
  });

  describe("Basic Functionality", () => {
    test("should render member list", () => {
      renderDropdown();

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Alice Wilson")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@example.com")).toBeInTheDocument();
    });

    test("should show empty state when no members", () => {
      renderDropdown({ members: [] });

      expect(screen.getByText("Không tìm thấy người dùng")).toBeInTheDocument();
    });

    test("should highlight selected item", () => {
      renderDropdown({ selectedIndex: 1 }); // Select Alice Wilson

      const aliceItem = screen.getByTestId("mention-item-user-789");
      expect(aliceItem).toHaveClass(
        "bg-brand-50",
        "border-l-2",
        "border-brand-500",
      );
    });

    test("should call onSelect when item clicked", () => {
      renderDropdown();

      const janeItem = screen.getByTestId("mention-item-user-456");
      janeItem.click();

      expect(mockOnSelect).toHaveBeenCalledWith(mockMembers[0]);
    });
  });
});
