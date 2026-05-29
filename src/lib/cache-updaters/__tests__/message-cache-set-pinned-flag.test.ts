import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { setMessagePinnedFlag } from "../message-cache";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";

type InfinitePages = {
  pages: GetMessagesResponse[];
  pageParams: (string | undefined)[];
};

function makeMessage(id: string, isPinned: boolean): ChatMessage {
  return { id, isPinned, conversationId: "conv-1" } as ChatMessage;
}

function seed(qc: QueryClient, messages: ChatMessage[]): void {
  qc.setQueryData<InfinitePages>(messageKeys.conversation("conv-1"), {
    pages: [{ items: messages, nextCursor: null, hasMore: false }],
    pageParams: [undefined],
  });
}

function getMessages(qc: QueryClient): ChatMessage[] {
  return (
    qc.getQueryData<InfinitePages>(messageKeys.conversation("conv-1"))
      ?.pages[0].items ?? []
  );
}

describe("setMessagePinnedFlag", () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("flips isPinned to true on the matching message", () => {
    seed(qc, [makeMessage("msg-1", false), makeMessage("msg-2", false)]);

    setMessagePinnedFlag(qc, "conv-1", "msg-1", true);

    const items = getMessages(qc);
    expect(items.find((m) => m.id === "msg-1")?.isPinned).toBe(true);
    expect(items.find((m) => m.id === "msg-2")?.isPinned).toBe(false);
  });

  it("flips isPinned to false on the matching message", () => {
    seed(qc, [makeMessage("msg-1", true)]);

    setMessagePinnedFlag(qc, "conv-1", "msg-1", false);

    expect(getMessages(qc)[0].isPinned).toBe(false);
  });

  it("keeps the same object reference when the flag already matches", () => {
    seed(qc, [makeMessage("msg-1", true)]);
    const before = qc.getQueryData<InfinitePages>(
      messageKeys.conversation("conv-1"),
    );

    setMessagePinnedFlag(qc, "conv-1", "msg-1", true);

    const after = qc.getQueryData<InfinitePages>(
      messageKeys.conversation("conv-1"),
    );
    expect(after).toBe(before);
  });

  it("is a no-op when the message is not loaded", () => {
    seed(qc, [makeMessage("msg-1", false)]);

    setMessagePinnedFlag(qc, "conv-1", "missing", true);

    expect(getMessages(qc)[0].isPinned).toBe(false);
  });

  it("is a no-op when the conversation is not cached", () => {
    setMessagePinnedFlag(qc, "conv-1", "msg-1", true);

    expect(
      qc.getQueryData(messageKeys.conversation("conv-1")),
    ).toBeUndefined();
  });
});
