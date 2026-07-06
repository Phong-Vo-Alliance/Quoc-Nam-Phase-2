# Tổng hợp Tư vấn Chiến lược Hạ tầng & Dữ liệu — Công ty A

> **Ngày tổng hợp**: 2026-06-14
> **Phiên bản**: 1.0
> **Tài liệu gốc**:
> - [infrastructure-multi-vendor-analysis.md](./infrastructure-multi-vendor-analysis.md)
> - [centralized-data-platform-consultation.md](./centralized-data-platform-consultation.md)
> - [inter-vendor-data-sync-patterns.md](./inter-vendor-data-sync-patterns.md)

---

## Mục lục

- [Executive Summary](#executive-summary)
- [1. Hiện trạng & Rủi ro](#1-hiện-trạng--rủi-ro)
- [2. 3 Vấn đề cốt lõi cần giải quyết theo thứ tự](#2-3-vấn-đề-cốt-lõi-cần-giải-quyết-theo-thứ-tự)
- [3. Giải pháp — Tầng hạ tầng & Backup](#3-giải-pháp--tầng-hạ-tầng--backup)
- [4. Giải pháp — Integration Hub (Event-Driven Architecture)](#4-giải-pháp--integration-hub-event-driven-architecture)
- [5. Giải pháp — Data Platform & AI (giai đoạn sau)](#5-giải-pháp--data-platform--ai-giai-đoạn-sau)
- [6. Chi phí & Nhân sự](#6-chi-phí--nhân-sự)
- [7. Lộ trình tổng thể 24 tháng](#7-lộ-trình-tổng-thể-24-tháng)
- [8. Quyết định & Điều khoản hợp đồng vendor](#8-quyết-định--điều-khoản-hợp-đồng-vendor)
- [Bottom line](#bottom-line)

---

## Executive Summary

Công ty A đang vận hành 3 hệ thống qua 3 vendor độc lập (DEV-A: CRM/POS/Inventory, DEV-B: Chat internal, DEV-C: HRM/Kế toán). Sau quá trình phân tích, có **3 vấn đề cốt lõi** không phải vấn đề công nghệ — mà là vấn đề **chủ quyền và quản trị**:

| # | Vấn đề | Biểu hiện | Hậu quả |
|---|---|---|---|
| 1 | **Không kiểm soát hạ tầng** | DEV-C là hộp đen, không biết server đâu, backup ra sao | Không restore được khi sự cố |
| 2 | **Backup không thuộc Công ty A** | Vendor sập/tranh chấp hợp đồng → mất quyền truy cập data | Mất toàn bộ dữ liệu kinh doanh |
| 3 | **Vendor giao tiếp sai pattern** | DEV-C ↔ DEV-A: 3+ tháng làm API chưa xong | Scale không được, mỗi tích hợp mới = 3 tháng |

**3 nhóm giải pháp tương ứng**:

1. **Backup Server + Staging** — lấy lại chủ quyền dữ liệu (~100M CapEx, Q1)
2. **Integration Hub (Event Bus)** — chuẩn hóa giao tiếp vendor (~70-90M/tháng OpEx, Q2-Q4)
3. **Data Platform & AI** — khai thác dữ liệu chiến lược (~150M+/tháng, Năm 2+)

> **Câu chốt**: Công ty A không cần "server lớn". Công ty A cần **chủ quyền dữ liệu + governance đúng + pattern đúng**.

---

## 1. Hiện trạng & Rủi ro

### Hạ tầng hiện tại

| Vendor | Hệ thống | Server | Tình trạng |
|---|---|---|---|
| **DEV-A** | CRM, POS, Inventory, Report | Windows Server 8C/24GB/250GB + FCI Cloud DB + Linux Server | Chật chội — sẽ thắt cổ chai khi scale |
| **DEV-B** | Chat ~60 user + Zalo/FB integration | Dell R640/HP Gen10: 2x Xeon Platinum 8163 / 128GB / 2×1TB SSD / 10Gbps | Dư thừa nghiêm trọng — 60 user chỉ cần 4-8C/16GB |
| **DEV-C** | HRM + Kế toán/Tài chính | ❓ Không rõ | **Điểm mù nguy hiểm nhất** |

### Bản đồ rủi ro

| Rủi ro | Mức độ | Hành động cần |
|---|---|---|
| DEV-C không cung cấp thông tin hạ tầng | 🔴 Nghiêm trọng | Yêu cầu ngay, dùng leverage hợp đồng |
| Backup nằm trong tay vendor | 🔴 Nghiêm trọng | Xây backup server độc lập Q1 |
| Vendor lock-in — không có exit clause | 🔴 Nghiêm trọng | Bổ sung vào hợp đồng ngay |
| DEV-A server thiếu tài nguyên | 🟡 Trung bình | Nâng spec sau khi ổn backup |
| DEV-B server quá dư thừa | 🟡 Trung bình | Audit mục đích dùng thật, đàm phán giảm |
| Không có DR cross-system | 🟡 Trung bình | Runbook + staging từ tháng 3 |
| Pattern tích hợp API sai (Request/Response) | 🟡 Trung bình | Chuyển sang EDA từ Q2 |

---

## 2. 3 Vấn đề cốt lõi cần giải quyết theo thứ tự

```
                    ┌─────────────────────────────────────┐
   NGAY BÂY GIỜ    │  1. Hạ tầng & Backup                │
   Q1 2026          │  Lấy lại chủ quyền dữ liệu          │
                    └──────────────┬──────────────────────┘
                                   │ xong rồi mới đến
                    ┌──────────────▼──────────────────────┐
   Q2-Q4 2026       │  2. Integration Hub (Event Bus)      │
                    │  Chuẩn hóa giao tiếp vendor          │
                    └──────────────┬──────────────────────┘
                                   │ xong rồi mới đến
                    ┌──────────────▼──────────────────────┐
   NĂM 2+           │  3. Data Platform & AI              │
                    │  Khai thác dữ liệu chiến lược        │
                    └─────────────────────────────────────┘
```

Không được làm ngược thứ tự. Xây AI platform khi backup còn trong tay vendor = xây lâu đài trên cát.

---

## 3. Giải pháp — Tầng hạ tầng & Backup

### 3.1 Nguyên tắc 3-2-1 Backup

- **3 bản copy** dữ liệu
- **2 loại media** khác nhau (on-prem + cloud)
- **1 bản off-site** (không cùng vật lý với server chính)

### 3.2 Backup Server (do Công ty A sở hữu)

**Spec đề xuất**:
- CPU: 8-16 core
- RAM: 32-64GB
- Storage: 8-20TB HDD (lưu backup) + 1-2TB SSD (restore nhanh)
- Phần mềm: Proxmox Backup Server / Veeam / Restic
- **Chi phí**: ~80-120M VND (one-time CapEx)

Kết hợp với **cloud cold storage** (AWS S3 Glacier / BackBlaze B2 / Wasabi) cho off-site:
- ~1-3M VND/tháng

> KHÔNG dùng backup server này để chạy production workload. Chỉ là backup target.

### 3.3 Staging Environment — Bắt buộc, không phải optional

**Lý do**: Backup chưa được restore thử = backup chưa tồn tại.

| Vấn đề thường gặp | Chỉ phát hiện khi restore thử |
|---|---|
| File backup corrupt giữa quá trình ghi | ✅ |
| Schema migration không tương thích | ✅ |
| Thiếu stored procedures, BLOB files | ✅ |
| Encryption key bị mất | ✅ |
| RTO/RPO thực tế khác xa cam kết vendor | ✅ |

**Minimal viable staging** (bắt đầu ngay):
- 1 VM trên backup server (tách 16GB RAM cho staging)
- Hoặc cloud VM theo giờ — chỉ bật khi test restore
- **Tần suất**: Tối thiểu hàng quý. HRM/Kế toán → hàng tháng.

**Lưu ý bảo mật**: Sau khi test xong phải xóa hoặc anonymize data — staging không được chứa data nhạy cảm thật.

### 3.4 Checklist yêu cầu từ mọi vendor (đưa vào hợp đồng)

- [ ] Sơ đồ kiến trúc hạ tầng
- [ ] Danh sách server (location, spec, OS, IP)
- [ ] Credentials read-only admin cho Công ty A
- [ ] Schema DB toàn bộ
- [ ] Danh sách service đang chạy + port
- [ ] License phần mềm đang dùng
- [ ] SLA backup: tần suất, retention, RTO cam kết
- [ ] Script/quy trình restore documented
- [ ] Exit clause: trong N ngày khi chấm dứt hợp đồng phải bàn giao đầy đủ

> **Với DEV-C**: Dùng leverage hợp lệ — chặn thanh toán phase tiếp / không gia hạn hợp đồng cho đến khi họ cung cấp đủ thông tin. DEV-C giữ HRM + kế toán = dữ liệu nhạy cảm nhất công ty. Không chấp nhận tiếp tục là hộp đen.

---

## 4. Giải pháp — Integration Hub (Event-Driven Architecture)

### 4.1 Tại sao pattern hiện tại sai

Pattern hiện tại: **Request/Response synchronous (REST API pull)**

```
DEV-A ──── HTTP GET "cho tôi xem data kế toán" ────► DEV-C
DEV-A ◄─── Response: 500MB JSON ─────────────────── DEV-C
```

**Hậu quả**:
- Mỗi cặp vendor phải design lại từ đầu: auth, schema, pagination, error handling, retry, monitoring → **2-3 tháng/cặp**
- "Data quá lớn" → đúng vì đang pull toàn bộ snapshot
- End-of-day batch → data cũ 24h, batch fail = mất 1 ngày data
- N vendor = N × (N-1) / 2 tích hợp riêng biệt → không scale được

**Tính toán thực tế**:

| Scenario | Volume/ngày |
|---|---|
| Pull-snapshot toàn bộ mỗi 5 phút | 500MB × 288 lần = **144 GB/ngày** |
| Event/CDC (chỉ delta thay đổi) | ~500 invoice/ngày × 8KB = **~4 MB/ngày** |

→ "Data quá lớn" là **vấn đề giả** — chỉ đúng với pull pattern. Với event/CDC, thực tế nhỏ hơn 36.000 lần.

### 4.2 Pattern đúng: Event-Driven Architecture

**Nguyên lý**: Không vendor nào gọi API của vendor khác.

```
                  📋 EVENT BUS (Kafka)
                ┌─────────────────────┐
                │ dev-c.invoice.v1    │
                │ dev-c.payroll.v1    │
                │ dev-c.employee.v1   │
                │ dev-a.order.v1      │
                │ dev-a.customer.v1   │
                │ dev-b.message.v1    │
                └──────────────────┬─┘
        PUBLISH ▲                  │ SUBSCRIBE
                │                  ▼
     ┌──────────┴──┐   ┌───────────────────────────┐
     │   DEV-C     │   │ DEV-A consumer → local DB  │
     │  (Producer) │   │ DEV-B consumer → local DB  │
     └─────────────┘   │ Future AI → Data Platform  │
                       └───────────────────────────┘

     ┌─────────────────────────────────────────────┐
     │  Schema Registry (Công ty A quản lý, duyệt) │
     └─────────────────────────────────────────────┘
```

**Quy tắc vàng**:
- Vendor có việc xảy ra → **publish event** vào Event Bus (1 lần duy nhất)
- Vendor cần data → **subscribe** topic tương ứng, tự đọc và cache local
- Không ai gọi API trực tiếp của vendor khác
- Schema do **Công ty A duyệt** trước khi publish

### 4.3 Giải thích cho người không kỹ thuật

Tưởng tượng 3 vendor là 3 quán hàng trong khu chợ:

**Cách cũ (sai)**: DEV-A mỗi ngày gõ cửa DEV-C hỏi "Có hóa đơn mới không?" → DEV-C bị làm phiền, từ chối → chỉ cho hỏi 1 lần cuối ngày.

**Cách mới (đúng)**: Công ty A xây **1 bảng tin ở giữa chợ**. DEV-C có hóa đơn mới → dán thông báo lên bảng. DEV-A cần → tự đến đọc bảng. Không ai gõ cửa ai.

| Tình huống | Cách cũ | Cách mới |
|---|---|---|
| DEV-C xuất hóa đơn mới | DEV-A phải hỏi → DEV-C trả lời | DEV-C dán lên bảng → DEV-A tự thấy |
| Vendor mới cần data DEV-C | Đàm phán 3 tháng | Đến đọc bảng → 1-2 tuần |
| DEV-C nghỉ bảo trì | DEV-A lỗi ngay | DEV-A đọc bảng tin đã dán trước |
| Data "quá lớn" | Pull 500MB → từ chối | Chỉ thông báo thay đổi ~4MB |

### 4.4 So sánh timeline

| Tích hợp | Pattern cũ | Pattern EDA |
|---|---|---|
| DEV-C → DEV-A (đầu tiên) | 3+ tháng, chưa xong | **6-7 tuần** |
| DEV-C → DEV-B (tiếp theo) | 3 tháng nữa | **2-3 tuần** (DEV-C đã publish) |
| Vendor mới thứ 4 cần data DEV-C | 3 tháng | **1-2 tuần** (chỉ cần subscribe) |

### 4.5 5 Khối kỹ thuật cốt lõi

#### 1. Event Bus — Kafka (xương sống)

| Tool | Phù hợp | Khuyến nghị |
|---|---|---|
| **Confluent Cloud Kafka** | Volume cao, cần replay, ecosystem mạnh | ✅ Dùng cho năm 1 |
| RabbitMQ | Volume thấp, routing phức tạp | Không khuyên cho use case này |
| NATS JetStream | Latency thấp, ít tài liệu VN | Tham khảo sau năm 2 |

#### 2. Schema Registry — "Luật chơi"

Mọi event phải có schema được **Công ty A duyệt** trước khi publish:

```yaml
# Ví dụ: event dev-c.invoice.created.v1
namespace: com.companya.dev-c.invoice
name: InvoiceCreated
version: 1
fields:
  - name: event_id          # UUID duy nhất mỗi event
    type: string
  - name: event_timestamp   # ISO 8601
    type: string
  - name: invoice_id        # ID trong hệ DEV-C
    type: string
  - name: customer_id       # phải khớp với DEV-A customer_id
    type: string
  - name: amount
    type: decimal
  - name: currency
    type: string
    default: "VND"
  - name: status
    type: enum [DRAFT, ISSUED, PAID, CANCELLED]
```

**Quy tắc schema bắt buộc**:
- Chỉ được **thêm** optional field — không xóa, không đổi type
- Schema version mới phải đọc được data version cũ (backward compatible)
- Vendor đề xuất → Công ty A review → duyệt → mới được code

#### 3. Outbox Pattern — "Không mất event"

Vendor KHÔNG publish thẳng vào Kafka từ app code (nguy hiểm nếu network lỗi):

```
[App] ──write──► [DB transaction: business data + outbox row] (1 transaction)
                                        │
                                        ▼
                              [Debezium CDC]  ← đọc outbox table
                                        │
                                        ▼
                                  [Kafka topic]
```

Nếu Kafka down → event vẫn an toàn trong DB → không mất. **Bắt buộc** với mọi vendor.

#### 4. Idempotent Consumer — "Xử lý trùng lặp"

Network đôi khi gửi 1 event 2 lần → consumer phải xử lý:
- Mỗi event có `event_id` UUID duy nhất
- Consumer lưu list `event_id` đã xử lý (Redis / DB)
- Nếu `event_id` đã thấy → bỏ qua, không xử lý 2 lần

**Bắt buộc** với mọi consumer. Không có ngoại lệ.

#### 5. Dead Letter Queue (DLQ) + Monitoring

Event không xử lý được → vào DLQ thay vì block toàn bộ:
- DLQ là topic riêng: `dlq.dev-c.invoice.v1`
- Senior nhận alert qua Telegram/Slack ngay lập tức
- Review event lỗi, fix, replay vào lại

**KPI bắt buộc track**:
- Event lag (consumer chậm hơn producer bao nhiêu ms)
- DLQ rate (% event vào dead letter)
- Schema validation failure rate
- Kafka cluster uptime

### 4.6 Migration Plan — 20 tuần

| Phase | Tuần | Việc làm | Kết quả |
|---|---|---|---|
| **Phase 0** | 1-2 | Stop loss — DỪNG đầu tư thêm vào API cũ DEV-A↔DEV-C. Setup Confluent Cloud + Schema Registry. | Hạ tầng sẵn sàng |
| **Phase 1** | 3-9 | Pilot: DEV-C publish `invoice.created/paid`, `payment.received`. DEV-A subscribe, maintain local cache. | **Giải quyết vấn đề 3 tháng** |
| **Phase 2** | 10-14 | Mở rộng entity DEV-C: `employee.hired/terminated`, `payroll.finalized` | DEV-A/B tự cập nhật nhân sự |
| **Phase 3** | 15-20 | Onboard DEV-B: subscribe các event DEV-C cần. DEV-B publish `message.sent`. | 3 vendor đều qua Event Bus |
| **Phase 4** | ongoing | Mandate: mọi integration mới phải qua Event Bus. | Pattern trở thành standard |

### 4.7 8 Quy tắc Governance (đưa vào hợp đồng)

1. **No direct vendor-to-vendor call** — mọi giao tiếp qua Event Bus
2. **Vendor publishes, không expose query API** — vendor chủ động khi data thay đổi
3. **Contract first** — schema duyệt trước khi code
4. **Bounded context** — vendor chỉ publish domain của mình (DEV-C không publish event của DEV-A)
5. **Backward compatible only** — schema chỉ được thêm optional field
6. **Idempotent consumers** — mọi consumer phải xử lý được duplicate event
7. **No synchronous chains** — không cho phép A→B→C→D synchronous (dùng Saga Pattern)
8. **Vendor không sở hữu hub** — Event Bus do Công ty A kiểm soát

---

## 5. Giải pháp — Data Platform & AI (giai đoạn sau)

> **Chỉ bắt đầu sau khi Integration Hub chạy ổn ít nhất 6 tháng.**

### 5.1 Tại sao phải tách Data Platform khỏi Integration Hub

| | Integration Hub | Data Platform |
|---|---|---|
| **Mục đích** | Vendor giao tiếp real-time | Phân tích, AI, báo cáo chiến lược |
| **Pattern** | OLTP (operational) | OLAP (analytical) |
| **Latency yêu cầu** | Mili giây | Phút–giờ chấp nhận được |
| **Người dùng** | Hệ thống production | Data analyst, AI engineer |
| **Tool** | Kafka, API Gateway | BigQuery, ClickHouse, Databricks |

**Gộp làm 1 = kiến trúc Frankenstein**: OLAP system không chịu được load real-time → sập; API gateway không phải nơi train ML model.

### 5.2 Kiến trúc Medallion (khi sẵn sàng)

```
Event Bus (Kafka)
      │
      ▼ Stream ingest
┌─────────────────┐
│  BRONZE Layer   │  Raw events, không transform, immutable
│  (Data Lake)    │  Lưu 1-3 năm, cold storage
└────────┬────────┘
         │ clean + validate
         ▼
┌─────────────────┐
│  SILVER Layer   │  Cleaned, deduplicated, chuẩn hóa
│                 │  Sẵn sàng cho aggregation
└────────┬────────┘
         │ aggregate + enrich
         ▼
┌─────────────────┐
│  GOLD Layer     │  Business metrics, AI-ready features
│                 │  Dashboard, ML training data
└─────────────────┘
```

### 5.3 Điều kiện tiên quyết trước khi đầu tư Data Platform

Trả lời đủ **5 câu hỏi** này trước khi chi tiền:

1. Công ty A có **ít nhất 2 use case AI cụ thể** được ban lãnh đạo phê duyệt không?
2. Integration Hub đã chạy ổn với cả 3 vendor ít nhất **6 tháng** chưa?
3. Có **data analyst hoặc ML engineer** đã hire chưa? Không thuê người thì data lake chỉ là kho chứa.
4. Master Data Management (MDM) — đã có **golden record** cho khách hàng, nhân viên chưa? (Customer ID của DEV-A có khớp với DEV-C không?)
5. Có **data governance policy** (ai được đọc data gì, retention period, GDPR/NĐ 13/2023 compliance) chưa?

Chưa đủ → tiếp tục focus vào Integration Hub.

---

## 6. Chi phí & Nhân sự

### 6.1 Nhân sự cần thuê

**Vai trò**: Senior Platform / Integration Engineer

Yêu cầu kỹ năng:
- Kafka/Confluent — vận hành thành thạo
- DevOps cơ bản: Docker, Linux, CI/CD
- Schema design: Avro/Protobuf/JSON Schema
- Communication tốt — làm việc trực tiếp với 3 vendor như "trọng tài"

**Lương thị trường (2026)**:

| Hạng | Kinh nghiệm | Gross/tháng | Cost-to-company |
|---|---|---|---|
| Senior (5-7 năm) | Có exp Kafka, production env | 45-60M | 55-75M |
| Senior+ (7-10 năm) | Từng lead integration platform | 60-85M | 75-105M |
| Tech Lead (10+ năm) | Từng build EDA enterprise | 90-130M | 110-160M |

**Phương án đề xuất**:
- **Năm 1**: Contract 6 tháng (~50-60M gross) → full-time sau khi MVP ổn
- **Năm 2**: Full-time + thêm 1 mid-level (~25-35M) nếu số vendor tăng
- **Năm 3+**: 2-3 người (1 lead + 1-2 engineer)

### 6.2 Chi phí hạ tầng theo giai đoạn

**Option A — Managed Cloud (Năm 1, đề xuất)**:

| Dịch vụ | Chi phí/tháng |
|---|---|
| Confluent Cloud Kafka (3 broker, ~50GB, < 1M msg/day) | 6-15M |
| Kafka Connect / Debezium | 5-8M |
| Monitoring (Grafana Cloud Pro) | 0-5M |
| Cloud egress + logs | 1-3M |
| **Tổng** | **12-31M/tháng** |

**Option B — Self-host VPS (Năm 2+)**:

| Thành phần | Chi phí/tháng |
|---|---|
| 3 × Kafka broker VPS (4vCPU/16GB) | 6-9M |
| Schema Registry + Kafka Connect | 3-5M |
| Monitoring VPS | 1-2M |
| Backup + network | 2-4M |
| **Tổng** | **12-20M/tháng** |

**Option C — On-prem (Năm 3+)**:
- Dùng backup server đã đầu tư → chỉ tốn điện + cloud DR layer
- **~2-5M/tháng** (không tính CapEx đã đầu tư)

### 6.3 Chi phí duy trì thường xuyên

| Khoản | Chi phí/tháng |
|---|---|
| Alerting (Telegram bot / PagerDuty) | 0-2M |
| Credentials vault (Bitwarden Business) | 0.5-1M |
| Documentation (Notion / Outline) | 0.3-0.5M |
| Training + chứng chỉ senior (bình quân hóa) | 1-2M |
| Dự phòng sự cố (5-10% tổng) | 3-5M |
| **Tổng** | **5-11M/tháng** |

### 6.4 Tổng chi phí theo năm

| Năm | Senior | Hạ tầng | Duy trì | Tổng/tháng | Cả năm |
|---|---|---|---|---|---|
| **Năm 1** | 55-75M | 12-31M | 5-11M | **72-117M** | **~864M - 1.4 tỷ** |
| **Năm 2** | 85-115M | 12-20M | 7-13M | **104-148M** | **~1.25 - 1.78 tỷ** |
| **Năm 3+** | 110-160M | 5-10M | 10-16M | **125-186M** | **~1.5 - 2.23 tỷ** |

### 6.5 So sánh với chi phí ẩn hiện tại

Chi phí Công ty A đang trả **mà không nhận ra**:

| Chi phí ẩn | Ước tính |
|---|---|
| Man-hours 2 vendor (DEV-A + DEV-C) trong 3+ tháng chưa xong | 200-400M |
| Cơ hội mất do data lỗi thời 24h (quyết định sai) | Không đo được |
| Mỗi tích hợp mới tương tự: 5-10 tích hợp trong 2 năm | 1-4 tỷ |

**Kết luận**: Đầu tư ~800M-1.4 tỷ/năm cho Integration Hub = chuyển chi phí ẩn (vendor đàm phán nhau 3 tháng/lần) thành chi phí hiển (đội ngũ Công ty A chủ động kiểm soát).

---

## 7. Lộ trình tổng thể 24 tháng

```
2026
Q1 (Tháng 1-3)     Q2 (Tháng 4-6)      Q3 (Tháng 7-9)      Q4 (Tháng 10-12)
┌──────────────┐   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ FOUNDATION   │   │ INTEGRATION  │     │ INTEGRATION  │     │ STABILIZE    │
│              │   │ HUB MVP      │     │ HUB EXPAND   │     │              │
│ • Audit      │   │              │     │              │     │ • 3 vendor   │
│   vendor     │   │ • Hire       │     │ • DEV-C all  │     │   on EDA     │
│ • Ép DEV-C   │   │   senior     │     │   entities   │     │ • DR drill   │
│   cung cấp  │   │ • Setup      │     │ • DEV-B      │     │   đầu tiên   │
│   thông tin  │   │   Confluent  │     │   onboard    │     │ • Audit      │
│ • Hợp đồng  │   │   + Schema   │     │ • Monitoring │     │   DEV-B      │
│   bổ sung    │   │   Registry   │     │   dashboard  │     │   server dư  │
│   exit clause│   │ • Pilot      │     │              │     │   thừa       │
│ • Mua backup │   │   DEV-C→DEV-A│     │              │     │              │
│   server     │   │   invoice    │     │              │     │              │
│ • Staging    │   │   events     │     │              │     │              │
│   minimal    │   │              │     │              │     │              │
└──────────────┘   └──────────────┘     └──────────────┘     └──────────────┘

2027
Q1 (Tháng 13-15)   Q2 (Tháng 16-18)    Q3-Q4 (Tháng 19-24)
┌──────────────┐   ┌──────────────┐     ┌────────────────────────┐
│ OPTIMIZE     │   │ DATA PLATFORM│     │ DATA PLATFORM BUILD    │
│              │   │ FOUNDATION   │     │ + AI USE CASES         │
│ • Self-host  │   │              │     │                        │
│   migration  │   │ • MDM design │     │ • Bronze/Silver/Gold   │
│   (Option B) │   │ • Data       │     │   layers               │
│ • Thêm mid-  │   │   governance │     │ • First AI use case    │
│   level hire │   │   policy     │     │ • BI dashboards        │
│ • API        │   │ • Stream     │     │ • Data team hire       │
│   Gateway    │   │   ingest     │     │                        │
│   (Kong)     │   │   from Kafka │     │                        │
└──────────────┘   └──────────────┘     └────────────────────────┘
```

---

## 8. Quyết định & Điều khoản hợp đồng vendor

### 8.1 3 Câu hỏi quyết định bắt đầu Integration Hub

| Câu hỏi | Nếu CÓ | Nếu KHÔNG |
|---|---|---|
| Trong 2 năm tới có cần thêm tích hợp vendor không? | Làm ngay | Có thể chờ |
| Muốn thoát phụ thuộc "mỗi API = 3 tháng đàm phán" không? | Làm ngay | Tiếp tục pattern cũ |
| Có 250-300M/năm cho hạ tầng + nhân sự? | Bắt đầu Q2-Q3 2026 | Bắt đầu sau khi có ngân sách |

### 8.2 Stack công nghệ đầy đủ

| Lớp | Tool đề xuất | Lý do |
|---|---|---|
| **Event Bus** | Confluent Cloud Kafka | Ecosystem lớn nhất, dễ tuyển người VN |
| **Schema Registry** | Confluent Schema Registry | Tích hợp sẵn |
| **CDC** | Debezium | Open source, chuẩn industry |
| **API Gateway** (bổ trợ) | Kong | Open source, dễ self-host |
| **Schema language** | Avro hoặc Protobuf | Backward compat tự động |
| **Monitoring** | Prometheus + Grafana | Free, đủ mạnh |
| **Alerting** | Alertmanager → Telegram | Free, đủ cho team < 5 người |
| **IaC** | Terraform | Chuẩn nhất, dễ tuyển |
| **Container** | Docker Compose → K8s sau | Đi từng bước |
| **Documentation** | AsyncAPI spec + Notion | AsyncAPI = chuẩn cho event-driven |
| **Backup server** | Proxmox Backup Server / Restic | Open source, đủ cho SMB |
| **Credentials** | Bitwarden Business | Rẻ, đủ dùng |

### 8.3 Điều khoản bắt buộc bổ sung vào mọi hợp đồng vendor

**Điều khoản hạ tầng & backup**:
- Vendor phải cung cấp thông tin hạ tầng đầy đủ trong 30 ngày kể từ ký hợp đồng
- SLA backup: tần suất tối thiểu daily, retention tối thiểu 30 ngày
- Restore SLA: phải hỗ trợ test restore mỗi quý
- Restore fail = vi phạm SLA = penalty clause

**Điều khoản exit**:
- Khi chấm dứt hợp đồng: bàn giao đầy đủ data, schema, credentials trong N ngày
- Full data export theo định dạng chuẩn (CSV/JSON/SQL dump), không được giữ lại
- Hỗ trợ migration sang vendor mới tối thiểu 60 ngày

**Điều khoản integration** (áp dụng sau khi Integration Hub sẵn sàng):
- Mọi tích hợp data giữa vendor phải qua Event Bus của Công ty A
- Vendor không được gọi API trực tiếp của vendor khác
- Schema phải được Công ty A duyệt trước khi code
- Implement Outbox Pattern — không direct publish vào Kafka từ app code

---

## Bottom line

### 3 Câu cốt lõi

> **1. Vấn đề thật của Công ty A không phải "thiếu server lớn" hay "thiếu AI". Vấn đề thật là "thiếu chủ quyền dữ liệu + thiếu governance + thiếu pattern đúng".**

> **2. Thứ tự ưu tiên không thể đảo ngược: Backup → Integration Hub → Data Platform. Bỏ qua bước 1-2 mà nhảy vào bước 3 = xây AI trên nền không có data sạch, không có data sovereignty.**

> **3. Đầu tư ~70-90M/tháng cho Integration Hub (Event Bus) sẽ chuyển toàn bộ quyền lực điều phối vendor từ "mỗi cặp vendor tự thỏa thuận 3 tháng" sang "Công ty A duyệt schema, Công ty A owns hub, vendor chỉ publish/subscribe".**

### Số liệu quan trọng cần nhớ

| Số liệu | Ý nghĩa |
|---|---|
| **~100M VND** | CapEx backup server — đầu tư 1 lần, bảo vệ toàn bộ data |
| **~70-90M/tháng** | OpEx Integration Hub năm 1 (senior + Confluent + duy trì) |
| **6-7 tuần** | Thời gian giải quyết vấn đề DEV-A↔DEV-C 3 tháng chưa xong |
| **2-3 tuần** | Thời gian mỗi tích hợp mới sau khi EDA sẵn sàng |
| **~70-80%** | Giảm thời gian tích hợp so với pattern hiện tại |
| **1 senior** | Đủ để vận hành toàn bộ giai đoạn đầu (3 vendor, < 30 event type) |

### Rủi ro lớn nhất nếu không làm gì

1. DEV-C tranh chấp hợp đồng → Công ty A mất quyền truy cập toàn bộ HRM + kế toán
2. Vendor sập không báo trước → không restore được vì backup không có hoặc chưa test
3. Thêm vendor thứ 4 → lại 3-6 tháng đàm phán API → không scale được
4. Khi muốn build AI → không có clean data, không có data governance → trả gấp đôi chi phí để clean data

---

*Tài liệu được tổng hợp từ 3 buổi tư vấn chuyên sâu. Để đọc chi tiết từng chủ đề, xem các tài liệu gốc được liên kết ở đầu trang.*
