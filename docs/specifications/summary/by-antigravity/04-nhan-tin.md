# 04. Nhắn Tin (Messaging)

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Tính năng nhắn tin cho phép người dùng gửi và nhận tin nhắn theo thời gian thực. Hỗ trợ nhiều loại tin nhắn khác nhau và các thao tác như reply, pin, star.

---

## Cách Truy Cập

- **Vị trí:** Vùng chính (Main Content) của Portal
- **Điều kiện:** Chọn một conversation từ sidebar

---

## Cấu Trúc Chat Panel

```
┌─────────────────────────────────────────────────────────┐
│  CHAT HEADER                                            │
│  [Avatar] Nhóm Kho A                  [🔍] [ℹ️]         │
│           5 thành viên                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ── 25/01/2026 ──                     │
│                                                         │
│  ┌──────────────────────────────┐                       │
│  │ Minh                    10:30│                       │
│  │ Kiểm hàng xong rồi           │                       │
│  └──────────────────────────────┘                       │
│                                                         │
│                       ┌──────────────────────────────┐  │
│                       │                        10:32 │  │
│                       │ OK, thanks em!               │  │
│                       └──────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────┐                       │
│  │ Huyền                   10:35│                       │
│  │ [📷 Ảnh kiểm hàng]            │                       │
│  │ Đây ạ                        │                       │
│  └──────────────────────────────┘                       │
│                                                         │
│             Minh đang gõ...                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [📎] [   Nhập tin nhắn...                   ] [Gửi]   │
└─────────────────────────────────────────────────────────┘
```

---

## Các Loại Tin Nhắn

### 1. Tin Nhắn Văn Bản (Text)

| Đặc điểm | Mô tả |
|----------|-------|
| Nội dung | Text thuần |
| Mention | Hỗ trợ @username |
| Emoji | Hỗ trợ đầy đủ |
| Hiển thị | Trong bubble message |

### 2. Tin Nhắn Hình Ảnh (Image)

| Đặc điểm | Mô tả |
|----------|-------|
| Hiển thị | Thumbnail ảnh trong chat |
| Click | Xem full size với zoom |
| Số lượng | Tối đa 4 ảnh/tin nhắn |
| Caption | Có thể thêm text đi kèm |

### 3. Tin Nhắn File

| Đặc điểm | Mô tả |
|----------|-------|
| Hiển thị | Card với icon loại file |
| Thông tin | Tên file + kích thước |
| Click | Preview hoặc download |
| Loại hỗ trợ | PDF, Excel, Word, và các loại khác |

### 4. Tin Nhắn Hệ Thống (System)

| Đặc điểm | Mô tả |
|----------|-------|
| Nguồn | Tự động từ hệ thống |
| Nội dung | "User A đã thêm User B vào nhóm" |
| Hiển thị | Căn giữa, style khác biệt |

---

## Gửi Tin Nhắn

### Gửi Tin Văn Bản

**Bước 1:** Nhập nội dung vào ô input

**Bước 2:** Nhấn nút Gửi hoặc phím Enter

**Bước 3:** Tin nhắn xuất hiện ngay trong danh sách
- Trạng thái "sending" ban đầu
- Chuyển "sent" khi server xác nhận
- Hiển thị thời gian gửi

### Gửi Ảnh

**Bước 1:** Click nút đính kèm 📎 → Chọn ảnh

**Bước 2:** Ảnh hiển thị preview trước khi gửi

**Bước 3:** (Tùy chọn) Thêm caption

**Bước 4:** Nhấn Gửi

**Bước 5:** Ảnh upload với progress bar → Hiển thị trong chat

### Gửi File

**Bước 1:** Click nút đính kèm 📎 → Chọn file

**Bước 2:** File được validate (loại + kích thước max 50MB)

**Bước 3:** Nhấn Gửi

**Bước 4:** File upload với progress bar → Hiển thị card trong chat

---

## Nhận Tin Nhắn (Real-time)

### Khi Đang Xem Conversation

| Tình huống | Hành vi |
|------------|---------|
| Đang ở cuối chat | Tin nhắn mới thêm vào cuối, auto scroll xuống |
| Đang scroll xem tin cũ | Hiển thị nút "Tin nhắn mới ↓" để jump xuống |
| Animation | Slide-in cho tin nhắn mới |

### Khi Không Xem Conversation

| Hành vi | Mô tả |
|---------|-------|
| Badge unread | Tăng ở sidebar |
| Toast notification | Xuất hiện (nếu enabled) |
| Sound | Thông báo âm thanh (nếu enabled) |

---

## Các Thao Tác Trên Tin Nhắn

Khi **right-click** (desktop) hoặc **long-press** (mobile) vào tin nhắn, hiển thị menu context:

### Reply (Trả lời)
- **Ai có quyền:** Tất cả
- **Hành vi:** Input area hiển thị quote tin nhắn gốc
- **Tin mới:** Link đến tin gốc
- **Click quote:** Scroll đến tin gốc

