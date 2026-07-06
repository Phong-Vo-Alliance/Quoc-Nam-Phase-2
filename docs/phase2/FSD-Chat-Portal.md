# FSD — Chat Portal (Phase 2)
## Functional Specification Document cho Phát triển Production

> **Mục đích:** Mô tả chi tiết từng chức năng phía Chat Portal (giao diện nhân viên) để Dev nắm rõ business flow, requirements và edge cases trước khi code.
>
> **Phiên bản:** 1.0.0 · **Cập nhật:** 2026-06-11

---

## 1. Tổng quan tài liệu

### 1.1 Đối tượng đọc

- **Developer (chính):** đọc để hiểu cần implement gì cho từng chức năng.
- **Business Analyst (BA):** dùng làm nguồn để chuyển thành slide kèm mockup demo.
- **QA / Tester:** dùng làm cơ sở để viết test case nghiệm thu.

### 1.2 Phạm vi tài liệu

Tài liệu này mô tả **các chức năng hiển thị / thao tác trên Chat Portal** — giao diện làm việc hằng ngày của nhân viên (Staff) và admin nội bộ (Admin) khi tương tác với nhóm chat vendor (NCC).

**Nguyên tắc phân chia tài liệu:**

- Một feature có thể được implement ở cả Chat Portal lẫn Admin Site (ví dụ: Admin cấu hình quyền tải file ở Admin Site, Staff bị enforce quyền khi download ở Portal). Trong trường hợp đó, **mỗi tài liệu chỉ mô tả phần thuộc UI tương ứng**, không lặp lại.
- Các tính năng **thuần backend / chỉ có UI trên Admin Site** (ví dụ: #1 quét QR, #2/#3/#4 đồng bộ Zalo) **không xuất hiện trong tài liệu này** — xem `FSD-Admin-Site.md`.

**6 nhóm chức năng có phần thuộc Chat Portal:**

| Nhóm | Tên | Mô tả phạm vi Chat Portal |
|---|---|---|
| A | Kết nối & Đồng bộ Zalo | Banner trạng thái + nút thử lại kết nối |
| B | Nhắn tin & Tương tác | Toàn bộ thao tác chat trong vendor group |
| C | Quản lý hội thoại | Ghim hội thoại, watermark, quyền tải file, tên hiển thị nhóm, mask SĐT, filter thẻ phân loại |
| D | Phân quyền & Multi-account | Hiệu ứng phân quyền lên hiển thị + banner đại diện tài khoản (ZaloIdentityBar) + logic resolve account khi gửi tin + Quản lý thành viên nhóm (Admin-only) |
| E | Công việc nội bộ | Tạo task, Nhật Ký công việc, banner task pending trên header chat, task panel trong right panel |
| G | Portal-wide | System message tự động khi ghim/bỏ ghim tin (PinNotificationBubble) |

### 1.3 Vai trò & Thuật ngữ chính

| Thuật ngữ | Định nghĩa ngắn |
|---|---|
| **Admin** | Quản trị nội bộ, toàn quyền truy cập mọi vendor group. |
| **Staff** | Nhân viên nội bộ, chỉ truy cập nhóm được gán. |
| **Vendor** | Nhà cung cấp — chỉ tương tác qua Zalo, không vào Portal. |
| **Vendor Group** | Nhóm chat NCC trên Zalo đã đồng bộ vào Portal. |
| **Zalo Account** | Tài khoản Zalo cá nhân đã liên kết, đóng vai trò "đại diện công ty". |
| **Acting As** | Tài khoản Zalo mà staff đang "đại diện" khi gửi tin trong vendor group. |
| **Origin** | Nguồn tin: `ZALO` (sync lên Zalo, vendor thấy) / `INTERNAL` (chỉ trong Portal). |

### 1.4 Quy ước ký hiệu

- **#XX**: mã định danh tính năng — dùng để đối chiếu với test case nghiệm thu.
- **[EXTRA]**: tính năng mở rộng đã làm trong demo, không có trong scope nghiệp vụ ban đầu, nhưng cần để hệ thống hoạt động đúng.
- **✅ / ❌ ở cột "Sync lên Zalo"**: tin nhắn có đồng bộ qua Zalo cho vendor thấy hay không.
- **FR-XX.n**: Functional Requirement thứ n của tính năng #XX (dùng để map vào test case).

### 1.5 Tài liệu tham chiếu

| Tài liệu | Mục đích |
|---|---|
| `FSD-Admin-Site.md` | Spec các chức năng quản trị trên Admin Site + cross-cutting rules. |
| Demo source code (`src/features/zalo-vendor/`) | Tham chiếu UI/UX, behavior thực tế đã build. |

---

## 2. Nhóm A — Kết nối & Đồng bộ Zalo *(phần Chat Portal)*

> **Phạm vi nhóm này trên Chat Portal:**
> - Hiển thị banner trạng thái kết nối Zalo khi tài khoản đại diện có sự cố.
> - Cung cấp nút **"Thử lại kết nối"** cho cả Staff và Admin (#27).
>
> **Không thuộc tài liệu này** — xem `FSD-Admin-Site.md`:
> - **#1** Quét QR liên kết tài khoản Zalo (Admin Site only).
> - **#2** Đồng bộ danh sách nhóm chat từ Zalo (backend behavior do Browser Agent thực hiện).
> - **#3** Đồng bộ tin nhắn real-time (backend behavior).
> - **#4** Đồng bộ lịch sử chat (kích hoạt thủ công từ Admin Site, backend xử lý).
>
> Chat Portal chỉ là nơi *thấy kết quả* của #1–#4 (nhóm xuất hiện trong sidebar, tin nhắn tự cập nhật) — không cần Dev xử lý logic gì riêng cho 4 tính năng này khi build phía Portal.

### 2.1 Trạng thái kết nối & banner hiển thị

| | |
|---|---|
| **Actors** | Staff · Admin (cùng thấy banner; Admin có thêm thao tác trong banner expired) |
| **Trigger** | Backend chuyển trạng thái tài khoản Zalo của group đang mở |

#### Mục tiêu

Khi tài khoản Zalo đại diện cho một vendor group gặp sự cố kết nối, Chat Portal phải báo cho user biết **rõ ràng tình trạng**, **đường thoát thủ công** nếu có, và **không để user nghĩ rằng tin nhắn vẫn đang sync bình thường**.

#### Mô tả

Mỗi tài khoản Zalo trong hệ thống luôn có một trong 4 trạng thái sau (do backend xác định). Khi user mở một vendor group, Chat Portal hiển thị banner tương ứng với trạng thái của tài khoản đại diện cho group đó:

| Trạng thái | Banner trên Portal | Hành vi input chat |
|---|---|---|
| `connected` | Không hiện banner | Cho phép gửi tin bình thường |
| `unstable` | Banner **vàng** — "Kết nối Zalo không ổn định, tin nhắn có thể bị chậm" | Vẫn cho phép gửi tin (có thể delay) |
| `disconnected` | Banner **đỏ** — "Mất kết nối Zalo" + nút **"Thử lại kết nối"** | Disable input gửi tin, tooltip giải thích |
| `expired` | Banner **đỏ** — "Phiên Zalo đã hết hạn. Vui lòng liên hệ Admin để quét QR mới" | Disable input gửi tin |

#### Yêu cầu chức năng

- **FR-A.1:** Banner hiển thị ở **đầu cửa sổ chat** của vendor group đang mở.
- **FR-A.2:** Trạng thái cập nhật **real-time** — khi backend chuyển state, banner phải update ngay không cần user F5.
- **FR-A.3:** Nếu một group có ≥2 tài khoản Zalo đang sync (xem [Nhóm D](#4-nhóm-d--phân-quyền--multi-account-phần-chat-portal)):
  - Banner chỉ hiện khi **tài khoản đang active cho group này** (xem [mục 4.1](#41-banner-đại-diện-tài-khoản-zalo-d4)) gặp sự cố.
  - Các tài khoản khác trong group hoạt động bình thường không ảnh hưởng banner.
- **FR-A.4:** Sidebar NCC: nhóm có tài khoản đại diện đang `disconnected` hoặc `expired` hiện **icon cảnh báo nhỏ** cạnh tên nhóm để user nhận biết từ sidebar.
- **FR-A.5:** Khi user đang ở cửa sổ chat và trạng thái khôi phục về `connected`: banner tự ẩn, input bật lại, không cần thông báo "đã khôi phục" rườm rà.

#### Trạng thái UI & Edge Cases

- **Vào group khác cùng tài khoản unstable:** vẫn hiện banner vàng tương ứng.
- **Tin user đang soạn nhưng chưa gửi khi chuyển sang disconnected:** giữ draft local, không xóa nội dung. Khi khôi phục → user nhấn gửi tiếp.
- **Mất kết nối với Portal Server (không phải với Zalo):** đây là vấn đề khác — hiện banner riêng "Mất kết nối với máy chủ" ở cấp toàn Portal (không thuộc tính năng #27).
- **Nhiều tài khoản unstable cùng lúc trong cùng một group:** trên thực tế chỉ 1 tài khoản đang đại diện group cho user hiện tại — nên chỉ 1 banner. Không gộp nhiều banner.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Banner vàng `unstable` (header chat).
> - Banner đỏ `disconnected` + nút "Thử lại kết nối".
> - Banner đỏ `expired` + hướng dẫn liên hệ Admin.
> - Sidebar item kèm icon cảnh báo.

---

### 2.2 #27 — Thử lại kết nối thủ công

| | |
|---|---|
| **Actors** | Staff · Admin (cùng có quyền nhấn nút thử lại) |
| **Scope** | Chỉ phần Portal: nút thử lại + behavior khi nhấn |

#### Mục tiêu

Khi auto-retry của hệ thống không khôi phục được kết nối, cho phép user (Staff hoặc Admin) **chủ động trigger một lần thử lại** từ chính cửa sổ chat — **không cần phải liên hệ Admin hay thao tác QR**.

#### Business Flow

**Bối cảnh:** Backend đã thử auto-reconnect nhưng thất bại sau N lần → trạng thái tài khoản chuyển `disconnected` → banner đỏ kèm nút **"Thử lại kết nối"** hiện trên Portal.

1. User (Staff hoặc Admin) thấy banner đỏ trên cửa sổ chat của vendor group bị ảnh hưởng.
2. User nhấn nút **"Thử lại kết nối"** trong banner.
3. Nút chuyển trạng thái loading (icon spinner + chữ "Đang thử…"). **Disable** trong khi đang xử lý để tránh spam.
4. Hệ thống gọi backend trigger reconnect + reset retry counter.
5. **Kết quả:**
   - **Thành công** → trạng thái về `connected` → banner tự ẩn, input bật lại, tin nhắn bị miss trong thời gian mất kết nối được sync về (backend xử lý gap-fill).
   - **Thất bại** → banner update message: "Vẫn chưa kết nối được. Hệ thống đang tiếp tục thử lại tự động." Nút "Thử lại" bật lại sau cooldown để user có thể bấm lại.

#### Yêu cầu chức năng

- **FR-27.1:** Nút **"Thử lại kết nối"** hiển thị cho **cả Staff và Admin** khi banner `disconnected`. Không phân quyền theo role.
- **FR-27.2:** Khi nhấn, nút disable trong **ít nhất 5 giây** (cooldown) để tránh spam backend.
- **FR-27.3:** Trong trạng thái `expired` (phiên Zalo hết hạn thật sự): **không hiện nút "Thử lại"**. Thay vào đó hiện hướng dẫn "Liên hệ Admin để quét QR mới". Chỉ Admin có thể vào Admin Site để re-link tài khoản (xem `FSD-Admin-Site.md` #20).
- **FR-27.4:** Auto-retry vẫn chạy nền song song — manual retry chỉ là **shortcut để user kích hoạt thử lại ngay**, không thay thế auto-retry.
- **FR-27.5:** Nút thử lại **không yêu cầu** user quét QR. Quét QR chỉ áp dụng khi `expired` và chỉ trên Admin Site.
- **FR-27.6:** Sau khi nhấn thử lại thành công, không hiển thị toast "đã kết nối lại" — chỉ cần banner ẩn là đủ.

#### Trạng thái UI & Edge Cases

- **User nhấn liên tục:** sau lần nhấn đầu, nút disabled cooldown — click lại không có hiệu lực, hiện tooltip "Vui lòng chờ trước khi thử lại".
- **User chuyển sang group khác giữa khi đang thử:** tiến trình thử lại của tài khoản vẫn chạy nền. Khi quay lại group, thấy kết quả mới nhất.
- **Trạng thái chuyển từ `disconnected` → `expired` trong khi user đang xem:** banner đổi từ "Mất kết nối + nút thử" sang "Phiên hết hạn + hướng dẫn liên hệ Admin" real-time.
- **Staff nhấn thử lại nhưng kết quả là `expired`:** banner đổi sang trạng thái `expired` — nói rõ "Phiên Zalo cần được Admin quét QR mới". Staff không có quyền tự xử lý tiếp.
- **Group có nhiều tài khoản Zalo đại diện (multi-account):** nút "Thử lại" chỉ thử lại tài khoản **đang active cho group hiện tại** (xem [Nhóm D — mục 4.1](#41-banner-đại-diện-tài-khoản-zalo-d4)), không thử lại toàn bộ tài khoản trong group.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Banner đỏ `disconnected` + nút "Thử lại kết nối" (trạng thái thường).
> - Nút "Thử lại kết nối" trong trạng thái loading.
> - Banner đỏ `expired` (không có nút thử) + hướng dẫn liên hệ Admin.

---

## 3. Nhóm B — Nhắn tin & Tương tác *(phần Chat Portal)*

> **Phạm vi nhóm này trên Chat Portal:**
> - Toàn bộ thao tác chat trong vendor group: gõ/gửi tin, gửi media, reply, react, thu hồi, ghim, forward, bookmark, mention.
> - Quy tắc hiển thị tên người gửi được mô tả tại [3.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm) (cross-cutting cho toàn nhóm B).
>
> **Không thuộc tài liệu này** — xem `FSD-Admin-Site.md`:
> - Hành vi sync 2 chiều với Zalo của các tin (backend Browser Agent).
> - Audit log đầy đủ cho thu hồi (#9) — Portal chỉ hiển thị nội dung gốc cho Admin; log lưu ở backend.
> - Visual style chi tiết của tin hệ thống thông báo ghim/bỏ ghim — Portal hiển thị behavior mô tả tại [3.7](#37-10--ghim-tin-nhắn), Admin Site doc quy định style cụ thể.

### 3.1 Cấu trúc message bubble & thao tác chung trong nhóm

| | |
|---|---|
| **Actors** | Staff · Admin (trong vendor group được phân quyền truy cập — xem nhóm D) |
| **Scope** | Áp dụng cho mọi tin trong vendor group, không phụ thuộc feature riêng |

#### Mục tiêu

Định nghĩa khung hiển thị chung của một message bubble và menu thao tác chung — để các feature #5-#11, #25, mention đều build trên cùng một cấu trúc.

#### Mô tả

**Mỗi message bubble luôn có 4 thành phần cố định:**

| Thành phần | Mô tả |
|---|---|
| **Author label** | Tên người gửi hiển thị theo loại tin: tin ZALO từ staff → **"[Tên tài khoản Zalo đại diện] ([Tên nhân viên])"** (ví dụ: "Công ty ABC (Huyền)"); tin từ vendor → tên Zalo của vendor; tin INTERNAL (system message) từ staff/admin → tên nhân viên thuần không ngoặc; system message tự động → "Hệ thống". |
| **Origin badge** | Badge nhỏ phân biệt: tin `ZALO` (không cần badge — mặc định) hoặc tin `INTERNAL` (badge "Nội bộ" + icon khóa, vendor không thấy). |
| **Content area** | Nội dung text / media / quote / reaction tùy loại tin. |
| **Hover menu** | Hiện khi hover hoặc right-click trên tin `ZALO` — gồm: Reply (#7), React (#8), Thu hồi (#9, chỉ với tin do chính user gửi), Ghim (#10), Forward đến Admin (#11), Bookmark (#25). Các mục disable theo quyền/loại tin. **System messages (TASK, PHONE_REVEAL_*) không có hover menu.** |

#### Yêu cầu chức năng

- **FR-B.1:** Tin `INTERNAL` **không** đồng bộ lên Zalo; vendor không thấy. Trong vendor group chat, INTERNAL xuất hiện dưới dạng **system message** gồm: `TASK` và `PHONE_REVEAL_*` — hiển thị full-width với style riêng (không phải bubble thông thường), **không có hover menu, không có action nào**. *(Tin `FORWARD` chỉ xuất hiện trong DM Staff↔Admin — xem [3.8](#38-11--forward-tin-nhắn-đến-admin); tin `NOTE` chỉ xuất hiện trong "Nhật Ký công việc" — xem [Nhóm E](#5-nhóm-e--quản-lý-task-phần-chat-portal).)*
- **FR-B.2:** Hover menu chỉ hiện thao tác **khả dụng** với tin đó (ví dụ: tin do vendor gửi → ẩn "Thu hồi"; tin đã thu hồi → ẩn "Reply", "React", "Forward"). **System messages (TASK, PHONE_REVEAL_*) không có hover menu.**
- **FR-B.3:** Mọi tin có author label clickable → mở mini-profile popover (Zalo display name + role/badge nếu là staff). Không bắt buộc trong Mốc 1; có thể defer.
- **FR-B.4:** Khi tin được tạo / cập nhật / xóa từ backend, message list cập nhật real-time — không cần user F5.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Bubble tin từ vendor / staff / admin (so sánh 3 author label).
> - Hover menu mở ra trên bubble.
> - Badge "Nội bộ" trên tin INTERNAL.

---

### 3.2 #5 — Gửi/nhận tin nhắn văn bản (TXT)

| | |
|---|---|
| **Actors** | Staff · Admin gửi · Vendor nhận (hoặc ngược lại) |
| **Sync lên Zalo** | ✅ |

#### Mục tiêu

Cho phép user nội bộ gõ và gửi tin văn bản vào vendor group; tin xuất hiện trên Zalo dưới danh tính của tài khoản Zalo mà user đang đại diện.

#### Business Flow

1. User mở vendor group → input chat ở chân cửa sổ (nếu banner kết nối cho phép — xem [2.1](#21-trạng-thái-kết-nối--banner-hiển-thị)).
2. User gõ nội dung → nhấn **Enter** (hoặc nút Gửi) để gửi. `Shift+Enter` xuống dòng.
3. Hệ thống xác định tài khoản Zalo đại diện đang active trong nhóm (xem [Nhóm D](#4-nhóm-d--phân-quyền--multi-account-phần-chat-portal)), gắn danh tính đó vào tin và gửi lên backend.
4. Tin xuất hiện ngay trong message list với trạng thái **"đang gửi"** (icon đồng hồ). Khi backend xác nhận đã sync xong → icon đổi sang **"đã gửi"** (check).
5. Vendor và các thành viên khác trong nhóm Zalo nhận được tin với tên hiển thị là tên tài khoản Zalo đại diện (ví dụ: "Công ty ABC").

#### Yêu cầu chức năng

- **FR-5.1:** Input hỗ trợ text thuần, emoji native của OS. **Không** hỗ trợ rich text (bold/italic) trong Mốc 1.
- **FR-5.2:** Staff chỉ thấy vendor group trong sidebar nếu được phân quyền đại diện ít nhất một tài khoản Zalo trong nhóm đó. Nếu không có quyền → nhóm không hiển thị trong sidebar (xem [Nhóm D](#4-nhóm-d--phân-quyền--multi-account-phần-chat-portal)).
- **FR-5.3:** Tin gửi thất bại (backend trả lỗi sync Zalo) → hiển thị icon ❗ kèm nút **"Thử gửi lại"** trong bubble; không tự retry vô hạn.
- **FR-5.4:** Input giữ **draft per-group** (chuyển sang group khác rồi quay lại → nội dung vẫn còn). Draft mất khi reload trang — không bắt buộc persist tới backend.
- **FR-5.5:** Khi gõ ký tự `@` → mở mention picker (xem [3.10](#310-extra--mention-thành-viên-nhóm)).

#### Trạng thái UI & Edge Cases

- **Tin rỗng / chỉ khoảng trắng:** không cho gửi (nút Gửi disabled).
- **Tin quá dài:** không giới hạn ký tự cho Mốc 1 (Zalo có giới hạn riêng — backend xử lý).
- **Connection state `unstable`:** vẫn cho gõ và gửi, tin có thể ở trạng thái "đang gửi" lâu hơn bình thường.
- **Connection `disconnected` hoặc `expired`:** input disable (xem 2.1).

#### Mockup tham chiếu

> [BA bổ sung] —
> - Input compose ở chân cửa sổ chat.
> - Tin trong 3 trạng thái: đang gửi · đã gửi · gửi lỗi (nút Thử gửi lại).

---

### 3.3 #6 — Gửi/nhận hình ảnh, tập tin, video

| | |
|---|---|
| **Actors** | Staff · Admin gửi và nhận · Vendor đối ứng |
| **Sync lên Zalo** | ✅ |

#### Mục tiêu

Hỗ trợ trao đổi hình ảnh, tài liệu, video qua vendor group — không giới hạn kích thước, có cảnh báo nội bộ với video > 300MB.

#### Business Flow

1. User nhấn icon đính kèm trong input chat → chọn 1 hoặc nhiều file từ máy (image, document, video).
2. File hiển thị trong **preview list** trên input trước khi gửi → user có thể remove từng file, thêm caption (optional).
3. Nhấn **Gửi** → upload và đồng bộ lên Zalo.
4. Tin media xuất hiện trong message list:
   - **Image:** thumbnail trong bubble, click mở viewer (kèm watermark — xem [4.x #13]).
   - **File:** card hiển thị tên file + dung lượng + icon loại file + nút **Tải xuống** (enforce theo #14 — xem [4.x #14]).
   - **Video:** thumbnail + nút play; click mở player; file > 300MB có **badge cảnh báo** "Video lớn (>300MB)" cạnh tin.

#### Yêu cầu chức năng

- **FR-6.1:** Hỗ trợ tất cả định dạng file. **Không** giới hạn kích thước phía Portal (giới hạn nếu có là do Zalo).
- **FR-6.2:** Video **> 300MB:** bubble hiển thị badge cảnh báo nội bộ (vendor không thấy badge này, chỉ thấy tin video bình thường). Badge có tooltip "Video lớn, có thể sync chậm hơn 30s".
- **FR-6.3:** Khi tải xuống file: kiểm tra quyền tải của nhân viên đó trong nhóm đó theo từng loại file (xem [Nhóm C — #14](#4-nhóm-c--hiển-thị--kiểm-soát-phần-chat-portal)). Quyền tắt → nút Tải xuống disabled, tooltip lý do.
- **FR-6.4:** Tải video > 300MB: trước khi tải, hiện **confirm dialog** "File này nặng X MB, tiếp tục tải?" — kể cả khi user có quyền.
- **FR-6.5:** Upload đang chạy → bubble hiện trạng thái progress (%). Upload thất bại → hiện icon ❗ + nút **Thử lại**.

#### Trạng thái UI & Edge Cases

- **Drag-and-drop file vào cửa sổ chat:** hỗ trợ — drop vào input zone thì preview như khi chọn từ explorer.
- **Paste hình ảnh từ clipboard:** hỗ trợ — paste vào input thì attach như file.
- **Nhiều file cùng lúc:** mỗi file là 1 tin riêng (không gộp), gửi tuần tự nhưng UI không block — user có thể tiếp tục gõ tin khác trong khi upload nền.
- **Image bị lỗi load:** placeholder "Không tải được hình" + nút Reload.
- **Video > 300MB sync chậm:** tin xuất hiện với trạng thái "đang đồng bộ" cho đến khi backend confirm; UI không treo input.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Preview list khi attach file trước khi gửi.
> - Bubble tin chứa image (thumbnail + watermark hint).
> - Bubble tin chứa file (card có tên + dung lượng + Tải xuống).
> - Bubble video > 300MB với badge cảnh báo.
> - Image viewer mở rộng.

---

### 3.4 #7 — Reply (trích dẫn tin nhắn)

| | |
|---|---|
| **Actors** | Staff · Admin (reply tin của vendor hoặc tin nội bộ) |
| **Sync lên Zalo** | ✅ (khi reply tin `ZALO`) |

#### Mục tiêu

Cho phép trả lời một tin cụ thể, giữ ngữ cảnh hội thoại — đặc biệt khi nhóm có nhiều luồng song song.

#### Business Flow

1. User hover một tin → menu hiện → chọn **"Reply"** (hoặc icon ↩).
2. Phía trên input chat xuất hiện **quote preview**: tên tác giả tin gốc + snippet content (~120 ký tự đầu) + thumbnail nếu là media. Có nút ✕ để hủy quote.
3. User gõ nội dung trả lời → gửi.
4. Tin mới xuất hiện trong list với **block quote** ở đầu bubble — click block quote → scroll-to tin gốc + highlight ~2s.

#### Yêu cầu chức năng

- **FR-7.1:** Quote hiển thị: tên người gửi gốc (theo quy tắc hiển thị tên tại [3.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm)), snippet tối đa ~120 ký tự, thumbnail/tên file nếu tin gốc là media.
- **FR-7.2:** Click vào quote block trong bubble → scroll-to tin gốc trong list + highlight tạm. Nếu tin gốc đã bị xóa khỏi list (cuộn lên quá xa) → backend lazy load để jump đến.
- **FR-7.3:** Mọi tin reply trong vendor group đều đồng bộ lên Zalo (vendor thấy cả nội dung trả lời lẫn phần trích dẫn). System messages (TASK, PHONE_REVEAL_*) không có hover menu nên không reply được.
- **FR-7.4:** Tin đã thu hồi **không cho reply** (hover menu ẩn Reply). Nếu tin gốc bị thu hồi **sau khi** đã có tin reply trích dẫn nó → quote trong bubble reply tự động cập nhật: Staff thấy "Tin nhắn đã thu hồi" (placeholder); Admin vẫn thấy nội dung gốc trong quote (theo quy tắc tại [3.6](#36-9--thu-hồi-tin-nhắn)).

#### Trạng thái UI & Edge Cases

- **Hủy quote giữa chừng:** click ✕ trên quote preview → input quay về compose thường, nội dung text đã gõ giữ nguyên.
- **Reply tin của chính mình:** vẫn cho phép.
- **Quote tin từ vendor đã rời nhóm:** vẫn hiển thị tên cũ + snippet.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Quote preview trên input chat.
> - Bubble tin reply có quote block ở đầu.
> - Quote block trong bubble khi tin gốc đã bị thu hồi sau khi reply (Staff vs Admin).

---

### 3.5 #8 — Thả cảm xúc (Reaction)

| | |
|---|---|
| **Actors** | Staff · Admin · Vendor đều có thể react |
| **Sync lên Zalo** | ✅ |

#### Mục tiêu

Cho phép phản hồi nhanh một tin bằng emoji — đỡ phải gõ tin trả lời ngắn ("ok", "đồng ý").

#### Business Flow

1. User hover tin → menu hiện → chọn icon **❤️** hoặc **👍**.
2. Reaction xuất hiện dưới bubble dạng chip nhỏ: `❤️ 2 · 👍 1` (số là tổng count).
3. Hover chip → tooltip liệt kê ai đã thả (hiển thị tên theo quy tắc tại [3.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm)).
4. Click lại icon trong menu (hoặc click chip mình đã thả) → **toggle off** (bỏ react).

#### Yêu cầu chức năng

- **FR-8.1:** **Chỉ hỗ trợ 2 emoji: ❤️ và 👍.** Không cho thả emoji khác.
- **FR-8.2:** Mỗi user chỉ thả tối đa 1 react mỗi loại cho cùng 1 tin (không cho thả 2 lần ❤️).
- **FR-8.3:** Reaction là **toggle** — nhấn lại để bỏ; backend cập nhật và sync lên Zalo cả 2 chiều.
- **FR-8.4:** Reaction từ vendor (qua Zalo) đồng bộ về Portal và hiển thị đúng tác giả vendor.
- **FR-8.5:** Tin nhắn **cuối cùng của vendor** trong cửa sổ chat luôn hiển thị sẵn 2 icon ❤️ và 👍 ngay bên dưới bubble (không cần hover) để Staff/Admin có thể thả cảm xúc nhanh.

#### Trạng thái UI & Edge Cases

- **Thả react lên tin đã thu hồi:** không cho phép — hover menu ẩn icon react.
- **System messages (TASK, PHONE_REVEAL_*) trong vendor group:** không có action nào — không react được.
- **Reaction sync chậm:** hiển thị optimistic (cập nhật UI ngay), rollback nếu backend báo lỗi.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Bubble có chip reaction `❤️ 2 · 👍 1`.
> - Tooltip "ai đã thả" khi hover chip.
> - Hover menu hiện 2 emoji ❤️ 👍.

---

### 3.6 #9 — Thu hồi tin nhắn

| | |
|---|---|
| **Actors** | Staff · Admin (thu hồi tin do chính mình gửi) · Vendor (qua Zalo) |
| **Sync lên Zalo** | ✅ |

#### Mục tiêu

Cho phép người gửi rút lại tin đã gửi nhầm; đảm bảo **Admin vẫn xem được nội dung gốc** để audit/quy trách nhiệm, trong khi Staff và Vendor không thấy.

#### Business Flow

1. User hover tin **của chính mình** → menu hiện → chọn **"Thu hồi"**.
2. Thao tác được thực hiện ngay (không có confirm dialog). Backend đánh dấu tin `isRecalled = true`, sync sang Zalo.
3. Tin trong list cập nhật ngay:
   - **Vendor (trên Zalo):** thấy placeholder "Tin nhắn đã thu hồi".
   - **Staff (trên Portal):** thấy placeholder **"Tin nhắn đã thu hồi"** kèm tên người đã gửi tin gốc.
   - **Admin (trên Portal):** thấy **nội dung gốc đầy đủ** với **strikethrough** + label "(đã thu hồi lúc HH:mm)".
4. Tin thu hồi vẫn giữ vị trí trong timeline (không xóa khỏi message list).

#### Yêu cầu chức năng

- **FR-9.1:** Chỉ user gửi tin (acting-as account đó) mới thấy mục "Thu hồi" trong hover menu của tin đó. Không cho thu hồi tin của người khác.
- **FR-9.2:** **Admin (role)** xem mọi tin đã thu hồi (cả của vendor, của staff khác) với **content gốc + strikethrough + label thời điểm thu hồi**. Áp dụng cả khi vendor thu hồi tin từ Zalo (sync về).
- **FR-9.3:** **Staff (role)** không thấy nội dung gốc của bất kỳ tin đã thu hồi nào (kể cả tin do chính họ gửi đã thu hồi — chỉ thấy placeholder).
- **FR-9.4:** Tin đã thu hồi **không cho React, Reply, Forward, Bookmark** (hover menu ẩn các mục này). Pin cũng disable.
- **FR-9.5:** Không có thời hạn thu hồi phía Portal — backend phụ thuộc giới hạn của Zalo.

#### Trạng thái UI & Edge Cases

- **Staff thu hồi tin của chính mình → role là Staff:** sau khi thu hồi vẫn chỉ thấy placeholder (không thấy lại content gốc).
- **Admin thu hồi tin của chính mình:** vẫn thấy content gốc (do là Admin role).
- **Tin media bị thu hồi:** hiển thị placeholder, thumbnail không hiện. Admin vẫn thấy thumbnail + strikethrough trên caption.
- **Tin đã được forward đến DM Admin (#11) rồi mới thu hồi ở vendor group:** bản trong DM ghi snapshot tại thời điểm forward — vẫn còn content (xem [3.8 #11](#38-11--forward-tin-nhắn-đến-admin)).

#### Mockup tham chiếu

> [BA bổ sung] —
> - Tin đã thu hồi — góc nhìn Staff (placeholder + tên người gửi gốc).
> - Tin đã thu hồi — góc nhìn Admin (nội dung + strikethrough + label thời điểm).

---

### 3.7 #10 — Ghim tin nhắn

| | |
|---|---|
| **Actors** | Staff · Admin (cùng có quyền pin trong group được truy cập) |
| **Sync lên Zalo** | ✅ (thao tác ghim + system message bubble) |

#### Mục tiêu

Ghim một số tin quan trọng lên đỉnh nhóm để mọi thành viên (cả Portal lẫn Zalo) dễ tra cứu nhanh — ví dụ: yêu cầu báo giá, deadline, thông tin liên hệ.

#### Business Flow

1. User hover tin → menu **"Ghim"**.
2. Hệ thống:
   - Set `pinned = true` cho tin.
   - Sync thao tác pin lên Zalo (vendor cũng thấy tin được ghim trong Zalo).
   - **Chèn tin hệ thống thông báo ghim** vào đúng vị trí trong timeline — full-width, nội dung: "[Tên người ghim] đã ghim [snippet tin]". Click vào tin hệ thống này → scroll-to tin được ghim.
3. Trên **đầu message list** xuất hiện **thanh ghim** (top bar) liệt kê các tin đã pin (top N gần nhất).
4. Click 1 mục trong thanh ghim → scroll-to tin gốc + highlight ~2s.
5. **Unpin:** hover tin đã pin → menu **"Bỏ ghim"** → tương tự chèn tin hệ thống thông báo bỏ ghim (`action: UNPIN`), sync Zalo.

#### Yêu cầu chức năng

- **FR-10.1:** Thanh ghim hiển thị tối đa số tin Zalo cho phép (system config — cần cập nhật nếu Zalo thay đổi chính sách). Có nút "Xem tất cả" → mở popup list đầy đủ.
- **FR-10.2:** Mỗi mục trong thanh ghim hiển thị: tên người gửi gốc + snippet content + thumbnail nếu media + nút bỏ ghim (chỉ Staff/Admin có quyền).
- **FR-10.3:** Khi tin được ghim, **bubble gốc** trong message list có icon 📌 nhỏ ở góc.
- **FR-10.4:** Tin hệ thống thông báo ghim/bỏ ghim hiển thị ngay tại thời điểm thao tác xảy ra trong timeline — full-width, nội dung rõ hành động và người thực hiện. Click vào tin hệ thống → scroll-to tin được ghim/bỏ ghim.
- **FR-10.5:** Sync 2 chiều: vendor pin/unpin từ Zalo → Portal cập nhật thanh ghim + chèn tin hệ thống thông báo ghim/bỏ ghim tương ứng.
- **FR-10.6:** Tin đã thu hồi không cho pin (menu disable). Nếu tin đã pin sau đó bị thu hồi → vẫn giữ trong thanh ghim nhưng hiển thị placeholder "Tin đã thu hồi" (Admin vẫn thấy content gốc — xem 3.6).

#### Trạng thái UI & Edge Cases

- **Pin một tin đã pin:** menu hiện "Bỏ ghim" thay vì "Ghim".
- **Nhiều user pin/unpin liên tiếp:** mỗi thao tác tạo 1 tin hệ thống riêng (không gộp).
- **Vendor pin tin của staff:** tin hệ thống hiển thị tên Zalo của vendor là người thực hiện ghim.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Thanh ghim trên đầu message list (1-3 tin).
> - Bubble tin gốc có icon 📌.
> - Tin hệ thống thông báo ghim/bỏ ghim trong timeline (full-width).
> - Popup "Xem tất cả tin đã ghim".

---

### 3.8 #11 — Forward tin nhắn đến Admin

| | |
|---|---|
| **Actors** | Staff · Admin gửi forward → Admin nhận trong DM |
| **Sync lên Zalo** | ❌ (tin nội bộ Portal) |

#### Mục tiêu

Cho phép Staff escalate một tin từ vendor group đến Admin qua kênh DM 1-1 riêng tư — kèm comment nếu cần — mà vendor và đồng nghiệp khác không thấy.

#### Business Flow

1. Staff (hoặc Admin) hover/right-click một tin trong vendor group → chọn **"Forward đến Admin"**.
2. Popup **"Chuyển đến Admin"** mở:
   - Preview tin gốc ở trên cùng (giống bubble đang hiển thị).
   - Textarea **"Ghi chú kèm theo (không bắt buộc)"** để user nhập comment.
   - Nút **Hủy** / **Gửi**.
3. Khi nhấn **Gửi**:
   - Tin gốc trong vendor group được đánh dấu `isForwardedToAdmin = true` → **chỉ người forward và Admin** thấy badge **"Đã chuyển Admin"** trong bubble (vendor và staff khác không thấy badge).
   - Một tin mới `internalType = FORWARD` được tạo trong **DM 1-1 giữa người forward và Admin**. Tin DM chứa: bar metadata (nguồn nhóm, người forward, comment), preview tin gốc, link tham chiếu tin gốc.
4. Admin nhận **notification trong DM** (badge unread + toast nếu đang online).
5. Trong DM, Admin **click vào tin được forward** (hoặc bar metadata) → điều hướng tự động:
   - Mở vendor group nguồn.
   - **Scroll-to** đúng tin gốc trong message list.
   - **Highlight tạm ~2s** để dễ nhận diện.
6. Trên đầu DM với Admin có **thanh tóm tắt các tin đã chuyển** gần đây từ mọi vendor group → click mục bất kỳ cũng jump-to tin gốc giống bước 5.

#### Yêu cầu chức năng

- **FR-11.1:** Mục **"Forward đến Admin"** hiện trong hover menu của mọi tin **`ZALO`** (kể cả tin do Admin gửi). System messages (TASK, PHONE_REVEAL_*) không có hover menu nên không forward được.
- **FR-11.2:** Comment là **tùy chọn** — gửi mà không gõ gì vẫn được.
- **FR-11.3:** Tin FORWARD trong DM **không sync lên Zalo** (vendor không thấy).
- **FR-11.4:** Badge **"Đã chuyển Admin"** trong vendor group chỉ hiển thị cho:
  - Người đã forward.
  - Mọi Admin role.
  - **Không** hiển thị cho staff khác trong nhóm và **không** cho vendor.
- **FR-11.5:** Một tin có thể được forward **nhiều lần** bởi nhiều người khác nhau → mỗi lần forward tạo 1 entry riêng trong DM tương ứng (mỗi cặp Staff-Admin có DM riêng).
- **FR-11.6:** **Jump-to tin gốc** (bước 5):
  - Vendor group nguồn được mở đúng (nếu Admin chưa được phân quyền group đó — không xảy ra vì Admin toàn quyền — fallback: hiện toast lỗi).
  - Tin gốc highlight tạm bằng background nhẹ ~2s rồi fade.
  - Nếu tin gốc đã bị thu hồi/xóa khỏi nhóm: Admin **vẫn thấy tin** (do quy tắc thu hồi tại 3.6 cho phép Admin xem content gốc) — cuộn đến đúng vị trí và highlight bình thường.
- **FR-11.7:** **Thanh tóm tắt tin đã chuyển** trên đầu DM:
  - Hiển thị tối đa N tin forward gần nhất (giá trị N do BA chốt; demo dùng 5).
  - Mỗi mục: tên nhóm nguồn + người forward + snippet + timestamp.
  - Click → jump-to giống FR-11.6.
  - Có nút "Xem tất cả" → mở list đầy đủ.

#### Trạng thái UI & Edge Cases

- **Forward tin có media:** thumbnail/tên file copy sang DM; URL trỏ về resource gốc (không duplicate file).
- **Forward tin đã thu hồi:** vẫn forward được, nhưng tin trong DM ghi nhận trạng thái thu hồi tại thời điểm forward (snapshot).
- **Forward chính tin của mình:** vẫn cho phép.
- **Staff không có DM với Admin nào (chưa từng nhắn):** hệ thống tự tạo DM mới với Admin mặc định (hoặc tất cả Admin nếu spec yêu cầu nhiều người — BA xác nhận trong Mốc 3).

#### Mockup tham chiếu

> [BA bổ sung] —
> - Popup "Chuyển đến Admin" (preview tin gốc + textarea ghi chú).
> - Badge "Đã chuyển Admin" trên bubble vendor group (góc nhìn người forward).
> - Tin forward trong DM Admin (thanh metadata + preview tin gốc).
> - Thanh tóm tắt tin đã chuyển trên đầu DM.
> - Trạng thái highlight ~2s sau khi jump-to.

---

### 3.9 #25 — Đánh dấu tin nhắn (Bookmark)

| | |
|---|---|
| **Actors** | Mỗi user tự đánh dấu cho riêng mình (per-user) |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Cho phép user "ghim cá nhân" những tin quan trọng để xem lại sau — không chia sẻ với người khác, không lên Zalo.

#### Business Flow

1. User hover tin → menu **"Đánh dấu"** (hoặc icon ⭐).
2. Tin hiển thị icon ⭐ ở góc bubble — **chỉ user đó thấy**.
3. Trong sidebar/menu của user có mục **"Tin đã đánh dấu"** → mở list tất cả tin user đó đã bookmark across mọi group.
4. Click mục trong list → jump-to tin gốc trong group tương ứng (giống flow Forward 3.8 bước 5).
5. **Bỏ đánh dấu:** hover tin đã bookmark → menu **"Bỏ đánh dấu"**.

#### Yêu cầu chức năng

- **FR-25.1:** Bookmark là **per-user, per-message**. User A bookmark không ảnh hưởng user B.
- **FR-25.2:** Icon ⭐ trong bubble **chỉ hiện với chính user đã bookmark**. Staff khác hoặc vendor không thấy.
- **FR-25.3:** "Tin đã đánh dấu" list hiển thị: snippet content + author + tên group + timestamp. Sort default: mới nhất trước.
- **FR-25.4:** Click mục → jump-to + highlight ~2s như Forward.
- **FR-25.5:** Tin đã thu hồi đã bookmark trước đó:
  - **Staff:** giữ entry trong list nhưng hiển thị placeholder "Tin đã thu hồi" + cho phép bỏ đánh dấu.
  - **Admin:** vẫn thấy content gốc trong list (theo quy tắc 3.6).

#### Trạng thái UI & Edge Cases

- **Bookmark tin của chính mình:** cho phép.
- **System messages (TASK, PHONE_REVEAL_*) trong vendor group:** không có hover menu → không bookmark được. Tin `FORWARD` trong DM có thể bookmark (DM context).
- **Staff bị remove khỏi group:** tin đã bookmark từ group đó không còn truy cập được → entry hiển thị mờ với label "Không còn quyền truy cập" + cho bỏ đánh dấu.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Bubble có icon ⭐ (góc nhìn người đã bookmark vs người khác).
> - "Tin đã đánh dấu" list trong sidebar.
> - Entry mờ khi mất quyền truy cập group.

---

### 3.10 [EXTRA] — @mention thành viên nhóm

| | |
|---|---|
| **Actors** | Staff · Admin · Vendor (vendor mention từ Zalo → đồng bộ về Portal) |
| **Sync lên Zalo** | ✅ với tin `ZALO`; ❌ với tin `INTERNAL` |

#### Mục tiêu

Cho phép user "tag" trực tiếp một thành viên cụ thể (hoặc toàn nhóm) trong tin nhắn để gây chú ý — danh sách mention hiển thị giống hệt như trên Zalo.

#### Business Flow

1. User gõ ký tự `@` trong input chat → **danh sách mention** xuất hiện ngay tại con trỏ — hiển thị đúng danh sách thành viên như trên Zalo.
2. `@all` luôn ở đầu danh sách; bên dưới là danh sách thành viên trong nhóm Zalo.
3. User gõ tiếp ký tự → danh sách **filter theo tên** đang gõ sau ký tự `@`.
4. User chọn 1 mục (click hoặc Enter) → mention được chèn vào input dưới dạng **chip** (không phải text plain).
5. User tiếp tục gõ → có thể tag nhiều người trong cùng 1 tin.
6. Gửi tin → trong message list, mention hiển thị dạng **chip có background nhẹ**.

#### Yêu cầu chức năng

- **FR-mention.1:** Trigger danh sách: gõ ký tự `@` ở **vị trí đầu hoặc sau khoảng trắng**. Gõ `@` giữa từ (ví dụ `mail@something`) **không** trigger.
- **FR-mention.2:** Danh sách member trong picker lấy từ **snapshot member list của nhóm chat Zalo** (do Browser Agent đồng bộ), gồm:
  - **`@all`** ở đầu danh sách — mention toàn bộ thành viên nhóm.
  - **Toàn bộ thành viên trong nhóm Zalo** (tên Zalo, **không hiển thị avatar**) — giống danh sách đang thấy trên Zalo.
  - **Không** liệt kê Staff/Admin Portal riêng — chỉ hiển thị tên Zalo của tài khoản đại diện nếu có trong nhóm.
  - **Loại trừ tài khoản Zalo mà user đang đại diện (acting-as)** trong group hiện tại.
- **FR-mention.3:** Khi user gõ sau ký tự `@` → danh sách **filter trực tiếp** theo ký tự đang gõ (không có search box riêng, filter inline). `@all` luôn đứng đầu khi query rỗng; ẩn khi query không khớp "all".
- **FR-mention.4:** Mention trong vendor group đồng bộ lên Zalo. Vendor chỉ thấy tên **tài khoản Zalo đại diện** (không thấy tên nhân viên). Khi vendor mention `@[tên tài khoản Zalo đại diện]` từ Zalo → Portal nhận và **highlight tên tài khoản Zalo đó** trong bubble (không highlight tên nhân viên).
- **FR-mention.5:** Khi vendor mention tài khoản Zalo đại diện từ Zalo → **tất cả nhân viên đang đại diện tài khoản Zalo đó** trong nhóm đều nhận notification (badge unread + toast). `@all` thông báo cho toàn bộ thành viên nội bộ đang trong nhóm.
- **FR-mention.6:** Render trong bubble:
  - Mention thành viên → chip background nhẹ với tên Zalo.
  - `@all` → chip có **màu/style đặc biệt** (ví dụ amber/orange tint) để dễ phân biệt.
- **FR-mention.7:** Khi user xóa mention chip trong input (Backspace tại biên chip) → toàn bộ chip bị xóa cả cụm (không xóa từng ký tự một).

> **⚠️ Q&A cần xác nhận với client:** Tin nhắn có mention có vào mục "Tin nhắn nhắc đến tôi" riêng cho Admin không, hay chỉ hiện notification thông thường? Staff có nhận riêng hay chỉ Admin?

#### Trạng thái UI & Edge Cases

- **Danh sách không có kết quả match:** hiện text "Không tìm thấy thành viên".
- **Member đã rời nhóm sau khi được mention:** chip vẫn render với tên cũ + tooltip "Đã rời nhóm".
- **Mention một vendor đã được ẩn số điện thoại (xem Nhóm C — #28):** không liên quan — mention hoạt động bình thường.
- **Member list chưa sync về (group mới):** danh sách hiện loading state ngắn → fallback chỉ có `@all`.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Mention picker dropdown khi gõ `@`.
> - Picker có `@all` pin top + danh sách members.
> - Chip mention trong input compose.
> - Chip mention trong bubble (cá nhân vs @all với style khác).
> - Notification toast khi được mention.

---

## 4. Nhóm C — Quản lý hội thoại *(phần Chat Portal)*

> **Phạm vi nhóm này trên Chat Portal:**
> - Ghim hội thoại lên đầu sidebar NCC theo từng user (#12).
> - Hiển thị watermark trên ảnh khi mở viewer (#13).
> - Enforce quyền tải file (image/document/video) khi user nhấn Tải xuống (#14).
> - Hiển thị tên nhóm theo override Admin đã đặt — fallback về tên Zalo gốc (#26).
> - Mask số điện thoại trong tin với role Staff + popup gửi yêu cầu xem (#28).
> - Filter danh sách hội thoại NCC theo thẻ phân loại trên sidebar (#31).
>
> **Không thuộc tài liệu này** — xem `FSD-Admin-Site.md`:
> - Cấu hình bật/tắt **watermark** theo từng nhóm (#13 — Admin Site only).
> - Cấu hình quyền tải file của staff theo từng nhóm × loại file (#14 — gốc cấu hình ở Admin Site, #23).
> - Bật/tắt chế độ **ẩn SĐT** cho nhóm (#28 phía Admin) + trang **"Yêu cầu xem SĐT"** duyệt/từ chối/thu hồi (#29).
> - Đặt **tên hiển thị nhóm** (#26 phía Admin — Admin thực hiện rename trên Admin Site; Portal chỉ hiển thị kết quả).
> - **Quản lý thẻ phân loại** (#30) — Admin tạo/sửa/xóa thẻ ở Admin Site; Portal chỉ dùng thẻ để filter.

### 4.1 #12 — Ghim hội thoại

| | |
|---|---|
| **Actors** | Staff · Admin (mỗi người tự ghim cho riêng mình) |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Khi danh sách NCC lớn, cho phép user ghim các vendor group quan trọng lên đầu sidebar để truy cập nhanh — thiết lập riêng cho mỗi user, không ảnh hưởng người khác.

#### Business Flow

1. User mở sidebar NCC tab → hover một nhóm trong danh sách → menu kebab (⋯) hiện → chọn **"Ghim hội thoại"** (hoặc right-click → cùng menu).
2. Nhóm chuyển lên section **"Đã ghim"** ở đầu sidebar; section bên dưới là **"Tất cả NCC"** chứa các nhóm chưa ghim.
3. User vào nhóm khác → nhóm đã ghim vẫn ở đỉnh sidebar.
4. **Bỏ ghim:** hover nhóm trong section "Đã ghim" → menu kebab → **"Bỏ ghim"** → nhóm trả về section "Tất cả NCC".

#### Yêu cầu chức năng

- **FR-12.1:** Pin là **per-user, per-group**. User A ghim nhóm không ảnh hưởng user B; user A ghim sidebar của mình, user B vẫn thấy nhóm đó ở danh sách thường.
- **FR-12.2:** Sidebar NCC chia 2 section rõ ràng:
  - **"Đã ghim"** ở trên — chỉ hiện khi user có ≥1 nhóm ghim.
  - **"Tất cả NCC"** — danh sách nhóm chưa ghim.
- **FR-12.3:** Thứ tự trong section "Đã ghim": mới ghim nhất ở trên cùng. (Drag-and-drop sắp xếp lại là optional, BA xác nhận trong Mốc 2.)
- **FR-12.4:** Không sync lên Zalo, không hiển thị cho người dùng khác. Vendor không liên quan.
- **FR-12.5:** Pin không có giới hạn cứng phía Portal — không chặn user ghim nhiều nhóm. (Nếu cần giới hạn cho UX thì BA xác nhận; mặc định không giới hạn.)
- **FR-12.6:** Khi staff bị mất quyền truy cập nhóm (Admin remove khỏi #16): nhóm biến mất khỏi sidebar (cả 2 section) — pin entry cho user đó bị clear.

#### Trạng thái UI & Edge Cases

- **Ghim nhóm đang có unread:** badge unread vẫn hiển thị bình thường trong section "Đã ghim".
- **Search/filter sidebar:** khi user gõ search query, **cả 2 section** đều lọc theo query — section "Đã ghim" vẫn ở trên nếu còn nhóm match.
- **Filter theo thẻ phân loại (xem [4.6](#46-31--lọc-hội-thoại-ncc-theo-thẻ-phân-loại)):** áp dụng cho **cả 2 section** — nhóm ghim không match thẻ filter cũng bị ẩn.
- **Nhóm bị Admin remove khỏi sidebar khi user đang xem nhóm đó:** chuyển sang empty state, sidebar update.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Sidebar NCC tab với 2 section "Đã ghim" + "Tất cả NCC".
> - Menu kebab trên item sidebar (Ghim / Bỏ ghim).
> - Trạng thái section "Đã ghim" rỗng vs có nhóm.

---

### 4.2 #13 — Watermark hình ảnh

| | |
|---|---|
| **Actors** | Staff · Admin xem ảnh |
| **Sync lên Zalo** | ❌ (chỉ render phía Portal, vendor không thấy watermark) |

#### Mục tiêu

Hạn chế việc nhân viên chụp màn hình/chia sẻ trái phép hình ảnh vendor gửi — render overlay watermark dạng diagonal khi user mở viewer toàn màn hình, để mỗi screenshot lưu lại cũng kèm watermark có tên người xem.

#### Business Flow

1. User click thumbnail ảnh trong bubble chat của một vendor group có cấu hình **Watermark = ON** (cấu hình tại Admin Site).
2. **Image viewer** mở (modal toàn màn hình).
3. Viewer render **overlay watermark dạng diagonal tile/grid** trên toàn bộ vùng ảnh:
   - Nội dung mỗi tile: **"{Tên người xem} · {HH:mm DD/MM/YYYY}"**.
   - Style: nhạt (opacity thấp), không che mất nội dung chính, lặp đều khắp ảnh.
4. User có thể zoom/pan ảnh trong viewer → watermark vẫn cover toàn bộ vùng nhìn thấy.
5. Đóng viewer → quay về cửa sổ chat.

#### Yêu cầu chức năng

- **FR-13.1:** Watermark **chỉ** apply khi nhóm có cấu hình bật watermark. Cấu hình per-group (Admin Site). Khi tắt → viewer hiển thị ảnh bình thường, không overlay.
- **FR-13.2:** Nội dung mỗi tile watermark: **"{tên user đang xem} · {timestamp HH:mm DD/MM/YYYY}"**. Tên dùng tên hiển thị nội bộ của user (Staff/Admin).
- **FR-13.3:** Watermark render **client-side overlay** khi mở viewer. **Không** sửa file gốc, **không** lưu phiên bản có watermark — file gốc trong hệ thống vẫn nguyên.
- **FR-13.4:** Pattern phủ: **diagonal tile/grid** lặp đều khắp ảnh — đảm bảo bất kỳ vùng nào của ảnh khi screenshot cũng lưu lại watermark.
- **FR-13.5:** **Thumbnail trong bubble chat** (mini preview) **không** cần watermark — chỉ áp dụng cho viewer toàn màn hình.
- **FR-13.6:** Khi user **download** ảnh (xem [4.3 #14](#43-14--enforce-quyền-tải-tập-tin)): file tải về là **bản gốc không watermark** — watermark là tính năng của viewer, không can thiệp vào file download.
- **FR-13.7:** Multi-image trong tin (gửi 1 lúc nhiều ảnh, mỗi ảnh = 1 tin riêng theo [3.3 #6](#33-6--gửinhận-hình-ảnh-tập-tin-video)): mỗi ảnh khi mở viewer đều áp dụng watermark độc lập.

#### Trạng thái UI & Edge Cases

- **Browser zoom in/out trong viewer:** watermark scale theo viewer size, vẫn cover toàn bộ vùng nhìn thấy.
- **Multi-monitor / kéo viewer sang màn hình khác:** watermark re-render đúng tỷ lệ.
- **Ảnh quá lớn (resolution cao):** viewer pan/zoom — watermark vẫn cover vùng đang nhìn (không chỉ cover ở zoom 100%).
- **Ảnh trong tin đã thu hồi:** Staff thấy placeholder (không mở được viewer). Admin vẫn mở được viewer + thấy ảnh — watermark vẫn áp dụng.
- **Cấu hình watermark thay đổi (ON ↔ OFF) khi user đang mở viewer:** không retro-apply — viewer hiện tại giữ trạng thái lúc mở; lần mở tiếp theo dùng cấu hình mới.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Image viewer toàn màn hình với overlay watermark diagonal.
> - So sánh: viewer khi watermark ON vs OFF.
> - Chi tiết tile watermark (nội dung tên + timestamp).

---

### 4.3 #14 — Enforce quyền tải tập tin

| | |
|---|---|
| **Actors** | Staff (bị enforce theo cấu hình) · Admin (luôn có quyền tải) |
| **Sync lên Zalo** | ❌ (chỉ là rule client/server Portal) |

#### Mục tiêu

Khi Admin cấu hình hạn chế quyền tải một loại file (Hình ảnh / Tài liệu / Video) cho một staff trong một nhóm — Portal phải **ẩn nút Tải xuống** trên các tin của loại file đó trong nhóm đó.

#### Business Flow

1. Staff mở vendor group → thấy tin có file (image / document / video).
2. Trên bubble tin: nút **Tải xuống** trong card file.
3. Portal kiểm tra quyền tải của staff cho **(staff × nhóm × loại file)**:
   - **Có quyền** → nút Tải enabled, click → tải file về máy.
   - **Không có quyền** → nút Tải **không hiển thị** trên bubble file.
4. **Video > 300MB:** kể cả khi staff có quyền, click Tải → hiện **confirm dialog** "File này nặng X MB, tiếp tục tải?" (xem [3.3 #6 FR-6.4](#33-6--gửinhận-hình-ảnh-tập-tin-video)).
5. Admin luôn thấy nút Tải enabled trên mọi loại file ở mọi nhóm — không apply restriction.

#### Yêu cầu chức năng

- **FR-14.1:** Phân biệt **3 loại file** với 3 quyền độc lập: **Hình ảnh** · **Tài liệu** · **Video**. Quyền lưu theo cặp **(staff × nhóm × loại file)**.
- **FR-14.2:** Khi quyền = **OFF** với staff cho loại file đó trong nhóm:
  - Nút **Tải xuống** trên bubble file trong message list: **không hiển thị**.
  - Nút **Tải xuống** trong **image viewer** (#13): **không hiển thị** cho loại Hình ảnh.
- **FR-14.3:** **Admin** (role) luôn có quyền tải **mọi loại file ở mọi nhóm** — Portal **không** check restriction cho Admin.
- **FR-14.4:** Quyền thay đổi từ Admin Site → Portal cập nhật **real-time**:
  - Staff đang xem nhóm: nút Tải **xuất hiện / biến mất** không cần F5.
- **FR-14.5:** **Backend enforce song song**: nếu user bypass UI (gọi API tải trực tiếp) → backend reject. Disable phía Portal chỉ là UX hint — backend mới là nguồn cuối cùng.
- **FR-14.6:** **Video > 300MB**: confirm dialog hiện **kể cả khi staff có quyền** (kể cả Admin) — bước cảnh báo dung lượng độc lập với check quyền.
- **FR-14.7:** File trong tin đã **Forward đến DM Admin** (#11): Admin trong DM **luôn có quyền tải** (Admin role).
- **FR-14.8:** File trong tin đã **bookmark** (#25): khi user mở "Tin đã đánh dấu" và click jump-to → quay về nhóm gốc; check quyền dựa trên trạng thái **hiện tại** của staff trong nhóm gốc (không snapshot).

#### Trạng thái UI & Edge Cases

- **Quyền vừa được cấp giữa khi user đang xem nhóm:** nút Tải **xuất hiện ngay** — không cần F5.
- **Quyền vừa bị thu hồi khi user đang xem viewer ảnh:** nút Tải trong viewer **biến mất ngay**; nếu user vừa click Tải và download đã bắt đầu → download hiện tại không bị hủy (backend đã trả file).
- **Tin có nhiều file:** một tin có thể chứa nhiều file (số lượng tối đa configure ở Admin Site — xem FSD-Admin-Site.md). Quyền tải enforce **độc lập cho từng file** theo loại tương ứng.
- **Staff không có quyền tải nhưng có quyền **xem** ảnh (qua viewer + watermark):** vẫn cho mở viewer, chỉ disable nút Tải. Watermark áp dụng bình thường.
- **Tin bị thu hồi:** Staff thấy placeholder → không có file để tải. Admin vẫn thấy nội dung gốc + có thể tải file.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Bubble file với nút Tải xuống (có quyền) vs không có nút Tải xuống (không có quyền).
> - Image viewer có nút Tải bị disabled.
> - Confirm dialog "File này nặng X MB, tiếp tục tải?" cho video > 300MB.

---

### 4.4 #26 — Tên hiển thị nhóm chat (Portal hiển thị)

| | |
|---|---|
| **Actors** | Staff · Admin (đọc/xem) — Admin đặt override tại Admin Site |
| **Sync lên Zalo** | ❌ (override chỉ áp dụng nội bộ, tên Zalo gốc giữ nguyên) |

#### Mục tiêu

Tên gốc của nhóm Zalo thường lộn xộn hoặc không nhất quán (do vendor đặt). Admin đặt **tên hiển thị nội bộ** cho nhóm tại Admin Site → Portal hiển thị tên override mọi nơi, fallback về tên gốc Zalo nếu chưa có override.

#### Business Flow (góc nhìn Portal)

1. Admin đặt tên override cho nhóm — có thể qua Admin Site hoặc trực tiếp tại header / tab thông tin trong Chat Portal (xem FR-26.5).
2. Portal nhận update real-time → mọi vị trí hiển thị tên nhóm trên Portal đổi sang tên override:
   - **Sidebar NCC tab:** item nhóm.
   - **Header cửa sổ chat:** tên ở đầu khung chat.
   - **Quote/reply preview** khi tham chiếu tin của nhóm.
   - **Tin forward (#11):** "nguồn nhóm" trong thanh metadata DM Admin.
   - **"Tin đã đánh dấu" list (#25):** cột nhóm.
   - **Mention picker** (#10) khi cần show context nhóm (hiếm).
3. Khi Admin xóa override → Portal fallback về tên gốc Zalo mọi nơi.

#### Yêu cầu chức năng

- **FR-26.1:** Mọi vị trí trên Portal hiển thị tên nhóm → **ưu tiên tên override**; fallback tên gốc Zalo khi override **null hoặc chỉ chứa khoảng trắng**.
- **FR-26.2:** Tên gốc trên Zalo **không thay đổi** — đây là override nội bộ, vendor và các thành viên Zalo khác trong nhóm vẫn thấy tên cũ trên Zalo.
- **FR-26.3:** Khi Admin đổi tên / xóa override tại Admin Site → Portal cập nhật **real-time** mọi vị trí hiển thị (không cần F5).
- **FR-26.4:** **Header cửa sổ chat** hiển thị tên override. Tên gốc Zalo **không lộ** cho Staff hay Admin tại bất kỳ vị trí nào trên Portal — tên hiển thị nội bộ là tên duy nhất Staff nhìn thấy.
- **FR-26.5:** **Chỉ Admin** được phép thay đổi tên hiển thị nội bộ của nhóm. Admin có thể đặt / sửa tên qua 3 vị trí:
  - Trang quản lý nhóm trên **Admin Site** (xem FSD-Admin-Site.md).
  - **Header cửa sổ chat** — click trực tiếp vào tên để edit (chỉ Admin thấy tính năng edit này).
  - **Tab thông tin** trong panel bên phải (right panel) của cửa sổ chat.

#### Trạng thái UI & Edge Cases

- **Override rỗng / chỉ khoảng trắng:** coi như chưa override → fallback tên gốc.
- **Tin đã forward sang DM Admin trước khi nhóm được rename:** thanh tóm tắt trong DM hiển thị **tên hiện tại** của nhóm (không snapshot tên cũ).
- **Sidebar đang sort theo tên:** sort lại theo tên hiển thị (override hoặc gốc).
- **Search nhóm trên sidebar:** chỉ match theo **tên hiển thị** (override) — **không** hỗ trợ search theo tên gốc Zalo.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Sidebar item hiển thị tên override.
> - Header chat hiển thị tên override + nút edit nhỏ (chỉ Admin thấy).
> - So sánh trước/sau khi rename.

---

### 4.5 #28 — Ẩn số điện thoại + gửi yêu cầu xem *(phần Chat Portal)*

| | |
|---|---|
| **Actors** | Staff (bị mask + gửi yêu cầu) · Admin (luôn thấy số thật) |
| **Sync lên Zalo** | ❌ (chỉ là chức năng hiển thị + workflow nội bộ Portal) |

#### Mục tiêu

Bảo vệ số điện thoại nhạy cảm khỏi truy cập tự do của Staff trong các nhóm có cấu hình **ẩn SĐT = ON**. Staff cần xin Admin duyệt để xem; Admin có thể thu hồi quyền sau.

#### Business Flow (góc nhìn Staff)

1. Staff mở vendor group có cấu hình **Ẩn SĐT = ON** (cấu hình tại Admin Site).
2. Trong message list: mọi số điện thoại trong tin **text** được render dưới dạng **`XX****`** (giữ **2 chữ số đầu**, phần còn lại là 4 dấu sao).
3. Cạnh mỗi số bị mask có **icon 👁** nhỏ → click để gửi yêu cầu xem số đó.
4. Click 👁 → popup **"Yêu cầu xem số điện thoại"** mở:
   - Hiển thị: snippet tin chứa số + số đã mask.
   - Nút **Hủy** / **Gửi yêu cầu**.
5. Nhấn **Gửi yêu cầu**:
   - Backend tạo bản ghi yêu cầu xem (trạng thái `pending`).
   - Hệ thống chèn **system message** `PHONE_REVEAL_REQUEST` vào timeline nhóm — full-width, nội dung: **"[Tên staff] đã yêu cầu xem một số điện thoại trong tin từ [tên vendor]"** *(không lộ số trong nội dung system message)*.
   - Icon 👁 cạnh số đó chuyển **spinner** "Đang chờ duyệt".
6. Admin duyệt trên Admin Site (không thuộc tài liệu này) → Portal nhận kết quả:
   - **Duyệt:** số chuyển sang hiển thị **số thật** + **highlight cam** (background light orange) trong mọi tin chứa số đó. System message `PHONE_REVEAL_APPROVED` xuất hiện.
   - **Từ chối:** số vẫn mask. System message `PHONE_REVEAL_DENIED`. Icon 👁 quay về trạng thái có thể click — staff có thể **gửi lại yêu cầu**.
   - **Admin thu hồi sau khi đã duyệt:** số bị mask lại trong nhóm. System message `PHONE_REVEAL_REVOKED`.

#### Business Flow (góc nhìn Admin)

- Admin **luôn thấy số thật** trong mọi tin của nhóm (kể cả nhóm có ẩn SĐT).
- Cạnh mỗi số trong tin của nhóm có cấu hình ẩn → hiển thị **badge nhỏ "Đang ẩn với nhóm"** để Admin biết Staff đang không thấy số đó.
- Admin có thể bật/tắt cấu hình **Ẩn SĐT** cho nhóm trực tiếp từ **Tab thông tin** (right panel) trong cửa sổ chat — không cần vào Admin Site. (Cấu hình cũng có trong Admin Site — xem FSD-Admin-Site.md.)

#### Yêu cầu chức năng

- **FR-28.1:** Khi nhóm có cấu hình **Ẩn SĐT = ON**:
  - **Staff** thấy số trong tin text dưới dạng `XX****` (2 chữ số đầu + 4 dấu `*`).
  - **Admin** thấy số thật + badge "Đang ẩn với nhóm" cạnh số.
- **FR-28.2:** Hệ thống detect số điện thoại trong text bằng **pattern Việt Nam**: di động (`09xx`, `08xx`, `07xx`, `05xx`, `03xx`), số cố định (`02xx…`), hotline. **Không** mask được số nằm trong **ảnh / file** (chỉ áp dụng cho text content).
- **FR-28.3:** Icon 👁 hiện cạnh **mỗi số bị mask** trong tin → click mở popup yêu cầu xem.
- **FR-28.4:** Sau khi gửi yêu cầu: icon 👁 chuyển **spinner "Đang chờ duyệt"** cho đến khi Admin xử lý (Duyệt / Từ chối). Không có timeout — chờ Admin.
- **FR-28.5:** **Scope của Duyệt là per-message**: Admin duyệt 1 yêu cầu xem số trong **tin cụ thể** → chỉ **tin đó** hiển thị số thật cho **toàn bộ Staff** trong nhóm. Các tin khác chứa cùng số điện thoại đó vẫn mask như bình thường.
- **FR-28.6:** **Scope của Thu hồi cũng per-message**: Admin thu hồi quyền xem số trong **tin đã duyệt** → số đó mask lại trong tin đó cho toàn bộ Staff. System message `PHONE_REVEAL_REVOKED` xuất hiện.
- **FR-28.7:** Số đã được duyệt hiển thị với **highlight cam** (background light orange) trong message list — giúp Staff dễ nhận biết đây là số đã được phép xem.
- **FR-28.8:** System messages `PHONE_REVEAL_*` xuất hiện trong message list dạng **full-width** với style đặc biệt (bar nhỏ màu xám/cam, icon khóa). Theo [3.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm) — system messages **không có hover menu, không có action**, không sync Zalo (vendor không thấy).
- **FR-28.9:** Nội dung body system message nêu rõ:
  - **`PHONE_REVEAL_REQUEST`:** "[Staff tên] đã yêu cầu xem một số điện thoại trong tin từ [vendor]". **Không lộ số**.
  - **`PHONE_REVEAL_APPROVED`:** "Admin [tên] đã duyệt yêu cầu của [staff tên] lúc [HH:mm]".
  - **`PHONE_REVEAL_DENIED`:** "Admin [tên] đã từ chối yêu cầu của [staff tên]".
  - **`PHONE_REVEAL_REVOKED`:** "Admin [tên] đã thu hồi quyền xem số điện thoại lúc [HH:mm]".
- **FR-28.10:** **Quote/reply** của tin chứa số: snippet trong quote cũng được mask theo trạng thái hiện tại của nhóm (giống message list).
- **FR-28.11:** Khi cấu hình nhóm chuyển từ **ẩn = ON** sang **OFF**: tất cả số hiển thị thật ngay cho mọi vai trò; icon 👁 spinner trên các yêu cầu đang pending tự ẩn.

> **⚠️ Q&A cần xác nhận với client:** Các yêu cầu `pending` khi tính năng ẩn SĐT bị tắt — có chuyển sang trạng thái `cancelled` trong DB không, hay chỉ ẩn UI mà giữ nguyên `pending`?

#### Trạng thái UI & Edge Cases

- **Số trong tin đã thu hồi:**
  - Staff thấy placeholder "Tin nhắn đã thu hồi" → không thấy nội dung, không có icon 👁.
  - Admin vẫn thấy nội dung gốc + số thật (Admin luôn thấy số) + strikethrough do thu hồi.
- **Staff đã được duyệt số `X` trong nhóm `G`, sau đó bị remove khỏi nhóm:** mất quyền truy cập nhóm → không xem được tin nào trong nhóm (cả số đã duyệt cũng không truy cập được nữa).
- **Staff mới được thêm vào nhóm:** trong các tin đã có yêu cầu được duyệt, số thật vẫn hiển thị cho staff mới — approval áp dụng per-message cho toàn bộ staff trong nhóm.
- **Yêu cầu bị từ chối → Staff gửi lại:** mỗi lần là 1 bản ghi yêu cầu mới + 1 system message `PHONE_REVEAL_REQUEST` riêng.
- **Số xuất hiện trong tin sticker / location / system message khác:** không mask (system messages không chứa số dạng text user-facing).
- **Hai số khác nhau trong cùng tin:** mỗi số mask độc lập, mỗi số có icon 👁 riêng, mỗi số là 1 yêu cầu riêng.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Tin chứa số bị mask `XX****` với icon 👁 cạnh số (góc nhìn Staff).
> - Tin chứa số thật + badge "Đang ẩn với nhóm" (góc nhìn Admin).
> - Popup "Yêu cầu xem số điện thoại".
> - Icon 👁 spinner "Đang chờ duyệt".
> - Số đã duyệt với highlight cam.
> - System messages `PHONE_REVEAL_REQUEST` / `APPROVED` / `DENIED` / `REVOKED` trong timeline.
> - Tab thông tin (right panel) — toggle Ẩn SĐT ON/OFF (chỉ Admin thấy).

---

### 4.6 #31 — Lọc hội thoại NCC theo thẻ phân loại

| | |
|---|---|
| **Actors** | Staff · Admin (filter cho riêng mình) |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Khi danh sách NCC lớn (nhiều nhóm), filter theo **thẻ phân loại** (ví dụ "Nhà sản xuất", "Nhà phân phối", "Dịch vụ"…) để chỉ thấy nhóm thuộc phân khúc đang quan tâm.

#### Business Flow

1. Trên sidebar NCC tab, có nút **"Phân loại"** (icon filter ▼) ở header sidebar.
2. Click **"Phân loại"** → popup **"Lọc theo thẻ"** mở:
   - Liệt kê tất cả thẻ phân loại đang có (do Admin tạo ở Admin Site) — mỗi thẻ hiển thị **tên + chấm màu**.
   - Có **link nhanh "Quản lý thẻ phân loại"** ở cuối popup → mở modal quản lý thẻ (chỉ Admin thấy link này).
3. User chọn / bỏ chọn các thẻ (checkbox toggle) — sidebar **cập nhật real-time** sau mỗi lần chọn, hiện nhóm có gắn **ít nhất 1** trong các thẻ đang active (OR logic).
4. Đóng popup (click ra ngoài hoặc click lại "Phân loại") → filter giữ nguyên. **Header sidebar** hiển thị chip tóm tắt: **"Đang lọc: [tên thẻ] ✕"** (1 thẻ) hoặc **"Đang lọc: N thẻ ✕"** (nhiều thẻ) — click ✕ để xóa toàn bộ filter, sidebar trở về danh sách đầy đủ.
5. Filter có thể combine với section **"Đã ghim"** (#12): nhóm ghim **cũng bị filter** theo thẻ — nếu nhóm ghim không có thẻ đang filter → bị ẩn.

#### Yêu cầu chức năng

- **FR-31.1:** Filter là **multi-select** — user có thể chọn nhiều thẻ cùng lúc. Logic filter: hiển thị nhóm có gắn **ít nhất 1 trong các thẻ đang chọn** (OR logic). Chọn lại thẻ đang active → bỏ chọn thẻ đó.
- **FR-31.2:** Link **"Quản lý thẻ phân loại"** trong popup:
  - **Chỉ Admin** thấy link này.
  - Click → mở modal quản lý thẻ (Admin Site — không thuộc tài liệu này).
  - Staff không thấy link (không có quyền vào quản lý thẻ).
- **FR-31.3:** Filter áp dụng đồng thời với:
  - **Search query** (nếu sidebar có ô search): hiển thị nhóm match cả 2 điều kiện (AND).
  - **Section "Đã ghim"** (#12): nhóm ghim cũng bị filter theo thẻ.
- **FR-31.4:** Nhóm **không gắn thẻ nào** → bị ẩn khi filter active (vì không match thẻ đang chọn).
- **FR-31.5:** Khi Admin **xóa một thẻ** đang được filter: filter tự động **clear**, sidebar trở về danh sách đầy đủ. Chip "Đang lọc" biến mất.
- **FR-31.6:** Khi Admin **đổi tên / màu thẻ** đang được filter: chip "Đang lọc" cập nhật tên/màu mới real-time.
- **FR-31.7:** Filter state lưu **per-user, per-session**:
  - F5 / đóng tab và mở lại: filter **giữ nguyên**.
  - Đóng browser hoàn toàn → mở lại: filter **reset** (không persist phía backend).
- **FR-31.8:** Thứ tự thẻ trong popup theo thứ tự Admin đã sắp xếp ở Admin Site (drag-and-drop thứ tự).

#### Trạng thái UI & Edge Cases

- **Sau filter, không nhóm nào match:** sidebar hiển thị empty state **"Không có hội thoại nào với các thẻ này"** + nút **"Xóa bộ lọc"**.
- **Nhóm đang được mở mà sau filter không match:** cửa sổ chat **vẫn giữ nhóm hiện tại** (không tự động chuyển); sidebar update nhưng user không bị "đẩy" ra khỏi nhóm đang đọc.
- **Chưa có thẻ nào trong hệ thống:** popup "Lọc theo thẻ" hiển thị empty state "Chưa có thẻ phân loại" + link "Quản lý thẻ phân loại" (chỉ Admin thấy).
- **Filter active + search query không match:** empty state "Không có hội thoại nào khớp" + tùy chọn xóa filter / xóa search.
- **Vừa cấp/thu hồi quyền group (#16) khi filter đang active:** nhóm mới (nếu match thẻ) xuất hiện trong sidebar; nhóm bị remove biến mất — không cần F5.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Sidebar NCC với nút "Phân loại" ở header.
> - Popup "Lọc theo thẻ" liệt kê thẻ với checkbox multi-select + link Quản lý (chỉ Admin).
> - Sidebar sau khi filter — chip "Đang lọc: [tên thẻ] ✕" (1 thẻ) hoặc "Đang lọc: N thẻ ✕" (nhiều thẻ).
> - Empty state khi không có nhóm nào match filter.

---

## 5. Nhóm D — Phân quyền & Multi-account *(phần Chat Portal)*

> **Phạm vi nhóm này trên Chat Portal:**
> - Hiệu ứng phân quyền của #15, #16, #17 lên hiển thị Portal (sidebar, input chat, badge vai trò).
> - **Banner đại diện tài khoản Zalo** (ZaloIdentityBar) ở đầu khung chat của mọi vendor group — luôn hiển thị account đang đại diện cho user trong nhóm hiện tại.
> - Hiển thị account đã resolve cho mỗi tin user gửi, khi nhóm có nhiều tài khoản Zalo cùng sync (multi-account).
> - **Quản lý thành viên** (Admin-only) — modal trong right panel của vendor group: thêm/xóa Staff, bật/tắt quyền tải xuống cho từng Staff trong nhóm đang mở.
>
> **Không thuộc tài liệu này** — xem `FSD-Admin-Site.md`:
> - Cấu hình **gán Staff vào tài khoản Zalo** — #15 (Admin Site → Liên kết tài khoản).
> - Cấu hình **gán Staff vào nhóm vendor** đầy đủ, bulk, nâng cao — #16 (Admin Site → Quản lý nhóm NCC). *(Chat Portal hỗ trợ add/remove từng người cho nhóm đang mở — xem [5.4](#54-admin-only--quản-lý-thành-viên-trong-nhóm).)*
> - Cấu hình **per-staff per-group override** ("trong nhóm X, staff Y luôn đại diện account Z") — Admin Site → Quản lý nhóm NCC.
> - Cấu hình **thêm/xóa tài khoản Zalo khỏi nhóm** — Admin Site → Quản lý nhóm NCC.
> - Cấu hình quyền tải: **chỉ cấu hình được trên Chat Portal** (toggle nhanh per-staff per-group — xem [5.4](#54-admin-only--quản-lý-thành-viên-trong-nhóm)). Không có màn hình Admin Site riêng cho việc này.

### 5.1 Hiệu ứng phân quyền trên hiển thị Portal *(cross-cutting #15, #16, #17)*

| | |
|---|---|
| **Actors** | Staff · Admin |
| **Scope** | Áp dụng toàn Chat Portal — sidebar, cửa sổ chat, mọi nơi hiển thị danh tính |

#### Mục tiêu

Định nghĩa cách 3 rule phân quyền (#15 staff-account, #16 staff-group, #17 ba vai trò) thể hiện trên Chat Portal — để các section khác của tài liệu có thể tham chiếu đến (thay vì lặp lại).

#### Mô tả

| Rule | Hiệu ứng trên Chat Portal |
|---|---|
| **#15** Gán Staff vào tài khoản Zalo | Xác định Staff được phép "đại diện" tài khoản Zalo nào khi gửi tin. Ảnh hưởng: input chat (enable/disable), banner đại diện ([5.2](#52-extra-d4d--banner-đại-diện-tài-khoản-zalo-zaloidentitybar)), danh tính tin gửi trên Zalo. |
| **#16** Gán Staff vào nhóm vendor | Xác định Staff thấy nhóm nào trong sidebar NCC. Ảnh hưởng: sidebar hiển thị; tin/forward/bookmark trỏ vào nhóm Staff không có quyền → fallback empty state. |
| **#17** 3 vai trò (Admin · Staff · Vendor) | Xác định behavior, badge, quyền action trên Portal. Vendor không truy cập Portal — chỉ tương tác qua Zalo. |

#### Yêu cầu chức năng

- **FR-D.1:** **Sidebar NCC tab** chỉ liệt kê các nhóm Staff được phép truy cập (#16). **Admin** thấy mọi nhóm vendor đã đồng bộ.
- **FR-D.2:** Trong cửa sổ chat của một nhóm, **banner đại diện tài khoản Zalo** (xem [5.2](#52-extra-d4d--banner-đại-diện-tài-khoản-zalo-zaloidentitybar)) **luôn hiển thị** — cho biết account nào đang đại diện cho user trong nhóm này.
- **FR-D.3:** **Vai trò** user hiển thị qua **badge nhỏ** cạnh tên ở các nơi cần phân biệt:
  - Mini-profile popover khi click tên trong bubble (3.1 FR-B.3).
  - Log "Nhật Ký công việc" của task (xem [Nhóm E](#6-nhóm-e--công-việc-nội-bộ-phần-chat-portal)).
  - DM Admin trong tin Forward (#11).
- **FR-D.4:** **Admin role**: trên Portal, Admin có **quyền tối đa** ở mọi nhóm, mọi tin, mọi action:
  - Truy cập mọi vendor group (không cần gán #16).
  - Thấy nội dung tin đã thu hồi (#9).
  - Thấy số điện thoại thật trong nhóm có ẩn SĐT (#28).
  - Tải mọi loại file ở mọi nhóm (#14).
  - Forward, Bookmark, Pin, React, Reply, mention — không bị restrict.
- **FR-D.5:** **Cập nhật real-time** khi Admin thay đổi phân quyền — dù thay đổi từ Admin Site hay từ **"Quản lý thành viên"** trong Chat Portal ([5.4](#54-admin-only--quản-lý-thành-viên-trong-nhóm)):
  - Staff vừa **bị mất** quyền 1 nhóm (#16): nhóm biến mất khỏi sidebar; nếu user đang **mở** nhóm đó → cửa sổ chat hiển thị **empty state** "Bạn không còn quyền truy cập nhóm này. Vui lòng liên hệ Admin."
  - Staff vừa **được cấp** quyền 1 nhóm: nhóm xuất hiện trong sidebar (vị trí theo sort hiện hành).
  - Staff vừa được gán / thu hồi 1 account đại diện trong nhóm đang mở: banner đại diện ([5.2](#52-extra-d4d--banner-đại-diện-tài-khoản-zalo-zaloidentitybar)) update real-time; input chat enable/disable tương ứng.
  - **Quyền tải xuống** của Staff trong nhóm bị toggle → nút Tải trên các bubble file xuất hiện / biến mất real-time (xem [4.3 FR-14.4](#43-14--enforce-quyền-tải-tập-tin)).

#### Trạng thái UI & Edge Cases

- **Staff đang gõ tin trong nhóm bị mất quyền:** cửa sổ chat chuyển empty state ngay; **draft text bị mất** (không lưu khi đã mất quyền — tránh leak).
- **Tin Forward (#11) trong DM trỏ vào nhóm Staff đã mất quyền:** click jump-to → hiển thị empty state "Bạn không còn quyền truy cập nhóm này". Tin trong DM vẫn còn (DM tồn tại độc lập).
- **Bookmark (#25) trỏ vào nhóm Staff đã mất quyền:** entry trong "Tin đã đánh dấu" hiển thị mờ + label "Không còn quyền truy cập" + cho bỏ đánh dấu (tham chiếu [3.9 FR-25.5](#39-25--đánh-dấu-tin-nhắn-bookmark) — đã định nghĩa).
- **Admin chuyển sang Staff role (kịch bản hiếm — degrade quyền):** mất quyền Admin, áp dụng phân quyền theo #16/#15 cho Staff role mới — tương đương Staff chưa được gán nhóm nào (sidebar rỗng) cho đến khi Admin gán.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Sidebar góc nhìn Staff (chỉ thấy nhóm được gán) vs Admin (thấy tất cả).
> - Cửa sổ chat empty state "Bạn không còn quyền truy cập nhóm này".
> - Badge vai trò (Admin) ở mini-profile / DM tin forward / log task.

---

### 5.2 [EXTRA D.4(d)] — Banner đại diện tài khoản Zalo (ZaloIdentityBar)

| | |
|---|---|
| **Actors** | Staff (chính) · Admin (cũng thấy khi đại diện account trong vendor group) |
| **Scope** | Đầu khung chat của mọi vendor group |
| **Sync lên Zalo** | ❌ (chỉ là banner hiển thị Portal) |

#### Mục tiêu

Khi user gửi tin trong vendor group, tin xuất hiện trên Zalo dưới **danh tính tài khoản Zalo** mà user đang đại diện. Khi nhóm có nhiều account cùng sync ([5.3](#53-extra-d4ab--resolve-tài-khoản-đại-diện-khi-gửi-tin-multi-account)), user **cần biết chính xác** đang đại diện account nào — tránh gửi nhầm danh tính. Banner luôn hiển thị để user không bao giờ nhầm.

#### Mô tả

Đầu khung chat (phía **dưới header nhóm**, **trên message list**) luôn hiển thị **banner nhỏ một dòng**:

```
🟢 Đang đại diện tài khoản: [Tên tài khoản Zalo]
```

**Style banner theo trạng thái kết nối của account đang active** (đồng bộ với rule 2.1):

| Trạng thái account đại diện | Style banner | Behavior input |
|---|---|---|
| `connected` | Nền **xanh nhạt** 🟢 + tên account | Cho phép gửi tin bình thường |
| `unstable` | Nền **vàng nhạt** 🟡 + tên account + tooltip "Kết nối Zalo không ổn định" | Vẫn cho phép gửi (có thể delay) |
| `disconnected` | Nền **đỏ nhạt** 🔴 + tên account + nút **"Thử lại kết nối"** | Input disabled (xem 2.1) |
| `expired` | Nền **đỏ nhạt** 🔴 + tên account + hướng dẫn liên hệ Admin | Input disabled |

> **Quan hệ với banner kết nối ([2.1](#21-trạng-thái-kết-nối--banner-hiển-thị)):** ZaloIdentityBar **thay thế** banner kết nối khi account có sự cố — không hiển thị **2 banner cùng lúc**. Banner này tích hợp cả "account đang đại diện" lẫn "trạng thái kết nối của account đó".

#### Business Flow

1. User mở vendor group → hệ thống resolve account đại diện theo logic ([5.3](#53-extra-d4ab--resolve-tài-khoản-đại-diện-khi-gửi-tin-multi-account)):
   - Per-group override nếu Admin đã đặt.
   - Account đầu tiên user được gán (#15) trong danh sách account của nhóm.
   - Fallback: account đầu tiên của nhóm (trạng thái read-only).
2. Banner hiển thị tên account vừa resolve + style theo trạng thái kết nối của account đó.
3. User gửi tin trong group → tin xuất hiện trên Zalo dưới danh tính account đó (vendor thấy tên account, không thấy tên user).
4. User chuyển sang vendor group khác → banner update tương ứng (account có thể khác).

#### Yêu cầu chức năng

- **FR-D.6:** Banner đại diện **luôn hiển thị** ở đầu khung chat của vendor group — **không có UI để tắt** banner.
- **FR-D.7:** Khi nhóm có **nhiều account** và user được gán cho ≥2 account: banner hiển thị **account đang được resolve** (theo logic [5.3](#53-extra-d4ab--resolve-tài-khoản-đại-diện-khi-gửi-tin-multi-account)). **User không có UI để chủ động chọn account khác** trong khung chat — việc chỉ định account là quyền Admin (qua override Admin Site).
- **FR-D.8:** Khi Admin thay đổi override / assignment → banner cập nhật **real-time** (không cần F5):
  - Account đại diện đổi → banner đổi tên + style theo trạng thái kết nối mới.
  - Input chat enable/disable tương ứng.
- **FR-D.9:** **Account đại diện gặp sự cố kết nối:**
  - Banner đổi style (vàng / đỏ) theo trạng thái.
  - **Chỉ disable input cho account này** — không ảnh hưởng các account khác trong nhóm.
  - Nút **"Thử lại kết nối"** ([2.2 #27](#22-27--thử-lại-kết-nối-thủ-công)) thử lại **đúng account đại diện** cho group hiện tại.
- **FR-D.10:** **Read-only case** — staff không được gán bất kỳ account nào trong nhóm:
  - Banner hiển thị account đầu tiên của nhóm + label phụ **"(chỉ đọc — bạn không được phép gửi tin)"**.
  - Input chat **disabled** + tooltip **"Bạn không được phép gửi tin trong nhóm này. Liên hệ Admin."**
  - Staff vẫn **xem** được tin nhắn, **react**, **bookmark**, **forward đến Admin** (#11) — chỉ không **gửi tin mới**, **reply**, **mention** (vì tin gửi đi cần account đại diện).

#### Trạng thái UI & Edge Cases

- **Nhóm có 1 account:** banner đơn giản, không có gì đặc biệt (không hiển thị dropdown chọn — không có gì để chọn).
- **Admin role:** Admin cũng đại diện qua account khi gửi tin vào vendor group — banner cũng hiển thị bình thường giống Staff. Admin **không có** quyền tự chọn account trong khung chat — vẫn theo logic resolve.
- **User đang gõ tin nhưng Admin thay đổi override:** banner đổi account ngay; **draft text giữ nguyên**; nhấn gửi → tin gửi dưới danh tính account **mới**.
- **Account đại diện hiện tại bị Admin remove khỏi nhóm** ([5.3 FR-D.14](#53-extra-d4ab--resolve-tài-khoản-đại-diện-khi-gửi-tin-multi-account)): resolver dùng account tiếp theo → banner update tên + có thể đổi style.
- **Banner đại diện vs banner kết nối toàn portal (mất kết nối Portal Server, không liên quan Zalo):** banner mất kết nối Portal Server hiển thị ở **cấp toàn Portal** (top bar) — không can thiệp vào ZaloIdentityBar.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Banner đại diện trạng thái `connected` (xanh nhạt).
> - Banner trạng thái `unstable` (vàng).
> - Banner trạng thái `disconnected` (đỏ + nút Thử lại).
> - Banner trạng thái `expired` (đỏ + hướng dẫn liên hệ Admin).
> - Banner read-only case (label "chỉ đọc" + input disabled).
> - So sánh nhóm 1 account vs nhóm nhiều account (cùng style banner, chỉ khác tên).

---

### 5.3 [EXTRA D.4(a)(b)] — Resolve tài khoản đại diện khi gửi tin (multi-account)

| | |
|---|---|
| **Actors** | Staff · Admin (đều áp dụng logic resolve khi gửi tin) |
| **Scope** | Logic resolve account đại diện khi user gửi tin trong nhóm có ≥1 account |
| **Sync lên Zalo** | ✅ với tin được gửi (tin đi qua account đã resolve) |

#### Mục tiêu

Khi nhóm vendor có **nhiều tài khoản Zalo cùng sync** (D.4 multi-account), mỗi tin user gửi chỉ đi qua **một** account đại diện duy nhất — hệ thống phải resolve **đúng account** cho mỗi tin, dựa trên cấu hình Admin và quyền của user.

#### Logic Resolve (ưu tiên từ trên xuống)

> Khi user gửi tin trong vendor group, backend resolve account đại diện theo thứ tự:

1. **Per-group override** (D.4(b)): nếu Admin đã đặt **"trong nhóm X, user Y luôn đại diện account Z"** tại Admin Site → dùng account `Z`.
2. **Gán account toàn cục** (#15): nếu chưa có override → dùng **account đầu tiên** trong danh sách account của nhóm mà user `Y` được gán.
3. **Fallback** (read-only): nếu user `Y` không được gán bất kỳ account nào trong nhóm → dùng account đầu tiên của nhóm **để hiển thị banner**, nhưng input chat **disabled** ([5.2 FR-D.10](#52-extra-d4d--banner-đại-diện-tài-khoản-zalo-zaloidentitybar)) — user **không thực sự gửi được tin** vì không được phép.

Sau khi resolve:
- Banner ZaloIdentityBar ([5.2](#52-extra-d4d--banner-đại-diện-tài-khoản-zalo-zaloidentitybar)) hiển thị account đã resolve.
- Khi user gửi tin → backend gắn account đó vào tin, sync Zalo dưới danh tính account đó.

#### Yêu cầu chức năng

- **FR-D.11:** Logic resolve account **chạy ở backend**. Portal chỉ **nhận kết quả** và thể hiện:
  - Banner ZaloIdentityBar hiển thị account đã resolve.
  - Input chat enable/disable: enabled nếu cấp 1 hoặc 2; disabled nếu cấp 3 (fallback read-only).
- **FR-D.12:** Trên Chat Portal, user **không có UI tự chọn account** đại diện trong khung chat. Việc thay đổi override là **quyền Admin** (Admin Site). Đây là **chính sách thiết kế** — đảm bảo nhất quán danh tính khi gửi tin.
- **FR-D.13:** **Cập nhật real-time** khi Admin thay đổi:
  - Admin thêm/xóa **override** (D.4(b)) cho user trong nhóm đang mở: banner + behavior input update ngay không cần F5.
  - Admin gán/thu hồi **gán account** (#15) cho user: nếu resolver chọn cấp khác → banner update.
- **FR-D.14:** Admin **remove account khỏi nhóm** (D.4(c)):
  - Mọi override cũ trỏ vào account bị remove → resolver tự fallback xuống cấp 2 hoặc 3.
  - Banner ZaloIdentityBar của user đang mở nhóm đó update real-time.
  - **Constraint phía Admin:** không cho remove **account cuối cùng** của nhóm (nhóm phải có ≥1 account) — chi tiết tại Admin Site doc.
- **FR-D.15:** User được gán **nhiều account cùng trong 1 nhóm** (cả 2-3 account đều thuộc nhóm): không có override → resolver dùng **cấp 2** = account đầu tiên trong danh sách account của nhóm mà user được gán. **Admin có thể set override** để chỉ định account khác nếu muốn.

#### Trạng thái UI & Edge Cases

- **Account đại diện đang `disconnected`:** logic resolve **không đổi** (vẫn dùng account này) — chỉ banner kết nối ([5.2 FR-D.9](#52-extra-d4d--banner-đại-diện-tài-khoản-zalo-zaloidentitybar)) disable input. User nhấn "Thử lại kết nối" ([2.2 #27](#22-27--thử-lại-kết-nối-thủ-công)) thử lại đúng account này.
- **Admin role gửi tin trong nhóm không được gán account:** áp dụng cùng logic resolve. Admin **không** có "quyền siêu" để bypass account — vẫn cần được gán account (hoặc Admin tự gán cho mình tại Admin Site). Trên thực tế Admin thường tự gán đầy đủ → không gặp case này.
- **User vừa gửi tin xong → Admin đổi override:** tin đã gửi giữ account cũ (snapshot tại thời điểm gửi); tin tiếp theo sẽ dùng account mới.
- **User được gán nhiều account, account ưu tiên đang `expired`:** Banner hiển thị account đó + state `expired` → input disabled. **Resolver không tự fallback** sang account khác — vì đây là **chính sách**: user vẫn được "kỳ vọng" gửi tin dưới danh tính account đã chỉ định. Admin cần set override để Staff dùng account khác tạm thời.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Diagram 3 cấp resolve (override → assignment → fallback).
> - So sánh banner ZaloIdentityBar trong 3 case: có override · theo gán global · fallback read-only.
> - Sequence: Admin set override → banner Portal update real-time.

---

### 5.4 [Admin-only] — Quản lý thành viên trong nhóm

| | |
|---|---|
| **Actors** | Admin (chỉ Admin thấy và thao tác) |
| **Scope** | Vendor group đang được mở trên Chat Portal |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Cho phép Admin điều chỉnh nhanh thành phần Staff và quyền tải xuống cho **nhóm vendor đang đứng** trực tiếp trong Chat Portal — mà không phải rời sang Admin Site.

#### Business Flow

1. Admin mở một vendor group → click tab **"Thông tin"** trong right panel.
2. Trong phần **"Thành viên"**, Admin thấy nút **"Quản lý"** (icon ⚙️) — chỉ Admin thấy nút này; Staff không thấy.
3. Click **"Quản lý"** → modal **"Quản lý thành viên"** mở ở trên cùng:
   - **View mặc định — danh sách thành viên**: hiển thị tất cả **Staff nội bộ** đã được thêm vào nhóm này. Vendor Zalo không hiển thị trong modal. Mỗi hàng có:
     - Tên Staff + badge vai trò.
     - Nút icon **tải xuống**: toggle bật/tắt **toàn bộ quyền tải** cho Staff đó trong nhóm này.
     - Nút **✕** xóa Staff khỏi nhóm.
   - Nút **"Thêm"** ở header modal → chuyển sang view thêm Staff.
4. **Thêm Staff**: Admin gõ tên để tìm kiếm trong danh sách Staff nội bộ → click tên → Staff được thêm vào nhóm ngay.
5. **Xóa Staff**: click ✕ trên hàng Staff → xác nhận → Staff bị remove khỏi nhóm.
6. **Toggle quyền tải**: click icon tải trên hàng Staff → trạng thái đổi ngay, hiệu lực real-time.
7. Footer modal hiển thị thống kê nhanh: tổng số Staff trong nhóm · số Staff đang có quyền tải.

#### Yêu cầu chức năng

- **FR-D.16:** **Chỉ Admin** thấy nút "Quản lý" trong section Thành viên của right panel. Staff không thấy nút này — nếu có hiển thị danh sách thành viên, Staff chỉ xem, không thao tác.
- **FR-D.17:** Modal **chỉ hiển thị Staff nội bộ** đã được thêm vào nhóm. Vendor Zalo không xuất hiện trong modal này. Mỗi hàng Staff có nút toggle quyền tải + nút xóa.
- **FR-D.18:** **Toggle quyền tải xuống:** bật/tắt **toàn bộ quyền tải** (Hình ảnh + Tài liệu + Video đồng thời) cho Staff đó trong nhóm này. **Chỉ cấu hình được tại đây — không có màn hình Admin Site nào hỗ trợ cấu hình quyền tải.**
- **FR-D.19:** **Thêm Staff vào nhóm:** Staff được thêm nhận quyền truy cập nhóm ngay — nhóm xuất hiện trong sidebar của Staff đó real-time (FR-D.5).
- **FR-D.20:** **Xóa Staff khỏi nhóm:**
  - Nhóm biến mất khỏi sidebar của Staff đó real-time.
  - Nếu Staff đang mở nhóm: cửa sổ chat chuyển empty state "Bạn không còn quyền truy cập nhóm này" (FR-D.5). Draft text bị mất.
  - Mọi override account của Staff đó trong nhóm này bị hủy — nếu sau đó được thêm lại, Admin cần đặt override mới ở Admin Site.
- **FR-D.21:** Các thay đổi trong modal (add/remove/toggle) có hiệu lực **real-time**, không cần reload. Thay đổi đồng thời trigger cập nhật real-time lên Portal của Staff liên quan (FR-D.5).

#### Trạng thái UI & Edge Cases

- **Admin xóa chính mình khỏi nhóm:** nút ✕ không hiển thị trên hàng của Admin đang đăng nhập — không tự xóa mình được.
- **View Thêm Staff — Staff đã có trong nhóm:** không xuất hiện trong kết quả tìm kiếm view Thêm.
- **Toggle quyền tải khi Staff đang xem nhóm:** nút Tải trên các bubble file xuất hiện / biến mất real-time không cần F5 (xem [4.3 FR-14.4](#43-14--enforce-quyền-tải-tập-tin)).
- **Modal mở trong khi Staff bị remove đang xem nhóm:** cửa sổ chat của Staff chuyển empty state ngay — Admin thấy phản hồi real-time trong modal (hàng Staff biến mất hoặc cập nhật).

#### Mockup tham chiếu

> [BA bổ sung] —
> - Right panel → tab Thông tin → section Thành viên với nút "Quản lý" ⚙️ (chỉ Admin thấy).
> - Modal "Quản lý thành viên" — view danh sách chỉ Staff nội bộ, mỗi hàng có 2 nút: toggle quyền tải + xóa.
> - Modal view "Thêm nhân viên" (search Staff + click-to-add).
> - Footer stats: tổng Staff trong nhóm / số có quyền tải.
> - So sánh: toggle quyền tải ON vs OFF trên hàng Staff.

---

## 6. Nhóm E — Công việc nội bộ *(phần Chat Portal)*

> **Phạm vi nhóm này trên Chat Portal:**
> - **Tạo task** (#18) trong vendor group — từ hover menu của một tin nhắn trong nhóm.
> - **Nhật Ký công việc** (#19) — kênh trao đổi riêng gắn với từng task (tách bạch khỏi vendor group chat), giúp các thành viên nội bộ cập nhật tiến độ và trao đổi thông tin liên quan đến công việc được giao.
> - **Banner task pending** trên header chat (Bell + count) — đếm task chưa xử lý + đang xử lý của user hiện tại trong nhóm.
> - **Task panel** trong right panel của vendor group — danh sách task của bản thân + của team trong nhóm hiện tại, gom theo trạng thái.
>
> **Đặc trưng quan trọng:** toàn bộ task data và log đều là **INTERNAL** — Vendor không thấy, **không sync Zalo**. Trong vendor group chat, mỗi task tạo mới sinh ra một **system message** `internalType = TASK` (full-width, không có hover menu, không có action) ghi nhận sự kiện. Nội dung comment trong Nhật Ký công việc **không** xuất hiện trong vendor group chat — chỉ trong side drawer riêng.
>
> **Không thuộc tài liệu này** — xem `FSD-Admin-Site.md`:
> - Cấu hình **mẫu checklist mặc định** ở cấp hệ thống (nếu có cấu hình Admin Site).
> - **Báo cáo tổng hợp task** xuyên nhóm cho Admin (nếu có).
> - Cấu hình thông báo email/push khi được giao task (nếu có).

### 6.1 Tổng quan task workspace & banner task pending *(cross-cutting #18, #19)*

| | |
|---|---|
| **Actors** | Staff · Admin (cùng tạo/nhận/comment task; Admin có thêm visibility xuyên nhóm — không thuộc tài liệu này) |
| **Scope** | Vendor group đang mở |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Định nghĩa các điểm truy cập (entry point) tới task workspace trong vendor group và quy tắc thông báo task pending — để các section #18 và #19 build trên cùng một cấu trúc.

#### Mô tả

Task workspace trong một vendor group được hiển thị ở **2 vị trí cố định** trong cửa sổ chat:

| Vị trí | Mục đích |
|---|---|
| **Banner task pending** — dưới header, trên message list | Đếm số task chưa xử lý và đang xử lý được giao cho user hiện tại trong nhóm; click expand → xem chi tiết theo trạng thái + nút "Xem chi tiết" mở tab Task trong right panel |
| **Right panel → tab Task** | Danh sách task gom theo trạng thái (Chưa xử lý / Đang xử lý / Hoàn thành), 2 phân nhóm: "Của tôi" và "Của team" |

> **Lưu ý nghiệp vụ:** Người được giao task tự đổi trạng thái và đánh dấu hoàn thành — không cần chờ phê duyệt từ người giao việc.

#### Yêu cầu chức năng

- **FR-E.1:** **Banner task pending** xuất hiện ở dưới header chat, trên message list của vendor group đang mở, **chỉ khi** số task `todo + doing` được giao cho user hiện tại > 0. Khi count = 0 → banner ẩn hoàn toàn.
- **FR-E.2:** Banner hiển thị: **icon chuông** + chữ "Công việc đang chờ:" + **title của task mới nhất** (truncate) + **badge tổng số** (vd: `3`) + mũi tên expand/collapse.
- **FR-E.3:** Click banner → **expand** xuống dưới hiển thị: chip "N đang làm" (màu xanh) + chip "N chưa xử lý" (màu cam) + nút **"Xem chi tiết"** (mở tab Task trong right panel).
- **FR-E.4:** Khi count tăng (task mới được giao cho user) → icon chuông **rung nhẹ ~600ms** để thu hút sự chú ý.
- **FR-E.5:** Chuyển sang group khác → banner tự collapse về trạng thái mặc định; count refresh theo group mới.
- **FR-E.6:** **Cập nhật real-time:** mọi thay đổi count (tạo task mới, status đổi todo↔doing↔finished, task được gán/hủy gán cho user) phải reflect ngay trên banner mà không cần reload.
- **FR-E.7:** **Right panel → tab Task** chia làm 2 section:
  - **"Của tôi"** — task `assignToId === currentUser.id`, gom theo trạng thái.
  - **"Của team"** — task khác trong nhóm, gom theo trạng thái + filter theo người giao việc nếu cần.
  - Mỗi section có 3 sub-list **Chưa xử lý / Đang xử lý / Hoàn thành** (collapsible), kèm count.
- **FR-E.8:** Quyền tạo task: **mọi thành viên nội bộ** (Staff hoặc Admin) thuộc nhóm đều có thể tạo task; quyền giao việc cho **bất kỳ thành viên nội bộ** khác trong nhóm. Vendor **không** xuất hiện trong dropdown người nhận.
- **FR-E.9:** Tạo task **không** sync Zalo. Trong vendor group, sự kiện tạo task được biểu diễn bằng **system message** `internalType = TASK` (full-width, không hover menu — xem [3.1 FR-B.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm)) với content ngắn gọn "X đã giao việc cho Y: [Title task]".

#### Trạng thái UI & Edge Cases

- **User vào nhóm lần đầu, chưa có task pending:** banner không hiển thị; tab Task vẫn truy cập được qua right panel với empty state "Chưa có công việc nào".
- **Nhân viên bị xóa khỏi nhóm trong khi còn task được giao:** task vẫn tồn tại trong nhóm; người đã bị xóa không còn truy cập được nhóm và không thấy task nữa. **Q&A chờ xác nhận:** khi nhân viên được giao task bị xóa khỏi nhóm, task đó có nên tự động chuyển về Admin phụ trách để đảm bảo được xử lý đến cùng không?
- **Task được giao cho user hiện tại từ user khác:** banner cập nhật count + rung chuông ngay không reload.
- **Banner expand đang mở khi user click "Xem chi tiết":** banner tự collapse + right panel mở tab Task.
- **User là người giao việc nhưng không phải người nhận:** task xuất hiện ở section "Của team", **không** đếm vào banner pending của user (banner chỉ đếm task được giao cho chính user).
- **Status đổi sang `finished`:** task biến mất khỏi banner count, chuyển xuống sub-list "Hoàn thành" của tab Task.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Banner task pending — collapsed state (1 dòng: chuông + title + count).
> - Banner task pending — expanded state (chip Đang làm / Chưa xử lý + nút "Xem chi tiết").
> - Animation chuông rung khi count tăng.
> - Right panel → tab Task: section "Của tôi" + section "Của team", mỗi section có 3 sub-list collapsible.
> - Empty state khi chưa có task.

---

### 6.2 #18 — Tạo task trong vendor group

| | |
|---|---|
| **Actors** | Staff · Admin (tạo và giao task cho thành viên nội bộ khác trong nhóm) |
| **Scope** | Vendor group đang mở |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Cho phép user nội bộ giao việc nhanh trong context của một vendor group — gắn task vào nhóm + (optional) gắn vào một tin nhắn cụ thể (sourceMessage), kèm checklist con để chia nhỏ công việc.

#### Business Flow

**Từ hover menu của một tin nhắn:**

1. User hover một tin trong vendor group → menu xuất hiện → chọn **"Tạo công việc từ tin này"**.
2. Sheet "Giao công việc" mở; trường **Tên công việc** tự điền = nội dung tin gốc (giới hạn 255 ký tự). Nếu tin gốc là hình/file/video → điền caption (nếu có) hoặc để trống.
   - Nếu nhóm đang ẩn SĐT (#28) và user là Staff → các số điện thoại trong tên công việc cũng bị ẩn theo quy tắc 4.5.
3. User chỉnh tên công việc nếu cần → điền form → nhấn "Giao việc".

**Form Sheet "Giao công việc":**

| Trường | Bắt buộc | Mô tả |
|---|:---:|---|
| **Tên công việc** | ✅ | Textarea auto-resize, max 255 ký tự, không cho xuống dòng (Enter chặn). Counter ký tự bên phải dưới |
| **Giao cho** | ✅ | Dropdown chỉ chứa thành viên nội bộ trong nhóm (Vendor bị loại bỏ). Default = chính user (badge "(Tôi)" cạnh tên). Mỗi item hiển thị tên + role nhỏ phía dưới ("Quản lý" / "Nhân viên") |
| **Mẫu checklist** | ❌ | Dropdown chọn template có sẵn (vd: "Liên hệ & Xác nhận", "Kiểm tra hàng hóa", "Không có checklist") → fill các item mặc định vào preview |
| **Mục checklist tùy chỉnh** | ❌ | Input + nút "+" → thêm item vào danh sách. Mỗi item có nút xóa (Trash icon). Có thể thêm nhiều item |

**Submit:**

4. Kiểm tra hợp lệ: tên công việc không được rỗng + phải chọn người nhận → nếu thiếu → viền đỏ + thông báo lỗi tại chỗ.
5. Tạo task với:
   - Trạng thái ban đầu: **Chưa xử lý**.
   - Danh sách việc con: items từ mẫu + các item tùy chỉnh, mỗi item chưa hoàn thành.
   - Người giao: user hiện tại; thời điểm giao: ngay lúc submit.
   - Tin nhắn nguồn: ID tin gốc từ hover menu.
6. Tin thông báo nội bộ (system message `TASK`) xuất hiện trong vendor group — full-width, không có menu thao tác (xem [3.1 FR-B.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm)) — nội dung: "[Tên người tạo] đã giao việc cho [Tên người nhận]: [Tên công việc]".
7. Tab Task trong right panel của các thành viên cập nhật ngay; người nhận thấy banner chuông rung + số đếm tăng (xem 6.1).
8. Sheet đóng.

#### Yêu cầu chức năng

- **FR-18.2:** Hover menu của mọi tin **ZALO** (text/image/file/video) đều có entry **"Tạo công việc từ tin này"**. **System messages** (TASK, PHONE_REVEAL_*) không có hover menu nên không tạo task từ system message được.
- **FR-18.3:** Khi tạo từ tin nhắn: title auto-fill = `messageContent.substring(0, 255)`. Nếu tin gốc là media (image/file/video) thì title fill = caption (nếu có) hoặc rỗng để user gõ.
- **FR-18.4:** Title max **255 ký tự**, chỉ 1 dòng (Enter bị chặn). Khi đạt 255 → counter hiển thị màu đỏ.
- **FR-18.5:** Người nhận (`assignTo`): dropdown lấy từ **member list của vendor group** đã loại Vendor (chỉ Staff + Admin). Default chọn chính user hiện tại nếu user thuộc danh sách. Nếu user không thuộc danh sách (hiếm — vd Admin xuyên nhóm) → default item đầu danh sách.
- **FR-18.6:** Danh sách việc con = items từ mẫu checklist + items tùy chỉnh, thứ tự mẫu trước rồi đến tùy chỉnh. Mỗi item ban đầu đều chưa hoàn thành.
- **FR-18.7:** Nếu chọn "Không có checklist" và không thêm item tùy chỉnh nào → task tạo không có danh sách việc con. Task vẫn hợp lệ.
- **FR-18.8:** Sau khi tạo thành công: Sheet đóng; tin thông báo `TASK` xuất hiện trong vendor group; tab Task trong right panel tự cập nhật; nếu người nhận đang online → banner rung chuông.
- **FR-18.9:** **Tin nhắn nguồn (sourceMessageId)** — khi task có sourceMessageId, **title trên task card** trong tab Task **clickable** → scroll-to tin gốc trong message list + highlight ~2s. Hover title hiển thị tooltip "Nhấn để xem tin nhắn gốc".
- **FR-18.10:** Task **không** sync Zalo. Vendor hoàn toàn không thấy system message TASK trong nhóm chat Zalo (Browser Agent lọc bỏ trước khi đẩy lên Zalo).

#### Trạng thái UI & Edge Cases

- **User là Admin nhưng không thuộc nhóm vendor:** vẫn có quyền tạo task trong nhóm (vì Admin có quyền tối đa — xem [5.1 FR-D.4](#51-hiệu-ứng-phân-quyền-trên-hiển-thị-portal-cross-cutting-15-16-17)). Dropdown người nhận chỉ chứa thành viên nội bộ trong nhóm — Admin có thể tự giao cho chính mình hoặc cho Staff thuộc nhóm.
- **Nhóm chỉ có Vendor + 1 Admin (chưa có Staff):** dropdown người nhận chỉ có Admin → có thể tự giao cho mình. Hoàn toàn hợp lệ.
- **Nhóm 0 thành viên nội bộ:** kịch bản không xảy ra (nhóm vendor luôn có ít nhất 1 tài khoản Zalo đại diện + admin có quyền truy cập). Nếu xảy ra do lỗi hệ thống → dropdown người nhận trống, không thể gửi form.
- **Title chứa số điện thoại + nhóm có ẩn SĐT (#28) + user là Staff:** title fill auto-mask theo cùng quy tắc 4.5 trước khi user chỉnh sửa. Nếu user submit title chứa số chưa mask → backend phải mask khi lưu (đảm bảo Staff khác chưa được duyệt vẫn không thấy số thật).
- **Sheet đang mở, user chuyển sang group khác (background tab):** Sheet vẫn mở với context group cũ; submit sẽ tạo task trong group cũ — chấp nhận hành vi này.
- **Mất kết nối khi submit:** hiển thị toast "Tạo task thất bại, vui lòng thử lại" + giữ nguyên Sheet để user retry.
- **Trùng task title:** không ngăn — cho phép tạo task có title trùng.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Hover menu trên một tin → entry "Tạo công việc từ tin này".
> - Sheet "Giao công việc" — 4 vùng: title textarea / dropdown giao cho (item có badge Tôi) / dropdown mẫu checklist / preview checklist + input thêm item.
> - State validation lỗi (title rỗng / chưa chọn người nhận).
> - System message TASK trong vendor group (full-width, không hover menu).
> - Task card trong right panel với title clickable khi có sourceMessageId.
> - Tooltip "Nhấn để xem tin nhắn gốc" trên title task.

---

### 6.3 #19 — Nhật Ký công việc *(VendorTaskLogSheet)*

| | |
|---|---|
| **Actors** | Staff · Admin (mọi thành viên nội bộ thuộc nhóm đều có thể đọc + comment trên Nhật Ký của mọi task trong nhóm) |
| **Scope** | Side drawer mở từ task card |
| **Sync lên Zalo** | ❌ |

#### Mục tiêu

Cho mỗi task một **thread comment riêng** (Nhật Ký công việc) để các thành viên trao đổi tiến độ, gửi câu hỏi, ghi nhận kết quả — tách bạch khỏi vendor group chat để không làm nhiễu hội thoại với Vendor.

#### Business Flow

1. User mở vendor group → right panel → tab Task → tìm task cần xem log.
2. Trên task card, nhấn icon/nút **"Nhật ký"** (📖) ở thanh action dưới card.
3. **Side drawer** "Nhật Ký công việc" trượt từ phải vào (rộng ~480px), che một phần Portal nhưng không đóng cửa sổ chat phía sau.
4. Header drawer hiển thị:
   - Label "Nhật ký công việc" + icon sách.
   - **Title task** (truncate 2 dòng).
   - Meta: "Trạng thái: [todo/doing/finished]" + người giao + người nhận.
5. Body drawer hiển thị **timeline** các log message:
   - **Tin do current user gửi:** bubble bên phải, nền brand (xanh đậm), chữ trắng.
   - **Tin của người khác:** bubble bên trái, nền trắng border xám; avatar tròn (2 chữ initials) + tên sender phía trên bubble (chỉ hiện cho tin đầu trong group cùng sender).
   - **Tin hệ thống** (status change tự sinh): bubble trung tính ở giữa hoặc style đặc biệt — vd "Status đổi từ todo → doing lúc HH:mm bởi [Tên]".
   - **Date separator** ngăn cách các ngày: "Hôm nay", "Thứ Hai 09-06-2026", v.v.
   - Timestamp HH:mm dưới mỗi bubble.
6. Cuối drawer là **input gửi tin**: textarea + nút gửi (paper plane). Enter = gửi; Shift+Enter = xuống dòng.
7. User gõ → nhấn Enter → log message mới xuất hiện ngay trong timeline (optimistic), backend persist, drawer scroll-to-bottom.
8. Đóng drawer: nhấn ✕ ở header, click backdrop, hoặc nhấn **Escape**.

#### Yêu cầu chức năng

- **FR-19.1:** **Tất cả thành viên nội bộ thuộc vendor group** đều có quyền **đọc và gửi comment** trong Nhật Ký công việc của **mọi task** thuộc nhóm — bất kể là người tạo, người nhận, hay người ngoài cuộc.
- **FR-19.2:** **Status change của task** (todo → doing → finished, hoặc revert) **tự sinh entry log** trong cùng thread với metadata: ai đổi, từ trạng thái nào sang trạng thái nào, thời điểm. Entry này có style phân biệt với comment thường (vd: bubble trung tính + icon trạng thái).
- **FR-19.3:** **Toggle checklist item** (✓ done / ☐ undone) **không** sinh entry log tự động (tránh spam). Chỉ status-level change mới log.
- **FR-19.4:** Log message **không** sync Zalo; **không** xuất hiện trong vendor group chat (không có system message tham chiếu nào). Vendor và các thành viên Zalo khác hoàn toàn không biết có log thread này.
- **FR-19.5:** Drawer mở: auto-focus input + scroll-to-bottom (xem tin mới nhất).
- **FR-19.6:** Đóng drawer: nhấn **Escape**, click ✕, hoặc click backdrop.
- **FR-19.7:** Khi có log mới từ user khác trong khi drawer đang mở: tin xuất hiện real-time + drawer auto-scroll-to-bottom (nếu user đang ở cuối). Nếu user đã cuộn lên xem tin cũ → **không** auto-scroll, thay vào đó hiện badge "▼ Tin mới" để user chủ động click xuống.
- **FR-19.8:** Tin log **không có** hover menu / reaction / reply / forward / pin / bookmark — đây là kênh comment thuần, không phải vendor chat. Chỉ có nội dung text.
- **FR-19.9:** Tên người gửi tin log hiển thị **thuần** (`SenderName`, không có `(...)` ngoặc tài khoản Zalo) vì context không phải vendor chat — xem quy tắc 6.3 của scope doc.
- **FR-19.10:** Quote/Reply không hỗ trợ trong Mốc 3 — có thể defer.

#### Trạng thái UI & Edge Cases

- **Task chưa có log nào:** drawer hiển thị empty state (không có nội dung text cụ thể) + input vẫn enable.
- **Drawer đang mở, user muốn chuyển sang task khác trong tab Task:** không thể chuyển khi drawer đang mở — user cần đóng drawer trước, sau đó mới click sang task khác.
- **User là Staff bị remove khỏi nhóm trong khi drawer mở:** drawer đóng tự động + redirect về cửa sổ chat (cửa sổ chuyển empty state "Bạn không còn quyền truy cập nhóm này" theo [5.1 FR-D.5](#51-hiệu-ứng-phân-quyền-trên-hiển-thị-portal-cross-cutting-15-16-17)). Log message đã gửi không thu hồi.
- **Task `status = finished`:** vẫn cho phép comment (vì có thể cần ghi chú follow-up).
- **Mất kết nối khi gửi log:** tin hiển thị trạng thái "đang gửi" → sau timeout → icon ❗ + nút "Thử gửi lại". Không tự retry vô hạn.
- **Tin log dài (nhiều dòng):** bubble auto-grow chiều cao; không cắt content.
- **Hai user comment đồng thời:** cả 2 entry hiện theo thứ tự backend trả về (timestamp sort).

#### Mockup tham chiếu

> [BA bổ sung] —
> - Task card trong right panel với nút "Nhật ký" 📖.
> - Side drawer "Nhật Ký công việc" — header (label + title task + meta trạng thái).
> - Timeline body: bubble own (phải, brand) vs other (trái, white + avatar + tên).
> - Date separator giữa các ngày.
> - Status change entry với style phân biệt (icon + "Status: todo → doing bởi [Tên] HH:mm").
> - Input gửi tin ở chân drawer.
> - Empty state khi chưa có log.
> - Badge "▼ Tin mới" khi user cuộn lên và có tin mới đến.

---

## 7. Nhóm G — Portal-wide

> **Phạm vi nhóm này trên Chat Portal:**
> - **G.2 PinNotificationBubble** — system message tự động sinh ra khi tin nhắn được **ghim** hoặc **bỏ ghim** trong vendor group (và cả nhóm chat nội bộ thường, nếu Portal có).
>
> **Không thuộc tài liệu này** — xem `FSD-Admin-Site.md`:
> - **Style chi tiết cuối cùng** của PinNotificationBubble (font, padding, palette cố định) — Admin Site doc giữ làm cross-cutting style spec.
> - Cấu hình bật/tắt sync system message PIN/UNPIN sang Zalo ở cấp hệ thống (nếu có).

### 7.1 G.2 — PinNotificationBubble *(gắn với #10)*

| | |
|---|---|
| **Actors** | Mọi thành viên trong nhóm (Staff · Admin · Vendor — vendor cũng thấy vì system message này có sync Zalo) |
| **Scope** | Vendor group chat (và nhóm chat nội bộ thường nếu có) |
| **Sync lên Zalo** | ✅ (kèm thao tác pin tương ứng — xem [3.7 #10](#37-10--ghim-tin-nhắn)) |

#### Mục tiêu

Khi một tin được **ghim** hoặc **bỏ ghim**, mọi thành viên trong nhóm cần biết ngay (Vendor lẫn nội bộ) **ai vừa ghim/bỏ ghim tin nào** — không phải chỉ thay đổi thanh ghim phía trên message list. PinNotificationBubble là **system message** xuất hiện trong timeline tại đúng thời điểm thao tác xảy ra, tạo audit trail tự nhiên và cho phép user nhảy về tin đã ghim một cách dễ dàng.

#### Mô tả

Khi user nhấn **Ghim** (hoặc **Bỏ ghim**) một tin trong vendor group (xem [3.7 #10](#37-10--ghim-tin-nhắn)):

1. Thanh ghim phía trên message list cập nhật (tin được thêm hoặc gỡ).
2. **System message** `PIN_NOTIFICATION` được insert vào timeline tại thời điểm action — **không phải bubble tin thường**, mà là **thanh nhỏ căn giữa**, full-width visual nhưng nội dung trong pill bo tròn.
3. Bubble chứa:
   - **Icon ghim** (Pin) màu cam, có fill.
   - **Nội dung text:** "[Tên người ghim] đã ghim một tin nhắn" hoặc "[Tên người ghim] đã bỏ ghim một tin nhắn" — tên người gửi theo quy tắc cross-cutting tại Section 6 scope doc (vd: nếu staff ghim trong vendor group, vendor thấy tên Zalo account, nội bộ thấy `ZaloAccount.displayName (StaffName)`).
   - **Nút "Xem"** (text link nhỏ màu brand) — click → scroll-to tin gốc trong message list + highlight ~2s.

#### Yêu cầu chức năng

- **FR-G.1:** Mỗi lần **ghim** một tin (#10 trigger ghim) → **insert** 1 system message `PIN_NOTIFICATION` vào timeline với `action = 'PIN'`.
- **FR-G.2:** Mỗi lần **bỏ ghim** một tin → **insert** 1 system message `PIN_NOTIFICATION` với `action = 'UNPIN'`. **Không** xóa bubble PIN cũ — giữ làm audit trail.
- **FR-G.3:** System message PIN_NOTIFICATION **sync Zalo** kèm với thao tác pin/unpin của #10 — vendor thấy trong nhóm chat Zalo "X đã ghim một tin nhắn" / "X đã bỏ ghim một tin nhắn" với danh tính tài khoản Zalo của người thao tác.
- **FR-G.4:** Bubble bao gồm:
  - `pinnedMessageId` (link nhảy về tin gốc).
  - `pinnedBy` (tên hiển thị theo rule cross-cutting Section 6 scope doc).
  - `pinnedAt` (timestamp).
  - `action`: `'PIN'` | `'UNPIN'`.
  - `messageSnippet`: preview ngắn của tin được pin (~60 ký tự đầu) — optional, có thể fallback sang content thuần "đã ghim một tin nhắn" nếu thiếu.
- **FR-G.5:** Click nút **"Xem"** trong bubble → **scroll-to** tin gốc trong message list + **highlight tạm** ~2s. Nếu tin gốc đã được lazy-unload ra khỏi DOM → lazy load lại để jump đến.
- **FR-G.6:** Tin gốc đã bị **thu hồi** (#9) sau khi đã ghim:
  - Bubble PIN_NOTIFICATION vẫn hiển thị bình thường (đây là log historic — không gỡ).
  - Click "Xem" → vẫn scroll-to vị trí tin gốc; Staff thấy placeholder "Tin nhắn đã thu hồi" theo quy tắc #9; Admin vẫn thấy nội dung gốc strikethrough.
- **FR-G.7:** Bubble **không có hover menu** (system message — xem [3.1 FR-B.1](#31-cấu-trúc-message-bubble--thao-tác-chung-trong-nhóm)). Không reply, react, forward, bookmark, pin được bubble này. Không tạo task từ bubble này.
- **FR-G.8:** **Style:**
  - Bubble căn **giữa** timeline, không phải bên trái/phải như bubble thường.
  - Pill bo tròn (`rounded-full`), nền xám nhạt, border xám nhạt 2px.
  - Font size nhỏ hơn tin thường (`text-xs`).
  - Icon Pin cam có fill ở đầu pill; nút "Xem" cuối pill màu brand, font-medium, hover underline.
  - Max width ~85% của message list để dài thì truncate snippet.

#### Trạng thái UI & Edge Cases

- **Ghim rồi bỏ ghim cùng tin nhiều lần:** mỗi lần đều sinh bubble mới — tạo dãy bubble PIN / UNPIN xen kẽ trong timeline. Không gộp hay đè.
- **Vendor ghim tin từ Zalo:** Browser Agent đồng bộ về Portal → Portal cũng insert PinNotificationBubble với tên Zalo của vendor (rule Section 6 scope doc).
- **Tin gốc bị xóa hoàn toàn (không phải thu hồi):** hiếm — nếu xảy ra, click "Xem" hiển thị toast "Tin nhắn không còn tồn tại". Bubble vẫn giữ trong timeline.
- **Pin tin INTERNAL** (TASK, PHONE_REVEAL_*): kịch bản này **không xảy ra** vì system messages không có hover menu để pin (xem 3.1 FR-B.2). Nếu xảy ra do backend force pin → bubble PIN_NOTIFICATION vẫn render, nhưng click "Xem" có thể không có ý nghĩa thực tế — chấp nhận edge case này, không cần xử lý đặc biệt phía Portal.
- **User mất quyền truy cập nhóm sau khi đã ghim:** không ảnh hưởng — bubble đã được tạo và lưu cho nhóm; thành viên khác vẫn thấy.
- **Đồng bộ chậm (sync Zalo lag):** bubble xuất hiện ngay phía Portal (optimistic); nếu sync Zalo thất bại → backend rollback nội bộ và xóa bubble; Portal nhận tín hiệu → bubble biến mất với toast lỗi tương ứng. Hành vi chi tiết do backend quy định, Portal chỉ render theo state cuối cùng.

#### Mockup tham chiếu

> [BA bổ sung] —
> - Bubble PIN_NOTIFICATION (action `PIN`) — căn giữa, icon Pin cam + "X đã ghim một tin nhắn" + nút "Xem".
> - Bubble PIN_NOTIFICATION (action `UNPIN`) — tương tự với text "đã bỏ ghim".
> - Bubble trong context timeline (giữa các bubble tin thường).
> - State hover nút "Xem" (underline).
> - Click "Xem" → animation scroll-to + highlight tin gốc.
> - Bubble dài bị truncate snippet.
> - Edge case: bubble PIN cũ vẫn còn sau khi tin gốc bị thu hồi.

---

