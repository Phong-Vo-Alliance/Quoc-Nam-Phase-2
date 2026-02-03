# 09. Bảo Mật

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Hệ thống áp dụng nhiều biện pháp bảo mật để bảo vệ nội dung khỏi bị sao chép trái phép. Các biện pháp này đặc biệt quan trọng cho file và hình ảnh nhạy cảm.

---

## Các Biện Pháp Bảo Mật

### 1. Chặn DevTools

**Mục đích:** Ngăn chặn việc inspect source code và debug

| Hành động | Kết quả |
|-----------|---------|
| Nhấn F12 | ❌ Bị chặn - Không mở DevTools |
| Nhấn Ctrl+Shift+I | ❌ Bị chặn |
| Nhấn Ctrl+Shift+J | ❌ Bị chặn |
| Right-click → Inspect | ❌ Không có option |

**Bypass cho Development:**
- Một số user được whitelist (dev team)
- Hiển thị banner "DEV MODE - Protections Bypassed" khi bypass active

---

### 2. Chặn Context Menu (Right-click)

**Mục đích:** Ngăn chặn menu chuột phải mặc định

| Vị trí | Hành vi |
|--------|---------|
| Right-click trên ảnh | ❌ Không hiện menu mặc định (không có "Save as") |
| Right-click trên text | ❌ Không có "Copy" |
| Ô input text | ✅ Cho phép paste |
| Vùng chat | Custom menu (Reply, Pin, etc.) |

---

### 3. Chặn Phím Tắt Copy

**Mục đích:** Ngăn copy nội dung

| Phím | Hành vi |
|------|---------|
| Ctrl+C trên ảnh | ❌ Bị chặn |
| Ctrl+S | ❌ Bị chặn (không cho save) |
| Ctrl+P | ❌ Bị chặn (không cho print) |
| Ctrl+A | ⚠️ Có thể bị giới hạn |

**Cho phép:**
- Copy text trong ô input
- Copy nội dung tin nhắn text (tùy cấu hình)

---

### 4. Watermark Trên Ảnh/File

**Mục đích:** Đánh dấu nguồn gốc, xác định người xem

**Nội dung watermark:**
- Tên người dùng đang xem
- Thời gian xem (timestamp)
- ID session (dạng mờ)

**Vị trí:**
- Overlay chéo góc hoặc full-screen mờ
- Không che khuất nội dung chính

**Áp dụng cho:**

| Loại | Có watermark |
|------|--------------|
| Preview ảnh full-screen | ✅ Có |
| Preview PDF | ✅ Có (mỗi trang) |
| Export/Download | ⚠️ Tùy cấu hình |

---

### 5. Chống Screenshot (Mobile)

**Mục đích:** Ngăn chụp màn hình trên mobile

| Tình huống | Hành vi |
|------------|---------|
| User chụp screenshot | Phát hiện → Hiển thị warning |
| Screenshot attempt | Có thể block (iOS/Android native) |
| Logging | Ghi nhận sự kiện screenshot |

**Giới hạn:**
- Không thể block 100% trên tất cả device
- External camera không thể ngăn chặn

---

## User Whitelist (Development)

### Mục Đích

Cho phép đội development và QC bypass các biện pháp bảo mật khi test

### Cách Hoạt Động

| Tình huống | Hành vi |
|------------|---------|
| User trong whitelist | DevTools hoạt động, context menu đầy đủ |
| Banner | Hiển thị "DEV MODE - Protections Bypassed" |
| User thường | Tất cả protections active |

### Lưu Ý

- ✅ Chỉ whitelist trên môi trường development
- ❌ Production KHÔNG có whitelist

---

## Bảo Mật Khi Preview File

| Loại file | Biện pháp |
|-----------|-----------|
| **Ảnh** | Watermark overlay, không cho save as, không cho drag ra ngoài browser |
| **PDF** | Render trong viewer custom, watermark mỗi trang, hạn chế download |
| **Excel/Word** | Preview read-only, download cần xác nhận |

---

## Bảo Mật Session

### Token Storage

| Nền tảng | Lưu trữ |
|----------|---------|
| Web | localStorage |
| Mobile | SecureStore (Expo) / Keychain (iOS) / Keystore (Android) |

### Auto Logout

| Tình huống | Hành vi |
|------------|---------|
| Không hoạt động lâu | Logout tự động |
| Token expired | Redirect về login |
| Đóng tab/browser | ⚠️ Session có thể persist (tùy cấu hình) |

### Logout Cleanup

Khi logout, hệ thống thực hiện:
1. ✅ Xóa tất cả data local
2. ✅ Clear cache
3. ✅ Hủy kết nối realtime (SignalR)

---

## [QC] Test Cases - Bảo Mật

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Chặn DevTools | Nhấn F12 | KHÔNG mở DevTools | 🔴 Cao |
| 2 | Chặn Ctrl+Shift+I | Nhấn Ctrl+Shift+I | Bị chặn | 🔴 Cao |
| 3 | Chặn right-click ảnh | Right-click trên ảnh | KHÔNG có menu mặc định | 🔴 Cao |
| 4 | Chặn Ctrl+S | Nhấn Ctrl+S trên ảnh | KHÔNG save | 🔴 Cao |
| 5 | Watermark hiển thị | Mở preview ảnh | Thấy watermark với tên user | 🔴 Cao |
| 6 | Watermark có timestamp | Xem ảnh ở các thời điểm khác | Timestamp khác nhau | 🟠 TB |
| 7 | DEV MODE whitelist | Login với user whitelisted | Thấy banner DEV MODE | 🟠 TB |
| 8 | Normal user không bypass | Login user thường, nhấn F12 | Bị chặn, KHÔNG có banner | 🔴 Cao |
| 9 | Logout clear data | Logout, kiểm tra localStorage | Data bị xóa sạch | 🔴 Cao |
| 10 | Token expired | Chờ token hết hạn | Redirect về login | 🟠 TB |

---

## [Mobile] Lưu Ý Implementation

### Chống Screenshot

| Platform | Implementation |
|----------|----------------|
| iOS | Dùng UITextField trick hoặc system flag |
| Android | FLAG_SECURE cho window |
| React Native | Library react-native-sensitive-info |

### Watermark

- Render watermark như overlay View
- Semi-transparent text layer
- Position absolute trên content

### Secure Storage

| Platform | Implementation |
|----------|----------------|
| iOS | Keychain |
| Android | EncryptedSharedPreferences |
| React Native | expo-secure-store |

### DevTools

- React Native không có DevTools như web
- Disable remote debugging trong production

---

**Xem tiếp:** [10-theo-doi-team.md](./10-theo-doi-team.md)
