import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  shouldNotify,
  _resetThrottleForTesting,
} from "@/lib/notification-service";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { queryClient } from "@/lib/queryClient";
import { useNotificationStore } from "@/stores/notificationStore";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeMockAudioCtx() {
  const mockOscillator = {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: "sine" as OscillatorType,
  };
  const mockGain = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  return {
    mockOscillator,
    mockGain,
    mockCtx: {
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
      currentTime: 0,
    },
  };
}

// ─── shouldNotify ─────────────────────────────────────────────────────────────

describe("shouldNotify", () => {
  it("returns true when senderId !== currentUserId AND conversationId !== activeConvId", () => {
    expect(
      shouldNotify(
        { senderId: "user-other", conversationId: "conv-abc" },
        "user-me",
        "conv-xyz",
      ),
    ).toBe(true);
  });

  it("returns false when senderId === currentUserId (own message)", () => {
    expect(
      shouldNotify(
        { senderId: "user-me", conversationId: "conv-abc" },
        "user-me",
        "conv-xyz",
      ),
    ).toBe(false);
  });

  it("returns false when conversationId === activeConversationId (đang xem)", () => {
    expect(
      shouldNotify(
        { senderId: "user-other", conversationId: "conv-abc" },
        "user-me",
        "conv-abc",
      ),
    ).toBe(false);
  });

  it("returns false when currentUserId is undefined", () => {
    expect(
      shouldNotify(
        { senderId: "user-other", conversationId: "conv-abc" },
        undefined,
        "conv-xyz",
      ),
    ).toBe(false);
  });
});

// ─── playSound / throttle ────────────────────────────────────────────────────

