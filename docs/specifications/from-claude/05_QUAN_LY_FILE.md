# 05. Quản Lý File

> **Mục đích:** Mô tả tính năng upload, xem, tải và quản lý file

---

## 📌 Tổng Quan

Hệ thống quản lý file cho phép:
- Upload file (hình ảnh, PDF, Word, Excel)
- Xem trước file trong ứng dụng
- Tải file về máy
- Lọc và sắp xếp file
- Quản lý file trong hội thoại

---

## 📍 Vị Trí

### Desktop
```
┌────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT AREA  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│           │             │  ▓ RIGHT PANEL ▓  │
│           │             │  ▓ FILE MANAGER▓  │
│           │             │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│           │             │                    │
│           │             │  [Tabs]            │
│           │             │  • Thông tin       │
│           │             │  • Công việc       │
│           │             │  • ▶ Files         │
│           │             │  • Thành viên      │
└────────────────────────────────────────────────┘
```

### Mobile
```
Từ màn chat → Click icon "ℹ️" → Tab "Files"
Hoặc: Menu → "Tất cả file"
```

---

## 📤 Upload File

### Cách Upload

**Cách 1: Từ ô nhập tin nhắn**
```
[Click icon 📎 trong ô nhập tin]
         ↓
[Chọn file từ máy]
         ↓
[File hiển thị preview]
         ↓
[Nhập caption (tùy chọn)]
         ↓
[Click "Gửi"]
         ↓
[File được upload và gửi trong tin nhắn]
```

**Cách 2: Kéo thả (Drag & Drop)**
```
[Kéo file từ máy vào khung chat]
         ↓
[Hiện preview file]
         ↓
[Drop → File upload]
         ↓
[Gửi tin nhắn với file]
```

**Cách 3: Upload trực tiếp trong File Manager**
```
[Vào tab Files trong right panel]
         ↓
[Click "Upload"]
         ↓
[Chọn file]
         ↓
[File upload vào hội thoại]
```

---

### Loại File Hỗ Trợ

| Loại | Extensions | Max Size | Icon |
|------|-----------|----------|------|
| **Hình ảnh** | jpg, jpeg, png, gif, webp | 10 MB | 🖼️ |
| **PDF** | pdf | 10 MB | 📄 |
| **Word** | doc, docx | 10 MB | 📝 |
| **Excel** | xls, xlsx | 10 MB | 📊 |
| **PowerPoint** | ppt, pptx | 10 MB | 📽️ |

---

### Upload Progress

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

### Upload Nhiều File (Batch)

```
[Chọn nhiều file cùng lúc (Ctrl/Cmd + Click)]
         ↓
[2-10 files selected]
         ↓
[All files preview hiển thị]
         ↓
[Click "Gửi tất cả"]
         ↓
[Upload tuần tự từng file]
         ↓
[Mỗi file là 1 tin nhắn riêng hoặc gộp chung]
```

**Ví dụ:**
```
┌──────────────────────────────────────────────┐
│  FILES ĐANG UPLOAD (3)                       │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ IMG1 │ │ IMG2 │ │ PDF  │                │
│  │ ✓    │ │ 65%  │ │ ...  │                │
│  └──────┘ └──────┘ └──────┘                │
└──────────────────────────────────────────────┘
```

---

