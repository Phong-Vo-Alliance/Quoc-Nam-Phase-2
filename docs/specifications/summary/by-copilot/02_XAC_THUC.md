# 02. Xác Thực & Phân Quyền

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Hệ thống xác thực đảm bảo chỉ những người dùng có quyền mới có thể truy cập vào ứng dụng. Mỗi người dùng có vai trò (role) khác nhau, quyết định những chức năng họ có thể sử dụng.

---

## 🔐 Màn Hình Đăng Nhập

### Cách Truy Cập

| Thông tin            | Giá trị                                      |
| -------------------- | -------------------------------------------- |
| **URL**              | `/login`                                     |
| **Khi nào hiển thị** | Người dùng chưa đăng nhập hoặc token hết hạn |

### Giao Diện

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               QUỐC NAM PORTAL                   │
│                                                 │
│         ┌───────────────────────────┐           │
│         │  [LOGO]                   │           │
│         │                           │           │
│         │  Đăng Nhập Hệ Thống      │           │
│         │                           │           │
│         │  ┌─────────────────────┐ │           │
│         │  │ Username/Email      │ │           │
│         │  └─────────────────────┘ │           │
│         │                           │           │
│         │  ┌─────────────────────┐ │           │
│         │  │ Password      [👁️]  │ │           │
│         │  └─────────────────────┘ │           │
│         │                           │           │
│         │  ┌─────────────────────┐ │           │
│         │  │    ĐĂNG NHẬP        │ │           │
│         │  └─────────────────────┘ │           │
│         │                           │           │
│         │  Quên mật khẩu?          │           │
│         │                           │           │
│         └───────────────────────────┘           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Các Thành Phần Trên Form

| Thành phần               | Mô tả                               | Bắt buộc |
| ------------------------ | ----------------------------------- | -------- |
| **Ô Username/Email**     | Nhập tên đăng nhập hoặc email       | ✅ Có    |
| **Ô Password**           | Nhập mật khẩu                       | ✅ Có    |
| **Nút hiện/ẩn password** | Icon 👁️ để toggle hiển thị mật khẩu | Không    |
| **Nút "Đăng nhập"**      | Thực hiện đăng nhập                 | ✅ Có    |
| **Link "Quên mật khẩu"** | Khôi phục mật khẩu (nếu có)         | Không    |

---

## 🔄 Quy Trình Đăng Nhập

### Luồng Thành Công

```
Bước 1: Người dùng nhập username/email và password
         ↓
Bước 2: Click nút "Đăng nhập"
         ↓
Bước 3: Nút hiển thị loading, form bị disable
         ↓
Bước 4: Hệ thống gửi request đến server
         ↓
Bước 5: Server xác thực thông tin → ✅ Đúng
         ↓
Bước 6: Nhận token và thông tin user
         ↓
Bước 7: Lưu token vào bộ nhớ (localStorage/cookies)
         ↓
Bước 8: Chuyển hướng về trang chính "/"
         ↓
Bước 9: Hiển thị giao diện Portal
```

### Luồng Thất Bại

```
Bước 1: Người dùng nhập thông tin sai
         ↓
Bước 2: Click nút "Đăng nhập"
         ↓
Bước 3: Hệ thống gửi request đến server
         ↓
Bước 4: Server từ chối → ❌ Sai
         ↓
Bước 5: Hiển thị thông báo lỗi
         ↓
Bước 6: Form vẫn mở, cho phép nhập lại
```

---

## ⚠️ Thông Báo Lỗi

### Các Trường Hợp Lỗi

| Lỗi                   | Thông Báo                                                      | Nguyên Nhân                  |
| --------------------- | -------------------------------------------------------------- | ---------------------------- |
| **Sai thông tin**     | "Tên đăng nhập hoặc mật khẩu không đúng"                       | Username/password không khớp |
| **Tài khoản bị khóa** | "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên" | Đăng nhập sai quá nhiều lần  |
| **Lỗi kết nối**       | "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng" | Mất internet                 |
| **Trường rỗng**       | "Vui lòng nhập tên đăng nhập" / "Vui lòng nhập mật khẩu"       | Chưa điền đủ thông tin       |

### Vị Trí Hiển Thị Lỗi

| Thiết bị    | Vị trí                                                 |
| ----------- | ------------------------------------------------------ |
| **Desktop** | Thông báo bên dưới nút "Đăng nhập" hoặc toast góc phải |
| **Mobile**  | Thông báo bên dưới form hoặc toast ở top màn hình      |

---

## 🔒 Tự Động Đăng Nhập Lại

### Khi Người Dùng Quay Lại

```
Bước 1: Người dùng mở lại ứng dụng (hoặc refresh)
         ↓
Bước 2: Hệ thống kiểm tra token trong bộ nhớ
         ↓
Bước 3: Token còn hạn?
         ↓
    ✅ Có → Tự động vào trang chính (không cần đăng nhập lại)
    ❌ Không → Chuyển về trang đăng nhập
```

### Token Hết Hạn Khi Đang Sử Dụng

```
Bước 1: Người dùng đang thao tác
         ↓
Bước 2: Token hết hạn
         ↓
Bước 3: API trả về lỗi 401 (Unauthorized)
         ↓
Bước 4: Hệ thống thử refresh token
         ↓
    ✅ Refresh thành công → Tiếp tục sử dụng
    ❌ Refresh thất bại → Hiển thị thông báo "Phiên đăng nhập đã hết hạn"
                        → Chuyển về trang đăng nhập
```

