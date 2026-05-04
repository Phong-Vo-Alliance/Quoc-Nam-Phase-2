import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { MentionInput } from "../MentionInput";
import { useAuthStore } from "@/stores/authStore";
import { useMentionMembers } from "@/hooks/queries/useMentionMembers";
import type { ConversationMember } from "@/types/conversations";
import type { AuthUser } from "@/stores/authStore";

// Mock dependencies
vi.mock("@/stores/authStore");
vi.mock("@/hooks/queries/useMentionMembers");

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseMentionMembers = vi.mocked(useMentionMembers);

// Mock data
const mockCurrentUser: AuthUser = {
  id: "user-123",
  identifier: "john.doe@example.com",
  fullName: "John Doe",
  roles: ["user"],
};

const mockMembers: ConversationMember[] = [
  {
    userId: "user-123", // Current user
    userName: "john.doe@example.com",
    role: "member",
    joinedAt: "2026-01-01T00:00:00Z",
    isMuted: false,
    userInfo: {
      id: "user-123",
      userName: "john.doe@example.com",
      fullName: "John Doe",
      identifier: "john.doe@example.com",
      roles: "user",
      avatarUrl: "https://example.com/avatar1.jpg",
    },
  },
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

// Test utilities
const typeInInput = async (element: HTMLElement, text: string) => {
  await userEvent.clear(element);
  await userEvent.type(element, text);
};

const setCursorPosition = (element: HTMLTextAreaElement, position: number) => {
  element.setSelectionRange(position, position);
  fireEvent.input(element);
};

describe("MentionInput", () => {
  let queryClient: QueryClient;
  let mockOnChange: any;
  let mockOnSend: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockOnChange = vi.fn();
    mockOnSend = vi.fn();

    // Mock useAuthStore
    mockUseAuthStore.mockReturnValue({
      user: mockCurrentUser,
      accessToken: "token",
      taskAccessToken: null,
      expiresAt: null,
      isAuthenticated: true,
      isLoading: false,
      setUser: vi.fn(),
      setTaskAccessToken: vi.fn(),
      loginSuccess: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
      setLoading: vi.fn(),
    });

    // Mock useMentionMembers
    mockUseMentionMembers.mockReturnValue({
      data: mockMembers,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderMentionInput = (props = {}) => {
    const defaultProps = {
      value: "",
      onChange: mockOnChange,
      onSend: mockOnSend,
      conversationId: "conv-123",
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <MentionInput {...defaultProps} />
      </QueryClientProvider>,
    );
  };

  // Problem 1: Current User Filtering (3 tests)
  describe("Current User Filtering", () => {
    test("should exclude current user from mention dropdown", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "@");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });

      // Should only show other users (Jane Smith, Alice Wilson)
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Alice Wilson")).toBeInTheDocument();

      // Should NOT show current user (John Doe)
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    test("should exclude current user even when search matches their name", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "@Joh");

      await waitFor(() => {
        // Should show no results since only John Doe matches "Joh" and he's current user
        expect(
          screen.getByText("Không tìm thấy người dùng"),
        ).toBeInTheDocument();
      });
    });

    test("should show empty state when only current user matches search", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "@John");

      await waitFor(() => {
        expect(
          screen.getByText("Không tìm thấy người dùng"),
        ).toBeInTheDocument();
      });
    });
  });

  // Problem 2: Tab Key Support (2 tests)
  describe("Tab Key Support", () => {
    test("should select mention when Tab is pressed", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "@jane");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });

      // Press ArrowDown to highlight Jane Smith (first result)
      await user.keyboard("{ArrowDown}");

      // Press Tab to select
      await user.keyboard("{Tab}");

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.stringContaining("@Jane Smith"),
        );
        expect(
          screen.queryByTestId("mention-dropdown"),
        ).not.toBeInTheDocument();
      });
    });

    test("should prevent default Tab behavior when dropdown is open", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "@");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });

      const tabEvent = { key: "Tab", preventDefault: vi.fn() };
      fireEvent.keyDown(textarea, tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();
    });
  });

  // Problem 3: Text Insertion Accuracy (4 tests)
  describe("Text Insertion Accuracy", () => {
    test("should not duplicate text when inserting mention mid-sentence", async () => {
      const user = userEvent.setup();
      renderMentionInput({ value: "dạ cậu anh đồ thịt" });

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // Position cursor after "cậu " (position 7)
      setCursorPosition(textarea, 7);

      await user.type(textarea, "@jane");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });

      // Select Jane Smith
      await user.keyboard("{Enter}");

      await waitFor(() => {
        // Expected: "dạ cậu @Jane Smith anh đồ thịt" (no duplication)
        expect(mockOnChange).toHaveBeenCalledWith(
          "dạ cậu @Jane Smith anh đồ thịt",
        );
      });
    });

    test("should handle mention insertion at text beginning", async () => {
      const user = userEvent.setup();
      renderMentionInput({ value: "world" });

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // Position cursor at start (position 0)
      setCursorPosition(textarea, 0);

      await user.type(textarea, "@jane");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });

      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("@Jane Smith world");
      });
    });

    test("should handle mention insertion at text end", async () => {
      const user = userEvent.setup();
      renderMentionInput({ value: "Hello" });

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // Position cursor at end
      setCursorPosition(textarea, 5);

      await user.type(textarea, " @jane");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });

      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("Hello @Jane Smith ");
      });
    });

    test("should position cursor correctly after mention insertion", async () => {
      const user = userEvent.setup();
      renderMentionInput({ value: "Hello" });

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      setCursorPosition(textarea, 5);

      await user.type(textarea, " @jane");
      await waitFor(() =>
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument(),
      );
      await user.keyboard("{Enter}");

      await waitFor(() => {
        // Cursor should be after "@Jane Smith " (position 18)
        const expectedPosition = "Hello @Jane Smith ".length;
        expect(textarea.selectionStart).toBe(expectedPosition);
        expect(textarea.selectionEnd).toBe(expectedPosition);
      });
    });
  });

  // Problem 4: Multi-line Paste Detection (3 tests)
  describe("Multi-line Paste Detection", () => {
    test("should detect @ after newline character", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");

      // Paste text with newline, then type @
      await user.clear(textarea);
      await user.type(textarea, "Line1\\nLine2");
      fireEvent.change(textarea, { target: { value: "Line1\nLine2" } });

      // Position after newline and type @
      setCursorPosition(textarea as HTMLTextAreaElement, 7); // After \n
      await user.type(textarea, "@");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });
    });

    test("should detect @ after carriage return", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");

      // Text with \r character
      fireEvent.change(textarea, { target: { value: "Line1\rLine2" } });
      setCursorPosition(textarea as HTMLTextAreaElement, 7); // After \r

      await user.type(textarea, "@");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });
    });

    test("should detect @ after tab character", async () => {
      const user = userEvent.setup();
      renderMentionInput();

      const textarea = screen.getByRole("textbox");

      // Text with \t character
      fireEvent.change(textarea, { target: { value: "Text\tMore" } });
      setCursorPosition(textarea as HTMLTextAreaElement, 5); // After \t

      await user.type(textarea, "@");

      await waitFor(() => {
        expect(screen.getByTestId("mention-dropdown")).toBeInTheDocument();
      });
    });
  });
});