## 📁 File Manager (Right Panel)

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
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ IMG │ │ IMG │ │ IMG │ │ PDF │              │
│  │     │ │     │ │     │ │     │              │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                 │
│  ▼ HÔM QUA (3)                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │ XLS │ │ IMG │ │ DOC │                      │
│  └─────┘ └─────┘ └─────┘                      │
│                                                 │
│  ▼ TUẦN NÀY (12)                               │
│  (Click để xem)                                │
│                                                 │
│                               [Xem tất cả →]   │
└─────────────────────────────────────────────────┘
```

---

### Tab Media (Hình Ảnh/Video)

**Hiển thị dạng Grid:**
```
┌─────────────────────────────────────────────────┐
│  MEDIA                                          │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  [IMG]   │ │  [IMG]   │ │  [IMG]   │       │
│  │          │ │          │ │          │       │
│  │ 14:30    │ │ 14:25    │ │ 13:15    │       │
│  │ Minh Anh │ │ Huyền    │ │ Nam      │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  [IMG]   │ │  [IMG]   │ │  [IMG]   │       │
│  │          │ │          │ │          │       │
│  │ 10:30    │ │ 09:45    │ │ Hôm qua  │       │
│  │ Minh Anh │ │ Huyền    │ │ Leader   │       │
│  └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────┘
```

**Click vào ảnh:**
```
[Click ảnh]
         ↓
[Modal preview mở full screen]
         ↓
[Có thể zoom, xoay]
         ↓
[Navigate qua các ảnh (← →)]
```

---

### Tab Documents (Tài Liệu)

**Hiển thị dạng List:**
```
┌─────────────────────────────────────────────────┐
│  DOCUMENTS                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  📄  Bao_cao_kho_thang_01.pdf                  │
│      2.3 MB • Minh Anh • 14:30 hôm nay        │
│      [Xem] [Tải về]                            │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📊  Don_hang_123.xlsx                          │
│      456 KB • Huyền • 13:20 hôm nay           │
│      [Xem] [Tải về]                            │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📝  Huong_dan_kiem_kho.docx                   │
│      125 KB • Leader Hùng • Hôm qua           │
│      [Xem] [Tải về]                            │
│  ─────────────────────────────────────────────  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Tìm Kiếm & Lọc File

### Tìm Kiếm

```
┌─────────────────────────────────────────┐
│  🔍  Tìm kiếm file...                   │
└─────────────────────────────────────────┘
```

**Tìm theo:**
- Tên file
- Người upload
- Ngày upload

**Ví dụ:**
```
Gõ: "báo cáo"
→ Kết quả:
  📄 Bao_cao_kho_thang_01.pdf
  📄 Bao_cao_ban_hang.xlsx
  📝 Bao_cao_tong_ket.docx
```

---

### Lọc File

