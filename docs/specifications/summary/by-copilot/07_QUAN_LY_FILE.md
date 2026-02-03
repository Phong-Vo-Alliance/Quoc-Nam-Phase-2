# 07. Quản Lý File

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Hệ thống quản lý file cho phép:

- Upload file (hình ảnh, PDF, Word, Excel)
- Xem trước file trong ứng dụng
- Tải file về máy
- Lọc và sắp xếp file
- Quản lý file trong hội thoại

---

## 📍 Cách Truy Cập

### Desktop

```
Right Panel → Tab "Files"
```

### Mobile

**Cách 1:**

```
Màn Chat → Icon ℹ️ → Tab "Files"
```

**Cách 2:**

```
Menu → "Tất cả file"
```

---

## 📤 Upload File

### Cách 1: Từ Ô Nhập Tin Nhắn

```
Bước 1: Click icon 📎 trong ô nhập tin
         ↓
Bước 2: Chọn file từ máy
         ↓
Bước 3: File hiển thị preview
         ↓
Bước 4: Nhập caption (tùy chọn)
         ↓
Bước 5: Click "Gửi"
         ↓
Bước 6: File được upload và gửi trong tin nhắn
```

### Cách 2: Kéo Thả (Drag & Drop) - Desktop

```
Bước 1: Kéo file từ máy vào khung chat
         ↓
Bước 2: Hiện preview file
         ↓
Bước 3: Drop → File bắt đầu upload
         ↓
Bước 4: Gửi tin nhắn với file
```

### Cách 3: Upload Trực Tiếp Trong File Manager

```
Bước 1: Vào tab Files trong right panel
         ↓
Bước 2: Click "Upload"
         ↓
Bước 3: Chọn file
         ↓
Bước 4: File upload vào hội thoại
```

---

## 📋 Loại File Hỗ Trợ

| Loại           | Extensions                | Max Size | Icon |
| -------------- | ------------------------- | -------- | ---- |
| **Hình ảnh**   | jpg, jpeg, png, gif, webp | 10 MB    | 🖼️   |
| **PDF**        | pdf                       | 10 MB    | 📄   |
| **Word**       | doc, docx                 | 10 MB    | 📝   |
| **Excel**      | xls, xlsx                 | 10 MB    | 📊   |
| **PowerPoint** | ppt, pptx                 | 10 MB    | 📽️   |

---

## ⏳ Upload Progress

Khi upload file, hiển thị progress:

```
┌─────────────────────────────────────────────────┐
│  ĐANG UPLOAD FILE                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  📄 Bao_cao_kho.xlsx                           │
│  ▓▓▓▓▓▓▓▓░░░░░░░░ 65%                         │
│  125 KB / 192 KB                               │
│                                                 │
│  📄 Don_hang_123.pdf                           │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% ✓                     │
│  2.3 MB                                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📁 File Manager (Tab Files)

### Giao Diện Tổng Quan

```
┌─────────────────────────────────────────────────┐
│  FILES & MEDIA                          [Upload]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────┬──────────┐                         │
│  │ Media  │ Documents│                         │
│  └────────┴──────────┘                         │
│                                                 │
│  🔍 [Tìm kiếm...]              [Lọc ▼] [⋮]    │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ▼ HÔM NAY (5)                                 │
│  [img1] [img2] [img3] [pdf]                    │
│                                                 │
│  ▼ HÔM QUA (3)                                 │
│  [xls] [img4] [doc]                            │
│                                                 │
│  ▼ TUẦN NÀY (12)                               │
│  (Click để xem)                                │
│                                                 │
│                               [Xem tất cả →]   │
└─────────────────────────────────────────────────┘
```

---

### Tab Media (Hình Ảnh/Video)

Hiển thị dạng **Grid** (lưới):

```
┌──────────┐ ┌──────────┐ ┌──────────┐
│  [IMG]   │ │  [IMG]   │ │  [IMG]   │
│          │ │          │ │          │
│ 14:30    │ │ 14:25    │ │ 13:15    │
│ Minh Anh │ │ Huyền    │ │ Nam      │
└──────────┘ └──────────┘ └──────────┘
```

**Click vào ảnh:**

- Mở lightbox preview full screen
- Có thể zoom, xoay
- Navigate qua các ảnh (← →)

---

### Tab Documents (Tài Liệu)

Hiển thị dạng **List** (danh sách):

```
┌─────────────────────────────────────────────────┐
│  📄  Bao_cao_kho_thang_01.pdf                  │
│      2.3 MB • Minh Anh • 14:30 hôm nay        │
│      [Xem] [Tải về]                            │
├─────────────────────────────────────────────────┤
│  📊  Don_hang_123.xlsx                          │
│      456 KB • Huyền • 13:20 hôm nay           │
│      [Xem] [Tải về]                            │
├─────────────────────────────────────────────────┤
│  📝  Huong_dan_kiem_kho.docx                   │
│      125 KB • Leader Hùng • Hôm qua           │
│      [Xem] [Tải về]                            │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Tìm Kiếm File

### Giao Diện

```
┌─────────────────────────────────────────┐
│  🔍  Tìm kiếm file...                   │
└─────────────────────────────────────────┘
```

### Tìm Theo

