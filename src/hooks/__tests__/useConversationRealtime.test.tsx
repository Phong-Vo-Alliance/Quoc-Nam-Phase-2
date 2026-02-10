import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConversationRealtime } from "../useConversationRealtime";
import { chatHub, SIGNALR_EVENTS } from "@/lib/signalr";
import { conversationKeys } from "../queries/keys/conversationKeys";
import { toast } from "sonner"; // 🆕 For toast notification tests

vi.mock("@/lib/signalr", () => ({
  chatHub: {
    on: vi.fn(),
    off: vi.fn(),
    joinGroup: vi.fn(() => Promise.resolve()),
    leaveGroup: vi.fn(() => Promise.resolve()),
  },
  SIGNALR_EVENTS: {
    MESSAGE_SENT: "MessageSent",
    RECEIVE_MESSAGE: "ReceiveMessage",
    MESSAGE_READ: "MessageRead",
    CONVERSATION_UPDATED: "ConversationUpdated",
    CONVERSATION_CREATED: "ConversationCreated",
  },
}));

vi.mock("../queries/useCategories", () => ({
  useCategories: vi.fn(() => ({ data: [] })),
  categoriesKeys: {
    all: ["categories"],
    list: () => ["categories", "list"],
  },
}));

vi.mock("@/providers/SignalRProvider", () => ({
  useSignalRConnection: vi.fn(() => ({ isConnected: true })),
}));

// 🆕 Mock toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// 🆕 Mock conversations API for fetching members
vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(() => Promise.resolve([
    {
      userId: "user-1",
      conversationId: "conv-dm-1",
      userInfo: {
        id: "user-1",
        fullName: "John Doe",
        email: "john@example.com",
      },
      roles: [],
      joinedAt: "2024-01-01T00:00:00Z",
    },
    {
      userId: "user-2",
      conversationId: "conv-dm-1",
      userInfo: {
        id: "user-2",
        fullName: "Current User",
        email: "current@example.com",
      },
      roles: [],
      joinedAt: "2024-01-01T00:00:00Z",
    },
  ])),
}));

