# 11. Màn Hình Chi Tiết

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mục Đích

Tài liệu này mô tả chi tiết từng màn hình trong ứng dụng, bao gồm các thành phần UI và hành vi. Dành cho QC team test và Mobile team implement.

---

## 1. Màn Hình Đăng Nhập

**Đường dẫn:** `/login`

### Bố Cục
- Căn giữa màn hình theo cả chiều ngang và dọc
- Logo ở trên, form đăng nhập ở giữa, footer ở dưới

### Các Thành Phần

| Thành phần | Mô tả | Hành vi |
|------------|-------|---------|
| Logo | Hình logo Quốc Nam | Chỉ hiển thị |
| Tiêu đề | "Portal Internal Chat" | Text tĩnh |
| Ô Username | Input text | Focusable, validate không trống |
| Ô Password | Input password | Có nút show/hide |
| Nút Đăng nhập | Button chính | Submit, disabled khi loading |
| Thông báo lỗi | Text màu đỏ | Hiển thị khi login fail |
| Footer | Bản quyền | Text tĩnh |

### Trạng Thái

| State | Mô tả |
|-------|-------|
| Mặc định | Form trống, nút enabled |
| Loading | Nút disabled, có spinner |
| Error | Message lỗi dưới nút |
| Success | Chuyển sang Portal |

---

## 2. Layout Portal

**Đường dẫn:** `/portal`

