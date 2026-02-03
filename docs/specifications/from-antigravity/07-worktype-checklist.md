# 07. WorkType & Checklist

## Mô Tả Tính Năng

WorkType (Loại công việc) là cách phân loại các task theo nghiệp vụ. Mỗi WorkType có thể có các template checklist riêng, giúp đảm bảo quy trình làm việc chuẩn.

---

## WorkType (Loại Công Việc)

### Khái Niệm
WorkType là phân loại công việc theo nghiệp vụ của doanh nghiệp. Ví dụ:
- Nhận hàng
- Đổi trả
- Kiểm kê
- Xử lý khiếu nại

### Thuộc Tính WorkType
- **ID:** Mã định danh duy nhất
- **Tên:** Tên hiển thị
- **Icon:** Icon đại diện
- **Màu sắc:** Màu badge/chip

### Gắn WorkType Với Conversation
- Mỗi nhóm chat (conversation) có danh sách WorkTypes cho phép
- Admin/Leader cấu hình WorkTypes cho từng nhóm
- Khi tạo task, chọn WorkType từ danh sách cho phép

---

## Checklist Template

### Khái Niệm
Checklist Template là danh sách các bước mẫu cho một loại công việc. Khi tạo task, checklist được copy từ template tương ứng.

### Cấu Trúc
Mỗi WorkType có thể có nhiều Checklist Variants (biến thể):

**Ví dụ WorkType "Nhận hàng":**
- Variant "Kiểm đếm": 
  - [ ] Đếm số lượng theo hóa đơn
  - [ ] Kiểm tra tình trạng bao bì
  - [ ] Ký xác nhận
- Variant "Lưu trữ":
  - [ ] Scan barcode
  - [ ] Phân loại theo vùng
  - [ ] Cập nhật vị trí kho

### Áp Dụng Template
Khi tạo task:
1. Chọn WorkType
2. Chọn Checklist Variant (nếu có nhiều)
3. Checklist được copy vào task
4. Có thể thêm/bớt item sau khi copy

---

## Quản Lý WorkType

### Vị Trí
- Dialog/Modal riêng để quản lý WorkType
- Truy cập từ Settings hoặc Group Settings

### Quyền Hạn
- Chỉ Admin/Leader mới quản lý được
- Staff chỉ xem và sử dụng

### Thao Tác

**Thêm WorkType mới:**
1. Mở WorkType Manager
2. Click "Thêm loại việc"
3. Nhập tên, chọn icon, màu
4. Lưu

**Sửa WorkType:**
1. Click vào WorkType cần sửa
2. Chỉnh sửa thông tin
3. Lưu

**Xóa WorkType:**
1. Click nút xóa
2. Confirm dialog
3. Lưu ý: Không xóa được nếu có task đang dùng

---

## Quản Lý Checklist Template

### Vị Trí
- Panel hoặc Slide-over riêng
- Truy cập từ WorkType Manager

### Thao Tác

**Xem template:**
1. Chọn WorkType
2. Chọn Checklist Variant
3. Danh sách items hiển thị

**Thêm item vào template:**
1. Mở template editor
2. Nhập tên item vào ô input
3. Nhấn Enter hoặc nút thêm
4. Item xuất hiện trong danh sách

**Sửa item:**
1. Click vào item
2. Sửa nội dung
3. Lưu

**Xóa item:**
1. Click nút xóa bên cạnh item
2. Item bị xóa

**Sắp xếp thứ tự:**
1. Drag-drop item
2. Thứ tự mới được lưu

### Áp Dụng Template Mới Cho Tasks Có Sẵn
- Khi template thay đổi, tasks đã tạo KHÔNG tự động cập nhật
- Chỉ tasks mới tạo sau mới có checklist mới
- Có option "Apply to existing TODO tasks" (áp dụng cho tasks chưa bắt đầu)

---

## Default WorkType

### Cho Conversation
- Mỗi conversation có thể set default WorkType
- Khi tạo task mới, default được pre-select
- User vẫn có thể chọn khác

### Cho User
- User có thể có preference riêng
- Nhớ lựa chọn cuối cùng của user trong nhóm

---

## [QC] Test Cases - WorkType & Checklist

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Tạo task với WorkType | Leader tạo task, chọn WorkType | Task có WorkType và checklist | 🔴 Cao |
| 2 | Chọn Checklist Variant | Chọn WorkType có nhiều variants | Dropdown variants xuất hiện | 🟠 TB |
| 3 | Checklist từ template | Tạo task với template có 5 items | Task có 5 items checklist | 🔴 Cao |
| 4 | Thêm item vào task | Thêm item mới vào checklist task | Item xuất hiện, progress cập nhật | 🟠 TB |
| 5 | Quản lý WorkType (Leader) | Leader mở WorkType Manager | Có thể thêm/sửa/xóa WorkType | 🟠 TB |
| 6 | Quản lý WorkType (Staff) | Staff thử mở WorkType Manager | Không có quyền hoặc không thấy | 🔴 Cao |
| 7 | Sửa template | Sửa template, tạo task mới | Task mới có checklist mới | 🟠 TB |
| 8 | Template không ảnh hưởng task cũ | Sửa template | Tasks đã tạo không đổi | 🟠 TB |
| 9 | Xóa WorkType đang dùng | Thử xóa WorkType có task | Không cho xóa, thông báo | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

### WorkType Selection
- Dropdown hoặc Bottom Sheet với icons
- Có thể search/filter

### Checklist Template
- Full screen editor
- Drag to reorder với haptic feedback

### Variant Selection
- Tab bar hoặc Segmented Control
- Clear UX cho user chọn đúng variant

---

**Xem tiếp:** [08-bao-mat.md](./08-bao-mat.md)
