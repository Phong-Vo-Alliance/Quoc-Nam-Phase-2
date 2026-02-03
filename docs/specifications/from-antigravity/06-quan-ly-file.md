# 06. Quản Lý File

## Mô Tả Tính Năng

Tính năng quản lý file cho phép upload, preview và tổ chức file theo thư mục. File được chia sẻ trong nhóm chat và được bảo vệ bằng watermark cùng các biện pháp chống sao chép.

---

## Các Loại File Hỗ Trợ

### Hình ảnh
- JPG, PNG, GIF, WEBP
- Hiển thị thumbnail preview
- Click để xem full với zoom

### PDF
- Hiển thị icon PDF
- Preview trong browser
- Có watermark khi xem

### Excel
- File .xlsx, .xls
- Preview dạng bảng đơn giản
- Download để xem đầy đủ

### Word
- File .docx, .doc
- Preview dạng text
- Download để xem đầy đủ

### Khác
- Các file khác hiển thị icon generic
- Chỉ support download, không preview

---

## Vị Trí Trong Giao Diện

### Trong Panel Phải (Information Panel)
- Tab "Files" hiển thị danh sách file của conversation
- Tab "Media" hiển thị ảnh và video
- Quick actions: View all, Download

### File Explorer Modal
- Mở khi click "View All Files"
- Giao diện full-screen hoặc large modal
- Quản lý thư mục và file đầy đủ

---

## Cấu Trúc File Explorer

### Toolbar
- Ô tìm kiếm file
- Filter theo loại file (All, Images, PDF, Word, Excel)
- Sort theo (Ngày, Tên, Kích thước)
- Toggle View Mode (Grid / List)

### Breadcrumb Navigation
- Hiển thị đường dẫn thư mục hiện tại
- Click để navigate về thư mục cha

### File/Folder Grid
- Thư mục hiển thị icon folder
- File hiển thị thumbnail hoặc icon loại file
- Tên file bên dưới
- Kích thước và ngày upload

### File/Folder List
- Mỗi dòng là một item
- Cột: Tên, Loại, Kích thước, Ngày upload
- Sortable theo từng cột

---

## Tổ Chức Thư Mục

### Cấu Trúc 2 Cấp
- **Cấp 1 (Level 0):** Thư mục gốc theo loại công việc
- **Cấp 2 (Level 1):** Thư mục con chi tiết

Ví dụ:
- Nhận hàng/ (Level 0)
  - Kiểm đếm/ (Level 1)
  - Biên bản/ (Level 1)
- Đổi trả/ (Level 0)
  - Hóa đơn/ (Level 1)

### Thuộc Tính Thư Mục (Folder Attributes)
- Mỗi thư mục có các thuộc tính custom
- Ví dụ: Mã đơn hàng, Ngày nhận, Số lượng
- Leader có thể cấu hình template thuộc tính
- Thuộc tính giúp tìm kiếm và phân loại

---

## Upload File

### Từ Chat Input

**Bước 1:** Click nút đính kèm trong ô input

**Bước 2:** Chọn file từ máy tính

**Bước 3:** File được validate
- Kiểm tra loại file cho phép
- Kiểm tra kích thước (max 50MB)
- Hiển thị lỗi nếu không hợp lệ

**Bước 4:** Thêm caption (tùy chọn)

**Bước 5:** Nhấn Gửi

**Bước 6:** Hiển thị progress upload

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

**Khi click vào ảnh:**
- Modal full-screen mở ra
- Ảnh hiển thị với watermark (username + timestamp)
- Toolbar: Zoom in/out, Rotate, Previous/Next
- Click outside hoặc nút X để đóng

**Trong gallery:**
- Navigate qua lại giữa các ảnh
- Thumbnail strip ở dưới

### Preview PDF

**Khi click vào PDF:**
- Modal mở với PDF viewer
- Scroll để xem các trang
- Có watermark overlay
- Nút download (nếu cho phép)

### Preview Excel

**Khi click vào Excel:**
- Modal hiển thị dạng bảng
- Chỉ preview sheet đầu tiên
- Scroll ngang/dọc để xem
- Nút download để mở đầy đủ

### Preview Word

**Khi click vào Word:**
- Modal hiển thị nội dung text
- Format cơ bản được giữ
- Nút download để mở đầy đủ

---

## Thao Tác Với Folder

### Tạo Thư Mục Mới
- Click nút "New Folder"
- Nhập tên thư mục
- (Tùy chọn) Chọn loại thuộc tính
- Nhấn tạo

### Đổi Tên Thư Mục
- Right-click → Rename
- Nhập tên mới
- Nhấn Save

### Xóa Thư Mục
- Right-click → Delete
- Confirm dialog
- Thư mục phải trống mới xóa được

### Cập Nhật Thuộc Tính
- Click icon edit trên thư mục
- Popover hiển thị form thuộc tính
- Nhập/sửa giá trị
- Nhấn Save

---

## Thao Tác Với File

### Di Chuyển File
- Drag file vào thư mục khác
- Hoặc right-click → Move to
- Chọn thư mục đích

### Download File
- Click nút download
- File tải về máy

### Xóa File
- Right-click → Delete
- Confirm dialog
- File bị xóa (soft delete)

---

## Tự Động Sync

Khi upload file qua chat:
- File tự động xuất hiện trong File Explorer
- Đặt vào thư mục "Unsorted" hoặc theo WorkType
- Có thể di chuyển vào thư mục phù hợp sau

Khi upload file qua File Explorer:
- File có thể được link đến conversation
- Tùy chọn gửi notification

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
| 11 | Xóa folder có file | Thử xóa folder không trống | Không cho xóa, thông báo | 🟠 TB |
| 12 | Toggle view mode | Click Grid/List toggle | View thay đổi | 🟢 Thấp |
| 13 | File quá lớn | Upload file > 50MB | Hiển thị lỗi size | 🔴 Cao |
| 14 | File không hỗ trợ | Upload file .exe | Hiển thị lỗi loại file | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

### File Picker
- Sử dụng Document Picker native
- Hỗ trợ camera để chụp ảnh trực tiếp
- Gallery picker cho ảnh

### Preview
- Full screen modal
- Pinch to zoom cho ảnh
- PDF viewer native (WebView hoặc library)

### Upload Progress
- Progress bar hoặc percentage
- Background upload support
- Retry khi fail

### Folder Navigation
- Breadcrumb hoặc header với back button
- Swipe to go back

---

**Xem tiếp:** [07-worktype-checklist.md](./07-worktype-checklist.md)