### Bố Cục Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    TOP BAR (full width)                      │
├───────────┬─────────────────────────┬───────────────────────┤
│           │                         │                       │
│   LEFT    │      MAIN CONTENT       │     RIGHT PANEL       │
│  SIDEBAR  │       (Chat Area)       │   (Information)       │
│  (~250px) │       (flexible)        │     (~350px)          │
│           │                         │                       │
└───────────┴─────────────────────────┴───────────────────────┘
```

### Top Bar

| Thành phần | Vị trí | Mô tả |
|------------|--------|-------|
| Logo/Tên app | Bên trái | Logo Quốc Nam |
| Organization Selector | Giữa | Dropdown chọn tổ chức (nếu có) |
| User Avatar | Góc phải | Click mở menu |
| User Menu | Dropdown | Profile, Settings, Logout |

---

## 3. Left Sidebar - Danh Sách Hội Thoại

### Bố Cục (từ trên xuống)

1. Header với tabs
2. Ô tìm kiếm
3. Danh sách categories (expandable)
4. Danh sách conversations trong category
5. Quick action buttons ở dưới

### Các Thành Phần

| Thành phần | Mô tả |
|------------|-------|
| Tab "Tất cả" | Filter tất cả conversations |
| Tab "Nhóm" | Filter theo groups |
| Tab "Cá nhân" | Filter theo DMs |
| Search Input | Tìm kiếm theo tên |
| Category Header | Tên + số lượng, clickable expand/collapse |
| Conversation Item | Avatar, tên, preview, time, badge |
| Nút Quick Message | Mở dialog nhắn nhanh |
| Nút Pinned | Mở danh sách pin |
| Nút Todo | Mở danh sách task |

### States của Conversation Item

| State | Visual |
|-------|--------|
| Unread | Bold text, có badge số |
| Selected | Background highlight |
| Online (DM) | Dot xanh trên avatar |
| Mention | Icon "@" |

---

## 4. Main Content - Chat Panel

### Bố Cục (từ trên xuống)

1. Chat Header (tên nhóm, actions)
2. Message List (scrollable)
3. Input Area (compose tin nhắn)

### Chat Header

| Thành phần | Mô tả |
|------------|-------|
| Avatar nhóm | Ký tự đầu hoặc ảnh |
| Tên nhóm | Text, có thể wrap |
| Số thành viên | "5 thành viên" |
| Nút Info | Toggle right panel |
| Nút Search | Tìm trong chat |

### Message List

| Thành phần | Mô tả |
|------------|-------|
| Date Separator | "Hôm nay", "Hôm qua", "25/01" |
| Message Bubble | Tin nhắn (trái/phải tùy sender) |
| Typing Indicator | "Tên đang gõ..." |
| New Message Button | Khi có tin mới và đang scroll lên |
| Load More Trigger | Scroll lên đầu để load thêm |

### Message Bubble Types

| Loại | Hiển thị |
|------|----------|
| Text | Văn bản trong bubble |
| Image | Thumbnail grid (tối đa 4) |
| File | Card với icon + tên + size |
| System | Text căn giữa, style khác |
| Reply | Quote tin gốc ở trên |

### Input Area

| Thành phần | Mô tả |
|------------|-------|
| Nút Attach | Mở picker chọn file/ảnh |
| Text Input | Nhập tin nhắn, multi-line |
| Nút Send | Gửi tin nhắn |
| Reply Preview | Hiện khi đang reply, có nút cancel |

---

## 5. Right Panel - Information Panel

### Tabs

| Tab | Nội dung |
|-----|----------|
| Info | Thông tin nhóm, thành viên |
| Pinned | Tin nhắn được ghim |
| Media | Grid ảnh/video |
| Files | Danh sách file |
| Tasks | Tasks liên kết |

### Tab Info

| Section | Nội dung |
|---------|----------|
| Group Name | Tên nhóm, có thể edit (Admin) |
| Members List | Avatar + tên + role |
| Add Member | Nút thêm thành viên (Leader+) |

### Tab Tasks

| Thành phần | Mô tả |
|------------|-------|
| Task Card | Title, assignee, status badge |
| Status Filter | Dropdown filter status |
| Click Card | Mở Task Detail Modal |
| View All | Mở full Task Manager |

---

## 6. Modal Tạo Task

**Trigger:** Right-click message → Create Task

### Fields

| Field | Loại | Bắt buộc |
|-------|------|----------|
| Title | Text Input | ✓ |
| Description | Textarea | |
| Assignee | Dropdown | ✓ |
| WorkType | Dropdown | |
| Priority | Dropdown | |
| Due Date | Date Picker | |
| Checklist | Checklist editor | |

### Actions

| Button | Hành vi |
|--------|---------|
| Cancel | Đóng modal, không tạo |
| Create | Validate và tạo task |

---

## 7. Task Detail Modal

**Trigger:** Click vào task card

### Sections

| Section | Nội dung |
|---------|----------|
| Header | Title, status badge, close button |
| Meta | Assignee avatar, priority, due date |
| Description | Nội dung mô tả |
| Checklist | Progress bar + list items |
| Actions | Buttons thay đổi status |
| Task Log | Thread chat của task |

### Actions Theo Role

| Role | Available Actions |
|------|-------------------|
| Staff (assignee) | Todo→Doing, Doing→NeedVerify |
| Leader | Tất cả + Approve + Reject |

---

## 8. File Explorer Modal

**Trigger:** Click "View All Files"

### Toolbar

| Thành phần | Mô tả |
|------------|-------|
| Search | Filter theo tên file |
| Type Filter | All, Images, PDF, Excel, Word |
| Sort | By Date, Name, Size |
| View Toggle | Grid / List |
| New Folder | Tạo thư mục mới |

### Content Area

| View Mode | Hiển thị |
|-----------|----------|
| Grid | Thumbnails với tên bên dưới |
| List | Rows với columns (name, type, size, date) |

---

## 9. Image Preview Modal

**Trigger:** Click vào ảnh

### Thành phần

| Thành phần | Mô tả |
|------------|-------|
| Image | Ảnh full size với watermark |
| Zoom Controls | +/- buttons |
| Rotate | 90° left/right buttons |
| Navigation | Prev/Next khi có nhiều ảnh |
| Close | X button hoặc click outside |
| Thumbnails | Strip ở dưới (nếu có nhiều ảnh) |

---

## 10. Lead View (Kanban)

**Đường dẫn:** `/portal/lead`  
**Quyền truy cập:** Leader/Admin only

### Bố Cục

4 cột Kanban:

| Cột | Màu |
|-----|-----|
| Todo | Xám |
| Doing | Xanh dương |
| Need Verify | Vàng |
| Finished | Xanh lá |

### Task Card

| Thành phần | Mô tả |
|------------|-------|
| Title | Tiêu đề task |
| Assignee | Avatar + tên |
| Priority Badge | Màu theo priority |
| Due Date | Ngày deadline |
| Progress | Thanh tiến độ checklist |

### Interactions

| Hành động | Kết quả |
|-----------|---------|
| Drag card | Di chuyển giữa các cột (đổi status) |
| Click card | Mở Task Detail |
| Filter | Filter theo assignee, worktype |

---

## [Mobile] Screen Mapping

| Web Screen | Mobile Screen | Notes |
|------------|---------------|-------|
| Left Sidebar | Tab "Chats" hoặc Drawer | Full screen |
| Chat Panel | Chat Detail | Push navigation |
| Right Panel | Bottom Sheet hoặc separate screen | |
| Task Modal | Full screen Modal | |
| File Explorer | Full screen FileManager | |
| Image Preview | Full screen Gallery | Pinch to zoom |
| Lead View | Separate screen | Tabs hoặc horizontal scroll |

---

**Xem tiếp:** [12-luong-hoat-dong.md](./12-luong-hoat-dong.md)
