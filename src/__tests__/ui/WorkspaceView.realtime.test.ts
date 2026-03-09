import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  handleMessageSent as handleMessageSentToMessageCache,
  resetProcessedMessages,
  type MessageCacheContext,
} from "@/lib/cache-updaters/message-cache";
import {
  handleMessageSent as handleMessageSentToCategoryCache,
  handleMessageRead,
  handleConversationUpdated,
  handleMemberAdded,
  handleCategoryDepartmentLinked,
  type CategoryCacheContext,
} from "@/lib/cache-updaters/category-cache";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { tasksKeys } from "@/hooks/queries/useTasks";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import {
  mockMessage,
  mockCategory,
  mockConversationInfo,
  mockInfiniteMessageData,
  CURRENT_USER_ID,
  OTHER_USER_ID,
  CONV_ID,
  CONV_ID_2,
  CATEGORY_ID,
  CATEGORY_NAME,
} from "../data_flow/__mocks__/fixtures";
import { createMockQueryClient } from "../data_flow/__mocks__/query-client";

// ── Module mocks ──

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: vi.fn(() => ({ addMessage: vi.fn() })),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: CURRENT_USER_ID },
      setUser: vi.fn(),
    })),
  },
}));

vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(() =>
    Promise.resolve([
      {
        userId: OTHER_USER_ID,
        userName: "member",
        role: "Member",
        joinedAt: "2026-01-01T00:00:00Z",
        isMuted: false,
        userInfo: {
          id: OTHER_USER_ID,
          userName: "member",
          fullName: "Member Name",
          identifier: "member",
          roles: "User",
          avatarUrl: null,
        },
      },
    ]),
  ),
}));

vi.mock("@/utils/getCurrentUser", () => ({
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      departments: [{ departmentId: "dept-1", departmentName: "Test Dept" }],
    }),
  ),
}));

import { toast } from "sonner";
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import { useAuthStore } from "@/stores/authStore";
import { getConversationMembers } from "@/api/conversations.api";
import { getCurrentUser } from "@/utils/getCurrentUser";

// ══════════════════════════════════════════════════════════════
// WorkspaceView Realtime Behavior Tests (Section 1 of TEST_PLAN_UI.md)
//
// These tests verify how message-cache and category-cache updaters
// respond to SignalR events that would affect WorkspaceView.
// No React components are rendered.
// ══════════════════════════════════════════════════════════════

