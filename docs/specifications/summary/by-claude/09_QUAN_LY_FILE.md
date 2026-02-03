# 09. Quản Lý File

> **Mục đích:** Mô tả tính năng upload, lưu trữ và quản lý file trong hội thoại
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Hệ thống quản lý file cho phép người dùng:
- Upload file (hình ảnh, tài liệu) vào hội thoại
- Lưu trữ file trong từng hội thoại
- Tìm kiếm và lọc file
- Sắp xếp file theo nhiều tiêu chí
- Tải file về máy
- Xóa file (với quyền phù hợp)

---

## 📍 Vị Trí File Manager

### Desktop Layout

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR  │  CHAT AREA  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│           │             │  ▓ RIGHT PANEL   ▓ │
│           │             │  ▓ FILE MANAGER  ▓ │
│           │             │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│           │             │                     │
│           │             │  [Tabs]             │
│           │             │  • Thông tin        │
│           │             │  • Công việc        │
│           │             │  • ▶ Files          │
│           │             │  • Thành viên       │
│           │             │                     │
│           │             │  [File list/grid]   │
└─────────────────────────────────────────────────┘
```

### Mobile Layout

```
Từ màn chat → Tap icon "ℹ️" info → Chọn tab "Files"

Hoặc:

Menu → "Tất cả file trong cuộc trò chuyện"
```

---

## 📤 Upload File

### Các Cách Upload

#### Cách 1: Từ Ô Nhập Tin Nhắn

```
[Trong màn chat]
         ↓
[Click/Tap icon đính kèm 📎]
         ↓
Desktop: File picker mở
Mobile: Action sheet hiện ra
         ↓
[Chọn file từ máy/thiết bị]
         ↓
[File preview hiển thị]
         ↓
[Nhập caption (tùy chọn)]
         ↓
[Click "Gửi" ➤]
         ↓
[File upload và gửi trong tin nhắn]
```

**Desktop:**
```
┌────────────────────────────────────┐
│ FILE ĐANG GỬI:                     │
│ ┌──────┐                           │
│ │ 📊   │ Bao_cao_kho.xlsx          │
│ │ XLS  │ 456 KB               [x]  │
│ └──────┘                           │
│                                    │
│ [Nhập caption...]            [➤]  │
└────────────────────────────────────┘
```

**Mobile:**
```
┌────────────────────────────────────┐
│  CHỌN NGUỒN                   [✕]  │
├────────────────────────────────────┤
│  📷  Chụp ảnh                       │
│  🖼️  Chọn từ thư viện               │
│  📎  Chọn file                      │
└────────────────────────────────────┘
```

#### Cách 2: Kéo Thả (Drag & Drop - Desktop)

```
[Kéo file từ Desktop/Explorer]
         ↓
[Di chuyển chuột vào chat area]
         ↓
[Drop zone hiển thị:]
┌────────────────────────────────────┐
│                                    │
│        📎  Thả file vào đây        │
│                                    │
└────────────────────────────────────┘
         ↓
[Thả file (drop)]
         ↓
[File preview hiện ra]
         ↓
[Gửi tin nhắn]
```

#### Cách 3: Upload Trực Tiếp Từ File Manager

```
[Vào tab Files trong right panel]
         ↓
[Click nút "Upload" ở góc]
         ↓
[File picker mở]
         ↓
[Chọn file]
         ↓
[File upload vào hội thoại]
```

---

## 📁 Loại File Hỗ Trợ

### Bảng Loại File

| Loại | Extensions | Max Size | Icon |
|------|-----------|----------|------|
| **Hình ảnh** | jpg, jpeg, png, gif, webp | 10 MB | 🖼️ |
| **PDF** | pdf | 10 MB | 📄 |
| **Word** | doc, docx | 10 MB | 📝 |
| **Excel** | xls, xlsx | 10 MB | 📊 |
| **PowerPoint** | ppt, pptx | 10 MB | 📽️ |

### Giới Hạn

| Giới hạn | Giá trị |
|----------|---------|
| **Max file size** | 10 MB/file |
| **Max files per upload** | 10 files cùng lúc |
| **Total storage per group** | Không giới hạn (hoặc theo config server) |

---

## 📊 Upload Progress

### Hiển Thị Tiến Độ

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

### Trạng Thái Upload

- **Đang upload:** Progress bar + % + tốc độ
- **Thành công:** ✓ màu xanh + "Đã tải lên"
- **Thất bại:** ⚠️ màu đỏ + "Lỗi upload" + nút "Thử lại"

---

## 📋 Upload Nhiều File (Batch)

### Chọn Nhiều File

```
Desktop:
[Ctrl/Cmd + Click chọn nhiều file]
         ↓
