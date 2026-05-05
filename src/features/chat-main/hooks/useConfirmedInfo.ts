import { useCallback, useMemo, useRef, useState } from "react";
import { useCreateInformationConfirmed } from "@/hooks/mutations/useCreateInformationConfirmed";
import { useAllInformationConfirmed } from "@/hooks/queries/useInformationConfirmed";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useAuthStore } from "@/stores/authStore";
import {
  useIsDepartmentLeaderInConversation,
  useIsLeaderInConversation,
} from "@/hooks/useCategoryLeader";
import { hasRole } from "@/utils/roleUtils";
import { buildReceiveInfoContent } from "@/utils/receiveInfoMessage";
import type { GroupedMessage } from "@/utils/messageGrouping";

interface UseConfirmedInfoOptions {
  conversationId: string;
  workspaceId: string;
  groupedMessages: GroupedMessage[];
  onConfirmInfoSuccess?: () => void;
}

export function useConfirmedInfo({
  conversationId,
  workspaceId,
  groupedMessages,
  onConfirmInfoSuccess,
}: UseConfirmedInfoOptions) {
  const user = useAuthStore((state) => state.user);
  const isLeaderOfGroup = useIsLeaderInConversation(conversationId);
  // Strict check (no Admin bypass) — used to gate the non-admin branch of the
  // `/all` fetch. Admin is allowed by the backend regardless of
  // `departmentLeaders` membership, so we OR the two checks below.
  const isDepartmentLeaderOfGroup =
    useIsDepartmentLeaderInConversation(conversationId);
  // Admin can't confirm information, but still needs the confirmed map so the
  // "Giao việc" button can be hidden on messages already taken by someone else
  // (see confirm-info-assign-task-gating.md).
  const isAdmin = hasRole("Admin");

  const [confirmingMessageId, setConfirmingMessageId] = useState<string | null>(
    null,
  );
  const confirmingRef = useRef(false); // Synchronous mutex to prevent duplicate API calls

  // 🆕 NEW: Fetch ALL confirmed information for this conversation. Allowed
  // for Admin and for department leaders of the group — others 403.
  const { data: confirmedInfoData } = useAllInformationConfirmed(
    {
      conversationId,
    },
    { enabled: !!conversationId && (isAdmin || isDepartmentLeaderOfGroup) },
  );

  // 🆕 NEW: Fetch conversation members for confirmed info userName lookup
  const { data: conversationMembers } = useConversationMembers({
    conversationId,
    enabled: !!conversationId && isLeaderOfGroup,
  });

  // 🆕 NEW: Create Map of message IDs to confirmed info with userName + userId.
  // We track userId so callers can gate actions (e.g. "Giao việc") on whether
  // the current viewer is the confirmer.
  // Prefer `confirmedByName` from backend; fall back to conversation member
  // lookup for older payloads that don't include the name.
  const confirmedMessageMap = useMemo(() => {
    const map = new Map<string, { userId: string; name?: string }>();
    if (confirmedInfoData?.data) {
      confirmedInfoData.data.forEach((info) => {
        let confirmedByName: string | undefined;

        if (info.confirmedBy === user?.id) {
          confirmedByName = "Bạn";
        } else if (info.confirmedByName) {
          confirmedByName = info.confirmedByName;
        } else {
          const member = conversationMembers?.find(
            (m) =>
              m.userId === info.confirmedBy ||
              m.userInfo?.id === info.confirmedBy,
          );
          confirmedByName = member?.userInfo?.fullName || member?.userName;
        }

        map.set(info.messageId, {
          userId: info.confirmedBy,
          name: confirmedByName,
        });
      });
    }
    return map;
  }, [confirmedInfoData, conversationMembers, user?.id]);

  // Send message mutation (for system messages after confirmation)
  const sendMessageMutation = useSendMessage({
    workspaceId,
    conversationId,
  });

  // 🆕 NEW: Mutation for creating confirmed information
  const createConfirmedInfoMutation = useCreateInformationConfirmed();

  // 🆕 NEW: Handle confirm information from message
  const handleConfirmInfo = useCallback(
    (messageId: string) => {
      // Synchronous mutex guard
      if (confirmingRef.current) return;
      confirmingRef.current = true;

      const message = groupedMessages.find(
        (g) => g.message.id === messageId,
      )?.message;
      if (!message || !user?.id) {
        confirmingRef.current = false;
        return;
      }

      setConfirmingMessageId(messageId);

      const receiverName =
        user?.fullName || user?.identifier || "Người tiếp nhận";
      const systemMessageContent = buildReceiveInfoContent(
        message,
        receiverName,
        new Date(),
      );

      createConfirmedInfoMutation.mutate(
        {
          conversationId,
          messageId,
          content: message.content || message.attachments?.[0]?.fileName || "",
          statusCode: "pending",
          confirmedBy: user.id,
          senderId: message.senderId,
          senderName: message.senderName || "",
        },
        {
          onSuccess: () => {
            confirmingRef.current = false;
            setConfirmingMessageId(null);

            sendMessageMutation.mutate({
              conversationId,
              content: systemMessageContent,
              messageType: "SYS",
            });

            onConfirmInfoSuccess?.();
          },
          onError: () => {
            confirmingRef.current = false;
            setConfirmingMessageId(null);
          },
        },
      );
    },
    [
      conversationId,
      groupedMessages,
      user,
      createConfirmedInfoMutation,
      sendMessageMutation,
      onConfirmInfoSuccess,
    ],
  );

  // Handle create task from message
  const handleCreateTask = useCallback(
    (
      messageId: string,
      onCreateTaskFromMessage?: (payload: {
        messageId: string;
        messageContent: string;
        conversationId: string;
        confirmedInfoId?: string;
      }) => void,
    ) => {
      const message = groupedMessages.find(
        (g) => g.message.id === messageId,
      )?.message;
      if (!message) return;

      const confirmedInfo = confirmedInfoData?.data?.find(
        (info) => info.messageId === messageId && !info.isFinished,
      );

      onCreateTaskFromMessage?.({
        messageId,
        messageContent:
          message.content || message.attachments?.[0]?.fileName || "",
        conversationId,
        confirmedInfoId: confirmedInfo?.id,
      });
    },
    [conversationId, groupedMessages, confirmedInfoData],
  );

  return {
    confirmedMessageMap,
    confirmingMessageId,
    handleConfirmInfo,
    handleCreateTask,
    confirmedInfoData,
  };
}
