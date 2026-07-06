# #23a — Modal "Quản lý thành viên" trên Chat Portal

> **Trạng thái:** draft
> **Nguồn:** [`../FSD-Chat-Portal.md § 5.4 (FR-D.16–FR-D.21)`](../FSD-Chat-Portal.md) (canonical cho modal này) · [`../scope-and-features.md § D.2 (#16)`](../scope-and-features.md) (gán nhóm) · [`../scope-and-features.md § F.23 (#23)`](../scope-and-features.md) (cấu hình quyền tải gốc)
> **Liên quan:** [`#16 Phân quyền nhóm chat`](16-phan-quyen-nhom-chat.md) (cấu hình đầy đủ phía Admin Site) · [`#23 Cập nhật quyền tải xuống`](23-cap-nhat-quyen-tai-xuong.md) (mặt cấu hình quyền tải) · [`#14 Phân quyền tải tập tin`](14-phan-quyen-tai-tap-tin.md) (enforce) · [`#15 Phân quyền tài khoản Zalo`](15-phan-quyen-tai-khoan-zalo.md) (override account)

---

## 📌 Tóm tắt 1 dòng

Admin mở modal "Quản lý thành viên" ngay trong panel phải của nhóm vendor đang đứng trên Chat Portal để thêm/xóa Nhân viên nội bộ và bật/tắt quyền tải xuống cho từng người — chỉnh quyền nhanh tại chỗ mà không phải rời sang Admin Site.

---

## 🎯 Giá trị nghiệp vụ

Khi đang xử lý hội thoại của một nhóm NCC trên Chat Portal, Admin thường cần điều chỉnh ngay ai được tham gia nhóm và ai được tải tập tin — ví dụ thêm một Nhân viên vừa nhận bàn giao, gỡ một người vừa chuyển bộ phận, hay siết quyền tải khi nhóm có tài liệu nhạy cảm. Nếu mỗi lần như vậy đều phải rời Chat Portal, mở Admin Site, tìm lại đúng nhóm trong bảng "Quản lý nhóm NCC" rồi mới thao tác thì rất mất thời gian và dễ làm gián đoạn luồng chat đang xử lý.

Tính năng này gom các thao tác quản lý thành viên **của riêng nhóm đang mở** vào một modal duy nhất — mở trực tiếp từ panel phải của cửa sổ chat. Trong modal, Admin thấy danh sách Nhân viên nội bộ của nhóm và với mỗi người có thể: **xóa khỏi nhóm**, **bật/tắt quyền tải xuống**, hoặc bấm **"Thêm"** để đưa Nhân viên mới vào nhóm. Mọi thay đổi **có hiệu lực tức thì** trên Chat Portal của Nhân viên liên quan — nhóm xuất hiện/biến mất khỏi sidebar, nút tải hiện/ẩn — không cần ai tải lại trang.

Đây là **kênh thao tác nhanh tại chỗ** trên Chat Portal, đi cặp với hai tài liệu mô tả cấu hình đầy đủ: [`#16`](16-phan-quyen-nhom-chat.md) (gán Nhân viên vào nhóm — bảng quản lý đầy đủ phía Admin Site) và [`#23`](23-cap-nhat-quyen-tai-xuong.md) (mặt cấu hình quyền tải). Việc *thực thi* quyền tải (ẩn/khóa nút Tải khi Nhân viên bấm) thuộc [`#14`](14-phan-quyen-tai-tap-tin.md). Tài liệu này tập trung mô tả **modal trên Chat Portal** như một trải nghiệm thống nhất, tránh để add/remove và toggle quyền tải nằm rải rác ở các file khác.

**Lợi ích:**

- Admin chỉnh thành viên và quyền tải ngay trong luồng chat, không phải chuyển sang Admin Site rồi tìm lại nhóm.
- Thay đổi có hiệu lực real-time, đồng bộ ngay với sidebar và nút tải bên phía Nhân viên.
- Quy về một modal thống nhất cho nhóm đang mở, giảm sai sót thao tác nhầm nhóm.

---