[2-10 files selected]
         ↓
[All files preview hiển thị]
         ↓
[Click "Gửi tất cả"]
         ↓
[Upload tuần tự từng file]

Mobile:
[Tap "Chọn file"]
         ↓
[Tap nhiều file (multi-select)]
         ↓
[Tap "Xong" (2-10 files)]
         ↓
[Preview hiển thị]
         ↓
[Tap "Gửi"]
```

### Hiển Thị Batch Upload

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

## 🗂️ File Manager Interface

### Tab Layout

```
┌─────────────────────────────────────────────────┐
│  FILES & MEDIA                          [Upload]│
├─────────────────────────────────────────────────┤
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

## 🖼️ Tab Media (Hình Ảnh/Video)

### Grid View

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

### Số Cột Grid

| Platform | Số cột |
|----------|--------|
| Desktop | 3-4 cột |
| Mobile Portrait | 2-3 cột |
| Mobile Landscape | 4-5 cột |

---

## 📄 Tab Documents (Tài Liệu)

### List View

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

### Thông Tin File

Mỗi file hiển thị:
- Icon theo loại file
- Tên file
- Kích thước
- Người upload
- Thời gian upload
- Actions: [Xem] [Tải về] [⋮ Menu]

---

## 🔍 Tìm Kiếm File

### Ô Tìm Kiếm

```
┌─────────────────────────────────────────┐
│  🔍  Tìm kiếm file...                   │
└─────────────────────────────────────────┘
```

### Tìm Theo

- **Tên file:** Gõ tên hoặc một phần tên file
- **Người upload:** Tìm file của user cụ thể
- **Ngày:** Tìm file theo khoảng thời gian

### Ví Dụ

```
Gõ: "báo cáo"

→ Kết quả (3):
  📄 Bao_cao_kho_thang_01.pdf
  📊 Bao_cao_ban_hang.xlsx
  📝 Bao_cao_tong_ket.docx
```

---

## 🎛️ Lọc File

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
│  ☐ Leader Hùng                │
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

### Lọc Theo Loại

Chọn một hoặc nhiều loại file:
- Hình ảnh (JPG, PNG, GIF)
- PDF
- Excel (XLS, XLSX)
- Word (DOC, DOCX)
- PowerPoint (PPT, PPTX)

### Lọc Theo Người Upload

Chọn user cụ thể để xem file của họ upload.

### Lọc Theo Thời Gian

- **Hôm nay:** File upload trong ngày hôm nay
- **Tuần này:** 7 ngày gần nhất
- **Tháng này:** 30 ngày gần nhất
- **Tùy chỉnh:** Chọn khoảng từ ngày X đến ngày Y

---

## 🔀 Sắp Xếp File

### Menu Sắp Xếp

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

### Các Kiểu Sắp Xếp

| Kiểu | Mô tả |
|------|-------|
| **Mới nhất** | File upload gần nhất ở trên (default) |
| **Cũ nhất** | File upload lâu nhất ở trên |
| **Tên A-Z** | Sắp xếp alphabet tăng dần |
| **Tên Z-A** | Sắp xếp alphabet giảm dần |
| **Size lớn → nhỏ** | File lớn nhất ở trên |
| **Size nhỏ → lớn** | File nhỏ nhất ở trên |

---

## 💾 Tải File Về

### Cách Tải

**Cách 1: Từ Tin Nhắn**
```
[Click vào file trong tin nhắn]
         ↓
Desktop: [Preview mở → Click "Tải về"]
Mobile: [Preview full screen → Tap "Tải về"]
         ↓
[File download về máy]
```

**Cách 2: Từ File Manager**
```
[Vào tab Files]
         ↓
[Tìm file cần tải]
         ↓
[Click/Tap icon "Tải về" 📥]
         ↓
[File download]
```

