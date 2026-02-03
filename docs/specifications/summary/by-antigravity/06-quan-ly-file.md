# 06. Quản Lý File

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Tính năng quản lý file cho phép upload, preview và tổ chức file theo thư mục. File được chia sẻ trong nhóm chat và được bảo vệ bằng watermark cùng các biện pháp chống sao chép.

---

## Cách Truy Cập

| Cách | Vị trí | Mô tả |
|------|--------|-------|
| Nút đính kèm 📎 | Ô input chat | Upload file khi gửi tin nhắn |
| Tab "Files" | Right Panel | Xem danh sách file của conversation |
| Tab "Media" | Right Panel | Xem ảnh và video |
| "View All Files" | Right Panel | Mở File Explorer đầy đủ |

---

## Các Loại File Hỗ Trợ

| Loại | Định dạng | Preview | Đặc điểm |
|------|-----------|---------|----------|
| **Hình ảnh** | JPG, PNG, GIF, WEBP | ✅ Full + Zoom | Thumbnail preview |
| **PDF** | .pdf | ✅ Trong browser | Có watermark |
| **Excel** | .xlsx, .xls | ✅ Dạng bảng | Preview sheet đầu |
| **Word** | .docx, .doc | ✅ Dạng text | Format cơ bản |
| **Khác** | Các file khác | ❌ Chỉ download | Icon generic |

---

## Cấu Trúc File Explorer

```
┌─────────────────────────────────────────────────────────────┐
│  FILE EXPLORER                                    [✕]       │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Tìm kiếm file...]                                     │
│                                                             │
│  Filter: [All ▼] [Images] [PDF] [Excel] [Word]             │
│  Sort: [Ngày ▼]        View: [Grid] [List]    [+ Upload]   │
├─────────────────────────────────────────────────────────────┤
│  📍 Nhận hàng > Kiểm đếm                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 📁       │  │ 📁       │  │ 📷       │  │ 📄       │   │
│  │ Biên bản │  │ Hóa đơn  │  │ IMG_001  │  │ Report   │   │
│  │          │  │          │  │ .jpg     │  │ .pdf     │   │
│  │ 5 files  │  │ 3 files  │  │ 2.5MB    │  │ 1.2MB    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 📊       │  │ 📝       │  │ 📷       │                  │
│  │ Data     │  │ Notes    │  │ IMG_002  │                  │
│  │ .xlsx    │  │ .docx    │  │ .png     │                  │
│  │ 350KB    │  │ 150KB    │  │ 3.1MB    │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tổ Chức Thư Mục

### Cấu Trúc 2 Cấp

```
📁 Nhận hàng/                  ← Level 0 (Thư mục gốc)
   ├── 📁 Kiểm đếm/            ← Level 1 (Thư mục con)
   │      └── (các file)
   └── 📁 Biên bản/            ← Level 1
          └── (các file)

📁 Đổi trả/                    ← Level 0
   └── 📁 Hóa đơn/             ← Level 1
          └── (các file)