## 👥 Vai trò liên quan

| Vai trò | Trách nhiệm |
| --- | --- |
| **Quản trị (Admin)** | Người duy nhất thấy nút "Quản lý" và thao tác trong modal. Thêm/xóa Nhân viên nội bộ của nhóm đang mở, bật/tắt quyền tải cho từng người. Không tự xóa được chính mình khỏi nhóm. Bản thân Admin luôn có quyền tải, không bị áp toggle này. |
| **Nhân viên (Staff)** | Không thấy nút "Quản lý"; nếu có xem danh sách thành viên thì chỉ xem, không thao tác. Là đối tượng được thêm/xóa và cấu hình quyền tải. Cảm nhận kết quả qua việc nhóm xuất hiện/biến mất trong sidebar và nút tải hiện/ẩn trên Chat Portal. |
| **Vendor (NCC)** | Không hiển thị trong modal (modal chỉ liệt kê Nhân viên nội bộ). Không truy cập Chat Portal, không bị ảnh hưởng bởi thao tác trong modal. |
| **Hệ thống** | Chỉ render nút "Quản lý" cho Admin · Lọc danh sách modal chỉ gồm Nhân viên nội bộ đã ở trong nhóm · Lưu thay đổi add/remove/toggle ngay, không cần nút "Lưu" · Phát thay đổi real-time tới sidebar và cửa sổ chat của Nhân viên liên quan · Khi xóa Nhân viên, gỡ luôn cấu hình quyền tải và override account của họ trong nhóm đó · Cập nhật footer thống kê theo thời gian thực. |

---

## 🔄 Dòng chảy nghiệp vụ

Admin thao tác trong modal "Quản lý thành viên" của nhóm đang mở; mỗi thay đổi được lưu ngay và phát real-time sang Chat Portal của Nhân viên liên quan:

```mermaid
sequenceDiagram
    actor Admin
    participant Panel as Panel phải<br/>(tab Thông tin)
    participant Modal as Modal<br/>"Quản lý thành viên"
    participant Sys as Hệ thống
    participant Staff as Chat Portal<br/>của Nhân viên

    Admin->>Panel: Mở nhóm → tab "Thông tin" → mục Thành viên
    Panel-->>Admin: Hiện nút "Quản lý" (chỉ Admin thấy)
    Admin->>Modal: Click "Quản lý"
    Modal-->>Admin: Danh sách Nhân viên nội bộ trong nhóm<br/>mỗi hàng: toggle quyền tải + nút ✕

    alt Thêm Nhân viên
        Admin->>Modal: Click "Thêm" → tìm tên → click Nhân viên
        Modal->>Sys: Thêm vào nhóm (lưu ngay)
        Sys-->>Staff: Nhóm xuất hiện trong sidebar real-time
    else Xóa Nhân viên
        Admin->>Modal: Click ✕ → xác nhận
        Modal->>Sys: Xóa khỏi nhóm + gỡ quyền tải & override
        Sys-->>Staff: Nhóm biến mất khỏi sidebar;<br/>nếu đang mở → empty state
    else Toggle quyền tải
        Admin->>Modal: Click icon tải trên hàng Nhân viên
        Modal->>Sys: Lưu quyền tải (Nhân viên × nhóm)
        Sys-->>Staff: Nút Tải trên tin file hiện/ẩn real-time
    end

    Sys-->>Modal: Footer cập nhật: tổng N · M có quyền tải
```

---

## ✅ Kịch bản chấp nhận

