import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { pinnedStarredKeys } from "@/hooks/queries/keys/pinnedStarredKeys";
import type { ChatMessage, GetMessagesResponse } from "@/types/messages";
import type { GetPinnedMessagesResponse } from "@/types/pinned_and_starred";

vi.mock("@/api/messages.api", () => ({
  sendMessage: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/stores/authStore", () => ({
  default: {
    getState: () => ({
      user: { id: "u1", identifier: "a@x.com", fullName: "Nguyễn Văn A" },
    }),
  },
}));

import { sendMessage } from "@/api/messages.api";
import {
  buildPinSystemContent,
  buildReorderSystemContent,
  sendPinSystemMessage,
  sendReorderSystemMessage,
} from "./pinSystemMessage";

const ACTOR = "Nguyễn Văn A";

function msg(partial: Partial<ChatMessage>): ChatMessage {
  return {
    id: "m1",
    conversationId: "conv-1",
    content: null,
    attachments: [],
    ...partial,
  } as ChatMessage;
}

describe("buildPinSystemContent", () => {
  it("uses the text preview when the message has text", () => {
    const content = buildPinSystemContent("pin", ACTOR, msg({ content: "Xin chào" }));
    expect(content).toBe("Nguyễn Văn A đã ghim tin nhắn Xin chào");
  });

  it("truncates the preview to the first 20 characters", () => {
    const long = "a".repeat(25);
    const content = buildPinSystemContent("pin", ACTOR, msg({ content: long }));
    expect(content).toBe(`Nguyễn Văn A đã ghim tin nhắn ${"a".repeat(20)}…`);
  });

  it("prefers text over attachments (text + file)", () => {
    const content = buildPinSystemContent(
      "pin",
      ACTOR,
      msg({
        content: "Báo cáo",
        attachments: [{ contentType: "application/pdf" } as any],
      }),
    );
    expect(content).toBe("Nguyễn Văn A đã ghim tin nhắn Báo cáo");
  });

  it("names a single attachment by type", () => {
    expect(
      buildPinSystemContent(
        "pin",
        ACTOR,
        msg({ attachments: [{ contentType: "image/png" } as any] }),
      ),
    ).toBe("Nguyễn Văn A đã ghim một hình ảnh");

    expect(
      buildPinSystemContent(
        "pin",
        ACTOR,
        msg({ attachments: [{ contentType: "video/mp4" } as any] }),
      ),
    ).toBe("Nguyễn Văn A đã ghim một video");

    expect(
      buildPinSystemContent(
        "pin",
        ACTOR,
        msg({ attachments: [{ contentType: "application/zip" } as any] }),
      ),
    ).toBe("Nguyễn Văn A đã ghim một tệp");
  });

  it("uses the plural noun for multiple attachments", () => {
    const content = buildPinSystemContent(
      "pin",
      ACTOR,
      msg({
        attachments: [
          { contentType: "image/png" } as any,
          { contentType: "image/jpeg" } as any,
        ],
      }),
    );
    expect(content).toBe("Nguyễn Văn A đã ghim nhiều tệp đính kèm");
  });

  it("uses the 'đã bỏ ghim' verb for unpin", () => {
    expect(
      buildPinSystemContent("unpin", ACTOR, msg({ content: "Hi" })),
    ).toBe("Nguyễn Văn A đã bỏ ghim tin nhắn Hi");
    expect(
      buildPinSystemContent(
        "unpin",
        ACTOR,
        msg({ attachments: [{ contentType: "image/png" } as any] }),
      ),
    ).toBe("Nguyễn Văn A đã bỏ ghim một hình ảnh");
  });
});

describe("buildReorderSystemContent", () => {
  it("builds the reorder content", () => {
    expect(buildReorderSystemContent(ACTOR)).toBe(
      "Nguyễn Văn A đã chỉnh sửa danh sách ghim",
    );
  });
});

describe("sendPinSystemMessage", () => {
  let qc: QueryClient;

  beforeEach(() => {
    vi.mocked(sendMessage).mockClear();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("resolves the message from the conversation cache and sends a SYS message", () => {
    qc.setQueryData<{
      pages: GetMessagesResponse[];
      pageParams: (string | undefined)[];
    }>(messageKeys.conversation("conv-1"), {
      pages: [
        {
          items: [msg({ id: "m1", content: "Xin chào" })],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    });

    sendPinSystemMessage(qc, "conv-1", "m1", "pin");

    expect(sendMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      content: "Nguyễn Văn A đã ghim tin nhắn Xin chào",
      messageType: "SYS",
    });
  });

  it("falls back to the pinned-list cache when the message isn't in the conversation cache", () => {
    qc.setQueryData<GetPinnedMessagesResponse>(
      pinnedStarredKeys.pinnedByConversation("conv-1"),
      {
        items: [
          {
            messageId: "m9",
            pinnedBy: "u2",
            pinnedAt: "2026-05-28T00:00:00Z",
            message: msg({ id: "m9", content: "Ghi chú" }),
          } as any,
        ],
      },
    );

    sendPinSystemMessage(qc, "conv-1", "m9", "unpin");

    expect(sendMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      content: "Nguyễn Văn A đã bỏ ghim tin nhắn Ghi chú",
      messageType: "SYS",
    });
  });

  it("does nothing when the message can't be found in any cache", () => {
    sendPinSystemMessage(qc, "conv-1", "missing", "pin");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe("sendReorderSystemMessage", () => {
  beforeEach(() => {
    vi.mocked(sendMessage).mockClear();
  });

  it("sends the reorder SYS message", () => {
    sendReorderSystemMessage("conv-1");
    expect(sendMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      content: "Nguyễn Văn A đã chỉnh sửa danh sách ghim",
      messageType: "SYS",
    });
  });
});
