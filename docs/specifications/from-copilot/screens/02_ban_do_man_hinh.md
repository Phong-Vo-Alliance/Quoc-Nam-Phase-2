# 02. Bản Đồ Màn Hình

> **Mục đích:** Tổng hợp tất cả các màn hình và navigation

---

## 1. Site Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SITE MAP                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   /                                                                     │
│   │                                                                     │
│   ├── /login ─────────── Trang Đăng Nhập                               │
│   │                                                                     │
│   └── /portal ─────────── Protected (cần đăng nhập)                    │
│        │                                                                │
│        ├── /workspace ─── Workspace View (Staff)                        │
│        │    │                                                           │
│        │    ├── /?conversationId=xxx ─── Xem conversation               │
│        │    └── /?workTypeId=xxx ─────── Filter theo work type          │
│        │                                                                │
│        └── /lead ─────── Leader View                                    │
│             │                                                           │
│             ├── /?conversationId=xxx ─── Xem conversation               │
│             └── /?workTypeId=xxx ─────── Filter theo work type          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Màn Hình Chi Tiết

### 2.1 Trang Đăng Nhập (/login)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                                                                         │
│                          ┌──────────┐                                   │
│                          │  LOGO    │                                   │
│                          └──────────┘                                   │
│                                                                         │
│                    QUỐC NAM PORTAL                                      │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │  Email: [                                                     ]  │  │
│   │                                                                  │  │
│   │  Mật khẩu: [                                                  ]  │  │
│   │                                                                  │  │
│   │  ☐ Ghi nhớ đăng nhập                                            │  │
│   │                                                                  │  │
│   │  [              ĐĂNG NHẬP                ]                       │  │
│   │                                                                  │  │
│   │                    Quên mật khẩu?                                │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

→ Chi tiết: [Đăng Nhập](../features/login/01_dang_nhap_xac_thuc.md)

---

### 2.2 Portal Workspace (/portal/workspace)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 QUOC NAM PORTAL                                      👤 Minh Anh   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐  ┌──────────────────────────┐  ┌─────────────────┐  │
│   │              │  │                          │  │                 │  │
│   │    LEFT      │  │                          │  │     RIGHT       │  │
│   │    PANEL     │  │       CHAT MAIN          │  │     PANEL       │  │
│   │              │  │                          │  │                 │  │
│   │ Conversation │  │   Messages + Input       │  │  Info/Tasks/    │  │
│   │    List      │  │                          │  │  Files/Members  │  │
│   │              │  │                          │  │                 │  │
│   └──────────────┘  └──────────────────────────┘  └─────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

→ Chi tiết: [Danh Sách Hội Thoại](../features/conversation/01_danh_sach_hoi_thoai.md), [Giao Diện Chat](../features/chat/01_giao_dien_chat.md)

---

### 2.3 Portal Lead (/portal/lead)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 QUOC NAM PORTAL                              👑 Leader Hương        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐  ┌──────────────────────────┐  ┌─────────────────┐  │
│   │              │  │                          │  │                 │  │
│   │    LEFT      │  │                          │  │     RIGHT       │  │
│   │    PANEL     │  │       CHAT MAIN          │  │     PANEL       │  │
│   │              │  │                          │  │                 │  │
│   │ Conversation │  │   Messages + Input       │  │  Info/Tasks     │  │
│   │    List      │  │   + Leader Actions       │  │  (with Approve) │  │
│   │              │  │                          │  │  /Files/Members │  │
│   └──────────────┘  └──────────────────────────┘  └─────────────────┘  │
│                                                                         │
│  Leader có thêm:                                                        │
│  • Pin messages                                                         │
│  • Create tasks                                                         │
│  • Approve/Reject tasks                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

→ Chi tiết: [Hệ Thống Phân Quyền](../03_he_thong_phan_quyen.md)

---

## 3. Navigation Flow

### 3.1 Login → Portal

```
┌─────────┐        ┌─────────────┐        ┌──────────────────┐
│         │        │             │        │                  │
│  LOGIN  │ ────→  │  CHECK      │ ────→  │  PORTAL          │
│         │  OK    │  ROLE       │        │  (workspace/lead)│
│         │        │             │        │                  │
└─────────┘        └─────────────┘        └──────────────────┘
     │                   │
     │ Fail              │ isLeader?
     ▼                   │
  Show error             ├── true → /portal/lead
                         └── false → /portal/workspace
```

### 3.2 Conversation Selection

```
User click conversation trong Left Panel
        │
        ▼
URL update: ?conversationId=xxx
        │
        ▼
Chat Main load messages cho conversation đó
        │
        ▼
Right Panel update với info của conversation
```

---

## 4. Screen Components Map

| Screen         | Components                                                                       |
| -------------- | -------------------------------------------------------------------------------- |
| Login          | LoginForm, Logo                                                                  |
| Workspace/Lead | Header, LeftPanel, ChatMain, RightPanel                                          |
| LeftPanel      | SearchBar, FilterDropdown, ConversationList, ConversationCard                    |
| ChatMain       | ChatHeader, PinnedBanner, MessageList, MessageBubble, TypingIndicator, InputArea |
| RightPanel     | TabBar, InfoTab, TasksTab, FilesTab, MembersTab                                  |

---

## 5. Responsive Breakpoints

| Breakpoint          | Hiển thị                              |
| ------------------- | ------------------------------------- |
| Desktop (≥1024px)   | 3 columns: Left + Chat + Right        |
| Tablet (768-1023px) | 2 columns: Left + Chat (Right toggle) |
| Mobile (<768px)     | 1 column: Navigation between views    |

→ Chi tiết: [Desktop vs Mobile](./03_desktop_vs_mobile.md)

---

## 6. Liên Kết Tài Liệu

- 🔗 [Tổng Quan Hệ Thống](../01_tong_quan_he_thong.md)
- 🔗 [Desktop vs Mobile](./03_desktop_vs_mobile.md)
- 🔗 [Danh Sách Hội Thoại](../features/conversation/01_danh_sach_hoi_thoai.md)

---

_Cập nhật: 27/01/2026_