| Tiêu chí     | Mô tả                       |
| ------------ | --------------------------- |
| Tên file     | "báo cáo", "kiểm kho", etc. |
| Người upload | Tên người gửi               |
| Ngày upload  | (nếu hỗ trợ)                |

**Ví dụ:**

```
Gõ: "báo cáo"
→ Kết quả:
  📄 Bao_cao_kho_thang_01.pdf
  📄 Bao_cao_ban_hang.xlsx
  📝 Bao_cao_tong_ket.docx
```

---

## 🔽 Lọc File

### Menu Lọc

```
┌───────────────────────────────┐
│  LỌC FILE                     │
├───────────────────────────────┤
│  Loại file:                   │
│  ☑ Tất cả                     │
│  ☐ Hình ảnh                   │
│  ☐ PDF                        │
│  ☐ Excel                      │
│  ☐ Word                       │
│  ☐ PowerPoint                 │
│                               │
│  Người upload:                │
│  ☑ Tất cả                     │
│  ☐ Minh Anh                   │
│  ☐ Huyền                      │
│  ☐ Nam                        │
│                               │
│  Thời gian:                   │
│  ◉ Tất cả                     │
│  ○ Hôm nay                    │
│  ○ Tuần này                   │
│  ○ Tháng này                  │
│                               │
│      [Đặt lại]     [Áp dụng] │
└───────────────────────────────┘
```

---

## 🔄 Sắp Xếp File

| Tiêu chí        | Mô tả               |
| --------------- | ------------------- |
| **Ngày upload** | Mới nhất ↔ Cũ nhất  |
| **Tên file**    | A → Z ↔ Z → A       |
| **Kích thước**  | Lớn nhất ↔ Nhỏ nhất |

---

## 👁️ Xem File

### Xem Hình Ảnh

```
Bước 1: Click vào thumbnail ảnh
         ↓
Bước 2: Lightbox mở full screen
         ↓
Bước 3: Có thể:
         • Zoom in/out
         • Xoay ảnh
         • Navigate (← →) qua các ảnh
         • Click ngoài hoặc ✕ để đóng
```

### Xem Tài Liệu (PDF, Word, Excel)

```
Bước 1: Click nút [Xem] trên file
         ↓
Bước 2: File mở trong viewer tích hợp
         ↓
Bước 3: Có thể:
         • Scroll qua các trang
         • Zoom
         • Download nếu muốn
```

---

## ⬇️ Tải File

### Cách Tải

```
Click nút [Tải về] → File download về máy
```

### Vị Trí Nút Tải

- Trong danh sách file (tab Documents)
- Trong lightbox khi xem ảnh
- Trong viewer khi xem tài liệu

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng        | Desktop                        | Mobile                        |
| ---------------- | ------------------------------ | ----------------------------- |
| **Upload**       | Drag & drop, click             | Camera, Gallery, Files        |
| **Xem ảnh**      | Lightbox + keyboard navigation | Full screen + swipe           |
| **Xem tài liệu** | Viewer tích hợp                | External viewer hoặc download |
| **Grid/List**    | Hiển thị nhiều cột             | Ít cột hơn do màn hẹp         |

---

## ⚠️ Xử Lý Lỗi

### Upload Thất Bại

| Lỗi                    | Thông báo                           | Giải pháp                  |
| ---------------------- | ----------------------------------- | -------------------------- |
| File quá lớn           | "File vượt quá 10MB"                | Nén file hoặc chia nhỏ     |
| Định dạng không hỗ trợ | "Định dạng file không được hỗ trợ"  | Chuyển sang định dạng khác |
| Lỗi mạng               | "Upload thất bại. Vui lòng thử lại" | Kiểm tra kết nối, thử lại  |

---

## ✅ Checklist Kiểm Thử

### Upload File

- [ ] **Upload từ icon 📎** - Chọn file, preview, gửi thành công
- [ ] **Drag & drop** (Desktop) - Kéo file vào, upload thành công
- [ ] **Upload nhiều file** - Chọn 2-5 files, upload tuần tự
- [ ] **File quá lớn** - Hiện thông báo lỗi phù hợp
- [ ] **Định dạng không hỗ trợ** - Hiện thông báo lỗi

### Xem File

- [ ] **Xem ảnh** - Lightbox mở, zoom được, xoay được
- [ ] **Navigate ảnh** - ← → chuyển qua các ảnh
- [ ] **Xem PDF** - Viewer mở, scroll được
- [ ] **Xem Excel/Word** - Xem được nội dung

### Tải File

- [ ] **Download file** - File tải về máy thành công
- [ ] **Tên file** - Tên file sau khi tải giữ nguyên

### Tìm Kiếm & Lọc

- [ ] **Tìm theo tên** - Kết quả chính xác
- [ ] **Lọc theo loại** - Chỉ hiện loại được chọn
- [ ] **Lọc theo người** - Chỉ hiện file của người được chọn
- [ ] **Reset filter** - Về trạng thái ban đầu

### Hiển Thị

- [ ] **Tab Media** - Grid hình ảnh hiển thị đúng
- [ ] **Tab Documents** - List tài liệu hiển thị đúng
- [ ] **Nhóm theo ngày** - Hôm nay, Hôm qua, Tuần này, etc.

---

## 📖 Xem Tiếp

→ [08_THANH_VIEN.md](./08_THANH_VIEN.md) - Chi tiết về quản lý thành viên nhóm
