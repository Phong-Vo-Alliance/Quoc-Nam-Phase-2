# 01. Xác Thực & Phân Quyền

> **Mục đích:** Mô tả quy trình đăng nhập, đăng xuất và phân quyền người dùng

---

## 📌 Tổng Quan

Hệ thống xác thực đảm bảo chỉ những người dùng có quyền mới có thể truy cập vào ứng dụng. Mỗi người dùng có vai trò (role) khác nhau, quyết định những chức năng họ có thể sử dụng.

---

## 🔐 Màn Hình Đăng Nhập

### Vị Trí

- **URL:** `/login`
- **Hiển thị:** Khi người dùng chưa đăng nhập hoặc token hết hạn

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

### Các Thành Phần

| Thành phần               | Mô tả                         | Bắt buộc |
| ------------------------ | ----------------------------- | -------- |
| **Ô Username/Email**     | Nhập tên đăng nhập hoặc email | ✅       |
| **Ô Password**           | Nhập mật khẩu                 | ✅       |
| **Nút hiện/ẩn password** | Toggle hiển thị mật khẩu (👁️) | -        |
| **Nút "Đăng nhập"**      | Thực hiện đăng nhập           | ✅       |
| **Link "Quên mật khẩu"** | Khôi phục mật khẩu            | -        |

---

## 🔄 Quy Trình Đăng Nhập

### Luồng Thành Công

```
[Người dùng nhập thông tin]
         ↓
[Click "Đăng nhập"]
         ↓
[Nút loading, disable form]
         ↓
[Gửi yêu cầu đến server]
         ↓
[Server xác thực thông tin]
         ↓
     ✅ Đúng
         ↓
[Nhận token và thông tin user]
         ↓
[Lưu token vào bộ nhớ]
         ↓
[Chuyển hướng về trang chính "/"]
         ↓
[Hiển thị giao diện chính]
```

### Luồng Thất Bại

```
[Người dùng nhập thông tin sai]
         ↓

[Click "Đăng nhập"]
         ↓
[Gửi yêu cầu đến server]
         ↓
[Server từ chối]
         ↓
     ❌ Sai
         ↓
[Hiển thị thông báo lỗi]
         ↓
[Form vẫn mở, cho phép nhập lại]
```

---

## ⚠️ Thông Báo Lỗi

### Các Trường Hợp Lỗi

| Lỗi                   | Thông Báo                                                      | Nguyên Nhân                  |
| --------------------- | -------------------------------------------------------------- | ---------------------------- |
| **Sai thông tin**     | "Tên đăng nhập hoặc mật khẩu không đúng"                       | Username/password không khớp |
| **Tài khoản bị khóa** | "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên" | Đăng nhập sai quá nhiều lần  |
| **Lỗi kết nối**       | "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng" | Mất kết nối internet         |
| **Trường rỗng**       | "Vui lòng nhập tên đăng nhập" / "Vui lòng nhập mật khẩu"       | Chưa điền đủ thông tin       |

### Vị Trí Hiển Thị

- **Desktop:** Thông báo hiển thị bên dưới nút "Đăng nhập" hoặc toast ở góc phải màn hình
- **Mobile:** Thông báo hiển thị bên dưới form hoặc toast ở top màn hình

---

## 👥 Vai Trò Người Dùng

Sau khi đăng nhập thành công, hệ thống xác định vai trò của người dùng:

### 1. Staff (Nhân Viên)

**Đặc điểm:**

- Là vai trò cơ bản nhất
- Tham gia vào các hội thoại được phân công
- Nhận và thực hiện công việc

**Quyền hạn:**

- ✅ Xem hội thoại được phân công
- ✅ Gửi tin nhắn, hình ảnh, file
- ✅ Đánh dấu tin nhắn cá nhân (star)
- ✅ Nhận công việc được giao
- ✅ Cập nhật tiến độ công việc
- ✅ Upload và xem file
- ❌ KHÔNG thể ghim tin nhắn
- ❌ KHÔNG thể tạo công việc
- ❌ KHÔNG thể thêm/xóa thành viên

