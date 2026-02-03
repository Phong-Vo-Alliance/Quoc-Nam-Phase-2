# 19. Hướng Dẫn Kiểm Thử Cho Team QC

> **Mục đích:** Hướng dẫn team QC cách sử dụng bộ tài liệu và quy trình kiểm thử hiệu quả
>
> **Dành cho:** QC Engineer, QC Lead, Test Manager
>
> **Phiên bản:** 2.0

---

## 📌 Giới Thiệu

Bộ tài liệu này được thiết kế đặc biệt để hỗ trợ team QC trong quá trình kiểm thử hệ thống **Quốc Nam Portal Internal Chat**. Mỗi tài liệu đều bao gồm:

✅ Mô tả chi tiết tính năng
✅ Luồng hoạt động (flow)
✅ Giao diện (UI) bằng ASCII art
✅ **Checklist kiểm thử** sẵn có
✅ Kết quả mong đợi rõ ràng
✅ So sánh Desktop vs Mobile

---

## 🎯 Cách Đọc Tài Liệu

### Bước 1: Hiểu Tổng Quan Hệ Thống

**Đọc theo thứ tự:**

```
1️⃣ 00_MUC_LUC.md
   → Nắm được cấu trúc tài liệu

2️⃣ 01_TONG_QUAN_HE_THONG.md
   → Hiểu toàn bộ hệ thống
   → Biết các vai trò: Staff, Leader, Admin
   → Nắm layout Desktop vs Mobile

3️⃣ 02_QUY_TRINH_CHINH.md
   → Hiểu các luồng end-to-end
   → Biết cách người dùng thực sử dụng

4️⃣ 03_DANG_NHAP.md
   → Hiểu cách đăng nhập
   → Biết cách switch giữa các user để test permissions
```

**Thời gian:** ~30-45 phút đọc

**Kết quả:** Bạn đã hiểu 70% hệ thống

---

### Bước 2: Chọn Module Cần Test

Tùy vào sprint/task được giao, chọn module tương ứng:

#### Ví Dụ 1: Test Module "Chat"

```
Đọc các tài liệu sau:
├─ 04_DANH_SACH_HOI_THOAI.md
├─ 05_NHAN_TIN.md
├─ 06_TIN_NHAN_DAC_BIET.md
├─ 15_REALTIME_SIGNALR.md (Real-time messaging)
└─ 16_THONG_BAO.md (Badges, notifications)
```

#### Ví Dụ 2: Test Module "Task Management"

```
Đọc các tài liệu sau:
├─ 07_QUAN_LY_CONG_VIEC.md
├─ 08_CHECKLIST_TEMPLATE.md
└─ 13_THEO_DOI_TEAM.md (Dashboard Leader)
```

#### Ví Dụ 3: Test Module "File Management"

```
Đọc các tài liệu sau:
├─ 09_QUAN_LY_FILE.md
└─ 10_PREVIEW_FILE.md
```

---

### Bước 3: Extract Checklist

Mỗi tài liệu có section **"✅ Checklist Kiểm Thử"** ở cuối.

**Cách làm:**

1. **Copy checklist** từ tài liệu
2. **Paste vào tool quản lý test** (Excel, Jira, TestRail, v.v.)
3. **Thêm cột kết quả:** Pass/Fail/Blocked
4. **Thêm cột ghi chú:** Để ghi bug hoặc observation

**Ví dụ format Excel:**

| # | Test Case | Expected Result | Actual Result | Status | Bug ID | Note |
|---|-----------|----------------|---------------|--------|--------|------|
| 1 | Đăng nhập đúng username/password | Chuyển về trang chính "/" | Đúng | ✅ Pass | - | - |
| 2 | Đăng nhập sai password | Hiển thị "Tên đăng nhập hoặc mật khẩu không đúng" | Đúng | ✅ Pass | - | - |
| 3 | Trường bỏ trống username | Hiển thị "Vui lòng nhập tên đăng nhập" | Sai format | ❌ Fail | BUG-123 | Message tiếng Anh |

---

### Bước 4: Thực Hiện Test

#### 4.1 Chuẩn Bị Môi Trường

**Accounts cần có:**
```
✅ 1 account Staff
✅ 1 account Leader
✅ 1 account Admin
✅ Test data: Hội thoại, tin nhắn, công việc, files
```

