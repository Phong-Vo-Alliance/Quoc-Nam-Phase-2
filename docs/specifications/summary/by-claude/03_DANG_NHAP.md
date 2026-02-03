# 03. Đăng Nhập & Xác Thực

> **Mục đích:** Mô tả quy trình đăng nhập, đăng xuất và phân quyền người dùng
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Hệ thống xác thực đảm bảo chỉ những người dùng có quyền mới có thể truy cập vào ứng dụng. Mỗi người dùng có vai trò (role) khác nhau, quyết định những chức năng họ có thể sử dụng.

**Các vai trò chính:**
- **Staff:** Nhân viên cơ bản
- **Leader:** Trưởng nhóm/phòng ban
- **Admin:** Quản trị viên hệ thống

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
[Lưu token vào bộ nhớ (localStorage)]
         ↓
[Chuyển hướng về trang chính "/"]
         ↓
[Hiển thị giao diện chính]
         ↓
[Load danh sách hội thoại theo vai trò]
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
         ↓
[Focus vào ô username]
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

| Chức năng | Quyền |
|-----------|-------|
| Xem hội thoại | ✅ Chỉ hội thoại được phân công |
| Gửi tin nhắn | ✅ Có |
| Ghim tin nhắn (Pin) | ❌ Không |
| Đánh dấu tin (Star) | ✅ Có (cá nhân) |
| Tạo công việc | ❌ Không |
| Nhận công việc | ✅ Có |
| Cập nhật công việc | ✅ Có |
| Upload file | ✅ Có |
| Thêm/xóa thành viên | ❌ Không |
| Chuyển nhóm | ❌ Không |

**Giao diện Staff:**
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (Chỉ hội  │  CHAT AREA      │  INFO    │
│  thoại được phân   │                 │  PANEL   │
│  công)             │  - Tin nhắn     │          │
│                    │  - Gửi tin      │ - Thông  │
│  • Vận Hành        │  - Reply        │   tin    │
│    - Nhóm Kho A    │                 │ - Công   │
│    - Nhóm Kho B    │                 │   việc   │
│                    │                 │   của    │
│  • Khách Hàng      │                 │   mình   │
│    - Team CSKH 1   │                 │ - Files  │
│                    │                 │ - Thành  │
│                    │                 │   viên   │
└─────────────────────────────────────────────────┘
```

---

### 2. Leader (Trưởng Nhóm)

**Đặc điểm:**
- Quản lý nhóm/phòng ban
- Có quyền cao hơn staff
- Giám sát và phân công công việc

**Quyền hạn (Bao gồm TẤT CẢ quyền của Staff + thêm):**

| Chức năng | Quyền |
|-----------|-------|
| Xem hội thoại | ✅ TẤT CẢ hội thoại trong nhóm quản lý |
| Ghim tin nhắn (Pin) | ✅ Có (cho cả nhóm) |
| Tạo công việc | ✅ Có |
| Phân công công việc | ✅ Có |
| Duyệt công việc | ✅ Có |
| Phân công lại task | ✅ Có |
| Thêm/xóa thành viên | ✅ Có |
| Promote thành admin nhóm | ✅ Có |
| Chuyển nhóm | ✅ Có |
| Nhận thông tin & chuyển giao | ✅ Có |
| Dashboard theo dõi team | ✅ Có |

**Giao diện Leader:**
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (TẤT CẢ  │  CHAT AREA       │  INFO    │
│  hội thoại nhóm)  │                  │  PANEL   │
│                   │  - Tin nhắn      │          │
│  • Vận Hành       │  - Ghim tin ✨   │ - Thông  │
│    - Kho A 👤     │  - Tạo task ✨   │   tin    │
│    - Kho B 👁️    │  - Nhận info ✨  │ - Công   │
│    - Kho C 👁️    │                  │   việc   │
│                   │                  │   CẢ     │
│  [📊 Theo Dõi     │                  │   NHÓM   │
│   Team] ✨        │                  │ - Files  │
│                   │                  │ - Thành  │
│                   │                  │   viên   │
│                   │                  │ - Quản   │
│                   │                  │   lý TV  │
└─────────────────────────────────────────────────┘

Chú thích:
👤 = Tham gia trực tiếp (là thành viên)
👁️ = Chỉ theo dõi (Leader view)
✨ = Tính năng chỉ Leader mới có
```

---

### 3. Admin (Quản Trị Viên)

**Đặc điểm:**
- Quyền cao nhất trong hệ thống
- Quản lý toàn bộ hệ thống
- Cấu hình và quản lý người dùng

**Quyền hạn (Bao gồm TẤT CẢ quyền của Leader + thêm):**

| Chức năng | Quyền |
|-----------|-------|
| Xem hội thoại | ✅ TẤT CẢ hội thoại hệ thống |
| Quản lý người dùng | ✅ Thêm, sửa, xóa, khóa user |
| Cấu hình hệ thống | ✅ Settings, categories, work types |
| Quản lý danh mục | ✅ Tạo, sửa, xóa categories |
| Quản lý nhóm | ✅ Tạo, sửa, xóa groups |
| Xem báo cáo | ✅ Báo cáo tổng quan toàn hệ thống |
| Cấu hình template | ✅ Tạo/sửa checklist templates |

