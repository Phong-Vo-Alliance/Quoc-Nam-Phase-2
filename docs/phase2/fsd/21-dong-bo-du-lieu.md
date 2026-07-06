# #21 — Đồng bộ dữ liệu

> **Trạng thái:** draft
> **Nguồn:** scope-and-features.md § F.21 · FSD-Admin-Site.md § 2.3 (Tab Đồng bộ dữ liệu)

---

## 📌 Tóm tắt 1 dòng

Admin kích hoạt đồng bộ thủ công cho từng tài khoản Zalo đã liên kết, hệ thống kéo về toàn bộ nhóm chat và lịch sử tin nhắn rồi trả về báo cáo tóm tắt (số tin, media, dung lượng, số file video lớn).

---

## 🎯 Giá trị nghiệp vụ

Sau khi liên kết tài khoản Zalo (#20), dữ liệu hội thoại của vendor cần được kéo về Chat Portal để nhân viên làm việc. Lần liên kết đầu tiên hệ thống tự chạy đồng bộ, nhưng theo thời gian dữ liệu có thể lệch — tài khoản rớt kết nối rồi nối lại, vendor gửi nhiều tin trong lúc gián đoạn, hoặc lịch sử cũ chưa kéo hết. Nếu không có cách chủ động làm mới, Admin không biết kho dữ liệu đã đầy đủ hay chưa và cũng không có cách buộc hệ thống kéo lại.

Tab **Đồng bộ dữ liệu** cho Admin tự bấm "Đồng bộ ngay" cho từng tài khoản và xem ngay một báo cáo tóm tắt: tổng tin nhắn, số hình ảnh / tài liệu / video, tổng dung lượng ước tính, và đặc biệt là **số file video vượt 300MB** — nhóm file nặng cần theo dõi riêng (link sang Tab Theo dõi file lớn). Mỗi lần đồng bộ được ghi lại thành lịch sử để Admin đối chiếu kết quả qua các lần.

**Lợi ích:**

- Admin chủ động làm mới dữ liệu mà không cần can thiệp kỹ thuật.
- Báo cáo tóm tắt cho biết ngay quy mô dữ liệu vừa kéo về và phát hiện file nặng bất thường.
- Lịch sử đồng bộ giúp đối chiếu, truy vết khi nghi ngờ thiếu dữ liệu.

---

## 👥 Vai trò liên quan

| Vai trò | Trách nhiệm |
| ------- | ----------- |
| **Admin** | Chọn tài khoản và nhấn "Đồng bộ ngay"; xem báo cáo tóm tắt và lịch sử đồng bộ; theo link file video lớn sang Tab 3. |
| **Hệ thống** | Kéo về nhóm chat và tin nhắn (real-time + lịch sử cũ); tính toán số liệu báo cáo; ghi entry lịch sử; chặn 2 lần đồng bộ chồng nhau trên cùng tài khoản. |

---

## 🔄 Dòng chảy nghiệp vụ

**Từ lúc Admin kích hoạt đến khi nhận báo cáo tóm tắt:**

```mermaid
flowchart TD
    A[Admin nhấn "Đồng bộ ngay" trên card tài khoản] --> B{Tài khoản<br/>connected?}
    B -- Không (disconnected/expired) --> C[Nút bị disabled<br/>tooltip giải thích]
    B -- Có --> D{Đang có lần sync<br/>chạy dở?}
    D -- Có --> E[Nút bị disabled<br/>chờ lần sync hiện tại xong]
    D -- Không --> F[Nút biến thành progress bar<br/>"Đang đồng bộ... X%"]
    F --> G[Hệ thống kéo nhóm chat + tin real-time + lịch sử cũ]
    G --> H[Tính số liệu: tin nhắn, ảnh,<br/>tài liệu, video, dung lượng, file video lớn]
    H --> I[Toast "Đồng bộ xong: X tin nhắn từ Y nhóm"]
    I --> J[Cập nhật Stats grid 6 ô]
    I --> K[Thêm 1 entry vào Lịch sử đồng bộ]
```

> **Lưu ý:** "Đồng bộ ngay" gom 3 việc nền — kéo danh sách nhóm chat, kéo tin nhắn thời gian thực, và kéo lịch sử tin nhắn cũ — chạy lần lượt cho riêng tài khoản được chọn. Card mỗi tài khoản đồng bộ độc lập, không ảnh hưởng card khác.

---

## ✅ Kịch bản chấp nhận

```gherkin
# language: vi
Tính năng: Đồng bộ dữ liệu thủ công cho tài khoản Zalo

  Bối cảnh:
    Biết Admin đang ở Tab "Đồng bộ dữ liệu" của trang Nhà Cung Cấp
    Và mỗi tài khoản đã liên kết hiển thị thành một card riêng

  # ===== Card tài khoản & nút Đồng bộ =====

  Tình huống: Mỗi tài khoản hiển thị một card đồng bộ độc lập
    Khi Admin xem Tab "Đồng bộ dữ liệu"
    Thì mỗi tài khoản đã liên kết hiển thị một card riêng
    Và card có header gồm avatar, tên và badge trạng thái kết nối
    Và card có nút "Đồng bộ ngay", stats grid 6 ô và khu vực "Lịch sử đồng bộ"

  Tình huống: Kích hoạt đồng bộ thành công
    Biết tài khoản đang ở trạng thái "connected" và không có lần sync nào đang chạy
    Khi Admin nhấn nút "Đồng bộ ngay"
    Thì nút biến thành progress bar với nhãn "Đang đồng bộ... X%"
    Và khi hoàn tất hệ thống hiển thị toast "Đồng bộ xong: X tin nhắn từ Y nhóm"
    Và stats grid được cập nhật
    Và một entry mới được thêm vào "Lịch sử đồng bộ"

  # ===== Báo cáo tóm tắt (Stats grid 6 ô) =====

  Tình huống: Stats grid hiển thị đủ 6 chỉ số sau đồng bộ
    Biết một lần đồng bộ vừa hoàn tất
    Khi Admin xem stats grid của card
    Thì stats grid hiển thị tổng tin nhắn, số hình ảnh, số tài liệu, số video, tổng dung lượng ước tính và số file video lớn hơn 300MB

  Tình huống: Số file video lớn là link sang Tab Theo dõi file lớn
    Biết stats grid hiển thị số file video lớn hơn 300MB
    Khi Admin nhấn vào con số đó
    Thì hệ thống điều hướng sang Tab "Theo dõi file lớn" với bộ lọc pre-set theo tài khoản này

  # ===== Lịch sử đồng bộ =====

  Tình huống: Lịch sử đồng bộ liệt kê các lần trước
    Biết tài khoản đã đồng bộ nhiều lần
    Khi Admin mở khu vực "Lịch sử đồng bộ"
    Thì hệ thống hiển thị tối thiểu 10 entry gần nhất
    Và mỗi entry hiển thị thời điểm bắt đầu, thời điểm kết thúc, tổng tin và kết quả
    Và có pagination hoặc nút "load more" khi nhiều hơn 10 entry

  Khung tình huống: Kết quả mỗi lần đồng bộ trong lịch sử
    Khi một lần đồng bộ kết thúc với kết quả "<kết quả>"
    Thì entry tương ứng trong lịch sử hiển thị nhãn "<nhãn>"

    Dữ liệu:
      | kết quả    | nhãn        |
      | thành công | Thành công  |
      | lỗi        | Lỗi         |

  # ===== Trường hợp đặc biệt =====

  Tình huống: Tài khoản mất kết nối không cho đồng bộ
    Biết tài khoản đang ở trạng thái "disconnected" hoặc "expired"
    Khi Admin xem card tài khoản đó
    Thì nút "Đồng bộ ngay" bị disabled
    Và có tooltip giải thích lý do không thể đồng bộ

  Tình huống: Chặn hai lần đồng bộ chồng nhau trên cùng tài khoản
    Biết một lần đồng bộ đang chạy trên tài khoản
    Khi Admin cố nhấn "Đồng bộ ngay" lần nữa trên cùng tài khoản
    Thì nút vẫn ở trạng thái disabled cho đến khi lần đồng bộ hiện tại kết thúc
```

---

## 🎨 Mô tả giao diện

### Cấu trúc trang

```
Trang Nhà Cung Cấp
└─ [ Tab 1: Liên kết tài khoản ] [ Tab 2: Đồng bộ dữ liệu ] [ Tab 3: Theo dõi file lớn ]
   ┌─ CARD TÀI KHOẢN ─────────────────────────────────────────────┐
   │ ◯ Nguyễn A          ● Đang kết nối        [ Đồng bộ ngay ]    │
   │ ┌──────────┬──────────┬──────────┬──────────┬───────┬──────┐ │
   │ │ Tin nhắn │ Hình ảnh │ Tài liệu │  Video   │ Dung  │Video │ │
   │ │  12.480  │   3.210  │    540   │    87    │ lượng │>300MB│ │
   │ │          │          │          │          │ 4.2GB │  3 ▸ │ │ ← link Tab 3
   │ └──────────┴──────────┴──────────┴──────────┴───────┴──────┘ │
   │ ▸ Lịch sử đồng bộ (collapsible)                              │
   └──────────────────────────────────────────────────────────────┘
   ┌─ CARD TÀI KHOẢN khác ... ────────────────────────────────────┐
```

### Card tài khoản

| Thành phần | Nội dung | Ghi chú |
| ---------- | -------- | ------- |
| Header | Avatar + tên + badge trạng thái kết nối | — |
| Nút "Đồng bộ ngay" | Xanh; disabled khi `disconnected` / `expired` hoặc đang sync | Biến thành progress bar khi đang chạy |
| Progress bar | Nhãn "Đang đồng bộ... X%" | Thay chỗ nút trong lúc sync |
| Stats grid 6 ô | Tin nhắn / Hình ảnh / Tài liệu / Video / Dung lượng tổng / **File video > 300MB** | Ô cuối là link sang Tab 3 |
| Lịch sử đồng bộ | Khu vực collapsible bên dưới | Bảng các lần sync trước |

### Bảng "Lịch sử đồng bộ"

| Cột | Nội dung | Ghi chú |
| --- | -------- | ------- |
| Thời điểm bắt đầu | Timestamp lúc bắt đầu sync | — |
| Thời điểm kết thúc | Timestamp lúc hoàn tất | — |
| Tổng tin | Số tin nhắn kéo về lần đó | — |
| Kết quả | "Thành công" / "Lỗi" | — |

> Hiển thị tối thiểu 10 entry gần nhất, có pagination / load more nếu nhiều hơn.

### Mockup tham chiếu

> ⏳ **Cần BA bổ sung:** (1) Card tài khoản với stats grid 6 ô; (2) Card trong trạng thái đang sync (progress bar); (3) Khu vực "Lịch sử đồng bộ" mở rộng với bảng các lần sync.

---

## 🔗 Tham chiếu & Q&A

### Liên quan các phần khác

- **#20 Liên kết tài khoản Zalo:** `20-lien-ket-tai-khoan-zalo.md` — nguồn của danh sách tài khoản; sau khi liên kết, hệ thống tự chạy đồng bộ ban đầu (Tab 2 này là đồng bộ thủ công sau đó).
- **#24 Theo dõi file lớn:** `FSD-Admin-Site.md` § (Tab 3) — con số "file video > 300MB" trong báo cáo là link điều hướng sang đây với filter pre-set theo tài khoản.
- **#2 Đồng bộ nhóm chat vendor:** `02-dong-bo-nhom-chat-vendor.md` — một trong các việc nền mà "Đồng bộ ngay" kích hoạt.
- **#3 Đồng bộ tin nhắn gần thực:** `03-dong-bo-tin-nhan-gan-thuc.md` — việc nền kéo tin real-time.
- **#4 Đồng bộ lịch sử chat:** `04-dong-bo-lich-su-chat.md` — việc nền kéo lịch sử tin nhắn cũ.

### ⚠️ Q&A cần BA / PO làm rõ

1. **Ngưỡng "file video lớn" cố định 300MB hay cấu hình được?**
   - Phương án A: Cố định 300MB theo scope hiện tại.
   - Phương án B: Cho Admin cấu hình ngưỡng (ví dụ ở phần cài đặt hệ thống).
   - **Pilot hiện đang theo:** A — cố định 300MB (theo `scope-and-features.md § F.21`). Cần BA/PO xác nhận có cần cấu hình động không.

2. **Khi lần đồng bộ kết thúc với kết quả "Lỗi", báo cáo tóm tắt (stats grid) cập nhật một phần hay giữ nguyên số cũ?**
   - Phương án A: Giữ nguyên stats của lần thành công gần nhất; chỉ entry lịch sử ghi "Lỗi".
   - Phương án B: Cập nhật stats theo phần dữ liệu đã kéo được trước khi lỗi.
   - **Pilot hiện đang theo:** chưa quyết. Nguồn chưa mô tả hành vi stats khi sync lỗi giữa chừng — cần BA/PO làm rõ.

3. **Phạm vi đồng bộ thủ công là toàn bộ lịch sử hay chỉ phần tăng thêm (incremental) kể từ lần sync trước?**
   - Phương án A: Mỗi lần "Đồng bộ ngay" kéo phần tăng thêm kể từ lần trước.
   - Phương án B: Kéo lại toàn bộ (full re-sync).
   - **Pilot hiện đang theo:** chưa quyết. Nguồn mô tả "kéo về đầy đủ danh sách nhóm chat và lịch sử tin nhắn cũ" nhưng không nói rõ incremental vs full — cần BA/PO xác nhận để DEV thiết kế đúng.