**Giao diện:**

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR     │    CHAT AREA    │  INFO PANEL   │
│              │                 │                │
│  - Hội thoại │  - Tin nhắn     │  - Thông tin  │
│    được phân │  - Gửi tin      │  - Công việc  │
│    công      │                 │    của mình   │
│              │                 │  - Files      │
│              │                 │  - Thành viên │
└─────────────────────────────────────────────────┘
```

---

### 2. Leader (Trưởng Nhóm)

**Đặc điểm:**

- Quản lý nhóm/phòng ban
- Có quyền cao hơn staff
- Giám sát và phân công công việc

**Quyền hạn (Bao gồm tất cả quyền của Staff + thêm):**

- ✅ Xem TẤT CẢ hội thoại trong nhóm quản lý
- ✅ Ghim tin nhắn cho cả nhóm
- ✅ Tạo công việc từ tin nhắn
- ✅ Phân công công việc cho nhân viên
- ✅ Duyệt công việc hoàn thành
- ✅ Phân công lại công việc
- ✅ Thêm/xóa thành viên trong nhóm
- ✅ Chuyển hội thoại sang nhóm khác
- ✅ "Nhận thông tin" và chuyển giao
- ✅ Xem dashboard theo dõi team

**Giao diện:**

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR     │    CHAT AREA    │  INFO PANEL   │
│              │                 │                │
│  - TẤT CẢ    │  - Tin nhắn     │  - Thông tin  │
│    hội thoại │  - Ghim tin     │  - Công việc  │
│    nhóm      │  - Tạo task     │    CẢ NHÓM    │
│              │  - Nhận info    │  - Files      │
│  [Theo dõi   │                 │  - Thành viên │
│   Team]      │                 │  - Quản lý TV │
└─────────────────────────────────────────────────┘
```

---

### 3. Admin (Quản Trị Viên)

**Đặc điểm:**

- Quyền cao nhất
- Quản lý toàn hệ thống
- Cấu hình và quản lý người dùng

**Quyền hạn (Bao gồm tất cả quyền của Leader + thêm):**

- ✅ Toàn quyền truy cập tất cả hội thoại
- ✅ Quản lý người dùng (thêm, sửa, xóa, khóa)
- ✅ Cấu hình hệ thống
- ✅ Quản lý danh mục và nhóm
- ✅ Xem báo cáo tổng quan
- ✅ Cấu hình template công việc

**Giao diện:**

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR     │    CHAT AREA    │  INFO PANEL   │
│              │                 │                │
│  - TẤT CẢ    │  - Tin nhắn     │  - Thông tin  │
│    hội thoại │  - Ghim tin     │  - Công việc  │
│              │  - Tạo task     │  - Files      │
│  [Quản lý    │  - Nhận info    │  - Thành viên │
│   Người dùng]│                 │  - Quản lý TV │
│  [Cấu hình]  │                 │  - Cấu hình   │
└─────────────────────────────────────────────────┘
```

---

## 🔓 Đăng Xuất

### Cách Đăng Xuất

**Desktop:**

1. Click vào avatar/tên người dùng ở góc dưới sidebar
2. Menu hiện ra với tùy chọn "Đăng xuất"
3. Click "Đăng xuất"
4. Hệ thống xác nhận (nếu có)
5. Được chuyển về màn hình đăng nhập

**Mobile:**

1. Vào tab "Cá nhân" ở bottom navigation
2. Kéo xuống tìm nút "Đăng xuất"
3. Click "Đăng xuất"
4. Xác nhận
5. Về màn hình đăng nhập

### Quy Trình Đăng Xuất

```
[Click "Đăng xuất"]
         ↓
[Hiển thị xác nhận (tùy chọn)]
"Bạn có chắc muốn đăng xuất?"
         ↓
[Xác nhận = Có]
         ↓
[Xóa token khỏi bộ nhớ]
         ↓
[Xóa tất cả dữ liệu cache]
         ↓
[Ngắt kết nối SignalR]
         ↓
[Chuyển về màn hình đăng nhập "/login"]
```

### Dữ Liệu Bị Xóa Khi Đăng Xuất

- ✅ Token xác thực
- ✅ Thông tin người dùng
- ✅ Hội thoại đã chọn
- ✅ Cache tin nhắn
- ✅ Cache công việc
- ✅ Danh sách file

---

## 🔄 Tự Động Đăng Nhập Lại

### Khi Nào Tự Động Đăng Nhập?

**Trường hợp 1: Người dùng đóng trình duyệt và mở lại**

```
[Mở lại ứng dụng]
         ↓
[Kiểm tra token trong bộ nhớ]
         ↓
    Token còn hạn?
         ↓
    ✅ Còn → [Tự động đăng nhập]
    ❌ Hết → [Về màn đăng nhập]
```

**Trường hợp 2: Refresh trang**

```
[Refresh trang (F5)]
         ↓
[Kiểm tra token]
         ↓
    Token hợp lệ?
         ↓
    ✅ Có → [Giữ trạng thái đăng nhập]
    ❌ Không → [Về màn đăng nhập]
```

**Trường hợp 3: Token hết hạn trong khi đang dùng**

```
[Đang sử dụng ứng dụng]
         ↓
[Token hết hạn]
         ↓
[Hiển thị thông báo]
"Phiên đăng nhập đã hết hạn"
         ↓
