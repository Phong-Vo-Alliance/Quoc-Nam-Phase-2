# 02. Đăng Nhập & Xác Thực

## Mô Tả Tính Năng

Tính năng xác thực cho phép người dùng đăng nhập vào hệ thống bằng tài khoản nội bộ. Sau khi đăng nhập thành công, người dùng được chuyển vào trang Portal để sử dụng các tính năng chat và quản lý task.

---

## Màn Hình Đăng Nhập

### Giao Diện

Màn hình đăng nhập gồm các thành phần:

- **Logo Quốc Nam** ở trên cùng, căn giữa màn hình
- **Khung đăng nhập** chứa:
  - Tiêu đề "Portal Internal Chat"
  - Ô nhập username hoặc email
  - Ô nhập mật khẩu (có ẩn/hiện password)
  - Nút "Đăng nhập"
  - Thông báo lỗi (nếu có)
- **Footer** hiển thị bản quyền

### Hành Vi

**Khi trang load:**
- Nếu đã đăng nhập trước đó (còn session hợp lệ), tự động chuyển đến Portal
- Nếu chưa đăng nhập, hiển thị form đăng nhập

**Khi nhấn nút Đăng nhập:**
- Kiểm tra các ô nhập không được để trống
- Gửi thông tin xác thực đến server
- Nếu thành công: Chuyển đến trang Portal
- Nếu thất bại: Hiển thị thông báo lỗi phía dưới nút đăng nhập

---

## Luồng Đăng Nhập

**Bước 1:** Người dùng mở ứng dụng/truy cập website

**Bước 2:** Hệ thống kiểm tra session
- Có session hợp lệ → Chuyển thẳng vào Portal
- Không có session → Hiển thị form đăng nhập

**Bước 3:** Người dùng nhập thông tin
- Nhập username hoặc email vào ô đầu tiên
- Nhập mật khẩu vào ô thứ hai

**Bước 4:** Nhấn nút Đăng nhập

**Bước 5:** Hệ thống xác thực
- Thành công: Lưu token và chuyển đến Portal
- Thất bại: Hiển thị lỗi, người dùng nhập lại

---

## Quản Lý Session

### Lưu Trữ Thông Tin Đăng Nhập
Sau khi đăng nhập thành công, hệ thống lưu:
- Token xác thực (dùng để gọi các API)
- Thông tin người dùng (ID, tên, vai trò)
- Thời gian hết hạn của token

### Duy Trì Session
- Khi reload trang, hệ thống tự động đọc token đã lưu
- Nếu token còn hạn, tự động đăng nhập lại
- Nếu token hết hạn, chuyển về trang đăng nhập

### Tự Động Gia Hạn
- Hệ thống tự động gia hạn token trước khi hết hạn
- Người dùng không bị đăng xuất đột ngột trong khi đang làm việc

---

## Luồng Đăng Xuất

**Bước 1:** Người dùng click vào avatar/tên ở góc trên

**Bước 2:** Chọn "Đăng xuất" từ menu dropdown

**Bước 3:** Hệ thống thực hiện:
- Xóa token và thông tin đăng nhập
- Xóa cache dữ liệu chat
- Chuyển về trang đăng nhập

**Lưu ý:** Sau khi đăng xuất, tất cả dữ liệu local phải được xóa sạch để bảo mật.

---

## Các Trường Hợp Lỗi

### Sai Mật Khẩu
- Hiển thị thông báo "Thông tin đăng nhập không chính xác"
- Người dùng có thể thử lại

### Tài Khoản Không Tồn Tại
- Hiển thị thông báo tương tự "Thông tin đăng nhập không chính xác"
- Không tiết lộ cụ thể là sai username hay password (bảo mật)

### Lỗi Kết Nối
- Hiển thị thông báo "Không thể kết nối đến server"
- Có nút "Thử lại" để người dùng retry

### Token Hết Hạn Trong Khi Làm Việc
- Tự động hiển thị popup thông báo
- Chuyển về trang đăng nhập
- Có thể hiển thị lý do (session expired)

---

## Phân Quyền Sau Đăng Nhập

Sau khi đăng nhập, hệ thống xác định vai trò của người dùng:

| Vai trò | Đặc điểm | Điều hướng sau đăng nhập |
|---------|----------|--------------------------|
| Admin | Quản trị toàn hệ thống | Portal - Workspace |
| Leader | Trưởng nhóm | Portal - Workspace |
| Staff | Nhân viên | Portal - Workspace |

Tất cả vai trò đều được chuyển đến cùng một trang, nhưng giao diện sẽ ẩn/hiện các chức năng tương ứng với quyền của từng vai trò.

---

## [QC] Test Cases - Đăng Nhập

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Đăng nhập thành công | Nhập đúng username/password, nhấn Đăng nhập | Chuyển đến Portal/Workspace | 🔴 Cao |
| 2 | Đăng nhập sai password | Nhập đúng username, sai password | Hiển thị lỗi xác thực | 🔴 Cao |
| 3 | Đăng nhập username không tồn tại | Nhập username không có trong hệ thống | Hiển thị lỗi xác thực | 🔴 Cao |
| 4 | Để trống ô username | Để trống username, nhấn Đăng nhập | Hiển thị validation error hoặc button disabled | 🟠 TB |
| 5 | Để trống ô password | Để trống password, nhấn Đăng nhập | Hiển thị validation error hoặc button disabled | 🟠 TB |
| 6 | Refresh sau đăng nhập | Đăng nhập thành công, sau đó refresh trang | Vẫn giữ trạng thái đăng nhập | 🔴 Cao |
| 7 | Đăng xuất | Click avatar → Logout | Clear session, về trang Login | 🔴 Cao |
| 8 | Truy cập Portal khi chưa đăng nhập | Trực tiếp truy cập URL /portal | Redirect về trang Login | 🔴 Cao |
| 9 | Nhấn Enter để đăng nhập | Nhập xong, nhấn Enter (không click nút) | Submit form, xử lý đăng nhập | 🟢 Thấp |

---

## [Mobile] Lưu Ý Implementation

### Lưu Trữ Token An Toàn
- Không lưu token trong AsyncStorage thông thường
- Sử dụng SecureStore (Expo) hoặc Keychain (iOS) / Keystore (Android)
- Token phải được mã hóa khi lưu

### Xử Lý Background/Foreground
- Khi app từ background về foreground, kiểm tra lại token
- Nếu token gần hết hạn, tự động refresh
- Nếu token đã hết hạn, chuyển về màn hình Login

### Biometric Authentication (Tương lai)
- Có thể thêm đăng nhập bằng vân tay/FaceID sau
- Lưu ý tuân thủ Apple/Google guidelines

---

**Xem tiếp:** [03-danh-sach-hoi-thoai.md](./03-danh-sach-hoi-thoai.md)