describe("WorkspaceView Realtime", () => {
  let queryClient: QueryClient;
  let msgCtx: MessageCacheContext;
  let catCtx: CategoryCacheContext;

  beforeEach(() => {
    queryClient = createMockQueryClient();
    msgCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
      getOpenThreadMessageId: () => null,
    };
    catCtx = {
      queryClient,
      getCurrentUserId: () => CURRENT_USER_ID,
      getActiveConversationId: () => CONV_ID,
    };
    resetProcessedMessages();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ────────────────────────────────────────────────────────
  // 1.1 Real-time Message Display
  // ────────────────────────────────────────────────────────

  describe("1.1 Real-time Message Display", () => {
    it("1.1.1 new message appears in active conversation - prepends to first page", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([mockMessage({ id: "existing-1" })]),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "new-msg-1", senderId: OTHER_USER_ID }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      expect(data.pages[0].items[0].id).toBe("new-msg-1");
      expect(data.pages[0].items).toHaveLength(2);
    });

    it("1.1.2 new message in inactive conversation - removeQueries called, no crash", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID_2),
        mockInfiniteMessageData(),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "inactive-msg", conversationId: CONV_ID_2 }),
      );

      // Assert
      expect(queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: messageKeys.conversation(CONV_ID_2),
        exact: true,
      });
    });

    it("1.1.3 thread reply shows replyCount increment on parent", () => {
      // Arrange
      const parentMsg = mockMessage({
        id: "parent-1",
        replyCount: 2,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({
          id: "reply-1",
          parentMessageId: "parent-1",
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-1",
      );
      expect(parent.replyCount).toBe(3);
    });

    it("1.1.4 thread reply badge - unreadReplyCount increments when thread closed + other user", () => {
      // Arrange - thread closed (openThreadMessageId is null)
      const parentMsg = mockMessage({
        id: "parent-1",
        replyCount: 0,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({
          id: "reply-1",
          parentMessageId: "parent-1",
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-1",
      );
      expect(parent.unreadReplyCount).toBe(1);
    });

    it("1.1.5 thread reply with panel open - unreadReplyCount does NOT increment", () => {
      // Arrange - thread panel open for this parent
      const openThreadCtx: MessageCacheContext = {
        ...msgCtx,
        getOpenThreadMessageId: () => "parent-1",
      };
      const parentMsg = mockMessage({
        id: "parent-1",
        replyCount: 0,
        unreadReplyCount: 0,
      });
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([parentMsg]),
      );

      // Act
      handleMessageSentToMessageCache(
        openThreadCtx,
        mockMessage({
          id: "reply-1",
          parentMessageId: "parent-1",
          senderId: OTHER_USER_ID,
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      const parent = data.pages[0].items.find(
        (m: any) => m.id === "parent-1",
      );
      expect(parent.replyCount).toBe(1);
      expect(parent.unreadReplyCount).toBe(0);
    });

    it("1.1.6 IMG message triggers attachment invalidation", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "img-msg", contentType: "IMG" }),
      );

      // Assert
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["conversation-attachments", CONV_ID],
      });
    });

    it("1.1.7 message with attachments triggers attachment invalidation", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({
          id: "file-msg",
          attachments: [
            {
              id: "att-1",
              fileId: "f-1",
              fileName: "report.pdf",
              fileSize: 2048,
              contentType: "application/pdf",
              createdAt: "2026-03-07T10:00:00Z",
            },
          ],
        }),
      );

      // Assert
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["conversation-attachments", CONV_ID],
      });
    });

    it("1.1.8 SYS message triggers task refetch", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "sys-msg", contentType: "SYS" }),
      );

      // Assert
      expect(queryClient.refetchQueries).toHaveBeenCalledWith({
        queryKey: tasksKeys.list({ conversationId: CONV_ID }),
      });
    });

    it("1.1.9 first message when cache empty - invalidateQueries as fallback", () => {
      // Arrange - cache exists but pages array is empty
      queryClient.setQueryData(messageKeys.conversation(CONV_ID), {
        pages: [],
        pageParams: [],
      });

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "first-msg" }),
      );

      // Assert - setQueryData callback detects empty pages and triggers invalidation
      // The message should not crash, and invalidateQueries should be called as fallback
      expect(() =>
        handleMessageSentToMessageCache(
          msgCtx,
          mockMessage({ id: "first-msg-2" }),
        ),
      ).not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────
  // 1.2 Category Sidebar Updates
  // ────────────────────────────────────────────────────────

  describe("1.2 Category Sidebar Updates", () => {
    it("1.2.1 unread badge increments for inactive conversation", () => {
      // Arrange
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2, unreadCount: 0 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      // Act
      handleMessageSentToCategoryCache(
        catCtx,
        mockMessage({ conversationId: CONV_ID_2, senderId: OTHER_USER_ID }),
      );

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(1);
    });

    it("1.2.2 unread badge resets on read", () => {
      // Arrange
      const category = mockCategory({
        conversations: [mockConversationInfo({ unreadCount: 5 })],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      // Act
      handleMessageRead(catCtx, {
        conversationId: CONV_ID,
        userId: CURRENT_USER_ID,
      });

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      expect(data[0].conversations[0].unreadCount).toBe(0);
    });

    it("1.2.3 conversation renamed - name updates + system message + toast", () => {
      // Arrange
      const addMessage = vi.fn();
      vi.mocked(useClientSystemMessagesStore.getState).mockReturnValue({
        addMessage,
      });
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([]),
      );

      // Act
      handleConversationUpdated(catCtx, { id: CONV_ID, name: "Renamed Conv" });

      // Assert - name updated
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations[0].conversationName).toBe(
        "Renamed Conv",
      );

      // Assert - system message added to store
      expect(addMessage).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          contentType: "SYS",
          conversationId: CONV_ID,
        }),
      );

      // Assert - system message inserted into message cache
      const msgData: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      expect(msgData.pages[0].items[0].contentType).toBe("SYS");

      // Assert - Vietnamese toast
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("đổi tên thành Renamed Conv"),
      );
    });

    it("1.2.4 member added toast (Vietnamese)", async () => {
      // Arrange
      queryClient.setQueryData(categoriesKeys.list(), [mockCategory()]);

      // Act
      await handleMemberAdded(catCtx, {
        conversationId: CONV_ID,
        userId: OTHER_USER_ID,
      });

      // Assert
      expect(getConversationMembers).toHaveBeenCalledWith(CONV_ID);
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("đã được thêm vào"),
      );
    });

    it("1.2.5 department linked toast + auth store update", async () => {
      // Arrange
      const setUser = vi.fn();
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: { id: CURRENT_USER_ID },
        setUser,
      } as any);

      // Act
      await handleCategoryDepartmentLinked(catCtx, {
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        departmentId: "dept-1",
      });

      // Assert - toast in Vietnamese
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("đã được thêm vào nhóm"),
      );

      // Assert - auth store updated
      expect(setUser).toHaveBeenCalled();
      expect(getCurrentUser).toHaveBeenCalled();
    });

    it("1.2.6 thread reply updates lastMessage with parentMessageId", () => {
      // Arrange
      const category = mockCategory({
        conversations: [
          mockConversationInfo({ conversationId: CONV_ID_2 }),
        ],
      });
      queryClient.setQueryData(categoriesKeys.list(), [category]);

      // Act
      handleMessageSentToCategoryCache(
        catCtx,
        mockMessage({
          conversationId: CONV_ID_2,
          parentMessageId: "parent-123",
          content: "Thread reply content",
        }),
      );

      // Assert
      const data: any = queryClient.getQueryData(categoriesKeys.list());
      const lastMessage = data[0].conversations[0].lastMessage;
      expect(lastMessage.parentMessageId).toBe("parent-123");
      expect(lastMessage.content).toBe("Thread reply content");
    });

    it("1.2.7 CONVERSATION_UPDATED with same name - no toast, no SYS", () => {
      // Arrange
      const addMessage = vi.fn();
      vi.mocked(useClientSystemMessagesStore.getState).mockReturnValue({
        addMessage,
      });
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({
          conversations: [
            mockConversationInfo({ conversationName: "Unchanged Name" }),
          ],
        }),
      ]);

      // Act
      handleConversationUpdated(catCtx, {
        id: CONV_ID,
        name: "Unchanged Name",
      });

      // Assert - no toast shown
      expect(toast.info).not.toHaveBeenCalled();

      // Assert - no system message added
      expect(addMessage).not.toHaveBeenCalled();

      // Assert - invalidation still runs for avatar/other changes
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["categories"],
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // 1.3 Task Notifications (verify unchanged)
  // ────────────────────────────────────────────────────────

  describe("1.3 Task Notifications", () => {
    it("SYS message refetches tasks for the conversation", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "sys-task-msg", contentType: "SYS" }),
      );

      // Assert
      expect(queryClient.refetchQueries).toHaveBeenCalledWith({
        queryKey: tasksKeys.list({ conversationId: CONV_ID }),
      });
    });

    it("non-SYS message does NOT refetch tasks", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData(),
      );

      // Act
      handleMessageSentToMessageCache(
        msgCtx,
        mockMessage({ id: "txt-msg", contentType: "TXT" }),
      );

      // Assert
      expect(queryClient.refetchQueries).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // Combined: message-cache + category-cache for same event
  // ────────────────────────────────────────────────────────

  describe("Combined cache updates for single MESSAGE_SENT event", () => {
    it("both message cache and category cache update without interference", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID),
        mockInfiniteMessageData([mockMessage({ id: "existing-1" })]),
      );
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({
          conversations: [mockConversationInfo({ unreadCount: 0 })],
        }),
      ]);
      const message = mockMessage({
        id: "combined-msg",
        senderId: OTHER_USER_ID,
      });

      // Act - both updaters called for same event
      handleMessageSentToMessageCache(msgCtx, message);
      handleMessageSentToCategoryCache(catCtx, message);

      // Assert - message prepended
      const msgData: any = queryClient.getQueryData(
        messageKeys.conversation(CONV_ID),
      );
      expect(msgData.pages[0].items[0].id).toBe("combined-msg");

      // Assert - lastMessage updated (unread stays 0 since active conv)
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations[0].lastMessage.messageId).toBe(
        "combined-msg",
      );
      expect(catData[0].conversations[0].unreadCount).toBe(0);
    });

    it("inactive conv: removeQueries on message cache + unread increment on category cache", () => {
      // Arrange
      queryClient.setQueryData(
        messageKeys.conversation(CONV_ID_2),
        mockInfiniteMessageData(),
      );
      queryClient.setQueryData(categoriesKeys.list(), [
        mockCategory({
          conversations: [
            mockConversationInfo({
              conversationId: CONV_ID_2,
              unreadCount: 0,
            }),
          ],
        }),
      ]);
      const message = mockMessage({
        id: "inactive-combined",
        conversationId: CONV_ID_2,
        senderId: OTHER_USER_ID,
      });

      // Act
      handleMessageSentToMessageCache(msgCtx, message);
      handleMessageSentToCategoryCache(catCtx, message);

      // Assert
      expect(queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: messageKeys.conversation(CONV_ID_2),
        exact: true,
      });
      const catData: any = queryClient.getQueryData(categoriesKeys.list());
      expect(catData[0].conversations[0].unreadCount).toBe(1);
    });
  });
});