**Cách 3: Từ Preview Modal**
```
[Đang xem preview file]
         ↓
[Click/Tap nút "Tải về" trong toolbar]
         ↓
[File download]
```

### Vị Trí Lưu

| Platform | Vị Trí |
|----------|--------|
| **Desktop** | Thư mục Downloads của trình duyệt |
| **Mobile** | Gallery (ảnh) hoặc Files (tài liệu) |

---

## 🗑️ Xóa File

### Quyền Xóa File

| Vai trò | Quyền xóa |
|---------|-----------|
| **Người upload** | Xóa file của mình (trong 24h) |
| **Leader** | Xóa bất kỳ file nào trong nhóm |
| **Admin** | Xóa bất kỳ file nào trong hệ thống |

### Luồng Xóa

```
[Click "⋮" trên file card]
         ↓
[Menu actions hiện ra]
         ↓
[Click "Xóa"]
         ↓
Desktop: Modal xác nhận
Mobile: Alert dialog
         ↓
"Bạn có chắc muốn xóa file này?"
"File sẽ bị xóa khỏi tin nhắn"
         ↓
[Xác nhận]
         ↓
[File bị xóa]
         ↓
[Tin nhắn chứa file hiển thị: "📎 File đã bị xóa"]
```

### Lưu Ý

- File xóa không thể khôi phục
- Tin nhắn vẫn còn, nhưng file không truy cập được
- Leader sẽ thấy thông báo "[User] đã xóa file"

---

## 📱 Khác Biệt Desktop vs Mobile

### Upload File

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Click upload** | File picker | Action sheet (Camera/Gallery/Files) |
| **Drag & drop** | ✅ Có | ❌ Không |
| **Camera** | ❌ Không | ✅ Có |
| **Multi-select** | Ctrl/Cmd + Click | Native multi-select trong Gallery |
| **Preview trước gửi** | Trong ô input | Bottom sheet với preview |

### File Manager

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Vị trí** | Right panel (350-400px) | Full screen |
| **Grid view** | 3-4 cột | 2-3 cột |
| **List view** | Hover → Actions | Long-press → Actions |
| **Preview** | Modal popup lớn | Full screen |
| **Download** | Click → Downloads folder | Tap → Share sheet → Save |
| **Menu** | Dropdown menu | Bottom sheet |

### Tìm Kiếm & Lọc

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Tìm kiếm** | Inline search bar | Search bar ở top |
| **Lọc** | Dropdown menu | Bottom sheet |
| **Sắp xếp** | Dropdown menu | Bottom sheet |
| **Apply filter** | Tự động | Tap "Áp dụng" |

---

## ✅ Checklist Kiểm Thử

### Upload File

- [ ] **Upload single file**
  - Desktop: Click 📎 → Chọn 1 file → Gửi
  - Mobile: Tap 📎 → Chọn nguồn → Chọn file → Gửi
  - File hiển thị trong chat

- [ ] **Upload multiple files (batch)**
  - Chọn 3 files cùng lúc → Upload
  - Progress hiển thị cho từng file
  - Tất cả file đều gửi thành công

- [ ] **Drag & drop (Desktop)**
  - Kéo file từ Desktop → Drop vào chat
  - Drop zone hiển thị
  - File upload thành công

- [ ] **Camera (Mobile)**
  - Tap 📎 → "Chụp ảnh"
  - Camera mở → Chụp → Confirm
  - Ảnh upload thành công

- [ ] **Upload progress**
  - Trong khi upload → Progress bar hiển thị
  - % tăng dần 0% → 100%
  - Tốc độ upload hiển thị (KB/s)

- [ ] **Upload error**
  - File > 10MB → Lỗi "Vượt quá giới hạn"
  - File type không hỗ trợ → Lỗi "Không hỗ trợ"
  - Mất mạng → Lỗi "Kết nối" + nút "Thử lại"

### File Manager

- [ ] **Hiển thị file**
  - Vào tab Files → Files hiển thị đúng
  - Phân nhóm theo ngày (Hôm nay, Hôm qua, Tuần này...)

