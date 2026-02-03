# 20. Checklist Tổng Hợp

> **Mục đích:** Tổng hợp tất cả test cases quan trọng theo module
>
> **Dành cho:** Team QC, QC Lead
>
> **Phiên bản:** 2.0

---

## 📌 Giới Thiệu

Tài liệu này tổng hợp tất cả các test cases quan trọng từ các tài liệu chi tiết, giúp team QC có một bản checklist tổng quan để kiểm thử toàn bộ hệ thống.

**Format:**
- ✅ = Pass
- ❌ = Fail
- ⏸️ = Blocked
- ⏭️ = Skip

---

## 🔐 Module 1: Authentication & Authorization

### 1.1 Đăng Nhập

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 1.1.1 | Đăng nhập với username/password đúng → Chuyển về "/" | ☐ | ☐ | |
| 1.1.2 | Đăng nhập sai password → Hiển thị lỗi | ☐ | ☐ | |
| 1.1.3 | Trường username bỏ trống → Hiển thị lỗi | ☐ | ☐ | |
| 1.1.4 | Trường password bỏ trống → Hiển thị lỗi | ☐ | ☐ | |
| 1.1.5 | Click icon mắt → Password hiện/ẩn | ☐ | ☐ | |
| 1.1.6 | Trong khi login → Nút disable, hiện spinner | ☐ | ☐ | |

### 1.2 Phân Quyền

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 1.2.1 | Staff chỉ thấy hội thoại được phân công | ☐ | ☐ | |
| 1.2.2 | Staff KHÔNG thấy nút "Tạo công việc" | ☐ | ☐ | Critical |
| 1.2.3 | Staff KHÔNG thấy nút "Ghim tin nhắn" | ☐ | ☐ | Critical |
| 1.2.4 | Leader thấy TẤT CẢ hội thoại nhóm quản lý | ☐ | ☐ | |
| 1.2.5 | Leader thấy nút "Tạo công việc" | ☐ | ☐ | |
| 1.2.6 | Leader thấy nút "Ghim tin nhắn" | ☐ | ☐ | |
| 1.2.7 | Admin thấy tất cả hội thoại hệ thống | ☐ | ☐ | |
| 1.2.8 | Admin thấy menu "Quản lý Người dùng" | ☐ | ☐ | |

### 1.3 Đăng Xuất

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 1.3.1 | Click "Đăng xuất" → Về màn login | ☐ | ☐ | |
| 1.3.2 | Token bị xóa sau khi đăng xuất | ☐ | ☐ | |
| 1.3.3 | Không thể quay lại "/" mà không login | ☐ | ☐ | |

### 1.4 Tự Động Đăng Nhập

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 1.4.1 | Đóng browser và mở lại → Vẫn đăng nhập (token còn hạn) | ☐ | ☐ | |
| 1.4.2 | Token hết hạn → Về màn login | ☐ | ☐ | |
| 1.4.3 | Refresh trang (F5) → Giữ trạng thái | ☐ | ☐ | |

---

## 💬 Module 2: Chat & Messaging

### 2.1 Danh Sách Hội Thoại

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 2.1.1 | Danh sách hội thoại hiển thị theo vai trò | ☐ | ☐ | |
| 2.1.2 | Hội thoại được phân nhóm theo category | ☐ | ☐ | |
| 2.1.3 | Badge số tin chưa đọc hiển thị đúng | ☐ | ☐ | |
| 2.1.4 | Tìm kiếm hội thoại → Lọc real-time | ☐ | ☐ | |
| 2.1.5 | Click hội thoại → Mở chat area (Desktop) hoặc full screen (Mobile) | ☐ | ☐ | |

### 2.2 Gửi & Nhận Tin Nhắn

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 2.2.1 | Gửi tin nhắn văn bản → Hiển thị tin nhắn | ☐ | ☐ | |
| 2.2.2 | Gửi emoji → Hiển thị đúng | ☐ | ☐ | |
| 2.2.3 | Gửi tin nhắn dài → Hiển thị đúng (line-break) | ☐ | ☐ | |
| 2.2.4 | Trạng thái tin nhắn: ⏳ → ✓ → ✓✓ | ☐ | ☐ | |
| 2.2.5 | Nhận tin nhắn real-time (từ user khác) | ☐ | ☐ | |
| 2.2.6 | Typing indicator hiển thị khi người khác gõ | ☐ | ☐ | |
| 2.2.7 | Badge số tin chưa đọc cập nhật real-time | ☐ | ☐ | |

