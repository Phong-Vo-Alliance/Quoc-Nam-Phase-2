# 02. Đăng Nhập & Xác Thực

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Tính năng xác thực cho phép người dùng đăng nhập vào hệ thống bằng tài khoản nội bộ. Sau khi đăng nhập thành công, người dùng được chuyển vào trang Portal để sử dụng các tính năng chat và quản lý task.

---

## Cách Truy Cập

- **URL:** Mở ứng dụng hoặc truy cập website
- **Điều kiện:** Chưa đăng nhập hoặc session hết hạn
- **Đường dẫn:** `/login`

---

## Màn Hình Đăng Nhập

### Giao Diện

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   [LOGO QUỐC NAM]                       │
│                                                         │
│                 Portal Internal Chat                    │
│                                                         │
│              ┌───────────────────────────┐              │
│              │ Username hoặc Email       │              │
│              └───────────────────────────┘              │
│                                                         │
│              ┌──────────────────────┬────┐              │
│              │ Mật khẩu             │ 👁 │              │
│              └──────────────────────┴────┘              │
│                                                         │
│              [       ĐĂNG NHẬP           ]              │
│                                                         │
│              ❌ Thông báo lỗi (nếu có)                  │
│                                                         │
│                   © 2026 Quốc Nam                       │
└─────────────────────────────────────────────────────────┘
```

### Các Thành Phần

| Thành phần | Mô tả | Hành vi |
|------------|-------|---------|
| Logo Quốc Nam | Hình logo công ty | Chỉ hiển thị, không tương tác |
| Tiêu đề | "Portal Internal Chat" | Text tĩnh |
| Ô Username | Input nhập username/email | Focusable, validate không trống |
| Ô Password | Input nhập mật khẩu | Có nút show/hide password (icon 👁) |
| Nút Đăng nhập | Button chính màu xanh | Submit form, disabled khi loading |
| Thông báo lỗi | Text màu đỏ | Hiển thị khi login thất bại |
| Footer | Bản quyền | Text tĩnh |

---

## Luồng Đăng Nhập Chi Tiết

### Luồng Chính

```
[Mở ứng dụng]
      │
      ▼
[Kiểm tra session]
      │
      ├── Có session hợp lệ ──────► [Chuyển thẳng vào Portal]
      │
      └── Không có session ──────► [Hiển thị form đăng nhập]
                                          │
                                          ▼
                                   [Nhập username + password]
                                          │
                                          ▼
                                   [Nhấn nút Đăng nhập]
                                          │
                                    ┌─────┴─────┐
                                    │           │
                                    ▼           ▼
                              [Thành công]  [Thất bại]
                                    │           │
                                    ▼           ▼
                              [Lưu token]  [Hiển thị lỗi]
                                    │           │
                                    ▼           ▼
                            [Vào Portal]  [Cho nhập lại]