```gherkin
# language: vi
Tính năng: Admin quản lý thành viên và quyền tải của nhóm vendor đang mở ngay trên Chat Portal

  Bối cảnh:
    Biết Admin "Nguyễn Quản Trị" đã đăng nhập Chat Portal
    Và đang mở nhóm "NCC Vận Chuyển Phương Nam"
    Và panel phải đang ở tab "Thông tin"

  # =====================================================
  # Lối vào — chỉ Admin (FR-D.16)
  # =====================================================

  Tình huống: Admin thấy nút "Quản lý" trong mục Thành viên
    Biết Admin đang xem mục "Thành viên" của panel phải
    Khi panel hiển thị xong
    Thì mục Thành viên có nút "Quản lý"
    Và nhấn nút đó mở modal "Quản lý thành viên"

  Tình huống: Nhân viên không thấy nút "Quản lý"
    Biết người dùng hiện tại là Nhân viên (không phải Admin)
    Khi người đó mở mục "Thành viên" của panel phải
    Thì không hiển thị nút "Quản lý"
    Và Nhân viên chỉ xem được danh sách thành viên, không thao tác

  # =====================================================
  # Danh sách trong modal (FR-D.17)
  # =====================================================

  Tình huống: Modal chỉ liệt kê Nhân viên nội bộ của nhóm
    Biết nhóm có 2 Nhân viên nội bộ và một số thành viên Vendor trên Zalo
    Khi Admin mở modal "Quản lý thành viên"
    Thì modal liệt kê 2 Nhân viên nội bộ
    Nhưng không liệt kê thành viên Vendor nào

  Tình huống: Mỗi hàng Nhân viên có toggle quyền tải và nút xóa
    Biết modal "Quản lý thành viên" đang mở
    Khi Admin xem một hàng Nhân viên
    Thì hàng đó hiển thị tên, badge vai trò, nút toggle quyền tải và nút ✕ xóa

  # =====================================================
  # Thêm Nhân viên vào nhóm (FR-D.19)
  # =====================================================

  Tình huống: Admin chuyển sang view thêm Nhân viên
    Biết modal "Quản lý thành viên" đang ở view danh sách
    Khi Admin nhấn nút "Thêm" ở header modal
    Thì modal chuyển sang view thêm với ô tìm kiếm theo tên

  Tình huống: Click một Nhân viên trong kết quả tìm là thêm ngay
    Biết Admin đang ở view thêm và gõ tên tìm được "Lê Diễm Chi"
    Khi Admin click vào "Lê Diễm Chi"
    Thì "Lê Diễm Chi" được thêm vào nhóm ngay, không cần nút xác nhận

  Tình huống: Nhân viên đã ở trong nhóm không xuất hiện ở view thêm
    Biết "Phạm Minh Quân" đã là thành viên nội bộ của nhóm
    Khi Admin tìm "Phạm Minh Quân" ở view thêm
    Thì "Phạm Minh Quân" không xuất hiện trong kết quả tìm kiếm

  Tình huống: Nhóm hiện ra trong sidebar của Nhân viên ngay khi được thêm
    Biết "Lê Diễm Chi" đang mở Chat Portal và chưa thấy nhóm "NCC Vận Chuyển Phương Nam"
    Khi Admin thêm "Lê Diễm Chi" vào nhóm qua modal
    Thì nhóm xuất hiện trong sidebar của "Lê Diễm Chi" real-time

  # =====================================================
  # Xóa Nhân viên khỏi nhóm (FR-D.20)
  # =====================================================

  Tình huống: Xóa Nhân viên có hỏi xác nhận
    Biết "Lê Diễm Chi" đang trong danh sách thành viên của nhóm
    Khi Admin nhấn nút ✕ trên hàng "Lê Diễm Chi"
    Thì hệ thống hiển thị hộp thoại xác nhận
    Và chưa xóa cho tới khi Admin xác nhận

  Tình huống: Xóa Nhân viên thì nhóm biến mất khỏi sidebar của họ
    Biết "Lê Diễm Chi" đang thấy nhóm trong sidebar Chat Portal
    Khi Admin xác nhận xóa "Lê Diễm Chi" khỏi nhóm
    Thì nhóm biến mất khỏi sidebar của "Lê Diễm Chi" real-time

  Tình huống: Nhân viên đang mở nhóm bị xóa thấy empty state
    Biết "Lê Diễm Chi" đang mở cửa sổ chat của nhóm này
    Khi Admin xác nhận xóa "Lê Diễm Chi" khỏi nhóm
    Thì cửa sổ chat của "Lê Diễm Chi" chuyển empty state "Bạn không còn quyền truy cập nhóm này"
    Và nội dung soạn dở (draft) trong ô nhập bị xóa

  Tình huống: Xóa Nhân viên cũng gỡ quyền tải và override account của họ
    Biết "Lê Diễm Chi" đang có quyền tải BẬT và một override account trong nhóm
    Khi Admin xác nhận xóa "Lê Diễm Chi" khỏi nhóm
    Thì cấu hình quyền tải của "Lê Diễm Chi" trong nhóm bị gỡ
    Và override account của "Lê Diễm Chi" trong nhóm bị hủy

  # =====================================================
  # Toggle quyền tải (FR-D.18, FR-D.21)
  # =====================================================

  Tình huống: Bật quyền tải cho một Nhân viên
    Biết quyền tải của "Lê Diễm Chi" trong nhóm đang TẮT
    Khi Admin nhấn nút toggle quyền tải trên hàng của "Lê Diễm Chi"
    Thì quyền tải chuyển sang BẬT
    Và thay đổi được lưu ngay, không cần nút "Lưu"

  Tình huống: Toggle quyền tải có hiệu lực real-time khi Nhân viên đang xem nhóm
    Biết "Lê Diễm Chi" đang mở nhóm này và quyền tải đang BẬT
    Khi Admin tắt quyền tải của "Lê Diễm Chi" trong modal
    Thì nút Tải trên các tin file biến mất ngay với "Lê Diễm Chi" mà không cần tải lại trang

  # =====================================================
  # Footer thống kê
  # =====================================================

  Tình huống: Footer cập nhật số Nhân viên có quyền tải
    Biết footer đang hiển thị "Tổng 3 thành viên · 2 có quyền tải"
    Khi Admin tắt quyền tải của một Nhân viên đang BẬT
    Thì footer cập nhật thành "Tổng 3 thành viên · 1 có quyền tải"

  Tình huống: Footer cập nhật tổng số khi thêm Nhân viên
    Biết footer đang hiển thị "Tổng 2 thành viên"
    Khi Admin thêm một Nhân viên vào nhóm
    Thì footer cập nhật thành "Tổng 3 thành viên"

  # =====================================================
  # Trường hợp đặc biệt
  # =====================================================

  Tình huống: Admin không tự xóa được chính mình khỏi nhóm
    Biết Admin "Nguyễn Quản Trị" cũng là thành viên hiển thị trong modal
    Khi Admin xem hàng của chính mình
    Thì hàng đó không có nút ✕ xóa

  Tình huống: Nhân viên bị xóa đúng lúc Admin đang xem modal
    Biết "Lê Diễm Chi" đang mở nhóm và Admin đang mở modal "Quản lý thành viên"
    Khi Admin xác nhận xóa "Lê Diễm Chi"
    Thì hàng "Lê Diễm Chi" biến mất khỏi modal ngay
    Và cửa sổ chat của "Lê Diễm Chi" chuyển empty state cùng lúc
```

