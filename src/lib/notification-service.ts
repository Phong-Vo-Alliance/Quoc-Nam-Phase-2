import type { InfiniteData } from "@tanstack/react-query";
import { conversationKeys } from "@/hooks/queries/keys/conversationKeys";
import { categoriesKeys } from "@/hooks/queries/useCategories";
import { queryClient } from "@/lib/queryClient";
import { useNotificationStore } from "@/stores/notificationStore";
import type { CategoryWithUnread } from "@/types/categories";
import type { DirectConversation } from "@/types/conversations";
import type { ChatMessage } from "@/types/messages";

// ─── Constants ────────────────────────────────────────────────────────────────
const SOUND_THROTTLE_MS = 1000;
const NOTIF_DEDUP_MS = 3000;
const BODY_MAX_LENGTH = 100;

// ─── Module-level state ───────────────────────────────────────────────────────
let lastSoundAt = 0;
let unreadCount = 0;
const recentNotifications = new Map<string, number>();

type DirectsPage = {
  items: DirectConversation[];
  nextCursor: string | null;
  hasMore: boolean;
};

type NotificationMessageMeta = ChatMessage & {
  type?: "DM" | "GRP";
  conversationType?: "DM" | "GRP" | null;
  categoryName?: string | null;
  conversationName?: string | null;
};

/** Reset throttle state — only for use in tests */
export function _resetThrottleForTesting(): void {
  lastSoundAt = 0;
  unreadCount = 0;
  recentNotifications.clear();
}

// Restore title and reset unread count when user focuses tab
if (typeof window !== "undefined") {
  window.addEventListener("focus", () => {
    unreadCount = 0;
  });
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

export function shouldNotify(
  message: { senderId?: string; conversationId?: string },
  currentUserId: string | undefined,
  activeConversationId: string | undefined,
): boolean {
  if (!currentUserId) return false;
  if (message.senderId === currentUserId) return false;
  if (activeConversationId && message.conversationId === activeConversationId)
    return false;
  return true;
}

function playSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Silent fail — browser may block AudioContext without user interaction
  }
}

function playThrottledSound(): void {
  const now = Date.now();
  if (now - lastSoundAt < SOUND_THROTTLE_MS) return;
  lastSoundAt = now;
  playSound();
}

function showSystemNotification(
  title: string,
  body: string,
  conversationId: string,
): void {
  if (!("Notification" in window)) {
    console.warn("[notif] Browser không support Notifications API");
    return;
  }
  if (Notification.permission !== "granted") {
    console.warn(
      "[notif] Permission chưa được grant:",
      Notification.permission,
    );
    return;
  }
  if (document.hasFocus()) {
    console.log("[notif] Tab đang focused → skip system notification");
    return;
  }

  // Dedup: skip if we already showed one for this conversation recently
  const now = Date.now();
  const lastAt = recentNotifications.get(conversationId) ?? 0;
  if (now - lastAt < NOTIF_DEDUP_MS) {
    console.log("[notif] Dedup skip cho conversation:", conversationId);
    return;
  }
  recentNotifications.set(conversationId, now);

  try {
    const truncatedBody =
      body.length > BODY_MAX_LENGTH
        ? body.slice(0, BODY_MAX_LENGTH) + "…"
        : body;

    const notification = new Notification(title, {
      body: truncatedBody,
      icon: "/favicon.ico",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Dispatch custom event to navigate sidebar to this conversation
      window.dispatchEvent(
        new CustomEvent("notification-click", {
          detail: { conversationId },
        }),
      );
    };
  } catch {
    // Some browsers may block Notification constructor in certain contexts
  }
}

function getMessageContent(message: ChatMessage): string {
  const content =
    typeof message.content === "string" ? message.content.trim() : "";
  return content || "Tin nhắn mới";
}

function isDirectNotification(message: NotificationMessageMeta): boolean {
  if (message.type === "DM" || message.conversationType === "DM") return true;
  if (message.type === "GRP" || message.conversationType === "GRP")
    return false;

  const directsData = queryClient.getQueryData<InfiniteData<DirectsPage>>(
    conversationKeys.directs(),
  );

  return (
    directsData?.pages.some((page) =>
      page.items.some(
        (conversation) => conversation.id === message.conversationId,
      ),
    ) ?? false
  );
}

function getGroupNotificationTitle(
  message: NotificationMessageMeta,
): string | null {
  const categoryName = message.categoryName?.trim() || "";
  const conversationName = message.conversationName?.trim() || "";

  if (categoryName || conversationName) {
    return [categoryName, conversationName].filter(Boolean).join(" - ");
  }

  const categories =
    queryClient.getQueryData<CategoryWithUnread[]>(categoriesKeys.list()) ?? [];

  for (const category of categories) {
    const conversation = category.conversations.find(
      (item) => item.conversationId === message.conversationId,
    );

    if (conversation) {
      return [category.name?.trim(), conversation.conversationName?.trim()]
        .filter(Boolean)
        .join(" > ");
    }
  }

  return null;
}

function getNotificationContent(message: ChatMessage): {
  title: string;
  body: string;
} {
  const notificationMessage = message as NotificationMessageMeta;
  const senderName =
    message.senderFullName || message.senderName || "Tin nhắn mới";
  const content = getMessageContent(message);
  const groupTitle = getGroupNotificationTitle(notificationMessage);
  const isGroupNotification =
    !isDirectNotification(notificationMessage) && !!groupTitle;

  if (isGroupNotification) {
    return {
      title: groupTitle,
      body: `${senderName}: ${content}`,
    };
  }

  return {
    title: senderName,
    body: content,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function notify(
  message: ChatMessage,
  currentUserId: string | undefined,
  activeConversationId: string | undefined,
): void {
  try {
    // Sound plays for all incoming messages (not own), regardless of active conversation
    const isOwnMessage = !currentUserId || message.senderId === currentUserId;
    if (!isOwnMessage) {
      const store = useNotificationStore.getState();
      if (store.soundEnabled) {
        playThrottledSound();
      }
    }

    if (!shouldNotify(message, currentUserId, activeConversationId)) {
      return;
    }

    const store = useNotificationStore.getState();

    const { title, body } = getNotificationContent(message);

    if (store.systemNotificationEnabled) {
      showSystemNotification(title, body, message.conversationId);
    }

    // Tab title unchanged — no unread count indicator
  } catch (err) {
    console.warn("[notification-service] notify() error (non-fatal):", err);
  }
}
