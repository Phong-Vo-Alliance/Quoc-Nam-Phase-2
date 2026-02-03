// ===== Common =====
type ID = string;
type ISODate = string; // ISO 8601

// Định nghĩa tất cả type & interface
export type BadgeType =
  | "processing"
  | "waiting"
  | "done"
  | "danger"
  | "neutral";
export type ToastKind = "success" | "info" | "warning" | "error";
export type UserRole = "admin" | "leader" | "staff";

export interface ToastMsg {
  id: string;
  kind: ToastKind;
  msg: string;
}

// ===== Tasks & Checklist =====
export type TaskStatusCode =
  | "todo"             // Chưa xử lý
  | "doing"            // Đang xử lý (API uses "doing" not "in_progress")
  | "need_to_verified" // Chờ duyệt (API uses "need_to_verified" not "awaiting_review")
  | "finished";        // Hoàn thành (API uses "finished" not "done")

export interface TaskStatusObject {
  id: string;
  code: TaskStatusCode;
  label: string;
  level: number;
  color: string;
}

export interface TaskPriorityDto {
  id: string;
  code: "low" | "normal" | "high" | "urgent";
  label: string;
  level: number;
  color: string;
}

export interface ChecklistItem {
  id: ID;
  label: string;
  done: boolean;
  doneAt?: ISODate;
  doneById?: ID;
}

// CheckItemDto from API
export interface CheckItemDto {
  id: string;
  content: string | null;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface ChecklistTemplate {
  id: ID;
  name: string;
  workTypeId?: ID;  // template có thể gắn theo work type
  items: string[];  // labels
  createdById: ID;
  createdAt: ISODate;
}

export interface TaskEvent {
  at: ISODate;
  byId: ID;
  type: "status_change" | "assignee_change" | "checklist_update" | "comment";
  payload?: any;
}

export interface TaskPermissions {
  canChangeToNeedVerify: boolean;
  canChangeToFinished: boolean;
  canChangeToTodo: boolean;
  canChangeToDoing: boolean;
  canReassign: boolean;
  canDelete: boolean;
  canEditContent: boolean;
  isCreator: boolean;
  isAssignee: boolean;
  userRole?: string | null;
}

export interface Task {
  id: ID;
  
  // Conversation and work type (legacy groupId kept for backward compatibility)
  groupId?: ID;           // DEPRECATED: use conversationId instead
  conversationId?: ID;     // From API: conversationId
  workTypeId?: ID;
  workTypeName?: string;
  
  // Checklist template reference (API uses checklistTemplateId)
  checklistTemplateId?: string | null;  // From API
  progressText?: string;

  messageId?: ID | null;   // message gốc dùng để tạo task (nullable in API)
  title: string;
  description?: string | null;

  assignTo: ID;              // người được giao (staff)
  assignFrom: ID;            // leader giao
  status: TaskStatusObject;  // Status is an object from API, not a simple string

  priority?: TaskPriorityDto;
  dueDate?: ISODate | null;  // API uses dueDate, not dueAt
  dueAt?: ISODate;           // DEPRECATED: kept for backward compatibility

  // pending: staff muốn để sau 2-3 ngày (not in API)
  isPending?: boolean;
  pendingUntil?: ISODate;

  // Checklist items (API response)
  checkItems?: CheckItemDto[] | null;  // From API: checkItems
  
  // Legacy checklist format (kept for backward compatibility)
  checklist?: ChecklistItem[];   // DEPRECATED: convert from checkItems
  
  // Completion percentage from API
  completionPercentage?: number;
  
  // Attachments from API
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
  }> | null;
  
  history?: TaskEvent[];         // log thay đổi (not in API directly)

  permissions?: TaskPermissions; // permissions từ API

  createdAt: ISODate;
  updatedAt?: ISODate | null;
}

export interface LeadThread {
  id: string;
  t: string;
  type: 'Nội bộ' | 'POS';
  owner: string;
  st: 'Đang xử lý' | 'Chờ phản hồi' | 'Đã chốt';
  at: string;
}

// Dùng chung cho mọi loại file đính kèm (ảnh, pdf, excel, word, v.v.)
export type AttachmentType = "pdf" | "excel" | "word" | "image" | "other";

export interface FileAttachment {
  name: string;
  url: string;
  type: AttachmentType;
  size?: string;
  id:string;
}

/* ---------------- Message Types ---------------- */
export interface Message {
  /** Mã định danh duy nhất */
  id: string;
  groupId: ID;
  senderId: ID;

