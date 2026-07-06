# FSD — Admin Site (Phase 2)
## Functional Specification Document cho Phát triển Production

> **Mục đích:** Mô tả chi tiết từng chức năng quản trị Phase 2 trên Admin Site (giao diện admin nội bộ) — bao gồm trang Nhà Cung Cấp, trang Quản lý Nhóm NCC, trang Yêu cầu xem SĐT và modal Quản lý thẻ phân loại — để Dev nắm rõ business flow, requirements và edge cases trước khi code.
>
> **Phiên bản:** 1.0.0 · **Cập nhật:** 2026-06-12

---

## 1. Tổng quan tài liệu

### 1.1 Đối tượng đọc

- **Developer (chính):** đọc để hiểu cần implement gì cho từng chức năng quản trị.
- **Business Analyst (BA):** dùng làm nguồn để chuyển thành slide kèm mockup demo.
- **QA / Tester:** dùng làm cơ sở để viết test case nghiệm thu.

### 1.2 Phạm vi tài liệu

Tài liệu này mô tả **các chức năng quản trị trên Admin Site** — giao diện admin nội bộ để cấu hình, đồng bộ, phân quyền và duyệt yêu cầu liên quan đến tích hợp Zalo Vendor.

**Nguyên tắc phân chia tài liệu:**

- Một feature có thể được implement ở cả Admin Site lẫn Chat Portal (ví dụ: Admin đổi tên hiển thị nhóm ở Admin Site, Staff thấy tên mới ở Portal). Trong trường hợp đó, **mỗi tài liệu chỉ mô tả phần thuộc UI tương ứng**, không lặp lại.
- Các tính năng **chỉ có UI trên Chat Portal** (chat input, ghim hội thoại per-user, hover menu tin, watermark khi xem ảnh, …) **không xuất hiện trong tài liệu này** — xem `FSD-Chat-Portal.md`.

**Nhóm chức năng có phần thuộc Admin Site:**

