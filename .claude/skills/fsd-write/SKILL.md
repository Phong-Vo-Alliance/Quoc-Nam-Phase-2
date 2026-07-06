---
name: fsd-write
description: "Viết hoặc cập nhật một tài liệu FSD (Functional Specification Document) cho Phase 2 dự án Quoc-Nam theo layout 7-section chuẩn — Gherkin tiếng Việt + Mermaid + UI structured text. Dùng khi cần convert FSD cũ sang format mới, hoặc reverse-engineer từ source code thành FSD."
---

# Skill: Viết FSD theo layout 7-section chuẩn (Phase 2)

## Khi nào dùng skill này

- Người dùng yêu cầu **viết FSD mới** cho một feature.
- Người dùng yêu cầu **convert** đoạn nội dung từ `FSD-Admin-Site.md` hoặc `FSD-Chat-Portal.md` sang layout mới.
- Người dùng yêu cầu **reverse-engineer**: đọc source code đã implement → suy ra FSD.
- Người dùng yêu cầu **update** một file FSD đã viết theo layout này.

## Đối tượng đọc & ưu tiên

1. **PO (không biết kỹ thuật)** — đọc lướt vẫn hiểu được nghiệp vụ
2. **DEV con người + AI agent** — đọc kỹ để implement chính xác, không tự đoán hướng mới
3. BA dùng để rà soát + làm mockup; QC dùng để test

> **Quan trọng:** KHÔNG mention "AI agent / Claude Code" trong file FSD chính thức. Mục tiêu đó chỉ tồn tại trong skill này.

## Vị trí file

Mỗi feature = **1 file Markdown** đặt tại:

```
docs/phase2/fsd/<##>-<slug-tieng-viet-khong-dau>.md
```

Trong đó:

- `<##>` là số feature trong `docs/phase2/scope-and-features.md`. Sub-feature dùng suffix chữ thường: `29a`, `29b`, ...
- `<slug>` là tên tính năng viết liền dấu gạch nối, **không dấu** (ví dụ `29-trang-yeu-cau-xem-sdt`).
- Cross-cutting (không thuộc feature số nào) đặt vào `docs/phase2/fsd/shared/`.

`docs/phase2/fsd/README.md` là **index** liệt kê toàn bộ file con + status (draft / reviewed / approved).

## Layout 7-section cố định

Mỗi file FSD **bắt buộc** đầy đủ 7 section dưới đây, theo đúng thứ tự, đúng emoji:

```markdown
# #<##> — <Tên tính năng>

> **Trạng thái:** draft | reviewed | approved
> **Nguồn:** scope-and-features.md § <X.Y> · <file/section khác nếu có>

---

## 📌 Tóm tắt 1 dòng

<1 câu cho PO scan ngay — what + ai làm + để làm gì>

---

## 🎯 Giá trị nghiệp vụ

<2–4 đoạn narrative — vấn đề thực tế đang gặp + giải pháp tính năng này mang lại + lợi ích đo đếm được>

**Lợi ích:**

- <Lợi ích 1>
- <Lợi ích 2>

---

## 👥 Vai trò liên quan

| Vai trò | Trách nhiệm |
| ------- | ----------- |
| **Staff / Admin / Vendor / Hệ thống** | <mô tả ngắn> |

---

## 🔄 Dòng chảy nghiệp vụ

<1–2 Mermaid diagram TỐI ĐA. Chọn loại phù hợp nhất:>
<- stateDiagram-v2 → state machine (pending/approved/...)>
<- sequenceDiagram → handoff đa-actor (Staff → System → Admin)>
<- flowchart → rẽ nhánh điều kiện tuyến tính>

\`\`\`mermaid
<diagram code>
\`\`\`

---

## ✅ Kịch bản chấp nhận

<Gherkin tiếng Việt với keyword chuẩn:>
<Tính năng / Bối cảnh / Tình huống / Khung tình huống / Biết / Khi / Thì / Và / Nhưng / Dữ liệu>

\`\`\`gherkin
# language: vi
Tính năng: <Câu mô tả ngắn, hành động chính>

  Bối cảnh:
    Biết <điều kiện luôn đúng cho mọi tình huống>

  # ===== Nhóm tình huống 1 =====

  Tình huống: <Câu mô tả hành vi cụ thể>
    Biết <state>
    Khi <hành động>
    Thì <kết quả mong đợi>
    Và <kết quả phụ>

  # ===== Khung tình huống (table data) =====

  Khung tình huống: <Pattern lặp lại với data khác nhau>
    Khi người dùng nhấn "<nút>"
    Thì hệ thống thực hiện "<hành động>"

    Dữ liệu:
      | nút     | hành động           |
      | Duyệt   | đổi trạng thái sang approved |
      | Từ chối | đổi trạng thái sang denied   |
\`\`\`

---

## 🎨 Mô tả giao diện

<Giữ format hiện tại — tables, bullet, ASCII layout, mockup ref. KHÔNG ép sang Gherkin/Mermaid.>

### Cấu trúc trang

\`\`\`
<ASCII sketch nhanh để PO hình dung layout>
\`\`\`

### <Tabs / Bảng / Modal>

| Cột | Nội dung | Ghi chú |
| --- | -------- | ------- |

### Mockup tham chiếu

> ✅ **Đã có:** <mô tả ảnh demo đã capture được>
> ⏳ **Cần BA bổ sung:** <list mockup còn thiếu>

---

## 🔗 Tham chiếu & Q&A

### Liên quan các phần khác

- **<Tên feature liên quan>**: `<file>.md § <X.Y>`

### ⚠️ Q&A cần BA / PO làm rõ

<Mỗi câu hỏi 1 bullet. Nêu rõ:>
<- Tại sao là ambiguous / có 2 cách hiểu>
<- Nếu pilot/hiện tại chọn 1 phương án → ghi rõ chọn phương án nào>
<- Đừng đoán bừa — flag rõ ràng>

1. **<Câu hỏi>?**
   - Phương án A: <...>
   - Phương án B: <...>
   - **Pilot hiện đang theo:** <A / B / chưa quyết>. Cần BA/PO xác nhận.
```

