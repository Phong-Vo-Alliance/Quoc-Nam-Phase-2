# Tổng Quan Hệ Thống - Quốc Nam Portal Internal Chat

> **Phiên bản:** 1.0
> **Ngày cập nhật:** 27/01/2026
> **Dành cho:** Team QC và Team Mobile Development

---

## 📌 Giới Thiệu

**Quốc Nam Portal Internal Chat** là hệ thống chat nội bộ doanh nghiệp được thiết kế để:

- **Giao tiếp nội bộ:** Trao đổi thông tin giữa các phòng ban và nhân viên
- **Quản lý công việc:** Tạo, phân công và theo dõi tiến độ công việc từ tin nhắn
- **Chia sẻ tài liệu:** Upload, xem và quản lý file trong các cuộc hội thoại
- **Theo dõi nhóm:** Leader có thể giám sát hoạt động và công việc của team

---

## 👥 Vai Trò Người Dùng

Hệ thống có 3 vai trò chính:

### 1. Admin (Quản trị viên)
**Quyền hạn:**
- Toàn quyền quản lý hệ thống
- Cấu hình nhóm và danh mục
- Quản lý người dùng

### 2. Leader (Trưởng nhóm)
**Quyền hạn:**
- Xem tất cả cuộc hội thoại trong nhóm mình quản lý
- Tạo và phân công công việc cho nhân viên
- Ghim tin nhắn quan trọng cho cả nhóm
- Thêm/xóa thành viên trong nhóm
- Duyệt công việc đã hoàn thành
- Chuyển thông tin giữa các phòng ban
- Theo dõi tiến độ công việc của team

### 3. Staff (Nhân viên)
**Quyền hạn:**
- Tham gia các cuộc hội thoại được phân công
- Gửi tin nhắn, hình ảnh, file
- Nhận và thực hiện công việc được giao
- Cập nhật trạng thái công việc
- Đánh dấu tin nhắn quan trọng (cá nhân)
- Upload và xem file

---

## 🏗️ Cấu Trúc Giao Diện

### Giao Diện Desktop (3 Cột)

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUỐC NAM PORTAL                            │
├─────────┬──────────────────────────────────┬────────────────────┤
│         │                                  │                    │
│  MAIN   │       CHAT AREA                 │   INFORMATION      │
│ SIDEBAR │   (Khu vực chat chính)          │     PANEL          │
│         │                                  │  (Thông tin chi    │
│  - Navi │   - Header                       │   tiết)            │
│  - User │   - Tin ghim                     │                    │
│         │   - Danh sách tin nhắn          │  - Tabs: Info,     │
│         │   - Ai đang gõ                  │    Tasks, Files,   │
│         │   - Ô nhập tin                  │    Members         │
│         │                                  │  - Các chức năng   │
│         │                                  │    liên quan       │
│         │                                  │                    │
└─────────┴──────────────────────────────────┴────────────────────┘
   90px              flex-grow                    350-400px
```

### Giao Diện Mobile (1 Cột)

```
┌─────────────────────────────────┐
│          HEADER                 │
├─────────────────────────────────┤
│                                 │
│       NỘI DUNG CHÍNH           │
│   (Chuyển đổi giữa các màn)    │
│                                 │
│   - Danh sách hội thoại        │
│   - Khung chat                 │
│   - Chi tiết hội thoại         │
│   - Danh sách công việc        │
│                                 │
├─────────────────────────────────┤
│      BOTTOM NAVIGATION          │
│  [Tin nhắn] [Việc] [Cá nhân]  │
└─────────────────────────────────┘
```

---

## 🎯 Các Tính Năng Chính

### 1. Xác Thực (Authentication)
- Đăng nhập bằng username/password
- Tự động đăng nhập lại khi quay lại
- Đăng xuất an toàn

**📄 Chi tiết:** [01_XAC_THUC.md](./01_XAC_THUC.md)

---

### 2. Hội Thoại (Conversations)
- Xem danh sách hội thoại theo danh mục
- Hiển thị số tin nhắn chưa đọc
- Tìm kiếm hội thoại
- Xem thông tin chi tiết nhóm

**📄 Chi tiết:** [02_HOI_THOAI.md](./02_HOI_THOAI.md)

---

### 3. Nhắn Tin (Chat)
- Gửi tin nhắn văn bản
- Gửi hình ảnh và file đính kèm
- Trả lời tin nhắn (reply)
- Ghim tin nhắn quan trọng (Leader)
- Đánh dấu tin nhắn (cá nhân)
- Nhận tin nhắn real-time
- Xem ai đang gõ

**📄 Chi tiết:** [03_NHAN_TIN.md](./03_NHAN_TIN.md)

---

### 4. Quản Lý Công Việc (Tasks)
- Tạo công việc từ tin nhắn
- Phân công cho nhân viên
- Theo dõi tiến độ (checklist)
- Cập nhật trạng thái công việc
- Duyệt công việc hoàn thành

**Vòng đời công việc:**
```
TODO (Chưa xử lý)
    ↓