```

### Bước Thực Hiện

**Bước 1:** Người dùng mở ứng dụng hoặc truy cập website

**Bước 2:** Hệ thống kiểm tra session
- Có session hợp lệ → Chuyển thẳng vào Portal
- Không có session → Hiển thị form đăng nhập

**Bước 3:** Người dùng nhập thông tin
- Nhập username hoặc email vào ô đầu tiên
- Nhập mật khẩu vào ô thứ hai

**Bước 4:** Nhấn nút Đăng nhập (hoặc Enter)

**Bước 5:** Hệ thống xác thực
- **Thành công:** Lưu token và chuyển đến Portal
- **Thất bại:** Hiển thị lỗi, người dùng nhập lại

---

## Quản Lý Session

### Lưu Trữ Thông Tin Đăng Nhập

Sau khi đăng nhập thành công, hệ thống lưu:
- **Token xác thực:** Dùng để gọi các API
- **Thông tin người dùng:** ID, tên, vai trò (Staff/Leader/Admin)
- **Thời gian hết hạn:** Expiry time của token

### Duy Trì Session

| Tình huống | Hành vi |
|------------|---------|
| Reload trang | Tự động đọc token đã lưu và đăng nhập lại nếu còn hạn |
| Token còn hạn | Tiếp tục sử dụng bình thường |
| Token hết hạn | Chuyển về trang đăng nhập |
| Token gần hết hạn | Tự động gia hạn trước khi hết |

### Tự Động Gia Hạn (Auto Refresh)

- Hệ thống tự động gia hạn token trước khi hết hạn
- Người dùng không bị đăng xuất đột ngột trong khi đang làm việc
- Quá trình này diễn ra trong nền, không ảnh hưởng trải nghiệm người dùng

---

## Luồng Đăng Xuất

### Cách Thực Hiện

**Bước 1:** Click vào avatar/tên người dùng ở góc trên bên phải

**Bước 2:** Chọn "Đăng xuất" từ menu dropdown

**Bước 3:** Hệ thống thực hiện:
- Xóa token và thông tin đăng nhập
- Xóa cache dữ liệu chat
- Ngắt kết nối real-time (SignalR)
- Chuyển về trang đăng nhập

**Lưu ý bảo mật:** Sau khi đăng xuất, tất cả dữ liệu local phải được xóa sạch.

---

## Các Trường Hợp Lỗi

### 1. Sai Mật Khẩu
- **Thông báo:** "Thông tin đăng nhập không chính xác"
- **Hành vi:** Người dùng có thể thử lại

### 2. Tài Khoản Không Tồn Tại
- **Thông báo:** "Thông tin đăng nhập không chính xác" (giống trên)
- **Lý do:** Không tiết lộ cụ thể là sai username hay password (bảo mật)

### 3. Lỗi Kết Nối
- **Thông báo:** "Không thể kết nối đến server"
- **Hành vi:** Có nút "Thử lại" để retry

### 4. Token Hết Hạn Trong Khi Làm Việc
- **Thông báo:** Popup tự động hiển thị "Phiên làm việc đã hết hạn"
- **Hành vi:** Chuyển về trang đăng nhập

### 5. Để Trống Ô Nhập
- **Username trống:** Hiển thị validation error hoặc nút disabled
- **Password trống:** Hiển thị validation error hoặc nút disabled

---

## Phân Quyền Sau Đăng Nhập

Sau khi đăng nhập, hệ thống xác định vai trò của người dùng:

| Vai trò | Mô tả | Điều hướng sau đăng nhập |
|---------|-------|--------------------------|
| Admin | Quản trị toàn hệ thống | Portal - Workspace |
| Leader | Trưởng nhóm | Portal - Workspace |
| Staff | Nhân viên | Portal - Workspace |

**Lưu ý:** Tất cả vai trò đều được chuyển đến cùng một trang Portal, nhưng giao diện sẽ ẩn/hiện các chức năng tương ứng với quyền của từng vai trò.

---

## [QC] Test Cases - Đăng Nhập

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Đăng nhập thành công | Nhập đúng username/password, nhấn Đăng nhập | Chuyển đến Portal | 🔴 Cao |
| 2 | Đăng nhập sai password | Nhập đúng username, sai password | Hiển thị lỗi xác thực | 🔴 Cao |
| 3 | Username không tồn tại | Nhập username không có trong hệ thống | Hiển thị lỗi xác thực | 🔴 Cao |
| 4 | Để trống username | Để trống username, nhấn Đăng nhập | Validation error hoặc button disabled | 🟠 TB |
| 5 | Để trống password | Để trống password, nhấn Đăng nhập | Validation error hoặc button disabled | 🟠 TB |
| 6 | Refresh sau đăng nhập | Đăng nhập thành công, refresh trang | Vẫn giữ trạng thái đăng nhập | 🔴 Cao |
| 7 | Đăng xuất | Click avatar → Logout | Clear session, về trang Login | 🔴 Cao |
| 8 | Truy cập Portal chưa login | Trực tiếp truy cập URL /portal | Redirect về trang Login | 🔴 Cao |
| 9 | Nhấn Enter để đăng nhập | Nhập xong, nhấn Enter (không click nút) | Submit form, xử lý đăng nhập | 🟢 Thấp |
| 10 | Show/hide password | Click icon 👁 bên cạnh ô password | Toggle hiển thị/ẩn password | 🟢 Thấp |

---

## [Mobile] Lưu Ý Implementation

### Lưu Trữ Token An Toàn
- **KHÔNG** lưu token trong AsyncStorage thông thường
- Sử dụng **SecureStore** (Expo) hoặc **Keychain** (iOS) / **Keystore** (Android)
- Token phải được mã hóa khi lưu

### Xử Lý Background/Foreground
| Tình huống | Hành vi cần implement |
|------------|----------------------|
| App từ background về foreground | Kiểm tra lại token |
| Token gần hết hạn | Tự động refresh |
| Token đã hết hạn | Chuyển về màn hình Login |

### Keyboard Handling
- Keyboard mở → Form slide lên để input visible
- Return key trên keyboard → Submit form
- Tap outside → Dismiss keyboard

### Biometric Authentication (Tương lai)
- Có thể thêm đăng nhập bằng vân tay/FaceID sau
- Tuân thủ Apple/Google guidelines

---

**Xem tiếp:** [03-danh-sach-hoi-thoai.md](./03-danh-sach-hoi-thoai.md)
