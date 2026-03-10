import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MentionInputInline } from "../MentionInputInline";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";
import { useQuickMessagesStore } from "@/stores/quickMessagesStore";

// Mock hooks
vi.mock("@/hooks/queries/useConversationMembers");
vi.mock("@/stores/authStore");
vi.mock("@/stores/quickMessagesStore");
vi.mock("@/hooks/useQuickMessageReplacement", () => ({
  useQuickMessageReplacement: () => vi.fn((text: string) => text),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockMembers = [
  {
    userId: "2",
    userName: "John Doe",
    userInfo: {
      fullName: "John Doe",
      identifier: "johndoe",
    },
  },
  {
    userId: "3",
    userName: "Jane Smith",
    userInfo: {
      fullName: "Jane Smith",
      identifier: "janesmith",
    },
  },
];

const mockShortcuts = [
  {
    id: "1",
    key: "/xinchao",
    content: "Xin chào, tôi có thể giúp gì cho bạn?",
  },
  {
    id: "2",
    key: "/thanks",
    content: "Cảm ơn bạn đã hỗ trợ!",
  },
  {
    id: "3",
    key: "/brb",
    content: "Tôi sẽ quay lại sau!",
  },
];

describe("MentionInputInline - Shortcut Dropdown Integration", () => {
  const mockOnChange = vi.fn();
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useConversationMembers
    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockMembers,
      isLoading: false,
      isError: false,
    } as any);

    // Mock useAuthStore
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: "1", fullName: "Current User" },
    } as any);

    // Mock useQuickMessagesStore
    vi.mocked(useQuickMessagesStore).mockReturnValue(mockShortcuts);
  });

  test("renders input component correctly", () => {
    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId="conv1"
      />,
    );

    const editor = screen.getByTestId("mention-input");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "true");
  });

  test("renders with placeholder", () => {
    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId="conv1"
        placeholder="Test placeholder"
      />,
    );

    const editor = screen.getByTestId("mention-input");
    expect(editor).toHaveAttribute("data-placeholder", "Test placeholder");
  });

  test("supports disabled state", () => {
    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId="conv1"
        disabled
      />,
    );

    const editor = screen.getByTestId("mention-input");
    expect(editor).toHaveAttribute("contenteditable", "false");
  });

  test("applies custom className", () => {
    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId="conv1"
        className="custom-class"
      />,
    );

    const container = screen.getByTestId("mention-input").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  test("loads shortcut data from useQuickMessagesStore", () => {
    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId="conv1"
      />,
    );

    expect(useQuickMessagesStore).toHaveBeenCalled();
  });

  test("loads conversation members from useConversationMembers", () => {
    const conversationId = "test-conv";
    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId={conversationId}
      />,
    );

    expect(useConversationMembers).toHaveBeenCalledWith({
      conversationId,
      enabled: true,
    });
  });

  test("does not fetch members when conversationId is undefined", () => {
    vi.clearAllMocks();

    render(
      <MentionInputInline
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        conversationId={undefined}
      />,
    );

    expect(useConversationMembers).toHaveBeenCalledWith({
      conversationId: "",
      enabled: false,
    });
  });
});

/**
 * NOTE: Advanced integration tests for shortcut dropdown triggering
 * are challenging with contenteditable elements in JSDOM testing environment.
 *
 * The component's logic for detecting "/" and showing the dropdown relies on:
 * - DOM Selection API (window.getSelection, Range)
 * - Cursor position calculations (getBoundingClientRect)
 * - ContentEditable input events with proper DOM structure
 *
 * These are partially supported in JSDOM and would require complex mocking
 * or end-to-end testing (Playwright) for full coverage.
 *
 * What we test here:
 * ✅ Component renders correctly
 * ✅ Props are applied (disabled, placeholder, className)
 * ✅ Data hooks are called (useQuickMessagesStore, useConversationMembers)
 * ✅ ShortcutDropdown component itself (see ShortcutDropdown.test.tsx)
 *
 * What requires E2E testing:
 * 🔄 Typing "/" triggers dropdown
 * 🔄 Filtering shortcuts by search query
 * 🔄 Keyboard navigation (ArrowUp/Down/Enter/Tab/Escape)
 * 🔄 Click selection
 * 🔄 Auto-replace logic interaction
 *
 * E2E test location: tests/e2e/chat/shortcut-dropdown.spec.ts
 */