DOING (Đang xử lý)
    ↓
NEED_TO_VERIFIED (Chờ duyệt)
    ↓
FINISHED (Hoàn thành)
```

**📄 Chi tiết:** [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md)

---

### 5. Quản Lý File
- Upload file (hình ảnh, PDF, Word, Excel)
- Xem trước file trong ứng dụng
- Tải file về máy
- Lọc file theo loại, người gửi, ngày
- Sắp xếp file theo tên, ngày, kích thước

**📄 Chi tiết:** [05_QUAN_LY_FILE.md](./05_QUAN_LY_FILE.md)

---

### 6. Thành Viên & Nhóm
- Xem danh sách thành viên
- Thêm thành viên mới (Leader)
- Xóa thành viên (Leader)
- Chuyển hội thoại sang nhóm khác (Leader)
- Xem trạng thái online/offline

**📄 Chi tiết:** [06_THANH_VIEN_NHOM.md](./06_THANH_VIEN_NHOM.md)

---

### 7. Thông Tin Nhận & Chuyển Giao
- Leader "nhận thông tin" từ tin nhắn
- Phân công xử lý thông tin
- Chuyển thông tin giữa các phòng ban
- Theo dõi trạng thái xử lý

**📄 Chi tiết:** [07_THONG_TIN_NHAN.md](./07_THONG_TIN_NHAN.md)

---

### 8. Theo Dõi Team (Leader)
- Xem tất cả hội thoại của nhóm
- Theo dõi công việc đang xử lý
- Xem tải công việc của từng thành viên
- Dashboard tổng quan team

**📄 Chi tiết:** [08_THEO_DOI_TEAM.md](./08_THEO_DOI_TEAM.md)

---

### 9. Real-time & Thông Báo
- Nhận tin nhắn ngay lập tức
- Cập nhật số tin chưa đọc real-time
- Hiển thị ai đang gõ
- Thông báo công việc mới
- Thông báo được mention

**📄 Chi tiết:** [09_REALTIME_THONG_BAO.md](./09_REALTIME_THONG_BAO.md)

---

### 10. Tính Năng Mobile
- Giao diện tối ưu cho màn hình nhỏ
- Bottom sheet thay vì modal
- Long-press cho context menu
- Pull-to-refresh
- Bottom navigation

**📄 Chi tiết:** [10_MOBILE.md](./10_MOBILE.md)

---

## 🔄 Luồng Sử Dụng Chính

### Luồng 1: Nhân viên nhận và xử lý công việc

```
[Đăng nhập]
    ↓
[Vào màn hình chính]
    ↓
[Xem danh sách hội thoại] → [Có badge số tin chưa đọc]
    ↓
[Chọn hội thoại]
    ↓
[Đọc tin nhắn mới]
    ↓
[Nhận thông báo có công việc mới]
    ↓
[Mở tab Công việc trong panel phải]
    ↓
[Xem chi tiết công việc]
    ↓
[Click "Bắt đầu làm"] → Trạng thái: TODO → DOING
    ↓
[Thực hiện và check các mục trong checklist]
    ↓
[Hoàn thành] → Click "Hoàn thành" → Trạng thái: DOING → NEED_TO_VERIFIED
    ↓
[Leader duyệt] → Trạng thái: NEED_TO_VERIFIED → FINISHED
```

---

### Luồng 2: Leader tạo và phân công công việc

```
[Đăng nhập với role Leader]
    ↓
[Vào hội thoại cần theo dõi]
    ↓
[Đọc tin nhắn có thông tin cần xử lý]
    ↓
[Hover tin nhắn] → [Click icon "Tạo công việc"]
    ↓
[Modal "Tạo công việc" mở ra]
    ↓
[Tiêu đề tự động điền từ nội dung tin nhắn]
    ↓
[Chọn nhân viên được giao]
    ↓
[Chọn template checklist (nếu có)]
    ↓
[Chọn độ ưu tiên]
    ↓
[Click "Tạo"] → Công việc được tạo và liên kết với tin nhắn
    ↓
[Nhân viên nhận thông báo công việc mới]
    ↓
[Leader theo dõi tiến độ trong tab Công việc]
    ↓
[Khi nhân viên hoàn thành, Leader duyệt]
```

---

### Luồng 3: Gửi tin nhắn có file đính kèm

```
[Trong màn hình chat]
    ↓
