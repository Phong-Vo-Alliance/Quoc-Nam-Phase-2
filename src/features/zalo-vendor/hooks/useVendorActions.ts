import { useCallback, useMemo } from "react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import { useVendorMessagesStore } from "@/stores/vendorMessagesStore";
import { useVendorTasksStore } from "@/stores/vendorTasksStore";
import type { VendorMessage, VendorTaskChecklist, VendorAttachment, VendorGroup } from "@/types/zalo";
import vendorGroupsRaw from "@/data/zalo/vendor-groups.json";

// PRODUCTION MIGRATION:
// Replace each action with a useMutation call:
//   sendMessage → POST /vendor/groups/:groupId/messages
//   recallMessage → PATCH /vendor/messages/:id/recall
//   pinMessage → PATCH /vendor/messages/:id/pin
//   addReaction → POST /vendor/messages/:id/reactions
//   forwardToAdmin → POST /vendor/messages/:id/forward

// Stable reference to avoid Zustand selector creating a new [] on every call
// for groups that have no messages in the store yet (Object.is comparison).
const EMPTY_MESSAGES: VendorMessage[] = [];

export function useVendorActions(groupId: string | null) {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const groupDisplayNames = useDemoConfigStore((s) => s.groupDisplayNames);
  const addForwardedMessage = useDemoConfigStore((s) => s.addForwardedMessage);
  const messages = useVendorMessagesStore((s) =>
    groupId ? (s.messages[groupId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const dispatch = useVendorMessagesStore((s) => s.dispatch);

  // Zalo account used by this group — applied to outgoing messages so reply preview
  // can show "ZaloName (staffName)" format instead of just the staff name.
  const groupZaloAccountId = useMemo(
    () => (vendorGroupsRaw as VendorGroup[]).find((g) => g.id === groupId)?.zaloAccountId ?? null,
    [groupId],
  );
  const addTask = useVendorTasksStore((s) => s.addTask);

  const sendMessage = useCallback(
    (
      content: string | null,
      contentType: VendorMessage["contentType"] = "TXT",
      replyTo: VendorMessage["replyTo"] = null,
      attachments: VendorAttachment[] = [],
    ) => {
      if (!groupId) return;
      if (!content?.trim() && attachments.length === 0) return;
      const newMsg: VendorMessage = {
        id: `msg_local_${Date.now()}`,
        groupId,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatarUrl: currentUser.avatarUrl,
        origin: "ZALO",
        isFromVendor: false,
        actingAsZaloAccountId: groupZaloAccountId,
        content: content?.trim() ?? null,
        contentType,
        attachments,
        reactions: [],
        replyTo,
        isPinned: false,
        isRecalled: false,
        recalledContent: null,
        recalledAt: null,
        isForwardedToAdmin: false,
        internalType: null,
        linkedTaskId: null,
        sentAt: new Date().toISOString(),
        editedAt: null,
      };
      dispatch({ type: "SEND_MESSAGE", groupId, message: newMsg });
    },
    [groupId, groupZaloAccountId, currentUser, dispatch],
  );

  const recallMessage = useCallback(
    (messageId: string) => {
      if (!groupId) return;
      dispatch({ type: "RECALL_MESSAGE", groupId, messageId });
    },
    [groupId, dispatch],
  );

  const pinMessage = useCallback(
    (messageId: string) => {
      if (!groupId) return;
      dispatch({ type: "PIN_MESSAGE", groupId, messageId });
    },
    [groupId, dispatch],
  );

  const addReaction = useCallback(
    (messageId: string, emoji: "❤️" | "👍") => {
      if (!groupId) return;
      dispatch({
        type: "ADD_REACTION",
        groupId,
        messageId,
        emoji,
        userId: currentUser.id,
        userName: currentUser.displayName,
      });
    },
    [groupId, currentUser, dispatch],
  );

  const starMessage = useCallback(
    (messageId: string) => {
      if (!groupId) return;
      dispatch({ type: "STAR_MESSAGE", groupId, messageId });
    },
    [groupId, dispatch],
  );

  const forwardToAdmin = useCallback(
    (messageId: string, comment?: string) => {
      if (!groupId) return;
      const original = messages.find((m) => m.id === messageId);
      if (!original) return;

      const vendorGroup = (vendorGroupsRaw as VendorGroup[]).find((g) => g.id === groupId);
      const vendorGroupName = groupDisplayNames[groupId] || vendorGroup?.name || groupId;

      dispatch({ type: "FORWARD_TO_ADMIN", groupId, messageId });

      addForwardedMessage({
        id: `fwd_${Date.now()}`,
        originalMessageId: original.id,
        originalContent: original.content,
        originalContentType: original.contentType,
        originalAttachments: original.attachments,
        vendorGroupId: groupId,
        vendorGroupName,
        forwardedByUserId: currentUser.id,
        forwardedByName: currentUser.displayName,
        forwardedAt: new Date().toISOString(),
        comment: comment?.trim() || null,
      });
    },
    [groupId, currentUser, groupDisplayNames, messages, dispatch, addForwardedMessage],
  );

  const assignTask = useCallback(
    (
      messageId: string | null,
      title: string,
      assignToId: string,
      assignToName: string,
      checklist: VendorTaskChecklist[],
    ) => {
      if (!groupId) return;
      const now = new Date().toISOString();
      const taskId = `vt_local_${Date.now()}`;

      addTask(groupId, {
        id: taskId,
        groupId,
        title,
        description: null,
        status: "todo",
        assignToId,
        assignToName,
        assignedById: currentUser.id,
        assignedByName: currentUser.displayName,
        checklist,
        sourceMessageId: messageId,
        createdAt: now,
        updatedAt: now,
      });

      const taskMsg: VendorMessage = {
        id: `msg_task_${Date.now()}`,
        groupId,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatarUrl: currentUser.avatarUrl,
        origin: "INTERNAL",
        isFromVendor: false,
        actingAsZaloAccountId: null,
        content: `Công việc "${title}" đã được tạo bởi ${currentUser.displayName} và giao cho ${assignToName}`,
        contentType: "TXT",
        attachments: [],
        reactions: [],
        replyTo: null,
        isPinned: false,
        isRecalled: false,
        recalledContent: null,
        recalledAt: null,
        isForwardedToAdmin: false,
        internalType: "TASK",
        linkedTaskId: taskId,
        sentAt: now,
        editedAt: null,
      };
      dispatch({ type: "SEND_MESSAGE", groupId, message: taskMsg });
    },
    [groupId, currentUser, addTask, dispatch],
  );

  return { messages, sendMessage, recallMessage, pinMessage, addReaction, forwardToAdmin, starMessage, assignTask };
}