| Nhóm | Tên | Mô tả phạm vi Admin Site |
|---|---|---|
| A | Kết nối Zalo | Quét QR liên kết tài khoản (#1) + kích hoạt sync thủ công (#21 = #2/#3/#4 backend) |
| C | Quản lý hội thoại | Đổi tên hiển thị nhóm NCC (#26 Admin side), Toggle ẩn/hiện SĐT theo nhóm (#28 Admin side), Filter chips theo thẻ phân loại (#31 Admin side) |
| D | Phân quyền & Multi-account | Gán nhân viên đại diện tài khoản Zalo (#15), Thêm/xóa staff khỏi nhóm NCC (#16 Admin side), Per-staff per-group override "Đại diện qua" (D.4(b)) |
| F | Admin Site (group chính) | #20, #21, #22, #24, #29, #30 |

### 1.3 Vai trò & Thuật ngữ chính

| Thuật ngữ | Định nghĩa ngắn |
|---|---|
| **Admin** | Quản trị nội bộ, người duy nhất truy cập Admin Site và thực hiện thao tác quản trị NCC. |
| **Staff** | Nhân viên nội bộ — đối tượng được Admin phân quyền. Staff **không** vào Admin Site. |
| **Vendor** | Nhà cung cấp — chỉ tương tác qua Zalo, không truy cập Portal. |
| **Vendor Group** | Nhóm chat NCC trên Zalo đã đồng bộ vào Portal. Tương đương "nhóm NCC" trong UI. |
| **Zalo Account** | Tài khoản Zalo cá nhân đã liên kết, đóng vai trò "đại diện công ty" trong nhóm Zalo. |
| **Acting As** | Tài khoản Zalo mà một staff đang "đại diện" khi gửi tin trong vendor group. Admin có thể override per-staff per-group (D.4(b)). |

### 1.4 Quy ước ký hiệu

- **#XX**: mã định danh tính năng — dùng để đối chiếu với test case nghiệm thu (Mốc 1–4 trong scope doc).
- **[EXTRA]**: tính năng mở rộng đã làm trong demo, không có trong scope nghiệp vụ ban đầu, nhưng cần để hệ thống hoạt động đúng.
- **FR-XX.n**: Functional Requirement thứ n của tính năng #XX (dùng để map vào test case).
- **Admin-only**: chỉ Admin thấy / thao tác được.

### 1.5 Cấu trúc sidebar Admin Site (phạm vi Phase 2)

Phase 2 bổ sung vào sidebar Admin Site một group mới **"Quản Lý NCC"** với 3 mục:

| # | Mục sidebar | Page | Tài liệu mô tả ở section |
|---|---|---|---|
| 1 | **Nhà Cung Cấp** | `NhaCungCapPage` — 3 tabs | [§ 2](#2-trang-nhà-cung-cấp) |
| 2 | **Nhóm NCC** | `NhomNCCPage` | [§ 3](#3-trang-nhóm-ncc) |
| 3 | **Yêu Cầu Xem SĐT** (badge "Mới") | `YeuCauXemSdtPage` | [§ 5](#5-trang-yêu-cầu-xem-sđt) |

Modal **Quản lý thẻ phân loại** (#30) là modal cross-page, mở từ header trang Nhóm NCC (xem [§ 4](#4-quản-lý-thẻ-phân-loại-modal-cross-page)).

Các group sidebar khác (Quản Lý Phòng Ban & Nhóm chat, Quản Lý Loại Việc, Quản Lý User & Phân Quyền, Quản Lý Dạng Checklist, Quản Lý Trạng Thái Công việc, Cài Đặt, Nhật Ký) thuộc **Phase 1**, không nằm trong tài liệu này.

> **Lưu ý — Link "← Về Portal" ở header demo:** Trong bản demo có link `← Về Portal` góc trên trái phục vụ điều hướng nhanh giữa 2 UI. Đây là **demo-only**, không đưa vào production.

### 1.6 Tài liệu tham chiếu

| Tài liệu | Mục đích |
|---|---|
| `FSD-Chat-Portal.md` | Spec phần Chat Portal + quy tắc hiển thị tên người gửi (Section 6 scope doc) + style spec G.2 PinNotificationBubble. |
| `scope-and-features.md` | Source of truth nghiệp vụ Phase 2 (31 tính năng, 6 nhóm A–G). |
| Demo source code (`src/features/admin-demo/`) | Tham chiếu UI/UX, behavior thực tế đã build cho Admin Site. |

### 1.7 Quy ước nghiệp vụ áp dụng cho mọi page trong tài liệu này

- **Quyền truy cập:** mọi page mô tả ở đây đều **Admin-only**. Staff không có entry point vào Admin Site.
- **Backend enforce:** mọi action (gán quyền, xóa quyền, duyệt request, đổi tên, đổi thẻ…) phải enforce ở backend, không trust client.
- **Audit:** mọi thao tác liên quan đến số điện thoại ẩn (#28/#29) phải sinh system message ghi nhận actor + timestamp + lý do (xem `FSD-Chat-Portal.md` § hiển thị system message trong vendor group).
- **Hiển thị tên người dùng:** trong các bảng và modal của Admin Site, tên staff/admin hiển thị dạng `displayName` chuẩn — không có format `Z.displayName (StaffName)` (format đó chỉ áp dụng trong cửa sổ chat của vendor group, xem cross-cutting rules trong `FSD-Chat-Portal.md`).

---

## 2. Trang Nhà Cung Cấp

> **Phạm vi page:** quản trị tài khoản Zalo cá nhân đã liên kết — liên kết mới, gán nhân viên đại diện, đồng bộ dữ liệu, theo dõi file lớn đã đồng bộ về.
>
> **Cấu trúc page:** header tiêu đề + **3 tabs**:
> | # | Tab | Tính năng | Section |
> |---|---|---|---|
> | 1 | **Liên kết tài khoản** | #1, #20, #15 (gán nhân viên) | [§ 2.2](#22-tab-liên-kết-tài-khoản--1-20-15) |
> | 2 | **Đồng bộ dữ liệu** | #21 (gồm trigger backend #2, #3, #4) | [§ 2.3](#23-tab-đồng-bộ-dữ-liệu--21) |
> | 3 | **Theo dõi file lớn** | #24 | [§ 2.4](#24-tab-theo-dõi-file-lớn--24) |

### 2.1 Cross-cutting page-level

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site |

#### Mục tiêu

Cung cấp một entry point thống nhất cho mọi nghiệp vụ "tài khoản Zalo": từ thêm tài khoản mới → gán nhân viên đại diện → đồng bộ dữ liệu → theo dõi nội dung đã đồng bộ về.

#### Yêu cầu chức năng

- **FR-NCC.1:** Page có header với tiêu đề "Nhà Cung Cấp" và tab navigation 3 tab. Mặc định mở **Tab 1 — Liên kết tài khoản**.
- **FR-NCC.2:** Tab navigation luôn hiển thị, sticky khi scroll body content.
- **FR-NCC.3:** Counter/badge bên cạnh tab thể hiện số lượng (nếu có) — ví dụ: tab 1 có thể hiển thị "(N) tài khoản đã liên kết", tab 3 có thể hiển thị tổng số file > 300MB chưa xem.

#### Trạng thái UI & Edge Cases

- **Không có tài khoản Zalo nào đã liên kết:** Tab 1 hiển thị empty state với CTA chính "Liên kết tài khoản Zalo đầu tiên"; Tab 2 và Tab 3 hiển thị message "Chưa có tài khoản nào để đồng bộ / chưa có dữ liệu file lớn".

#### Mockup tham chiếu

> [BA bổ sung] — Header page với 3 tab chip; empty state cho từng tab khi chưa có dữ liệu.

---

### 2.2 Tab Liên kết tài khoản · #1, #20, #15

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (Tab 1 của trang Nhà Cung Cấp) |
| **Liên quan Portal** | Banner trạng thái kết nối (Chat Portal — § Nhóm A) sẽ hiển thị theo trạng thái cấu hình ở đây. |

#### Mục tiêu

Cho phép Admin:
1. **Liên kết** một tài khoản Zalo cá nhân mới vào hệ thống bằng QR (#1).
2. **Xem** danh sách tài khoản đã liên kết kèm trạng thái kết nối (#20).
3. **Gán** danh sách nhân viên được phép "đại diện" mỗi tài khoản (#15).
4. **Ngắt kết nối** hoặc **kết nối lại** tài khoản khi cần thiết.

#### Business Flow

**A. Liên kết tài khoản mới (#1):**

1. Admin nhấn nút **"+ Liên kết tài khoản mới"** ở góc trên phải tab.
2. Modal **"Liên kết tài khoản Zalo mới"** mở:
   - Hướng dẫn ngắn: *"Mở ứng dụng Zalo trên điện thoại, chọn Quét mã QR và hướng camera vào mã bên dưới."*
   - Khu vực hiển thị QR code (do backend sinh).
   - Trạng thái dưới QR: **"Đang chờ quét mã QR..."** (icon loading).
3. Khi tài khoản Zalo được quét và xác nhận thành công ở `chat.zalo.me` → backend nhận event → modal tự động đóng → row tài khoản mới xuất hiện trong bảng (trạng thái `connected`).
4. Backend tự kích hoạt sync nhóm chat ban đầu (#2) ngay sau khi liên kết — xem chi tiết Tab 2 (§ 2.3).

**B. Gán nhân viên đại diện cho tài khoản (#15):**

1. Trong bảng tài khoản, mỗi row có nút/khu vực hiển thị "Nhân viên đại diện".
2. Admin nhấn → mở modal **"Gán nhân viên — [Tên tài khoản]"**.
3. Modal hiển thị:
   - Thanh tìm kiếm (search by tên nhân viên).
   - Dropdown filter **"Tất cả phòng"** (filter theo phòng ban).
   - Danh sách nhân viên (avatar + tên + phòng ban).
   - Checkbox tròn xanh ✓ ở phải mỗi row khi được chọn.
   - Footer: counter "N nhân viên được chọn" + nút **Huỷ** / **Lưu** (xanh).
4. Admin chọn/bỏ chọn nhân viên → nhấn **Lưu**.
5. Sau khi lưu, danh sách nhân viên đại diện được cập nhật.

**C. Xem & xóa nhanh nhân viên đã gán:**

1. Trong row tài khoản, danh sách nhân viên đại diện hiển thị dưới dạng **chip avatar/tên** (tối đa 2–3 chip + chip `+N` nếu nhiều).
2. Admin nhấn vào tài khoản (expand) → hiển thị đầy đủ danh sách chips từng nhân viên.
3. Mỗi chip có **nút X nhỏ** — Admin nhấn để xóa nhanh nhân viên đó khỏi danh sách đại diện mà không cần mở modal "Gán nhân viên" đầy đủ.

**D. Ngắt kết nối / Kết nối lại:**

1. Mỗi row có dropdown more menu (⋯) hoặc nút **"Ngắt kết nối"** (hiển thị theo trạng thái hiện tại của tài khoản).
2. Khi tài khoản đang `connected` / `unstable` → nút **"Ngắt kết nối"** — confirm dialog cảnh báo: *"Sau khi ngắt, mọi tin nhắn từ các nhóm đang sync qua tài khoản này sẽ tạm dừng cập nhật. Bạn có chắc chắn?"*
3. Khi tài khoản `disconnected` / `expired` → nút **"Kết nối lại"** — mở modal QR (giống flow A) nhưng pre-fill thông tin tài khoản cũ. Sau khi quét QR thành công → trạng thái về `connected`.

#### Yêu cầu chức năng

- **FR-NCC.4 (#1 + #20):** Tab có nút **"+ Thêm tài khoản Zalo"** mở modal QR. Modal phải có: hướng dẫn, QR placeholder, trạng thái "Đang chờ quét...", nút **Huỷ**. Khi quét xong → đóng modal tự động.
- **FR-NCC.5 (#20):** Bảng danh sách tài khoản đã liên kết — mỗi row hiển thị: avatar, display name, phone (nếu có), thời điểm liên kết, badge trạng thái (`connected` / `unstable` / `disconnected` / `expired`), danh sách chip nhân viên đại diện, nút thao tác (gán nhân viên, ngắt/kết nối lại).
- **FR-NCC.6 (#15 — modal gán):** Modal "Gán nhân viên" hỗ trợ multi-select; có search theo tên; có filter dropdown phòng ban; footer hiển thị counter "N nhân viên được chọn". Lưu lúc nhấn nút **Lưu**, Huỷ không thay đổi.
- **FR-NCC.7 (#15 — xóa nhanh chip):** Khi tài khoản được expand, mỗi chip nhân viên có nút X nhỏ để xóa nhanh khỏi danh sách đại diện mà không cần mở modal đầy đủ.
- **FR-NCC.8 (#27 — ngắt/kết nối):** Nút thao tác hiển thị theo trạng thái: trạng thái lành mạnh → "Ngắt kết nối" (kèm confirm); trạng thái lỗi/expired → "Kết nối lại" (mở modal QR pre-fill).
- **FR-NCC.9 (badge trạng thái):** Badge dùng màu nhất quán: `connected` = xanh, `unstable` = vàng/hổ phách, `disconnected` = đỏ, `expired` = đỏ với icon khoá.

#### Trạng thái UI & Edge Cases

- **Không có nhân viên nào trong hệ thống** (Phase 1 chưa setup) → modal "Gán nhân viên" hiển thị empty state với gợi ý "Thêm nhân viên ở mục Quản Lý User & Phân Quyền trước".
- **Tài khoản expired trong khi modal QR đang mở** → backend báo lỗi, hiển thị message inline trong modal, vẫn cho phép quét lại.
- **Một nhân viên có thể được gán cho nhiều tài khoản Zalo** — không hạn chế (D.1 trong scope doc).
- **Một tài khoản có thể được gán cho nhiều nhân viên** — không hạn chế (D.1 trong scope doc).
- **Khi Admin ngắt kết nối tài khoản đang sync nhiều nhóm:** các vendor group đó hiển thị banner "Mất kết nối Zalo" ở Chat Portal (xem `FSD-Chat-Portal.md` § Nhóm A).
- **Demo-only:** trong demo modal QR có link nhỏ *"(Demo) Nhấn để giả lập quét QR thành công"* để bypass quá trình quét thật — **không đưa vào production**.

#### Mockup tham chiếu

> [BA bổ sung] — Đã có 3 mockup: (1) Bảng tài khoản đã liên kết, (2) Modal "Liên kết tài khoản Zalo mới" với QR, (3) Modal "Gán nhân viên — [Tên tài khoản]" với search + filter phòng + checkbox đa chọn + footer counter.

---

### 2.3 Tab Đồng bộ dữ liệu · #21

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (Tab 2 của trang Nhà Cung Cấp) |
| **Liên quan backend** | Trigger #2 (sync nhóm chat), #3 (sync tin real-time), #4 (sync lịch sử cũ). |

#### Mục tiêu

Cho Admin kích hoạt **sync thủ công** cho từng tài khoản Zalo đã liên kết và xem **báo cáo tóm tắt** + **lịch sử** các lần sync trước đó.

#### Business Flow

1. Tab 2 hiển thị danh sách tài khoản đã liên kết, mỗi tài khoản là **một card riêng**.
2. Mỗi card chứa:
   - Header: avatar + tên + badge trạng thái kết nối.
   - Nút **"Đồng bộ ngay"** (xanh).
   - **Stats grid 6 ô** hiển thị kết quả lần sync gần nhất: tổng tin nhắn / hình ảnh / tài liệu / video / dung lượng tổng / **số file video > 300MB** (link click sang Tab 3).
   - Khi đang sync: nút biến thành **progress bar** với label "Đang đồng bộ... X%".
   - Khu vực **"Lịch sử đồng bộ"** (collapsible) bên dưới — bảng các lần sync trước (timestamp / số tin / dung lượng / kết quả: thành công / lỗi).
3. Admin nhấn **"Đồng bộ ngay"** → backend kích hoạt #2 + #3 + #4 cho tài khoản đó.
4. Sau khi hoàn tất:
   - Toast thông báo "Đồng bộ xong: X tin nhắn từ Y nhóm".
   - Stats grid cập nhật.
   - Một entry mới được thêm vào "Lịch sử đồng bộ".

#### Yêu cầu chức năng

- **FR-NCC.10:** Mỗi tài khoản hiển thị 1 card sync độc lập. Nút "Đồng bộ ngay" disabled khi tài khoản đang ở trạng thái `disconnected` / `expired` (tooltip giải thích).
- **FR-NCC.11:** Stats grid hiển thị 6 chỉ số đúng theo scope (#21). Số file video > 300MB là **link** điều hướng sang Tab 3 với filter pre-set theo tài khoản này.
- **FR-NCC.12:** Lịch sử đồng bộ hiển thị tối thiểu 10 entry gần nhất, có pagination/load more nếu nhiều hơn. Mỗi entry hiển thị: thời điểm bắt đầu, thời điểm kết thúc, tổng tin, kết quả.
- **FR-NCC.13:** Không cho phép 2 lần sync chồng nhau trên cùng tài khoản — nút "Đồng bộ ngay" disabled trong khi đang sync.

#### Trạng thái UI & Edge Cases

- **Sync bị lỗi giữa chừng (mất mạng / Zalo block):** progress bar chuyển thành banner đỏ "Đồng bộ thất bại — [lý do]" + nút "Thử lại"; entry trong lịch sử ghi nhận `failed`.
- **Sync lần đầu cho tài khoản mới liên kết:** không cần Admin nhấn — backend tự kích hoạt khi #1 thành công; tab này hiển thị progress đang chạy.
- **Tài khoản đang `unstable`:** vẫn cho phép sync, nhưng cảnh báo "Kết nối không ổn định — đồng bộ có thể chậm hoặc thất bại từng phần".

#### Mockup tham chiếu

> [BA bổ sung] — Card sync per-account với header + stats grid 6 ô + nút "Đồng bộ ngay" + lịch sử expand. Cần thêm: trạng thái khi đang sync (progress bar) và trạng thái lỗi.

---

### 2.4 Tab Theo dõi file lớn · #24

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (Tab 3 của trang Nhà Cung Cấp) |
| **Liên quan** | #6 cảnh báo nội bộ trong chat khi gửi video > 300MB (Chat Portal). |

#### Mục tiêu

Cho Admin **theo dõi** mọi file video > 300MB đã được đồng bộ về hệ thống, hỗ trợ lọc, sắp xếp, và xác định nhanh các file có nguy cơ ảnh hưởng dung lượng / hiệu năng.

#### Business Flow

1. Tab 3 hiển thị **filter bar** ở trên + **bảng danh sách file lớn** bên dưới.
2. Filter bar có:
   - Filter theo **nhóm chat** (dropdown chọn nhóm NCC).
   - Filter theo **khoảng thời gian** (date range picker).
   - Filter theo **tài khoản Zalo** (dropdown).
3. Bảng cột: **Tên file** / **Dung lượng** (badge color-coded theo ngưỡng) / **Nhóm chat** / **Người gửi** / **Thời điểm nhận**.
4. Mặc định sort: thời điểm nhận **mới nhất trước**.
5. Hover row → hiển thị 1 action: **"Mở trong chat"** (điều hướng sang Chat Portal mở nhóm + scroll-to tin chứa file).

#### Yêu cầu chức năng

- **FR-NCC.14:** Bảng chỉ hiển thị file có `mimeType` là video AND `size > 300MB`. Định nghĩa "300MB" = 300 × 1024 × 1024 bytes (decimal MB = 300 × 1_000_000 có thể dùng nếu BA thống nhất khác).
- **FR-NCC.15:** Badge dung lượng color-coded theo ngưỡng:
  - `300–500MB`: vàng (cảnh báo nhẹ).
  - `500MB–1GB`: cam.
  - `> 1GB`: đỏ.
- **FR-NCC.16:** Filter "Nhóm chat" có search-in-dropdown khi danh sách nhóm > 10 mục.
- **FR-NCC.17:** Khi Admin click "Mở trong chat" → navigate sang Chat Portal với routing pre-filled (open group + scroll-to message).
- **FR-NCC.18:** Tab 3 nhận pre-set filter khi được mở từ link "Số file video > 300MB" trên Tab 2 (pre-filter theo tài khoản đó).

#### Trạng thái UI & Edge Cases

- **Không có file nào đạt ngưỡng:** empty state với icon Video + message *"Chưa có file video lớn nào được đồng bộ về"*.
- **Filter kết hợp ra 0 kết quả:** empty state khác *"Không có file phù hợp với bộ lọc hiện tại"* + nút "Đặt lại bộ lọc".
- **File đã bị thu hồi từ Zalo:** vẫn hiển thị trong bảng (Admin có quyền xem audit), với label nhỏ "(Đã thu hồi)" cạnh tên file.
- **File bị xóa khỏi storage do retention policy:** hiển thị grayed out, action "Mở trong chat" disabled với tooltip "File không còn khả dụng".

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: filter bar (3 dropdown) + bảng với badge dung lượng color-coded. Cần thêm: empty state khi không có dữ liệu.

---

## 3. Trang Nhóm NCC

> **Phạm vi page:** trang điều hành chính cho mọi nghiệp vụ "nhóm NCC" — bảng danh sách nhóm + bộ lọc + thao tác per-nhóm (thêm/xóa staff, đổi tên, gắn thẻ, ghim hội thoại, toggle ẩn SĐT, override account đại diện per-staff).
>
> **Cấu trúc page:**
> ```
> Header: tiêu đề "Nhóm NCC" + nút "Quản lý thẻ phân loại" + counter "N nhóm đã đồng bộ" + counter "M đang ẩn SĐT"
> Filter row: search nhóm + search nhân viên + dropdown "Tất cả tài khoản"
> Tabs ẩn SĐT: Tất cả · Đang ẩn SĐT · Đang hiện SĐT (với counter)
> Tag chip row: Tất cả · [chip thẻ phân loại]…
> Bảng nhóm NCC (cột: ▸ / Tên nhóm + pin + thẻ / Tên gốc Zalo / Tài khoản / NV nội bộ / Ẩn SĐT / Thao tác)
>   └─ Expanded row: bảng staff trong nhóm + cột "Đại diện qua" (D.4(b))
> ```
> Modal sub-component liên quan: **Thêm nhân viên vào nhóm**, **Đặt tên gợi nhớ** (#26), **Quản lý thẻ phân loại** (#30 — § 4).

### 3.1 Cross-cutting page-level

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site |
| **Tính năng gộp** | #22, #16 (Admin side), #26 (Admin side), #28 (Admin side), #31 (Admin side), D.4(b), [EXTRA] ghim hội thoại Admin-perspective |

#### Mục tiêu

Cung cấp **một bảng tập trung** để Admin quản lý mọi nhóm NCC đã đồng bộ: từ phân quyền nhân viên → đổi tên → bảo mật SĐT → phân loại thẻ → cấu hình account đại diện per-staff.

#### Business Flow tổng quan

1. Admin vào trang → bảng load toàn bộ nhóm NCC đã đồng bộ.
2. Admin có thể:
   - **Lọc** nhóm theo: tên nhóm, có chứa nhân viên cụ thể, tài khoản Zalo đang sync, trạng thái ẩn SĐT, thẻ phân loại.
   - **Click ▸** vào row → expand để xem chi tiết staff trong nhóm.
   - **Thao tác inline** trên row: đổi tên nhóm (#26), thêm nhân viên (#16), more menu (Phân loại / Ghim hội thoại).
   - **Toggle ẩn SĐT** (#28) per-nhóm — chuyển trạng thái ngay tức thì.
3. Tag chip row + tabs ẩn SĐT cho phép Admin **lọc nhanh** danh sách.
4. Nút **"Quản lý thẻ phân loại"** ở header mở modal #30 (xem § 4).

#### Yêu cầu chức năng

- **FR-NHOM.1 (header):** Header hiển thị tiêu đề "Nhóm NCC" + nút **"Quản lý thẻ phân loại"** (mở modal #30) + counter động "N nhóm đã đồng bộ" + chip cam **"M đang ẩn SĐT"** (M = số nhóm đang `phoneHidden=true`).
- **FR-NHOM.2 (filter row):** 3 ô filter ở filter row:
  - **Tìm theo tên nhóm…** (search input, match theo `groupDisplayName` hoặc `groupOriginalName`).
  - **Tìm theo tên nhân viên…** (search input, lọc nhóm có chứa staff khớp tên).
  - **Tất cả tài khoản** (dropdown, lọc nhóm có tài khoản Zalo nào đang sync).
  - Các filter cộng dồn (AND).
- **FR-NHOM.3 (tabs ẩn SĐT):** 3 tabs ngang dưới filter row: **Tất cả (N)** · **Đang ẩn SĐT (M)** · **Đang hiện SĐT (N–M)**. Click tab thay đổi filter `phoneHidden`. Active tab có underline + counter badge nổi bật.
- **FR-NHOM.4 (tag chip row):** Hàng chip ngay dưới tabs: **"Tất cả"** + từng chip thẻ phân loại (màu + tên). Click chip để filter theo thẻ. Khi không có thẻ nào được chọn, chip "Tất cả" active.
- **FR-NHOM.5 (bảng cột):** Bảng có 7 cột theo thứ tự:
  | Cột | Nội dung |
  |---|---|
  | ▸ | Caret expand/collapse |
  | **Tên nhóm** | `groupDisplayName` (đậm) + icon ghim (nếu đã ghim, xem D dưới) + chips thẻ phân loại bên dưới (nếu có) |
  | **Tên gốc Zalo** | `groupOriginalName` (xám nhạt, italic) |
  | **Tài khoản** | Badges các account đang sync — 1–2 hiển thị đầy đủ, ≥3 hiện 2 + chip `+N` tooltip danh sách còn lại |
  | **NV nội bộ** | Số lượng staff đang được phân quyền vào nhóm |
  | **Ẩn SĐT** | Badge trạng thái ("Đang ẩn" cam / "Đang hiện" xám) + toggle Switch |
  | **Thao tác** | 3 nút: ✎ (đổi tên #26) / "Thêm NV" (#16) / ⋯ (more menu) |

#### Trạng thái UI & Edge Cases

- **Không có nhóm nào đã đồng bộ:** empty state "Chưa có nhóm NCC nào — vui lòng thực hiện đồng bộ ở trang Nhà Cung Cấp".
- **Filter ra 0 nhóm:** empty state khác *"Không tìm thấy nhóm phù hợp với bộ lọc"* + nút "Đặt lại bộ lọc".
- **Counter "M đang ẩn SĐT" = 0:** chip cam ẩn đi hoặc xám hóa.
- **Khi xóa tài khoản Zalo cuối cùng đang sync nhóm:** không cho phép qua UI (constraint D.4(c) trong scope doc) — nút disabled trong dropdown "Tài khoản" với tooltip "Nhóm phải có ít nhất 1 tài khoản đang sync".

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: (1) Bảng đầy đủ với tab "Tất cả", (2) Tab "Đang ẩn SĐT" với 1 nhóm đang ẩn, (3) More menu (⋯) mở ra 2 option "Phân loại" + "Ghim hội thoại".

---

### 3.2 Bảng nhóm NCC — quản lý thành viên (#22 + #16 Admin side)

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site |
| **Liên quan Portal** | Khi Admin thêm staff vào nhóm → staff sẽ thấy nhóm xuất hiện trong sidebar Chat Portal (#16); khi xóa → nhóm biến mất khỏi sidebar staff. |

#### Mục tiêu

Cho Admin **xem chi tiết** danh sách staff đang được phân quyền vào từng nhóm và **thêm / xóa** staff khỏi nhóm.

#### Business Flow

**A. Xem danh sách staff trong nhóm (expand row):**

1. Admin click ▸ trên row một nhóm → row expand xuống.
2. Phần expand hiển thị **bảng staff** với các cột:
   - **Avatar + Tên nhân viên**
   - **Phòng ban**
   - **Đại diện qua** (dropdown override — xem § 3.4 D.4(b))
   - **Thao tác** — chỉ có icon ✕ (xóa khỏi nhóm)

**B. Thêm staff vào nhóm:**

1. Admin nhấn nút **"Thêm NV"** ở cột Thao tác của row nhóm.
2. Modal **"Thêm nhân viên vào nhóm"** mở:
   - Tiêu đề: "Thêm nhân viên vào nhóm" (không kèm tên nhóm trong title vì context đã rõ từ row).
   - Danh sách hiển thị **các staff eligible** — staff đã được gán làm đại diện cho ít nhất 1 trong các tài khoản Zalo đang sync nhóm này (xem § 3.5 dưới).
   - Mỗi row trong modal: avatar + tên + phòng ban.
   - **UX khác với modal "Gán nhân viên" ở Tab 1:**
     - Không có search.
     - Không có filter phòng.
     - **Click row = thêm ngay** (không cần checkbox + nút "Lưu").
3. Sau khi click, staff được thêm vào nhóm; row đóng modal (hoặc cập nhật danh sách còn lại nếu Admin muốn thêm nhiều).

**C. Xóa staff khỏi nhóm:**

1. Trong expand row, Admin nhấn icon ✕ ở cột Thao tác của row staff cần xóa.
2. Confirm dialog: *"Xóa [Tên staff] khỏi nhóm [Tên nhóm]? Staff sẽ không còn thấy nhóm này trong sidebar Chat Portal."*
3. Confirm → xóa. Nếu staff đó có active `groupStaffAccountOverride` cho nhóm này → override cũng được clear.

#### Yêu cầu chức năng

- **FR-NHOM.6 (#22 expand):** Click ▸ trên row → expand mở xuống bảng staff với 4 cột (Avatar+Tên / Phòng ban / Đại diện qua / Thao tác ✕). Chỉ 1 row được expand tại 1 thời điểm — expand row mới sẽ tự collapse row cũ (tùy chọn).
- **FR-NHOM.7 (#16 thêm):** Nút **"Thêm NV"** trong cột Thao tác mở modal **"Thêm nhân viên vào nhóm"**. Modal chỉ liệt kê staff eligible (xem § 3.5). Click row trong modal = thêm ngay, không cần xác nhận.
- **FR-NHOM.8 (#16 xóa):** Icon ✕ trong expand row mở confirm dialog trước khi xóa. Xóa thành công → staff bị xóa khỏi `vendorGroupStaffIds[groupId]` + mọi `groupStaffAccountOverride[groupId][staffId]` được clear.
- **FR-NHOM.9 (số "NV nội bộ" trên row chính):** Đếm chính xác số staff đang trong nhóm (sau khi thêm/xóa, số phải cập nhật realtime).

#### Trạng thái UI & Edge Cases

- **Modal "Thêm nhân viên" rỗng (không còn staff eligible):** empty state *"Không có nhân viên nào đủ điều kiện thêm vào nhóm này. Vui lòng gán staff cho ít nhất một tài khoản Zalo đang sync nhóm trước (trang Nhà Cung Cấp)."*
- **Tất cả staff eligible đã được thêm vào nhóm:** empty state khác *"Tất cả nhân viên đủ điều kiện đã được thêm vào nhóm."*
- **Xóa staff cuối cùng:** vẫn cho phép — nhóm có thể không có staff nào (chỉ admin truy cập được).

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: (1) Expand row hiển thị staff list, (2) Modal "Thêm nhân viên vào nhóm" — click row để add trực tiếp (không có search/checkbox).

---

### 3.3 Đổi tên hiển thị nhóm — Admin side (#26)

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (modal Đặt tên gợi nhớ) |
| **Liên quan Portal** | Staff sẽ thấy tên mới ở header chat + sidebar danh sách hội thoại NCC trên Chat Portal — xem `FSD-Chat-Portal.md` § C.26. |

#### Mục tiêu

Cho Admin **đổi tên hiển thị** cho một nhóm NCC trong nội bộ (Portal + Admin Site) — không đồng bộ lên Zalo, không ảnh hưởng tên gốc nhóm Zalo.

#### Business Flow

1. Admin nhấn icon ✎ (Pencil) ở cột Thao tác trên row nhóm.
2. Modal **"Đặt tên gợi nhớ"** mở:
   - Tiêu đề: "Đặt tên gợi nhớ".
   - Subtitle giải thích: *"Hãy đặt cho NCC - [Tên gốc Zalo] một cái tên dễ nhớ."*
   - Banner cảnh báo vàng (icon ⚠): *"Lưu ý: Tên gợi nhớ chỉ hiển thị trong chat portal, không đồng bộ lên Zalo."*
   - Input field, pre-filled với `groupDisplayName` hiện tại (nếu đã override) hoặc `groupOriginalName` (nếu chưa override).
   - Footer: nút **Huỷ** + nút **Xác nhận** (xanh).
3. Admin sửa tên → nhấn **Xác nhận** → modal đóng, row cập nhật `groupDisplayName` mới.
4. Để **xóa override** (về lại tên gốc Zalo): Admin xóa input về chuỗi rỗng + nhấn **Xác nhận** → `groupDisplayNames[groupId] = null`.

#### Yêu cầu chức năng

- **FR-NHOM.10:** Nút ✎ ở cột Thao tác mở modal "Đặt tên gợi nhớ". Modal phải có: subtitle nêu tên gốc Zalo, banner cảnh báo vàng, input pre-filled, nút Huỷ + Xác nhận.
- **FR-NHOM.11:** Tên gốc Zalo (`groupOriginalName`) **không thay đổi** sau thao tác — chỉ ghi `groupDisplayNames[groupId]`. Cột "Tên gốc Zalo" trên bảng vẫn hiển thị tên gốc.
- **FR-NHOM.12:** Tên trống (sau khi trim whitespace) = clear override, fallback về `groupOriginalName`.
- **FR-NHOM.13:** Validation tên: không cho nhập > 100 ký tự; không cho ký tự control. Trim leading/trailing whitespace khi lưu.

#### Trạng thái UI & Edge Cases

- **Tên mới trùng với một nhóm khác:** không validate uniqueness — cho phép trùng, vì đây chỉ là gợi nhớ nội bộ.
- **Nhóm đã có override + đổi sang tên khác:** override cũ bị overwrite, không có lịch sử rename (Phase 2 không yêu cầu audit rename).

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: Modal "Đặt tên gợi nhớ" với subtitle, banner cảnh báo vàng, input + 2 nút footer.

---

### 3.4 Per-staff per-group override "Đại diện qua" · D.4(b)

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (trong expand row Bảng nhóm NCC) |
| **Liên quan Portal** | Khi staff gửi tin trong nhóm này → tin sẽ hiển thị trên Zalo dưới tên account đã override (xem `FSD-Chat-Portal.md` § D.4(a) resolver + ZaloIdentityBar). |

#### Mục tiêu

Khi một nhóm có **≥ 2 tài khoản Zalo** đang sync và một staff đủ điều kiện đại diện **cả 2 tài khoản đó**, Admin cần một cách chỉ định cụ thể: *"trong group X, staff Y luôn đại diện account Z, ghi đè quy tắc resolve mặc định."*

#### Business Flow

1. Trong expand row của nhóm có ≥ 2 tài khoản Zalo, cột **"Đại diện qua"** xuất hiện cho từng staff:
   - **Staff chỉ eligible 1 account** → hiển thị **badge tĩnh** chứa tên account (no override possible).
   - **Staff eligible ≥ 2 accounts** → hiển thị **dropdown portal-based** với các tùy chọn:
     - **Mặc định (theo phân quyền)** — fallback về resolver global (xem § D.4(a) scope doc).
     - Từng account cụ thể (avatar + tên account).
2. Admin chọn 1 option → dropdown đóng, override được lưu vào `groupStaffAccountOverride[groupId][staffId]`.
3. Chọn "Mặc định" → clear override (state về `null`).

#### Yêu cầu chức năng

- **FR-NHOM.14:** Cột "Đại diện qua" chỉ hiển thị trong expand row của những nhóm có ≥ 2 accounts. Nhóm có 1 account → cột này có thể bỏ hoặc hiển thị badge static.
- **FR-NHOM.15:** Logic eligibility: staff `S` eligible account `A` ⇔ `S ∈ zaloAccountAssignments[A]`.
- **FR-NHOM.16:** Dropdown phải dùng portal/popper (render outside table) để không bị clip bởi bảng/overflow.
- **FR-NHOM.17:** Sau khi override → khi staff gửi tin trong nhóm này ở Portal, resolver tuân thủ priority 1 (override) trước khi xét priority 2, 3 (xem § D.4(a) scope doc).
- **FR-NHOM.18:** Khi account bị xóa khỏi `zaloAccountIds` của nhóm (xem § D.4(c)) → mọi override trỏ về account đó được clear automatically; UI cập nhật về "Mặc định".

#### Trạng thái UI & Edge Cases

- **Staff không eligible bất kỳ account nào** (lý thuyết không xảy ra nếu đã được thêm vào nhóm đúng cách): hiển thị badge cảnh báo *"Không thể gửi tin — chưa có phân quyền account"* (read-only on Portal).
- **Override trỏ về account đã expired/disconnected:** vẫn giữ override (không auto-clear), nhưng UI Portal sẽ hiển thị banner cảnh báo khi staff vào nhóm.

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup (Phase 2 trước): expand row với dropdown "Đại diện qua" cho mỗi staff. Cần thêm: state khi staff chỉ eligible 1 account (badge static, không có dropdown).

---

### 3.5 Cột "Tài khoản" — chỉ hiển thị (read-only)

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site |

#### Mục tiêu

Cho Admin **biết** nhanh nhóm này đang được sync qua tài khoản Zalo nào (D.4(f)). **Không** cho phép thêm/xóa account từ trang này — việc đó được điều hành ngầm: nếu account A có quyền vào nhóm Zalo Y (do Zalo membership) → backend tự thêm A vào `zaloAccountIds[Y]`.

#### Yêu cầu chức năng

- **FR-NHOM.19:** Cột "Tài khoản" hiển thị badges:
  - ≤ 2 accounts: hiện đầy đủ.
  - ≥ 3 accounts: hiện 2 + chip `+N` có tooltip liệt kê tên các account còn lại.
- **FR-NHOM.20:** Không có dropdown thêm/xóa account ở cột này. Việc remove account khỏi nhóm thực hiện ở nơi khác (ngắt kết nối account ở Tab 1 Nhà Cung Cấp, hoặc rời nhóm Zalo từ phía tài khoản Zalo cá nhân).

#### Trạng thái UI & Edge Cases

- **Account đang sync nhóm bị ngắt kết nối** (`disconnected`/`expired`): badge xám/đỏ thay vì xanh; tooltip hiển thị lý do.
- **Nhóm tạm thời không có account nào sync** (edge case khi tất cả account bị disconnect): row hiển thị badge cảnh báo đỏ *"Không có tài khoản nào đang sync"* — backend dừng đồng bộ tin mới.

#### Mockup tham chiếu

> [BA bổ sung] — Đã có badges 1–2 account hiển thị đầy đủ; cần mockup khi ≥3 account với chip `+N`.

---

### 3.6 Toggle ẩn/hiện SĐT theo nhóm · #28 Admin side

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (cột "Ẩn SĐT") |
| **Liên quan Portal** | Khi `phoneHidden = true`, Staff thấy SĐT bị mask + có thể gửi yêu cầu xem; Admin vẫn thấy số thật trong chat (xem `FSD-Chat-Portal.md` § C.28). |

#### Mục tiêu

Cho Admin **bật/tắt** chế độ ẩn SĐT cho từng nhóm NCC ngay tại bảng — không cần vào trang riêng.

#### Business Flow

1. Trên row nhóm, cột "Ẩn SĐT" hiển thị:
   - **Badge trạng thái** bên trái: *"Đang ẩn"* (cam, icon mắt-gạch) hoặc *"Đang hiện"* (xám, icon mắt).
   - **Toggle Switch** bên phải.
2. Admin click toggle → trạng thái đảo ngay, không cần confirm.
3. Backend nhận event → cập nhật `phoneHidden[groupId]`. Áp dụng ngay lập tức:
   - Tin mới và tin cũ trong nhóm đều được mask lại đối với staff (khi bật).
   - Mọi `PhoneRevealRequest` đang `approved` cho nhóm này **không** bị tự động revoke khi bật/tắt — đó là 2 trạng thái độc lập. Để revoke phải vào trang Yêu Cầu Xem SĐT (§ 5).
4. Counter chip cam "M đang ẩn SĐT" ở header tự cập nhật.

#### Yêu cầu chức năng

- **FR-NHOM.21:** Cột "Ẩn SĐT" có 2 thành phần: badge trạng thái + Switch.
  - Switch ON ↔ badge cam "Đang ẩn".
  - Switch OFF ↔ badge xám "Đang hiện".
- **FR-NHOM.22:** Toggle không có confirm dialog (đơn giản, có thể đảo ngược ngay).
- **FR-NHOM.23:** State được persist ở backend; Portal sẽ hiển thị state mới ở lần render kế (hoặc realtime nếu có sub).
- **FR-NHOM.24:** Bật/tắt **không** auto-revoke các `PhoneRevealRequest` đã approved. Logic 2 trạng thái độc lập (xem § 5 và scope C.28).

#### Trạng thái UI & Edge Cases

- **Bật ẩn SĐT trên nhóm đang có nhiều SĐT đã approve revealed:** badge cam "Đang ẩn" hiển thị, nhưng các số đã approve vẫn lộ với staff. Admin tự xử lý revoke ở trang § 5 nếu muốn ẩn hoàn toàn.
- **Tắt ẩn SĐT (chuyển sang "Đang hiện"):** mọi staff thấy lại số thật; các `PhoneRevealRequest` pending trở thành không còn ý nghĩa nhưng vẫn lưu trong audit (status = `pending`, không tự đóng).

#### Mockup tham chiếu

> [BA bổ sung] — Đã có 2 state: ON ("Đang ẩn" cam + switch xanh) và OFF ("Đang hiện" xám + switch tắt).

---

### 3.7 Lọc theo thẻ phân loại · #31 Admin side

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (tag chip row) |
| **Liên quan Portal** | Chat Portal có UI filter riêng (popup "Phân loại") — xem `FSD-Chat-Portal.md` § C.31. |

#### Mục tiêu

Cho Admin **lọc nhanh** danh sách nhóm theo 1 thẻ phân loại tại một thời điểm.

#### Business Flow

1. Tag chip row hiển thị **inline** ngay dưới tabs ẩn SĐT:
   - Chip đầu tiên: **"Tất cả"** (active mặc định, viền/nền nhạt).
   - Tiếp theo: từng chip thẻ phân loại với **dot màu** + **tên thẻ**.
   - Thứ tự thẻ tuân thủ `Tag.order` (tag với `order` nhỏ hơn hiển thị trước).
2. Click chip → filter bảng theo thẻ đó. Click lại chip đang active → về "Tất cả".
3. Filter này **cộng dồn** với filter ở filter row + tabs ẩn SĐT (AND logic).

#### Yêu cầu chức năng

- **FR-NHOM.25:** Chỉ 1 thẻ active tại 1 thời điểm (single-select filter).
- **FR-NHOM.26:** Khi xóa 1 thẻ ở modal #30: chip thẻ đó biến mất khỏi tag chip row; nếu nó đang active → tự động về "Tất cả".
- **FR-NHOM.27:** Khi sửa tên/màu thẻ ở modal #30: chip update ngay tức thì.

#### Trạng thái UI & Edge Cases

- **Không có thẻ phân loại nào trong hệ thống:** tag chip row vẫn hiển thị chip "Tất cả" mặc định + link nhỏ *"Quản lý thẻ phân loại"* dẫn đến modal #30.
- **Nhóm chưa được gán thẻ nào:** không hiển thị trong filter theo thẻ cụ thể; chỉ xuất hiện khi filter = "Tất cả".

#### Mockup tham chiếu

> [BA bổ sung] — Đã có chip row với 6 chip (Tất cả + 5 thẻ mặc định màu sắc).

---

### 3.8 More menu (⋯) — Phân loại + Ghim hội thoại

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (cột Thao tác) |

#### Mục tiêu

Đặt 2 action ít dùng hơn vào dropdown more menu để cột Thao tác gọn gàng.

#### Business Flow

1. Nhấn nút **⋯** ở cuối cột Thao tác → mở dropdown 2 options:
   - **Phân loại** — mở mini picker hiển thị danh sách thẻ phân loại (single-select). Chọn 1 thẻ → gán thẻ vào nhóm; click lại thẻ đang gán → bỏ thẻ. Có link nhanh *"Quản lý thẻ phân loại"* xuống cuối picker.
   - **Ghim hội thoại** — pin/unpin nhóm. Khi đã pin → label đổi thành **"Bỏ ghim hội thoại"**. Nhóm đã pin hiển thị icon ghim nhỏ cạnh tên nhóm ở cột "Tên nhóm".

#### Yêu cầu chức năng

- **FR-NHOM.28:** Dropdown more menu hiển thị 2 options theo thứ tự: **Phân loại** → **Ghim hội thoại**.
- **FR-NHOM.29 (Phân loại):** Picker thẻ hỗ trợ single-select. Click thẻ đã chọn → bỏ thẻ. Link "Quản lý thẻ phân loại" ở footer picker mở modal #30.
- **FR-NHOM.30 (Ghim hội thoại — Admin-perspective):** State pin được lưu per-admin (`pinnedGroups[adminId][groupId] = true`). Khi pin → icon ghim hiển thị + nhóm được sort lên đầu khi sort default. Lưu ý đây là **state Admin-perspective trong bảng quản trị**, không liên quan đến state pin của Staff ở Chat Portal sidebar (#12 mỗi user có pinning riêng).

#### Trạng thái UI & Edge Cases

- **Picker thẻ rỗng (chưa có thẻ trong hệ thống):** empty state trong picker *"Chưa có thẻ phân loại — tạo mới tại 'Quản lý thẻ phân loại'."*
- **Nhóm đã pin nhưng filter ẩn SĐT loại nhóm đó ra:** nhóm không hiển thị (filter mạnh hơn pin).

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup more menu (⋯) mở ra 2 option "Phân loại" + "Ghim hội thoại". Cần thêm: mini picker thẻ phân loại từ option "Phân loại".

---

## 4. Quản lý thẻ phân loại (modal cross-page) · #30

> **Phạm vi:** modal `TagManagementModal` — quản lý CRUD + sắp xếp thứ tự cho danh sách thẻ phân loại nhóm NCC. Modal này **dùng chung** cho cả Admin Site lẫn Chat Portal (Portal cũng có link nhanh mở modal này từ filter popup #31).
>
> **Truy cập:**
> - **Admin Site:** nút **"Quản lý thẻ phân loại"** ở header trang Nhóm NCC (§ 3.1).
> - **Admin Site (mini link):** footer của picker thẻ trong more menu ⋯ → "Phân loại" (§ 3.8) và footer của tag chip row khi rỗng (§ 3.7).
> - **Chat Portal:** link nhanh trong filter popup "Phân loại" trên sidebar — xem `FSD-Chat-Portal.md` § C.31.

### 4.1 Modal Quản lý thẻ phân loại

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site + Chat Portal (modal cross-UI, cùng business logic) |

#### Mục tiêu

Cho Admin **tạo / sửa / xóa / sắp xếp thứ tự** danh sách thẻ phân loại nhóm NCC. Thứ tự ảnh hưởng đến trật tự chip hiển thị ở mọi nơi: tag chip row Admin Site, picker thẻ, popup filter Portal.

#### Business Flow

1. Modal mở với:
   - Header: tiêu đề "Quản lý thẻ phân loại" + nút ✕ đóng.
   - Section "DANH SÁCH THẺ PHÂN LOẠI" (label uppercase, font nhỏ).
   - Danh sách thẻ (mỗi row có: drag handle ⋮⋮ + dot màu + tên + hover hiển thị icon ✎ Pencil + 🗑 Trash).
   - Footer: nút text-link **"+ Thêm phân loại"** (xanh).

2. **Sắp xếp:** Admin kéo drag handle ⋮⋮ → thả vị trí mới. Row đang kéo `opacity-40`, row được hover (drop target) highlight nền xanh nhạt + ring. Sau khi thả → `Tag.order` cập nhật theo thứ tự mới ở mọi nơi sử dụng.

3. **Sửa thẻ:** Hover row → click ✎ Pencil → row chuyển sang inline edit mode:
   - Input text edit tên thẻ.
   - Mini color picker xuất hiện: **8 màu fixed** trong palette `TAG_COLORS` — đỏ, cam, vàng, xanh lá, xanh dương, tím, hồng, xám (chính xác 8 màu).
   - Nút ✓ lưu / ✕ huỷ.

4. **Xóa thẻ:** Hover row → click 🗑 Trash → confirm dialog cảnh báo *"Xóa thẻ này sẽ gỡ thẻ khỏi N nhóm đang gắn. Tiếp tục?"* (N = số nhóm có `groupTagIds[groupId] = tagId`). Confirm → xóa thẻ + tự động clear `groupTagIds[groupId]` ở mọi nhóm liên quan.

5. **Thêm mới:** Click "+ Thêm phân loại" → 1 row mới được append vào cuối danh sách, mặc định ở edit mode (input focus, màu mặc định = màu đầu palette). Admin nhập tên → ✓ lưu hoặc ✕ huỷ.

#### Yêu cầu chức năng

- **FR-TAG.1 (CRUD):** Modal hỗ trợ Create / Read / Update / Delete đầy đủ. Lưu tức thì sau mỗi thao tác (không cần nút "Lưu" master).
- **FR-TAG.2 (drag reorder):** Drag-and-drop reorder phải work cả với chuột (mouse). Visual feedback rõ ràng cho drag source (opacity) và drop target (highlight). Không cần keyboard accessibility cho Phase 2.
- **FR-TAG.3 (single-select gắn nhóm):** Mỗi nhóm gắn được **tối đa 1 thẻ tại một thời điểm**. Click lại thẻ đang gắn → bỏ thẻ (`groupTagIds[groupId] = null`). Xem § 3.8 (picker từ more menu).
- **FR-TAG.4 (xóa cascade):** Khi xóa thẻ X → tự động clear `groupTagIds[groupId] = null` cho mọi nhóm `groupId` đang gắn X. Confirm dialog phải nêu rõ N.
- **FR-TAG.5 (color palette):** Đúng 8 màu fixed từ `TAG_COLORS`. Không cho Admin nhập màu HEX tự do.
- **FR-TAG.6 (5 thẻ mặc định seed):** Hệ thống pre-seed 5 thẻ khi khởi tạo lần đầu:
  | Tên | Màu |
  |---|---|
  | Nhà sản xuất | đỏ |
  | Nhà phân phối | cam |
  | Nhà nhập khẩu | xanh dương |
  | Dịch vụ | xanh lá |
  | Thiết yếu | tím |
  Admin có thể sửa/xóa các thẻ mặc định (không bảo vệ).
- **FR-TAG.7 (validation tên):** Tên thẻ bắt buộc (không cho lưu rỗng); tối đa 30 ký tự; trim whitespace. **Cho phép** trùng tên (không enforce uniqueness vì Phase 2 không cần thiết).

#### Trạng thái UI & Edge Cases

- **Modal mở khi đang có 0 thẻ** (case admin đã xóa hết): empty state *"Chưa có thẻ phân loại. Nhấn '+ Thêm phân loại' để bắt đầu."*
- **Xóa thẻ đang được dùng làm filter active (ở tag chip row § 3.7 hoặc popup Portal):** filter tự reset về "Tất cả".
- **Đổi tên/màu thẻ:** áp dụng ngay tức thì lên mọi UI tiêu thụ (chip trên row, tag chip row, picker, popup filter Portal).
- **Drag-and-drop khi chỉ có 1 thẻ:** không bị crash, no-op.
- **Xóa thẻ cuối cùng:** modal hiển thị empty state; tag chip row trên trang Nhóm NCC chỉ còn chip "Tất cả".

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: modal hiển thị 5 thẻ mặc định với drag handle + dot màu + tên + footer "+ Thêm phân loại". Cần thêm: state inline edit (input + mini color picker), state confirm dialog xóa thẻ.

---

## 5. Trang Yêu Cầu Xem SĐT · #29

> **Phạm vi page:** trang duyệt mọi `PhoneRevealRequest` từ staff. Hoạt động cùng với flow tổng thể #28 (xem `FSD-Chat-Portal.md` § C.28 cho phần staff gửi yêu cầu trong chat + scope-and-features.md § C.28 cho deep-dive nghiệp vụ).
>
> **Cấu trúc page:**
> ```
> Header: tiêu đề "Yêu Cầu Xem Số Điện Thoại" + subtitle giải thích
> Tabs trạng thái: Tất cả (N) · Đang chờ (M) · Đã duyệt · Đã từ chối · Đã thu hồi
> Bảng yêu cầu (cột: Nhân viên / SĐT / Nhóm NCC / Thời gian YC / Trạng thái / Admin xử lý / Thời gian xử lý / Thao tác)
> ```

### 5.1 Trang Yêu Cầu Xem SĐT

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site |
| **Liên quan Portal** | Staff click icon mắt cạnh số bị mask → tạo request (xem `FSD-Chat-Portal.md` § C.28). Sau khi Admin duyệt/từ chối → staff thấy số được hiện (cam highlight) hoặc tiếp tục ẩn. Mỗi action sinh system message trong vendor group (`PHONE_REVEAL_APPROVED` / `_DENIED` / `_REVOKED`). |

#### Mục tiêu

Cho Admin **xem tập trung** mọi `PhoneRevealRequest` đang/đã xử lý + thực hiện các thao tác duyệt / từ chối / thu hồi với **scope group-wide** (xem § C.28 scope doc cho rule chi tiết).

#### Business Flow

1. **Khi mở trang:**
   - Header: tiêu đề "Yêu Cầu Xem Số Điện Thoại" (kèm icon 📞) + subtitle *"Quản lý các yêu cầu xem số điện thoại bị ẩn trong các nhóm NCC"*.
   - Tabs trạng thái ngang ngay dưới header: **Tất cả (N)** · **Đang chờ (M)** · **Đã duyệt** · **Đã từ chối** · **Đã thu hồi**. Counter ngay sau tên tab. Tab mặc định: **Tất cả** (hoặc **Đang chờ** nếu có ≥ 1 request pending — TBD theo BA preference; demo default = "Tất cả").
   - Bảng yêu cầu hiển thị bên dưới.

2. **Cấu trúc bảng:**
   | Cột | Nội dung |
   |---|---|
   | **NHÂN VIÊN** | Tên staff đã gửi request |
   | **SỐ ĐIỆN THOẠI** | Số thật, hiển thị **chip mono xám** (font mono, padding nhỏ, nền xám nhạt). Admin luôn thấy số đầy đủ, không mask. |
   | **NHÓM NCC** | `groupDisplayName` (đã rename nếu có) |
   | **THỜI GIAN YÊU CẦU** | `requestedAt` (định dạng HH:mm dd/MM/yyyy) |
   | **TRẠNG THÁI** | Badge theo status: ⏱ **Đang chờ** (cam/hổ phách) / ✓ **Đã duyệt** (xanh) / ✕ **Đã từ chối** (đỏ) / ↩ **Đã thu hồi** (xám) |
   | **ADMIN XỬ LÝ** | Tên admin đã xử lý (— nếu chưa xử lý) |
   | **THỜI GIAN XỬ LÝ** | `processedAt` (— nếu chưa xử lý) |
   | **THAO TÁC** | Theo trạng thái (xem § 5.2) |

3. **Sort mặc định:** `requestedAt` **mới nhất trước**.

4. **Click row:** không có hành động đặc biệt (hoặc optional: navigate sang Chat Portal mở nhóm + scroll-to tin chứa số). TBD theo BA.

#### Yêu cầu chức năng

- **FR-PRR.1 (tabs):** 5 tabs trạng thái với counter động. Click tab → filter bảng theo status (`pending` / `approved` / `denied` / `revoked`). Tab "Tất cả" reset filter.
- **FR-PRR.2 (bảng 8 cột):** Mỗi row hiển thị đủ 8 cột theo bảng trên. SĐT là chip mono có background xám nhạt.
- **FR-PRR.3 (sort):** Default sort `requestedAt` desc. Có thể click header cột để đổi sort (Phase 2 không bắt buộc).
- **FR-PRR.4 (badge trạng thái):** Mỗi badge có icon + label + màu nhất quán với toàn bộ Admin Site (cam = pending, xanh = approved, đỏ = denied, xám = revoked).
- **FR-PRR.5 (sync system message):** Mỗi thao tác Admin (duyệt/từ chối/thu hồi) phải sinh system message `PHONE_REVEAL_APPROVED` / `_DENIED` / `_REVOKED` trong vendor group (xem `FSD-Chat-Portal.md` § quy tắc hiển thị system message INTERNAL).

#### Trạng thái UI & Edge Cases

- **Không có request nào** (lần đầu sử dụng hoặc đã xử lý hết): empty state icon Users + message *"Chưa có yêu cầu nào"*.
- **Tab "Đang chờ" có ≥ 1 request:** badge counter ở tab nổi bật (background cam đậm) để Admin chú ý.
- **Một staff đã rời công ty + có request cũ:** cột "NHÂN VIÊN" hiển thị tên + label "(đã rời)".

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: bảng có 1 row pending ("Lê Diễm Chi / chip mono 0952908786 / NCC - Vận Chuyển Phương Nam / 16:28 12/06/2026 / badge ⏱ Đang chờ / — / — / [Từ chối] [Duyệt]"). Cần thêm: state các tab khác (approved/denied/revoked) khi có data.

---

### 5.2 Actions theo trạng thái

| | |
|---|---|
| **Actors** | Admin |
| **Scope** | Admin Site (cột Thao tác trong bảng § 5.1) |

#### Mục tiêu

Định nghĩa rõ ràng **nút nào hiển thị theo trạng thái nào** + **hiệu ứng** sau mỗi thao tác.

#### Yêu cầu chức năng theo trạng thái

| Trạng thái request | Cột Thao tác hiển thị | Hiệu ứng sau thao tác |
|---|---|---|
| **pending** (Đang chờ) | **Từ chối** (viền đỏ) + **Duyệt** (xanh solid) | Duyệt → status = `approved`, `processedBy/processedAt` cập nhật, system message `_APPROVED` sinh; Từ chối → status = `denied`, system message `_DENIED` |
| **approved** (Đã duyệt) | **Thu hồi** (viền/xám) | Thu hồi → status = `revoked`, system message `_REVOKED`; mọi staff trong nhóm thấy số bị ẩn lại |
| **denied** (Đã từ chối) | — (không có action — terminal) | — |
| **revoked** (Đã thu hồi) | — (không có action — terminal) | — |

- **FR-PRR.6 (pending actions):** 2 nút **Từ chối** / **Duyệt** đứng cạnh nhau. Cả 2 đều không cần confirm dialog (decision đơn giản, Admin chịu trách nhiệm).
- **FR-PRR.7 (approved → revoke):** Nút **Thu hồi** mở **confirm dialog**: *"Thu hồi quyền xem số [SĐT] cho nhóm [Tên nhóm]? Tất cả staff trong nhóm sẽ thấy số bị ẩn trở lại."* Confirm → revoke.
- **FR-PRR.8 (group-wide scope):** Khi duyệt 1 request cho `(groupId, phoneFingerprint)` → mọi staff trong nhóm thấy số đó (xem § C.28 scope doc rule 5). Tương tự, revoke tác động group-wide. Logic này **enforce ở backend**, không trust UI.
- **FR-PRR.9 (audit trail):** Mỗi thao tác lưu `processedBy` (admin actor) + `processedAt` (timestamp) + system message tương ứng. Audit không thể xóa.
- **FR-PRR.10 (optional lý do từ chối):** Có thể có textarea nhỏ pop-up khi Admin nhấn **Từ chối** để nhập lý do (Phase 2 optional — TBD theo BA).

#### Trạng thái UI & Edge Cases

- **Admin từ chối rồi muốn duyệt lại:** không có UI undo trực tiếp; staff phải gửi request mới (Phase 2 không cần re-open denied requests).
- **2 request cùng `(groupId, phoneFingerprint)` từ 2 staff khác nhau:** Admin chỉ cần duyệt 1 trong 2 → cả 2 chuyển status `approved` automatically? (TBD) — hoặc giữ độc lập theo từng request? Backend cần quy định. Recommended: nếu đã có 1 request approved cho cùng `(groupId, phoneFingerprint)` thì staff khác không cần gửi request (UI Portal hiển thị số đã unlock luôn).
- **Nhóm bị xóa khỏi hệ thống sau khi có request:** request vẫn lưu trong audit, nhưng action button bị disabled với tooltip "Nhóm không còn tồn tại".

#### Mockup tham chiếu

> [BA bổ sung] — Đã có mockup: pending row với 2 nút "Từ chối" + "Duyệt". Cần thêm: row approved với nút "Thu hồi" + confirm dialog thu hồi.

---

## 6. Phần KHÔNG thuộc tài liệu này (cross-reference)

Để tránh DEV nghĩ tài liệu thiếu feature, dưới đây là **danh sách rõ ràng** các phần thuộc phạm vi Phase 2 nhưng **không mô tả ở Admin Site** — đã / sẽ được mô tả ở `FSD-Chat-Portal.md`.

### 6.1 Cross-cutting nghiệp vụ ở Portal

| Hạng mục | Lý do không ở đây | Tài liệu mô tả |
|---|---|---|
| **Quy tắc hiển thị tên người gửi** (Section 6 scope doc — `Z.displayName (StaffName)` format, recall, internal msgs, system msgs, staff đã rời) | Rule áp dụng chủ yếu cho rendering message bubble trong vendor group chat (Chat Portal). Admin Site chỉ hiển thị `displayName` mặc định trong bảng. | `FSD-Chat-Portal.md` § Quy tắc hiển thị tên người gửi |
| **G.2 PinNotificationBubble** (style spec system message khi pin/unpin) | Spec đã được mô tả đầy đủ trong Chat Portal doc (vendor group + group nội bộ). Admin Site không có UI riêng cho component này. | `FSD-Chat-Portal.md` § G.2 |

### 6.2 Các tính năng Chat Portal toàn bộ (không có phần Admin Site UI)

| Nhóm | Tính năng | Tài liệu |
|---|---|---|
| **A** | Banner trạng thái kết nối + nút "Thử lại kết nối" (#27 Portal side) | `FSD-Chat-Portal.md` § Nhóm A |
| **B** | Toàn bộ chat: #5 TXT, #6 IMG/FILE/VID, #7 Reply, #8 Reaction, #9 Recall (Portal hiển thị), #10 Pin tin nhắn (Portal action), #11 Forward to Admin, #25 Star/Bookmark, [EXTRA] @mention | `FSD-Chat-Portal.md` § Nhóm B |
| **C** | #12 Ghim hội thoại (Staff sidebar), #13 Watermark (Portal viewer), #14 Quyền tải file (Portal enforce), #26 Đổi tên nhóm (Portal display), #28 Mask SĐT + gửi request reveal (Portal), #31 Filter thẻ (Portal sidebar popup) | `FSD-Chat-Portal.md` § Nhóm C |
| **D** | ZaloIdentityBar — banner xanh "Đang đại diện tài khoản: X" (#D.4(d) Portal) + resolver acting-as logic, Quản lý thành viên nhóm (Admin-only Portal panel) | `FSD-Chat-Portal.md` § Nhóm D |
| **E** | #18 Giao việc, #19 Nhật ký công việc (VendorTaskLogSheet) | `FSD-Chat-Portal.md` § Nhóm E |

### 6.3 Tính năng đặc biệt cần lưu ý

- **#23 Quyền tải xuống** — theo decision 2026-06-11: **chỉ cấu hình được trên Chat Portal**, không có UI Admin Site. Trang Quản lý User & Phân Quyền (Phase 1) **không** có form "Chỉnh sửa quyền tải xuống" như scope doc gốc đề cập. Cấu hình ở: Chat Portal → Quản lý thành viên nhóm (Admin-only modal). Xem `FSD-Chat-Portal.md` § 5.4 FR-D.18.
- **#17 Cấu trúc vai trò** (Admin / Staff / Vendor) — conceptual rule, không có UI mô tả. Đã được thể hiện ngầm qua mọi flow phân quyền (#15, #16, #29, #28).
- **G.1 Floating Admin Button** — demo-only, không vào production (xem scope doc § G.1).
- **Link "← Về Portal"** ở header AdminDemoApp — demo-only, không vào production.

### 6.4 Tóm tắt 31 tính năng và tài liệu mô tả

| # | Tên | Có phần Admin Site | Có phần Chat Portal |
|---|---|:---:|:---:|
| #1 | Liên kết Zalo (QR) | ✅ § 2.2 | — |
| #2, #3, #4 | Sync (auto + history) | ✅ § 2.3 (Tab trigger) | — (backend) |
| #5–#11, #25, [EXTRA] mention | Chat features | — | ✅ Nhóm B |
| #12 | Ghim hội thoại (Staff sidebar) | — | ✅ § C.12 |
| #13 | Watermark | — | ✅ § C.13 |
| #14 | Quyền tải (enforce) | — | ✅ § C.14 |
| #15 | Phân quyền tài khoản Zalo | ✅ § 2.2 (modal Gán nhân viên) | — |
| #16 | Phân quyền nhóm chat | ✅ § 3.2 (Thêm NV / Xóa) | ✅ Portal: side effect chỉ hiển thị nhóm cho staff được gán |
| #17 | Vai trò (Admin/Staff/Vendor) | (conceptual) | (conceptual) |
| #18, #19 | Task + Log | — | ✅ Nhóm E |
| #20 | Liên kết tài khoản Zalo | ✅ § 2.2 | — |
| #21 | Đồng bộ dữ liệu | ✅ § 2.3 | — |
| #22 | Quản lý nhóm NCC | ✅ § 3 | — |
| #23 | Quyền tải xuống cấu hình | — (decision override) | ✅ § 5.4 (Portal-only) |
| #24 | Theo dõi file lớn | ✅ § 2.4 | — |
| #25 | Đánh dấu tin nhắn | — | ✅ Nhóm B |
| #26 | Đổi tên hiển thị nhóm | ✅ § 3.3 (modal Đặt tên gợi nhớ) | ✅ Portal: header chat + sidebar hiển thị tên mới |
| #27 | Reconnect | ✅ § 2.2 (trạng thái) | ✅ Nhóm A (banner + nút thử lại) |
| #28 | Ẩn/hiện SĐT | ✅ § 3.6 (toggle) | ✅ § C.28 (mask + request reveal từ chat) |
| #29 | Duyệt yêu cầu xem SĐT | ✅ § 5 | — |
| #30 | Quản lý thẻ phân loại | ✅ § 4 | ✅ Portal: link nhanh từ filter popup |
| #31 | Lọc theo thẻ phân loại | ✅ § 3.7 (tag chip row) | ✅ § C.31 (popup sidebar) |
| D.4(a) | Resolver acting-as | — (backend logic) | ✅ § Nhóm D |
| D.4(b) | Override per-staff per-group | ✅ § 3.4 | — |
| D.4(c) | Remove account khỏi group | (backend, không UI Admin Site trực tiếp) | — |
| D.4(d) | ZaloIdentityBar | — | ✅ § Nhóm D |
| D.4(e) | Dedupe tin nhắn | — (backend) | — |
| D.4(f) | Hiển thị accounts trong Admin Site | ✅ § 3.5 | — |
| G.1 | Floating Admin Button | — (demo-only) | — (demo-only) |
| G.2 | PinNotificationBubble | — | ✅ § G.2 |

---

> **Kết thúc tài liệu FSD — Admin Site.** Mọi câu hỏi nghiệp vụ chưa rõ vui lòng đối chiếu với `scope-and-features.md` (source of truth) hoặc nêu trong session review tiếp theo.
