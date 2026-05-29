// Zalo vendor integration types
// Production-ready: matches planned API contract
// PRODUCTION MIGRATION: replace hook implementations in src/features/zalo-vendor/hooks/

// ─── Zalo Account ───────────────────────────────────────────────

export interface ZaloAccount {
  id: string
  zaloUserId: string
  displayName: string
  avatarUrl: string | null
  phoneNumber: string | null
  linkedAt: string
  isActive: boolean
}

// ─── Vendor Group ────────────────────────────────────────────────

export type VendorMessageOrigin = 'ZALO' | 'INTERNAL'

export type VendorMessageContentType = 'TXT' | 'IMG' | 'FILE' | 'VID' | 'SYS'

export interface VendorLastMessage {
  id: string
  content: string | null
  contentType: VendorMessageContentType
  senderName: string
  origin: VendorMessageOrigin
  sentAt: string
  isRecalled?: boolean
}

export interface VendorGroup {
  id: string
  zaloGroupId: string
  name: string
  avatarUrl: string | null
  zaloAccountIds: string[]    // Zalo accounts that sync this group (multi-account support)
  memberCount: number
  lastMessage: VendorLastMessage | null
  unreadCount: number
  isPinned: boolean            // feature #12
  syncedAt: string
  createdAt: string
}

// ─── Vendor Members ──────────────────────────────────────────────

export type VendorMemberRole = 'ADMIN' | 'STAFF' | 'VENDOR'  // feature #17

export interface VendorMember {
  id: string
  role: VendorMemberRole
  displayName: string
  avatarUrl: string | null
  // VENDOR role: Zalo info
  zaloUserId: string | null
  zaloDisplayName: string | null
  // ADMIN/STAFF role: internal info
  internalUserId: string | null
  email: string | null
  // STAFF only: download permission for this group (#14/#23)
  canDownload?: boolean
}

// ─── Vendor Messages ─────────────────────────────────────────────

export interface VendorAttachment {
  id: string
  fileName: string
  fileSize: number
  contentType: string         // MIME type
  url: string                 // PRODUCTION: real file URL from API
}

export interface VendorReaction {
  emoji: '❤️' | '👍'
  userId: string
  userName: string
}

export interface VendorReplyRef {
  id: string
  senderName: string
  actingAsZaloAccountId: string | null  // for attribution: "ZaloName (senderName)"
  content: string | null
  contentType: VendorMessageContentType
  attachments: VendorAttachment[]   // for thumbnail/file preview in quote
}

export type VendorInternalMessageType =
  | 'TASK'
  | 'NOTE'
  | 'FORWARD'
  | 'PHONE_REVEAL_REQUEST'
  | 'PHONE_REVEAL_APPROVED'
  | 'PHONE_REVEAL_DENIED'
  | 'PHONE_REVEAL_REVOKED'
  | null

export interface VendorMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null

  // Origin: ZALO = visible on Zalo, INTERNAL = internal only (features #11, #18, #19)
  origin: VendorMessageOrigin
  isFromVendor: boolean                     // true = vendor side, false = staff side
  actingAsZaloAccountId: string | null      // which Zalo account sent this (staff messages)

  content: string | null
  contentType: VendorMessageContentType
  attachments: VendorAttachment[]

  reactions: VendorReaction[]
  replyTo: VendorReplyRef | null            // feature #7
  isPinned: boolean                          // feature #10
  isStarred?: boolean                        // feature: đánh dấu tin nhắn
  isRecalled: boolean                        // feature #9
  recalledContent: string | null             // feature #9: admin sees original
  recalledAt: string | null                  // feature #9: timestamp for admin display
  isForwardedToAdmin: boolean                // feature #11

  internalType: VendorInternalMessageType   // TASK | NOTE | FORWARD | PHONE_REVEAL_* (internal messages)
  linkedTaskId: string | null               // feature #19: task linked to this TASK message
  linkedPhoneRequestId?: string | null      // phone reveal request linked to PHONE_REVEAL_* messages

  sentAt: string
  editedAt: string | null
}

// ─── Demo Users (for demoConfigStore) ───────────────────────────

export type DemoUserRole = 'ADMIN' | 'STAFF'

export interface DemoUser {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: DemoUserRole
  department: string
}

// ─── Download Permissions ────────────────────────────────────────

export interface DownloadPermission {
  canDownloadImages: boolean
  canDownloadFiles: boolean
  canDownloadVideos: boolean
}

// ─── Vendor Tasks (feature #18, #19) ────────────────────────────

export type VendorTaskStatus = 'todo' | 'doing' | 'finished'

export interface VendorTaskChecklist {
  id: string
  text: string
  done: boolean
}

export interface VendorTask {
  id: string
  groupId: string
  title: string
  description: string | null
  status: VendorTaskStatus
  assignToId: string        // internalUserId of assignee
  assignToName: string
  assignedById: string      // internalUserId of assigner
  assignedByName: string
  checklist: VendorTaskChecklist[]
  sourceMessageId: string | null  // message that triggered task creation
  logCount?: number               // feature #19: reply count in task log thread
  createdAt: string
  updatedAt: string
}

// ─── Vendor Task Log (feature #19) ──────────────────────────────

export interface VendorTaskLogMessage {
  id: string
  taskId: string
  senderId: string
  senderName: string
  content: string
  sentAt: string
}
