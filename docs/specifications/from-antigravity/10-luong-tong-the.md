# 10. Luồng Hoạt Động Tổng Thể

## Mục Đích

Tài liệu này mô tả mối quan hệ giữa các tính năng và luồng di chuyển của người dùng trong ứng dụng. Giúp QC hiểu end-to-end flows và Mobile team nắm navigation structure.

---

## Sơ Đồ Tổng Thể

```
                    ┌──────────────┐
                    │    START     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Màn hình     │
                    │ Đăng nhập    │
                    └──────┬───────┘
                           │ Login Success
                           ▼
        ┌──────────────────────────────────────────┐
        │              PORTAL LAYOUT                │
        │  ┌─────────────────────────────────────┐ │
        │  │         TOP BAR (User Menu)         │ │
        │  └─────────────────────────────────────┘ │
        │  ┌────────┐ ┌──────────┐ ┌────────────┐ │
        │  │        │ │          │ │            │ │
        │  │ LEFT   │ │  MAIN    │ │  RIGHT     │ │
        │  │ SIDE   │ │ CONTENT  │ │  PANEL     │ │
        │  │ BAR    │ │  (Chat)  │ │  (Info)    │ │
        │  │        │ │          │ │            │ │
        │  └────────┘ └──────────┘ └────────────┘ │
        └──────────────────────────────────────────┘
                           │
                           ▼ Logout
                    ┌──────────────┐
                    │ Màn hình     │
                    │ Đăng nhập    │
                    └──────────────┘
```

---

## Luồng 1: Đăng Nhập Vào Hệ Thống

```
┌──────────┐    ┌──────────────┐    ┌───────────────┐
│  START   │───▶│ Login Screen │───▶│ Nhập thông tin│
└──────────┘    └──────────────┘    └───────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
             ┌────────────┐         ┌────────────┐         ┌────────────┐
             │ Sai thông  │         │ Lỗi kết    │         │ Thành công │
             │ tin        │         │ nối        │         │            │
             └────────────┘         └────────────┘         └────────────┘
                    │                       │                       │
                    ▼                       ▼                       ▼
             ┌────────────┐         ┌────────────┐         ┌────────────┐
             │ Hiển thị   │         │ Hiển thị   │         │ Chuyển đến │
             │ lỗi, thử   │         │ lỗi, retry │         │   Portal   │
             │ lại        │         │            │         │            │
             └────────────┘         └────────────┘         └────────────┘
```

---

## Luồng 2: Xem Và Gửi Tin Nhắn

```
┌───────────────┐
│ Portal Layout │
└───────┬───────┘
        │
        ▼
┌───────────────────┐    ┌──────────────────┐
│ Sidebar: Chọn    │───▶│ Chat Panel Load  │
│ Conversation     │    │ Messages         │
└───────────────────┘    └──────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ Scroll xem    │         │ Gõ tin nhắn   │         │ Đính kèm file │
│ tin cũ        │         │ text          │         │ hoặc ảnh      │
└───────────────┘         └───────────────┘         └───────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ Load more     │         │ Nhấn Gửi      │         │ Upload file   │
│ (50 tin)      │         │               │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
                                  │                         │
                                  └────────────┬────────────┘
                                               ▼
                                  ┌───────────────────┐
                                  │ Tin nhắn hiển thị │
                                  │ trong chat        │
                                  └───────────────────┘
```

---

## Luồng 3: Tạo Task Từ Tin Nhắn

```
┌────────────────────┐
│ Đang xem Chat      │
└─────────┬──────────┘
          │ Right-click tin nhắn
          ▼
┌────────────────────┐         ┌───────────────────┐
│ Context Menu       │────────▶│ "Tạo Task"        │
│ (Leader/Admin)     │         │ (Staff không có)  │
└────────────────────┘         └───────────────────┘
                                        │
                                        ▼
                               ┌───────────────────┐
                               │ Modal Tạo Task    │
                               │ - Title           │
                               │ - Assignee        │
                               │ - WorkType        │
                               │ - Checklist       │
                               └───────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
             ┌────────────┐     ┌────────────────┐   ┌────────────┐
             │ Cancel     │     │ Thiếu thông   │   │ Create     │
             │ → Đóng     │     │ tin bắt buộc  │   │ thành công │
             └────────────┘     └────────────────┘   └────────────┘
                                        │                   │
                                        ▼                   ▼
                                ┌────────────────┐  ┌────────────────┐
                                │ Highlight      │  │ Task xuất hiện │
                                │ field lỗi     │  │ trong Tasks tab│
                                └────────────────┘  └────────────────┘
```

---

## Luồng 4: Xử Lý Task (Staff)