---

## 🎨 Mô tả giao diện

### Lối vào

```
Chat Portal → mở nhóm → panel phải → tab "Thông tin"
   → mục "Thành viên" → nút "Quản lý" (chỉ Admin thấy)
       → modal "Quản lý thành viên"
```

### Panel phải — tab "Thông tin", mục "Thành viên"

Panel phải của nhóm có 2 tab: **"Thông tin"** và **"Công việc"**. Tab "Thông tin" gồm các mục: header nhóm (avatar + tên + badge), toggle "Ẩn số điện thoại", thống kê (Ảnh/Video · Tài liệu · Thành viên), mục Ảnh/Video, mục Tài liệu, và mục **"Thành viên"** ở cuối.

```
┌─────────────────────────────────────────┐
│  [Thông tin]        Công việc            │  ← 2 tab
│ ─────────────────────────────────────────│
│  [GL]  Giò Chả Cửu Long           ✎     │
│        🏷 Quốc Nam Sup                    │
│ ─────────────────────────────────────────│
│  👁 Ẩn số điện thoại            [ ⚪ ]    │
│ ─────────────────────────────────────────│
│   0          0           2               │
│ Ảnh/Video  Tài liệu  Thành viên          │
│ ─────────────────────────────────────────│
│  ...  (Ảnh/Video, Tài liệu)              │
│ ─────────────────────────────────────────│
│  👥 Thành viên  2        [ Quản lý ]  ▾  │  ← nút "Quản lý" chỉ Admin thấy
│     [DN] Diệp Nguyễn      [Quản lý]      │
│     [CL] Chị Hương …      [NCC]          │
└─────────────────────────────────────────┘
```