- [ ] **Tab Media**
  - Grid view cho hình ảnh
  - Desktop: 3-4 cột
  - Mobile: 2-3 cột
  - Thumbnail load đúng

- [ ] **Tab Documents**
  - List view cho tài liệu
  - Thông tin đầy đủ: Tên, size, người upload, thời gian
  - Icon đúng theo loại file

### Tìm Kiếm & Lọc

- [ ] **Tìm kiếm file**
  - Gõ tên file → Lọc real-time
  - Kết quả highlight từ khóa
  - Không tìm thấy → "Không có kết quả"

- [ ] **Lọc theo loại file**
  - Chọn "Chỉ PDF" → Chỉ hiện PDF
  - Chọn "Hình ảnh" → Chỉ hiện ảnh
  - Chọn "Tất cả" → Hiện tất cả

- [ ] **Lọc theo người upload**
  - Chọn "Minh Anh" → Chỉ hiện file của Minh Anh
  - Chọn "Tất cả" → Hiện file của mọi người

- [ ] **Lọc theo thời gian**
  - Chọn "Hôm nay" → Chỉ hiện file hôm nay
  - Chọn "Tuần này" → Chỉ hiện 7 ngày gần nhất
  - Chọn "Tùy chỉnh" → Date picker hiển thị

- [ ] **Sắp xếp**
  - "Mới nhất" → File mới ở trên (default)
  - "Cũ nhất" → File cũ ở trên
  - "Tên A-Z" → Sắp xếp alphabet
  - "Size lớn → nhỏ" → File lớn ở trên

### Download File

- [ ] **Download từ tin nhắn**
  - Click/Tap file → Download hoặc preview → Download
  - File lưu vào thư mục đúng

- [ ] **Download từ File Manager**
  - Click/Tap icon "Tải về" 📥
  - File download thành công
  - Desktop: Lưu vào Downloads
  - Mobile: Share sheet → Save to Files

- [ ] **Download từ preview**
  - Đang xem preview → Click/Tap "Tải về"
  - File download thành công

### Xóa File

- [ ] **Người upload xóa file của mình (trong 24h)**
  - Click/Tap "⋮" → "Xóa"
  - Xác nhận → File bị xóa
  - Tin nhắn hiển thị "File đã bị xóa"

- [ ] **Leader xóa bất kỳ file**
  - Login Leader → Click "⋮" trên file bất kỳ
  - Option "Xóa" hiển thị
  - Xóa thành công

- [ ] **Staff không xóa được file người khác**
  - Login Staff → Click "⋮" trên file người khác
  - KHÔNG thấy option "Xóa"

- [ ] **Không xóa file sau 24h (Staff)**
  - File upload > 24h → Staff không thấy "Xóa"
  - Chỉ Leader/Admin mới xóa được

### Quyền Hạn

- [ ] **Staff upload được file**
  - Icon 📎 hiển thị
  - Upload thành công

- [ ] **Staff chỉ xóa file của mình**
  - File của mình (< 24h) → Có option "Xóa"
  - File người khác → Không có "Xóa"

- [ ] **Leader xóa bất kỳ file**
  - Tất cả file đều có option "Xóa"

### Mobile Specific

- [ ] **Action sheet chọn nguồn**
  - Tap 📎 → Bottom sheet hiện
  - Options: "Chụp ảnh", "Thư viện", "Chọn file"

- [ ] **Camera integration**
  - Tap "Chụp ảnh" → Camera native mở
  - Chụp → Preview → Confirm
  - Ảnh upload

- [ ] **Gallery multi-select**
  - Tap "Thư viện" → Gallery mở
  - Multi-select 3 ảnh → Done
  - 3 ảnh upload

- [ ] **Full screen preview**
  - Tap file → Full screen preview
  - Pinch to zoom (ảnh)
  - Swipe để navigate

- [ ] **Share sheet download**
  - Trong preview → Tap "Tải về"
  - Share sheet mở
  - Chọn "Save to Files" → Lưu thành công

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [02_QUY_TRINH_CHINH.md](./02_QUY_TRINH_CHINH.md) - Quy trình gửi file
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Gửi file trong tin nhắn
- 📄 [10_PREVIEW_FILE.md](./10_PREVIEW_FILE.md) - Xem trước file chi tiết

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
