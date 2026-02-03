# 08. WorkType & Checklist

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

WorkType (Loại công việc) là cách phân loại các task theo nghiệp vụ. Mỗi WorkType có thể có các template checklist riêng, giúp đảm bảo quy trình làm việc chuẩn.

---

## Cách Truy Cập

| Nơi | Mô tả |
|-----|-------|
| Khi tạo Task | Dropdown chọn WorkType |
| Settings nhóm | WorkType Manager (Leader/Admin) |

---

## WorkType (Loại Công Việc)

### Khái Niệm

WorkType là phân loại công việc theo nghiệp vụ của doanh nghiệp.

### Ví Dụ WorkType

| WorkType | Mô tả |
|----------|-------|
| Nhận hàng | Công việc liên quan đến nhận hàng nhập kho |
| Đổi trả | Xử lý yêu cầu đổi trả hàng |
| Kiểm kê | Kiểm kê hàng tồn kho |
| Xử lý khiếu nại | Giải quyết khiếu nại của khách hàng |

### Thuộc Tính WorkType

| Thuộc tính | Mô tả |
|------------|-------|
| ID | Mã định danh duy nhất |
| Tên | Tên hiển thị (VD: "Nhận hàng") |
| Icon | Icon đại diện (📦) |
| Màu sắc | Màu badge/chip |

### Gắn WorkType Với Conversation

- Mỗi nhóm chat có danh sách WorkTypes cho phép
- Admin/Leader cấu hình WorkTypes cho từng nhóm
- Khi tạo task, chọn WorkType từ danh sách cho phép

---

## Checklist Template

### Khái Niệm

Checklist Template là danh sách các bước mẫu cho một loại công việc. Khi tạo task, checklist được copy từ template tương ứng.

### Cấu Trúc

Mỗi WorkType có thể có nhiều Checklist Variants (biến thể):

```
📦 WorkType: "Nhận hàng"
│
├── Variant "Kiểm đếm":
│   ☐ Đếm số lượng theo hóa đơn
│   ☐ Kiểm tra tình trạng bao bì
│   ☐ Ký xác nhận
│
└── Variant "Lưu trữ":
    ☐ Scan barcode
    ☐ Phân loại theo vùng
    ☐ Cập nhật vị trí kho
```

### Áp Dụng Template

Khi tạo task:

1. Chọn WorkType từ dropdown
2. Chọn Checklist Variant (nếu có nhiều)
3. Checklist được copy vào task
4. Có thể thêm/bớt item sau khi copy

---

## Quản Lý WorkType (Leader/Admin)

### Cách Truy Cập

- Dialog/Modal riêng để quản lý WorkType
- Truy cập từ Settings hoặc Group Settings

### Thao Tác

#### Thêm WorkType Mới

1. Mở WorkType Manager
2. Click "Thêm loại việc"
3. Nhập tên, chọn icon, màu
4. Lưu

#### Sửa WorkType

1. Click vào WorkType cần sửa
2. Chỉnh sửa thông tin
3. Lưu

#### Xóa WorkType

1. Click nút xóa
2. Confirm dialog xuất hiện
3. **Lưu ý:** Không xóa được nếu có task đang dùng

---

## Quản Lý Checklist Template

### Cách Truy Cập

- Panel hoặc Slide-over riêng
- Truy cập từ WorkType Manager

### Thao Tác

#### Xem Template

1. Chọn WorkType
2. Chọn Checklist Variant
3. Danh sách items hiển thị

#### Thêm Item Vào Template

1. Mở template editor
2. Nhập tên item vào ô input
3. Nhấn Enter hoặc nút thêm
4. Item xuất hiện trong danh sách

#### Sửa Item

1. Click vào item
2. Sửa nội dung
3. Lưu

#### Xóa Item

1. Click nút xóa bên cạnh item
2. Item bị xóa

#### Sắp Xếp Thứ Tự

1. Drag-drop item
2. Thứ tự mới được lưu

### Lưu Ý Quan Trọng

| Tình huống | Hành vi |
|------------|---------|
| Sửa template | Tasks đã tạo KHÔNG tự động cập nhật |
| Tasks mới | Sử dụng checklist mới |
| Option đặc biệt | "Apply to existing TODO tasks" (áp dụng cho tasks chưa bắt đầu) |

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

## Phân Quyền

| Vai trò | Quyền |
|---------|-------|
| Staff | Xem và sử dụng WorkType khi được giao task |
| Leader | Quản lý WorkType (thêm/sửa/xóa) |
| Admin | Quản lý WorkType (thêm/sửa/xóa) |

---

## [QC] Test Cases - WorkType & Checklist

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Tạo task với WorkType | Leader tạo task, chọn WorkType | Task có WorkType và checklist | 🔴 Cao |
| 2 | Chọn Checklist Variant | Chọn WorkType có nhiều variants | Dropdown variants xuất hiện | 🟠 TB |
| 3 | Checklist từ template | Tạo task với template có 5 items | Task có 5 items checklist | 🔴 Cao |
| 4 | Thêm item vào task | Thêm item mới vào checklist task | Item xuất hiện, progress cập nhật | 🟠 TB |
| 5 | Leader quản lý WorkType | Leader mở WorkType Manager | Có thể thêm/sửa/xóa WorkType | 🟠 TB |
| 6 | Staff quản lý WorkType | Staff thử mở WorkType Manager | KHÔNG có quyền hoặc không thấy | 🔴 Cao |
| 7 | Sửa template | Sửa template, tạo task mới | Task mới có checklist mới | 🟠 TB |
| 8 | Template không ảnh hưởng task cũ | Sửa template | Tasks đã tạo KHÔNG đổi | 🟠 TB |
| 9 | Xóa WorkType đang dùng | Thử xóa WorkType có task | KHÔNG cho xóa, thông báo | 🔴 Cao |

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

**Xem tiếp:** [09-bao-mat.md](./09-bao-mat.md)