---

## 🚪 Đăng Xuất

### Cách Thực Hiện

**Desktop:**

```
Sidebar trái → Avatar user → Click → Menu dropdown → "Đăng xuất"
```

**Mobile:**

```
Bottom Navigation → Tab "Cá nhân" → "Đăng xuất"
```

### Luồng Đăng Xuất

```
Bước 1: Click "Đăng xuất"
         ↓
Bước 2: Hiển thị dialog xác nhận: "Bạn có chắc muốn đăng xuất?"
         ↓
Bước 3: User xác nhận
         ↓
Bước 4: Xóa token khỏi bộ nhớ
         ↓
Bước 5: Ngắt kết nối SignalR
         ↓
Bước 6: Chuyển về trang đăng nhập
```

---

## 👥 Phân Quyền Theo Vai Trò

### Staff (Nhân viên)

**Đặc điểm:**

- Là vai trò cơ bản nhất
- Tham gia vào các hội thoại được phân công
- Nhận và thực hiện công việc

**Chi tiết quyền hạn:**

| Chức năng                        | Được phép |
| -------------------------------- | --------- |
| Xem hội thoại được phân công     | ✅        |
| Gửi tin nhắn, hình ảnh, file     | ✅        |
| Đánh dấu tin nhắn cá nhân (star) | ✅        |
| Nhận công việc được giao         | ✅        |
| Cập nhật tiến độ công việc       | ✅        |
| Upload và xem file               | ✅        |
| Ghim tin nhắn cho nhóm           | ❌        |
| Tạo công việc mới                | ❌        |
| Thêm/xóa thành viên              | ❌        |
| Xem dashboard team               | ❌        |

---

### Leader (Trưởng nhóm)

**Đặc điểm:**

- Quản lý nhóm/phòng ban
- Có tất cả quyền của Staff + thêm quyền quản lý

**Chi tiết quyền hạn (bao gồm tất cả của Staff +):**

| Chức năng                       | Được phép |
| ------------------------------- | --------- |
| Xem TẤT CẢ hội thoại trong nhóm | ✅        |
| Ghim tin nhắn cho cả nhóm       | ✅        |
| Tạo công việc từ tin nhắn       | ✅        |
| Phân công công việc             | ✅        |
| Duyệt công việc hoàn thành      | ✅        |
| Phân công lại công việc         | ✅        |
| Thêm/xóa thành viên             | ✅        |
| Chuyển hội thoại sang nhóm khác | ✅        |
| "Nhận thông tin" và chuyển giao | ✅        |
| Xem dashboard theo dõi team     | ✅        |

---

### Admin (Quản trị viên)

**Đặc điểm:**

- Toàn quyền trong hệ thống
- Quản lý cấu hình và người dùng

**Chi tiết quyền hạn:**

| Chức năng                 | Được phép |
| ------------------------- | --------- |
| Tất cả quyền của Leader   | ✅        |
| Quản lý người dùng        | ✅        |
| Cấu hình nhóm và danh mục | ✅        |
| Cấu hình hệ thống         | ✅        |

---

## ✅ Checklist Kiểm Thử

### Đăng Nhập

- [ ] **Form đăng nhập** - Hiển thị đúng các trường
- [ ] **Nhập đúng thông tin** - Đăng nhập thành công, vào được trang chính
- [ ] **Nhập sai username** - Hiển thị lỗi "Tên đăng nhập hoặc mật khẩu không đúng"
- [ ] **Nhập sai password** - Hiển thị lỗi "Tên đăng nhập hoặc mật khẩu không đúng"
- [ ] **Bỏ trống username** - Hiển thị lỗi validate
- [ ] **Bỏ trống password** - Hiển thị lỗi validate
- [ ] **Nút hiện/ẩn password** - Toggle đúng giữa ••••• và text
- [ ] **Loading state** - Nút có loading khi đang xử lý

### Tự Động Đăng Nhập

- [ ] **Refresh trang sau đăng nhập** - Vẫn ở trang chính, không cần đăng nhập lại
- [ ] **Đóng tab rồi mở lại** - Vẫn đăng nhập (nếu token còn hạn)
- [ ] **Token hết hạn** - Chuyển về trang đăng nhập

### Đăng Xuất

- [ ] **Click đăng xuất** - Hiển thị dialog xác nhận
- [ ] **Xác nhận đăng xuất** - Về trang login thành công
- [ ] **Sau khi logout** - Không vào được trang chính nếu chưa đăng nhập lại

### Phân Quyền

- [ ] **Staff** - KHÔNG thấy nút ghim tin nhắn
- [ ] **Staff** - KHÔNG thấy nút tạo công việc
- [ ] **Staff** - KHÔNG thấy menu "Theo dõi Team"
- [ ] **Leader** - Thấy nút ghim tin nhắn khi hover tin
- [ ] **Leader** - Thấy nút tạo công việc khi hover tin
- [ ] **Leader** - Thấy menu "Theo dõi Team" trong sidebar

---

## 📖 Xem Tiếp

→ [03_HOI_THOAI.md](./03_HOI_THOAI.md) - Chi tiết về danh sách hội thoại