describe("playSound (via notify)", () => {
  beforeEach(() => {
    // Reset store to known state
    useNotificationStore.setState({
      soundEnabled: true,
      systemNotificationEnabled: false,
    });
    _resetThrottleForTesting();
    vi.useFakeTimers();
    // Advance time so throttle doesn't block first call
    vi.setSystemTime(new Date(2000, 1, 1, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("creates AudioContext when sound is enabled and should notify", async () => {
    const { mockCtx } = makeMockAudioCtx();
    const AudioContextSpy = vi.fn(() => mockCtx);
    vi.stubGlobal("AudioContext", AudioContextSpy);
    Object.defineProperty(document, "hasFocus", {
      value: vi.fn(() => true),
      configurable: true,
    });

    const { notify } = await import("@/lib/notification-service");
    notify(
      {
        id: "m1",
        conversationId: "conv-abc",
        senderId: "other",
        content: "Hi",
        contentType: "TXT",
        createdAt: "",
      } as any,
      "user-me",
      "conv-xyz",
    );

    expect(AudioContextSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when AudioContext is not available", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const { notify } = await import("@/lib/notification-service");

    expect(() =>
      notify(
        {
          id: "m1",
          conversationId: "conv-abc",
          senderId: "other",
          content: "Hi",
          contentType: "TXT",
          createdAt: "",
        } as any,
        "user-me",
        "conv-xyz",
      ),
    ).not.toThrow();
  });

  it("throttles sound: two calls within 500ms produce only 1 AudioContext instantiation", async () => {
    const { mockCtx } = makeMockAudioCtx();
    const AudioContextSpy = vi.fn(() => mockCtx);
    vi.stubGlobal("AudioContext", AudioContextSpy);

    const { notify } = await import("@/lib/notification-service");
    const msg = {
      id: "m1",
      conversationId: "conv-abc",
      senderId: "other",
      content: "Hi",
      contentType: "TXT",
      createdAt: "",
    } as any;

    notify(msg, "user-me", "conv-xyz");
    notify(msg, "user-me", "conv-xyz");

    // Only 1 AudioContext created because throttle blocks second call
    expect(AudioContextSpy).toHaveBeenCalledTimes(1);
  });
});

// ─── showSystemNotification — focused tab guard ───────────────────────────────

describe("showSystemNotification (via notify)", () => {
  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does NOT call new Notification() when tab is focused", async () => {
    const NotificationSpy = vi.fn();
    vi.stubGlobal(
      "Notification",
      Object.assign(NotificationSpy, { permission: "granted" }),
    );
    Object.defineProperty(document, "hasFocus", {
      value: vi.fn(() => true),
      configurable: true,
    });

    useNotificationStore.setState({
      soundEnabled: false,
      systemNotificationEnabled: true,
    });

    const { notify } = await import("@/lib/notification-service");
    notify(
      {
        id: "m1",
        conversationId: "conv-abc",
        senderId: "other",
        content: "Hi",
        contentType: "TXT",
        createdAt: "",
      } as any,
      "user-me",
      "conv-xyz",
    );

    expect(NotificationSpy).not.toHaveBeenCalled();
  });

  it("formats group notifications as category > conversation and sender-prefixed body", async () => {
    const NotificationSpy = vi.fn();
    vi.stubGlobal(
      "Notification",
      Object.assign(NotificationSpy, { permission: "granted" }),
    );
    Object.defineProperty(document, "hasFocus", {
      value: vi.fn(() => false),
      configurable: true,
    });

    queryClient.setQueryData(categoriesKeys.list(), [
      {
        id: "cat-1",
        userId: "user-me",
        name: "Kho vận",
        order: 0,
        conversations: [
          {
            conversationId: "conv-group",
            conversationName: "Nhận hàng",
            memberCount: 3,
            lastMessage: null,
            unreadCount: 0,
          },
        ],
        createdAt: "2026-04-09T00:00:00Z",
        updatedAt: null,
      },
    ]);

    useNotificationStore.setState({
      soundEnabled: false,
      systemNotificationEnabled: true,
    });

    const { notify } = await import("@/lib/notification-service");
    notify(
      {
        id: "m-group-1",
        conversationId: "conv-group",
        senderId: "other",
        senderName: "Ngọc Minh",
        senderFullName: "Ngọc Minh",
        senderIdentifier: null,
        senderRoles: null,
        parentMessageId: null,
        quoteMessageId: null,
        content: "Có tin nhắn mới",
        contentType: "TXT",
        sentAt: "2026-04-09T10:00:00Z",
        editedAt: null,
        linkedTaskId: null,
        reactions: [],
        attachments: [],
        replyCount: 0,
        unreadReplyCount: 0,
        isStarred: false,
        isPinned: false,
        threadPreview: null,
        mentions: [],
      },
      "user-me",
      "conv-xyz",
    );

    expect(NotificationSpy).toHaveBeenCalledWith(
      "Kho vận > Nhận hàng",
      expect.objectContaining({ body: "Ngọc Minh: Có tin nhắn mới" }),
    );
  });

  it("keeps direct message notification format unchanged", async () => {
    const NotificationSpy = vi.fn();
    vi.stubGlobal(
      "Notification",
      Object.assign(NotificationSpy, { permission: "granted" }),
    );
    Object.defineProperty(document, "hasFocus", {
      value: vi.fn(() => false),
      configurable: true,
    });

    queryClient.setQueryData(conversationKeys.directs(), {
      pages: [
        {
          items: [
            {
              id: "conv-dm",
              type: "DM",
              name: "Chat riêng",
              description: null,
              avatarFileId: null,
              createdBy: "other",
              createdByName: "Ngọc Minh",
              createdAt: "2026-04-09T00:00:00Z",
              updatedAt: null,
              memberCount: 2,
              unreadCount: 0,
              lastMessage: null,
            },
          ],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    });

    useNotificationStore.setState({
      soundEnabled: false,
      systemNotificationEnabled: true,
    });

    const { notify } = await import("@/lib/notification-service");
    notify(
      {
        id: "m-dm-1",
        conversationId: "conv-dm",
        senderId: "other",
        senderName: "Ngọc Minh",
        senderFullName: "Ngọc Minh",
        senderIdentifier: null,
        senderRoles: null,
        parentMessageId: null,
        quoteMessageId: null,
        content: "Xin chào",
        contentType: "TXT",
        sentAt: "2026-04-09T10:00:00Z",
        editedAt: null,
        linkedTaskId: null,
        reactions: [],
        attachments: [],
        replyCount: 0,
        unreadReplyCount: 0,
        isStarred: false,
        isPinned: false,
        threadPreview: null,
        mentions: [],
      },
      "user-me",
      "conv-xyz",
    );

    expect(NotificationSpy).toHaveBeenCalledWith(
      "Ngọc Minh",
      expect.objectContaining({ body: "Xin chào" }),
    );
  });
});
