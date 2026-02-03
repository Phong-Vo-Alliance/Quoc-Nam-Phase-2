# 04. Nhắn Tin (Chat)

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Chức năng nhắn tin cho phép người dùng:

- Gửi tin nhắn văn bản
- Gửi hình ảnh và file
- Trả lời (reply) tin nhắn
- Ghim tin nhắn quan trọng (Leader)
- Đánh dấu tin nhắn cá nhân (star)
- Nhận tin nhắn real-time
- Xem ai đang gõ (typing indicator)

---

## 📍 Cách Truy Cập

### Desktop

```
Sidebar trái → Click hội thoại → Chat Area hiện ở giữa màn hình
```

### Mobile

```
Tab "Tin nhắn" → Click hội thoại → Màn Chat full screen
```

---

## 🎨 Cấu Trúc Khung Chat

```
┌─────────────────────────────────────────────────────┐
│  HEADER                                             │
│  ← Nhóm Kiểm Hàng Kho A                    ℹ️      │
│  📍 Nhận hàng · Kiểm đếm                           │
├─────────────────────────────────────────────────────┤
│  📌 TIN NHẮN ĐÃ GHIM (2)                  Xem ▼   │
├─────────────────────────────────────────────────────┤
│                                                     │
│         DANH SÁCH TIN NHẮN (Scrollable)           │
│                                                     │
│  - Tin của người khác (trái)                       │
│  - Tin của mình (phải)                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ●●● Minh đang nhập...                             │
├─────────────────────────────────────────────────────┤
│  INPUT AREA                                         │
│  📎  [Nhập tin nhắn...]                      ➤    │
└─────────────────────────────────────────────────────┘
```

### Chi Tiết Các Vùng

| Vùng                   | Mô tả                                                |
| ---------------------- | ---------------------------------------------------- |
| **Header**             | Tên hội thoại, nút back (mobile), nút info ℹ️        |
| **Tin ghim**           | Hiển thị tin nhắn được Leader ghim (collapse/expand) |
| **Danh sách tin nhắn** | Scroll được, tự động cuộn xuống khi có tin mới       |
| **Typing indicator**   | Hiển thị ai đang gõ                                  |
| **Input area**         | Ô nhập tin nhắn, nút đính kèm, nút gửi               |

---

## 💬 Tin Nhắn (Message Bubble)

### Tin Nhắn Của Người Khác (Căn Trái)

```
┌──────────────────────────────────────────────┐
│  👤 Minh Anh                       10:30     │
│  ┌────────────────────────────────────────┐  │
│  │ Đã kiểm tra xong 100 thùng hàng nhập  │  │
│  │ kho sáng nay                           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Hover] → [😊] [↩️] [📌] [⭐] [⋮]          │
└──────────────────────────────────────────────┘
```

| Đặc điểm      | Mô tả                     |
| ------------- | ------------------------- |
| Vị trí        | Căn trái màn hình         |
| Avatar        | Hiển thị bên trái         |
| Tên người gửi | Hiển thị phía trên bubble |
| Thời gian     | Góc phải trên             |
| Background    | Màu xám nhạt/trắng        |
| Menu actions  | Hiện khi hover            |

---

### Tin Nhắn Của Mình (Căn Phải)

```
┌──────────────────────────────────────────────┐
│                            You      10:31    │
│  ┌────────────────────────────────────────┐  │
│  │              OK, cảm ơn em báo cáo     │  │
│  └────────────────────────────────────────┘  │
│                                         ✓✓  │
│                                              │
│          [Hover] → [😊] [↩️] [⭐] [⋮]       │
└──────────────────────────────────────────────┘
```

| Đặc điểm       | Mô tả                               |
| -------------- | ----------------------------------- |
| Vị trí         | Căn phải màn hình                   |
| Avatar         | Không có (hoặc avatar nhỏ bên phải) |
| Tên            | "You" hoặc tên mình                 |
| Background     | Màu xanh nhạt                       |
| Trạng thái gửi | ✓ đã gửi, ✓✓ đã đọc                 |
| Menu actions   | KHÔNG có nút Ghim 📌                |

---

### Nhóm Tin Liên Tiếp

Khi cùng một người gửi nhiều tin liên tiếp (trong < 5 phút):

```
┌──────────────────────────────────────────────┐
│  👤 Minh Anh                       10:30     │
│  ┌────────────────────────────────────────┐  │
│  │ Tin nhắn 1                             │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ Tin nhắn 2 liên tiếp                   │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ Tin nhắn 3 cùng người, cùng thời gian │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Quy tắc nhóm:**

- Cùng người gửi
- Trong khoảng thời gian < 5 phút
- Avatar và tên CHỈ hiển thị ở tin đầu tiên

---

### Tin Reply (Trả Lời)

```
┌──────────────────────────────────────────────┐
│  👤 Huyền                          10:35     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌─ Trả lời Minh Anh ────────────────┐│  │
│  │  │ Đã kiểm tra xong...               ││  │
│  │  └───────────────────────────────────┘│  │
│  │                                        │  │
│  │  Em đã ghi nhận rồi ạ                 │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**

