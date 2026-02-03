# 03. Nhắn Tin (Chat)

> **Mục đích:** Mô tả chức năng gửi và nhận tin nhắn, ghim, đánh dấu tin nhắn

---

## 📌 Tổng Quan

Chức năng nhắn tin cho phép người dùng:
- Gửi tin nhắn văn bản
- Gửi hình ảnh và file
- Trả lời (reply) tin nhắn
- Ghim tin nhắn quan trọng (Leader)
- Đánh dấu tin nhắn cá nhân
- Nhận tin nhắn real-time

---

## 📍 Vị Trí

### Desktop
```
┌────────────────────────────────────────────────────┐
│  SIDEBAR  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  RIGHT PANEL │
│           │  ▓  CHAT AREA  ▓▓▓▓  │              │
│  Danh     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  Thông tin   │
│  sách     │                      │  chi tiết    │
│  hội      │  - Header            │              │
│  thoại    │  - Tin ghim          │              │
│           │  - Tin nhắn          │              │
│           │  - Ô nhập            │              │
└────────────────────────────────────────────────────┘
```

### Mobile
```
┌──────────────────────────┐
│  ← Nhóm Kho A       ℹ️   │ ← Header
├──────────────────────────┤
│  📌 Tin ghim (2) ▼      │
├──────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓  TIN NHẮN       ▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
├──────────────────────────┤
│  ●●● Minh đang nhập...  │
├──────────────────────────┤
│  📎 [Nhập tin...]  ➤    │
└──────────────────────────┘
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
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         DANH SÁCH TIN NHẮN                 │   │
│  │         (Scrollable)                        │   │
│  │                                             │   │
│  │  - Tin của người khác (trái)              │   │
│  │  - Tin của mình (phải)                     │   │
│  │  - Nhóm tin liên tiếp                      │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ●●● Minh đang nhập...                             │
├─────────────────────────────────────────────────────┤
│  INPUT AREA                                         │
│  📎  [Nhập tin nhắn...]                      ➤    │
└─────────────────────────────────────────────────────┘
```

---

## 💬 Tin Nhắn (Message Bubble)

### 1. Tin Nhắn Người Khác (Trái)

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

**Đặc điểm:**
- Căn trái màn hình
- Avatar ở bên trái
- Tên người gửi ở trên
- Thời gian ở góc phải trên
- Background màu xám nhạt/trắng
- Menu actions khi hover

---

### 2. Tin Nhắn Của Mình (Phải)

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

**Đặc điểm:**
- Căn phải màn hình
- Không có avatar (hoặc avatar nhỏ bên phải)
- Hiển thị "You" hoặc tên mình
- Background màu xanh nhạt
- Trạng thái gửi: ✓ (đã gửi), ✓✓ (đã đọc)
- Menu actions khi hover (không có nút Ghim)

---

### 3. Nhóm Tin Liên Tiếp

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
- Trong khoảng thời gian gần nhau (< 5 phút)
- Chỉ hiển thị avatar và tên ở tin đầu tiên
- Tin sau không lặp lại avatar/tên

---

### 4. Tin Reply (Trả Lời)

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
- Có khung quote ở trên
- Hiển thị người được reply và nội dung ngắn gọn
- Click vào quote → Scroll đến tin gốc (nếu còn trong màn)

---

### 5. Tin Có Hình Ảnh

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

**Đặc điểm:**
- Thumbnail hiển thị trong bubble
- Có thể gửi nhiều ảnh cùng lúc → Hiển thị grid
- Click ảnh → Modal preview full screen
- Có caption văn bản (tùy chọn)

---

### 6. Tin Có File Đính Kèm

```
┌──────────────────────────────────────────────┐
│  👤 Nam                            15:00     │
│  ┌────────────────────────────────────────┐  │
│  │  📄  Bao_cao_kho.xlsx                  │  │
│  │      125 KB                            │  │
│  │      [Xem] [Tải về]                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Icon file (📄 PDF, 📊 Excel, 📝 Word)
- Tên file
- Kích thước
- Nút xem trước (nếu hỗ trợ)
- Nút tải về

---

## 🎯 Actions Trên Tin Nhắn

### Menu Khi Hover (Desktop)

```
[😊] Reaction
[↩️] Reply
[📌] Pin (chỉ Leader)
[⭐] Star
[⋮]  More options
```

### Menu More Options

```
┌───────────────────────────────┐
│  😊  Thêm reaction            │
│  ↩️  Trả lời                  │
│  📌  Ghim (Leader only)       │
│  ⭐  Đánh dấu                 │
│  📋  Tạo công việc (Leader)   │
│  📋  Copy nội dung            │
│  🔗  Copy link                │
│  ────────────────────────     │
│  🗑️  Xóa (nếu là người gửi)  │
└───────────────────────────────┘
```

### Long-press (Mobile)

```
[Long-press tin nhắn]
         ↓
[Bottom sheet actions]
         ↓
