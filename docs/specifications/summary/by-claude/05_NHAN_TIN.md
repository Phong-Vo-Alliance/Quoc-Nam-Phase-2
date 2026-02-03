# 05. Nhắn Tin

> **Mục đích:** Mô tả chức năng gửi và nhận tin nhắn trong hội thoại
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Chức năng nhắn tin là trung tâm của hệ thống, cho phép người dùng:
- Gửi tin nhắn văn bản và emoji
- Gửi hình ảnh và file đính kèm
- Trả lời (reply) tin nhắn cụ thể
- Nhận tin nhắn real-time qua SignalR
- Xem ai đang gõ tin (typing indicator)
- Cuộn và tải tin nhắn cũ (infinite scroll)

---

## 📍 Vị Trí

### Desktop Layout

```
┌────────────────────────────────────────────────────┐
│  SIDEBAR  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  RIGHT PANEL │
│           │  ▓  CHAT AREA  ▓▓▓▓  │              │
│  Danh     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  Thông tin   │
│  sách     │                      │  chi tiết    │
│  hội      │  - Header            │              │
│  thoại    │  - Tin ghim          │  - Tab Info  │
│           │  - Tin nhắn          │  - Tab Task  │
│           │  - Typing            │  - Tab Files │
│           │  - Input             │  - Tab Members│
└────────────────────────────────────────────────────┘
```

**Đặc điểm:**
- Chat area chiếm phần lớn màn hình
- Sidebar và Right panel cố định
- Scroll chỉ ở khu vực tin nhắn

---

### Mobile Layout

```
┌──────────────────────────┐
│  ← Nhóm Kho A       ℹ️   │ ← Header (cố định top)
├──────────────────────────┤
│  📌 Tin ghim (2) ▼      │ ← Tin ghim (có thể ẩn)
├──────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓  TIN NHẮN       ▓▓▓  │ ← Danh sách tin (scrollable)
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
├──────────────────────────┤
│  ●●● Minh đang nhập...  │ ← Typing indicator
├──────────────────────────┤
│  📎 [Nhập tin...]  ➤    │ ← Input (cố định bottom)
└──────────────────────────┘
```

**Đặc điểm:**
- Full màn hình chat
- Header và input cố định
- Danh sách tin scrollable
- Keyboard tự động hiện khi focus input

---

## 🎨 Cấu Trúc Khung Chat