- Có khung quote ở phía trên
- Hiển thị tên người được reply + nội dung rút gọn
- Click vào quote → Scroll đến tin gốc

---

### Tin Có Hình Ảnh

```
┌──────────────────────────────────────────────┐
│  👤 Huyền                          14:30     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌──────────────────────┐              │  │
│  │  │  [IMAGE THUMBNAIL]   │              │  │
│  │  │     Click to view    │              │  │
│  │  └──────────────────────┘              │  │
│  │  Ảnh kiểm tra hàng                     │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Click vào ảnh:** Mở lightbox xem full, có thể zoom, xoay

---

### Tin Có File

```
┌──────────────────────────────────────────────┐
│  👤 Huyền                          14:30     │
│  ┌────────────────────────────────────────┐  │
│  │  📄 Bao_cao_kiem_kho.pdf               │  │
│  │     2.3 MB                              │  │
│  │     [Xem] [Tải về]                      │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 📝 Gửi Tin Nhắn

### Giao Diện Input Area

```
┌─────────────────────────────────────────────────┐
│  📎  😊  📷  [Nhập tin nhắn...]          [➤]  │
└─────────────────────────────────────────────────┘
```

| Nút | Chức năng                              |
| --- | -------------------------------------- |
| 📎  | Đính kèm file                          |
| 😊  | Chọn emoji                             |
| 📷  | Chụp ảnh (mobile) / Chọn ảnh (desktop) |
| [➤] | Gửi tin nhắn                           |

### Luồng Gửi Tin Nhắn Văn Bản

```
Bước 1: Nhập nội dung vào ô input
         ↓
Bước 2: Click nút Gửi [➤] hoặc nhấn Enter
         ↓
Bước 3: Tin nhắn hiện ngay trong danh sách (với icon ⏳ "Đang gửi")
         ↓
Bước 4: Gửi request đến server
         ↓
Bước 5: Server xử lý thành công
         ↓
Bước 6: Icon chuyển thành ✓ "Đã gửi"
         ↓
Bước 7: Khi người khác đọc → ✓✓ "Đã đọc"
```

### Phím Tắt (Desktop)

| Phím              | Hành động              |
| ----------------- | ---------------------- |
| **Enter**         | Gửi tin nhắn           |
| **Shift + Enter** | Xuống dòng             |
| **Ctrl + V**      | Paste ảnh từ clipboard |

---

## ↩️ Reply Tin Nhắn

### Cách Thực Hiện

**Desktop:**

```
Hover tin nhắn → Click icon ↩️ Reply
```

**Mobile:**

```
Long-press tin nhắn → Chọn "Trả lời" từ menu
```

### Giao Diện Khi Reply

```
┌─────────────────────────────────────────────────┐
│  ┌─ Trả lời Minh Anh ─────────────────────┐    │
│  │ Đã kiểm tra xong 100 thùng...          │ ✕ │
│  └────────────────────────────────────────┘    │
│  📎  😊  📷  [Nhập tin nhắn...]          [➤]  │
└─────────────────────────────────────────────────┘
```

**Note:** Có thể click ✕ để hủy reply

---

## 📌 Ghim Tin Nhắn (Leader Only)

### Quyền Hạn

| Vai trò    | Có thể ghim |
| ---------- | ----------- |
| **Staff**  | ❌ Không    |
| **Leader** | ✅ Có       |

### Cách Thực Hiện

**Desktop:**

```
Hover tin nhắn → Click icon 📌
```

**Mobile:**

```
Long-press tin nhắn → Chọn "Ghim tin nhắn"
```

### Hiển Thị Tin Ghim

