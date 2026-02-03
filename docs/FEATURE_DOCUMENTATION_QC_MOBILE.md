# 📋 Tài Liệu Mô Tả Tính Năng - Quốc Nam Portal Internal Chat

> **Phiên bản:** 2.0  
> **Cập nhật:** 26/01/2026  
> **Dành cho:** Team QC & Team Mobile Development

---

## 📌 Tổng Quan Hệ Thống

### 1.1. Giới Thiệu

**Quốc Nam Portal Internal Chat** là hệ thống chat nội bộ doanh nghiệp dùng cho việc giao tiếp, quản lý công việc và chia sẻ tài liệu giữa các phòng ban.

### 1.2. Tech Stack

| Layer            | Công nghệ                                             |
| ---------------- | ----------------------------------------------------- |
| Frontend         | React 19, TypeScript 5, Vite                          |
| UI Framework     | TailwindCSS, Radix UI, Lucide Icons                   |
| State Management | TanStack Query (server state), Zustand (client state) |
| Real-time        | SignalR (@microsoft/signalr)                          |
| HTTP Client      | Axios                                                 |
| Form Validation  | React Hook Form + Zod                                 |
| Testing          | Vitest (Unit), Playwright (E2E)                       |

### 1.3. Phân Quyền Người Dùng (Roles)

| Role       | Mô tả                  | Quyền hạn                                             |
| ---------- | ---------------------- | ----------------------------------------------------- |
| **Admin**  | Quản trị viên hệ thống | Toàn quyền                                            |
| **Leader** | Trưởng nhóm/phòng ban  | Xem tất cả conversation, giao task, quản lý nhân viên |
| **Staff**  | Nhân viên              | Chat, nhận task, báo cáo công việc                    |

---

## 🔐 Module 1: Authentication (Xác thực)

### 1.1. Tính năng Đăng nhập

**Endpoint:** `POST /auth/login`

**Màn hình:** Login Page (`/login`)

#### Flow đăng nhập:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Nhập thông  │ --> │  Gửi API     │ --> │  Lưu token   │
│  tin đăng    │     │  Login       │     │  + redirect  │
│  nhập        │     │              │     │  to Portal   │
└──────────────┘     └──────────────┘     └──────────────┘
```

#### Thông tin đăng nhập:

| Field      | Type   | Required | Validation        |
| ---------- | ------ | -------- | ----------------- |
| identifier | string | ✅       | Không rỗng        |
| password   | string | ✅       | Tối thiểu 1 ký tự |

#### Response thành công:

```json
{
  "requiresMfa": false,
  "mfaToken": null,
  "mfaMethod": null,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "identifier": "username",
    "roles": ["leader", "staff"]
  }
}
```

#### Error Codes:

| Code                | Message                 | Mô tả                        |
| ------------------- | ----------------------- | ---------------------------- |
| INVALID_CREDENTIALS | Sai thông tin đăng nhập | Username/password không đúng |
| ACCOUNT_LOCKED      | Tài khoản bị khóa       | Đăng nhập sai quá nhiều lần  |
| NETWORK_ERROR       | Lỗi kết nối             | Không thể kết nối server     |

#### Test Cases:

- [x] Đăng nhập thành công với credentials hợp lệ
- [x] Hiển thị lỗi khi credentials không hợp lệ
- [x] Disable button khi đang loading
- [x] Redirect về portal sau khi đăng nhập thành công
- [x] Hiển thị/ẩn password toggle

### 1.2. Tính năng Đăng xuất

**Action:** Clear token + redirect to login

#### Flow đăng xuất:

1. Clear localStorage (accessToken, auth-storage)
2. Clear TanStack Query cache (prevent data leakage)
3. Clear conversation store
4. Redirect to `/login`

---

## 💬 Module 2: Chat/Conversations

### 2.1. Danh sách Conversation (Sidebar trái)

**Component:** `ConversationListSidebar`

**Endpoint:** `GET /api/categories` (trả về categories + conversations)

#### UI Elements:

| Element           | data-testid                 | Mô tả                       |
| ----------------- | --------------------------- | --------------------------- |
| Ô tìm kiếm        | `conversation-search-input` | Tìm kiếm conversation       |
| Tab Nhóm          | `tab-categories`            | Chuyển tab danh sách nhóm   |
| Tab Cá nhân       | `tab-contacts`              | Chuyển tab tin nhắn cá nhân |
| Conversation item | `conversation-item-{id}`    | Item trong danh sách        |
| Badge unread      | `unread-badge-{id}`         | Số tin nhắn chưa đọc        |

#### Features:

- ✅ Phân nhóm conversation theo **Category** (Vận Hành, CSKH, v.v.)
- ✅ Hiển thị **unread count** (badge số đỏ)
- ✅ Hiển thị **tin nhắn cuối** (preview)
- ✅ Hiển thị **thời gian tin nhắn cuối**
- ✅ **Real-time update** qua SignalR (tin mới, unread count)
- ✅ **Search/filter** conversations
- ✅ Lưu conversation đã chọn vào localStorage (persist khi refresh)

#### Data Structure - Category:

```typescript
interface CategoryDto {
  id: string; // UUID
  name: string; // "Vận Hành", "CSKH"
  conversations: ConversationInfoDto[];
}