  /** Kiểu tin nhắn */
  type: "text" | "image" | "file" | "system";

  /** Người gửi */
  sender: string;

  /** Nội dung chính (text hoặc caption) */
  content?: string;

  /** Thời gian gửi (hiển thị UI) */
  time: string;

  /** Timestamp (Unix ms) - Phase 4: for message grouping */
  timestamp?: number;

  /** Có phải là tin nhắn của user hiện tại không */
  isMine?: boolean;

  files?: FileAttachment[];

  /** vẫn giữ fileInfo cũ để backward-compatible **/
  fileInfo?: FileAttachment;

  /** Tin nhắn gốc nếu đây là reply */
  replyTo?: {
    id: string;
    type: "text" | "file" | "image";
    sender: string;
    content?: string;
    files?: {
      name: string;
      url: string;
      type: "image";
    }[];
    fileInfo?: FileAttachment;
  };

  /** Đánh dấu tin nhắn */
  isPinned?: boolean;

  /** Đánh sao tin nhắn (starred/important) */
  isStarred?: boolean;

  /** Cờ hệ thống: phân cách ngày, sự kiện */
  isSystem?: boolean;

  createdAt: ISODate;

  // liên kết loại việc nếu tin nhắn được chuyển thành task
  workTypeId?: ID;

  // liên kết nhiệm vụ nếu tin nhắn được chuyển thành task
  taskId?: ID;
}

/**
 * Message trong thread Nhật ký công việc của Task
 * 1 Task <-> 1 thread, nên taskId cũng là threadId
 */
export interface TaskLogMessage {
  /** Mã định danh message trong thread */
  id: string;

  /** Task / thread mà message này thuộc về */
  taskId: ID;

  /** Người gửi */
  senderId: ID;
  sender: string;

  /** Kiểu tin nhắn (text / image / file / system) */
  type: "text" | "image" | "file" | "system";

  /** Nội dung chính (text hoặc caption) */
  content?: string;

  /** Thời gian gửi (ISO string, dùng cho hiển thị) */
  time: string;
  createdAt: ISODate;

  /** Có phải tin của current user không (phục vụ align bên phải) */
  isMine?: boolean;

  /** File / ảnh đính kèm nếu có */
  files?: FileAttachment[];
  fileInfo?: FileAttachment;

  /** Reply tới một message khác trong cùng thread */
  replyTo?: Message["replyTo"];
}

/* ---------------- User Types ---------------- */
export interface User {
  id: ID;
  displayName: string;
  email: string;

  roles: UserRole[];          // quyền toàn cục (admin portal, v.v.)
  departmentIds: ID[];        // có thể 1 hoặc nhiều (tuỳ doanh nghiệp)
  primaryDepartmentId?: ID;   // dùng cho Staff trải nghiệm tốt hơn
  active: boolean;
  createdAt: ISODate;
}

export interface Department {
  id: ID;
  name: string;
  leaderId: ID;         // đúng 1 leader/phòng
  memberIds: ID[];      // gồm cả leader
  createdAt: ISODate;
}

export interface ChecklistVariant {
  id: string;            // ví dụ: "nhanHang_kiemDem"
  name: string;          // ví dụ: "Kiểm đếm"
  description?: string;  // mô tả thêm nếu cần
  isDefault?: boolean;   // variant mặc định cho workType
}

// ===== Group & Work Types =====
export interface WorkType {
  id: ID;
  key: string;         // "nhan_hang" | "doi_tra" | ...
  name: string;        // "Nhận hàng", "Đổi trả", ...
  icon?: string;       // lucide icon name
  color?: string;      // brand subcolor cho chip/badge

  /** Danh sách các dạng checklist con (Kiểm đếm / Lưu trữ / Thanh toán / ...) */
  checklistVariants?: ChecklistVariant[];
}

export interface GroupMember {
  userId: ID;
  role: "leader" | "staff";
  isAutoJoined?: boolean; // true nếu là leader của phòng ban liên kết
  joinedAt: ISODate;
  addedById?: ID;         // ai thêm vào (admin/leader), nếu không auto
}

export interface GroupChat {
  id: ID;
  name: string;               // "Vận Hành - Kho"
  description?: string;
  departmentIds: ID[];        // 2-3 phòng ban
  members: GroupMember[];     // leaders auto + staff do leader assign
  workTypes: WorkType[];      // loại việc được cấu hình riêng cho group
  defaultWorkTypeId?: ID;     // filter mặc định khi vào group
  lastSender?: string;   // "Huyền"
  lastMessage?: string;  // text | "[hình ảnh]" | "[pdf]"
  lastTime?: string;     // "09:45"
  unreadCount?: number;  // 0 | 1 | 2...
  createdAt: ISODate;