describe("useConversationRealtime", () => {
  let queryClient: QueryClient;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    queryClient = new QueryClient();
    eventHandlers = new Map();

    vi.mocked(chatHub.on).mockImplementation(
      (event: string, handler: Function) => {
        eventHandlers.set(event, handler);
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
  });

  test("TC-7.1: registers SignalR event listeners on mount", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    // Refactored hook only listens to these 3 events (MESSAGE_SENT moved to useMessageRealtime)
    expect(chatHub.on).toHaveBeenCalledWith(
      SIGNALR_EVENTS.MESSAGE_READ,
      expect.any(Function)
    );
    expect(chatHub.on).toHaveBeenCalledWith(
      SIGNALR_EVENTS.CONVERSATION_UPDATED,
      expect.any(Function)
    );
    expect(chatHub.on).toHaveBeenCalledWith(
      SIGNALR_EVENTS.CONVERSATION_CREATED,
      expect.any(Function)
    );
  });

  test("TC-7.2: unregisters listeners on unmount", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = renderHook(() => useConversationRealtime(), {
      wrapper,
    });

    unmount();

    // Hook has 2 useEffects that cleanup:
    // 1. SignalR listeners: 3 off calls (MESSAGE_READ, CONVERSATION_UPDATED, CONVERSATION_CREATED)
    // 2. Group join/leave: 0 off calls (uses leaveGroup instead)
    // But effects may cleanup multiple times during unmount
    expect(chatHub.off).toHaveBeenCalled();
    expect(chatHub.off).toHaveBeenCalledWith(SIGNALR_EVENTS.MESSAGE_READ, expect.any(Function));
    expect(chatHub.off).toHaveBeenCalledWith(SIGNALR_EVENTS.CONVERSATION_UPDATED, expect.any(Function));
    expect(chatHub.off).toHaveBeenCalledWith(SIGNALR_EVENTS.CONVERSATION_CREATED, expect.any(Function));
  });

  // TC-7.3 to TC-7.8: REMOVED - MESSAGE_SENT handling moved to useMessageRealtime
  // These tests are now covered in useMessageRealtime.test.tsx

  test("TC-7.6: clears unreadCount when MessageRead received", async () => {
    // Setup directs cache with unread conversation
    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [{ items: [{ id: "conv-1", unreadCount: 5 }] }],
      pageParams: [],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.MESSAGE_READ);
    handler!({ conversationId: "conv-1", userId: "user-1" });

    await waitFor(() => {
      const data: any = queryClient.getQueryData(conversationKeys.directs());
      expect(data.pages[0].items[0].unreadCount).toBe(0); // Cleared
    });
  });

  test("TC-7.7: logs warning on ConversationUpdated (fallback)", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_UPDATED);
    handler!();

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("ConversationUpdated fallback triggered")
      );
    });

    consoleWarnSpy.mockRestore();
  });

  test("TC-7.9: adds new group conversation to categories cache on ConversationCreated", async () => {
    const mockCategories = [
      {
        id: "cat-1",
        name: "Category 1",
        userId: "user-1",
        order: 0,
        conversations: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: null,
      },
    ];

    const { useCategories } = await import("../queries/useCategories");
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
    } as any);

    queryClient.setQueryData(["categories", "list"], mockCategories);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
    const newConversation = {
      id: "conv-new",
      type: "GRP",
      name: "New Group",
      description: "Test group",
      avatarFileId: null,
      createdBy: "user-1",
      createdByName: "Test User",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: null,
      memberCount: 5,
      unreadCount: 0,
      lastMessage: null,
      categories: [{ id: "cat-1", name: "Category 1" }],
      members: null,
    };

    handler!(newConversation);

    await waitFor(() => {
      const updatedCategories = queryClient.getQueryData<any[]>([
        "categories",
        "list",
      ]);
      expect(updatedCategories).toBeDefined();
      expect(updatedCategories![0].conversations).toHaveLength(1);
      expect(updatedCategories![0].conversations[0].conversationId).toBe(
        "conv-new"
      );
      expect(updatedCategories![0].conversations[0].conversationName).toBe(
        "New Group"
      );
    });
  });

  test("TC-7.10: adds new DM conversation to directs cache on ConversationCreated", async () => {
    const mockDirectsData = {
      pages: [
        {
          items: [],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    };

    queryClient.setQueryData(conversationKeys.directs(), mockDirectsData);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
    const newDMConversation = {
      id: "conv-dm-1",
      type: "DM",
      name: "John Doe",
      description: null,
      avatarFileId: null,
      createdBy: "user-1",
      createdByName: "Test User",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: null,
      memberCount: 2,
      unreadCount: 0,
      lastMessage: null,
      categories: null,
      members: [],
    };

    handler!(newDMConversation);

    await waitFor(() => {
      const updatedDirects = queryClient.getQueryData<any>(
        conversationKeys.directs()
      );
      expect(updatedDirects).toBeDefined();
      expect(updatedDirects.pages[0].items).toHaveLength(1);
      expect(updatedDirects.pages[0].items[0].id).toBe("conv-dm-1");
      expect(updatedDirects.pages[0].items[0].type).toBe("DM");
    });
  });

  test("TC-7.11: invalidates cache when no cache exists for ConversationCreated", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
    const newConversation = {
      id: "conv-new",
      type: "GRP",
      name: "New Group",
      description: null,
      avatarFileId: null,
      createdBy: "user-1",
      createdByName: "Test User",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: null,
      memberCount: 5,
      unreadCount: 0,
      lastMessage: null,
      categories: [{ id: "cat-1", name: "Category 1" }],
      members: null,
    };

    handler!(newConversation);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["categories"],
      });
    });
  });

  // 🆕 NEW: Toast notification tests
  test("TC-7.12: shows toast notification when DM conversation created", async () => {
    const mockToast = vi.mocked(toast.info);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
    const dmConversationEvent = {
      id: "conv-dm-toast",
      type: "DM",
      name: "John Doe",
      createdBy: "user-john",
      createdByName: "John Doe",
      createdAt: "2026-02-05T10:00:00Z",
      updatedAt: null,
      memberCount: 2,
      unreadCount: 0,
      lastMessage: null,
      categories: null,
      avatarFileId: null,
      description: null,
      members: [],
    };

    handler!(dmConversationEvent);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "John Doe wants to chat with you",
        expect.objectContaining({
          duration: 5000,
          description: "New direct message conversation",
        })
      );
    });
  });

  test("TC-7.13: does NOT show toast for group conversations", async () => {
    const mockToast = vi.mocked(toast.info);
    mockToast.mockClear(); // Clear previous calls

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
    const groupConversationEvent = {
      id: "conv-grp-no-toast",
      type: "GRP",
      name: "Project Team",
      createdBy: "user-leader",
      createdByName: "Team Leader",
      createdAt: "2026-02-05T10:00:00Z",
      updatedAt: null,
      memberCount: 5,
      unreadCount: 0,
      lastMessage: null,
      categories: [{ id: "cat-1", name: "Engineering" }],
      avatarFileId: null,
      description: "Team collaboration",
      members: null,
    };

    handler!(groupConversationEvent);

    // Wait a bit to ensure no toast is shown
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockToast).not.toHaveBeenCalled();
  });

  test("TC-7.14: handles DM conversation without createdByName gracefully", async () => {
    const mockToast = vi.mocked(toast.info);
    mockToast.mockClear();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useConversationRealtime(), { wrapper });

    const handler = eventHandlers.get(SIGNALR_EVENTS.CONVERSATION_CREATED);
    const dmWithoutName = {
      id: "conv-dm-no-name",
      type: "DM",
      name: null,
      createdBy: "user-anonymous",
      createdByName: null, // No name
      createdAt: "2026-02-05T10:00:00Z",
      updatedAt: null,
      memberCount: 2,
      unreadCount: 0,
      lastMessage: null,
      categories: null,
      avatarFileId: null,
      description: null,
      members: [],
    };

    handler!(dmWithoutName);

    // Should NOT show toast when createdByName is null
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockToast).not.toHaveBeenCalled();
  });
});
