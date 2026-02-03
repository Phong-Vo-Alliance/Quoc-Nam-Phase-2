# 📚 Tài Liệu Đặc Tả Chức Năng - Quốc Nam Portal

> **Phiên bản:** 1.0  
> **Ngày tạo:** 27/01/2026  
> **Đối tượng:** Team QC (Quality Control)  
> **Mục đích:** Hướng dẫn chi tiết các chức năng của hệ thống để hỗ trợ kiểm thử

---

## 📋 Mục Lục Tổng Hợp

### Phần 1: Tổng Quan Hệ Thống

| Tài liệu         | Mô tả                                                       | Link                       |
| ---------------- | ----------------------------------------------------------- | -------------------------- |
| **01_TONG_QUAN** | Giới thiệu hệ thống, vai trò người dùng, cấu trúc giao diện | [Xem →](./01_TONG_QUAN.md) |

### Phần 2: Xác Thực & Phân Quyền

| Tài liệu        | Mô tả                                         | Link                      |
| --------------- | --------------------------------------------- | ------------------------- |
| **02_XAC_THUC** | Đăng nhập, đăng xuất, phân quyền theo vai trò | [Xem →](./02_XAC_THUC.md) |

### Phần 3: Hội Thoại & Nhắn Tin

| Tài liệu         | Mô tả                                    | Link                       |
| ---------------- | ---------------------------------------- | -------------------------- |
| **03_HOI_THOAI** | Danh sách hội thoại, phân loại, tìm kiếm | [Xem →](./03_HOI_THOAI.md) |
| **04_NHAN_TIN**  | Gửi/nhận tin nhắn, reply, ghim, đánh dấu | [Xem →](./04_NHAN_TIN.md)  |

### Phần 4: Quản Lý Công Việc

| Tài liệu              | Mô tả                                           | Link                            |
| --------------------- | ----------------------------------------------- | ------------------------------- |
| **05_CONG_VIEC**      | Tạo task, checklist, cập nhật trạng thái, duyệt | [Xem →](./05_CONG_VIEC.md)      |
| **06_THONG_TIN_NHAN** | Tính năng "Nhận thông tin" cho Leader           | [Xem →](./06_THONG_TIN_NHAN.md) |

### Phần 5: Quản Lý Nội Dung

| Tài liệu            | Mô tả                                 | Link                          |
| ------------------- | ------------------------------------- | ----------------------------- |
| **07_QUAN_LY_FILE** | Upload, xem, tải file, lọc và sắp xếp | [Xem →](./07_QUAN_LY_FILE.md) |
| **08_THANH_VIEN**   | Quản lý thành viên nhóm, chuyển nhóm  | [Xem →](./08_THANH_VIEN.md)   |

### Phần 6: Tính Năng Nâng Cao

| Tài liệu             | Mô tả                              | Link                           |
| -------------------- | ---------------------------------- | ------------------------------ |
| **09_THEO_DOI_TEAM** | Dashboard theo dõi team cho Leader | [Xem →](./09_THEO_DOI_TEAM.md) |
| **10_REALTIME**      | Cập nhật real-time, thông báo      | [Xem →](./10_REALTIME.md)      |
| **11_MOBILE**        | Tính năng và giao diện mobile      | [Xem →](./11_MOBILE.md)        |

---

## 🎯 Hướng Dẫn Sử Dụng Tài Liệu Cho QC

### Cách Đọc Tài Liệu

1. **Đọc Tổng Quan trước:** Bắt đầu từ [01_TONG_QUAN.md](./01_TONG_QUAN.md) để hiểu về hệ thống
2. **Đọc theo vai trò:** Tập trung vào các chức năng liên quan đến vai trò đang test (Staff/Leader/Admin)
3. **Đọc theo luồng:** Theo dõi luồng hoạt động từ đăng nhập → sử dụng chức năng → đăng xuất

### Ký Hiệu Trong Tài Liệu

| Ký hiệu | Ý nghĩa                               |
| ------- | ------------------------------------- |
| ✅      | Được phép / Có thể thực hiện          |
| ❌      | Không được phép / Không thể thực hiện |
| 🔴      | Độ ưu tiên cao / Quan trọng           |
| 🟡      | Độ ưu tiên trung bình                 |
| 🟢      | Độ ưu tiên thấp                       |
| 📍      | Vị trí / Nơi truy cập                 |
| ⚠️      | Lưu ý quan trọng                      |
| 💡      | Mẹo / Gợi ý                           |

### Checklist Kiểm Thử

Mỗi tài liệu đều có phần **"Checklist Kiểm Thử"** ở cuối, liệt kê các test case cần thực hiện. QC nên:

- ☑️ Đánh dấu các case đã test
- 📝 Ghi chú bug/issue phát hiện được
- 🔄 Re-test sau khi dev fix

---

## 👥 Vai Trò Người Dùng - Tóm Tắt Nhanh

### Staff (Nhân viên)

- Tham gia hội thoại được phân công
- Gửi tin nhắn, file
- Nhận và thực hiện công việc
- **Không thể:** Ghim tin, tạo task, thêm/xóa thành viên

### Leader (Trưởng nhóm)

- Tất cả quyền của Staff +
- Ghim tin nhắn cho cả nhóm
- Tạo và phân công công việc
- Duyệt công việc hoàn thành
- Thêm/xóa thành viên
- Chuyển hội thoại sang nhóm khác
- Xem dashboard theo dõi team

### Admin (Quản trị viên)

- Toàn quyền hệ thống
- Cấu hình nhóm, danh mục
- Quản lý người dùng

---

## 🔗 Liên Kết Nhanh

- **Đăng nhập:** [02_XAC_THUC.md](./02_XAC_THUC.md#đăng-nhập)
- **Gửi tin nhắn:** [04_NHAN_TIN.md](./04_NHAN_TIN.md#gửi-tin-nhắn)
- **Tạo công việc:** [05_CONG_VIEC.md](./05_CONG_VIEC.md#tạo-công-việc)
- **Upload file:** [07_QUAN_LY_FILE.md](./07_QUAN_LY_FILE.md#upload-file)
- **Xem thông báo:** [10_REALTIME.md](./10_REALTIME.md#thông-báo)

---

**Liên hệ:** Nếu có thắc mắc về tài liệu, vui lòng liên hệ team Dev/BA.
