// Unit tests for useMessagesAround hook

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMessagesAround } from "../useMessagesAround";
import * as messagesApi from "@/api/messages.api";
import type { GetMessagesResponse } from "@/types/messages";

// Mock the API
vi.mock("@/api/messages.api");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        retryDelay: 1, // Minimal delay for tests
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMessagesAround", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch messages around target message successfully", async () => {
    const mockResponse: GetMessagesResponse = {
      items: [
        {
          id: "msg-1",
          conversationId: "conv-123",
          senderId: "user-1",
          senderName: "User 1",
          content: "Message 1",
          contentType: "TXT",
          sentAt: "2025-02-03T10:00:00Z",
          replyCount: 0,
          isStarred: false,
          isPinned: false,
        },
        {
          id: "msg-25",
          conversationId: "conv-123",
          senderId: "user-2",
          senderName: "User 2",
          content: "Target message",
          contentType: "TXT",
          sentAt: "2025-02-03T11:00:00Z",
          replyCount: 0,
          isStarred: false,
          isPinned: true,
        },
        {
          id: "msg-50",
          conversationId: "conv-123",
          senderId: "user-3",
          senderName: "User 3",
          content: "Message 50",
          contentType: "TXT",
          sentAt: "2025-02-03T12:00:00Z",
          replyCount: 0,
          isStarred: false,
          isPinned: false,
        },
      ],
      nextCursor: "msg-50",
      hasMore: true,
    };

    vi.mocked(messagesApi.getMessagesAround).mockResolvedValueOnce(
      mockResponse,
    );

    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "msg-25",
          limit: 50,
        }),
      { wrapper: createWrapper() },
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify API was called with correct params
    expect(messagesApi.getMessagesAround).toHaveBeenCalledWith({
      conversationId: "conv-123",
      aroundMessageId: "msg-25",
      limit: 50,
    });

    // Verify data
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.data?.items.length).toBe(3);
    expect(result.current.data?.items[1].id).toBe("msg-25"); // Target message
  });

  it("should respect enabled flag", () => {
    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "msg-456",
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    // Query should not run
    expect(result.current.fetchStatus).toBe("idle");
    expect(messagesApi.getMessagesAround).not.toHaveBeenCalled();
  });

  it("should not fetch when conversationId is missing", () => {
    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "",
          aroundMessageId: "msg-456",
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(messagesApi.getMessagesAround).not.toHaveBeenCalled();
  });

  it("should not fetch when aroundMessageId is missing", () => {
    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "",
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(messagesApi.getMessagesAround).not.toHaveBeenCalled();
  });

  it("should handle 404 error when message not found", async () => {
    const mockError = {
      response: { status: 404 },
      message: "Message not found",
    };

    vi.mocked(messagesApi.getMessagesAround).mockRejectedValueOnce(mockError);

    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "deleted-msg",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });

  it("should handle 403 error when unauthorized", async () => {
    const mockError = {
      response: { status: 403 },
      message: "Forbidden",
    };

    vi.mocked(messagesApi.getMessagesAround).mockRejectedValueOnce(mockError);

    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "msg-456",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });

  it("should use default limit of 50", async () => {
    const mockResponse: GetMessagesResponse = {
      items: [],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(messagesApi.getMessagesAround).mockResolvedValueOnce(
      mockResponse,
    );

    renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "msg-456",
          // No limit specified
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(messagesApi.getMessagesAround).toHaveBeenCalledWith({
        conversationId: "conv-123",
        aroundMessageId: "msg-456",
        limit: 50, // Default value
      }),
    );
  });

  it("should allow custom limit", async () => {
    const mockResponse: GetMessagesResponse = {
      items: [],
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(messagesApi.getMessagesAround).mockResolvedValueOnce(
      mockResponse,
    );

    renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "msg-456",
          limit: 100,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(messagesApi.getMessagesAround).toHaveBeenCalledWith({
        conversationId: "conv-123",
        aroundMessageId: "msg-456",
        limit: 100,
      }),
    );
  });

  it("should only retry once on failure", async () => {
    const mockError = new Error("Network error");

    vi.mocked(messagesApi.getMessagesAround).mockRejectedValue(mockError);

    const { result } = renderHook(
      () =>
        useMessagesAround({
          conversationId: "conv-123",
          aroundMessageId: "msg-456",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be called exactly twice (initial + 1 retry)
    expect(messagesApi.getMessagesAround).toHaveBeenCalledTimes(2);
  });
});
