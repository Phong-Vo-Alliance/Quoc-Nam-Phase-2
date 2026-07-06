# Tư vấn tổng thể — Bức tranh toàn cảnh cho Công ty A

> **Ngày lập**: 2026-06-14
> **Tài liệu liên quan**: [company-a-digital-strategy-synthesis.md](./company-a-digital-strategy-synthesis.md) · [mvp-integration-hub-plan.md](./mvp-integration-hub-plan.md)

---

## Mục lục

- [I. Công ty A đang nghĩ gì — và sai ở đâu](#i-công-ty-a-đang-nghĩ-gì--và-sai-ở-đâu)
- [II. Thứ tự đúng](#ii-thứ-tự-đúng)
- [III. Tầng 1 — Chủ quyền & Backup (chi tiết)](#iii-tầng-1--chủ-quyền--backup)
- [IV. Tầng 2 — Integration Hub](#iv-tầng-2--integration-hub)
- [V. Tầng 3 — Data Platform / CDP](#v-tầng-3--data-platform--cdp)
- [VI. Tóm tắt 1 trang](#vi-tóm-tắt-1-trang)

---

## I. Công ty A đang nghĩ gì — và sai ở đâu

**Suy nghĩ hiện tại của Công ty A:**

```
DB phân tán → Gộp DB về 1 chỗ → Xây CDP → Xây Integration Hub
```

**Sai ở bước đầu tiên, và sai thứ tự.**

### 3 nhầm lẫn cốt lõi

**Nhầm lẫn 1 — "Gộp DB = kiểm soát dữ liệu"**

Thực tế: Kiểm soát dữ liệu = **quyền hợp đồng + backup độc lập + schema ownership**, không phải địa điểm vật lý của DB.

Gộp DB về 1 server → tạo ra 1 điểm sập mới, cộng thêm cuộc chiến chính trị với 3 vendor. Chi phí cao, rủi ro cao hơn, không giải quyết vấn đề gốc.

---

**Nhầm lẫn 2 — Trộn 2 hệ thống khác nhau thành 1**

| Công ty A đang gọi | Thực ra là 2 thứ khác nhau |
|---|---|
| "CDP / tập trung dữ liệu" | **Integration Hub** — giải quyết các vendor nói chuyện với nhau |
| "CDP / AI / báo cáo thông minh" | **Data Platform** — phân tích, BI, AI |

Hai cái này có mục đích khác nhau, chi phí khác nhau, và phải làm **theo thứ tự**. Không thể làm song song hoặc đảo ngược.

---

**Nhầm lẫn 3 — Muốn làm Data Platform trước khi có data sạch**

Data Platform cần dữ liệu từ các vendor chảy vào ổn định, chuẩn hóa, không bị mất. Nếu Integration Hub chưa có → Data Platform nhận data bẩn, không đầy đủ → báo cáo/AI sai → mất tiền, mất niềm tin.

---

## II. Thứ tự đúng

```
[Ngay bây giờ]   Tầng 1 — Chủ quyền & Backup          (~2-3 tháng)
                  ↓
[Tháng 3-5]      Tầng 2 — Integration Hub MVP          (~2 tháng MVP)
                  ↓  (nếu MVP thành công)
                  Tầng 2 — Integration Hub Production   (~6-9 tháng)
                  ↓
[Tháng 12+]      Tầng 3 — Data Platform / CDP
```

> **Không thể đảo thứ tự. Mỗi tầng là nền cho tầng sau.**

---

## III. Tầng 1 — Chủ quyền & Backup

> **Mục tiêu**: Công ty A biết mình đang có gì, giữ được gì nếu vendor biến mất.
> **Thời gian**: 2–3 tháng
> **Chi phí**: ~110–160M VND (chủ yếu là backup server phần cứng, chi 1 lần)

---

### Tại sao Tầng 1 phải làm trước?

Hiện tại Công ty A đang trong tình huống:

- **DEV-C (HRM + Kế toán)** = hộp đen hoàn toàn. Không biết server ở đâu, ai giữ data lương/công nợ/sổ sách của công ty.
- **DEV-B (Chat)** = thuê server của Công ty A nhưng Công ty A không biết server đó đang chạy gì.
- **DEV-A (CRM/POS)** = biết nhiều nhất, nhưng backup vẫn do vendor giữ.

Nếu bất kỳ vendor nào dừng hợp tác hoặc biến mất ngày mai → Công ty A không có cách nào lấy lại data của chính mình. Đây là rủi ro kinh doanh nghiêm trọng, không phải rủi ro IT.

---

### 5 bước lớn của Tầng 1

---

#### Bước 1 — Audit toàn diện 3 vendor *(Tuần 1–3)*

> **Bản chất**: Công ty A chính thức yêu cầu mọi vendor cung cấp thông tin hạ tầng họ đang quản lý thay mặt Công ty A.

**Thông tin cần thu thập từ mỗi vendor:**

| Hạng mục | Lý do cần |
|---|---|
| Sơ đồ kiến trúc hệ thống | Biết mình đang có gì |
| Danh sách server (địa điểm / spec / OS) | Biết tài sản ở đâu |
| Schema database (danh sách bảng, quan hệ) | Cần để backup đúng, sau này dùng cho Integration Hub |
| Danh sách service đang chạy | Biết tắt cái gì khi cần |
| Quy trình backup hiện tại (backup gì, tần suất, lưu ở đâu) | Đánh giá xem backup hiện tại có dùng được không |
| Người liên hệ kỹ thuật (tên + số điện thoại) | Có người gọi khi sự cố lúc 2 giờ sáng |
| License phần mềm đang dùng | Tránh rủi ro pháp lý nếu vendor hết hạn license |

**Đặc biệt với DEV-C**: Đây là trường hợp khẩn cấp nhất. HRM + Kế toán = dữ liệu nhạy cảm nhất công ty. Cần dùng leverage hợp đồng — tạm dừng thanh toán phase tiếp hoặc không gia hạn hợp đồng cho đến khi cung cấp đầy đủ thông tin.

**Người thực hiện**: Account Manager + Legal của Công ty A. Senior IT chỉ cần tham gia để review tài liệu nhận về có đúng không.

---

#### Bước 2 — Bổ sung điều khoản hợp đồng *(Tuần 2–5, song song với Bước 1)*

> **Bản chất**: Đưa các quyền lợi của Công ty A vào văn bản pháp lý. Không có hợp đồng = không có quyền.

**Các điều khoản cần bổ sung (dạng phụ lục):**

| Điều khoản | Nội dung cụ thể |
|---|---|
| **SLA backup** | Backup hàng ngày, lưu tối thiểu 30 ngày, RPO ≤ 24h, RTO ≤ 8h |
| **Quyền export định kỳ** | Công ty A có quyền nhận bản export DB toàn bộ mỗi tháng, định dạng chuẩn (SQL/CSV) |
| **Quyền audit** | Có quyền kiểm tra hạ tầng mỗi năm hoặc khi có nghi ngờ |
| **Exit clause** | Khi kết thúc hợp đồng: vendor bàn giao đầy đủ data + tài liệu trong 30 ngày, không được xóa dữ liệu |
| **Không dùng server cho mục đích khác** | Server Công ty A thuê chỉ được dùng cho Công ty A (nhắm DEV-B) |
| **Cam kết restore test** | Vendor hỗ trợ test restore mỗi quý — restore thất bại = vi phạm SLA |

**Người thực hiện**: Legal + Ban lãnh đạo Công ty A đàm phán và ký. Senior IT tư vấn nội dung kỹ thuật của điều khoản.

---

#### Bước 3 — Xây dựng hạ tầng backup độc lập *(Tuần 4–8)*

> **Bản chất**: Công ty A tự sở hữu và quản lý 1 bản copy dữ liệu của mình, không phụ thuộc vendor.

**Cần đầu tư:**

| Hạng mục | Spec | Chi phí |
|---|---|---|
| **Backup server** (mua 1 lần) | 8-16 nhân / 32-64GB RAM / 8-16TB HDD (lưu trữ) + 1TB SSD (restore nhanh) | 80-120M VND |
| **Cloud cold storage** (backup off-site) | BackBlaze B2 / Wasabi (~$7/TB/tháng) | 500k-1M/tháng |
| **Phần mềm backup** | Veeam Community / Restic / Proxmox Backup Server | Free - 10M VND |

**Áp dụng nguyên tắc 3-2-1:**
- **3** bản copy dữ liệu
- **2** loại media (server on-prem + cloud)
- **1** bản off-site (cloud cold storage)

**Thứ tự triển khai backup theo vendor (dễ → khó):**
1. DEV-A trước — đã có FCI Cloud, dễ export nhất
2. DEV-B tiếp theo — server đang ở văn phòng Công ty A, truy cập thuận tiện
3. DEV-C cuối — chờ sau khi Bước 1 (audit) hoàn tất và có đủ thông tin

**Người thực hiện**: Senior IT (technical setup). Procurement do Công ty A.

---

#### Bước 4 — Setup monitoring cơ bản *(Tuần 6–9)*

> **Bản chất**: Biết ngay khi có sự cố, không chờ vendor báo hoặc người dùng phản ánh.

**Cần monitor:**

| Đối tượng | Cảnh báo khi |
|---|---|
| Uptime 3 server chính | Server không phản hồi > 2 phút |
| Backup jobs | Job backup thất bại hoặc không chạy theo lịch |
| Disk space backup server | Dung lượng còn < 20% |
| Disk space production servers | Dung lượng còn < 15% |

**Công cụ**: Uptime Kuma (free, open source) hoặc Grafana Cloud free tier. Alert qua Telegram group nội bộ IT.

**Chi phí**: Gần như miễn phí. Cài trên backup server hoặc 1 VM nhỏ.

**Người thực hiện**: Senior IT.

---

#### Bước 5 — Test restore lần đầu + viết Runbook *(Tuần 10–12)*

> **Bản chất**: Backup chưa được restore thử = backup chưa tồn tại. Bước này biến "cảm giác an toàn" thành "an toàn thật sự".

**Quy trình test restore:**
1. Lấy bản backup mới nhất của từng hệ thống
2. Restore vào staging VM (chia từ backup server, không cần mua thêm)
3. Verify: data đầy đủ không? Login được không? Flow chính chạy được không?
4. Đo thời gian restore thực tế (RTO thực tế)
5. Ghi kết quả vào Runbook — nếu fail → escalate vendor theo điều khoản đã ký ở Bước 2

**Runbook** cần có:
- Danh sách liên lạc khẩn cấp (IT nội bộ + đầu mối mỗi vendor)
- Quy trình xử lý từng loại sự cố (server sập, backup fail, vendor không phản hồi)
- Kết quả test restore lần trước (benchmark so sánh)

**Người thực hiện**: Senior IT viết, IT nội bộ Công ty A cùng tham gia để sau này tự vận hành được.

---

### Có nên thuê senior cho Tầng 1 không?

**Câu trả lời ngắn: Thuê — nhưng không cần full-time, và nên chọn thời điểm thông minh.**

#### Phân tích khối lượng công việc Tầng 1

| Loại việc | Tỷ lệ | Ai làm |
|---|---|---|
| Governance, hợp đồng, đàm phán vendor | ~50% | Account Manager + Legal Công ty A |
| Kỹ thuật: backup setup, monitoring, test restore | ~35% | Senior IT |
| Documentation, runbook | ~15% | Senior IT + IT nội bộ |

→ Phần việc cần senior thực sự chỉ chiếm ~35-50% tổng Tầng 1. Full-time senior suốt 3 tháng = lãng phí.

---

#### 2 lựa chọn thực tế

**Lựa chọn A — Thuê IT Specialist riêng cho Tầng 1** *(nếu chưa quyết định về Tầng 2)*

- Thuê 1 sysadmin/IT specialist kinh nghiệm: 15-25M VND/tháng × 2-3 tháng
- Senior consultant tư vấn vài buổi (không full-time): 5-10M VND
- **Tổng nhân sự Tầng 1**: 35-85M VND
- **Phù hợp khi**: Công ty A muốn làm từng bước, chưa cam kết Tầng 2

**Lựa chọn B — Thuê senior sớm 1 tháng trước MVP** *(khuyến nghị nếu đã quyết định làm Tầng 2)*

- Hire senior full-time 1 tháng trước khi bắt đầu MVP Sprint 1
- Tháng đó: làm Bước 3 + 4 + 5 của Tầng 1 (technical parts)
- Bước 1 + 2 (governance/hợp đồng) chạy song song do Công ty A tự xử
- Sau đó senior seamlessly chuyển sang MVP Sprint 1 — họ đã có đầy đủ context về hạ tầng

| | Lựa chọn A | Lựa chọn B |
|---|---|---|
| Chi phí nhân sự Tầng 1 | 35-85M | Tích hợp vào MVP budget (~50-70M, 1 tháng senior) |
| Senior hiểu hạ tầng trước khi xây hub | Không | **Có** — lợi thế lớn cho chất lượng kỹ thuật Tầng 2 |
| Rủi ro | Phải onboard người mới lại khi qua Tầng 2 | Senior cam kết cả 3-4 tháng liên tục |
| Phù hợp khi | Chưa chắc chắn về Tầng 2 | **Đã quyết định làm Tầng 2** |

> **Khuyến nghị**: Nếu Công ty A đã quyết định đi đến Tầng 2 (Integration Hub MVP), chọn **Lựa chọn B**. Hire senior 1 tháng sớm hơn để làm Tầng 1 technical — tổng chi phí không tăng nhiều nhưng chất lượng và tốc độ Tầng 2 sẽ tốt hơn đáng kể vì senior đã biết toàn bộ hạ tầng.

---

### Timeline Tầng 1

```
Tuần 1-2   Gửi yêu cầu audit đến 3 vendor · Dùng leverage với DEV-C
Tuần 2-5   Đàm phán phụ lục hợp đồng (song song) · Review tài liệu vendor gửi về
Tuần 4-6   Mua backup server · Setup phần mềm backup
Tuần 6-8   Backup pipeline DEV-A (trước) → DEV-B → DEV-C
Tuần 6-9   Setup Uptime Kuma monitoring + Telegram alert
Tuần 10-12 Test restore lần đầu · Viết runbook · Bàn giao cho IT nội bộ
           ─────────────────────────────────────────────────
           [Nếu chọn Lựa chọn B]: Senior onboard Tuần 8 → Tầng 2 Sprint 1 bắt đầu Tuần 12
```

---

### Chi phí Tầng 1

| Hạng mục | Chi phí | Loại |
|---|---|---|
| Backup server phần cứng | 80-120M VND | Một lần |
| Cloud cold storage | 500k-1M VND/tháng | Hàng tháng |
| Phần mềm backup | 0-10M VND | Một lần |
| Nhân sự (Lựa chọn A) | 35-85M VND | 2-3 tháng |
| Nhân sự (Lựa chọn B — tích hợp vào MVP) | 50-70M VND | 1 tháng senior |
| **Tổng Tầng 1 (Lựa chọn A)** | **~115-215M VND** | |
| **Tổng Tầng 1 (Lựa chọn B)** | **~130-200M VND** | (+ tiết kiệm được ở Tầng 2) |

> **Lưu ý**: ~80-120M chi cho backup server là tài sản Công ty A sở hữu lâu dài. Không phải chi phí vận hành hàng tháng.

---

## IV. Tầng 2 — Integration Hub

> Xem chi tiết tại: [mvp-integration-hub-plan.md](./mvp-integration-hub-plan.md)

**Tóm tắt**: Xây trung tâm trung chuyển sự kiện giữa các vendor. Thay vì vendor gọi trực tiếp vào nhau, tất cả "đăng thông báo" lên 1 bảng tin chung. Ai cần thì tự đọc.

- **MVP**: 8 tuần, 130-180M VND — chứng minh pattern hoạt động
- **Full production**: 6-9 tháng tiếp theo sau MVP thành công

---

## V. Tầng 3 — Data Platform / CDP

> Xem chi tiết tại: [centralized-data-platform-consultation.md](./centralized-data-platform-consultation.md)

**Điều kiện bắt buộc**: Tầng 2 phải đang chạy ổn định tối thiểu 3-6 tháng trước khi bắt đầu Tầng 3.

**Lý do**: Data Platform cần data sạch, chuẩn hóa từ Integration Hub. Làm trước = lãng phí.

---

## VI. Tóm tắt 1 trang

| | Công ty A đang nghĩ | Thực tế đúng |
|---|---|---|
| **Bước đầu** | Gộp DB về 1 chỗ | Lấy lại chủ quyền qua hợp đồng + backup độc lập |
| **Bước giữa** | Xây CDP | Xây Integration Hub (EDA) — giải quyết vendor sync |
| **Bước cuối** | Xây Integration Hub | Xây Data Platform — sau khi có data sạch |
| **Chi phí gộp DB** | Cao, nhiều rủi ro | Không cần làm, sai hướng |
| **Rủi ro lớn nhất hiện tại** | | DEV-C là hộp đen — HRM + Kế toán không ai biết ở đâu |
| **Đầu tư thấp nhất để có giá trị ngay** | | Governance + hợp đồng (gần free) + backup server 100M |

---

### Câu duy nhất cần nhớ

> **Công ty A không thiếu server lớn hay nền tảng AI. Công ty A thiếu chủ quyền với dữ liệu của chính mình — và giải quyết cái đó không cần tốn nhiều tiền, chỉ cần đúng thứ tự.**

---

*Tài liệu này là tư vấn tổng quan. Để xem kế hoạch chi tiết từng tầng: [infrastructure-multi-vendor-analysis.md](./infrastructure-multi-vendor-analysis.md) · [inter-vendor-data-sync-patterns.md](./inter-vendor-data-sync-patterns.md) · [mvp-integration-hub-plan.md](./mvp-integration-hub-plan.md)*