**Giao diện Admin:**
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (TẤT CẢ  │  CHAT AREA       │  INFO    │
│  hội thoại)       │                  │  PANEL   │
│                   │  - Tin nhắn      │          │
│  • TẤT CẢ nhóm    │  - Ghim tin      │ - Thông  │
│                   │  - Tạo task      │   tin    │
│  [👥 Quản lý      │  - Nhận info     │ - Công   │
│   Người dùng] ✨  │                  │   việc   │
│                   │                  │ - Files  │
│  [⚙️ Cấu hình]✨  │                  │ - Thành  │
│                   │                  │   viên   │
│  [📊 Báo cáo] ✨  │                  │ - Quản   │
│                   │                  │   lý TV  │
│                   │                  │ - Cấu    │
│                   │                  │   hình   │
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
[Kiểm tra token trong bộ nhớ (localStorage)]
         ↓
    Token còn hạn?
         ↓
    ✅ Còn → [Tự động đăng nhập]
              ↓
              [Load giao diện chính]
              ↓
              [Connect SignalR]

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
              ↓
              [Restore state]
              ↓
              [Reconnect SignalR]

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
         ↓
[Xóa token và cache]
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
| **Keyboard**           | N/A                           | Tự động hiện khi focus    |
| **Navigation**         | N/A                           | Sử dụng "Next" trên keyboard |

---

## ✅ Checklist Kiểm Thử

### Đăng Nhập

- [ ] **Đăng nhập thành công** với username/password đúng
  - Kết quả: Chuyển về trang chính "/"
  - Hiển thị đúng giao diện theo vai trò (Staff/Leader/Admin)

- [ ] **Đăng nhập thất bại** với username/password sai
  - Kết quả: Hiển thị thông báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng"
  - Form không bị clear, cho phép nhập lại

- [ ] **Trường bỏ trống**
  - Bỏ trống username → Hiển thị "Vui lòng nhập tên đăng nhập"
  - Bỏ trống password → Hiển thị "Vui lòng nhập mật khẩu"
  - Bỏ trống cả hai → Hiển thị cả 2 lỗi

- [ ] **Nút hiện/ẩn password**
  - Click icon mắt → Password hiển thị dạng text
  - Click lại → Password ẩn lại
  - Icon đổi trạng thái (mắt mở/mắt đóng)

- [ ] **Loading state**
  - Trong khi đang gửi request → Nút "Đăng nhập" disable và hiện spinner
  - Form disable, không cho nhập
  - Sau khi xong → Form enable lại (nếu lỗi)

- [ ] **Lỗi kết nối**
  - Mất mạng khi đăng nhập → Hiển thị "Không thể kết nối đến server"
  - Có nút "Thử lại"

### Phân Quyền

- [ ] **Staff login**
  - Chỉ thấy hội thoại được phân công
  - KHÔNG thấy nút "Tạo công việc"
  - KHÔNG thấy nút "Ghim tin nhắn"
  - KHÔNG thấy menu "Theo dõi Team"

- [ ] **Leader login**
  - Thấy TẤT CẢ hội thoại trong nhóm quản lý
  - Thấy nút "Tạo công việc"
  - Thấy nút "Ghim tin nhắn"
  - Thấy tab "Theo dõi Team"
  - Có icon phân biệt: 👤 (thành viên) vs 👁️ (chỉ xem)

- [ ] **Admin login**
  - Thấy tất cả hội thoại hệ thống
  - Thấy menu "Quản lý Người dùng"
  - Thấy menu "Cấu hình"
  - Thấy menu "Báo cáo"

### Đăng Xuất

- [ ] **Đăng xuất thành công**
  - Click "Đăng xuất" → Về màn hình login
  - Token bị xóa
  - Không thể quay lại trang chính mà không đăng nhập
  - SignalR connection bị ngắt

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
  - Hội thoại đang mở được restore

- [ ] **Token hết hạn trong khi dùng**
  - Hiển thị thông báo "Phiên đăng nhập đã hết hạn"
  - Tự động về màn đăng nhập
  - Clear tất cả cache

### Mobile

- [ ] **Đăng nhập trên mobile**
  - Form hiển thị đúng full screen
  - Keyboard tự động hiện khi focus vào ô input
  - Có thể dùng "Next" trên keyboard để chuyển giữa các ô
  - "Done" trên keyboard tương đương click "Đăng nhập"

- [ ] **Đăng xuất trên mobile**
  - Vào tab "Cá nhân" → Tìm thấy nút "Đăng xuất"
  - Click → Bottom sheet xác nhận
  - Xác nhận → Về màn đăng nhập

- [ ] **Responsive**
  - Xoay ngang/dọc → Form adapt đúng
  - Touch target đủ lớn (min 44pt)

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [02_QUY_TRINH_CHINH.md](./02_QUY_TRINH_CHINH.md) - Các luồng sử dụng chính
- 📄 [04_DANH_SACH_HOI_THOAI.md](./04_DANH_SACH_HOI_THOAI.md) - Màn hình chính sau khi đăng nhập
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Tính năng dành cho Leader

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