```
┌─────────────────────────────────────────────────────┐
│  HEADER                                             │
│  ← Nhóm Kiểm Hàng Kho A                    ℹ️  ⋮  │
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
│  │  [Tin cũ ở trên]                           │   │
│  │         ↕                                   │   │
│  │  [Tin mới ở dưới]                          │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ●●● Minh đang nhập...                             │
├─────────────────────────────────────────────────────┤
│  INPUT AREA                                         │
│  📎  😊  📷  [Nhập tin nhắn...]            ➤      │
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
- Avatar ở bên trái (tròn 40x40px)
- Tên người gửi ở trên bubble
- Thời gian ở góc phải trên
- Background màu xám nhạt (#F0F0F0)
- Border radius: 12px
- Max-width: 70% màn hình
- Menu actions khi hover (Desktop) hoặc long-press (Mobile)

---

### 2. Tin Nhắn Của Mình (Phải)

```
┌──────────────────────────────────────────────┐
│                            You      10:31    │
│  ┌────────────────────────────────────────┐  │
│  │              OK, cảm ơn em báo cáo   ✓││  │
│  └────────────────────────────────────────┘  │
│                                              │
│          [Hover] → [😊] [↩️] [⭐] [⋮]       │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Căn phải màn hình
- Không có avatar (hoặc avatar nhỏ 24x24px bên phải)
- Hiển thị "You" hoặc không hiện tên
- Background màu xanh nhạt (#E3F2FD)
- Trạng thái gửi ở góc phải dưới:
  - ⏳ Đang gửi (spinner)
  - ✓ Đã gửi (1 dấu tích xám)
  - ✓✓ Đã đọc (2 dấu tích xanh)
- Menu actions không có nút Ghim (Staff không được ghim)

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
│  │ Tin nhắn 3 cùng người                  │  │
│  └────────────────────────────────────────┘  │
│                                    10:32     │
└──────────────────────────────────────────────┘
```

**Quy tắc nhóm:**
- Cùng người gửi
- Trong khoảng thời gian < 5 phút
- Chỉ hiển thị avatar và tên ở tin đầu tiên
- Tin sau không lặp lại avatar/tên
- Thời gian chỉ hiện ở tin cuối cùng của nhóm
- Khoảng cách giữa các tin: 4px
- Khoảng cách giữa các nhóm: 16px

---

### 4. Tin Reply (Trả Lời)

```
┌──────────────────────────────────────────────┐
│  👤 Huyền                          10:35     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌─ Trả lời Minh Anh ────────────────┐│  │
│  │  │ Đã kiểm tra xong 100 thùng...     ││  │
│  │  └───────────────────────────────────┘│  │
│  │                                        │  │
│  │  Em đã ghi nhận rồi ạ                 │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Có khung quote ở trên (background #FAFAFA, border-left màu xanh)
- Hiển thị tên người được reply
- Nội dung quote rút gọn (max 2 dòng)
- Click vào quote → Scroll đến tin gốc (nếu còn trong màn)
- Nếu tin gốc bị xóa → Hiển thị "Tin nhắn đã bị xóa"

---

### 5. Tin Có Hình Ảnh

```
┌──────────────────────────────────────────────┐
│  👤 Huyền                          14:30     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌──────────────────────┐              │  │
│  │  │  [IMAGE THUMBNAIL]   │              │  │
│  │  │  Click để xem        │              │  │
│  │  │  200x150px           │              │  │
│  │  └──────────────────────┘              │  │
│  │                                        │  │
│  │  Ảnh kiểm tra hàng buổi sáng          │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Thumbnail hiển thị trong bubble (200x150px)
- Giữ tỷ lệ ảnh gốc (object-fit: cover)
- Có thể gửi nhiều ảnh → Hiển thị grid 2 cột
- Có caption văn bản (tùy chọn)
- Click ảnh → Modal preview full screen với zoom
- Loading spinner khi đang tải ảnh

**Grid nhiều ảnh:**
```
┌────────────────────────────────────────┐
│  ┌───────────┐ ┌───────────┐          │
│  │  Ảnh 1    │ │  Ảnh 2    │          │
│  └───────────┘ └───────────┘          │
│  ┌───────────┐ ┌───────────┐          │
│  │  Ảnh 3    │ │  +2       │          │
│  └───────────┘ └───────────┘          │
└────────────────────────────────────────┘
```

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
- Icon file theo loại:
  - 📄 PDF (.pdf)
  - 📊 Excel (.xlsx, .xls)
  - 📝 Word (.docx, .doc)
  - 📎 Khác
- Tên file (rút gọn nếu quá dài)
- Kích thước file
- Nút "Xem" (preview) - nếu hỗ trợ
- Nút "Tải về" (download)
- Background #F5F5F5

---

## 🎯 Actions Trên Tin Nhắn

### Menu Khi Hover (Desktop)

```
[😊] Reaction      - Thêm emoji reaction
[↩️] Reply         - Trả lời tin nhắn
[📌] Pin           - Ghim (chỉ Leader)
[⭐] Star          - Đánh dấu cá nhân
[⋮]  More options  - Menu mở rộng
```

**Menu More Options:**
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

---

### Long-press (Mobile)

```
[Long-press tin nhắn]
         ↓
[Bottom sheet actions hiện lên]
         ↓
┌───────────────────────────────┐
│  TÙY CHỌN               [✕]  │
├───────────────────────────────┤
│  😊  Thêm reaction            │
│  ↩️  Trả lời                  │
│  📌  Ghim (Leader)            │
│  ⭐  Đánh dấu                 │
│  📋  Tạo công việc (Leader)   │
│  📋  Copy                     │
│  🗑️  Xóa (nếu là người gửi)  │
└───────────────────────────────┘
```

---

### Swipe Actions (Mobile Optional)

```
Swipe phải (→):
┌──────────────────────────────┐
│ [↩️ Reply] Tin nhắn...       │
└──────────────────────────────┘

Swipe trái (←):
┌──────────────────────────────┐
│       Tin nhắn... [⭐ Star]  │
└──────────────────────────────┘
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
- 📎: Đính kèm file (click → File picker)
- 😊: Chọn emoji (click → Emoji picker)
- 📷: Chụp ảnh/chọn ảnh (mobile: camera/gallery)
- ➤: Gửi tin nhắn (chỉ active khi có nội dung)

**Textarea:**
- Auto-resize khi gõ (max 5 dòng)
- Placeholder: "Nhập tin nhắn..."
- Support paste image từ clipboard (Desktop)
- Character count (optional): 0/5000

---

### Cách Gửi Tin

| Cách | Desktop | Mobile | Mô tả |
|------|---------|--------|-------|
| **Click nút Gửi** | ✅ | ✅ | Click icon ➤ |
| **Nhấn Enter** | ✅ | ❌ | Gửi tin (không có Shift) |
| **Shift + Enter** | ✅ | ❌ | Xuống dòng (không gửi) |
| **Tap nút Gửi** | - | ✅ | Tap icon ➤ trên keyboard hoặc UI |

---

### Quy Trình Gửi Tin

```
[Người dùng gõ tin nhắn]
         ↓
[Click Gửi / Nhấn Enter]
         ↓
[Validate: Có nội dung?]
         ↓
    ❌ Không → [Không làm gì, focus input]
    ✅ Có
         ↓
[Hiển thị tin với trạng thái "Đang gửi" ⏳]
         ↓
[Clear input, focus lại]
         ↓
[Gửi request lên server]
         ↓
     Thành công?
         ↓
    ✅ Có → [Cập nhật trạng thái: ✓ Đã gửi]
            [Broadcast qua SignalR cho người khác]

    ❌ Không → [Hiển thị ⚠️ "Gửi lại"]
               [Người dùng có thể click để retry]
```

---

### Trạng Thái Tin Nhắn

```
┌──────────────────────────────────────────┐
│               OK, cảm ơn em       ⏳     │  Đang gửi
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│               OK, cảm ơn em        ✓     │  Đã gửi
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│               OK, cảm ơn em       ✓✓     │  Đã đọc
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│               OK, cảm ơn em   ⚠️ Gửi lại │  Lỗi
└──────────────────────────────────────────┘
```

| Trạng thái | Icon | Màu | Mô tả |
|-----------|------|-----|-------|
| **Đang gửi** | ⏳ | Xám | Spinner quay, request đang gửi |
| **Đã gửi** | ✓ | Xám | 1 dấu tích, server đã nhận |
| **Đã đọc** | ✓✓ | Xanh | 2 dấu tích, người khác đã đọc |
| **Lỗi** | ⚠️ | Đỏ | Icon cảnh báo, có nút "Gửi lại" |

---

## 📎 Gửi File Đính Kèm

### Desktop: Chọn File

**Cách 1: Click Nút 📎**
```
[Click icon 📎]
         ↓
[File picker mở ra]
         ↓
[Chọn 1 hoặc nhiều file]
         ↓
[File hiển thị preview trong input]
```

**Cách 2: Drag & Drop**
```
[Kéo file từ Desktop/Explorer]
         ↓
[Di chuyển chuột vào chat area]
         ↓
[Drop zone hiển thị:]
┌────────────────────────────────────┐
│                                    │
│        📎  Thả file vào đây        │
│      (hoặc nhấn ESC để hủy)        │
│                                    │
└────────────────────────────────────┘
         ↓
[Thả file (drop)]
         ↓
[File preview hiện ra trong input]
```

**Cách 3: Paste từ Clipboard**
```
[Copy ảnh trong browser/app khác]
         ↓
[Focus vào input]
         ↓
[Ctrl+V / Cmd+V]
         ↓
[Ảnh hiển thị preview trong input]
```

---

### Mobile: Chọn File

```
[Tap icon 📷 hoặc 📎]
         ↓
[Action sheet hiển thị:]
┌────────────────────────────────────┐
│  CHỌN NGUỒN                   [✕]  │
├────────────────────────────────────┤
│  📷  Chụp ảnh                       │
│  🖼️  Chọn từ thư viện               │
│  📎  Chọn file                      │
└────────────────────────────────────┘
```

**Chụp ảnh:**
```
[Tap "Chụp ảnh"]
         ↓
[Camera native mở ra]
         ↓
[Chụp ảnh]
         ↓
[Preview ảnh hiển thị:]
┌────────────────────────────────────┐
│  [Ảnh preview full screen]         │
│                                    │
│  [Chụp lại]         [Sử dụng ảnh] │
└────────────────────────────────────┘
         ↓
[Tap "Sử dụng ảnh"]
         ↓
[Ảnh xuất hiện trong input]
```

**Chọn từ thư viện:**
```
[Tap "Chọn từ thư viện"]
         ↓
[Gallery/Photos app mở ra]
         ↓
[Chọn 1 hoặc nhiều ảnh]
         ↓
[Tap "Done" / "Xong"]
         ↓
[Ảnh hiển thị preview trong input]
```

---

### Preview File Đang Gửi

```
┌─────────────────────────────────────────────┐
│  FILE ĐANG GỬI:                             │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ IMG  │ │ PDF  │ │ XLS  │                │
│  │ [x]  │ │ [x]  │ │ [x]  │  ← Click x xóa │
│  └──────┘ └──────┘ └──────┘                │
│  image.jpg  doc.pdf  data.xlsx             │
│  2.5 MB     1.2 MB   456 KB                │
│                                             │
│  [Nhập caption/tin nhắn...]           [➤]  │
└─────────────────────────────────────────────┘
```

**Chức năng:**
- Hiển thị thumbnail cho ảnh
- Hiển thị icon + tên + size cho file khác
- Click [x] để xóa file khỏi danh sách
- Có thể gõ caption kèm theo
- Nút Gửi ➤ chỉ active khi có ít nhất 1 file hoặc có text

---

### Quy Tắc Upload

| Loại File | Max Size | Số Lượng | Format |
|-----------|----------|----------|--------|
| **Hình ảnh** | 10 MB | Không giới hạn | JPG, PNG, GIF |
| **PDF** | 10 MB | Không giới hạn | .pdf |
| **Word** | 10 MB | Không giới hạn | .doc, .docx |
| **Excel** | 10 MB | Không giới hạn | .xls, .xlsx |
| **PowerPoint** | 10 MB | Không giới hạn | .ppt, .pptx |

**Lỗi upload:**
```
❌ File quá lớn:
   "File 'document.pdf' vượt quá 10MB. Vui lòng chọn file nhỏ hơn."

❌ File không hỗ trợ:
   "Định dạng file '.exe' không được hỗ trợ."

❌ Lỗi mạng:
   "Không thể upload file. Vui lòng kiểm tra kết nối và thử lại."
```

---

### Upload Progress

```
┌─────────────────────────────────────────────┐
│  ĐANG UPLOAD FILE (2/3)                     │
│                                             │
│  ✅ image1.jpg (2.5 MB) - Hoàn thành       │
│                                             │
│  📊 report.xlsx (1.2 MB)                   │
│  ▓▓▓▓▓▓▓▓░░░░░░░░ 65%                     │
│  780 KB / 1.2 MB                           │
│                                             │
│  ⏳ document.pdf (3.5 MB) - Đang chờ...    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔄 Cuộn & Tải Tin Cũ

### Infinite Scroll Load Tin Cũ

```
[Người dùng cuộn lên đầu danh sách]
         ↓
[Khi cách đỉnh < 100px]
         ↓
[Gọi API tải thêm tin cũ]
         ↓
[Hiện "⏳ Đang tải..." ở đầu danh sách]
         ↓
[Tải 20-50 tin cũ hơn]
         ↓
[Chèn vào phía trên danh sách]
         ↓
[Giữ vị trí scroll (không nhảy)]
         ↓
[Ẩn "Đang tải..."]
```

**Hiển thị khi load:**
```
┌─────────────────────────────────────┐
│  ⏳ Đang tải tin nhắn cũ hơn...    │
├─────────────────────────────────────┤
│  [Tin cũ vừa load...]               │
│  ...                                │
└─────────────────────────────────────┘
```

**Khi hết tin:**
```
┌─────────────────────────────────────┐
│  ──── Đầu cuộc hội thoại ────      │
├─────────────────────────────────────┤
│  [Tin đầu tiên...]                  │
│  ...                                │
└─────────────────────────────────────┘
```

---

### Nút "Tin Mới" (New Message Badge)

Khi có tin mới và user đang scroll ở trên:

```
┌─────────────────────────────────────────────┐
│  [User đang xem tin cũ ở trên]              │
│  ...                                        │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  ↓  5 tin nhắn mới            [▼ Xem] │ │
│  └────────────────────────────────────────┘ │
│        ↑ Floating button (sticky)          │
└─────────────────────────────────────────────┘
```

**Logic:**
```
[Có tin mới]
         ↓
[Kiểm tra: User đang scroll ở trên?]
         ↓
    ✅ Có (scroll position > 300px từ bottom)
         ↓
         [Hiển thị nút "X tin mới"]
         [Count tăng dần: 1, 2, 3...]
         ↓
         [Click nút]
         ↓
         [Auto scroll xuống tin mới nhất]
         ↓
         [Ẩn nút]

    ❌ Không (đang ở gần bottom)
         ↓
         [Không hiện nút, auto scroll xuống]
```

---

## 💬 Typing Indicator (Ai Đang Gõ)

### Hiển Thị

```
┌─────────────────────────────────────────────┐
│  ... danh sách tin nhắn ...                 │
├─────────────────────────────────────────────┤
│  ●●● Minh đang nhập...                     │
├─────────────────────────────────────────────┤
│  [Input area]                               │
└─────────────────────────────────────────────┘
```

**Nhiều người gõ:**
```
●●● Minh, Huyền đang nhập...
●●● Minh, Huyền và 2 người khác đang nhập...
```

---

### Logic Hoạt Động

```
[User A gõ tin nhắn trong input]
         ↓
[Sau 0.5s, gửi event "UserTyping" qua SignalR]
         ↓
[User B, C, D... nhận event]
         ↓
[Hiển thị "User A đang nhập..."]
         ↓
[Sau 3s không gõ nữa (hoặc gửi tin)]
         ↓
[Gửi event "UserStoppedTyping"]
         ↓
[Ẩn typing indicator]
```

**Quy tắc:**
- Chỉ hiển thị khi người khác đang gõ (không hiện cho chính mình)
- Tự động ẩn sau 3 giây không có event
- Debounce: Chỉ gửi event sau 0.5s gõ, tránh spam
- Nếu gửi tin → Ẩn ngay lập tức

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Input area** | Textarea auto-resize | Textarea auto-resize, keyboard auto-show |
| **Gửi tin** | Enter (Shift+Enter xuống dòng) | Tap nút ➤ |
| **Actions menu** | Hover → Icons hiện | Long-press → Bottom sheet |
| **Upload file** | Click 📎 / Drag-drop / Paste | Tap 📷/📎 → Action sheet |
| **Preview ảnh** | Modal popup giữa màn | Full screen modal |
| **Reply** | Hover → Click ↩️ | Long-press → Chọn Reply |
| **Scroll to bottom** | Auto khi có tin mới | Auto khi có tin mới, có nút ↓ |
| **Emoji picker** | Popup dưới nút 😊 | Full screen picker |
| **Context menu** | Right-click → Menu | Long-press → Bottom sheet |

---

## ✅ Checklist Kiểm Thử

### Gửi Tin Nhắn

- [ ] **Gửi tin text**
  - Nhập tin → Enter (Desktop) / Tap ➤ (Mobile)
  - Tin hiển thị trong danh sách với trạng thái ⏳
  - Sau đó chuyển ✓ khi gửi thành công

- [ ] **Gửi tin nhiều dòng**
  - Desktop: Shift+Enter → Xuống dòng → Gửi → Hiển thị đúng format
  - Mobile: Tap Enter → Xuống dòng → Tap ➤ → Hiển thị đúng

- [ ] **Gửi emoji**
  - Click 😊 → Chọn emoji → Hiển thị trong tin
  - Emoji hiển thị đúng trên cả 2 nền tảng

- [ ] **Gửi tin rỗng**
  - Chỉ có space/newline → Nút Gửi disable
  - Không gửi được

- [ ] **Trạng thái tin nhắn**
  - ⏳ Đang gửi: Spinner quay
  - ✓ Đã gửi: 1 dấu tích xám
  - ✓✓ Đã đọc: 2 dấu tích xanh
  - ⚠️ Lỗi: Icon cảnh báo + nút "Gửi lại"

---

### Gửi File

- [ ] **Desktop: Click 📎**
  - File picker mở → Chọn file → Preview hiển thị
  - Gửi → Upload progress → Tin có file hiển thị

- [ ] **Desktop: Drag & Drop**
  - Kéo file vào chat area → Drop zone hiện
  - Thả file → Preview hiển thị
  - Gửi → Upload thành công

- [ ] **Desktop: Paste ảnh**
  - Copy ảnh → Paste vào input → Preview hiển thị
  - Gửi → Upload thành công

- [ ] **Mobile: Chụp ảnh**
  - Tap 📷 → Chọn "Chụp ảnh" → Camera mở
  - Chụp → Preview → "Sử dụng ảnh" → Hiển thị trong input
  - Gửi → Upload thành công

- [ ] **Mobile: Chọn từ thư viện**
  - Tap 📷 → "Chọn từ thư viện" → Gallery mở
  - Chọn 1 hoặc nhiều ảnh → Preview hiển thị
  - Gửi → Upload thành công

- [ ] **Upload nhiều file**
  - Chọn 3 file (ảnh, PDF, Excel) → Preview hiển thị đúng
  - Xóa 1 file bằng [x] → File bị xóa khỏi preview
  - Gửi → Tất cả file còn lại upload

- [ ] **Upload file lớn**
  - Chọn file > 10MB → Hiển thị lỗi "File vượt quá 10MB"
  - Không cho upload

- [ ] **Upload progress**
  - File lớn → Hiển thị progress bar %
  - 0% → 50% → 100%
  - Có thể hủy upload giữa chừng (optional)

---

### Nhận Tin Nhắn

- [ ] **Nhận tin real-time**
  - Người khác gửi → Tin hiển thị ngay lập tức
  - Không cần refresh
  - SignalR hoạt động đúng

- [ ] **Tin của người khác**
  - Căn trái
  - Có avatar bên trái
  - Tên người gửi ở trên
  - Background xám nhạt

- [ ] **Tin của mình**
  - Căn phải
  - Background xanh nhạt
  - Có ✓/✓✓ ở góc phải

- [ ] **Nhóm tin liên tiếp**
  - Cùng người, cùng thời gian → Chỉ hiện avatar ở tin đầu
  - Khoảng cách tin trong nhóm: 4px
  - Khoảng cách giữa các nhóm: 16px

---

### Reply & Actions

- [ ] **Reply tin nhắn**
  - Desktop: Hover → Click ↩️ → Quote hiển thị trong input
  - Mobile: Long-press → Chọn "Trả lời" → Quote hiển thị
  - Gõ tin → Gửi → Tin reply hiển thị đúng format
  - Click quote → Scroll đến tin gốc

- [ ] **Copy tin nhắn**
  - Desktop: Hover → More → Copy
  - Mobile: Long-press → Copy
  - Nội dung được copy vào clipboard

- [ ] **Xóa tin nhắn**
  - Chỉ người gửi mới thấy nút Xóa
  - Click Xóa → Confirm → Tin bị xóa
  - Người khác thấy "Tin nhắn đã bị xóa"

---

### Cuộn & Load

- [ ] **Infinite scroll**
  - Cuộn lên đầu → Tự động tải tin cũ
  - Loading indicator hiện ở đầu
  - Tin cũ chèn vào phía trên, vị trí scroll không nhảy

- [ ] **Scroll to bottom tự động**
  - Khi gửi tin → Auto scroll xuống
  - Khi nhận tin mới (nếu đang ở bottom) → Auto scroll
  - Nếu đang scroll ở trên → Không auto scroll

- [ ] **Nút "Tin mới"**
  - Có tin mới + đang scroll ở trên → Nút hiện
  - Click nút → Scroll xuống tin mới nhất
  - Nút ẩn sau khi scroll

- [ ] **Load đến đầu cuộc hội thoại**
  - Cuộn hết tin → Hiển thị "Đầu cuộc hội thoại"
  - Không load thêm

---

### Typing Indicator

- [ ] **Hiển thị người đang gõ**
  - Người khác gõ → "●●● [Tên] đang nhập..." hiện
  - Dừng gõ → Indicator ẩn sau 3s
  - Nhiều người gõ → "A, B đang nhập..."

- [ ] **Không hiện cho chính mình**
  - Mình gõ → Không thấy indicator của mình

---

### Mobile Specific

- [ ] **Keyboard auto-show**
  - Focus vào input → Keyboard tự động hiện
  - Chat area tự động scroll để input không bị che

- [ ] **Keyboard "Done" / "Send"**
  - Keyboard có nút "Send" → Tap = Gửi tin

- [ ] **Long-press actions**
  - Long-press tin → Bottom sheet hiện
  - Các action hoạt động đúng

- [ ] **Swipe actions (optional)**
  - Swipe phải → Reply
  - Swipe trái → Star

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [04_DANH_SACH_HOI_THOAI.md](./04_DANH_SACH_HOI_THOAI.md) - Danh sách hội thoại
- 📄 [06_TIN_NHAN_DAC_BIET.md](./06_TIN_NHAN_DAC_BIET.md) - Ghim, đánh dấu, reply
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Tạo công việc từ tin nhắn
- 📄 [09_QUAN_LY_FILE.md](./09_QUAN_LY_FILE.md) - Quản lý file đính kèm
- 📄 [10_PREVIEW_FILE.md](./10_PREVIEW_FILE.md) - Xem trước file
- 📄 [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md) - Real-time messaging

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