interface ConversationInfoDto {
  conversationId: string;
  conversationName: string;
  memberCount: number;
  unreadCount: number;
  lastMessage: {
    messageId: string;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string; // ISO 8601
  } | null;
}
```

### 2.2. Khung Chat (Chat Panel)

**Component:** `ChatMainContainer`

**Endpoints:**

- `GET /api/conversations/{id}/messages` - Lấy tin nhắn
- `POST /api/messages` - Gửi tin nhắn
- `POST /api/conversations/{id}/mark-read` - Đánh dấu đã đọc

#### UI Elements:

| Element          | data-testid          | Mô tả                     |
| ---------------- | -------------------- | ------------------------- |
| Header           | `chat-header`        | Hiển thị tên conversation |
| Message list     | `message-list`       | Danh sách tin nhắn        |
| Message item     | `message-item-{id}`  | Một tin nhắn              |
| Input box        | `chat-message-input` | Ô nhập tin nhắn           |
| Send button      | `chat-send-button`   | Nút gửi                   |
| Attach button    | `chat-attach-button` | Nút đính kèm file         |
| Loading skeleton | `loading-skeleton`   | Skeleton loading          |
| Empty state      | `empty-chat-state`   | Trạng thái rỗng           |

#### Message Types:

| Type   | Mô tả         | Hiển thị                          |
| ------ | ------------- | --------------------------------- |
| `TXT`  | Text thuần    | Bubble với nội dung text          |
| `IMG`  | Hình ảnh      | Thumbnail có thể click để xem lớn |
| `FILE` | File đính kèm | Icon file + tên + size            |

#### Features:

- ✅ **Infinite scroll** (cuộn lên để load tin cũ)
- ✅ **Real-time messages** qua SignalR
- ✅ **Typing indicator** (hiển thị ai đang gõ)
- ✅ **Message grouping** (gom tin liên tiếp của 1 người)
- ✅ **Reply message** (trích dẫn tin nhắn)
- ✅ **Pin message** (ghim tin nhắn quan trọng)
- ✅ **Star message** (đánh dấu cá nhân)
- ✅ **File upload** (đính kèm hình ảnh/tài liệu)
- ✅ **Image preview** (xem ảnh full screen)
- ✅ **File preview** (xem PDF, Excel, Word)
- ✅ **Auto mark as read** khi vào conversation

#### Message Bubble Behavior:

```
┌─────────────────────────────────────────────┐
│ [Avatar] Tên người gửi        [timestamp]   │
│ ┌─────────────────────────────────────────┐ │
│ │ Nội dung tin nhắn                       │ │
│ │ [Image thumbnail nếu có]                │ │
│ │ [File attachment nếu có]                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Hover: [Reply] [Pin] [Star] [More...]      │
└─────────────────────────────────────────────┘
```

#### Send Message Request:

```typescript
interface SendChatMessageRequest {
  conversationId: string; // UUID
  content: string; // Nội dung
  contentType: "TXT" | "IMG" | "FILE";
  fileIds?: string[]; // UUID của files đã upload
  parentMessageId?: string; // UUID nếu reply
}
```

### 2.3. Pin & Star Messages

**Endpoints:**

- `POST /api/messages/{id}/pin` - Pin message
- `DELETE /api/messages/{id}/pin` - Unpin message
- `POST /api/messages/{id}/star` - Star message
- `DELETE /api/messages/{id}/star` - Unstar message
- `GET /api/conversations/{id}/pinned-messages` - Danh sách pinned
- `GET /api/starred-messages` - Danh sách starred của user

#### Pinned Messages:

- Hiển thị cho **tất cả thành viên** trong conversation
- Có thể unpin bởi người pin hoặc leader
- Hiển thị trong panel riêng (click để jump to message)

#### Starred Messages:

- **Private** - chỉ user thấy starred của mình
- Dùng để bookmark tin nhắn quan trọng
- Hiển thị trong panel riêng

### 2.4. File Upload & Preview

**Endpoint:** `POST /api/Files?sourceModule=1&sourceEntityId={conversationId}`

#### Supported File Types:

| Category      | Extensions                | Max Size |
| ------------- | ------------------------- | -------- |
| Images        | jpg, jpeg, png, gif, webp | 10 MB    |
| Documents     | pdf, doc, docx            | 10 MB    |
| Spreadsheets  | xls, xlsx                 | 10 MB    |
| Presentations | ppt, pptx                 | 10 MB    |

#### Features:

- ✅ **Single file upload** với progress indicator
- ✅ **Batch upload** (2-10 files cùng lúc)
- ✅ **Drag & drop**
- ✅ **Preview before send**
- ✅ **File validation** (type, size)
- ✅ **Download file**

#### File Preview Support:

| Type   | Preview Method                |
| ------ | ----------------------------- |
| Images | In-app viewer với zoom/rotate |
| PDF    | In-app viewer (pdf.js)        |
| Excel  | Rendered table view           |
| Word   | Converted HTML preview        |
| Others | Download only                 |

---

## 📋 Module 3: Task Management

### 3.1. Tạo Task từ Message

**Component:** `CreateTaskModal`

**Endpoint:** `POST /api/tasks`

#### Flow tạo task:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Hover tin   │ --> │  Click "Tạo  │ --> │  Modal tạo   │
│  nhắn        │     │  Task"       │     │  task mở     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Task được   │ <-- │  Chọn người  │ <-- │  Auto-fill   │
│  tạo & liên  │     │  giao +      │     │  title từ    │
│  kết message │     │  template    │     │  message     │
└──────────────┘     └──────────────┘     └──────────────┘
```