Các tùy chọn giống menu More Options
```

---

## 📌 Ghim Tin Nhắn (Pin Message)

### Mục Đích
- Leader ghim tin nhắn quan trọng
- Tất cả thành viên đều thấy
- Dễ truy cập nhanh

### Cách Ghim

```
[Hover tin nhắn] → [Click icon 📌]
         ↓
[Tin được ghim]
         ↓
[Hiển thị trong khu vực "Tin đã ghim"]
         ↓
[Tất cả thành viên thấy]
```

### Hiển Thị Tin Ghim

```
┌─────────────────────────────────────────────┐
│  📌 TIN NHẮN ĐÃ GHIM (2)          [Xem ▼] │
├─────────────────────────────────────────────┤
│  Click "Xem ▼" → Hiển thị danh sách:       │
│                                             │
│  📌 Minh Anh - 10:30                       │
│     Đã kiểm tra xong 100 thùng...          │
│     [Jump to message]                       │
│                                             │
│  📌 Huyền - 09:15                          │
│     Lưu ý: Kiểm kỹ phần đáy thùng...      │
│     [Jump to message]                       │
└─────────────────────────────────────────────┘
```

### Bỏ Ghim

```
[Click tin đã ghim] → [Click icon 📌 (đã active)]
         ↓
[Xác nhận bỏ ghim]
         ↓
[Tin biến mất khỏi danh sách ghim]
```

**Quyền hạn:**
- Chỉ Leader mới ghim/bỏ ghim
- Staff không thấy icon 📌

---

## ⭐ Đánh Dấu Tin Nhắn (Star Message)

### Mục Đích
- Đánh dấu tin nhắn quan trọng cá nhân
- Chỉ mình thấy
- Dễ tìm lại sau

### Cách Đánh Dấu

```
[Hover tin nhắn] → [Click icon ⭐]
         ↓
[Tin được star]
         ↓
[Hiển thị trong danh sách "Tin đánh dấu" cá nhân]
```

### Xem Tin Đã Đánh Dấu

**Desktop:**
```
Right Panel → Tab "Đánh dấu" → Danh sách tin đã star
```

**Mobile:**
```
Cá nhân → Tin đã đánh dấu → Danh sách
```

### Bỏ Đánh Dấu

```
[Click tin đã star] → [Click icon ⭐ (đã active)]
         ↓
[Tin biến mất khỏi danh sách]
```

---

## ✍️ Gửi Tin Nhắn

### Ô Nhập Tin (Input Area)

```
┌─────────────────────────────────────────────┐
│  📎  😊  📷                                 │
│  ┌────────────────────────────────────────┐ │
│  │  Nhập tin nhắn...                      │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                     [➤ Gửi] │
└─────────────────────────────────────────────┘
```

**Các nút:**
- 📎: Đính kèm file
- 😊: Chọn emoji
- 📷: Chụp ảnh/chọn ảnh
- ➤: Gửi tin nhắn

### Cách Gửi

| Cách | Mô tả |
|------|-------|
| **Click nút "Gửi"** | Click icon ➤ |
| **Nhấn Enter** | Gửi tin (không có Shift) |
| **Shift + Enter** | Xuống dòng (không gửi) |

### Khi Đang Gửi

```
[Gõ tin nhắn] → [Click Gửi/Enter]
         ↓
[Nút disable, hiện spinner ⏳]
         ↓
[Gửi lên server]
         ↓
     Thành công?
         ↓
    ✅ Có → [Hiển thị tin với ✓]
    ❌ Không → [Hiển thị ⚠️ "Gửi lại"]
```

### Trạng Thái Tin Nhắn

| Trạng thái | Icon | Mô tả |
|-----------|------|-------|
| **Đang gửi** | ⏳ | Spinner quay |
| **Đã gửi** | ✓ | 1 dấu tích xám |
| **Đã đọc** | ✓✓ | 2 dấu tích xanh |
| **Lỗi** | ⚠️ | Icon cảnh báo + nút "Gửi lại" |

---

## 📎 Gửi File Đính Kèm

### Chọn File

```
[Click icon 📎]
         ↓
[Hộp thoại chọn file]
         ↓
[Chọn 1 hoặc nhiều file]
         ↓
[File hiển thị preview trong input]
```

### Preview File Đang Gửi

```
┌─────────────────────────────────────────────┐
│  FILE ĐANG GỬI:                             │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ IMG  │ │ PDF  │ │ +2   │                │
│  │ [x]  │ │ [x]  │ │      │  ← Click x xóa │
│  └──────┘ └──────┘ └──────┘                │
│                                             │
│  [Nhập caption...]                    [➤]  │
└─────────────────────────────────────────────┘
```

### Quy Tắc Upload

| Loại File | Max Size | Số Lượng |
|-----------|----------|----------|
| **Hình ảnh** | 10 MB | Không giới hạn |
| **PDF** | 10 MB | Không giới hạn |
| **Word/Excel** | 10 MB | Không giới hạn |

**Lỗi upload:**
- File quá lớn → "File vượt quá 10MB"
- File không hỗ trợ → "Định dạng file không được hỗ trợ"
- Lỗi mạng → "Không thể upload. Vui lòng thử lại"

---

## 🔄 Cuộn & Tải Tin Cũ

### Infinite Scroll

```
[Cuộn lên đầu danh sách]
         ↓