### Edit (Sửa)
- **Ai có quyền:** Chỉ chủ tin nhắn
- **Hành vi:** Mở input với nội dung cũ
- **Sau khi lưu:** Hiển thị "(đã chỉnh sửa)"

### Delete (Xóa)
- **Ai có quyền:** Chỉ chủ tin nhắn
- **Hành vi:** Hiển thị confirm dialog
- **Kết quả:** Soft delete - có thể hiển thị "Tin nhắn đã xóa"

### Pin (Ghim)
- **Ai có quyền:** Chỉ Leader/Admin
- **Hành vi:** Tin nhắn được đánh dấu icon pin 📌
- **Kết quả:** Xuất hiện trong danh sách Pinned Messages
- **Unpin:** Click lại để bỏ ghim

### Star (Đánh dấu)
- **Ai có quyền:** Tất cả
- **Hành vi:** Tin nhắn được đánh dấu icon star ⭐
- **Phạm vi:** Cá nhân (chỉ user đó thấy)
- **Unstar:** Click lại để bỏ

### Create Task (Tạo công việc)
- **Ai có quyền:** Chỉ Leader/Admin
- **Hành vi:** Mở modal tạo task với nội dung tin nhắn
- **Kết quả:** Task được link đến tin nhắn gốc

---

## Mention (@)

### Cách Mention

1. Gõ "@" trong ô input
2. Dropdown danh sách thành viên xuất hiện
3. Chọn người hoặc tiếp tục gõ để filter
4. Người được mention nhận notification đặc biệt

### Hiển Thị

| Đặc điểm | Mô tả |
|----------|-------|
| Text | Highlight màu khác |
| Clickable | Có thể click để xem profile |
| Notification | Badge mention "@" ở sidebar |

---

## Typing Indicator

### Khi Đang Gõ

- User khác thấy: "Tên đang gõ..."
- Vị trí: Dưới danh sách tin nhắn
- Animation: Dots (...)

### Quy Tắc

| Tình huống | Hành vi |
|------------|---------|
| Ngừng gõ 3-5 giây | Ẩn indicator |
| Nhiều người gõ | "2 người đang gõ..." |

---

## Load More (Pagination)

### Infinite Scroll

1. Scroll lên đầu → Trigger load thêm tin cũ
2. Loading spinner hiển thị ở đầu
3. Mỗi lần load 50 tin nhắn
4. Giữ vị trí scroll sau khi load xong

### End of Messages

- Khi đã load hết → Hiển thị "Đây là tin nhắn đầu tiên"

---

## [QC] Test Cases - Nhắn Tin

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Gửi tin văn bản | Nhập text, nhấn Gửi | Tin nhắn hiển thị ngay | 🔴 Cao |
| 2 | Gửi ảnh | Chọn ảnh, nhấn Gửi | Ảnh hiển thị với thumbnail | 🔴 Cao |
| 3 | Gửi file | Chọn PDF, nhấn Gửi | File card hiển thị | 🔴 Cao |
| 4 | Nhận tin realtime | User khác gửi tin | Tin xuất hiện không cần refresh | 🔴 Cao |
| 5 | Reply tin nhắn | Right-click → Reply | Tin mới có quote tin gốc | 🟠 TB |
| 6 | Edit tin nhắn | Right-click tin của mình → Edit | Nội dung được cập nhật, có "(đã chỉnh sửa)" | 🟠 TB |
| 7 | Delete tin nhắn | Right-click tin của mình → Delete | Tin nhắn bị ẩn/xóa | 🟠 TB |
| 8 | Pin tin nhắn (Leader) | Right-click → Pin | Icon pin xuất hiện | 🟠 TB |
| 9 | Star tin nhắn | Right-click → Star | Icon star xuất hiện | 🟢 Thấp |
| 10 | Mention user | Gõ @tên | User nhận notification đặc biệt | 🟠 TB |
| 11 | Scroll load more | Scroll lên đầu | Load thêm tin cũ | 🟠 TB |
| 12 | Typing indicator | Gõ tin nhắn | User khác thấy "đang gõ..." | 🟢 Thấp |
| 13 | Edit tin người khác | Right-click tin người khác | KHÔNG thấy option Edit | 🔴 Cao |
| 14 | Pin không có quyền | Staff right-click → tìm Pin | KHÔNG thấy option Pin | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

### Keyboard Handling

| Sự kiện | Hành vi |
|---------|---------|
| Keyboard mở | Chat slide lên |
| Input | Luôn visible |
| Nhận tin mới | Auto scroll khi keyboard mở |

### Long Press Menu

- Thay thế right-click bằng long press
- Hiển thị bottom sheet hoặc popover menu

### Image Picker

- Sử dụng native image picker
- Hỗ trợ chọn nhiều ảnh
- Compress ảnh trước khi upload

### File Upload

- Hỗ trợ document picker
- Giới hạn kích thước file
- Progress bar khi upload

### Push Notification

- Nhận notification khi app ở background
- Tap notification → Mở đúng conversation

---

**Xem tiếp:** [05-quan-ly-task.md](./05-quan-ly-task.md)