```
┌────────────────────┐
│ Staff nhận Task    │
│ (status: Todo)     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Xem Task Detail    │
└─────────┬──────────┘
          │ Click "Bắt đầu"
          ▼
┌────────────────────┐
│ Status: DOING      │
└─────────┬──────────┘
          │ Làm việc & Update checklist
          ▼
┌────────────────────┐
│ Hoàn thành công    │
│ việc               │
└─────────┬──────────┘
          │ Click "Gửi duyệt"
          ▼
┌────────────────────┐
│ Status: NEED       │
│ VERIFY             │
└─────────┬──────────┘
          │ Chờ Leader duyệt
          ▼
     ┌────┴────┐
     ▼         ▼
┌─────────┐ ┌─────────┐
│ Approved│ │ Rejected│
│         │ │         │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│FINISHED │ │ DOING   │
│ (Done)  │ │ (Sửa    │
│         │ │  lại)   │
└─────────┘ └─────────┘
```

---

## Luồng 5: Preview File Có Watermark

```
┌────────────────────┐
│ Click vào ảnh     │
│ trong chat        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Mở Preview Modal   │
│ - Watermark với    │
│   tên user + time  │
└─────────┬──────────┘
          │
     ┌────┴────┬────────────┐
     ▼         ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Zoom    │ │ Rotate  │ │ Next/   │
│ In/Out  │ │ 90°     │ │ Prev    │
└─────────┘ └─────────┘ └─────────┘
          │
          ▼ Click outside / X
┌────────────────────┐
│ Đóng Modal         │
│ Trở về Chat        │
└────────────────────┘
```

---

## Mối Quan Hệ Giữa Các Màn Hình

### Navigation Map

| Từ | Đến | Trigger |
|----|-----|---------|
| Login | Portal/Workspace | Login thành công |
| Portal | Login | Logout |
| Sidebar | Chat Panel | Click conversation |
| Chat Panel | Right Panel | Toggle Info button |
| Message | Create Task Modal | Right-click → Create Task |
| Message | Reply Input | Right-click → Reply |
| Message | Image Preview | Click ảnh |
| Right Panel | Task Detail | Click task card |
| Right Panel | File Explorer | Click "View All Files" |
| Task Detail | Task Log Sheet | Scroll to log section |
| File Explorer | Image Preview | Click ảnh |

### Mobile Navigation Stack

```
Tab Navigator (Bottom)
├── Chats Tab
│   └── Chat Detail (push)
│       └── Group Info (modal)
│       └── Image Preview (modal)
│       └── Create Task (modal)
│
├── Tasks Tab
│   └── Task Detail (push)
│       └── Task Log (modal)
│
├── Files Tab
│   └── Folder View (push)
│       └── File Preview (modal)
│
└── Profile Tab
    └── Settings (push)
```

---

## Error Flows

### Mất Kết Nối Mạng

```
┌────────────────┐
│ Đang sử dụng   │
│ app            │
└───────┬────────┘
        │ Mất mạng
        ▼
┌────────────────┐
│ Banner cảnh   │
│ báo "Offline" │
└───────┬────────┘
        │
   ┌────┴────┐
   ▼         ▼
┌──────┐  ┌──────────────┐
│ Có   │  │ Vẫn mất      │
│ mạng │  │ mạng         │
└──┬───┘  └──────┬───────┘
   │             │
   ▼             ▼
┌──────────┐  ┌─────────────┐
│ Auto     │  │ Các thao tác│
│ reconnect│  │ bị block,   │
│ + sync   │  │ hiện error  │
└──────────┘  └─────────────┘
```

### Session Expired

```
┌────────────────┐
│ Đang sử dụng   │
└───────┬────────┘
        │ Token hết hạn
        ▼
┌────────────────┐
│ API trả 401    │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Hiển thị popup │
│ "Phiên đã hết" │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Redirect về    │
│ Login          │
└────────────────┘
```

---

## [QC] End-to-End Test Scenarios

| # | Luồng | Bước | Kết quả mong đợi |
|---|-------|------|------------------|
| 1 | Login → Chat → Logout | Đăng nhập, gửi tin, đăng xuất | Hoàn thành không lỗi |
| 2 | Chat → Create Task → Complete | Gửi tin, tạo task, approve | Task finished |
| 3 | Upload → Preview → Close | Upload ảnh, click preview, đóng | Watermark hiển thị |
| 4 | Receive Message | User khác gửi tin | Notification + tin nhắn xuất hiện |
| 5 | Offline → Online | Mất mạng, có lại | Reconnect + sync |

---

## [Mobile] Navigation Guidelines

### Deep Linking
- `/chat/:conversationId` → Mở conversation
- `/task/:taskId` → Mở task detail
- `/file/:fileId` → Mở file preview

### Back Button Behavior
- Trong modal: Đóng modal
- Trong nested screen: Pop về parent
- Ở root tab: Exit app (Android) / Không làm gì (iOS)

---

**Kết thúc tài liệu đặc tả tính năng.**
