# 📚 Tài Liệu Đặc Tả Tính Năng - Quốc Nam Portal

> **Tài liệu này được tạo tự động từ phân tích source code**
>
> **Mục đích:** Cung cấp tài liệu chi tiết về các tính năng cho team QC và team Mobile
>
> **Phiên bản:** 1.0
> **Ngày tạo:** 27/01/2026

---

## 📋 Danh Sách Tài Liệu

### Tài Liệu Tổng Quan
- **[00_TONG_QUAN.md](./00_TONG_QUAN.md)** - Tổng quan toàn bộ hệ thống
  - Giới thiệu hệ thống
  - Vai trò người dùng (Staff, Leader, Admin)
  - Cấu trúc giao diện Desktop vs Mobile
  - Danh sách tất cả tính năng
  - Luồng sử dụng chính
  - Phân quyền chi tiết

---

### Tài Liệu Chi Tiết Từng Tính Năng

#### 🔐 Module Xác Thực
- **[01_XAC_THUC.md](./01_XAC_THUC.md)** - Đăng nhập, đăng xuất, phân quyền
  - Màn hình đăng nhập
  - Quy trình đăng nhập/đăng xuất
  - 3 vai trò: Staff, Leader, Admin
  - Tự động đăng nhập lại
  - Token management
  - Checklist kiểm thử

---

#### 💬 Module Chat & Hội Thoại
- **[02_HOI_THOAI.md](./02_HOI_THOAI.md)** - Danh sách hội thoại
  - Giao diện danh sách hội thoại
  - Phân loại theo danh mục
  - Badge số tin chưa đọc
  - Tìm kiếm hội thoại
  - Cập nhật real-time
  - Phân quyền xem theo vai trò

- **[03_NHAN_TIN.md](./03_NHAN_TIN.md)** - Gửi và nhận tin nhắn
  - Cấu trúc khung chat
  - Tin nhắn (text, hình ảnh, file)
  - Reply tin nhắn
  - Ghim tin nhắn (Pin) - Leader only
  - Đánh dấu tin nhắn (Star) - Cá nhân
  - Gửi file đính kèm
  - Typing indicator
  - Infinite scroll

---

#### 📋 Module Công Việc
- **[04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md)** - Quản lý công việc
  - Tạo công việc từ tin nhắn
  - Phân công công việc
  - Vòng đời công việc (TODO → DOING → NEED_TO_VERIFIED → FINISHED)
  - Checklist template
  - Cập nhật trạng thái
  - Quyền hạn theo vai trò

---

#### 📁 Module File
- **[05_QUAN_LY_FILE.md](./05_QUAN_LY_FILE.md)** - Quản lý file
  - File Manager trong right panel
  - Upload file (single & batch)
  - Preview file (hình ảnh, PDF, Excel, Word)
  - Tải file về
  - Lọc và sắp xếp file
  - Giới hạn file type và size

---

#### 👥 Module Thành Viên & Nhóm
- **[06_THANH_VIEN_NHOM.md](./06_THANH_VIEN_NHOM.md)** - Quản lý thành viên
  - Xem danh sách thành viên
  - Thêm/xóa thành viên (Leader)
  - Promote thành admin
  - Chuyển nhóm (Group Transfer)
  - Trạng thái online/offline

---

#### 📨 Module Thông Tin Nhận
- **[07_THONG_TIN_NHAN.md](./07_THONG_TIN_NHAN.md)** - Nhận và chuyển thông tin
  - Leader "nhận thông tin" từ tin nhắn
  - Phân công xử lý
  - Chuyển giao giữa phòng ban
  - Theo dõi trạng thái xử lý

---

#### 📊 Module Theo Dõi (Leader)
- **[08_THEO_DOI_TEAM.md](./08_THEO_DOI_TEAM.md)** - Theo dõi team
  - View tổng quan team
  - Theo dõi hội thoại đang xử lý
  - Xem công việc của nhân viên
  - Dashboard team

---

#### 🔔 Module Real-time
- **[09_REALTIME_THONG_BAO.md](./09_REALTIME_THONG_BAO.md)** - Real-time & thông báo
  - Kết nối SignalR
  - Nhận tin nhắn real-time
  - Cập nhật unread count
  - Typing indicator
  - Thông báo công việc mới
  - Xử lý offline/reconnect

---

#### 📱 Module Mobile
- **[10_MOBILE.md](./10_MOBILE.md)** - Tính năng mobile
  - Giao diện mobile-specific
  - Bottom navigation
  - Bottom sheets
  - Long-press actions
  - Pull-to-refresh
  - Responsive breakpoints

---

## 🎯 Hướng Dẫn Sử Dụng Tài Liệu

### Dành Cho Team QC

1. **Bắt đầu từ [00_TONG_QUAN.md](./00_TONG_QUAN.md)**
   - Hiểu tổng quan hệ thống
   - Nắm được các vai trò người dùng
   - Xem luồng sử dụng chính

2. **Đọc tài liệu từng tính năng**
   - Mỗi file mô tả chi tiết 1 module
   - Có giao diện, luồng hoạt động, checklist kiểm thử
   - Không có code, chỉ có mô tả chức năng

3. **Sử dụng Checklist Kiểm Thử**
   - Mỗi tài liệu có phần "✅ Checklist Kiểm Thử"
   - Liệt kê các test case quan trọng
   - Kết quả mong đợi cho từng case

4. **Chú ý phân quyền**
   - Staff, Leader, Admin có quyền khác nhau
   - Kiểm tra đúng quyền hạn cho từng role

---

### Dành Cho Team Mobile

