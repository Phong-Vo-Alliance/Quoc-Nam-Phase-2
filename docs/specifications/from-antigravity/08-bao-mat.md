# 08. Bảo Mật

## Mô Tả Tính Năng

Hệ thống áp dụng nhiều biện pháp bảo mật để bảo vệ nội dung khỏi bị sao chép trái phép. Các biện pháp này đặc biệt quan trọng cho file và hình ảnh nhạy cảm.

---

## Các Biện Pháp Bảo Mật

### 1. Chặn DevTools

**Mục đích:** Ngăn chặn việc inspect source code và debug

**Hành vi:**
- Nhấn F12: Không mở DevTools
- Nhấn Ctrl+Shift+I: Bị chặn
- Nhấn Ctrl+Shift+J: Bị chặn
- Right-click → Inspect: Không có option

**Bypass cho Development:**
- Một số user được whitelist (dev team)
- Hiển thị banner "DEV MODE" khi bypass active

### 2. Chặn Context Menu (Right-click)

**Mục đích:** Ngăn chặn menu chuột phải mặc định

**Hành vi:**
- Right-click trên ảnh: Không hiện menu mặc định
- Right-click trên text: Không có "Copy", "Save as"
- Custom context menu cho các actions cho phép

**Ngoại lệ:**
- Ô input text: Cho phép paste
- Vùng chat: Custom menu (Reply, Pin, etc.)

### 3. Chặn Phím Tắt Copy

**Mục đích:** Ngăn copy nội dung

**Hành vi:**
- Ctrl+C trên ảnh: Bị chặn
- Ctrl+S: Bị chặn
- Ctrl+P: Bị chặn (không cho print)
- Ctrl+A: Có thể bị giới hạn

**Cho phép:**
- Copy text trong ô input
- Copy nội dung tin nhắn text (tùy cấu hình)

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
- Preview ảnh full-screen
- Preview PDF
- Export/Download (tuỳ cấu hình)

### 5. Chống Screenshot (Mobile)

**Mục đích:** Ngăn chụp màn hình trên mobile

**Hành vi:**
- Phát hiện screenshot → Hiển thị warning
- Có thể block screenshot (iOS/Android native)
- Log lại sự kiện screenshot

**Giới hạn:**
- Không thể block 100% trên tất cả device
- External camera không thể ngăn chặn

---

## User Whitelist (Development)

### Mục đích
Cho phép đội development và QC bypass các biện pháp bảo mật khi test

### Cách hoạt động
- Danh sách email/ID được whitelist
- User trong whitelist:
  - DevTools hoạt động bình thường
  - Context menu đầy đủ
  - Hiển thị banner "DEV MODE - Protections Bypassed"

### Lưu ý
- Chỉ whitelist trên môi trường development
- Production không có whitelist

---

## Bảo Mật Khi Preview File

### Ảnh
- Hiển thị với watermark overlay
- Không cho save as
- Không cho drag ra ngoài browser

### PDF
- Render trong viewer custom
- Watermark overlay mỗi trang
- Không cho download trực tiếp (tuỳ cấu hình)

### Excel/Word
- Preview read-only
- Download cần xác nhận

---

## Bảo Mật Session

### Token Storage
- Token lưu trong localStorage (Web)
- SecureStore (Mobile)
- Token có thời hạn expiry

### Auto Logout
- Sau thời gian không hoạt động → Logout
- Token expired → Redirect về login
- Đóng tab/browser → Session có thể persist (tùy cấu hình)

### Logout Cleanup
- Xóa tất cả data local
- Clear cache
- Hủy kết nối realtime

---

## [QC] Test Cases - Bảo Mật

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Chặn DevTools | Nhấn F12 | Không mở DevTools | 🔴 Cao |
| 2 | Chặn Ctrl+Shift+I | Nhấn Ctrl+Shift+I | Bị chặn | 🔴 Cao |
| 3 | Chặn right-click ảnh | Right-click trên ảnh | Không có menu mặc định | 🔴 Cao |
| 4 | Chặn Ctrl+S | Nhấn Ctrl+S trên ảnh | Không save | 🔴 Cao |
| 5 | Watermark hiển thị | Mở preview ảnh | Thấy watermark với tên user | 🔴 Cao |
| 6 | Watermark có timestamp | Xem ảnh ở các thời điểm khác | Timestamp khác nhau | 🟠 TB |
| 7 | DEV MODE whitelist | Login với user whitelisted | Thấy banner DEV MODE | 🟠 TB |
| 8 | Normal user không bypass | Login user thường, nhấn F12 | Bị chặn, không có banner | 🔴 Cao |
| 9 | Logout clear data | Logout, kiểm tra localStorage | Data bị xóa sạch | 🔴 Cao |
| 10 | Token expired | Chờ token hết hạn | Redirect về login | 🟠 TB |

---

## [Mobile] Lưu Ý Implementation

### Chống Screenshot
- iOS: Dùng UITextField trick hoặc system flag
- Android: FLAG_SECURE cho window
- React Native: Có thể dùng library react-native-sensitive-info

### Watermark
- Render watermark như overlay View
- Semi-transparent text layer

### Secure Storage
- iOS: Keychain
- Android: EncryptedSharedPreferences
- React Native: expo-secure-store

### DevTools
- React Native không có DevTools như web
- Disable remote debugging trong production

---

**Xem tiếp:** [09-man-hinh-chi-tiet.md](./09-man-hinh-chi-tiet.md)
