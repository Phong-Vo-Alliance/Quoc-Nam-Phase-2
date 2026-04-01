/**
 * Unit Tests for useSendMessage hook
 *
 * Phase 7+: Optimistic UI + retry tracking + failed state
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSendMessage } from "../useSendMessage";
import { sendMessage } from "@/api/messages.api";
import { addFailedMessage } from "@/utils/storage";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { toast } from "sonner";

// Mock dependencies
vi.mock("@/api/messages.api");
vi.mock("@/utils/storage");
vi.mock("sonner");
vi.mock("@/hooks/useSendTimeout", () => ({
  useSendTimeout: () => ({
    startTimeout: () => new AbortController().signal,
    cancelTimeout: vi.fn(),
    abort: vi.fn(),
  }),
}));
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (
    selector: (s: {
      user: {
        id: string;
        fullName: string;
        identifier: string;
        roles: string[];
      };
    }) => unknown,
  ) =>
    selector({
      user: {
        id: "user-123",
        fullName: "Test User",
        identifier: "test@example.com",
        roles: ["User"],
      },
    }),
}));

describe("useSendMessage", () => {
  let queryClient: QueryClient;

  const mockWorkspaceId = "ws-123";
  const mockConversationId = "conv-123";

  const mockHookOptions = {
    workspaceId: mockWorkspaceId,
    conversationId: mockConversationId,
  };

  const mockNewMessage: ChatMessage = {
    id: "msg-new",
    conversationId: mockConversationId,
    senderId: "user-123",
    senderName: "Test User",
    senderIdentifier: "test@example.com",
    senderFullName: "Test User",
    senderRoles: "User",
    parentMessageId: null,
    quoteMessageId: null,
    quotedMessage: null,
    content: "New message content",
    contentType: "TXT",
    sentAt: "2026-01-06T10:00:00Z",
    editedAt: null,
    linkedTaskId: null,
    reactions: [],
    attachments: [],
    replyCount: 0,
    isStarred: false,
    isPinned: false,
    threadPreview: null,
    mentions: [],
    sendStatus: undefined,
    retryCount: 0,
    unreadReplyCount: 0,
  };

  const mockSendPayload = {
    conversationId: mockConversationId,
    content: "New message content",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Seed a message list into the TanStack Query cache */
  function seedCache(items: ChatMessage[] = []) {
    const data: {
      pages: GetMessagesResponse[];
      pageParams: (string | undefined)[];
    } = {
      pages: [{ items, nextCursor: null, hasMore: false }],
      pageParams: [undefined],
    };
    queryClient.setQueryData(
      messageKeys.conversation(mockConversationId),
      data,
    );
  }

  function getCacheMessages(): ChatMessage[] {
    const data = queryClient.getQueryData<{
      pages: GetMessagesResponse[];
      pageParams: (string | undefined)[];
    }>(messageKeys.conversation(mockConversationId));
    return data?.pages.flatMap((p) => p.items) ?? [];
  }

  // ─── Success Cases ──────────────────────────────────────────────────────────

  // Test Case 1: Success - Send message via API
  it("should send message successfully via API", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce(mockNewMessage);

    const { result } = renderHook(() => useSendMessage(mockHookOptions), {
      wrapper,
    });

    // Send message
    result.current.mutate(mockSendPayload);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify API was called with correct data
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: mockConversationId,
        content: "New message content",
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  // Test Case 2: Success callback
  it("should call onSuccess callback when message is sent", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce(mockNewMessage);
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useSendMessage({ ...mockHookOptions, onSuccess }),
      { wrapper },
    );

    result.current.mutate(mockSendPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith(mockNewMessage);
  });

  // Test Case 3: Error handling - isError state
  it("should set isError state when API rejects", async () => {
    const mockError = new Error("Failed to send message");
    vi.mocked(sendMessage).mockRejectedValueOnce(mockError);
    const onError = vi.fn();

    const { result } = renderHook(
      () => useSendMessage({ ...mockHookOptions, onError }),
      { wrapper },
    );

    result.current.mutate(mockSendPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  // Test Case 4: Message with parent (reply)
  it("should send reply message with parentMessageId", async () => {
    const replyMessage: ChatMessage = {
      ...mockNewMessage,
      id: "msg-reply",
      parentMessageId: "msg-parent",
      content: "This is a reply",
    };

    vi.mocked(sendMessage).mockResolvedValueOnce(replyMessage);

    const { result } = renderHook(() => useSendMessage(mockHookOptions), {
      wrapper,
    });

    result.current.mutate({
      conversationId: mockConversationId,
      content: "This is a reply",
      parentMessageId: "msg-parent",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ parentMessageId: "msg-parent" }),
      expect.anything(),
    );
  });

  // Test Case 5: No duplicate API calls
  it("should not trigger duplicate API calls", async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce(mockNewMessage);

    const { result } = renderHook(() => useSendMessage(mockHookOptions), {
      wrapper,
    });

    result.current.mutate(mockSendPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  // ─── Fail Scenario Tests ───────────────────────────────────────────────────

  describe("fail scenarios", () => {
    // Test Case 6: Optimistic message added as 'sending' before API call
    it("should add optimistic message with sendStatus=sending immediately", async () => {
      // Never resolves — simulates in-flight state
      vi.mocked(sendMessage).mockReturnValueOnce(new Promise(() => {}));
      seedCache([]);

      const { result } = renderHook(() => useSendMessage(mockHookOptions), {
        wrapper,
      });

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      // Wait for onMutate (async) to write optimistic message into cache
      await waitFor(() => {
        expect(getCacheMessages().length).toBeGreaterThan(0);
      });

      // Immediately check cache — optimistic message should be there
      const messages = getCacheMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].sendStatus).toBe("sending");
      expect(messages[0].id).toMatch(/^temp-/);
      expect(messages[0].content).toBe("New message content");
    });

    // Test Case 7: On API error → temp message updated to sendStatus=failed
    it("should update optimistic message to sendStatus=failed on API error", async () => {
      vi.mocked(sendMessage).mockRejectedValueOnce(new Error("Network error"));
      seedCache([]);

      const { result } = renderHook(() => useSendMessage(mockHookOptions), {
        wrapper,
      });

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      const messages = getCacheMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].sendStatus).toBe("failed");
      expect(messages[0].failReason).toBeTruthy();
    });

    // Test Case 8: On API error → addFailedMessage called with correct data
    it("should persist failed message to storage on error", async () => {
      vi.mocked(sendMessage).mockRejectedValueOnce(new Error("Timeout"));
      seedCache([]);

      const { result } = renderHook(() => useSendMessage(mockHookOptions), {
        wrapper,
      });

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(addFailedMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "New message content",
          conversationId: mockConversationId,
          workspaceId: mockWorkspaceId,
        }),
      );
    });

    // Test Case 9: On API error → toast.error shown
    it("should show error toast on API failure", async () => {
      vi.mocked(sendMessage).mockRejectedValueOnce(new Error("Server down"));
      seedCache([]);

      const { result } = renderHook(() => useSendMessage(mockHookOptions), {
        wrapper,
      });

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalled();
    });

    // Test Case 10: On API error → onError callback invoked
    it("should call onError callback on API failure", async () => {
      const networkError = new Error("Connection refused");
      vi.mocked(sendMessage).mockRejectedValueOnce(networkError);
      seedCache([]);

      const onError = vi.fn();
      const { result } = renderHook(
        () => useSendMessage({ ...mockHookOptions, onError }),
        { wrapper },
      );

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(onError).toHaveBeenCalledWith(networkError);
    });

    // Test Case 11: Abort error (timeout) → still marks message as failed
    it("should mark optimistic message as failed on AbortError (timeout)", async () => {
      const abortError = new DOMException("Signal aborted", "AbortError");
      vi.mocked(sendMessage).mockRejectedValueOnce(abortError);
      seedCache([]);

      const { result } = renderHook(() => useSendMessage(mockHookOptions), {
        wrapper,
      });

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      const messages = getCacheMessages();
      expect(messages[0].sendStatus).toBe("failed");
    });

    // Test Case 12: Race condition — if SignalR already delivered real message, remove temp instead of marking failed
    it("should remove temp message (not mark failed) if real message already arrived via SignalR", async () => {
      vi.mocked(sendMessage).mockRejectedValueOnce(new Error("Network flap"));

      // Pre-seed cache with a real (non-temp) message that SignalR already added
      const realMessage: ChatMessage = {
        ...mockNewMessage,
        id: "real-msg-from-signalr",
        senderId: "user-123",
        content: "New message content",
        sendStatus: undefined,
      };
      seedCache([realMessage]);

      const { result } = renderHook(() => useSendMessage(mockHookOptions), {
        wrapper,
      });

      act(() => {
        result.current.mutate(mockSendPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      const messages = getCacheMessages();
      // Real message stays, temp message removed (no 'failed' temp in list)
      const tempMessages = messages.filter((m) => m.id.startsWith("temp-"));
      expect(tempMessages).toHaveLength(0);
      expect(messages.some((m) => m.id === "real-msg-from-signalr")).toBe(true);
    });
  });
});