  // Phase 4: Conversation metadata
  status?: string; // "Active" | "Archived" | etc.
  onlineCount?: number; // số thành viên đang online
  avatarFileId?: string; // ID của file avatar (not available yet from API)
}

/* ---------------- Work Types ---------------- */
// export interface WorkItem {
//   id: string;
//   title: string;
//   status: "open" | "done" | "in-progress";
//   assignedTo: string;
// }

export interface PinnedMessage {
  id: string;                     // id của pinned entry
  chatId: string;                 // group id nơi message xuất hiện
  groupName: string;              // tên nhóm chat (category name)
  groupId?: string;               // category id
  workTypeName?: string;          // tên loại việc (conversation/worktype name)
  workTypeId?: string;            // conversation/worktype id

  sender: string;                 // tên người gửi
  type: "text" | "image" | "file";

  content?: string;               // nội dung text (nếu là text)
  preview?: string;               // preview rút gọn để hiển thị list

  fileInfo?: FileAttachment;      // thumbnail hoặc file info (image/pdf/etc)

  time: string;                   // thời gian gửi tin nhắn (ISO), dùng để group
}

// ===== Preferences (per user per group) =====
export interface GroupUserPreference {
  userId: ID;
  groupId: ID;
  defaultWorkTypeId?: ID;  // nhớ filter mặc định của user trong group
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ===== Permission gợi ý (nếu cần mock chi tiết) =====
export type Permission =
  | "view_group"
  | "assign_staff_to_group"
  | "view_all_tasks_in_group"
  | "change_any_task_status"
  | "convert_message_to_task"
  | "create_checklist_template"
  | "change_own_task_status"
  | "mark_task_pending";

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// ===== Tiếp nhận thông tin =====
export interface ReceivedInfo {
  id: string;
  messageId: string;
  groupId: string;
  title: string;
  sender: string;
  createdAt: string;
  status: "waiting" | "assigned" | "transferred";
  transferredTo?: string;  // departmentId
  transferredToGroupName?: string;
  transferredWorkTypeName?: string;
}

// ===== Checklist task Template Item =====
export type ChecklistTemplateItem = {
  id: string;        // id template
  label: string;     // tên checklist mặc định
};

export type ChecklistTemplateMap = Record<
  string,               // workTypeId
  Record<
    string,             // checklistVariantId
    ChecklistTemplateItem[]
  >
>;

// ===== Helper functions for Task backward compatibility =====

/**
 * Convert CheckItemDto from API to legacy ChecklistItem format
 */
export function convertCheckItemToLegacy(item: CheckItemDto): ChecklistItem {
  return {
    id: item.id,
    label: item.content || "",
    done: item.isCompleted,
    doneAt: item.completedAt || undefined,
  };
}

/**
 * Convert legacy ChecklistItem to API CheckItemDto format
 */
export function convertLegacyToCheckItem(item: ChecklistItem): CheckItemDto {
  return {
    id: item.id,
    content: item.label,
    order: 0, // Order will be set by API
    isCompleted: item.done,
    completedAt: item.doneAt || null,
  };
}

/**
 * Normalize Task from API response to include legacy fields
 * This ensures backward compatibility with existing UI code
 */
export function normalizeTaskFromAPI(task: Task): Task {
  return {
    ...task,
    // Ensure conversationId is set (API uses conversationId)
    conversationId: task.conversationId || task.groupId,
    groupId: task.conversationId || task.groupId, // Backward compatibility
    
    // Convert checkItems to legacy checklist format
    checklist: task.checkItems?.map(convertCheckItemToLegacy) || task.checklist || [],
    
    // Calculate progressText from checkItems if not present
    progressText: task.progressText || (task.checkItems && task.checkItems.length > 0
      ? `${task.checkItems.filter(i => i.isCompleted).length}/${task.checkItems.length} mục`
      : "Không có checklist"),
    
    // Support both dueDate (API) and dueAt (legacy)
    dueDate: task.dueDate || task.dueAt || null,
    dueAt: task.dueDate || task.dueAt,
    
    // Ensure messageId is handled properly (API allows null)
    messageId: task.messageId || undefined,
  };
}