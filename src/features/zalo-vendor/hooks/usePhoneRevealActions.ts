import { useCallback } from "react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import { useVendorMessagesStore } from "@/stores/vendorMessagesStore";
import {
  useVendorPhoneRevealStore,
  type PhoneRevealRequest,
} from "@/stores/vendorPhoneRevealStore";
import type { VendorInternalMessageType, VendorMessage } from "@/types/zalo";

function buildRevealSystemMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  content: string,
  internalType: VendorInternalMessageType,
  linkedPhoneRequestId: string,
  now: string,
): VendorMessage {
  return {
    id: `msg_${internalType?.toLowerCase()}_${Date.now()}`,
    groupId,
    senderId,
    senderName,
    senderAvatarUrl: null,
    origin: "INTERNAL",
    isFromVendor: false,
    actingAsZaloAccountId: null,
    content,
    contentType: "TXT",
    attachments: [],
    reactions: [],
    replyTo: null,
    isPinned: false,
    isRecalled: false,
    recalledContent: null,
    recalledAt: null,
    isForwardedToAdmin: false,
    internalType,
    linkedTaskId: null,
    linkedPhoneRequestId,
    sentAt: now,
    editedAt: null,
  };
}

export function usePhoneRevealActions() {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const dispatch = useVendorMessagesStore((s) => s.dispatch);
  const addRequest = useVendorPhoneRevealStore((s) => s.addRequest);
  const approveRequest = useVendorPhoneRevealStore((s) => s.approveRequest);
  const denyRequest = useVendorPhoneRevealStore((s) => s.denyRequest);
  const revokeRequest = useVendorPhoneRevealStore((s) => s.revokeRequest);

  const requestReveal = useCallback(
    (
      groupId: string,
      groupName: string,
      messageId: string,
      phoneDigits: string,
      phoneRaw: string,
    ) => {
      const now = new Date().toISOString();
      const requestId = `pr_${Date.now()}`;

      addRequest({
        id: requestId,
        groupId,
        groupName,
        messageId,
        phoneDigits,
        phoneRaw,
        requestedByStaffId: currentUser.id,
        requestedByName: currentUser.displayName,
        requestedAt: now,
        status: "pending",
      });

      dispatch({
        type: "SEND_MESSAGE",
        groupId,
        message: buildRevealSystemMessage(
          groupId,
          currentUser.id,
          currentUser.displayName,
          `${currentUser.displayName} yêu cầu xem số điện thoại trong tin nhắn`,
          "PHONE_REVEAL_REQUEST",
          requestId,
          now,
        ),
      });
    },
    [currentUser, addRequest, dispatch],
  );

  const approveReveal = useCallback(
    (req: PhoneRevealRequest) => {
      const now = new Date().toISOString();
      approveRequest(req.id, currentUser.id, currentUser.displayName);
      dispatch({
        type: "SEND_MESSAGE",
        groupId: req.groupId,
        message: buildRevealSystemMessage(
          req.groupId,
          currentUser.id,
          currentUser.displayName,
          `${currentUser.displayName} đã duyệt — ${req.requestedByName} có thể xem số điện thoại`,
          "PHONE_REVEAL_APPROVED",
          req.id,
          now,
        ),
      });
    },
    [currentUser, approveRequest, dispatch],
  );

  const denyReveal = useCallback(
    (req: PhoneRevealRequest) => {
      const now = new Date().toISOString();
      denyRequest(req.id, currentUser.id, currentUser.displayName);
      dispatch({
        type: "SEND_MESSAGE",
        groupId: req.groupId,
        message: buildRevealSystemMessage(
          req.groupId,
          currentUser.id,
          currentUser.displayName,
          `${currentUser.displayName} đã từ chối yêu cầu xem số điện thoại của ${req.requestedByName}`,
          "PHONE_REVEAL_DENIED",
          req.id,
          now,
        ),
      });
    },
    [currentUser, denyRequest, dispatch],
  );

  const revokeReveal = useCallback(
    (req: PhoneRevealRequest) => {
      const now = new Date().toISOString();
      revokeRequest(req.id, currentUser.id, currentUser.displayName);
      dispatch({
        type: "SEND_MESSAGE",
        groupId: req.groupId,
        message: buildRevealSystemMessage(
          req.groupId,
          currentUser.id,
          currentUser.displayName,
          `${currentUser.displayName} đã thu hồi quyền xem số điện thoại`,
          "PHONE_REVEAL_REVOKED",
          req.id,
          now,
        ),
      });
    },
    [currentUser, revokeRequest, dispatch],
  );

  return { requestReveal, approveReveal, denyReveal, revokeReveal };
}