### 2.3 Reply Tin Nhắn

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 2.3.1 | Hover tin nhắn → Menu hiện icon "Reply" (Desktop) | ☐ | N/A | |
| 2.3.2 | Long-press tin nhắn → Menu hiện "Reply" (Mobile) | N/A | ☐ | |
| 2.3.3 | Click "Reply" → Ô reply hiển thị | ☐ | ☐ | |
| 2.3.4 | Gõ tin reply → Gửi → Quote hiển thị đúng | ☐ | ☐ | |
| 2.3.5 | Click vào quote → Scroll đến tin gốc | ☐ | ☐ | |

### 2.4 Pin Tin Nhắn (Leader Only)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 2.4.1 | Leader hover tin → Thấy icon "📌 Pin" | ☐ | N/A | |
| 2.4.2 | Staff hover tin → KHÔNG thấy icon "📌 Pin" | ☐ | N/A | Critical |
| 2.4.3 | Leader click "Pin" → Tin được ghim | ☐ | ☐ | |
| 2.4.4 | Banner "📌 Tin ghim (X)" hiển thị ở top chat | ☐ | ☐ | |
| 2.4.5 | Click banner → Modal/Sheet hiện danh sách tin ghim | ☐ | ☐ | |
| 2.4.6 | Leader unpin tin → Tin bị gỡ khỏi danh sách | ☐ | ☐ | |

### 2.5 Star Tin Nhắn (Cá Nhân)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 2.5.1 | Hover tin → Icon "⭐ Star" hiển thị | ☐ | N/A | |
| 2.5.2 | Click "Star" → Tin được đánh dấu | ☐ | ☐ | |
| 2.5.3 | Swipe tin sang phải → Nút "Star" hiển thị (Mobile) | N/A | ☐ | |
| 2.5.4 | Vào "Tin đã đánh dấu" → Thấy danh sách tin star | ☐ | ☐ | |
| 2.5.5 | Unstar tin → Tin bị gỡ khỏi danh sách | ☐ | ☐ | |

---

## 📋 Module 3: Task Management

### 3.1 Tạo Công Việc (Leader)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 3.1.1 | Leader hover tin → Thấy icon "📋 Tạo công việc" | ☐ | N/A | |
| 3.1.2 | Staff hover tin → KHÔNG thấy icon "📋 Tạo công việc" | ☐ | N/A | Critical |
| 3.1.3 | Click "Tạo công việc" → Modal/Sheet mở | ☐ | ☐ | |
| 3.1.4 | Tiêu đề auto-fill từ nội dung tin nhắn | ☐ | ☐ | |
| 3.1.5 | Chọn nhân viên từ dropdown | ☐ | ☐ | |
| 3.1.6 | Chọn loại công việc → Template checklist load | ☐ | ☐ | |
| 3.1.7 | Chọn độ ưu tiên (Thấp/Trung/Cao) | ☐ | ☐ | |
| 3.1.8 | Click "Tạo" → Task được tạo thành công | ☐ | ☐ | |
| 3.1.9 | Tin gốc hiển thị task card liên kết | ☐ | ☐ | |
| 3.1.10 | Staff nhận thông báo công việc mới | ☐ | ☐ | |

### 3.2 Vòng Đời Công Việc

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 3.2.1 | Task mới được tạo → Trạng thái TODO (xám) | ☐ | ☐ | |
| 3.2.2 | Staff click "Bắt đầu làm" → TODO chuyển DOING (xanh) | ☐ | ☐ | |
| 3.2.3 | Check mục checklist → Progress tăng | ☐ | ☐ | |
| 3.2.4 | Progress bar hiển thị đúng % (X/Y mục) | ☐ | ☐ | |
| 3.2.5 | Staff click "Hoàn thành" → DOING chuyển NEED_TO_VERIFIED (vàng) | ☐ | ☐ | |
| 3.2.6 | Leader nhận thông báo cần duyệt | ☐ | ☐ | |
| 3.2.7 | Leader duyệt → NEED_TO_VERIFIED chuyển FINISHED (xanh lá) | ☐ | ☐ | |
| 3.2.8 | Staff nhận thông báo đã được duyệt | ☐ | ☐ | |

### 3.3 Duyệt Công Việc (Leader)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 3.3.1 | Leader vào tab Công việc → Section "CHỜ DUYỆT" hiển thị | ☐ | ☐ | |
| 3.3.2 | Click "Duyệt" → Modal/Sheet duyệt mở | ☐ | ☐ | |
| 3.3.3 | Nhập nhận xét → Click "Duyệt" → Task FINISHED | ☐ | ☐ | |
| 3.3.4 | Click "Yêu cầu làm lại" → Task quay DOING, Staff nhận thông báo | ☐ | ☐ | |

