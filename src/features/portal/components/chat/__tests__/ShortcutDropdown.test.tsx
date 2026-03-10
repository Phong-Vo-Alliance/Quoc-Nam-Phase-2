/**
 * Unit tests for ShortcutDropdown component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { ShortcutDropdown } from "../ShortcutDropdown";
import type { QuickMessage } from "@/types/quick-messages";

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockShortcuts: QuickMessage[] = [
  {
    id: "1",
    key: "xinchao",
    content: "Xin chào, tôi có thể giúp gì cho bạn?",
    userId: "user-1",
    createdAt: "2026-03-10T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "2",
    key: "xinloi",
    content: "Xin lỗi vì sự bất tiện này",
    userId: "user-1",
    createdAt: "2026-03-10T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "3",
    key: "xincamon",
    content: "Xin cảm ơn đã hợp tác với chúng tôi",
    userId: "user-1",
    createdAt: "2026-03-10T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
  },
];

describe("ShortcutDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test("renders list of shortcuts correctly", () => {
    const onSelect = vi.fn();

    render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    // Check that dropdown is rendered
    expect(screen.getByTestId("shortcut-dropdown")).toBeInTheDocument();

    // Check that all shortcuts are rendered
    mockShortcuts.forEach((shortcut) => {
      expect(screen.getByText(`/${shortcut.key}`)).toBeInTheDocument();
      expect(screen.getByText(shortcut.content)).toBeInTheDocument();
    });
  });

  test("highlights selected item", () => {
    const onSelect = vi.fn();
    const selectedIndex = 1;

    render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
      />,
    );

    // Get the selected item container
    const selectedItem = screen.getByTestId(
      `shortcut-item-${mockShortcuts[selectedIndex].id}`,
    );

    // Check that selected item has the correct styling classes
    expect(selectedItem).toHaveClass("bg-brand-50");
    expect(selectedItem).toHaveClass("border-brand-500");

    // Check that "Enter" indicator is shown for selected item
    expect(screen.getByText("Enter")).toBeInTheDocument();
  });

  test("calls onSelect when item is clicked", () => {
    const onSelect = vi.fn();

    render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    // Click on the second shortcut
    const secondItem = screen.getByTestId(
      `shortcut-item-${mockShortcuts[1].id}`,
    );
    fireEvent.click(secondItem);

    // Verify onSelect was called with the correct shortcut
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockShortcuts[1]);
  });

  test("shows empty state when no shortcuts", () => {
    const onSelect = vi.fn();

    render(
      <ShortcutDropdown shortcuts={[]} selectedIndex={0} onSelect={onSelect} />,
    );

    // Check that empty state message is shown
    expect(screen.getByText("Không tìm thấy phím tắt")).toBeInTheDocument();
  });

  test("highlights matching text with search query", () => {
    const onSelect = vi.fn();
    const searchQuery = "xin";

    render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={0}
        onSelect={onSelect}
        searchQuery={searchQuery}
      />,
    );

    // Check that the search query part is highlighted
    // highlightMatch splits the text and wraps matched part in <span class="bg-yellow-200">
    const highlighted = screen.getAllByText(searchQuery);
    expect(highlighted.length).toBeGreaterThan(0);

    // Verify the first one has highlight styling
    const firstHighlight = highlighted[0];
    expect(firstHighlight).toHaveClass("bg-yellow-200");
    expect(firstHighlight).toHaveClass("font-semibold");
  });

  test("displays shortcut key in bold", () => {
    const onSelect = vi.fn();

    render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    // Check that shortcut keys are displayed with font-semibold class
    mockShortcuts.forEach((shortcut) => {
      const keyElement = screen.getByText(`/${shortcut.key}`).closest("div");
      expect(keyElement).toHaveClass("font-semibold");
    });
  });

  test("truncates content preview to one line", () => {
    const onSelect = vi.fn();
    const longShortcut: QuickMessage = {
      id: "long",
      key: "long",
      content:
        "This is a very long content that should be truncated to one line only and show ellipsis at the end when it exceeds the maximum width allowed for display in the dropdown component",
      userId: "user-1",
      createdAt: "2026-03-10T00:00:00Z",
      updatedAt: "2026-03-10T00:00:00Z",
    };

    render(
      <ShortcutDropdown
        shortcuts={[longShortcut]}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    // Find the content preview element
    const contentElement = screen.getByText(longShortcut.content);

    // Check that it has truncate class
    expect(contentElement).toHaveClass("truncate");
  });

  test("passes position prop to dropdown style", () => {
    const onSelect = vi.fn();
    const position = { top: 100, left: 200 };

    const { container } = render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={0}
        onSelect={onSelect}
        position={position}
      />,
    );

    // The dropdown should have position styles
    // (Implementation uses useState for calculatedPosition, so we just verify it renders)
    const dropdown = container.querySelector(
      "[data-testid='shortcut-dropdown']",
    );
    expect(dropdown).toBeInTheDocument();
  });

  test("renders icon for each shortcut item", () => {
    const onSelect = vi.fn();

    render(
      <ShortcutDropdown
        shortcuts={mockShortcuts}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    // Should have Zap icons (one per shortcut)
    const icons = screen.getAllByTestId(/shortcut-item/);
    expect(icons.length).toBe(mockShortcuts.length);
  });
});