> Mục "Thành viên" liệt kê cả Nhân viên nội bộ (badge vai trò) lẫn Vendor (badge NCC) để Admin có ngữ cảnh. Nút **"Quản lý"** chỉ Admin thấy; mở modal thao tác. Với Nhân viên, nút này không hiển thị — mục Thành viên chỉ để xem.

### Modal "Quản lý thành viên" — view danh sách (mặc định)

```
┌──────────────────────────────────────────────┐
│  Quản lý thành viên               [ + Thêm ]  │
│ ────────────────────────────────────────────  │
│  Lê Diễm Chi      [Staff]      [⬇ BẬT]   [✕]  │  ← toggle quyền tải · nút xóa
│  Phạm Minh Quân   [Staff]      [⬇ TẮT]   [✕]  │
│  Nguyễn Quản Trị  [Admin]      (không toggle) │  ← Admin: không toggle, không ✕ (chính mình)
│ ────────────────────────────────────────────  │
│  Tổng 3 thành viên · 1 có quyền tải           │  ← footer thống kê
└──────────────────────────────────────────────┘
```

| Thành phần | Mô tả | Ghi chú |
| --- | --- | --- |
| **Tiêu đề** | "Quản lý thành viên" | Context nhóm đã rõ từ cửa sổ chat đang mở |
| **Nút "+ Thêm"** | Ở header modal → chuyển sang view thêm Nhân viên | |
| **Phạm vi danh sách** | Chỉ **Nhân viên nội bộ** đã ở trong nhóm; Vendor Zalo không hiển thị | FR-D.17 |
| **Mỗi hàng** | Tên + badge vai trò + nút toggle quyền tải + nút ✕ xóa | |
| **Nút toggle quyền tải** (⬇) | Bật/tắt **toàn bộ** quyền tải (Hình ảnh + Tài liệu + Video đồng thời) cho Nhân viên đó trong nhóm | FR-D.18 — một toggle, không tách loại file. Xem [`#23 Q&A #1`](23-cap-nhat-quyen-tai-xuong.md) |
| **Nút ✕ xóa** | Xóa Nhân viên khỏi nhóm; mở hộp thoại xác nhận | Hàng của chính Admin đang đăng nhập **không** có nút ✕ |
| **Hàng Admin** | Admin (nếu là thành viên) hiển thị không kèm toggle quyền tải vì Admin luôn có quyền tải | Xem Q&A #2 |
| **Footer** | "Tổng N thành viên · M có quyền tải" | Cập nhật real-time khi add/remove/toggle |

### Modal "Quản lý thành viên" — view thêm Nhân viên

```
┌──────────────────────────────────────────────┐
│  Thêm nhân viên                  [ ← Quay lại ]│
│ ────────────────────────────────────────────  │
│  🔍 [ Tìm theo tên… ]                          │
│ ────────────────────────────────────────────  │
│  [avatar] Tăng Thị Huyền   — Kho hàng         │  ← click row = thêm ngay
│  [avatar] Trần Văn Bốn     — Vận hành         │
└──────────────────────────────────────────────┘
```

| Thành phần | Mô tả |
| --- | --- |
| **Ô tìm kiếm** | Gõ tên để lọc danh sách Nhân viên nội bộ |
| **Hành vi** | Click row = thêm ngay vào nhóm, không checkbox, không nút "Lưu" |
| **Loại trừ** | Nhân viên đã ở trong nhóm không xuất hiện trong kết quả tìm |