**Menu lọc:**
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
│  ○ Tùy chỉnh                  │
│                               │
│     [Đặt lại]     [Áp dụng]  │
└───────────────────────────────┘
```

---

### Sắp Xếp File

```
┌───────────────────────────────┐
│  SẮP XẾP THEO:                │
├───────────────────────────────┤
│  ◉ Mới nhất                   │
│  ○ Cũ nhất                    │
│  ○ Tên (A-Z)                  │
│  ○ Tên (Z-A)                  │
│  ○ Kích thước (lớn → nhỏ)    │
│  ○ Kích thước (nhỏ → lớn)    │
└───────────────────────────────┘
```

---

## 👁️ Xem Trước File (Preview)

### Preview Hình Ảnh

```
┌─────────────────────────────────────────────────┐
│  ← IMAGE VIEWER                      [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              [        IMAGE         ]           │
│                                                 │
│                                                 │
│                                                 │
│  ────────────────────────────────────────────  │
│  Anh_kiem_kho.jpg                              │
│  Minh Anh • 14:30 - 27/01/2026                │
│  2.3 MB • 1920x1080                            │
│                                                 │
│  [⟲ Xoay] [🔍 Zoom] [← Trước] [Sau →] [Tải]  │
└─────────────────────────────────────────────────┘
```

**Tính năng:**
- Zoom in/out (scroll hoặc pinch)
- Xoay ảnh (rotate)
- Navigate qua các ảnh (← →)
- Tải ảnh về

---

### Preview PDF

```
┌─────────────────────────────────────────────────┐
│  ← PDF VIEWER                        [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [PDF Content Rendered]                        │
│                                                 │
│  Page 1 of 5                                   │
│                                                 │
│  ────────────────────────────────────────────  │
│  Bao_cao_kho.pdf                               │
│  Minh Anh • 14:30 - 27/01/2026                │
│  2.3 MB • 5 trang                              │
│                                                 │
│  [← Trước] [Trang 1/5] [Sau →] [Zoom] [Tải]  │
└─────────────────────────────────────────────────┘
```

**Tính năng:**
- Cuộn qua các trang
- Zoom in/out
- Tải PDF về

---

### Preview Excel

```
┌─────────────────────────────────────────────────┐
│  ← EXCEL VIEWER                      [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Sheet: Báo Cáo Tháng 01              [▼]     │
│                                                 │
│  ┌─────┬──────────┬──────────┬──────────┐     │
│  │ STT │ Sản Phẩm │ Số Lượng │ Đơn Giá  │     │
│  ├─────┼──────────┼──────────┼──────────┤     │
│  │  1  │ SP A     │   100    │ 50,000   │     │
│  │  2  │ SP B     │   200    │ 75,000   │     │
│  │  3  │ SP C     │   150    │ 60,000   │     │
│  └─────┴──────────┴──────────┴──────────┘     │
│                                                 │
│  Hiển thị 3/100 dòng                           │
│  [← Trước] [Trang 1/10] [Sau →] [Tải]        │
└─────────────────────────────────────────────────┘
```

**Tính năng:**
- Xem các sheet
- Navigate qua các dòng (pagination)
- Tải Excel về để xem đầy đủ

---

### Preview Word

```
┌─────────────────────────────────────────────────┐
│  ← WORD VIEWER                       [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Nội dung Word được render thành HTML]        │
│                                                 │
│  Tiêu đề: Hướng Dẫn Kiểm Kho                  │
│                                                 │
│  1. Chuẩn bị                                   │
│  - Kiểm tra phiếu nhập kho                     │
│  - Chuẩn bị dụng cụ kiểm đếm                   │
│                                                 │
│  2. Thực hiện                                  │
│  ...                                           │
│                                                 │
│  ────────────────────────────────────────────  │
│  Huong_dan_kiem_kho.docx                       │
│  Leader Hùng • Hôm qua                         │
│  [Tải về]                                      │
└─────────────────────────────────────────────────┘
```

**Lưu ý:**
- Word được convert sang HTML để preview
- Format có thể không giữ nguyên 100%
- Nên tải về để xem chính xác

---

## 💾 Tải File Về

### Cách Tải

**Cách 1: Từ tin nhắn**
```
[Click vào file trong tin nhắn]
         ↓
[Nếu hỗ trợ preview] → Modal preview → Click "Tải về"
[Nếu không] → Download trực tiếp
```

**Cách 2: Từ File Manager**
```
[Vào tab Files]
         ↓
[Tìm file cần tải]
         ↓
[Click icon "Tải về" hoặc "Download"]
         ↓
[File download về máy]
```

**Cách 3: Từ preview modal**
```
[Đang xem preview]
         ↓
[Click nút "Tải về" [↓]]
         ↓
[File download]
```

---

## 🗑️ Xóa File

### Quyền Xóa

| Vai trò | Quyền xóa |
|---------|-----------|
| **Người upload** | Xóa file của mình (trong 24h) |
| **Leader** | Xóa bất kỳ file nào |
| **Admin** | Xóa bất kỳ file nào |

### Luồng Xóa

```
[Click "⋮" trên file]
         ↓
[Menu hiện ra]
         ↓
[Click "Xóa"]
         ↓
[Modal xác nhận]
"Bạn có chắc muốn xóa file này?"
         ↓
[Xác nhận]
         ↓
[File bị xóa]
         ↓
[Tin nhắn chứa file hiển thị "File đã bị xóa"]
```

---

## 📊 Dung Lượng & Giới Hạn

### Giới Hạn

| Giới hạn | Giá trị |
|----------|---------|
| **Max file size** | 10 MB |
| **Max files per upload** | 10 files |
| **Total storage per group** | Không giới hạn (hoặc theo config) |

### Khi Vượt Giới Hạn

```
[Chọn file > 10MB]
         ↓
[Hiển thị lỗi]
"File vượt quá 10MB. Vui lòng chọn file nhỏ hơn."
         ↓
[Upload bị hủy]
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **File Manager** | Right panel | Full screen |
| **Preview** | Modal lớn | Full screen |
| **Upload** | Drag & drop + Click | Click + Camera |
| **Grid view (images)** | 3-4 cột | 2-3 cột |
| **Download** | Click → Download folder | Click → Share sheet |
| **Navigation** | Hover menu | Long-press menu |

---

## ✅ Checklist Kiểm Thử

### Upload File

- [ ] **Upload single file**
  - Chọn 1 file → Upload → Hiển thị trong chat

- [ ] **Upload batch (nhiều file)**
  - Chọn 3 files → Upload → Tất cả hiển thị

- [ ] **Drag & drop**
  - Kéo file vào chat → Drop → Upload thành công

- [ ] **Upload progress**
  - Trong khi upload → Hiển thị progress bar
  - % tăng dần

- [ ] **Upload error**
  - File > 10MB → Hiển thị lỗi
  - File không hỗ trợ → Hiển thị lỗi

### File Manager

- [ ] **Hiển thị file**
  - Vào tab Files → Files hiển thị đúng
  - Phân nhóm theo ngày

- [ ] **Tab Media**
  - Grid view cho hình ảnh
  - Thumbnail load đúng

- [ ] **Tab Documents**
  - List view cho tài liệu
  - Thông tin đầy đủ (tên, size, người upload)

### Tìm Kiếm & Lọc

- [ ] **Tìm kiếm file**
  - Gõ tên file → Kết quả lọc real-time

- [ ] **Lọc theo loại**
  - Chọn "Chỉ PDF" → Chỉ hiện PDF
  - Chọn "Tất cả" → Hiện tất cả

- [ ] **Lọc theo người upload**
  - Chọn "Minh Anh" → Chỉ hiện file của Minh Anh

- [ ] **Lọc theo thời gian**
  - Chọn "Hôm nay" → Chỉ hiện file hôm nay

- [ ] **Sắp xếp**
  - Sắp xếp "Mới nhất" → File mới ở trên
  - Sắp xếp "Tên A-Z" → Sắp xếp alphabet

### Preview File

- [ ] **Preview hình ảnh**
  - Click ảnh → Modal mở
  - Ảnh hiển thị rõ ràng
  - Zoom hoạt động
  - Navigate qua các ảnh (← →)

- [ ] **Preview PDF**
  - Click PDF → Viewer mở
  - PDF render đúng
  - Navigate qua các trang

- [ ] **Preview Excel**
  - Click Excel → Hiển thị bảng
  - Các sheet hiển thị
  - Pagination hoạt động

- [ ] **Preview Word**
  - Click Word → Hiển thị nội dung
  - Format gần giống file gốc

### Download File

- [ ] **Download từ tin nhắn**
  - Click file → Download thành công

- [ ] **Download từ File Manager**
  - Click "Tải về" → Download thành công

- [ ] **Download từ preview**
  - Đang xem preview → Click "Tải về" → Download

### Xóa File (nếu có quyền)

- [ ] **Người upload xóa file của mình**
  - Click "⋮" → "Xóa" → Xác nhận → File bị xóa

- [ ] **Leader xóa bất kỳ file**
  - Click "⋮" → "Xóa" → Xác nhận → File bị xóa

- [ ] **Staff không xóa được file người khác**
  - Không thấy option "Xóa"

### Mobile

- [ ] **Upload từ camera**
  - Click camera icon → Chụp ảnh → Upload

- [ ] **Upload từ thư viện**
  - Click gallery → Chọn ảnh → Upload

- [ ] **Preview full screen**
  - Click file → Full screen preview

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Gửi file trong tin nhắn
- 📄 [06_THANH_VIEN_NHOM.md](./06_THANH_VIEN_NHOM.md) - Quyền upload file

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