[Gần đến đỉnh?]
         ↓
    ✅ Có
         ↓
[Hiện "⏳ Đang tải..."]
         ↓
[Tải thêm 20-50 tin cũ]
         ↓
[Hiển thị ở phía trên]
```

### Nút "Tin Mới"

```
Khi có tin mới và user đang scroll ở trên:

┌─────────────────────────────────────────────┐
│  (User đang xem tin cũ ở trên)              │
│  ...                                        │
│  ┌────────────────────────────────────────┐ │
│  │  ↓  3 tin nhắn mới            [▼ Xem] │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Click [▼ Xem] → Scroll xuống tin mới nhất
```

---

## 💬 Typing Indicator (Ai Đang Gõ)

### Hiển Thị

```
┌─────────────────────────────────────────────┐
│  ... tin nhắn ...                           │
├─────────────────────────────────────────────┤
│  ●●● Minh đang nhập...                     │
├─────────────────────────────────────────────┤
│  [Input area]                               │
└─────────────────────────────────────────────┘
```

### Logic

```
[User A gõ tin nhắn]
         ↓
[Sau 0.5s, gửi event "UserTyping"]
         ↓
[User B nhận event]
         ↓
[Hiển thị "User A đang nhập..."]
         ↓
[Sau 3s không gõ nữa]
         ↓
[Ẩn indicator]
```

**Quy tắc:**
- Chỉ hiển thị khi người khác đang gõ
- Tự động ẩn sau 3 giây
- Nếu nhiều người gõ: "Minh, Huyền đang nhập..."

---

## ✅ Checklist Kiểm Thử

### Gửi Tin Nhắn

- [ ] **Gửi tin text**
  - Nhập tin → Enter → Tin hiển thị trong danh sách

- [ ] **Gửi tin có emoji**
  - Click 😊 → Chọn emoji → Hiển thị trong tin

- [ ] **Gửi tin nhiều dòng**
  - Shift+Enter → Xuống dòng → Gửi → Hiển thị đúng format

- [ ] **Gửi hình ảnh**
  - Chọn ảnh → Preview → Gửi → Thumbnail hiển thị
  - Click thumbnail → Modal preview mở

- [ ] **Gửi file**
  - Chọn file → Gửi → File hiển thị với icon + tên
  - Click xem → Preview hoạt động

- [ ] **Gửi nhiều file**
  - Chọn 3 file → Preview 3 file → Gửi → Tất cả hiển thị

- [ ] **Trạng thái gửi**
  - Đang gửi: ⏳
  - Đã gửi: ✓
  - Đã đọc: ✓✓

### Nhận Tin Nhắn

- [ ] **Nhận tin real-time**
  - Người khác gửi → Tin hiển thị ngay lập tức
  - Không cần refresh

- [ ] **Tin của người khác**
  - Căn trái, có avatar, tên người gửi

- [ ] **Tin của mình**
  - Căn phải, background xanh, có ✓✓

- [ ] **Nhóm tin liên tiếp**
  - Cùng người, cùng thời gian → Chỉ hiện avatar ở tin đầu

### Reply & Actions

- [ ] **Reply tin nhắn**
  - Hover → Click ↩️ → Quote hiển thị trong input
  - Gửi → Tin reply hiển thị đúng format

- [ ] **Ghim tin nhắn (Leader)**
  - Hover → Click 📌 → Tin vào danh sách ghim
  - Tất cả thành viên thấy

- [ ] **Đánh dấu tin nhắn**
  - Hover → Click ⭐ → Tin vào danh sách cá nhân
  - Chỉ mình thấy

- [ ] **Copy nội dung**
  - Click More → Copy → Nội dung được copy

### Cuộn & Load

- [ ] **Infinite scroll**
  - Cuộn lên → Tải tin cũ → Hiển thị ở trên
  - Loading indicator hiện

- [ ] **Tin mới khi đang cuộn**
  - Có tin mới → Badge "3 tin mới" → Click → Scroll xuống

### Typing Indicator

- [ ] **Hiển thị người đang gõ**
  - Người khác gõ → "... đang nhập" hiện
  - Dừng gõ → Indicator ẩn sau 3s

### Mobile

- [ ] **Long-press tin nhắn**
  - Long-press → Bottom sheet actions hiện
  - Các action hoạt động đúng

- [ ] **Gửi ảnh từ camera**
  - Click 📷 → Mở camera → Chụp → Gửi

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [02_HOI_THOAI.md](./02_HOI_THOAI.md) - Danh sách hội thoại
- 📄 [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Tạo công việc từ tin nhắn
- 📄 [05_QUAN_LY_FILE.md](./05_QUAN_LY_FILE.md) - Quản lý file đính kèm
- 📄 [09_REALTIME_THONG_BAO.md](./09_REALTIME_THONG_BAO.md) - Real-time messaging

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