> **Khác biệt với modal "Thêm nhân viên vào nhóm" của #16 (Admin Site):** view thêm ở Chat Portal **có ô tìm kiếm theo tên** (FR-D dùng search); còn modal ở Admin Site (#16) thì click-to-add không search. Đây là hai kênh thêm khác nhau — xem Q&A #3 về ràng buộc "đủ điều kiện đại diện".

### Hộp thoại xác nhận xóa

> "Xóa [Tên Nhân viên] khỏi nhóm [Tên nhóm]? Nhân viên sẽ không còn thấy nhóm này trong sidebar Chat Portal."

Hai nút: **Hủy** (đóng, không xóa) và xác nhận (xóa Nhân viên + gỡ quyền tải + hủy override account trong nhóm).

### Trạng thái nút toggle quyền tải

| Trạng thái | Hiển thị | Hệ quả trên Chat Portal của Nhân viên (xem [`#14`](14-phan-quyen-tai-tap-tin.md)) |
| --- | --- | --- |
| **BẬT** | Icon ⬇ tô màu / nền sáng | Nút Tải hiện trên các tin file trong nhóm |
| **TẮT** | Icon ⬇ mờ / nền xám | Nút Tải bị ẩn/khóa trên các tin file |

### Mockup tham chiếu

> ✅ **Đã có:**
> - Panel phải tab "Thông tin" → mục "Thành viên" với nút "Quản lý" (góc nhìn Admin — ảnh demo nhóm "Giò Chả Cửu Long").
>
> ⏳ **Cần BA bổ sung:**
> - Modal "Quản lý thành viên" — view danh sách: so sánh hàng toggle BẬT vs TẮT, hàng Admin không có toggle/✕.
> - Modal view "Thêm nhân viên" (ô tìm kiếm + click-to-add).
> - Footer thống kê "Tổng N thành viên · M có quyền tải".
> - Hộp thoại xác nhận xóa Nhân viên khỏi nhóm.
> - Empty state cửa sổ chat "Bạn không còn quyền truy cập nhóm này" khi bị xóa lúc đang mở.

---

## 🔗 Tham chiếu & Q&A

### Liên quan các phần khác