[Click nút đính kèm 📎]
    ↓
[Chọn file từ máy] (có thể chọn nhiều file)
    ↓
[File được hiển thị preview trong ô nhập]
    ↓
[Gõ nội dung tin nhắn (tùy chọn)]
    ↓
[Click "Gửi"]
    ↓
[File được upload và tin nhắn được gửi]
    ↓
[Người khác nhận tin nhắn với file đính kèm]
    ↓
[Click file để xem trước hoặc tải về]
```

---

### Luồng 4: Leader nhận và chuyển thông tin

```
[Leader đọc tin nhắn có thông tin quan trọng]
    ↓
[Hover tin nhắn] → [Click "Nhận thông tin"]
    ↓
[Modal "Nhận thông tin" mở]
    ↓
[Chọn loại thông tin]
    ↓
[Phân công cho nhân viên xử lý] HOẶC [Chuyển sang phòng ban khác]
    ↓
Nếu phân công cho nhân viên:
  [Tạo công việc tự động]
  [Nhân viên nhận thông báo]

Nếu chuyển phòng ban:
  [Leader phòng ban kia nhận thông tin]
  [Leader đó quyết định xử lý tiếp]
```

---

## 📱 Sự Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Layout** | 3 cột (Sidebar - Chat - Info Panel) | 1 cột (chuyển màn) |
| **Navigation** | Sidebar cố định | Bottom tabs |
| **Modal** | Modal popup ở giữa màn | Bottom sheet |
| **Context menu** | Hover hiện menu | Long-press |
| **Info panel** | Luôn hiển thị bên phải | Màn hình riêng |
| **Refresh** | Auto refresh | Pull-to-refresh |
| **File preview** | Modal lớn | Full screen |
| **Task detail** | Panel bên phải | Màn hình riêng |

---

## 🔐 Bảo Mật & Quyền Hạn

### Phân quyền theo vai trò:

| Chức năng | Staff | Leader | Admin |
|-----------|:-----:|:------:|:-----:|
| Gửi tin nhắn | ✅ | ✅ | ✅ |
| Ghim tin nhắn | ❌ | ✅ | ✅ |
| Đánh dấu tin nhắn (star) | ✅ | ✅ | ✅ |
| Tạo công việc | ❌ | ✅ | ✅ |
| Nhận công việc | ✅ | ✅ | ✅ |
| Phân công lại công việc | ❌ | ✅ | ✅ |
| Duyệt công việc | ❌ | ✅ | ✅ |
| Thêm/xóa thành viên | ❌ | ✅ | ✅ |
| Nhận thông tin | ❌ | ✅ | ✅ |
| Chuyển nhóm | ❌ | ✅ | ✅ |
| Xem tất cả hội thoại | ❌ | ✅ | ✅ |
| Cấu hình hệ thống | ❌ | ❌ | ✅ |

---

## 📊 Các Trạng Thái Quan Trọng

### Trạng thái Tin nhắn:
- **Đang gửi:** ⏳ (hiển thị spinner)
- **Đã gửi:** ✓ (1 dấu tích)
- **Đã đọc:** ✓✓ (2 dấu tích)
- **Lỗi:** ⚠️ (hiện nút "Gửi lại")

### Trạng thái Công việc:
- **TODO:** Chưa xử lý (màu xám)
- **DOING:** Đang xử lý (màu xanh)
- **NEED_TO_VERIFIED:** Chờ duyệt (màu vàng)
- **FINISHED:** Hoàn thành (màu xanh lá)

### Trạng thái Thành viên:
- **Online:** Đang trực tuyến (chấm xanh)
- **Offline:** Ngoại tuyến (chấm xám)
- **Đang gõ:** Hiển thị "... đang nhập"

---

## 🎨 Các Thành Phần UI Chính

### Danh sách Hội thoại:
- Avatar nhóm/người dùng
- Tên hội thoại
- Tin nhắn cuối cùng (preview)
- Thời gian tin nhắn cuối
- Badge số tin chưa đọc (nếu có)
- Chấm online (nếu là chat 1-1)

### Tin Nhắn:
- Avatar người gửi
- Tên người gửi
- Thời gian gửi
- Nội dung tin nhắn
- File đính kèm (nếu có)
- Trạng thái tin nhắn (đã gửi/đọc)
- Menu actions (hover hoặc long-press)

### Thẻ Công việc:
- Icon loại công việc
- Tiêu đề công việc
- Người được giao (avatar + tên)
- Người giao (nếu là Leader view)
- Badge trạng thái
- Progress bar checklist (X/Y mục)
- Thời gian tạo/cập nhật
- Nút actions (tùy quyền)

### File Card:
- Icon/thumbnail file
- Tên file
- Kích thước file
- Người upload
- Thời gian upload
- Nút xem trước/tải về

---

## 🔄 Cập Nhật Real-time

Các sự kiện được cập nhật real-time qua SignalR:

1. **Tin nhắn mới:** Hiển thị ngay lập tức trong chat
2. **Số tin chưa đọc:** Badge cập nhật tự động
3. **Ai đang gõ:** Hiển thị indicator "... đang nhập"
4. **Tin nhắn đã đọc:** Cập nhật trạng thái ✓✓
5. **Công việc mới:** Thông báo và cập nhật danh sách
6. **Trạng thái thành viên:** Online/offline cập nhật ngay
7. **Ghim tin nhắn:** Hiển thị trong danh sách tin ghim
8. **File mới:** Hiển thị trong tab Files

---

## 📋 Checklist Kiểm Thử Chính

### Authentication:
- [ ] Đăng nhập thành công → Redirect về trang chính
- [ ] Đăng nhập sai thông tin → Hiển thị lỗi
- [ ] Đăng xuất → Xóa dữ liệu và về trang login
- [ ] Token hết hạn → Tự động đăng xuất

### Chat:
- [ ] Gửi tin nhắn text → Hiển thị trong danh sách
- [ ] Gửi tin nhắn có file → File được upload và hiển thị
- [ ] Nhận tin nhắn real-time → Hiển thị ngay lập tức
- [ ] Badge số tin chưa đọc → Cập nhật chính xác
- [ ] Cuộn lên trên → Load tin nhắn cũ hơn
- [ ] Reply tin nhắn → Hiển thị trích dẫn đúng
- [ ] Ghim tin nhắn → Hiển thị trong danh sách tin ghim
- [ ] Đánh dấu tin nhắn → Hiển thị trong starred messages

### Tasks:
- [ ] Tạo công việc từ tin nhắn → Liên kết đúng
- [ ] Phân công công việc → Người được giao nhận thông báo
- [ ] Cập nhật trạng thái → Quyền hạn được kiểm tra
- [ ] Check item trong checklist → Progress cập nhật
- [ ] Hoàn thành công việc → Leader nhận thông báo duyệt
- [ ] Leader duyệt → Trạng thái chuyển FINISHED

### Files:
- [ ] Upload single file → Upload thành công
- [ ] Upload nhiều file → Tất cả được upload
- [ ] Xem trước hình ảnh → Modal mở đúng
- [ ] Xem trước PDF → Viewer load đúng
- [ ] Xem trước Excel → Hiển thị bảng
- [ ] Xem trước Word → Hiển thị nội dung
- [ ] Tải file → Download thành công

### Real-time:
- [ ] Tin nhắn mới → Hiển thị ngay không delay
- [ ] Badge unread → Cập nhật real-time
- [ ] Typing indicator → Hiển thị đúng người đang gõ
- [ ] Online status → Cập nhật khi user online/offline

---

## 📞 Hỗ Trợ & Liên Hệ

Nếu có câu hỏi về tài liệu này, vui lòng liên hệ:

- **Team Development:** [Thông tin liên hệ]
- **Team QC:** [Thông tin liên hệ]
- **Team Mobile:** [Thông tin liên hệ]

---

## 📚 Các Tài Liệu Liên Quan

1. [01_XAC_THUC.md](./01_XAC_THUC.md) - Xác thực và phân quyền
2. [02_HOI_THOAI.md](./02_HOI_THOAI.md) - Danh sách và quản lý hội thoại
3. [03_NHAN_TIN.md](./03_NHAN_TIN.md) - Gửi và nhận tin nhắn
4. [04_QUAN_LY_CONG_VIEC.md](./04_QUAN_LY_CONG_VIEC.md) - Quản lý công việc
5. [05_QUAN_LY_FILE.md](./05_QUAN_LY_FILE.md) - Quản lý file và tài liệu
6. [06_THANH_VIEN_NHOM.md](./06_THANH_VIEN_NHOM.md) - Quản lý thành viên
7. [07_THONG_TIN_NHAN.md](./07_THONG_TIN_NHAN.md) - Nhận và chuyển thông tin
8. [08_THEO_DOI_TEAM.md](./08_THEO_DOI_TEAM.md) - Theo dõi team (Leader)
9. [09_REALTIME_THONG_BAO.md](./09_REALTIME_THONG_BAO.md) - Real-time & thông báo
10. [10_MOBILE.md](./10_MOBILE.md) - Tính năng mobile

---

**Phiên bản:** 1.0
**Ngày cập nhật:** 27/01/2026
**Người tạo:** Development Team
**Trạng thái:** ✅ Hoàn thành
