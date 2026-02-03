# 01. Tổng Quan Hệ Thống

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Giới Thiệu Hệ Thống

**Quốc Nam Internal Chat Portal** là ứng dụng chat nội bộ doanh nghiệp phục vụ việc liên lạc giữa các phòng ban và quản lý công việc. 

### Mục Đích Sử Dụng

- Trao đổi thông tin nhanh chóng giữa nhân viên qua tin nhắn real-time
- Tạo và theo dõi công việc (task) trực tiếp từ tin nhắn
- Chia sẻ file một cách an toàn với watermark bảo mật
- Quản lý nhóm làm việc và phân công công việc

---

## Các Module Chính

### 1. Xác Thực (Authentication)
Quản lý việc đăng nhập, phân quyền và duy trì phiên làm việc của người dùng. Người dùng cần đăng nhập bằng tài khoản nội bộ để truy cập hệ thống.

**Cách truy cập:** Mở ứng dụng/website → Màn hình đăng nhập hiện ra

### 2. Nhắn Tin (Messaging)
Cho phép gửi và nhận tin nhắn theo thời gian thực. Hỗ trợ tin nhắn văn bản, hình ảnh và file đính kèm.

**Cách truy cập:** Sau đăng nhập → Chọn hội thoại từ sidebar trái

### 3. Quản Lý Hội Thoại (Conversations)
Tổ chức các cuộc trò chuyện theo nhóm (group chat) hoặc tin nhắn trực tiếp (DM). Mỗi nhóm có thể thuộc một phân loại (category) cụ thể.

**Cách truy cập:** Sidebar trái của Portal

### 4. Quản Lý Task (Task Management)
Cho phép tạo công việc từ tin nhắn trong chat. Task có quy trình trạng thái rõ ràng và checklist để theo dõi tiến độ.

**Cách truy cập:** 
- Right-click tin nhắn → "Tạo Task" (Leader/Admin)
- Tab "Tasks" trong Right Panel
- Lead View (Kanban Board) cho Leader

### 5. Quản Lý File (File Management)
Hỗ trợ upload, preview và tổ chức file theo thư mục. File được bảo vệ bằng watermark và biện pháp chống sao chép.

**Cách truy cập:**
- Nút đính kèm trong ô chat
- Tab "Files" trong Right Panel
- File Explorer (click "View All Files")

### 6. Bảo Mật (Security)
Các biện pháp bảo vệ nội dung khỏi bị sao chép trái phép, bao gồm chặn DevTools, chặn menu chuột phải, và watermark.

**Cách hoạt động:** Tự động áp dụng, không cần kích hoạt

---

## Cấu Trúc Giao Diện (Desktop)

Giao diện ứng dụng được chia thành 4 vùng chính:

```
┌─────────────────────────────────────────────────────────────┐
│                    TOP BAR (Thanh trên)                      │
│   [Logo]                              [User Avatar] [Logout] │
├───────────┬─────────────────────────┬───────────────────────┤
│           │                         │                       │
│   LEFT    │      MAIN CONTENT       │     RIGHT PANEL       │
│  SIDEBAR  │       (Chat Area)       │   (Information)       │
│           │                         │                       │
│  • Danh   │   • Header Chat         │   • Tabs: Info,       │
│    sách   │   • Danh sách tin       │     Pinned, Media,    │
│    hội    │   • Input Area          │     Files, Tasks      │
│    thoại  │                         │   • Thành viên        │
│           │                         │                       │
└───────────┴─────────────────────────┴───────────────────────┘
```

### Chi Tiết Từng Vùng

| Vùng | Vị Trí | Nội Dung Chính |
|------|--------|----------------|
| **Top Bar** | Trên cùng, full width | Logo, tên ứng dụng, thông tin user, nút đăng xuất |
| **Left Sidebar** | Bên trái | Danh sách categories, danh sách hội thoại, ô tìm kiếm |
| **Main Content** | Giữa (lớn nhất) | Khu vực chat với tin nhắn và ô nhập |
| **Right Panel** | Bên phải | Thông tin chi tiết, thành viên, pinned, media, files, tasks |

---

## Vai Trò Người Dùng & Phân Quyền

### Staff (Nhân viên)