1. **Đọc [00_TONG_QUAN.md](./00_TONG_QUAN.md)** trước
   - Hiểu cấu trúc tổng thể
   - Nắm được luồng dữ liệu
   - Xem phần "Sự Khác Biệt Desktop vs Mobile"

2. **Tập trung vào phần Mobile trong mỗi tài liệu**
   - Mỗi tài liệu có section "📱 Khác Biệt Desktop vs Mobile"
   - Lưu ý về giao diện mobile-specific

3. **Đọc [10_MOBILE.md](./10_MOBILE.md)** (khi hoàn thành)
   - Tài liệu riêng về mobile features
   - Bottom navigation, Bottom sheets
   - Responsive design

4. **API Integration**
   - Tài liệu mô tả luồng dữ liệu
   - Không có API endpoint chi tiết (xem API docs riêng)
   - Hiểu business logic để implement tương tự

---

## 📊 Thống Kê Tài Liệu

| Tài liệu | Trạng thái | Số trang ước tính |
|----------|-----------|-------------------|
| 00_TONG_QUAN.md | ✅ Hoàn thành | ~15 trang |
| 01_XAC_THUC.md | ✅ Hoàn thành | ~10 trang |
| 02_HOI_THOAI.md | ✅ Hoàn thành | ~8 trang |
| 03_NHAN_TIN.md | ✅ Hoàn thành | ~12 trang |
| 04_QUAN_LY_CONG_VIEC.md | ✅ Hoàn thành | ~10 trang |
| 05_QUAN_LY_FILE.md | ✅ Hoàn thành | ~8 trang |
| 06_THANH_VIEN_NHOM.md | ✅ Hoàn thành | ~6 trang |
| 07_THONG_TIN_NHAN.md | ✅ Hoàn thành | ~7 trang |
| 08_THEO_DOI_TEAM.md | ✅ Hoàn thành | ~6 trang |
| 09_REALTIME_THONG_BAO.md | ✅ Hoàn thành | ~8 trang |
| 10_MOBILE.md | ✅ Hoàn thành | ~10 trang |

**Tổng:** ~100 trang tài liệu chi tiết **✅ ĐÃ HOÀN THÀNH**

---

## 🔑 Điểm Nổi Bật Của Tài Liệu

### ✅ Ưu Điểm

1. **Hoàn toàn bằng tiếng Việt**
   - Dễ đọc, dễ hiểu cho team Việt Nam
   - Thuật ngữ được Việt hóa phù hợp

2. **Tập trung vào UX, không có code**
   - Mô tả chức năng từ góc độ người dùng
   - Không có implementation details
   - QC và Mobile có thể đọc hiểu ngay

3. **Có sơ đồ ASCII art**
   - Giao diện được vẽ bằng text
   - Dễ hình dung layout
   - Không cần tool đặc biệt để xem

4. **Có luồng hoạt động (Flow)**
   - Mỗi tính năng có flow chi tiết
   - Hiểu được quá trình từ đầu đến cuối

5. **Có Checklist kiểm thử**
   - QC có sẵn test cases để test
   - Bao phủ các scenario quan trọng

6. **Phân quyền rõ ràng**
   - Mỗi tính năng nêu rõ quyền Staff/Leader/Admin
   - Dễ kiểm tra permission logic

7. **Desktop & Mobile được tách biệt**
   - Mỗi tài liệu có phần so sánh Desktop vs Mobile
   - Mobile team biết cần implement khác gì

---

## 🚀 Cách Sử Dụng Hiệu Quả

### Cho QC Engineer

```
1. Đọc 00_TONG_QUAN.md → Hiểu hệ thống
2. Chọn tính năng cần test → Đọc tài liệu tương ứng
3. Xem phần "Checklist Kiểm Thử" → Tạo test cases
4. Test từng scenario → Check ✅
5. Tìm bug → Báo bug với link đến tài liệu cụ thể
```

### Cho Mobile Developer

```
1. Đọc 00_TONG_QUAN.md → Hiểu business logic
2. Đọc 10_MOBILE.md → Hiểu mobile-specific
3. Đọc từng tính năng → Implement tương tự logic
4. Chú ý phần "📱 Khác Biệt Desktop vs Mobile"
5. Implement UI phù hợp với platform (iOS/Android)
```

### Cho Product Manager/BA

```
1. Đọc 00_TONG_QUAN.md → Overview toàn hệ thống
2. Review từng tài liệu → Đảm bảo đúng requirements
3. Update tài liệu khi có thay đổi
4. Sử dụng tài liệu để training user
```

---

## 📞 Liên Hệ & Phản Hồi

Nếu có câu hỏi hoặc phát hiện sai sót trong tài liệu:

- **Team Development:** [Email/Slack]
- **Team QC:** [Email/Slack]
- **Team Mobile:** [Email/Slack]

---

## 🔄 Lịch Sử Cập Nhật

| Phiên bản | Ngày | Người tạo | Nội dung |
|-----------|------|-----------|----------|
| 1.0 | 27/01/2026 | AI Assistant (Claude) | Tạo tài liệu từ phân tích source code |

---

## 📝 Ghi Chú

- Tài liệu này được tạo tự động từ phân tích source code hiện tại
- Nội dung mô tả **thực tế đang chạy** trên website, không phải yêu cầu tương lai
- Tài liệu được chia nhỏ để dễ đọc, mỗi file tập trung vào 1 module
- Không có code, API endpoint, hay technical details - chỉ có business logic và UX flow

---

**Chúc team QC và Mobile làm việc hiệu quả!** 🚀