### 3.4 Phân Công Lại (Leader)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 3.4.1 | Leader click "⋮" trên task → Menu hiện | ☐ | ☐ | |
| 3.4.2 | Click "Phân công lại" → Modal chọn người mới | ☐ | ☐ | |
| 3.4.3 | Chọn người → Confirm → Task chuyển cho người mới | ☐ | ☐ | |
| 3.4.4 | Người cũ và người mới đều nhận thông báo | ☐ | ☐ | |

---

## 📁 Module 4: File Management

### 4.1 Upload File

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 4.1.1 | Click 📎 → File picker mở | ☐ | N/A | |
| 4.1.2 | Chọn file → Preview hiển thị | ☐ | ☐ | |
| 4.1.3 | Drag & drop file → Upload | ☐ | N/A | |
| 4.1.4 | Tap 📷 → Action sheet hiện (Camera/Gallery/File) | N/A | ☐ | |
| 4.1.5 | Chọn "Chụp ảnh" → Camera native mở | N/A | ☐ | |
| 4.1.6 | Chụp ảnh → Preview → Confirm → Upload | N/A | ☐ | |
| 4.1.7 | Upload progress hiển thị % | ☐ | ☐ | |
| 4.1.8 | File > 10MB → Hiển thị lỗi | ☐ | ☐ | |
| 4.1.9 | Upload batch (nhiều file) → Tất cả upload | ☐ | ☐ | |

### 4.2 Preview File

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 4.2.1 | Click ảnh → Modal preview mở (Desktop) / Full screen (Mobile) | ☐ | ☐ | |
| 4.2.2 | Pinch to zoom ảnh (Mobile) | N/A | ☐ | |
| 4.2.3 | Click PDF → PDF viewer mở | ☐ | ☐ | |
| 4.2.4 | Navigate qua các trang PDF | ☐ | ☐ | |
| 4.2.5 | Click Excel → Bảng hiển thị | ☐ | ☐ | |
| 4.2.6 | Chọn sheet khác trong Excel → Bảng thay đổi | ☐ | ☐ | |
| 4.2.7 | Click Word → HTML render hiển thị | ☐ | ☐ | |

### 4.3 File Manager

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 4.3.1 | Tab Files trong right panel hiển thị danh sách file | ☐ | N/A | |
| 4.3.2 | Tab Media hiển thị grid ảnh | ☐ | ☐ | |
| 4.3.3 | Tab Documents hiển thị list tài liệu | ☐ | ☐ | |
| 4.3.4 | Tìm kiếm file → Lọc real-time | ☐ | ☐ | |
| 4.3.5 | Lọc theo loại file → Chỉ hiện loại đã chọn | ☐ | ☐ | |
| 4.3.6 | Sắp xếp theo tên/ngày/size → Danh sách cập nhật | ☐ | ☐ | |
| 4.3.7 | Click "Tải về" → File download | ☐ | ☐ | |

---

## 👥 Module 5: Members & Groups

### 5.1 Danh Sách Thành Viên

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 5.1.1 | Tab Thành viên hiển thị danh sách | ☐ | ☐ | |
| 5.1.2 | Phân nhóm Leader/Thành viên | ☐ | ☐ | |
| 5.1.3 | Trạng thái online (● xanh), offline (○ xám) | ☐ | ☐ | |
| 5.1.4 | Tìm kiếm thành viên → Lọc real-time | ☐ | ☐ | |

### 5.2 Quản Lý Thành Viên (Leader)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 5.2.1 | Leader thấy nút "+ Thêm" | ☐ | ☐ | |
| 5.2.2 | Staff KHÔNG thấy nút "+ Thêm" | ☐ | ☐ | Critical |
| 5.2.3 | Click "+ Thêm" → Modal/Sheet mở | ☐ | ☐ | |
| 5.2.4 | Tìm và chọn user → Click "Thêm vào nhóm" → User được thêm | ☐ | ☐ | |
| 5.2.5 | User nhận thông báo được thêm vào nhóm | ☐ | ☐ | |
| 5.2.6 | Leader click "⋮" trên thành viên → Menu hiện | ☐ | ☐ | |
| 5.2.7 | Click "Xóa khỏi nhóm" → Confirm → User bị xóa | ☐ | ☐ | |
| 5.2.8 | User nhận thông báo bị xóa | ☐ | ☐ | |
| 5.2.9 | Promote thành admin nhóm → User có badge "Admin nhóm" | ☐ | ☐ | |

