# 📚 Tài Liệu Đặc Tả Tính Năng - Quốc Nam Portal

> **Mục đích:** Cung cấp tài liệu tổng hợp, dễ hiểu về các tính năng của hệ thống cho team QC
>
> **Phiên bản:** 2.0 (Unified Documentation)
>
> **Ngày tạo:** 27/01/2026
>
> **Người tạo:** Claude AI Assistant

---

## 🎯 Giới Thiệu

Bộ tài liệu này được tổng hợp từ 3 nguồn tài liệu hiện có (from-claude, from-copilot, from-antigravity) nhằm cung cấp một bản mô tả **đầy đủ, nhất quán và dễ hiểu** về tất cả các tính năng của hệ thống **Quốc Nam Portal Internal Chat**.

Tài liệu được chia thành các phần nhỏ, tập trung vào từng chức năng cụ thể, giúp team QC dễ dàng:
- Hiểu rõ cách thức hoạt động của từng tính năng
- Nắm được các trường hợp sử dụng (use cases)
- Có checklist kiểm thử chi tiết
- Biết được điểm khác biệt giữa Desktop và Mobile

---

## 📖 Mục Lục

### PHẦN 1: TỔNG QUAN HỆ THỐNG

| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 01 | [**Tổng Quan Hệ Thống**](./01_TONG_QUAN_HE_THONG.md) | Giới thiệu toàn bộ hệ thống, kiến trúc, vai trò người dùng, layout Desktop/Mobile |
| 02 | [**Quy Trình Chính**](./02_QUY_TRINH_CHINH.md) | Các luồng sử dụng chính từ đầu đến cuối (end-to-end flows) |

---

### PHẦN 2: TÍNH NĂNG CỐT LÕI

#### 🔐 Module Xác Thực & Phân Quyền
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 03 | [**Đăng Nhập & Xác Thực**](./03_DANG_NHAP.md) | Quy trình đăng nhập, đăng xuất, phân quyền Staff/Leader/Admin |

#### 💬 Module Giao Tiếp
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 04 | [**Danh Sách Hội Thoại**](./04_DANH_SACH_HOI_THOAI.md) | Xem danh sách hội thoại, phân loại theo danh mục, tìm kiếm |
| 05 | [**Nhắn Tin & Chat**](./05_NHAN_TIN.md) | Gửi/nhận tin nhắn, reply, ghim tin, đánh dấu tin, typing indicator |
| 06 | [**Tin Nhắn Đặc Biệt**](./06_TIN_NHAN_DAC_BIET.md) | Ghim tin (Pin), đánh dấu tin (Star), reply tin nhắn |

#### 📋 Module Quản Lý Công Việc
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 07 | [**Quản Lý Công Việc**](./07_QUAN_LY_CONG_VIEC.md) | Tạo task, phân công, vòng đời task (TODO→DOING→VERIFY→FINISHED) |
| 08 | [**Checklist & Template**](./08_CHECKLIST_TEMPLATE.md) | Template checklist theo loại công việc, theo dõi tiến độ |

#### 📁 Module Quản Lý File
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 09 | [**Upload & Quản Lý File**](./09_QUAN_LY_FILE.md) | Upload file, xem trước, tải về, lọc/sắp xếp file |
| 10 | [**Preview File**](./10_PREVIEW_FILE.md) | Xem trước hình ảnh, PDF, Excel, Word trong ứng dụng |

---

### PHẦN 3: TÍNH NĂNG BỔ SUNG

#### 👥 Module Quản Lý Thành Viên
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 11 | [**Thành Viên & Nhóm**](./11_THANH_VIEN_NHOM.md) | Xem danh sách thành viên, thêm/xóa thành viên (Leader) |
| 12 | [**Chuyển Nhóm & Phân Quyền**](./12_CHUYEN_NHOM.md) | Chuyển hội thoại sang nhóm khác, promote admin |

#### 📊 Module Theo Dõi (Leader)
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 13 | [**Theo Dõi Team**](./13_THEO_DOI_TEAM.md) | Dashboard leader, theo dõi công việc và hoạt động của team |
| 14 | [**Nhận & Chuyển Thông Tin**](./14_NHAN_CHUYEN_THONG_TIN.md) | Leader nhận thông tin, chuyển giao giữa phòng ban |