#### UI Elements:

| Element         | data-testid            | Mô tả                   |
| --------------- | ---------------------- | ----------------------- |
| Modal           | `create-task-modal`    | Modal container         |
| Title input     | `task-title-input`     | Nhập tiêu đề task       |
| Assignee select | `task-assignee-select` | Chọn người được giao    |
| Priority select | `task-priority-select` | Chọn độ ưu tiên         |
| Template select | `task-template-select` | Chọn checklist template |
| Submit button   | `task-submit-button`   | Nút tạo task            |
| Cancel button   | `task-cancel-button`   | Nút hủy                 |

#### Create Task Request:

```typescript
interface CreateTaskRequest {
  title: string;
  conversationId: string;
  messageId: string; // Message gốc
  assignedTo: string; // User ID người được giao
  priorityId: string; // Priority UUID
  checklistTemplateId: string; // Template UUID
}
```

#### Task Status Flow:

```
     ┌─────────┐
     │  TODO   │ (Chưa xử lý)
     └────┬────┘
          │ Staff bắt đầu làm
          ▼
     ┌─────────┐
     │  DOING  │ (Đang xử lý)
     └────┬────┘
          │ Staff hoàn thành
          ▼
┌─────────────────┐
│ NEED_TO_VERIFIED│ (Chờ duyệt)
└────────┬────────┘
         │ Leader duyệt
         ▼
     ┌─────────┐
     │FINISHED │ (Hoàn thành)
     └─────────┘
```

### 3.2. Danh sách Task liên kết (Right Panel)

**Component:** `LinkedTasksPanel`

**Endpoint:** `GET /api/conversations/{id}/tasks`

#### UI theo Role:

**Leader View:**

- Xem tất cả tasks của conversation
- Group by: Chưa xử lý | Đang xử lý | Chờ duyệt | Hoàn thành
- Actions: Xem chi tiết, Reassign, Approve/Reject

**Staff View:**

- Chỉ xem tasks được giao cho mình
- Focus vào tasks hôm nay
- Actions: Update status, Toggle checklist items

### 3.3. Chi tiết Task

**Component:** `TaskCard` (trong `ConversationDetailPanel`)

#### UI Elements:

| Element       | data-testid               | Mô tả               |
| ------------- | ------------------------- | ------------------- |
| Task card     | `task-card-{id}`          | Card hiển thị task  |
| Status badge  | `task-status-{id}`        | Badge trạng thái    |
| Progress bar  | `task-progress-{id}`      | Progress checklist  |
| Checklist     | `task-checklist-{id}`     | Danh sách checklist |
| Status button | `task-status-button-{id}` | Nút đổi trạng thái  |