**Quyền được phép:**
- ✅ Tham gia chat và gửi tin nhắn
- ✅ Reply, star tin nhắn
- ✅ Xem và cập nhật task được giao cho mình
- ✅ Chuyển task: Todo → Doing → Need Verify
- ✅ Cập nhật checklist của task mình
- ✅ Upload và preview file

**Quyền KHÔNG có:**
- ❌ Tạo task
- ❌ Pin tin nhắn
- ❌ Duyệt task (mark Finished)
- ❌ Quản lý thành viên nhóm

### Leader (Trưởng nhóm)

**Quyền được phép (bao gồm tất cả quyền Staff + thêm):**
- ✅ Tạo và giao task cho nhân viên
- ✅ Duyệt task (chuyển sang Finished)
- ✅ Reject task về trạng thái Doing
- ✅ Ghim (pin) tin nhắn quan trọng
- ✅ Xem tất cả task trong nhóm
- ✅ Thêm/xóa thành viên
- ✅ Promote thành admin
- ✅ Chuyển nhóm
- ✅ Truy cập Lead View (Kanban Dashboard)

### Admin (Quản trị viên)

**Quyền được phép:**
- ✅ Có toàn quyền trong hệ thống
- ✅ Quản lý tất cả thành viên
- ✅ Thực hiện mọi thao tác trên task và file

---

## Luồng Hoạt Động Chính

### Luồng 1: Đăng nhập vào hệ thống
1. Người dùng mở ứng dụng
2. Hiển thị màn hình đăng nhập
3. Nhập username và password
4. Hệ thống xác thực và chuyển vào Portal

### Luồng 2: Gửi và nhận tin nhắn
1. Chọn hội thoại từ sidebar
2. Xem lịch sử tin nhắn
3. Nhập và gửi tin nhắn mới
4. Tin nhắn hiển thị ngay lập tức (real-time)

### Luồng 3: Tạo và xử lý Task
1. Leader chọn tin nhắn và tạo task (right-click → Tạo Task)
2. Task được giao cho staff với trạng thái Todo
3. Staff chuyển sang Doing khi bắt đầu làm
4. Staff chuyển sang Need Verify khi hoàn thành
5. Leader duyệt và chuyển sang Finished

---

## [QC] Test Cases Tổng Quan

| # | Kịch bản | Kết quả mong đợi | Mức độ |
|---|----------|------------------|--------|
| 1 | Đăng nhập thành công | Vào được Portal, thấy danh sách hội thoại | 🔴 Cao |
| 2 | Gửi tin nhắn | Tin nhắn hiển thị ngay trong chat | 🔴 Cao |
| 3 | Nhận tin nhắn từ người khác | Có notification và tin nhắn xuất hiện | 🔴 Cao |
| 4 | Tạo task từ tin nhắn (Leader) | Task xuất hiện trong danh sách tasks | 🔴 Cao |
| 5 | Cập nhật status task (Staff) | Status thay đổi đúng quy trình | 🔴 Cao |
| 6 | Upload file | File hiển thị trong tin nhắn và thư mục file | 🔴 Cao |
| 7 | Staff thử tạo task | Không thấy option "Tạo Task" | 🔴 Cao |
| 8 | Staff thử pin tin nhắn | Không thấy option "Pin" | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

### Cấu Trúc Navigation

```
Tab Navigator (Bottom)
├── Chats Tab → Danh sách hội thoại
│   └── Chat Detail (push) → Màn hình chat
│       └── Group Info (modal)
│       └── Image Preview (modal)
│
├── Tasks Tab → Danh sách task
│   └── Task Detail (push)
│
├── Files Tab → File Explorer
│   └── Folder View (push)
│       └── File Preview (modal)
│
└── Profile Tab
    └── Settings (push)
```

### Điểm Khác Biệt Chính

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | Luôn hiển thị bên trái | Tab riêng hoặc Drawer |
| Right Panel | Luôn hiển thị bên phải | Bottom Sheet hoặc màn hình riêng |
| Context Menu | Right-click | Long-press |
| Modal | Popup ở giữa | Bottom Sheet hoặc Full Screen |

### Yêu Cầu Kỹ Thuật

- Duy trì kết nối real-time (SignalR) khi app ở foreground
- Token xác thực lưu an toàn trong SecureStore
- Xử lý reconnect khi mất kết nối mạng
- Push notification cho tin nhắn và task mới

---

**Xem tiếp:** [02-dang-nhap-xac-thuc.md](./02-dang-nhap-xac-thuc.md)