**Browsers/Devices:**
```
Desktop:
  ✅ Chrome (latest)
  ✅ Edge (latest)
  ✅ Firefox (optional)

Mobile:
  ✅ iOS Safari (iPhone)
  ✅ Android Chrome
```

---

#### 4.2 Test Theo Từng Section

**Quy trình:**

```
[Đọc phần mô tả tính năng]
         ↓
[Hiểu luồng hoạt động (flow)]
         ↓
[Xem UI diagram (ASCII art)]
         ↓
[Mở checklist]
         ↓
[Test từng item]
         ↓
    Pass?
    ✅ Có → Check ✅, next item
    ❌ Không → Ghi bug, screenshot, next item
         ↓
[Hoàn thành section]
         ↓
[Tổng hợp kết quả]
```

---

#### 4.3 Test Permissions (Rất Quan Trọng!)

**Mỗi tính năng đều phải test quyền hạn:**

```
Test với Staff:
  ❌ Không thấy nút "Tạo công việc"
  ❌ Không thấy nút "Ghim tin nhắn"
  ❌ Không thấy menu "Thêm thành viên"

Test với Leader:
  ✅ Thấy tất cả các nút trên
  ✅ Có thể tạo task
  ✅ Có thể ghim tin
  ✅ Có thể thêm/xóa thành viên

Test với Admin:
  ✅ Tất cả quyền của Leader
  ✅ Thêm menu "Quản lý người dùng"
  ✅ Thêm menu "Cấu hình hệ thống"
```

**Mẹo:** Dùng 2-3 browser/incognito windows để đăng nhập nhiều user cùng lúc

---

#### 4.4 Test Cross-platform

**Desktop vs Mobile:**

Mỗi tính năng cần test trên CẢ Desktop VÀ Mobile:

```
Desktop Test:
  ✅ Layout 3 cột hiển thị đúng
  ✅ Hover menu hoạt động
  ✅ Modal popup đúng
  ✅ Drag & drop file hoạt động

Mobile Test:
  ✅ Bottom navigation hoạt động
  ✅ Bottom sheet thay modal
  ✅ Long-press menu hoạt động
  ✅ Swipe gestures hoạt động
  ✅ Camera/gallery upload hoạt động
  ✅ Pull-to-refresh hoạt động
```

**Tham khảo:** [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md)

---

## 🐛 Cách Báo Bug Hiệu Quả

### Template Bug Report

```markdown
**BUG-XXX: [Tiêu đề bug ngắn gọn]**

**Tài liệu tham khảo:** [XX_TEN_TAI_LIEU.md](./XX_TEN_TAI_LIEU.md)
**Test case:** [Tên test case trong checklist]

**Môi trường:**
- OS: Windows 11 / iOS 16.5 / Android 13
- Browser: Chrome 120.0.6099.130
- Screen: 1920x1080 / iPhone 13 Pro
- User role: Staff / Leader / Admin

**Bước tái hiện:**
1. Đăng nhập với account Staff
2. Vào hội thoại "Nhóm Kho A"
3. Hover vào tin nhắn
4. Click icon "Tạo công việc"

**Kết quả thực tế:**
- Nút "Tạo công việc" vẫn hiển thị với user Staff
- Click vào → Modal mở ra

**Kết quả mong đợi (theo tài liệu):**
- Staff KHÔNG được thấy nút "Tạo công việc"
- Chỉ Leader mới thấy nút này

**Screenshot:**
[Attach screenshot]

**Severity:** Critical / High / Medium / Low
**Priority:** P0 / P1 / P2 / P3
```

---

### Phân Loại Severity

| Severity | Mô Tả | Ví Dụ |
|----------|-------|-------|
| **Critical** | Hệ thống crash, không sử dụng được | App bị crash khi đăng nhập |
| **High** | Chức năng chính không hoạt động | Không gửi được tin nhắn |
| **Medium** | Chức năng phụ có vấn đề | Badge số tin chưa đọc sai |
| **Low** | Lỗi UI/UX nhỏ, không ảnh hưởng chức năng | Spacing không đều, typo |

---

## 📋 Quy Trình Test Theo Module

### Module 1: Authentication & Permissions

**Tài liệu:** [03_DANG_NHAP.md](./03_DANG_NHAP.md)

