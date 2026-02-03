# Tài Liệu Mô Tả Tính Năng - Quốc Nam Internal Chat Portal

> **Phiên bản:** 2.0 | **Cập nhật:** 27/01/2026  
> **Đối tượng:** Team QC và Team Mobile (React Native)

---

## Giới Thiệu

Đây là bộ tài liệu mô tả chi tiết các tính năng của hệ thống **Quốc Nam Internal Chat Portal** - ứng dụng chat nội bộ doanh nghiệp với khả năng quản lý công việc và chia sẻ file bảo mật.

Tài liệu này **không chứa mã nguồn hay thông số kỹ thuật**, mà tập trung vào:
- Mô tả luồng hoạt động (flow) của từng tính năng
- Mối quan hệ giữa các màn hình
- Hành vi (behavior) mà người dùng mong đợi
- Test cases cho QC team

---

## Mục Lục

| # | Tài Liệu | Mô Tả |
|---|----------|-------|
| 1 | [Tổng Quan Hệ Thống](./01-tong-quan.md) | Kiến trúc tổng thể, vai trò người dùng |
| 2 | [Đăng Nhập & Xác Thực](./02-dang-nhap.md) | Luồng đăng nhập, phân quyền, session |
| 3 | [Danh Sách Hội Thoại](./03-danh-sach-hoi-thoai.md) | Sidebar hội thoại, phân loại, tìm kiếm |
| 4 | [Nhắn Tin](./04-nhan-tin.md) | Gửi/nhận tin nhắn, reply, pin, star |
| 5 | [Quản Lý Task](./05-quan-ly-task.md) | Tạo task, status flow, checklist |
| 6 | [Quản Lý File](./06-quan-ly-file.md) | Upload, preview, thư mục file |
| 7 | [WorkType & Checklist](./07-worktype-checklist.md) | Loại công việc, template checklist |
| 8 | [Bảo Mật](./08-bao-mat.md) | Chống copy, DevTools, watermark |
| 9 | [Màn Hình Chi Tiết](./09-man-hinh-chi-tiet.md) | Mô tả từng màn hình UI |
| 10 | [Luồng Hoạt Động Tổng Thể](./10-luong-tong-the.md) | Flowchart liên kết giữa các tính năng |

---

## Hướng Dẫn Đọc Tài Liệu

### Dành Cho QC Team

1. **Bắt đầu:** Đọc [Tổng Quan](./01-tong-quan.md) để hiểu cấu trúc hệ thống
2. **Testing UI:** Xem [Màn Hình Chi Tiết](./09-man-hinh-chi-tiet.md) để biết các elements cần test
3. **Flow testing:** Tham khảo [Luồng Hoạt Động](./10-luong-tong-the.md) để test end-to-end
4. **Security testing:** Đọc [Bảo Mật](./08-bao-mat.md) cho test cases bảo mật

### Dành Cho Mobile Team

1. **Hiểu tổng quan:** Đọc [Tổng Quan](./01-tong-quan.md) để nắm architecture
2. **Core flows:** Nghiên cứu luồng [Đăng Nhập](./02-dang-nhap.md), [Nhắn Tin](./04-nhan-tin.md)
3. **Task management:** Xem [Quản Lý Task](./05-quan-ly-task.md) để hiểu status flow
4. **File handling:** Đọc [Quản Lý File](./06-quan-ly-file.md) cho upload/preview behavior

---

## Sơ Đồ Cấu Trúc Hệ Thống

Hệ thống gồm 3 phần chính:

**1. Xác Thực (Authentication)**
- Màn hình đăng nhập
- Quản lý session
- Phân quyền theo vai trò

**2. Chat & Messaging**
- Danh sách hội thoại (groups, DMs)
- Gửi/nhận tin nhắn real-time
- Pin, Star, Reply tin nhắn

**3. Task Management**
- Tạo task từ tin nhắn
- Workflow trạng thái task
- Checklist theo loại công việc

**4. File Management**
- Upload/preview file
- Tổ chức thư mục
- Watermark bảo mật

---

## Quy Ước Trong Tài Liệu

- **[QC]**: Phần dành riêng cho QC team test
- **[Mobile]**: Lưu ý cho Mobile team khi implement
- **Mức độ ưu tiên test:**
  - 🔴 Cao - Core feature, phải test kỹ
  - 🟠 Trung bình - Feature quan trọng
  - 🟢 Thấp - Nice-to-have feature

---

**Liên hệ:** Team Development nếu có thắc mắc về tài liệu này.