#### Task Permissions (từ API):

```typescript
interface TaskPermissions {
  canChangeToNeedVerify: boolean; // Có thể chuyển sang "Chờ duyệt"
  canChangeToFinished: boolean; // Có thể chuyển sang "Hoàn thành"
  canChangeToTodo: boolean; // Có thể chuyển về "Chưa xử lý"
  canChangeToDoing: boolean; // Có thể chuyển sang "Đang xử lý"
  canReassign: boolean; // Có thể giao lại cho người khác
  canDelete: boolean; // Có thể xóa task
  canEditContent: boolean; // Có thể sửa nội dung
  isCreator: boolean; // Là người tạo
  isAssignee: boolean; // Là người được giao
}
```

### 3.4. Checklist Template

**Endpoint:** `GET /api/checklist-templates`

#### Features:

- ✅ Template định sẵn theo loại công việc
- ✅ Auto-apply khi tạo task
- ✅ Toggle done/undone cho từng item
- ✅ Add thêm item (chỉ Leader, khi task ở TODO)
- ✅ Progress hiển thị dạng "3/5 mục"

---

## 📁 Module 4: File Management

### 4.1. File Manager (Right Panel)

**Component:** `FileManagerPhase1A`

#### UI Elements:

| Element   | data-testid            | Mô tả               |
| --------- | ---------------------- | ------------------- |
| Tab Media | `file-tab-media`       | Tab hình ảnh/video  |
| Tab Files | `file-tab-files`       | Tab tài liệu        |
| File grid | `file-grid`            | Grid hiển thị files |
| File item | `file-item-{id}`       | Một file item       |
| Search    | `file-search-input`    | Tìm kiếm file       |
| Filter    | `file-filter-dropdown` | Lọc theo loại       |

#### Features:

- ✅ Grid view cho hình ảnh
- ✅ List view cho documents
- ✅ Filter by type (PDF, Excel, Word, Images)
- ✅ Filter by sender
- ✅ Filter by date range
- ✅ Sort by name/date/size
- ✅ Preview in modal
- ✅ Download file

### 4.2. View All Files Modal

**Component:** `ViewAllFilesModal`

#### Features:

- ✅ Full-screen file browser
- ✅ Advanced search
- ✅ Pagination
- ✅ Bulk download (planned)

---

## 👥 Module 5: Members & Groups

### 5.1. Danh sách thành viên Conversation

**Component:** `AddMemberDialog`

**Endpoint:** `GET /api/conversations/{id}/members`

#### Response:

```typescript
interface ConversationMemberDto {
  id: string; // User ID
  displayName: string;
  role: "Leader" | "Member";
  email?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}
```

### 5.2. Thêm thành viên

**Endpoint:** `POST /api/groups/{id}/members`

#### Flow:

1. Leader click "Thêm thành viên"
2. Search user từ danh sách
3. Chọn user cần thêm
4. Submit -> User được thêm vào group

### 5.3. Chuyển nhóm (Group Transfer)

**Component:** `GroupTransferSheet`

#### Features:

- ✅ Chuyển conversation sang nhóm khác
- ✅ Thông báo cho thành viên nhóm mới
- ✅ Chỉ Leader có quyền

---

## 🔔 Module 6: Real-time (SignalR)

### 6.1. Kết nối SignalR

**Hub URL:** `/hubs/chat`

#### Connection Flow:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login       │ --> │  Get token   │ --> │  Connect     │
│  success     │     │  from store  │     │  SignalR     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                     ┌──────────────────────────────────┐
                     │  Auto-reconnect với backoff:     │
                     │  [0s, 2s, 5s, 10s, 30s]         │
                     └──────────────────────────────────┘
