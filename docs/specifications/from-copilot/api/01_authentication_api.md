# 01. Authentication API

> **Mục đích:** API xác thực người dùng

---

## 1. Đăng Nhập

### Request

| Thuộc tính       | Giá trị            |
| ---------------- | ------------------ |
| **Method**       | `POST`             |
| **Endpoint**     | `/api/auth/login`  |
| **Content-Type** | `application/json` |

### Request Body

| Field      | Type    | Required | Mô tả             |
| ---------- | ------- | -------- | ----------------- |
| email      | string  | ✅       | Email đăng nhập   |
| password   | string  | ✅       | Mật khẩu          |
| rememberMe | boolean | ❌       | Ghi nhớ đăng nhập |

### Response Success (200)

| Field         | Type   | Mô tả                        |
| ------------- | ------ | ---------------------------- |
| accessToken   | string | JWT token                    |
| refreshToken  | string | Refresh token                |
| user          | object | Thông tin user               |
| user.id       | string | User ID                      |
| user.email    | string | Email                        |
| user.fullName | string | Họ tên                       |
| user.avatar   | string | URL avatar                   |
| user.role     | string | Vai trò (Admin/Leader/Staff) |

### Response Errors

| Status | Code                | Mô tả                   |
| ------ | ------------------- | ----------------------- |
| 400    | INVALID_INPUT       | Dữ liệu không hợp lệ    |
| 401    | INVALID_CREDENTIALS | Email hoặc mật khẩu sai |
| 403    | ACCOUNT_LOCKED      | Tài khoản bị khóa       |

---

## 2. Đăng Xuất

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `POST`                 |
| **Endpoint**      | `/api/auth/logout`     |
| **Authorization** | `Bearer {accessToken}` |

### Response Success (200)

| Field   | Type    | Mô tả     |
| ------- | ------- | --------- |
| success | boolean | Kết quả   |
| message | string  | Thông báo |

---

## 3. Refresh Token

### Request

| Thuộc tính   | Giá trị             |
| ------------ | ------------------- |
| **Method**   | `POST`              |
| **Endpoint** | `/api/auth/refresh` |

### Request Body

| Field        | Type   | Required | Mô tả                  |
| ------------ | ------ | -------- | ---------------------- |
| refreshToken | string | ✅       | Refresh token hiện tại |

### Response Success (200)

| Field        | Type   | Mô tả             |
| ------------ | ------ | ----------------- |
| accessToken  | string | JWT token mới     |
| refreshToken | string | Refresh token mới |

### Response Errors

| Status | Code          | Mô tả              |
| ------ | ------------- | ------------------ |
| 401    | TOKEN_EXPIRED | Token hết hạn      |
| 401    | INVALID_TOKEN | Token không hợp lệ |

---

## 4. Lấy Thông Tin User Hiện Tại

### Request

| Thuộc tính        | Giá trị                |
| ----------------- | ---------------------- |
| **Method**        | `GET`                  |
| **Endpoint**      | `/api/auth/me`         |
| **Authorization** | `Bearer {accessToken}` |

### Response Success (200)

| Field       | Type   | Mô tả           |
| ----------- | ------ | --------------- |
| id          | string | User ID         |
| email       | string | Email           |
| fullName    | string | Họ tên          |
| avatar      | string | URL avatar      |
| role        | string | Vai trò         |
| permissions | array  | Danh sách quyền |

---

## 5. Liên Kết Tài Liệu

- 🔗 [Đăng Nhập & Xác Thực](../features/login/01_dang_nhap_xac_thuc.md)
- 🔗 [Hệ Thống Phân Quyền](../03_he_thong_phan_quyen.md)

---

_Cập nhật: 27/01/2026_