## Quy tắc viết — KHÔNG được vi phạm

### Ngôn ngữ & văn phong

- **Tiếng Việt** xuyên suốt; tránh thuật ngữ Anh không cần thiết. Giữ nguyên: tên class CSS, tên API, tên file source code.
- Gherkin dùng **keyword tiếng Việt chuẩn** (`# language: vi`): `Tính năng / Bối cảnh / Tình huống / Khung tình huống / Biết / Khi / Thì / Và / Nhưng / Dữ liệu`.
- KHÔNG dùng từ "AI agent", "Claude Code", "LLM" trong file FSD.
- KHÔNG dùng các tham chiếu mơ hồ "hệ thống tự lo", "sẽ implement sau" — luôn nói rõ ai làm gì.

### Mức độ kỹ thuật

- KHÔNG include API endpoint name, DB schema, state field internal (ví dụ `phoneFingerprint`, `processedAt`) trong các section dành cho PO (`📌`, `🎯`, `👥`, `🔄`, `🎨`).
- Trong `✅ Kịch bản chấp nhận` có thể dùng tên trạng thái (`pending / approved / denied / revoked`) nhưng phải kèm tên hiển thị tiếng Việt khi xuất hiện lần đầu.
- KHÔNG vẽ class diagram, ER diagram, deployment diagram.

### Mermaid

- **Tối đa 2 diagram / feature**, ưu tiên 1.
- Chọn đúng loại:
  - `stateDiagram-v2` cho state machine có ≥ 3 trạng thái.
  - `sequenceDiagram` cho handoff giữa ≥ 2 actor.
  - `flowchart LR` cho nhánh điều kiện tuyến tính.
- KHÔNG dùng tiếng Việt có dấu trong node id (chỉ trong label). Label dài → ngắt dòng bằng `<br/>`.
- Note (`note right of ...`) chỉ dùng khi cần làm rõ side-effect (ví dụ "Staff thấy spinner"). Không lạm dụng.

### Gherkin

- **Mỗi `Tình huống` chỉ kiểm tra 1 hành vi.** Tránh `Tình huống` dài hơn 10 dòng.
- Dùng `Khung tình huống` + `Dữ liệu` cho các pattern lặp với data khác nhau (badge, filter tab, terminal state, …).
- `Biết` mô tả tiền điều kiện, `Khi` mô tả 1 hành động duy nhất, `Thì` mô tả kết quả quan sát được trên UI hoặc dữ liệu.
- KHÔNG ghi step `Khi` chứa nhiều hành động (`Khi Admin nhấn X và sau đó nhấn Y` → tách 2 tình huống).
- Cover **cả happy path lẫn edge case**: empty state, lỗi mạng, dữ liệu khuyết, vai trò không có quyền.