```

### Thuộc Tính Thư Mục (Folder Attributes)

- Mỗi thư mục có thể có các thuộc tính custom
- Ví dụ: Mã đơn hàng, Ngày nhận, Số lượng
- Leader có thể cấu hình template thuộc tính
- Thuộc tính giúp tìm kiếm và phân loại

---

## Upload File

### Từ Chat Input

**Bước 1:** Click nút đính kèm 📎 trong ô input

**Bước 2:** Chọn file từ máy tính

**Bước 3:** File được validate:
- ✅ Loại file cho phép
- ✅ Kích thước ≤ 50MB
- ❌ Nếu không hợp lệ → Hiển thị lỗi

**Bước 4:** (Tùy chọn) Thêm caption

**Bước 5:** Nhấn Gửi

**Bước 6:** Progress bar hiển thị

**Bước 7:** File xuất hiện trong chat và tự động sync vào File Explorer

### Từ File Explorer

**Bước 1:** Mở File Explorer

**Bước 2:** Navigate đến thư mục muốn upload

**Bước 3:** Click nút "Upload" hoặc drag-drop file

**Bước 4:** Chọn file và upload

**Bước 5:** File xuất hiện trong thư mục

---

## Preview File

### Preview Ảnh

| Thành phần | Mô tả |
|------------|-------|
| Hiển thị | Modal full-screen với ảnh |
| Watermark | Tên user + timestamp |
| Toolbar | Zoom in/out, Rotate 90°, Previous/Next |
| Đóng | Click outside hoặc nút X |
| Gallery | Navigate qua lại giữa các ảnh với thumbnail strip |

### Preview PDF

| Thành phần | Mô tả |
|------------|-------|
| Hiển thị | Modal với PDF viewer |
| Navigation | Scroll để xem các trang |
| Watermark | Overlay trên mỗi trang |
| Download | Nút download (nếu cho phép) |

### Preview Excel

| Thành phần | Mô tả |
|------------|-------|
| Hiển thị | Modal dạng bảng |
| Phạm vi | Preview sheet đầu tiên |
| Scroll | Ngang/dọc để xem |
| Full view | Nút download để mở đầy đủ |

### Preview Word

| Thành phần | Mô tả |
|------------|-------|
| Hiển thị | Modal với nội dung text |
| Format | Giữ format cơ bản |
| Full view | Nút download để mở đầy đủ |

---

## Thao Tác Với Folder

| Thao tác | Cách thực hiện | Lưu ý |
|----------|----------------|-------|
| **Tạo thư mục** | Click "New Folder" → Nhập tên | Có thể chọn loại thuộc tính |
| **Đổi tên** | Right-click → Rename → Nhập tên mới | - |
| **Xóa** | Right-click → Delete → Confirm | Phải trống mới xóa được |
| **Cập nhật thuộc tính** | Click icon edit → Điền form | Chỉ cho folder có thuộc tính |

---

## Thao Tác Với File

| Thao tác | Cách thực hiện | Mô tả |
|----------|----------------|-------|
| **Preview** | Double-click hoặc single-click | Mở modal preview |
| **Di chuyển** | Drag vào folder khác hoặc Right-click → Move to | Chọn folder đích |
| **Download** | Click nút download | File tải về máy |
| **Xóa** | Right-click → Delete → Confirm | Soft delete |

---

## Tự Động Sync

### File Upload Qua Chat

- File tự động xuất hiện trong File Explorer
- Đặt vào thư mục "Unsorted" hoặc theo WorkType
- Có thể di chuyển vào thư mục phù hợp sau

### File Upload Qua File Explorer

- File có thể được link đến conversation
- Tùy chọn gửi notification cho nhóm

---

## Giới Hạn

| Giới hạn | Giá trị | Khi vi phạm |
|----------|---------|-------------|
| Kích thước file | Max 50MB | Hiển thị lỗi size |
| Loại file | Whitelist (không có .exe, .bat...) | Hiển thị lỗi loại file |
| Số ảnh/tin nhắn | Max 4 ảnh | Cần gửi nhiều tin |

---

## [QC] Test Cases - Quản Lý File

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Upload ảnh từ chat | Đính kèm ảnh, gửi | Ảnh hiển thị, sync vào Files | 🔴 Cao |
| 2 | Upload PDF từ chat | Đính kèm PDF, gửi | File card hiển thị | 🔴 Cao |
| 3 | Preview ảnh | Click vào ảnh | Modal với watermark | 🔴 Cao |
| 4 | Preview PDF | Click vào PDF | PDF viewer mở | 🟠 TB |
| 5 | Mở File Explorer | Click "View All Files" | Modal hiển thị danh sách | 🟠 TB |
| 6 | Tìm kiếm file | Nhập tên vào ô search | Kết quả filter đúng | 🟠 TB |
| 7 | Filter theo loại | Chọn filter "PDF" | Chỉ hiện file PDF | 🟢 Thấp |
| 8 | Tạo thư mục | Click New Folder, nhập tên | Thư mục mới xuất hiện | 🟠 TB |
| 9 | Di chuyển file | Drag file vào folder | File nằm trong folder | 🟠 TB |
| 10 | Đổi tên folder | Right-click → Rename | Tên được đổi | 🟢 Thấp |
| 11 | Xóa folder có file | Thử xóa folder không trống | KHÔNG cho xóa, thông báo | 🟠 TB |
| 12 | Toggle view mode | Click Grid/List toggle | View thay đổi | 🟢 Thấp |
| 13 | File quá lớn | Upload file > 50MB | Hiển thị lỗi size | 🔴 Cao |
| 14 | File không hỗ trợ | Upload file .exe | Hiển thị lỗi loại file | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

### File Picker

| Chức năng | Implementation |
|-----------|----------------|
| Chọn file | Document Picker native |
| Chụp ảnh | Camera trực tiếp |
| Chọn ảnh | Gallery picker |

### Preview

| Loại | Implementation |
|------|----------------|
| Ảnh | Full screen modal với pinch to zoom |
| PDF | PDF viewer native (WebView hoặc library) |
| Khác | Download và mở bằng app native |

### Upload Progress

- Progress bar hoặc percentage
- Background upload support
- Retry khi fail

### Folder Navigation

- Breadcrumb hoặc header với back button
- Swipe to go back

---

**Xem tiếp:** [07-quan-ly-thanh-vien-nhom.md](./07-quan-ly-thanh-vien-nhom.md)