[Tự động về màn đăng nhập]
```

---

## 🛡️ Bảo Mật

### Lưu Trữ Token

- Token được lưu trong **localStorage** của trình duyệt
- Token được mã hóa và có thời gian hết hạn
- Mỗi request đều gửi token trong header để xác thực

### Thời Gian Hết Hạn

- Token có thời gian sống giới hạn (ví dụ: 24 giờ)
- Khi token sắp hết hạn, hệ thống có thể tự động gia hạn (nếu được cấu hình)
- Khi token hết hạn, người dùng phải đăng nhập lại

### Bảo Vệ Mật Khẩu

- Mật khẩu được mã hóa trước khi gửi lên server
- Mật khẩu KHÔNG được lưu trong trình duyệt
- Chỉ token được lưu lại

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng              | Desktop                       | Mobile                    |
| ---------------------- | ----------------------------- | ------------------------- |
| **Màn đăng nhập**      | Form ở giữa màn hình          | Form full màn hình        |
| **Hiện/ẩn password**   | Icon mắt bên phải ô input     | Icon mắt bên phải ô input |
| **Thông báo lỗi**      | Toast góc phải hoặc dưới form | Toast top hoặc dưới form  |
| **Menu đăng xuất**     | Click avatar trong sidebar    | Trong tab "Cá nhân"       |
| **Xác nhận đăng xuất** | Modal popup                   | Bottom sheet hoặc alert   |

---

## ✅ Checklist Kiểm Thử

### Đăng Nhập

- [ ] **Đăng nhập thành công** với username/password đúng
  - Kết quả: Chuyển về trang chính "/"

- [ ] **Đăng nhập thất bại** với username/password sai
  - Kết quả: Hiển thị thông báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng"

- [ ] **Trường bỏ trống**
  - Bỏ trống username → Hiển thị "Vui lòng nhập tên đăng nhập"
  - Bỏ trống password → Hiển thị "Vui lòng nhập mật khẩu"

- [ ] **Nút hiện/ẩn password**
  - Click icon mắt → Password hiển thị dạng text
  - Click lại → Password ẩn lại

- [ ] **Loading state**
  - Trong khi đang gửi request → Nút "Đăng nhập" disable và hiện spinner
  - Form disable, không cho nhập

- [ ] **Lỗi kết nối**
  - Mất mạng khi đăng nhập → Hiển thị "Không thể kết nối đến server"

### Phân Quyền

- [ ] **Staff login**
  - Chỉ thấy hội thoại được phân công
  - KHÔNG thấy nút "Tạo công việc"
  - KHÔNG thấy nút "Ghim tin nhắn"

- [ ] **Leader login**
  - Thấy TẤT CẢ hội thoại trong nhóm
  - Thấy nút "Tạo công việc"
  - Thấy nút "Ghim tin nhắn"
  - Thấy tab "Theo dõi Team"

- [ ] **Admin login**
  - Thấy tất cả hội thoại
  - Thấy menu "Quản lý Người dùng"
  - Thấy menu "Cấu hình"

### Đăng Xuất

- [ ] **Đăng xuất thành công**
  - Click "Đăng xuất" → Về màn hình login
  - Token bị xóa
  - Không thể quay lại trang chính mà không đăng nhập

- [ ] **Đăng xuất khi đang có công việc chưa lưu**
  - Hiển thị cảnh báo (nếu có)
  - Vẫn đăng xuất được

### Tự Động Đăng Nhập

- [ ] **Đóng và mở lại trình duyệt**
  - Token còn hạn → Tự động vào trang chính
  - Token hết hạn → Về màn đăng nhập

- [ ] **Refresh trang (F5)**
  - Token còn hạn → Giữ trạng thái đăng nhập
  - Token hết hạn → Về màn đăng nhập

- [ ] **Token hết hạn trong khi dùng**
  - Hiển thị thông báo "Phiên đăng nhập đã hết hạn"
  - Tự động về màn đăng nhập

### Mobile

- [ ] **Đăng nhập trên mobile**
  - Form hiển thị đúng
  - Keyboard tự động hiện khi focus vào ô input
  - Có thể dùng "Next" trên keyboard để chuyển giữa các ô

- [ ] **Đăng xuất trên mobile**
  - Vào tab "Cá nhân" → Tìm thấy nút "Đăng xuất"
  - Click → Bottom sheet xác nhận
  - Xác nhận → Về màn đăng nhập

---

## 🔗 Liên Kết Tài Liệu

- 📄 [00_TONG_QUAN.md](./00_TONG_QUAN.md) - Tổng quan hệ thống
- 📄 [02_HOI_THOAI.md](./02_HOI_THOAI.md) - Màn hình chính sau khi đăng nhập
- 📄 [08_THEO_DOI_TEAM.md](./08_THEO_DOI_TEAM.md) - Tính năng dành cho Leader

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