```

### 6.2. SignalR Events

#### Receive Events (Server → Client):

| Event                 | Data                                             | Mô tả         |
| --------------------- | ------------------------------------------------ | ------------- |
| `MessageSent`         | `{ message: ChatMessage }`                       | Tin nhắn mới  |
| `UserTyping`          | `{ conversationId, userId, userName, isTyping }` | Ai đang gõ    |
| `MessageRead`         | `{ conversationId, messageId, userId, readAt }`  | Tin đã đọc    |
| `ConversationUpdated` | `{ conversationId, unreadCount }`                | Update unread |

#### Send Events (Client → Server):

| Event               | Data                           | Mô tả                |
| ------------------- | ------------------------------ | -------------------- |
| `JoinConversation`  | `conversationId`               | Join vào room        |
| `LeaveConversation` | `conversationId`               | Rời room             |
| `SendTyping`        | `{ conversationId, isTyping }` | Gửi typing indicator |

### 6.3. Xử lý Offline

**Component:** `OfflineBanner`

#### Features:

- ✅ Hiển thị banner khi mất kết nối
- ✅ Queue messages khi offline (planned)
- ✅ Auto-retry gửi khi online lại (planned)
- ✅ Sync messages khi reconnect

---

## 📱 Module 7: Mobile Layout

### 7.1. Responsive Breakpoints

| Breakpoint | Width          | Layout        |
| ---------- | -------------- | ------------- |
| Mobile     | < 768px        | Single column |
| Tablet     | 768px - 1024px | 2 columns     |
| Desktop    | > 1024px       | 3 columns     |

### 7.2. Mobile-specific Components

| Component                     | Mô tả                     |
| ----------------------------- | ------------------------- |
| `MobileTaskLogScreen`         | Full-screen task log view |
| `QuickMessageManagerMobile`   | Quick message templates   |
| `TodoListManagerMobile`       | Todo list management      |
| `PinnedMessagesManagerMobile` | Pinned messages           |
| `MobileAssignTaskSheet`       | Bottom sheet giao task    |

### 7.3. Mobile Navigation

```
┌─────────────────────────────────────────┐
│           [Header]                      │
├─────────────────────────────────────────┤
│                                         │
│           [Content Area]                │
│                                         │
├─────────────────────────────────────────┤
│  [Tin nhắn]  [Công việc]  [Cá nhân]    │
│    🔴 3                                 │
└─────────────────────────────────────────┘
```

---

## 🔒 Module 8: Security Features

### 8.1. Token Management

- ✅ JWT Access Token (short-lived)
- ✅ Auto token refresh (before expiry)
- ✅ Clear token on logout
- ✅ Token stored in localStorage

### 8.2. Content Protection (Optional)

| Feature                 | Mô tả                |
| ----------------------- | -------------------- |
| Context Menu Protection | Disable right-click  |
| DevTools Protection     | Detect DevTools open |
| Screenshot Protection   | Warn on screenshot   |

---

## 📊 Module 9: Right Panel (Information Panel)

### 9.1. Tabs trong Information Panel

| Tab        | Component            | Mô tả                  |
| ---------- | -------------------- | ---------------------- |
| Thông tin  | `TabInfoMobile`      | Thông tin conversation |
| Công việc  | `LinkedTasksPanel`   | Tasks liên kết         |
| Files      | `FileManagerPhase1A` | Files đã chia sẻ       |
| Thành viên | `MemberList`         | Danh sách thành viên   |

### 9.2. Accordion Sections

**Component:** `RightAccordion`

Các section có thể collapse/expand:

- 📋 Công Việc Liên Kết
- 📁 Files & Media
- 👥 Thành Viên
- ⭐ Tin Đánh Dấu

---

## 🎨 UI Components Library

### Radix UI Components Used:

| Component     | Usage                |
| ------------- | -------------------- |
| `Dialog`      | Modals               |
| `Sheet`       | Side panels          |
| `Popover`     | Dropdowns, menus     |
| `Select`      | Select inputs        |
| `Tooltip`     | Tooltips             |
| `ScrollArea`  | Scrollable areas     |
| `ToggleGroup` | Tab groups           |
| `Accordion`   | Collapsible sections |

### Custom Components:

| Component       | Mô tả             |
| --------------- | ----------------- |
| `IconButton`    | Button với icon   |
| `Badge`         | Badge hiển thị số |
| `Avatar`        | Avatar người dùng |
| `Chip`          | Tags/labels       |
| `LinearTabs`    | Tab navigation    |
| `SegmentedTabs` | Segmented control |

---

## 🧪 Testing Guide

### Test IDs Convention:

```
[feature]-[element]-[action/identifier]