---

### PHẦN 4: TÍNH NĂNG KỸ THUẬT

#### 🔔 Module Real-time & Thông Báo
| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 15 | [**Real-time & SignalR**](./15_REALTIME_SIGNALR.md) | Nhận tin nhắn real-time, cập nhật trạng thái, typing indicator |
| 16 | [**Thông Báo & Badge**](./16_THONG_BAO.md) | Badge số tin chưa đọc, thông báo công việc mới, push notification |

---

### PHẦN 5: MOBILE & RESPONSIVE

| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 17 | [**Tính Năng Mobile**](./17_MOBILE.md) | Bottom navigation, bottom sheets, gestures, camera/upload mobile |
| 18 | [**Desktop vs Mobile**](./18_DESKTOP_VS_MOBILE.md) | So sánh chi tiết các điểm khác biệt giữa Desktop và Mobile |

---

### PHẦN 6: HƯỚNG DẪN KIỂM THỬ

| #  | Tài Liệu | Nội Dung Chính |
|----|----------|----------------|
| 19 | [**Hướng Dẫn QC Tổng Quát**](./19_HUONG_DAN_QC.md) | Cách sử dụng tài liệu, quy trình test, best practices |
| 20 | [**Checklist Kiểm Thử Tổng Hợp**](./20_CHECKLIST_TONG_HOP.md) | Tổng hợp tất cả test cases quan trọng theo module |

---

## 🎓 Cách Sử Dụng Tài Liệu Này

### Dành Cho QC Engineer

#### Bước 1: Hiểu Tổng Quan
```
Đọc theo thứ tự:
1. 01_TONG_QUAN_HE_THONG.md
2. 02_QUY_TRINH_CHINH.md
3. 03_DANG_NHAP.md
```

#### Bước 2: Chọn Module Cần Test
```
Ví dụ cần test module "Chat":
→ Đọc: 04_DANH_SACH_HOI_THOAI.md
→ Đọc: 05_NHAN_TIN.md
→ Đọc: 06_TIN_NHAN_DAC_BIET.md
→ Đọc: 15_REALTIME_SIGNALR.md
```

#### Bước 3: Sử Dụng Checklist
```
Mỗi tài liệu có section "✅ Checklist Kiểm Thử"
→ Copy checklist
→ Test từng item
→ Check ✅ khi pass
→ Ghi chú ❌ khi fail + mô tả bug
```

#### Bước 4: Test Cross-platform
```
Test trên Desktop:
→ Đọc phần chính của tài liệu

Test trên Mobile:
→ Đọc thêm section "📱 Khác Biệt Desktop vs Mobile"
→ Đọc: 17_MOBILE.md
→ Đọc: 18_DESKTOP_VS_MOBILE.md
```

---

### Dành Cho Team Mobile Development

#### Bước 1: Hiểu Business Logic
```
Đọc tài liệu tính năng để hiểu logic:
→ Không có code, chỉ có mô tả chức năng
→ Hiểu luồng hoạt động (flow)
→ Hiểu kết quả mong đợi
```

#### Bước 2: Implement Tương Tự
```
Tham khảo:
→ Phần "Luồng hoạt động" trong mỗi tài liệu
→ Phần "📱 Khác Biệt Desktop vs Mobile"
→ 17_MOBILE.md cho mobile-specific features
```

#### Bước 3: UI/UX Guidelines
```
Tham khảo:
→ ASCII art diagrams trong tài liệu
→ Section "Giao diện" của mỗi tính năng
→ Touch target sizes, spacing, gestures trong 17_MOBILE.md
```

---

## 📊 Thống Kê Tài Liệu

