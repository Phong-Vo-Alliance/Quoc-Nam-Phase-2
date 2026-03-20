import { useCallback, useMemo } from "react";
import { flattenMessages, useMessages } from "@/hooks/queries/useMessages";
import { useClientSystemMessagesStore } from "@/stores/clientSystemMessagesStore";
import { useCategories } from "@/hooks/queries/useCategories";
import { formatDateSeparator } from "@/utils/formatDateSeparator";
import { groupMessages } from "@/utils/messageGrouping";
import type { ChatMessage } from "@/types/messages";

const EMPTY_CLIENT_SYS_MSGS: ChatMessage[] = [];

interface UseChatMessagesOptions {
  conversationId: string;
}

export function useChatMessages({ conversationId }: UseChatMessagesOptions) {
  const categoriesQuery = useCategories();

  // Fetch messages
  const messagesQuery = useMessages({
    conversationId,
    enabled: !!conversationId,
  });

  // Client system messages (survive react-query refetches)
  const clientSystemMessages = useClientSystemMessagesStore(
    useCallback(
      (state: { messages: Record<string, ChatMessage[]> }) =>
        state.messages[conversationId] ?? EMPTY_CLIENT_SYS_MSGS,
      [conversationId],
    ),
  );

  const messages = useMemo(() => {
    if (categoriesQuery.isLoading) return [];
    if (!messagesQuery.isSuccess) return [];

    const serverMessages = flattenMessages(messagesQuery.data);

    // 🆕 FILTER: Only show main messages (exclude thread replies)
    const mainMessages = serverMessages.filter(
      (msg) => msg.parentMessageId === null,
    );

    if (clientSystemMessages.length === 0) return mainMessages;

    const existingContents = new Set(
      mainMessages.filter((m) => m.contentType === "SYS").map((m) => m.content),
    );
    const newClientMsgs = clientSystemMessages.filter(
      (m) => !existingContents.has(m.content) && m.parentMessageId === null,
    );
    if (newClientMsgs.length === 0) return mainMessages;

    return [...mainMessages, ...newClientMsgs].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [
    conversationId,
    messagesQuery.data,
    messagesQuery.isSuccess,
    categoriesQuery.isLoading,
    clientSystemMessages,
  ]);

  // Phase 4: Group messages by time proximity (10 minutes)
  const groupedMessages = useMemo(() => {
    const messagesWithTimestamp = messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.sentAt).getTime(),
    }));
    return groupMessages(messagesWithTimestamp, 10 * 60 * 1000);
  }, [messages]);

  // 🆕 NEW: Group Phase 4 grouped messages by date
  const messagesByDate = useMemo(() => {
    type DateGroup = {
      date: string;
      dateKey: string;
      messages: typeof groupedMessages;
    };

    const dateGroups: DateGroup[] = [];

    groupedMessages.forEach((groupedMsg) => {
      const message = groupedMsg.message;
      const msgDate = new Date(message.sentAt);
      const dateKey = msgDate.toISOString().split("T")[0];
      const dateLabel = formatDateSeparator(message.sentAt);

      const lastDateGroup = dateGroups[dateGroups.length - 1];

      if (lastDateGroup && lastDateGroup.dateKey === dateKey) {
        lastDateGroup.messages.push(groupedMsg);
      } else {
        dateGroups.push({
          date: dateLabel,
          dateKey: dateKey,
          messages: [groupedMsg],
        });
      }
    });

    return dateGroups;
  }, [groupedMessages]);

  // Get last real server message ID (skip client-only: "sys-*" and optimistic "temp-*")
  const lastMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const id = messages[i].id;
      if (!id.startsWith("sys-") && !id.startsWith("temp-")) return id;
    }
    return undefined;
  }, [messages]);

  return {
    messages,
    messagesQuery,
    groupedMessages,
    messagesByDate,
    lastMessageId,
  };
}