```
┌─────────────────────────────────────────────────┐
│  📌 TIN NHẮN ĐÃ GHIM (2)               [Xem ▼] │
├─────────────────────────────────────────────────┤
│  👤 Minh Anh - 10:30                           │
│  "Lịch kiểm kho: Thứ 2-4-6 hàng tuần"         │
├─────────────────────────────────────────────────┤
│  👤 Leader Hùng - 09:00                        │
│  "Quy trình mới: Tất cả hàng phải chụp ảnh..."│
└─────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Hiển thị phía trên danh sách tin nhắn
- Có thể collapse/expand
- Click vào tin ghim → Scroll đến tin gốc

---

## ⭐ Đánh Dấu Tin Nhắn (Star)

### Khác Biệt Với Ghim

| Đặc điểm    | Ghim 📌                          | Đánh dấu ⭐      |
| ----------- | -------------------------------- | ---------------- |
| Ai thấy     | TẤT CẢ thành viên                | CHỈ mình bạn     |
| Ai làm được | Leader                           | Tất cả           |
| Mục đích    | Thông báo quan trọng cho cả nhóm | Bookmark cá nhân |

### Cách Thực Hiện

**Desktop:**

```
Hover tin nhắn → Click icon ⭐
```

**Mobile:**

```
Long-press tin nhắn → Chọn "Đánh dấu"
```

### Xem Tin Đã Đánh Dấu

**Desktop:**

```
User menu → "Tin đã đánh dấu"
```

**Mobile:**

```
Tab "Cá nhân" → "Tin đã đánh dấu"
```

---

## 👀 Typing Indicator

### Hiển Thị

```
┌─────────────────────────────────────────────────┐
│  ●●● Minh Anh đang nhập...                     │
├─────────────────────────────────────────────────┤
│  📎  [Nhập tin nhắn...]                  [➤]  │
└─────────────────────────────────────────────────┘
```

### Quy Tắc

| Tình huống       | Hiển thị                       |
| ---------------- | ------------------------------ |
| 1 người đang gõ  | "Minh Anh đang nhập..."        |
| 2 người đang gõ  | "Minh Anh, Huyền đang nhập..." |
| 3+ người đang gõ | "3 người đang nhập..."         |
| Sau 3s không gõ  | Tự động ẩn                     |

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng        | Desktop              | Mobile                         |
| ---------------- | -------------------- | ------------------------------ |
| **Menu actions** | Hover → Hiện menu    | Long-press → Bottom sheet      |
| **Reply**        | Click icon ↩️        | Long-press → "Trả lời"         |
| **Ghim**         | Click icon 📌        | Long-press → "Ghim tin nhắn"   |
| **Gửi tin**      | Enter hoặc click nút | Click nút Gửi                  |
| **Đính kèm**     | Click 📎 → Chọn file | Click 📎 → Camera/Gallery/File |

---

## ✅ Checklist Kiểm Thử

### Gửi Tin Nhắn

- [ ] **Gửi tin văn bản** - Tin hiện ngay, có trạng thái ✓
- [ ] **Gửi tin rỗng** - Không cho gửi (nút disabled hoặc validate)
- [ ] **Gửi tin dài** - Hiển thị đúng, có scroll nếu cần
- [ ] **Shift + Enter** - Xuống dòng, không gửi
- [ ] **Enter** - Gửi tin (desktop)

### Hiển Thị Tin Nhắn

- [ ] **Tin người khác** - Căn trái, có avatar, tên
- [ ] **Tin của mình** - Căn phải, màu xanh
- [ ] **Nhóm tin liên tiếp** - Chỉ tin đầu có avatar
- [ ] **Tin có ảnh** - Thumbnail hiển thị, click mở lightbox
- [ ] **Tin có file** - Icon đúng loại, có nút Xem/Tải về

### Reply

- [ ] **Reply tin** - Hiện preview tin đang reply
- [ ] **Gửi reply** - Tin có quote đúng
- [ ] **Click quote** - Scroll đến tin gốc
- [ ] **Hủy reply** - Click ✕ xóa preview

### Ghim Tin Nhắn

- [ ] **Staff** - KHÔNG thấy nút ghim
- [ ] **Leader** - Thấy nút ghim khi hover
- [ ] **Ghim tin** - Tin hiện trong vùng ghim
- [ ] **Bỏ ghim** - Tin biến mất khỏi vùng ghim
- [ ] **Click tin ghim** - Scroll đến tin gốc

### Đánh Dấu

- [ ] **Star tin** - Icon ⭐ thay đổi trạng thái
- [ ] **Xem tin đã star** - Danh sách hiển thị đúng
- [ ] **Unstar tin** - Tin biến mất khỏi danh sách đã đánh dấu

### Typing Indicator

- [ ] **User gõ** - Hiển thị "... đang nhập"
- [ ] **Nhiều user gõ** - Hiển thị đúng tên/số người
- [ ] **Ngừng gõ 3s** - Tự ẩn indicator

### Real-time

- [ ] **Nhận tin mới** - Tin hiện ngay, tự scroll xuống (nếu đang ở cuối)
- [ ] **Badge unread** - Về 0 khi vào hội thoại

---

## 📖 Xem Tiếp

→ [05_CONG_VIEC.md](./05_CONG_VIEC.md) - Chi tiết về quản lý công việc
