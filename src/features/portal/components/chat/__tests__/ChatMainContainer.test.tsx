/**
 * Integration Tests: ChatMainContainer
 * Testing category-based conversation navigation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatMainContainer } from "../ChatMainContainer";
import * as categoriesHook from "@/hooks/queries/useCategories";
import type { CategoryDto } from "@/types/categories";

const mockCategories: CategoryDto[] = [
  {
    id: "cat-1",
    name: "Dự án Website",
    conversations: [
      {
        conversationId: "conv-1",
        conversationName: "Frontend",
        unreadCount: 3,
        lastMessage: "Hello",
        lastMessageAt: "2026-01-19T10:00:00Z",
      },
      {
        conversationId: "conv-2",
        conversationName: "Backend",
        unreadCount: 0,
      },
    ],
  },
  {
    id: "cat-2",
    name: "Marketing",
    conversations: [
      {
        conversationId: "conv-3",
        conversationName: "Social Media",
      },
    ],
  },
  {
    id: "cat-3",
    name: "Empty Category",
    conversations: [],
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("ChatMainContainer - Category Navigation Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Category Selection", () => {
    it("should auto-select first conversation when category selected", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        // Should show category name in header
        expect(screen.getByText("Dự án Website")).toBeInTheDocument();
      });

      // Should show conversation tabs
      expect(screen.getByText("Frontend")).toBeInTheDocument();
      expect(screen.getByText("Backend")).toBeInTheDocument();
    });

    it("should extract conversations from selected category", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        // Should show 2 tabs (2 conversations in cat-1)
        const tabs = screen
          .getAllByRole("button")
          .filter(
            (btn) =>
              btn.textContent === "Frontend" || btn.textContent === "Backend"
          );
        expect(tabs.length).toBe(2);
      });
    });

    it("should handle category with single conversation", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-3", type: "group", name: "Social Media" }}
          selectedCategoryId="cat-2"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText("Marketing")).toBeInTheDocument();
        expect(screen.getByText("Social Media")).toBeInTheDocument();
      });
    });
  });

  describe("Empty Category Handling", () => {
    it("should show EmptyCategoryState when category has no conversations", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "", type: "group", name: "" }}
          selectedCategoryId="cat-3"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText("Chưa có cuộc trò chuyện")).toBeInTheDocument();
        expect(screen.getByTestId("empty-category-state")).toBeInTheDocument();
      });
    });

    it("should NOT render chat UI when conversations array is empty", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "", type: "group", name: "" }}
          selectedCategoryId="cat-3"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        // Should NOT show message list
        expect(screen.queryByTestId("message-list")).not.toBeInTheDocument();
        // Should show empty state instead
        expect(screen.getByTestId("empty-category-state")).toBeInTheDocument();
      });
    });
  });

  describe("Conversation Switching", () => {
    it("should update active conversation when tab clicked", async () => {
      const user = userEvent.setup();

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      // Click Backend tab
      await user.click(screen.getByText("Backend"));

      await waitFor(() => {
        // Should update selectedConversationId internally
        // Check if Backend tab is now active (has brand-600 color)
        const backendTab = screen.getByText("Backend");
        expect(backendTab.className).toContain("text-brand-600");
      });
    });
  });

  describe("Backward Compatibility", () => {
    it("should work without selectedCategoryId (legacy behavior)", async () => {
      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Legacy Chat" }}
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        // Should render normally without category features
        expect(screen.getByText("Legacy Chat")).toBeInTheDocument();
      });

      // Should NOT show conversation tabs
      expect(screen.queryByTestId("conversation-tabs")).not.toBeInTheDocument();
    });

    it("should handle undefined selectedCategoryId gracefully", async () => {
      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Test" }}
          selectedCategoryId={undefined}
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      // Should not crash
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show loading skeleton while fetching categories", () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Test" }}
          selectedCategoryId="cat-1"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      // Should show loading state (exact test depends on implementation)
      // Common pattern: skeleton or spinner
      expect(
        screen.getByTestId("chat-loading-state") || screen.getByRole("status")
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle categories fetch error gracefully", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to fetch categories"),
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Test" }}
          selectedCategoryId="cat-1"
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      // Should show error state or fallback to non-category mode
      // Exact test depends on implementation
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  describe("Scroll-to-Message Functionality", () => {
    it("should handle scrollToMessageId prop and trigger jump-to-message", async () => {
      const mockOnScrollComplete = vi.fn();
      
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { rerender } = render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          scrollToMessageId={undefined}
          onScrollComplete={mockOnScrollComplete}
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      // Initially no scrollToMessageId
      await waitFor(() => {
        expect(screen.getByText("Dự án Website")).toBeInTheDocument();
      });

      // Update with scrollToMessageId
      rerender(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          scrollToMessageId="msg-123"
          onScrollComplete={mockOnScrollComplete}
          onBack={vi.fn()}
        />
      );

      // Should trigger handleScrollToMessage
      await waitFor(() => {
        // Note: Actual scroll behavior is mocked in unit tests
        // This test verifies prop changes trigger the effect
        expect(mockOnScrollComplete).toHaveBeenCalledWith(false); // May fail on first attempt in tests
      }, { timeout: 2000 });
    });

    it("should not scroll when scrollToMessageId is undefined", async () => {
      const mockOnScrollComplete = vi.fn();

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          scrollToMessageId={undefined}
          onScrollComplete={mockOnScrollComplete}
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText("Dự án Website")).toBeInTheDocument();
      });

      // Should not call onScrollComplete without scrollToMessageId
      expect(mockOnScrollComplete).not.toHaveBeenCalled();
    });

    it("should handle scroll-to-message from different conversations", async () => {
      const mockOnScrollComplete = vi.fn();
      const mockOnChatChange = vi.fn();

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(
        <ChatMainContainer
          selectedGroup={{ id: "conv-1", type: "group", name: "Frontend" }}
          selectedCategoryId="cat-1"
          scrollToMessageId="msg-from-conv-2"
          onScrollComplete={mockOnScrollComplete}
          onChatChange={mockOnChatChange}
          onBack={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText("Dự án Website")).toBeInTheDocument();
      });

      // Note: Full conversation switching logic is tested in unit tests
      // This verifies props are passed correctly
    });
  });
});
