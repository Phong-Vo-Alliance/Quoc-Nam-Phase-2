# Tài Liệu Mô Tả Tính Năng - Quốc Nam Internal Chat Portal

> **Phiên bản:** 3.0 | **Ngày tạo:** 27/01/2026  
> **Đối tượng:** Team QC và Team Mobile (React Native)

---

## Giới Thiệu

Đây là bộ tài liệu **thống nhất** mô tả chi tiết các tính năng của hệ thống **Quốc Nam Internal Chat Portal** - ứng dụng chat nội bộ doanh nghiệp với khả năng quản lý công việc và chia sẻ file bảo mật.

Tài liệu được biên soạn cho:
- **Team QC**: Để hiểu rõ luồng hoạt động và kiểm thử từng tính năng
- **Team Mobile**: Để nắm bắt các hành vi và implement tương tự trên React Native

---

## Mục Lục Tài Liệu

| # | Tài Liệu | Mô Tả Ngắn |
|---|----------|------------|
| 1 | [Tổng Quan Hệ Thống](./01-tong-quan-he-thong.md) | Kiến trúc tổng thể, vai trò người dùng, phân quyền |
| 2 | [Đăng Nhập & Xác Thực](./02-dang-nhap-xac-thuc.md) | Luồng đăng nhập/đăng xuất, quản lý session, lỗi |
| 3 | [Danh Sách Hội Thoại](./03-danh-sach-hoi-thoai.md) | Sidebar trái, phân loại, tìm kiếm, badge unread |
| 4 | [Nhắn Tin](./04-nhan-tin.md) | Gửi/nhận tin nhắn, reply, pin, star, typing indicator |
| 5 | [Quản Lý Task](./05-quan-ly-task.md) | Tạo task, status flow, checklist, phân quyền |
| 6 | [Quản Lý File](./06-quan-ly-file.md) | Upload, preview, thư mục, watermark |
| 7 | [Quản Lý Thành Viên & Nhóm](./07-quan-ly-thanh-vien-nhom.md) | Thêm/xóa thành viên, promote admin, chuyển nhóm |
| 8 | [WorkType & Checklist](./08-worktype-checklist.md) | Loại công việc, template checklist |
| 9 | [Bảo Mật](./09-bao-mat.md) | Chống copy, DevTools, watermark, session |
| 10 | [Theo Dõi Team (Leader)](./10-theo-doi-team.md) | Dashboard Leader, giám sát nhân viên |
| 11 | [Màn Hình Chi Tiết](./11-man-hinh-chi-tiet.md) | Mô tả UI từng màn hình |
| 12 | [Luồng Hoạt Động Tổng Thể](./12-luong-hoat-dong.md) | Flowchart liên kết giữa các tính năng |

---

## Hướng Dẫn Sử Dụng

### Dành Cho Team QC

1. **Bước 1:** Đọc [Tổng Quan Hệ Thống](./01-tong-quan-he-thong.md) để hiểu cấu trúc
2. **Bước 2:** Xem [Màn Hình Chi Tiết](./11-man-hinh-chi-tiet.md) để nắm các phần tử UI cần test
3. **Bước 3:** Tham khảo [Luồng Hoạt Động](./12-luong-hoat-dong.md) để test end-to-end
4. **Bước 4:** Đọc [Bảo Mật](./09-bao-mat.md) cho các test cases bảo mật

### Dành Cho Team Mobile (React Native)

1. **Bước 1:** Đọc [Tổng Quan Hệ Thống](./01-tong-quan-he-thong.md) để hiểu architecture
2. **Bước 2:** Nghiên cứu luồng [Đăng Nhập](./02-dang-nhap-xac-thuc.md) và [Nhắn Tin](./04-nhan-tin.md)
3. **Bước 3:** Xem [Quản Lý Task](./05-quan-ly-task.md) để hiểu status flow
4. **Bước 4:** Đọc [Quản Lý File](./06-quan-ly-file.md) về upload/preview behavior

---

## Cấu Trúc Hệ Thống

Hệ thống được chia thành các module chính:

```
┌─────────────────────────────────────────────────────┐
│                   XÁC THỰC                          │
│  (Đăng nhập, phân quyền, quản lý session)           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                    PORTAL                            │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │   CHAT &   │ │     TASK     │ │    FILE      │   │
│  │  MESSAGING │ │  MANAGEMENT  │ │  MANAGEMENT  │   │
│  └────────────┘ └──────────────┘ └──────────────┘   │
│                                                      │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  MEMBERS   │ │   WORKTYPE   │ │   SECURITY   │   │
│  │    MGMT    │ │  & CHECKLIST │ │              │   │
│  └────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Quy Ước Trong Tài Liệu

- **[QC]**: Phần dành riêng cho QC team để test
- **[Mobile]**: Lưu ý quan trọng cho Mobile team khi implement
- **Mức độ ưu tiên test:**
  - 🔴 **Cao** - Core feature, phải test kỹ
  - 🟠 **Trung bình** - Feature quan trọng
  - 🟢 **Thấp** - Nice-to-have feature

---

## Vai Trò Người Dùng

Hệ thống có 3 vai trò với quyền hạn khác nhau:

| Vai trò | Mô tả | Quyền hạn chính |
|---------|-------|-----------------|
| **Staff** | Nhân viên | Chat, xem/cập nhật task được giao |
| **Leader** | Trưởng nhóm | Tạo/giao task, duyệt task, ghim tin nhắn, quản lý thành viên |
| **Admin** | Quản trị viên | Toàn quyền trong hệ thống |

---

## Liên Hệ

Nếu có thắc mắc về tài liệu hoặc tính năng, vui lòng liên hệ Team Development.

---

**Kết thúc mục lục. Vui lòng chọn tài liệu cần đọc từ bảng trên.**
