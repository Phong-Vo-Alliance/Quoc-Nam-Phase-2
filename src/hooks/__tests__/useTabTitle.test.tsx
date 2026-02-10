import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { useTabTitle } from "../useTabTitle";
import { conversationKeys } from "../queries/keys/conversationKeys";
import type { GetConversationsResponse } from "@/types/conversations";
import type { DirectConversation } from "@/types/conversations";

// Mock the useDirectMessages hook
vi.mock("../queries/useDirectMessages", () => ({
  useDirectMessages: vi.fn(() => ({ data: undefined })),
}));

import { useDirectMessages } from "../queries/useDirectMessages";

describe("useTabTitle", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    document.title = "Quoc Nam Portal"; // Reset to base title
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const createMockDM = (
    id: string,
    unreadCount: number
  ): DirectConversation => ({
    id,
    type: "DM",
    name: `User ${id}`,
    description: null,
    avatarFileId: null,
    createdBy: "user-other",
    createdByName: "Test User",
    createdAt: "2026-02-05T00:00:00Z",
    updatedAt: null,
    memberCount: 2,
    unreadCount,
    lastMessage: null,
    members: [],
  });

  test("TC-1.1: shows base title when no unread DMs", () => {
    // Setup: 0 unread
    const mockData: GetConversationsResponse = {
      items: [createMockDM("dm-1", 0), createMockDM("dm-2", 0)],
      nextCursor: null,
      hasMore: false,
    };

    // Mock useDirectMessages to return data
    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    expect(document.title).toBe("Quoc Nam Portal");
  });

  test("TC-1.2: shows badge with unread count", async () => {
    // Setup: 3 unread total (2 + 1)
    const mockData: GetConversationsResponse = {
      items: [createMockDM("dm-1", 2), createMockDM("dm-2", 1)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(3) Quoc Nam Portal");
    });
  });

  test("TC-1.3: caps at 99+ for large counts", async () => {
    // Setup: 150 unread
    const mockData: GetConversationsResponse = {
      items: [createMockDM("dm-1", 150)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(99+) Quoc Nam Portal");
    });
  });

  test("TC-1.4: updates when conversations change", async () => {
    // Initial: 1 unread
    const mockData1: GetConversationsResponse = {
      items: [createMockDM("dm-1", 1)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData1],
        pageParams: [undefined],
      },
    } as any);

    const { rerender } = renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(1) Quoc Nam Portal");
    });

    // Update: 3 unread (2 + 1)
    const mockData2: GetConversationsResponse = {
      items: [createMockDM("dm-1", 2), createMockDM("dm-2", 1)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData2],
        pageParams: [undefined],
      },
    } as any);

    rerender();

    await waitFor(() => {
      expect(document.title).toBe("(3) Quoc Nam Portal");
    });
  });

  test("TC-1.5: respects enabled flag", () => {
    const mockData: GetConversationsResponse = {
      items: [createMockDM("dm-1", 5)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle({ enabled: false }), { wrapper });

    // Title should NOT change when disabled
    expect(document.title).toBe("Quoc Nam Portal");
  });

  test("TC-1.6: restores base title on unmount", async () => {
    const mockData: GetConversationsResponse = {
      items: [createMockDM("dm-1", 5)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    const { unmount } = renderHook(() => useTabTitle(), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(5) Quoc Nam Portal");
    });

    unmount();

    expect(document.title).toBe("Quoc Nam Portal");
  });

  test("TC-1.7: handles multiple pages of conversations", async () => {
    // Setup: Multiple pages with unread counts
    const mockPage1: GetConversationsResponse = {
      items: [createMockDM("dm-1", 2), createMockDM("dm-2", 3)],
      nextCursor: "cursor-1",
      hasMore: true,
    };

    const mockPage2: GetConversationsResponse = {
      items: [createMockDM("dm-3", 1), createMockDM("dm-4", 4)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockPage1, mockPage2],
        pageParams: [undefined, "cursor-1"],
      },
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    // Total: 2 + 3 + 1 + 4 = 10
    await waitFor(() => {
      expect(document.title).toBe("(10) Quoc Nam Portal");
    });
  });

  test("TC-1.8: handles null/undefined unreadCount gracefully", async () => {
    const mockData: GetConversationsResponse = {
      items: [
        { ...createMockDM("dm-1", 0), unreadCount: undefined as any },
        { ...createMockDM("dm-2", 0), unreadCount: null as any },
        createMockDM("dm-3", 2),
      ],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    // Should only count dm-3: 2 unread
    await waitFor(() => {
      expect(document.title).toBe("(2) Quoc Nam Portal");
    });
  });

  test("TC-1.9: handles empty conversations list", () => {
    const mockData: GetConversationsResponse = {
      items: [],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    expect(document.title).toBe("Quoc Nam Portal");
  });

  test("TC-1.10: handles undefined conversations data", () => {
    // No data in cache - mock returns undefined
    vi.mocked(useDirectMessages).mockReturnValue({
      data: undefined,
    } as any);

    renderHook(() => useTabTitle(), { wrapper });

    expect(document.title).toBe("Quoc Nam Portal");
  });

  test("TC-1.11: uses custom base title", async () => {
    const mockData: GetConversationsResponse = {
      items: [createMockDM("dm-1", 3)],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(useDirectMessages).mockReturnValue({
      data: {
        pages: [mockData],
        pageParams: [undefined],
      },
    } as any);

    renderHook(() => useTabTitle({ baseTitle: "Custom Portal" }), { wrapper });

    await waitFor(() => {
      expect(document.title).toBe("(3) Custom Portal");
    });
  });
});
