import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Pin,
  Users,
  ChevronDown,
  Search,
  X,
  PanelRightOpen,
  PanelRightClose,
  FileText,
  Play,
  Quote,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Paperclip,
  ImageIcon,
} from "lucide-react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import { useVendorTasksStore } from "@/stores/vendorTasksStore";
import { useVendorPhoneRevealStore } from "@/stores/vendorPhoneRevealStore";
import { useZaloAccountForGroup } from "../hooks/useVendorGroups";
import { useVendorActions } from "../hooks/useVendorActions";
import { usePhoneRevealActions } from "../hooks/usePhoneRevealActions";
import { useVendorMembers } from "../hooks/useVendorMessages";
import { ZaloIdentityBar } from "./ZaloIdentityBar";
import { VendorMessageBubble } from "./VendorMessageBubble";
import { VendorAssignTaskSheet } from "./VendorAssignTaskSheet";
import { VendorTaskBanner } from "./VendorTaskBanner";
import { RenameGroupModal } from "./RenameGroupModal";
import { VendorImagePreviewModal } from "./VendorImagePreviewModal";
import { ForwardToAdminModal } from "./ForwardToAdminModal";
import type { VendorMessage, VendorGroup, VendorReplyRef, VendorAttachment, DownloadPermission, ZaloAccount } from "@/types/zalo";
import vendorGroupsRaw from "@/data/zalo/vendor-groups.json";
import zaloAccountsRaw from "@/data/zalo/zalo-accounts.json";
import { cn } from "@/lib/utils";

const zaloAccounts = zaloAccountsRaw as ZaloAccount[];

const vendorGroups = vendorGroupsRaw as VendorGroup[];

// Stable empty-array reference so Zustand's Object.is check doesn't see a
// new [] on every render when a group has no revealed phones yet.
const EMPTY_PHONE_DIGITS: string[] = [];

type PendingFile = { id: string; file: File; objectUrl: string };

// ── Pinned message preview text ──────────────────────────────────────────────
function getPinnedPreview(msg: VendorMessage): string {
  if (msg.contentType === "IMG") return "📷 Ảnh";
  if (msg.contentType === "VID") return "🎬 Video";
  if (msg.contentType === "FILE") return msg.attachments[0]?.fileName ?? "📎 Tệp đính kèm";
  return msg.content ?? "";
}