| Phần | Số Tài Liệu | Trạng Thái |
|------|-------------|------------|
| **Phần 1: Tổng Quan** | 2 | ✅ Hoàn thành |
| **Phần 2: Tính Năng Cốt Lõi** | 8 | ✅ Hoàn thành |
| **Phần 3: Tính Năng Bổ Sung** | 4 | ✅ Hoàn thành |
| **Phần 4: Tính Năng Kỹ Thuật** | 2 | ✅ Hoàn thành |
| **Phần 5: Mobile & Responsive** | 2 | ✅ Hoàn thành |
| **Phần 6: Hướng Dẫn Kiểm Thử** | 2 | ✅ Hoàn thành |
| **TỔNG CỘNG** | **20 tài liệu** | **✅ 100%** |

**Tổng số trang ước tính:** ~150-200 trang A4

---

## 🔑 Các Khái Niệm Quan Trọng

### Vai Trò Người Dùng
- **Staff:** Nhân viên cơ bản, thực hiện công việc
- **Leader:** Trưởng nhóm, quản lý và phân công công việc
- **Admin:** Quản trị viên, toàn quyền hệ thống

### Vòng Đời Công Việc
```
TODO → DOING → NEED_TO_VERIFIED → FINISHED
```

### Loại Tin Nhắn
- **Pin (Ghim):** Leader ghim cho cả nhóm thấy
- **Star (Đánh dấu):** Cá nhân đánh dấu cho mình
- **Reply:** Trả lời tin nhắn

### Layout
- **Desktop:** 3 cột (Sidebar - Chat Area - Right Panel)
- **Mobile:** 1 cột (Chuyển màn), Bottom Navigation

---

## 🚀 Điểm Nổi Bật Của Bộ Tài Liệu

### ✅ Ưu Điểm

1. **Hoàn toàn bằng tiếng Việt**
   - Dễ đọc, dễ hiểu cho team Việt Nam
   - Thuật ngữ được Việt hóa phù hợp

2. **Tổng hợp từ nhiều nguồn**
   - Kết hợp 3 bộ tài liệu hiện có
   - Loại bỏ trùng lặp, bổ sung thiếu sót
   - Đảm bảo nhất quán

3. **Tập trung vào UX, không có code**
   - Mô tả từ góc độ người dùng
   - Không có implementation details
   - QC và Mobile team đều hiểu được

4. **Có sơ đồ ASCII art**
   - Giao diện được vẽ bằng text
   - Dễ hình dung layout
   - Không cần tool đặc biệt

5. **Có luồng hoạt động (Flow)**
   - Mỗi tính năng có flow chi tiết
   - Hiểu quá trình từ đầu đến cuối
   - Dễ test end-to-end

6. **Có Checklist kiểm thử**
   - QC có sẵn test cases
   - Bao phủ các scenario quan trọng
   - Format dễ copy/paste

7. **Phân quyền rõ ràng**
   - Mỗi tính năng nêu rõ quyền Staff/Leader/Admin
   - Dễ test permission logic

8. **Desktop & Mobile tách biệt**
   - Mỗi tài liệu có section so sánh Desktop vs Mobile
   - Mobile team biết cần implement khác gì

---

## 📞 Hỗ Trợ & Phản Hồi

Nếu có thắc mắc hoặc phát hiện sai sót trong tài liệu:

- **Team Development:** [Thông tin liên hệ]
- **Team QC:** [Thông tin liên hệ]
- **Team Mobile:** [Thông tin liên hệ]

---

## 🔄 Lịch Sử Phiên Bản

| Phiên Bản | Ngày | Người Tạo | Nội Dung |
|-----------|------|-----------|----------|
| 1.0 | 27/01/2026 | Claude AI | Tạo tài liệu chi tiết từng module (from-claude) |
| 1.5 | 27/01/2026 | Copilot | Tạo tài liệu bổ sung (from-copilot) |
| 1.8 | 27/01/2026 | Antigravity | Tạo tài liệu workflow (from-antigravity) |
| **2.0** | **27/01/2026** | **Claude AI** | **Tổng hợp unified documentation** |

---

## 📝 Ghi Chú

- Tài liệu mô tả **thực tế đang chạy** trên website, không phải yêu cầu tương lai
- Nội dung không chứa code, API endpoint, hay technical details
- Chỉ tập trung vào business logic và UX flow
- Tài liệu được chia nhỏ để dễ đọc và dễ tìm kiếm

---

**Chúc team QC và Mobile làm việc hiệu quả!** 🚀