- [`#16 Phân quyền nhóm chat`](16-phan-quyen-nhom-chat.md): cấu hình gán Nhân viên vào nhóm **đầy đủ** (bảng "Quản lý nhóm NCC" phía Admin Site, bulk, expand row). Modal #23a là kênh **thao tác nhanh tại chỗ** cho riêng nhóm đang mở; thêm/xóa ở hai nơi tác động cùng một quan hệ gán.
- [`#23 Cập nhật quyền tải xuống`](23-cap-nhat-quyen-tai-xuong.md): mô tả **mặt cấu hình quyền tải** — cùng modal "Quản lý thành viên" này. #23a gom cả thêm/xóa lẫn toggle quyền tải để mô tả modal như một trải nghiệm thống nhất; mọi chi tiết riêng về toggle quyền tải (mặc định BẬT/TẮT, tách loại file) flag tại #23.
- [`#14 Phân quyền tải tập tin`](14-phan-quyen-tai-tap-tin.md): **thực thi** quyền tải — Chat Portal ẩn/khóa nút Tải khi Nhân viên bấm. #23a chỉ mô tả thao tác cấu hình; hành vi khi tải nằm ở #14.
- [`#15 Phân quyền tài khoản Zalo`](15-phan-quyen-tai-khoan-zalo.md): xóa Nhân viên khỏi nhóm (#23a/FR-D.20) hủy luôn override account của họ trong nhóm; muốn thêm lại override phải cấu hình ở Admin Site.
- [`#12 Ghim hội thoại`](12-ghim-hoi-thoai.md): khi Nhân viên mất quyền nhóm do bị xóa, pin của nhóm đó cũng bị gỡ (đồng bộ với #16).

### ⚠️ Q&A cần BA / PO làm rõ

1. **Modal Chat Portal (#23a) và bảng Admin Site (#16) là hai kênh thêm/xóa song song — có nguy cơ lệch nhau không?**
   - [`scope-and-features.md § D.2`](../scope-and-features.md) chốt nơi cấu hình gán nhóm **đầy đủ** là Admin Site (Quản lý nhóm NCC). [`FSD-Chat-Portal.md § 5.4`](../FSD-Chat-Portal.md) bổ sung kênh thêm/xóa nhanh ngay trên Chat Portal cho nhóm đang mở.
   - **Pilot hiện đang theo:** cả hai kênh ghi vào cùng một quan hệ gán (Nhân viên × nhóm), có hiệu lực real-time ở cả hai chiều. **Cần BA/PO xác nhận** không có khác biệt nghiệp vụ giữa hai kênh (ví dụ: kênh Chat Portal có bị giới hạn ràng buộc "đủ điều kiện đại diện" như modal #16 không — xem Q&A #3).

2. **Modal có liệt kê Admin (thành viên nhóm) không, và hàng Admin hiển thị thế nào?**
   - [`FSD-Chat-Portal.md § 5.4`](../FSD-Chat-Portal.md) nói modal "chỉ hiển thị Staff nội bộ". Chưa rõ một Admin khác cũng là thành viên nhóm có xuất hiện không; nếu có thì hàng đó có nút toggle quyền tải / nút ✕ không (Admin luôn có quyền tải — [`#14 FR-14.3`](14-phan-quyen-tai-tap-tin.md); và FR-D không cho Admin tự xóa mình).
   - **Pilot hiện đang theo:** chỉ liệt kê Nhân viên (Staff); nếu Admin có hiện thì **không** kèm toggle quyền tải và **không** kèm nút ✕ cho chính mình. Đồng bộ với [`#23 Q&A #4`](23-cap-nhat-quyen-tai-xuong.md). **Cần BA xác nhận.**

3. **View "Thêm nhân viên" ở Chat Portal có áp ràng buộc "đủ điều kiện đại diện" như modal #16 không?**
   - Modal #16 (Admin Site) chỉ liệt kê Nhân viên **đã được gán đại diện cho ≥ 1 tài khoản Zalo đang đồng bộ nhóm** ([`#16 FR-NHOM.7`](16-phan-quyen-nhom-chat.md)). [`FSD-Chat-Portal.md § 5.4 FR-D.19`](../FSD-Chat-Portal.md) chỉ mô tả "gõ tên tìm trong danh sách Staff nội bộ → click → thêm", **không** nêu ràng buộc eligible.
   - **Pilot hiện đang theo:** chưa quyết — viết trung lập "tìm trong danh sách Nhân viên nội bộ". **Cần BA/PO chốt** view thêm ở Chat Portal có lọc theo eligible (#15) giống #16 không, hay cho thêm bất kỳ Nhân viên nội bộ nào (kể cả chưa có account đại diện → chỉ-đọc trong nhóm).

4. **Giá trị mặc định quyền tải khi Nhân viên vừa được thêm vào nhóm qua modal này là BẬT hay TẮT?**
   - Trùng với [`#23 Q&A #3`](23-cap-nhat-quyen-tai-xuong.md) — chưa nguồn nào chốt. Ảnh hưởng: thêm xong Nhân viên tải được ngay (BẬT) hay phải Admin cấp (TẮT).
   - **Pilot hiện đang theo:** đề xuất mặc định **TẮT** (an toàn dữ liệu, opt-in). **Cần BA/PO chốt** và đồng bộ một con số với #23.

5. **Xóa Nhân viên cuối cùng khỏi nhóm qua modal: cho phép nhóm "không còn Nhân viên nào" không?**
   - Trùng với [`#16 Q&A #1`](16-phan-quyen-nhom-chat.md). [`FSD-Admin-Site.md § 3.2 Edge Cases`](../FSD-Admin-Site.md) cho phép (chỉ Admin truy cập). FR-D.20 không nêu chặn.
   - **Pilot hiện đang theo:** cho phép xóa người cuối; nhóm chỉ còn Admin truy cập. **Cần BA/PO xác nhận** thống nhất với #16.