Examples:
- chat-send-button
- message-item-{id}
- task-create-button
- login-form
- conversation-item-{id}
```

### Critical Test Scenarios:

#### Authentication:

1. Login success → redirect to portal
2. Login fail → show error
3. Logout → clear data & redirect

#### Chat:

1. Send text message → appears in list
2. Send with file → file uploaded & displayed
3. Receive message → real-time update
4. Scroll up → load older messages
5. Pin message → appears in pinned list
6. Star message → appears in starred list

#### Tasks:

1. Create task → linked to message
2. Update status → permissions respected
3. Toggle checklist → progress updated
4. Reassign → only leader can

#### Files:

1. Upload single file → success
2. Upload batch → all or partial success
3. Preview image → modal opens
4. Preview PDF → viewer loads
5. Download → file downloads

---

## 📡 API Endpoints Summary

### Auth API (`/auth`)

| Method | Endpoint | Mô tả     |
| ------ | -------- | --------- |
| POST   | `/login` | Đăng nhập |

### Chat API (`/api`)

| Method | Endpoint                        | Mô tả                          |
| ------ | ------------------------------- | ------------------------------ |
| GET    | `/categories`                   | Lấy categories + conversations |
| GET    | `/conversations/{id}/messages`  | Lấy tin nhắn                   |
| POST   | `/messages`                     | Gửi tin nhắn                   |
| POST   | `/conversations/{id}/mark-read` | Đánh dấu đã đọc                |
| GET    | `/conversations/{id}/members`   | Lấy thành viên                 |
| POST   | `/groups/{id}/members`          | Thêm thành viên                |

### Pinned & Starred API

| Method | Endpoint                              | Mô tả           |
| ------ | ------------------------------------- | --------------- |
| GET    | `/conversations/{id}/pinned-messages` | Pinned messages |
| POST   | `/messages/{id}/pin`                  | Pin message     |
| DELETE | `/messages/{id}/pin`                  | Unpin message   |
| GET    | `/starred-messages`                   | User's starred  |
| POST   | `/messages/{id}/star`                 | Star message    |
| DELETE | `/messages/{id}/star`                 | Unstar message  |

### Task API (`/api`)

| Method | Endpoint                                  | Mô tả                  |
| ------ | ----------------------------------------- | ---------------------- |
| POST   | `/tasks`                                  | Tạo task               |
| GET    | `/tasks/{id}`                             | Chi tiết task          |
| GET    | `/conversations/{id}/tasks`               | Tasks của conversation |
| GET    | `/task-config/priorities`                 | Danh sách priority     |
| GET    | `/task-config/statuses`                   | Danh sách status       |
| GET    | `/checklist-templates`                    | Danh sách templates    |
| POST   | `/tasks/{id}/check-items`                 | Thêm checklist item    |
| PATCH  | `/tasks/{id}/check-items/{itemId}/toggle` | Toggle item            |
| PATCH  | `/tasks/{id}/status`                      | Đổi status             |

### File API (`/api`)

| Method | Endpoint              | Mô tả         |
| ------ | --------------------- | ------------- |
| POST   | `/Files`              | Upload file   |
| GET    | `/Files/{id}`         | Download file |
| GET    | `/Files/{id}/preview` | Preview file  |

---

## 🔄 State Management

### Zustand Stores:

| Store               | Purpose                      |
| ------------------- | ---------------------------- |
| `authStore`         | User, token, isAuthenticated |
| `conversationStore` | Selected conversation        |
| `uiStore`           | UI state (panels, modals)    |
| `createTaskStore`   | Task creation modal state    |
| `viewFilesStore`    | File viewer state            |

### TanStack Query Keys:

```typescript
// Messages
["messages", "conversation", conversationId]

// Categories
["categories", "list"]

// Tasks
["tasks", "conversation", conversationId]

// Pinned
["pinned-starred", "pinned", conversationId]

// Starred
["pinned-starred", "starred", cursor?]
```

---

## 📝 Notes for QC Team

### High Priority Test Cases:

1. **Authentication flow** - Login/Logout
2. **Message sending** - Text + Files
3. **Real-time** - Messages appear immediately
4. **Task creation** - From message context
5. **Unread badges** - Clear correctly

### Known Limitations:

1. Offline mode - Limited support
2. Large files (>10MB) - Rejected
3. Concurrent edits - Last write wins
4. Message search - Not implemented yet

### Browser Support:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📝 Notes for Mobile Team

### API Integration Points:

1. All APIs use JWT Bearer token
2. SignalR for real-time (WebSocket preferred)
3. File upload uses multipart/form-data
4. Pagination uses cursor-based approach

### Key Differences:

1. Mobile uses bottom navigation
2. Sheets instead of modals
3. Long-press for context actions
4. Pull-to-refresh support needed

### Sync Requirements:

1. Sync unread counts periodically
2. Handle push notifications
3. Background message sync
4. Offline queue management

---

**Document Version:** 2.0  
**Last Updated:** 26/01/2026  
**Author:** AI Assistant  
**Reviewed By:** _[Pending QC/Mobile Review]_