### 5.3 Chuyển Nhóm (Leader)

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 5.3.1 | Leader click "⋮" trong header chat → "Chuyển nhóm" hiện | ☐ | ☐ | |
| 5.3.2 | Staff KHÔNG thấy option "Chuyển nhóm" | ☐ | ☐ | Critical |
| 5.3.3 | Click "Chuyển nhóm" → Modal/Sheet mở | ☐ | ☐ | |
| 5.3.4 | Chọn nhóm đích → Nhập lý do → Chuyển | ☐ | ☐ | |
| 5.3.5 | Hội thoại chuyển sang nhóm mới | ☐ | ☐ | |
| 5.3.6 | Leader nhóm mới nhận thông báo | ☐ | ☐ | |

---

## 🔔 Module 6: Real-time & Notifications

### 6.1 Real-time Updates

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 6.1.1 | User A gửi tin → User B nhận ngay không cần refresh | ☐ | ☐ | |
| 6.1.2 | Typing indicator hiển thị khi người khác gõ | ☐ | ☐ | |
| 6.1.3 | Badge số tin chưa đọc cập nhật real-time | ☐ | ☐ | |
| 6.1.4 | Trạng thái online/offline cập nhật real-time | ☐ | ☐ | |
| 6.1.5 | Task state thay đổi → Cập nhật real-time | ☐ | ☐ | |

### 6.2 Notifications

| # | Test Case | Desktop | Mobile | Note |
|---|-----------|:-------:|:------:|------|
| 6.2.1 | Tin nhắn mới → Toast notification (Desktop) | ☐ | N/A | |
| 6.2.2 | App background → Push notification (Mobile) | N/A | ☐ | |
| 6.2.3 | Tap notification → Mở đúng hội thoại | N/A | ☐ | |
| 6.2.4 | Công việc mới → Thông báo hiển thị | ☐ | ☐ | |
| 6.2.5 | Task được duyệt → Staff nhận thông báo | ☐ | ☐ | |

---

## 📱 Module 7: Mobile-Specific Features

### 7.1 Navigation

| # | Test Case | Mobile | Note |
|---|-----------|:------:|------|
| 7.1.1 | Bottom navigation 3 tabs hiển thị | ☐ | |
| 7.1.2 | Tap tab chuyển đổi mượt | ☐ | |
| 7.1.3 | Badge số hiển thị trên tabs | ☐ | |
| 7.1.4 | Nút Back ← hoạt động đúng | ☐ | |

### 7.2 Gestures

| # | Test Case | Mobile | Note |
|---|-----------|:------:|------|
| 7.2.1 | Long-press tin nhắn → Bottom sheet menu hiện | ☐ | |
| 7.2.2 | Haptic feedback khi long-press | ☐ | |
| 7.2.3 | Swipe tin trái → "Reply" hiện | ☐ | |
| 7.2.4 | Swipe tin phải → "Star" hiện | ☐ | |
| 7.2.5 | Pull-to-refresh → Danh sách refresh | ☐ | |
| 7.2.6 | Pinch to zoom ảnh | ☐ | |

### 7.3 Bottom Sheets

| # | Test Case | Mobile | Note |
|---|-----------|:------:|------|
| 7.3.1 | Bottom sheet trượt lên mượt | ☐ | |
| 7.3.2 | Drag handle hiển thị | ☐ | |
| 7.3.3 | Swipe down → Sheet đóng | ☐ | |
| 7.3.4 | Tap outside (dimmed area) → Sheet đóng | ☐ | |
| 7.3.5 | Tap [✕] → Sheet đóng | ☐ | |

---

## 📊 Thống Kê Test Coverage

| Module | Total Cases | Passed | Failed | Blocked | Coverage |
|--------|-------------|--------|--------|---------|----------|
| **1. Auth** | 18 | 0 | 0 | 0 | 0% |
| **2. Chat** | 31 | 0 | 0 | 0 | 0% |
| **3. Tasks** | 18 | 0 | 0 | 0 | 0% |
| **4. Files** | 19 | 0 | 0 | 0 | 0% |
| **5. Members** | 16 | 0 | 0 | 0 | 0% |
| **6. Real-time** | 10 | 0 | 0 | 0 | 0% |
| **7. Mobile** | 14 | 0 | 0 | 0 | 0% |
| **TOTAL** | **126** | **0** | **0** | **0** | **0%** |

---

## 🔗 Liên Kết Tài Liệu

- 📄 [19_HUONG_DAN_QC.md](./19_HUONG_DAN_QC.md) - Hướng dẫn sử dụng checklist
- 📄 [00_MUC_LUC.md](./00_MUC_LUC.md) - Danh sách tài liệu chi tiết

---

**Phiên bản:** 2.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