**Test cases chính:**
```
✅ Login/Logout
✅ Permission checks (Staff/Leader/Admin)
✅ Auto re-login
✅ Token expiry
✅ Password visibility toggle
```

**Thời gian ước tính:** 1-2 giờ

---

### Module 2: Conversations & Chat

**Tài liệu:**
- [04_DANH_SACH_HOI_THOAI.md](./04_DANH_SACH_HOI_THOAI.md)
- [05_NHAN_TIN.md](./05_NHAN_TIN.md)
- [06_TIN_NHAN_DAC_BIET.md](./06_TIN_NHAN_DAC_BIET.md)

**Test cases chính:**
```
✅ Danh sách hội thoại theo vai trò
✅ Badge unread count
✅ Tìm kiếm hội thoại
✅ Gửi/nhận tin nhắn
✅ Upload file trong tin nhắn
✅ Reply tin nhắn
✅ Pin tin nhắn (Leader only)
✅ Star tin nhắn
✅ Typing indicator
✅ Real-time updates
```

**Thời gian ước tính:** 3-4 giờ

---

### Module 3: Task Management

**Tài liệu:**
- [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md)
- [08_CHECKLIST_TEMPLATE.md](./08_CHECKLIST_TEMPLATE.md)

**Test cases chính:**
```
✅ Tạo task từ tin nhắn (Leader)
✅ Phân công task
✅ Vòng đời task: TODO → DOING → VERIFY → FINISHED
✅ Checklist: Check/uncheck items
✅ Progress bar cập nhật
✅ Duyệt task (Leader)
✅ Yêu cầu làm lại
✅ Phân công lại task
✅ Permissions (Staff không tạo được task)
```

**Thời gian ước tính:** 2-3 giờ

---

### Module 4: File Management

**Tài liệu:**
- [09_QUAN_LY_FILE.md](./09_QUAN_LY_FILE.md)
- [10_PREVIEW_FILE.md](./10_PREVIEW_FILE.md)

**Test cases chính:**
```
✅ Upload file (single & batch)
✅ Upload progress
✅ Drag & drop (Desktop)
✅ Camera upload (Mobile)
✅ Preview hình ảnh
✅ Preview PDF
✅ Preview Excel
✅ Preview Word
✅ Download file
✅ Lọc & sắp xếp file
✅ Tìm kiếm file
✅ Xóa file (permissions)
```

**Thời gian ước tính:** 2-3 giờ

---

### Module 5: Members & Groups

**Tài liệu:**
- [11_THANH_VIEN_NHOM.md](./11_THANH_VIEN_NHOM.md)
- [12_CHUYEN_NHOM.md](./12_CHUYEN_NHOM.md)

**Test cases chính:**
```
✅ Xem danh sách thành viên
✅ Online/offline status
✅ Tìm kiếm thành viên
✅ Thêm thành viên (Leader)
✅ Xóa thành viên (Leader)
✅ Promote admin nhóm
✅ Chuyển nhóm (Leader)
✅ Xem profile thành viên
✅ Permissions checks
```

**Thời gian ước tính:** 1.5-2 giờ

---

### Module 6: Leader Dashboard & Info Transfer

**Tài liệu:**
- [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md)
- [14_NHAN_CHUYEN_THONG_TIN.md](./14_NHAN_CHUYEN_THONG_TIN.md)

**Test cases chính:**
```
✅ Leader view tất cả hội thoại nhóm
✅ Dashboard thống kê task
✅ Xem task của từng thành viên
✅ Nhận thông tin từ tin nhắn
✅ Phân công xử lý thông tin
✅ Chuyển giao giữa phòng ban
✅ Theo dõi trạng thái xử lý
```

**Thời gian ước tính:** 2 giờ

---

### Module 7: Real-time & Notifications

**Tài liệu:**
- [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md)
- [16_THONG_BAO.md](./16_THONG_BAO.md)

**Test cases chính:**
```
✅ Tin nhắn mới hiển thị real-time
✅ Badge unread cập nhật tự động
✅ Typing indicator
✅ Trạng thái tin nhắn (✓, ✓✓)
✅ Thông báo công việc mới
✅ Push notification (Mobile)
✅ Offline/reconnect handling
```

**Thời gian ước tính:** 2 giờ

---

### Module 8: Mobile Specific