### Q&A & Conflict

- Khi 2 tài liệu nguồn (Admin Site vs Chat Portal vs scope-and-features) **mâu thuẫn**: KHÔNG tự chọn 1 bên. Flag rõ trong Q&A với cả 2 phương án + reference tới từng file/section.
- Khi spec mơ hồ ("TBD theo BA"): flag Q&A, ghi rõ phương án pilot tạm chọn.
- KHÔNG xoá Q&A đã flag khi cập nhật file — chỉ chuyển sang trạng thái "✅ Đã chốt (ngày YYYY-MM-DD): <kết luận>" khi có quyết định từ BA/PO.

## ⚡ Quy trình bắt buộc — KHÔNG được bỏ qua (chống timeout)

> **Lý do tồn tại:** `FSD-Chat-Portal.md` (~1500+ dòng / ~120KB), `scope-and-features.md` (~680 dòng), `FSD-Admin-Site.md` (~900 dòng) đều rất lớn. Nếu `Read` nguyên file → context phình to → cộng với việc `Write` cả file output trong 1 lượt → **timeout**. Đây là nguyên nhân #1 khiến skill chạy thất bại. Phải tuân thủ 2 kỷ luật dưới đây.

### 1. Đọc nguồn: LOCATE rồi mới SLICE — cấm đọc nguyên file

KHÔNG bao giờ `Read` nguyên file nguồn lớn. Luôn theo 3 bước:

1. **LOCATE** — dùng `Grep` (output_mode `content`, có `-n`) để tìm số dòng của section liên quan. Mẫu tìm:
   - Trong `scope-and-features.md`: `#### #<##>` hoặc `### <Chữ cái>\.` (ví dụ `#### #18`).
   - Trong `FSD-Chat-Portal.md` / `FSD-Admin-Site.md`: `### .*#<##>` hoặc heading mục (ví dụ `### 6.2 #18`).
   - Tìm thêm các cross-cutting reference: `grep -n "#<##>"` để bắt các đoạn overview (ví dụ `### 6.1 ... cross-cutting #18, #19`).
2. **SLICE** — chỉ `Read` đúng khoảng dòng tìm được (dùng `offset` + `limit`, thường 30–90 dòng/đoạn). Mỗi feature thường chỉ cần 2–4 slice.
3. **STOP** — khi đã có đủ Mục tiêu / Business Flow / FR / Edge case / Mockup cho feature đó thì dừng đọc. Không đọc "phòng xa".

> Một feature điển hình có nguồn thật chỉ ~100–200 dòng dù file chứa nó 1500 dòng. Nếu thấy mình sắp `Read` > 200 dòng từ 1 file nguồn, gần như chắc chắn đang làm sai — quay lại Grep.

### 2. Xuất file: SKELETON rồi BỒI từng section — không Write 1 phát cả file lớn

File output 7-section thường ~250–380 dòng / ~17–27KB. Viết hết trong 1 `Write` cộng với context nguồn đã nạp dễ vượt ngưỡng. Chiến lược an toàn:

1. **Write skeleton** — tạo file với đủ 7 heading + frontmatter trạng thái + section `📌`, `🎯`, `👥` (các phần ngắn, dễ).
2. **Edit bồi từng section nặng** — lần lượt `Edit` thêm nội dung cho `🔄 Mermaid`, `✅ Gherkin`, `🎨 Giao diện`, `🔗 Q&A`. Mỗi Edit là 1 section, không gộp.
3. Nhờ vậy mỗi tool call giữ payload nhỏ, không bao giờ phải sinh ~25KB trong một lượt inference.

> Nếu feature đặc biệt lớn (nhiều FR + nhiều edge case), tách Gherkin thành nhiều Edit nối tiếp (nhóm tình huống 1 → Edit, nhóm 2 → Edit).

---

## 2 Mode hoạt động

### Mode A — Convert từ FSD cũ

Khi người dùng yêu cầu *"convert #XX sang format mới"*:

1. **LOCATE + SLICE nguồn** (theo Quy trình bắt buộc ở trên): Grep tìm số dòng `#### #XX` trong `scope-and-features.md` (canonical) + `### .*#XX` / heading mục trong `FSD-Admin-Site.md` và `FSD-Chat-Portal.md`, rồi chỉ Read đúng các slice đó. **Cấm Read nguyên file.**
2. **So sánh các slice nguồn**. Nếu có conflict, ghi nhớ để flag trong Q&A.
3. **Map nội dung cũ → 7 section mới**:
   - "Mục tiêu" / "Mô tả" → 🎯 Giá trị nghiệp vụ
   - "Business Flow" / "Workflow" → 🔄 Dòng chảy + 🎯 (nếu ngắn)
   - "FR-XX" → ✅ Kịch bản chấp nhận (mỗi FR ≥ 1 Tình huống)
   - "UI" / "Mockup" → 🎨 Mô tả giao diện
   - "Edge cases" → ✅ Kịch bản chấp nhận (cuối, section comment `# Trường hợp đặc biệt`)
4. **Tách feature** nếu phát hiện ≥ 2 UI surface (ví dụ #28 Staff side + #28a Admin inline) → đề xuất tách file, hỏi user trước khi tạo.

### Mode B — Reverse-engineer từ source code

Khi người dùng yêu cầu *"viết FSD cho code tại `<đường dẫn>`"* (feature đã implement nhưng chưa có FSD):

1. **Scan thư mục** + `package.json` để hiểu công nghệ.
2. **Tìm entrypoint UI**: component chính (`*Page.tsx`, route definition).
3. **Trace state machine / business rule**:
   - Tìm các `useState`, `useReducer`, `enum`, `status: 'pending' | ...` → 🔄 state diagram.
   - Tìm `handleClick`, `onSubmit`, mutation calls → ✅ Kịch bản chấp nhận.
   - Tìm conditional render (`{user.role === 'admin' && ...}`) → 👥 Vai trò liên quan + 🎨 mô tả giao diện.
4. **Đọc test files** nếu có → bổ sung edge case vào Gherkin.
5. **Capture UI**: nếu có Storybook hoặc demo route, ghi vào 🎨 "Mockup tham chiếu — đã có".
6. **Q&A bắt buộc**: vì code không phải spec, mọi suy luận về *ý đồ* (vs *hành vi hiện tại*) phải flag Q&A để PO xác nhận.

> **Cảnh báo:** code có thể implement sai vs spec. Khi reverse-engineer, mô tả là *"hệ thống hiện đang…"* chứ không phải *"hệ thống phải…"*. Khi có scope doc, ưu tiên scope doc — nếu code khác scope, flag Q&A.

## Checklist trước khi nộp file FSD

Trước khi báo "đã xong", **tự đối chiếu**:

- [ ] **Đọc nguồn bằng Grep-locate → Read-slice, KHÔNG Read nguyên file lớn** (chống timeout)
- [ ] **Xuất file bằng Write skeleton → Edit từng section, KHÔNG Write cả file ~25KB trong 1 lượt** (chống timeout)
- [ ] Đầy đủ 7 section đúng thứ tự, đúng emoji
- [ ] Tóm tắt 1 dòng đúng 1 câu, có cả "ai làm + làm gì + để làm gì"
- [ ] Mermaid render được (test mentally: id node hợp lệ, không thừa dấu phẩy)
- [ ] Gherkin có `# language: vi` ở dòng đầu
- [ ] Mỗi FR trong nguồn cũ đã map ≥ 1 Tình huống
- [ ] Có ≥ 1 Tình huống edge case (empty / lỗi / vai trò sai)
- [ ] Q&A đã flag tất cả conflict + TBD; không tự chọn bừa
- [ ] Không nhắc "AI agent / Claude Code / LLM"
- [ ] Tên file đúng pattern `<##>-<slug>.md` và đã thêm vào `docs/phase2/fsd/README.md`

## Hướng dẫn sử dụng cho người dùng

### Convert một feature

```
Hãy convert #XX sang format mới
```

Tôi sẽ:

1. Đọc nguồn từ scope-and-features + FSD cũ
2. Đề xuất tên file + cảnh báo nếu cần tách thành sub-feature
3. Viết file mới
4. Cập nhật README.md index

### Reverse-engineer từ source

```
Viết FSD cho code tại src/features/<đường-dẫn>, đặt số là #YY
```

Tôi sẽ:

1. Scan thư mục
2. Hỏi xác nhận tên feature + scope trước khi viết
3. Viết FSD đánh dấu rõ phần nào suy luận từ code (cần PO confirm)

### Update một file đã viết

```
Update FSD #XX: <yêu cầu cụ thể>
```

Tôi sẽ chỉ chỉnh phần liên quan, giữ nguyên Q&A cũ trừ khi yêu cầu xoá/chốt.
