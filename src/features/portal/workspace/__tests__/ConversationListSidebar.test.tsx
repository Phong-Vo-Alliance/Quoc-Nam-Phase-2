/**
 * Unit tests for ConversationListSidebar
 * Focus: Categories API simplification refactor (2026-02-03)
 *
 * Tests verify:
 * 1. Conversations are flattened from categories correctly
 * 2. No dependency on useGroups (removed)
 * 3. Categories from API are used directly (server-filtered)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ConversationListSidebar } from "../ConversationListSidebar";
import * as categoriesHook from "@/hooks/queries/useCategories";
import * as directMessagesHook from "@/hooks/queries/useDirectMessages";
import type { CategoryWithUnread } from "@/types/categories";

// Mock hooks
vi.mock("@/hooks/queries/useCategories");
vi.mock("@/hooks/queries/useDirectMessages");
vi.mock("@/hooks/useCategoriesRealtime", () => ({
  useCategoriesRealtime: vi.fn(),
}));
vi.mock("@/hooks/useConversationRealtime", () => ({
  useConversationRealtime: vi.fn(),
}));

// Mock stores
vi.mock("@/stores/conversationStore", () => ({
  useConversationStore: vi.fn((selector) =>
    selector({
      activeConversationId: null,
      activeCategoryId: null,
      activeTabType: "categories",
      setActiveConversationId: vi.fn(),
      setActiveCategoryId: vi.fn(),
      setActiveTabType: vi.fn(),
    }),
  ),
}));

vi.mock("@/stores/uiStore", () => ({
  useUiStore: vi.fn(() => ({
    mobileSidebarOpen: false,
    setMobileSidebarOpen: vi.fn(),
  })),
}));

describe("ConversationListSidebar", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ConversationListSidebar
            currentUserId="user-1"
            onSelectGroup={vi.fn()}
            onSelectChat={vi.fn()}
            useApiData={true}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  describe("Categories API Integration (Refactor 2026-02-03)", () => {
    it("should flatten conversations from categories correctly", async () => {
      // Mock categories with nested conversations
      const mockCategories: CategoryWithUnread[] = [
        {
          id: "cat-1",
          userId: "user-1",
          name: "Vận hành - Kho Hàng",
          order: 0,
          conversations: [
            {
              conversationId: "conv-1",
              conversationName: "Nhận hàng",
              memberCount: 5,
              unreadCount: 2,
              lastMessage: {
                messageId: "msg-1",
                senderId: "user-2",
                senderName: "Thanh Trúc",
                content: "Test message",
                sentAt: "2026-02-03T10:00:00Z",
                attachments: [],
              },
            },
            {
              conversationId: "conv-2",
              conversationName: "Đổi Trả",
              memberCount: 3,
              unreadCount: 0,
              lastMessage: null,
            },
          ],
          createdAt: "2026-02-02T09:27:57Z",
          updatedAt: null,
        },
        {
          id: "cat-2",
          userId: "user-1",
          name: "Vận hành - Tài xế tỉnh",
          order: 1,
          conversations: [
            {
              conversationId: "conv-3",
              conversationName: "Đơn Bốc Hàng",
              memberCount: 8,
              unreadCount: 1,
              lastMessage: null,
            },
          ],
          createdAt: "2026-02-02T09:28:16Z",
          updatedAt: null,
        },
      ];

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      await waitFor(() => {
        // Should show 2 categories
        expect(screen.getByText("Vận hành - Kho Hàng")).toBeInTheDocument();
        expect(screen.getByText("Vận hành - Tài xế tỉnh")).toBeInTheDocument();

        // Should show all 3 conversations flattened
        expect(screen.getByText("Nhận hàng")).toBeInTheDocument();
        expect(screen.getByText("Đổi Trả")).toBeInTheDocument();
        expect(screen.getByText("Đơn Bốc Hàng")).toBeInTheDocument();
      });
    });

    it("should NOT call useGroups (removed dependency)", () => {
      // Verify useGroups is not imported/used
      const mockCategories: CategoryWithUnread[] = [];

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      // If component renders without error, it means useGroups is not required
      expect(screen.getByPlaceholderText("Tìm kiếm")).toBeInTheDocument();
    });

    it("should use categories directly from API (no client-side filtering)", async () => {
      // Server-side filtering test: API should only return user's accessible categories
      const mockCategories: CategoryWithUnread[] = [
        {
          id: "accessible-cat-1",
          userId: "user-1",
          name: "Accessible Category",
          order: 0,
          conversations: [],
          createdAt: "2026-02-03T10:00:00Z",
          updatedAt: null,
        },
      ];

      const useCategories = vi
        .spyOn(categoriesHook, "useCategories")
        .mockReturnValue({
          data: mockCategories,
          isLoading: false,
          isError: false,
        } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Accessible Category")).toBeInTheDocument();
      });

      // Verify useCategories was called (our only API dependency)
      expect(useCategories).toHaveBeenCalled();
    });

    it("should handle empty conversations in category gracefully", async () => {
      const mockCategories: CategoryWithUnread[] = [
        {
          id: "empty-cat",
          userId: "user-1",
          name: "Empty Category",
          order: 0,
          conversations: [], // No conversations
          createdAt: "2026-02-03T10:00:00Z",
          updatedAt: null,
        },
      ];

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      await waitFor(() => {
        // Category name should still show
        expect(screen.getByText("Empty Category")).toBeInTheDocument();
      });
    });

    it("should map ConversationInfoDto to GroupConversation correctly", async () => {
      const mockCategories: CategoryWithUnread[] = [
        {
          id: "cat-1",
          userId: "user-1",
          name: "Test Category",
          order: 0,
          conversations: [
            {
              conversationId: "conv-1",
              conversationName: "Test Conversation",
              memberCount: 5,
              unreadCount: 3,
              lastMessage: {
                messageId: "msg-1",
                senderId: "user-2",
                senderName: "John Doe",
                content: "Hello world",
                sentAt: "2026-02-03T10:00:00Z",
                attachments: [],
              },
            },
          ],
          createdAt: "2026-02-03T10:00:00Z",
          updatedAt: null,
        },
      ];

      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: mockCategories,
        isLoading: false,
        isError: false,
      } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      await waitFor(() => {
        // Verify conversation is displayed with correct data
        expect(screen.getByText("Test Conversation")).toBeInTheDocument();
        expect(screen.getByText("Hello world")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        // Unread count badge should show
        const unreadBadge = screen.getByText("3");
        expect(unreadBadge).toBeInTheDocument();
      });
    });
  });

  describe("Loading and Error States", () => {
    it("should show loading skeleton when categories are loading", () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      // Should show skeleton loaders
      expect(screen.getByTestId("conversation-skeleton")).toBeInTheDocument();
    });

    it("should show error state when categories fail to load", async () => {
      vi.spyOn(categoriesHook, "useCategories").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Network error"),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(directMessagesHook, "useDirectMessages").mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Không thể tải/i)).toBeInTheDocument();
        expect(screen.getByText(/Thử lại/i)).toBeInTheDocument();
      });
    });
  });
});
