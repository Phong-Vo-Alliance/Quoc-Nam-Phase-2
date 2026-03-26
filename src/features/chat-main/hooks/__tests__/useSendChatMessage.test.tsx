import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSendChatMessage } from "../useSendChatMessage";
import { useReplyStore } from "@/stores/replyStore";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useMarkConversationAsRead } from "@/hooks/mutations/useMarkConversationAsRead";
import { useUploadFiles } from "@/hooks/mutations/useUploadFiles";
import { useUploadFilesBatch } from "@/hooks/mutations/useUploadFilesBatch";
import { useTypingIndicators } from "@/hooks/useTypingIndicators";
import { useSendTypingIndicator } from "@/hooks/useSendTypingIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { SelectedFile } from "@/types/files";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/hooks/mutations/useSendMessage", () => ({
  useSendMessage: vi.fn(),
}));

vi.mock("@/hooks/mutations/useMarkConversationAsRead", () => ({
  useMarkConversationAsRead: vi.fn(),
}));

vi.mock("@/hooks/mutations/useUploadFiles", () => ({
  useUploadFiles: vi.fn(),
}));

vi.mock("@/hooks/mutations/useUploadFilesBatch", () => ({
  useUploadFilesBatch: vi.fn(),
}));

vi.mock("@/hooks/useTypingIndicators", () => ({
  useTypingIndicators: vi.fn(),
}));

vi.mock("@/hooks/useSendTypingIndicator", () => ({
  useSendTypingIndicator: vi.fn(),
}));

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

describe("useSendChatMessage", () => {
  let queryClient: QueryClient;
  const sendMessageMutateAsync = vi.fn();
  const markAsReadMutate = vi.fn();
  const uploadFilesMutateAsync = vi.fn();
  const uploadBatchMutateAsync = vi.fn();
  const stopTyping = vi.fn();
  const handleTyping = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();

    useReplyStore.setState({
      replyTarget: null,
      _focusInputCallback: null,
    });

    vi.mocked(useSendMessage).mockReturnValue({
      mutateAsync: sendMessageMutateAsync,
    } as any);

    vi.mocked(useMarkConversationAsRead).mockReturnValue({
      mutate: markAsReadMutate,
    } as any);

    vi.mocked(useUploadFiles).mockReturnValue({
      mutateAsync: uploadFilesMutateAsync,
    } as any);

    vi.mocked(useUploadFilesBatch).mockReturnValue({
      mutateAsync: uploadBatchMutateAsync,
    } as any);

    vi.mocked(useTypingIndicators).mockReturnValue({
      typingUsers: [],
    } as any);

    vi.mocked(useSendTypingIndicator).mockReturnValue({
      handleTyping,
      stopTyping,
    } as any);

    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      wasOffline: false,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("does not show a second generic toast when single-file upload already failed", async () => {
    const setUploadProgress = vi.fn();
    const setIsUploading = vi.fn();
    const clearFiles = vi.fn();
    const selectedFiles: SelectedFile[] = [
      {
        id: "file-1",
        file: new File(["content"], "4.jpg", { type: "image/jpeg" }),
      },
    ];

    uploadFilesMutateAsync.mockResolvedValue({
      files: [],
      successCount: 0,
      failedCount: 1,
      errors: [
        {
          file: selectedFiles[0],
          error: "Định dạng file không được hỗ trợ",
        },
      ],
    });

    const { result } = renderHook(
      () =>
        useSendChatMessage({
          workspaceId: "workspace-1",
          conversationId: "conversation-1",
          selectedFiles,
          setUploadProgress,
          setIsUploading,
          clearFiles,
          bottomRef: {
            current: { scrollIntoView: vi.fn() },
          },
          inputRef: {
            current: { focus: vi.fn() },
          },
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleSend("upload test");
    });

    expect(uploadFilesMutateAsync).toHaveBeenCalledTimes(1);
    expect(sendMessageMutateAsync).not.toHaveBeenCalled();
    expect(clearFiles).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalledWith(
      "Tải lên file bị lỗi. Vui lòng thử lại.",
    );
    expect(setIsUploading).toHaveBeenNthCalledWith(1, true);
    expect(setIsUploading).toHaveBeenLastCalledWith(false);
  });
});