**Tài liệu:**
- [17_MOBILE.md](./17_MOBILE.md)
- [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md)

**Test cases chính:**
```
✅ Bottom navigation
✅ Bottom sheets
✅ Long-press menu
✅ Swipe gestures
✅ Pull-to-refresh
✅ Camera/gallery upload
✅ Haptic feedback
✅ Responsive layout
✅ Keyboard handling
```

**Thời gian ước tính:** 2-3 giờ

---

## 📊 Tổng Hợp Kết Quả Test

### Report Template

```markdown
# Test Report: [Tên Module]

**Ngày test:** 27/01/2026
**Tester:** [Tên bạn]
**Environment:** Dev / Staging / Production

## Tổng Quan

| Metric | Value |
|--------|-------|
| Total test cases | 50 |
| Passed | 45 (90%) |
| Failed | 3 (6%) |
| Blocked | 2 (4%) |

## Bugs Found

| Bug ID | Severity | Title | Status |
|--------|----------|-------|--------|
| BUG-123 | High | Staff có thể tạo task | Open |
| BUG-124 | Medium | Badge không cập nhật real-time | Open |
| BUG-125 | Low | Spacing không đều | Open |

## Test Coverage

✅ Desktop: Chrome, Edge
✅ Mobile: iOS (Safari), Android (Chrome)
✅ Permissions: Tested với Staff, Leader, Admin

## Ghi Chú

- Phần upload file hoạt động tốt
- Real-time có delay ~2s (acceptable)
- Mobile UX mượt mà

## Recommendation

- Fix BUG-123 (Critical permission issue)
- Optimize real-time để giảm delay
```

---

## 🎯 Tips & Best Practices

### ✅ Do's (Nên Làm)

1. **Đọc tài liệu trước khi test**
   - Hiểu rõ expected behavior
   - Biết cách tính năng hoạt động

2. **Test permissions kỹ**
   - Mỗi tính năng đều phải test với Staff/Leader/Admin
   - Đảm bảo Staff không thấy chức năng của Leader

3. **Test cross-platform**
   - Desktop: Hover, click, drag-drop
   - Mobile: Tap, long-press, swipe, camera

4. **Screenshot evidence**
   - Chụp screenshot cho mọi bug
   - Đặt tên file rõ ràng: BUG-123-staff-can-create-task.png

5. **Test real-time**
   - Dùng 2 browsers để test tin nhắn real-time
   - Kiểm tra badge cập nhật ngay

6. **Test edge cases**
   - File quá lớn
   - Tin nhắn quá dài
   - Tên có ký tự đặc biệt
   - Network offline/online

7. **Ghi chú chi tiết**
   - Ghi lại steps tái hiện bug
   - Ghi expected vs actual

---

### ❌ Don'ts (Không Nên Làm)

1. **Không test mà không đọc tài liệu**
   - Không biết expected behavior → Không biết cái gì là bug

2. **Không skip test permissions**
   - Permissions bug rất nghiêm trọng
   - Có thể dẫn đến security issues

3. **Không test chỉ trên 1 platform**
   - Phải test cả Desktop và Mobile
   - UI/UX khác nhau giữa 2 platforms

4. **Không báo bug không rõ ràng**
   - Phải có steps tái hiện
   - Phải có screenshot
   - Phải ghi expected vs actual

5. **Không test chỉ happy path**
   - Phải test cả error cases
   - Phải test edge cases

---

## 📞 Hỗ Trợ

Nếu có thắc mắc về:

**Tài liệu:**
- Đọc lại section "📌 Giới Thiệu" của tài liệu đó
- Check [00_MUC_LUC.md](./00_MUC_LUC.md) để tìm tài liệu liên quan

**Chức năng:**
- Hỏi team Development
- Xem phần "Luồng hoạt động" trong tài liệu

**Bug:**
- Hỏi QC Lead trước khi báo
- Đảm bảo đã đọc tài liệu kỹ

---

## 🔗 Tài Liệu Liên Quan

- 📄 [00_MUC_LUC.md](./00_MUC_LUC.md) - Danh sách tất cả tài liệu
- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [20_CHECKLIST_TONG_HOP.md](./20_CHECKLIST_TONG_HOP.md) - Tổng hợp tất cả test cases

---

**Phiên bản:** 2.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành

**Chúc team QC test hiệu quả!** 🚀