// ── Pinned messages bar ───────────────────────────────────────────────────────
interface PinnedMessagesBarProps {
  pinnedMessages: VendorMessage[];
  onScrollTo: (id: string) => void;
  onUnpin: (id: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  zaloAccounts: ZaloAccount[];
  groupZaloAccountId: string | null;
}

function PinnedMessagesBar({ pinnedMessages, onScrollTo, onUnpin, onExpandedChange, zaloAccounts, groupZaloAccountId }: PinnedMessagesBarProps) {
  // Resolve sender display name for pinned bar:
  // - ZALO + staff (isFromVendor=false, actingAsZaloAccountId set) → "ZaloName (staffName)"
  // - INTERNAL origin → staffName only (internal message, no Zalo account context)
  // - vendor side (isFromVendor=true) → senderName (already their Zalo display name)
  const resolvePinnedSender = (msg: VendorMessage): string => {
    if (msg.origin === "INTERNAL" || msg.isFromVendor) return msg.senderName;
    const accountId = msg.actingAsZaloAccountId ?? groupZaloAccountId;
    if (!accountId) return msg.senderName;
    const zaloName = zaloAccounts.find((a) => a.id === accountId)?.displayName;
    return zaloName ? (zaloName === msg.senderName ? zaloName : `${zaloName} (${msg.senderName})`) : msg.senderName;
  };
  // expanded = false → show collapsed banner row
  // expanded = true  → hide banner row, show full list only
  const [expanded, setExpanded] = useState(false);

  const setExpandedWithNotify = (v: boolean) => {
    setExpanded(v);
    onExpandedChange?.(v);
  };
  const [moreOpenId, setMoreOpenId] = useState<string | null>(null);
  const [confirmUnpinId, setConfirmUnpinId] = useState<string | null>(null);

  useEffect(() => {
    if (!moreOpenId) return;
    const handler = () => setMoreOpenId(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpenId]);

  if (pinnedMessages.length === 0) return null;

  const featured = pinnedMessages[pinnedMessages.length - 1];

  const handleUnpinConfirm = () => {
    if (!confirmUnpinId) return;
    onUnpin(confirmUnpinId);
    setConfirmUnpinId(null);
    setExpandedWithNotify(false);
  };

  // Shared more-menu for a single pinned row
  const MoreMenu = ({ msg }: { msg: VendorMessage }) => (
    <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setMoreOpenId(moreOpenId === msg.id ? null : msg.id)}
        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        title="Tùy chọn"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {moreOpenId === msg.id && (
        <div className="absolute right-0 top-9 z-30 min-w-[150px] rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden text-sm">
          <button
            onClick={() => { setMoreOpenId(null); setConfirmUnpinId(msg.id); }}
            className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-50 w-full text-left"
          >
            <Pin className="h-3.5 w-3.5 text-amber-500" />
            Bỏ ghim
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-white shrink-0 border-y border-brand-100 shadow-surface-sm">

        {/* ── Collapsed banner row (hidden when expanded) ── */}
        {!expanded && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-l-[3px] border-l-brand-400">
            {/* Icon — click → scroll to featured */}
            <button
              onClick={() => onScrollTo(featured.id)}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
              title="Cuộn đến tin nhắn"
            >
              <Pin className="h-4 w-4 text-brand-500 fill-brand-200" />
            </button>

            {/* Content — click → scroll to featured */}
            <button
              onClick={() => onScrollTo(featured.id)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-xs font-semibold text-brand-600 mb-0.5">Tin nhắn đã ghim</p>
              <p className="text-xs text-gray-500 truncate">
                <span className="font-medium text-gray-600">{resolvePinnedSender(featured)}:</span>{" "}
                {getPinnedPreview(featured)}
              </p>
            </button>

            {/* Right: pill (only when >1) + more menu */}
            <div className="flex items-center gap-1 shrink-0">
              {pinnedMessages.length > 1 && (
                <button
                  onClick={() => setExpandedWithNotify(true)}
                  className="flex items-center gap-1 text-xs font-medium border border-brand-200 rounded-full px-2.5 py-1 text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  +{pinnedMessages.length - 1} ghim
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
              <MoreMenu msg={featured} />
            </div>
          </div>
        )}

        {/* ── Expanded list (replaces banner when expanded) ── */}
        {expanded && (
          <div>
            {/* List header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 border-l-[3px] border-l-brand-400">
              <span className="text-xs font-semibold text-gray-700">
                Danh sách ghim ({pinnedMessages.length})
              </span>
              <button
                onClick={() => setExpandedWithNotify(false)}
                className="flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Thu gọn
                <ChevronDown className="h-3 w-3 rotate-180" />
              </button>
            </div>

            {/* Rows */}
            {pinnedMessages.map((pm, idx) => (
              <div
                key={pm.id}
                className={cn("flex items-center gap-2.5 px-4 py-2.5", idx > 0 && "border-t border-gray-100")}
              >
                <button
                  onClick={() => { setExpandedWithNotify(false); onScrollTo(pm.id); }}
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
                  title="Cuộn đến tin nhắn"
                >
                  <Pin className="h-4 w-4 text-brand-500 fill-brand-200" />
                </button>
                <button
                  onClick={() => { setExpandedWithNotify(false); onScrollTo(pm.id); }}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-xs font-semibold text-brand-600 mb-0.5">Tin nhắn đã ghim</p>
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-medium text-gray-600">{resolvePinnedSender(pm)}:</span>{" "}
                    {getPinnedPreview(pm)}
                  </p>
                </button>
                <MoreMenu msg={pm} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Unpin confirmation modal ── */}
      {confirmUnpinId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white rounded-2xl shadow-2xl mx-6 w-full max-w-[300px] overflow-hidden">
            <div className="px-6 py-5 text-center">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                Bạn có chắc muốn bỏ ghim nội dung này không?
              </p>
            </div>
            <div className="border-t border-gray-100 flex">
              <button
                onClick={() => setConfirmUnpinId(null)}
                className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Không
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={handleUnpinConfirm}
                className="flex-1 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
              >
                Bỏ ghim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main container ────────────────────────────────────────────────────────────
interface VendorChatContainerProps {
  groupId: string;
  groupName: string;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
  onScrollToMessageReady?: (fn: (id: string) => void) => void;
  onOpenTaskLog?: (taskId: string) => void;
  onOpenTasks?: () => void;
}

export const VendorChatContainer: React.FC<VendorChatContainerProps> = ({
  groupId,
  groupName,
  showRightPanel,
  onToggleRightPanel,
  onScrollToMessageReady,
  onOpenTaskLog,
  onOpenTasks,
}) => {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const allTasks = useVendorTasksStore((s) => s.tasks);
  const groupDisplayNames = useDemoConfigStore((s) => s.groupDisplayNames);
  const watermarkEnabled = useDemoConfigStore((s) => s.watermarkEnabled);
  const phoneHiddenMap = useDemoConfigStore((s) => s.phoneHidden);
  const getCurrentUserDownloadPermission = useDemoConfigStore((s) => s.getCurrentUserDownloadPermission);
  const isAdmin = currentUser.role === "ADMIN";

  const downloadPerm: DownloadPermission = getCurrentUserDownloadPermission(groupId);
  const showWatermark = watermarkEnabled[groupId] ?? true;
  const isPhoneHidden = phoneHiddenMap[groupId] ?? false;
  const zaloAccount = useZaloAccountForGroup(groupId);
  const group = vendorGroups.find((g) => g.id === groupId);
  const { data: groupMembers } = useVendorMembers(groupId);
  const memberCount = useMemo(
    () => (isAdmin ? groupMembers.length : groupMembers.filter((m) => m.role !== "VENDOR").length),
    [isAdmin, groupMembers]
  );
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);

  const { messages, sendMessage, recallMessage, pinMessage, addReaction, forwardToAdmin, starMessage, assignTask } =
    useVendorActions(groupId);

  // Phone reveal state for this group
  const revealedPhones = useVendorPhoneRevealStore(
    (s) => s.revealedPhones[groupId] ?? EMPTY_PHONE_DIGITS,
  );
  const allRevealRequests = useVendorPhoneRevealStore((s) => s.requests);
  const groupRevealRequests = useMemo(
    () => allRevealRequests.filter((r) => r.groupId === groupId),
    [allRevealRequests, groupId],
  );
  const pendingPhones = useMemo(
    () => groupRevealRequests.filter((r) => r.status === "pending").map((r) => r.phoneDigits),
    [groupRevealRequests],
  );
  const phoneRevealRequestsMap = useMemo(
    () => Object.fromEntries(groupRevealRequests.map((r) => [r.id, r])),
    [groupRevealRequests],
  );
  const { requestReveal, approveReveal, denyReveal, revokeReveal } = usePhoneRevealActions();

  const handleRequestReveal = useCallback(
    (messageId: string, phoneDigits: string, phoneRaw: string) => {
      const groupNameDisplay = groupDisplayNames[groupId] || groupName;
      requestReveal(groupId, groupNameDisplay, messageId, phoneDigits, phoneRaw);
    },
    [groupId, groupName, groupDisplayNames, requestReveal],
  );

  const handleApproveReveal = useCallback(
    (requestId: string) => {
      const req = phoneRevealRequestsMap[requestId];
      if (req) approveReveal(req);
    },
    [phoneRevealRequestsMap, approveReveal],
  );

  const handleDenyReveal = useCallback(
    (requestId: string) => {
      const req = phoneRevealRequestsMap[requestId];
      if (req) denyReveal(req);
    },
    [phoneRevealRequestsMap, denyReveal],
  );

  const handleRevokeReveal = useCallback(
    (requestId: string) => {
      const req = phoneRevealRequestsMap[requestId];
      if (req) revokeReveal(req);
    },
    [phoneRevealRequestsMap, revokeReveal],
  );

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<VendorMessage | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    images: { url: string; fileName: string }[];
    index: number;
  } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [assignSheetMsg, setAssignSheetMsg] = useState<VendorMessage | null>(null);
  const [pendingForwardMsg, setPendingForwardMsg] = useState<VendorMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = messageRefs.current.get(messageId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Background highlight on the full row
    el.style.transition = "background-color 0.25s ease-out";
    el.style.borderRadius = "10px";
    el.style.backgroundColor = "rgba(52, 211, 153, 0.18)";

    // Border highlight only on the inner bubble
    const bubble = el.querySelector("[data-vendor-bubble]") as HTMLElement | null;
    if (bubble) {
      bubble.style.transition = "outline-color 0.25s ease-out";
      bubble.style.outline = "2px solid rgba(52, 211, 153, 0.6)";
      bubble.style.outlineOffset = "1px";
    }

    setTimeout(() => {
      el.style.backgroundColor = "";
      if (bubble) {
        bubble.style.outline = "";
        bubble.style.outlineOffset = "";
      }
      setTimeout(() => {
        el.style.transition = "";
        el.style.borderRadius = "";
        if (bubble) bubble.style.transition = "";
      }, 350);
    }, 1100);
  }, []);

  // Expose scrollToMessage to parent (for starred messages in right panel)
  useEffect(() => {
    onScrollToMessageReady?.(scrollToMessage);
  }, [onScrollToMessageReady, scrollToMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input when replyingTo changes
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPending: PendingFile[] = files.map((f) => ({
      id: `pf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      objectUrl: URL.createObjectURL(f),
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    e.target.value = "";
  };

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSend = () => {
    const hasText = !!inputText.trim();
    const hasFiles = pendingFiles.length > 0;
    if (!hasText && !hasFiles) return;

    const replyRef: VendorReplyRef | null = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          actingAsZaloAccountId: replyingTo.actingAsZaloAccountId,
          content: replyingTo.content,
          contentType: replyingTo.contentType,
          attachments: replyingTo.attachments,
        }
      : null;

    if (hasFiles) {
      const anyVideo = pendingFiles.some((f) => f.file.type.startsWith("video/"));
      const allImages = pendingFiles.every((f) => f.file.type.startsWith("image/"));
      const contentType: VendorMessage["contentType"] = anyVideo ? "VID" : allImages ? "IMG" : "FILE";
      const attachments: VendorAttachment[] = pendingFiles.map((pf) => ({
        id: pf.id,
        fileName: pf.file.name,
        fileSize: pf.file.size,
        contentType: pf.file.type || "application/octet-stream",
        url: pf.objectUrl,
      }));
      sendMessage(hasText ? inputText.trim() : null, contentType, replyRef, attachments);
      setPendingFiles([]);
    } else {
      sendMessage(inputText.trim(), "TXT", replyRef);
    }

    setInputText("");
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isRecalled);

  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) => {
        const q = searchQuery.toLowerCase();
        return (
          m.content?.toLowerCase().includes(q) ||
          m.senderName?.toLowerCase().includes(q)
        );
      })
    : messages;

  // Map message ID → actingAsZaloAccountId for enriching replyTo objects that lack it (e.g. mock JSON)
  const msgAccountMap = useMemo<Record<string, string | null>>(
    () => Object.fromEntries(messages.map((m) => [m.id, m.actingAsZaloAccountId ?? null])),
    [messages]
  );

  // Resolve "ZaloName (senderName)" or just senderName depending on whether a Zalo account was used
  function resolveReplyName(senderName: string, actingAsZaloAccountId: string | null | undefined): string {
    if (!actingAsZaloAccountId) return senderName;
    const zaloName = zaloAccounts.find((a) => a.id === actingAsZaloAccountId)?.displayName;
    return zaloName ? (zaloName === senderName ? zaloName : `${zaloName} (${senderName})`) : senderName;
  }

  // Plain-text phone masking for reply preview bar (non-admin + phoneHidden only)
  function maskPhoneForPreview(text: string | null): string | null {
    if (!text || !isPhoneHidden || isAdmin) return text;
    return text.replace(
      /(?:(?:\+|00)84|0)[2-9]\d[\s.]?\d{3,4}[\s.]?\d{3,4}|1[89]00(?:[\s.]?\d){4,7}/g,
      (p) => {
        const d = p.replace(/[\s.]/g, "");
        if (revealedPhones.includes(d)) return p;
        return d.slice(0, 2) + "*".repeat(d.length - 2);
      },
    );
  }

  // Group consecutive messages from same sender within 3-minute window
  const GROUPING_GAP_MS = 3 * 60 * 1000;
  // ID of the last non-recalled, non-internal message NOT sent by current user
  const lastReceivedMessageId = useMemo(() => {
    for (let i = displayedMessages.length - 1; i >= 0; i--) {
      const m = displayedMessages[i];
      if (m.origin !== "INTERNAL" && m.senderId !== currentUser.id && !m.isRecalled) return m.id;
    }
    return null;
  }, [displayedMessages, currentUser.id]);

  const messageGrouping = useMemo(() => {
    return displayedMessages.map((msg, i) => {
      if (msg.origin === "INTERNAL") return { isFirstInGroup: true, isLastInGroup: true };

      const prev = i > 0 ? displayedMessages[i - 1] : null;
      const next = i < displayedMessages.length - 1 ? displayedMessages[i + 1] : null;

      const canGroupWithPrev =
        prev !== null &&
        prev.origin !== "INTERNAL" &&
        !prev.isRecalled &&
        !msg.isRecalled &&
        prev.isFromVendor === msg.isFromVendor &&
        prev.senderId === msg.senderId &&
        new Date(msg.sentAt).getTime() - new Date(prev.sentAt).getTime() < GROUPING_GAP_MS;

      const canGroupWithNext =
        next !== null &&
        next.origin !== "INTERNAL" &&
        !next.isRecalled &&
        !msg.isRecalled &&
        next.isFromVendor === msg.isFromVendor &&
        next.senderId === msg.senderId &&
        new Date(next.sentAt).getTime() - new Date(msg.sentAt).getTime() < GROUPING_GAP_MS;

      return { isFirstInGroup: !canGroupWithPrev, isLastInGroup: !canGroupWithNext };
    });
  }, [displayedMessages]);
  const displayName = (groupDisplayNames[groupId] || groupName).replace(/^NCC\s*[-–]\s*/i, "");
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
            {initials}
          </div>
          <div className="min-w-0">
            {isAdmin ? (
              <button
                type="button"
                className="group flex items-center gap-1 max-w-full text-left"
                onClick={() => setShowRenameModal(true)}
                title="Đặt tên gợi nhớ"
              >
                <span className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                  {displayName}
                </span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-brand-500 transition-all duration-150" />
              </button>
            ) : (
              <div className="truncate text-sm font-semibold text-gray-900">{displayName}</div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3 w-3" />
              <span>{memberCount} thành viên</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="h-8 w-8 p-0 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowSearch((v) => !v);
              if (showSearch) setSearchQuery("");
            }}
            title="Tìm kiếm trong trò chuyện"
            type="button"
          >
            <Search className="h-4 w-4 text-gray-500" />
          </button>
          {onToggleRightPanel && (
            <button
              className="h-8 w-8 p-0 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              onClick={onToggleRightPanel}
              title={showRightPanel ? "Ẩn thông tin nhóm" : "Hiện thông tin nhóm"}
              type="button"
            >
              {showRightPanel ? (
                <PanelRightClose className="h-4 w-4 text-gray-500" />
              ) : (
                <PanelRightOpen className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────── */}
      {showSearch && (
        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 shrink-0 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tin nhắn trong hội thoại"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            className="shrink-0 text-gray-400 hover:text-gray-600 ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Task banner ────────────────────────────────────────── */}
      {onOpenTasks && (
        <VendorTaskBanner groupId={groupId} onViewTasks={onOpenTasks} />
      )}

      {/* ── Pinned messages bar ────────────────────────────────── */}
      <PinnedMessagesBar
        pinnedMessages={pinnedMessages}
        onScrollTo={scrollToMessage}
        onUnpin={pinMessage}
        onExpandedChange={setPinnedExpanded}
        zaloAccounts={zaloAccounts}
        groupZaloAccountId={group?.zaloAccountId ?? null}
      />

      {/* ── Content area (message list + reply + input) ────────── */}
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* Overlay khi danh sách ghim mở rộng */}
        {pinnedExpanded && (
          <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px]" />
        )}

        {/* ── Message list ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-8 pb-3">
        {displayedMessages.length === 0 && searchQuery.trim() && (
          <div className="flex flex-col items-center justify-center h-32 text-sm text-gray-400">
            Không tìm thấy tin nhắn nào.
          </div>
        )}
        {displayedMessages.map((msg, i) => {
          const { isFirstInGroup, isLastInGroup } = messageGrouping[i];
          const baseMsg = isAdmin ? msg : { ...msg, recalledContent: null };
          // Enrich replyTo.actingAsZaloAccountId from the messages map (mock JSON lacks this field)
          const displayMsg = baseMsg.replyTo && !baseMsg.replyTo.actingAsZaloAccountId
            ? { ...baseMsg, replyTo: { ...baseMsg.replyTo, actingAsZaloAccountId: msgAccountMap[baseMsg.replyTo.id] ?? null } }
            : baseMsg;
          return (
            <div
              key={msg.id}
              ref={(el) => {
                if (el) messageRefs.current.set(msg.id, el);
                else messageRefs.current.delete(msg.id);
              }}
            >
              <VendorMessageBubble
                message={displayMsg}
                isAdmin={isAdmin}
                currentUserId={currentUser.id}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                isLastReceivedMessage={msg.id === lastReceivedMessageId}
                linkedTask={(() => {
                  const t = (allTasks[groupId] ?? []).find((t) => t.sourceMessageId === msg.id);
                  return t ? { id: t.id, logCount: t.logCount ?? 0 } : undefined;
                })()}
                zaloAccounts={zaloAccounts}
                groupZaloAccountId={group?.zaloAccountId ?? null}
                onReply={setReplyingTo}
                onRecall={recallMessage}
                onPin={pinMessage}
                onToggleStar={starMessage}
                onReact={addReaction}
                onForwardToAdmin={(msgId) => {
                  const found = messages.find((m) => m.id === msgId);
                  if (found) setPendingForwardMsg(found);
                }}
                onAssignTask={(msgId) => {
                  const found = messages.find((m) => m.id === msgId);
                  if (found) setAssignSheetMsg(found);
                }}
                onScrollToReply={scrollToMessage}
                onOpenTaskLog={onOpenTaskLog}
                phoneHidden={isPhoneHidden}
                revealedPhones={revealedPhones}
                pendingPhones={pendingPhones}
                onRequestReveal={!isAdmin && isPhoneHidden ? handleRequestReveal : undefined}
                onApproveReveal={isAdmin ? handleApproveReveal : undefined}
                onDenyReveal={isAdmin ? handleDenyReveal : undefined}
                onRevokeReveal={isAdmin ? handleRevokeReveal : undefined}
                phoneRevealRequestsMap={phoneRevealRequestsMap}
                onScrollToRevealSource={scrollToMessage}
                onImageClick={(attachments, idx) => {
                  setImagePreview({
                    images: attachments.map((a) => ({ url: a.url, fileName: a.fileName })),
                    index: idx,
                  });
                }}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Reply preview — matches portal QuotedMessagePreview "input" variant ── */}
      {replyingTo && (() => {
        const imgs = replyingTo.attachments.filter((a) => a.contentType?.startsWith("image/"));
        const fls = replyingTo.attachments.filter((a) => !a.contentType?.startsWith("image/"));
        const firstImg = imgs[0] ?? null;
        const firstFl = fls[0] ?? null;
        return (
          <div className="border-t border-gray-100 bg-gray-50 px-3 pt-3 pb-2 shrink-0">
            <div className="group relative border-l-[3px] border-l-brand-500 bg-gray-50 rounded-xl p-2 flex items-start gap-2">
              {/* Thumbnail LEFT */}
              {firstImg && (
                <div className="flex-shrink-0 relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={firstImg.url}
                    alt={firstImg.fileName ?? "Ảnh"}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {imgs.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-bold rounded-lg">
                      +{imgs.length - 1}
                    </div>
                  )}
                </div>
              )}
              {!firstImg && firstFl && (
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200">
                  {replyingTo.contentType === "VID" ? (
                    <Play size={18} className="text-gray-500 ml-0.5" />
                  ) : (
                    <FileText size={18} className="text-gray-500" />
                  )}
                </div>
              )}

              {/* Content RIGHT */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <Quote size={14} className="text-gray-400" />
                    <span className="text-gray-600 truncate">
                      {resolveReplyName(replyingTo.senderName, replyingTo.actingAsZaloAccountId)}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition shrink-0"
                    aria-label="Hủy trả lời"
                  >
                    <X size={16} />
                  </button>
                </div>
                {firstImg && (
                  <p className="text-xs italic text-gray-400">Hình ảnh</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2">{maskPhoneForPreview(replyingTo.content)}</p>
                {replyingTo.attachments.length > 0 && (
                  <p className="text-xs mt-0.5 text-gray-400">
                    {firstImg && fls.length > 0
                      ? `và ${fls.length} tệp đính kèm`
                      : !firstImg && firstFl
                        ? fls.length > 1
                          ? `và ${fls.length - 1} tệp đính kèm`
                          : firstFl.fileName
                        : null}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Input area ─────────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-3 shrink-0">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="rounded-xl border border-gray-200 bg-gray-50 focus-within:border-emerald-400 focus-within:bg-white transition-colors">
          {/* Pending file preview strip */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-2.5 pb-1">
              {pendingFiles.map((pf) => {
                const isImg = pf.file.type.startsWith("image/");
                const isVid = pf.file.type.startsWith("video/");
                return (
                  <div key={pf.id} className="relative group/pending">
                    {isImg ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        <img
                          src={pf.objectUrl}
                          alt={pf.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 max-w-[140px]">
                        {isVid ? (
                          <Play className="h-4 w-4 text-gray-400 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        )}
                        <span className="text-xs text-gray-600 truncate">{pf.file.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePending(pf.id)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-600 text-white flex items-center justify-center opacity-0 group-hover/pending:opacity-100 transition-opacity"
                      aria-label="Xóa tệp"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text input row */}
          <div className="flex items-end gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors mb-0.5"
              aria-label="Đính kèm tệp"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors mb-0.5"
              aria-label="Gửi hình ảnh"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Nhập tin nhắn..."
              className={cn(
                "flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none",
                "max-h-32 overflow-y-auto leading-relaxed"
              )}
              style={{ minHeight: "1.5rem" }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && pendingFiles.length === 0}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors mb-0.5",
                (inputText.trim() || pendingFiles.length > 0)
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
              aria-label="Gửi"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p className="mt-1 text-[10px] text-gray-400 text-center">
          Enter để gửi · Shift+Enter xuống dòng
        </p>
      </div>
      </div>{/* end content area wrapper */}

      {showRenameModal && (
        <RenameGroupModal
          groupId={groupId}
          originalName={groupName}
          onClose={() => setShowRenameModal(false)}
        />
      )}

      <VendorAssignTaskSheet
        open={!!assignSheetMsg}
        groupId={groupId}
        messageId={assignSheetMsg?.id}
        messageContent={assignSheetMsg?.content ?? undefined}
        phoneHidden={isPhoneHidden}
        onClose={() => setAssignSheetMsg(null)}
        onAssignTask={assignTask}
      />

      {imagePreview && (
        <VendorImagePreviewModal
          open={!!imagePreview}
          onOpenChange={(open) => { if (!open) setImagePreview(null); }}
          images={imagePreview.images}
          initialIndex={imagePreview.index}
          canDownload={downloadPerm.canDownloadImages}
          showWatermark={showWatermark}
        />
      )}

      {pendingForwardMsg && (
        <ForwardToAdminModal
          message={pendingForwardMsg}
          vendorGroupName={groupName}
          onConfirm={(comment) => {
            forwardToAdmin(pendingForwardMsg.id, comment);
            setPendingForwardMsg(null);
          }}
          onClose={() => setPendingForwardMsg(null)}
        />
      )}
    </div>
  );
};
