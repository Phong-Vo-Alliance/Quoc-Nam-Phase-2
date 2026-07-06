# Tư vấn — Pattern đồng bộ dữ liệu giữa các Vendor

> **Ngày phân tích**: 2026-06-14
> **Bối cảnh cụ thể**: DEV-C xây API để DEV-A gọi cập nhật data kế toán/tài chính. Hai bên làm 3+ tháng vẫn chưa xong. DEV-A từ chối sync liên tục vì "data quá lớn", chỉ chấp nhận gọi 1 lần cuối ngày. Công ty A đang nghĩ giải pháp: DEV-A tự sync về data center, hub center tự call API DEV-B để cập nhật.
> **Tài liệu liên quan**:
>   - [infrastructure-multi-vendor-analysis.md](./infrastructure-multi-vendor-analysis.md)
>   - [centralized-data-platform-consultation.md](./centralized-data-platform-consultation.md)

---

## Mục lục

- [TL;DR](#tldr)
- [1. Vấn đề thực tế đang xảy ra](#1-vấn-đề-thực-tế-đang-xảy-ra)
- [2. Vì sao tốn 3 tháng mà chưa xong — nguyên nhân gốc](#2-vì-sao-tốn-3-tháng-mà-chưa-xong--nguyên-nhân-gốc)
- [3. Vì sao DEV-A vừa đúng vừa sai khi nói "data quá lớn"](#3-vì-sao-dev-a-vừa-đúng-vừa-sai-khi-nói-data-quá-lớn)
- [4. Đánh giá idea của Công ty A](#4-đánh-giá-idea-của-công-ty-a)
- [5. Pattern đúng: Event-Driven Architecture (EDA)](#5-pattern-đúng-event-driven-architecture-eda)
- [6. Áp dụng cụ thể cho case DEV-A ↔ DEV-C](#6-áp-dụng-cụ-thể-cho-case-dev-a--dev-c)
- [7. Các pattern bổ trợ cần biết](#7-các-pattern-bổ-trợ-cần-biết)
- [8. Governance & Process changes](#8-governance--process-changes)
- [9. Migration plan cho case hiện tại](#9-migration-plan-cho-case-hiện-tại)
- [10. Quy tắc cho mọi inter-vendor integration tương lai](#10-quy-tắc-cho-mọi-inter-vendor-integration-tương-lai)
- [Bottom line](#bottom-line)

---

## TL;DR

### Vấn đề gốc

Vendor đang dùng pattern **Request/Response synchronous** cho việc đồng bộ data — đây là **pattern sai cho use case này**. Đó là lý do:
- Tốn 3 tháng vẫn chưa xong (negotiation về schema, error handling, pagination, auth…)
- "Data quá lớn" → đúng vì DEV-A đang nghĩ "phải pull toàn bộ dataset"
- "End-of-day batch" là workaround, không phải giải pháp
- Mỗi cặp vendor mới = lại discuss từ đầu

### Giải pháp đúng

Chuyển sang **Event-Driven Architecture với Change Data Capture**:
- Vendor **publish events** khi data thay đổi (không phải expose query API)
- Vendor cần data **subscribe events**, tự maintain local cache
- Chỉ **deltas (thay đổi)** chảy qua hệ thống → "data quá lớn" tự biến mất
- Mỗi vendor làm việc 1 lần (publish) → N consumer dùng được mà vendor không cần làm gì thêm

### Idea của Công ty A — đánh giá

Hướng đi đúng (mediated by hub), nhưng implementation còn sai:
- ❌ "DEV-A sync về data center" — vẫn để DEV-A chủ động pull → không khác gì hiện tại
- ❌ "Hub call API của DEV-B" — vẫn synchronous, chỉ relocate vấn đề
- ✅ **Đúng**: Mỗi vendor publish events vào Hub Event Bus. Vendor khác subscribe. Hub không "call" ai cả.

---

## 1. Vấn đề thực tế đang xảy ra

### Mô tả tình huống

```
┌──────────┐                              ┌──────────┐
│  DEV-A   │  ──── HTTP API calls ────►   │  DEV-C   │
│ CRM/POS  │  "Cho tôi xin data kế toán"  │  HRM/Acc │
└──────────┘                              └──────────┘
   │                                              │
   │ ◄────── Response: large JSON ───────────────┘
   │
   │ Vấn đề:
   │ - Data quá lớn → DEV-A từ chối sync liên tục
   │ - 3 tháng vẫn chưa xong API
   │ - Đành chấp nhận: chỉ gọi 1 lần cuối ngày
```

### Hệ quả thực tế

- **Stale data 24h**: DEV-A đang nhìn data kế toán cũ 1 ngày. Mọi quyết định business dựa trên data lỗi thời.
- **Batch failure = mất 1 ngày**: nếu cron 23h59 fail → ngày mai data không có. Không có retry tự động giữa các batch.
- **Không scale**: tương lai có thêm tích hợp DEV-B ↔ DEV-C, DEV-A ↔ DEV-B → mỗi cặp lại 3 tháng → tổng = 9-12 tháng để tích hợp xong tất cả.
- **3 tháng dev time wasted**: tiền trả cho 2 vendor trong 3 tháng đã có thể build được Integration Hub.

---

## 2. Vì sao tốn 3 tháng mà chưa xong — Nguyên nhân gốc

Đây không phải "vendor lười" hay "API khó". Đây là **lỗi pattern**. Cùng vấn đề sẽ lặp lại với bất kỳ cặp vendor nào dùng cùng cách làm.

### Lỗi #1 — Bespoke design mỗi lần tích hợp

Mỗi cặp tích hợp, 2 bên phải tự design lại từ đầu:

| Câu hỏi cần discuss | Thường mất bao lâu |
|---|---|
| Endpoint URL & path structure | 1-3 ngày |
| Authentication method (API key? OAuth? JWT?) | 1 tuần (mỗi bên có chuẩn riêng) |
| Request format (REST/SOAP/GraphQL? Field naming?) | 1-2 tuần |
| Response format & pagination strategy | 1-2 tuần |
| Error code semantics & retry policy | 1 tuần |
| Rate limiting & throttling rules | 1 tuần |
| Logging & monitoring agreement | 1 tuần |
| Versioning & breaking change policy | 1 tuần |
| Testing & UAT | 2-4 tuần |
| **Tổng** | **2-3 tháng cho 1 API** |

→ **Mỗi inter-vendor API mới = repeat 100% công việc này**. Không có template, không có chuẩn, không có ai chủ trì.

### Lỗi #2 — Pull pattern cho large data

DEV-A đang phải **PULL** data từ DEV-C — tức là DEV-A chủ động hỏi:
- "Cho tôi toàn bộ invoice của hôm nay" → DEV-C phải query DB lớn, build JSON to → trả về cho DEV-A → DEV-A phải parse và merge vào DB nó
- Mỗi lần pull = full scan ở phía DEV-C + network transfer lớn + processing ở phía DEV-A
- Càng nhiều data → càng chậm → DEV-A càng không muốn gọi thường xuyên → fallback end-of-day batch

**Pattern đúng phải là PUSH/SUBSCRIBE**: DEV-C chỉ gửi cái gì THAY ĐỔI khi nó thay đổi, không gửi toàn bộ.

### Lỗi #3 — Tight coupling

DEV-A phải hiểu schema, business logic, error model của DEV-C:
- DEV-C đổi schema → DEV-A vỡ → mất 2 tuần fix
- DEV-A muốn field mới → phải bug DEV-C bổ sung → DEV-C ưu tiên thấp → lại 1 tháng chờ
- 2 hệ thống deploy độc lập nhưng release phải đồng bộ

### Lỗi #4 — Không có "neutral party"

Khi 2 vendor argue về API design, không có ai làm trọng tài:
- DEV-A muốn API "tiện cho DEV-A"
- DEV-C muốn API "rẻ cho DEV-C"
- 2 bên tự thương lượng → kéo dài → một bên nhường (thường là bên yếu hơn về politic)
- Kết quả thỏa hiệp thường không tối ưu cho Công ty A

### Lỗi #5 — "Data too large" là vấn đề giả

Thật ra "data quá lớn" trong DEV-A nói chỉ đúng nếu dùng full-snapshot sync. Trên thực tế:
- Số invoice MỚI mỗi ngày: vài chục đến vài trăm
- Số invoice UPDATE: vài chục
- → **Delta thật sự rất nhỏ**, có thể stream real-time mà không tốn gì cả

Nhưng vì pattern hiện tại là "pull toàn bộ table" nên data có vẻ lớn. Pattern đúng (event/CDC) chỉ gửi delta → vấn đề biến mất.

---

## 3. Vì sao DEV-A vừa đúng vừa sai khi nói "data quá lớn"

### DEV-A đúng ở chỗ

- Pull full snapshot data kế toán liên tục **là không khả thi**
- Network + DB load sẽ giết cả 2 hệ thống nếu sync mỗi 5 phút
- End-of-day batch là cách **an toàn nhất với pattern hiện tại**

### DEV-A sai ở chỗ

- Đó là sai vì **chọn sai pattern**, không phải vì data thật sự quá lớn
- Với CDC/Event pattern, chỉ delta (~vài KB/lần thay đổi) chảy qua → nhỏ hơn pull batch hàng GB rất nhiều
- DEV-A đang giải vấn đề trong khung pattern sai → giải pháp tối ưu trong khung đó vẫn tệ

### Phân tích volume thực tế

Giả sử Công ty A có:
- 500 invoice/ngày (mỗi cái 5KB JSON) = 2.5MB/ngày
- 200 payment events/ngày = 1MB/ngày
- 50 employee updates/ngày = 250KB/ngày

**Tổng delta**: ~4MB/ngày = ~3KB/phút trung bình → **không có gì là lớn**

Nhưng nếu pull full table:
- 100,000 invoices × 5KB = 500MB mỗi lần pull
- Mỗi 5 phút pull = 500MB × 288 lần/ngày = **144GB/ngày**

→ "Data quá lớn" là vấn đề của pattern, không phải bản chất data.

---

## 4. Đánh giá idea của Công ty A

User đề xuất:
> *"công ty DEV-A nên tự sync về data center và hub center sẽ tự call API của DEV-B để yêu cầu cập nhật"*

### Điểm đúng (intuition right)

✅ **Nhận ra cần có hub trung gian** — không để vendor gọi nhau trực tiếp.
✅ **Tránh được vendor tự thương lượng** — Công ty A chủ trì.
✅ **Centralize lại governance** — Công ty A kiểm soát data flow.

### Điểm sai (implementation wrong)

❌ **"DEV-A tự sync về data center"** = vẫn để DEV-A chủ động pull/push, chỉ đổi đích đến từ DEV-C sang data center
   - Cùng vấn đề "data quá lớn" sẽ lặp lại với data center
   - DEV-A vẫn phải design pipeline sync → vẫn tốn 3 tháng

❌ **"Hub center sẽ tự call API của DEV-B"** = vẫn synchronous, chỉ relocate vấn đề
   - Hub gọi DEV-B's API → vẫn cần DEV-B expose API → vẫn cần discuss API design
   - Nếu DEV-B down → hub fail → không khác gì DEV-A gọi DEV-B trực tiếp
   - Hub trở thành **single point of failure** mới

❌ **Vẫn là Request/Response pattern**, chỉ thêm 1 hop ở giữa → thêm độ phức tạp mà không thêm giá trị.

### Vì sao intuition đúng nhưng thực hiện sai

Vì user vẫn đang nghĩ theo pattern "vendor A → API → vendor B". Hub trong đầu user là một **API proxy** (gateway-only).

Pattern đúng cần shift mindset: **không ai gọi API của ai**. Tất cả publish/subscribe vào event stream.

```
❌ Idea hiện tại của Công ty A:
   DEV-A → call hub API → hub → call DEV-B API → done
   (vẫn là pull/sync chain, chỉ có thêm middleware)

✅ Pattern đúng:
   DEV-A → publish "new event" → Event Bus
                                      ↓ (DEV-B đang subscribe)
                                  DEV-B nhận event, tự xử lý
   (không ai call ai, decoupled hoàn toàn)
```

---

## 5. Pattern đúng: Event-Driven Architecture (EDA)

### Core principle

> **Vendor SỞ HỮU data của mình. Khi data thay đổi, vendor PUBLISH event mô tả thay đổi. Ai cần data đó thì SUBSCRIBE events. Không ai gọi API của ai để pull data nữa.**

### Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────┐                                    ┌──────────┐   │
│  │  DEV-A   │                                    │  DEV-B   │   │
│  │ CRM/POS  │                                    │ Chat/Zalo│   │
│  └──┬───┬───┘                                    └──┬───┬───┘   │
│     │   ▲                                           │   ▲       │
│  (publish)                                       (publish)      │
│     │   │ (subscribe)                            (subscribe)    │
│     ▼   │                                           ▼   │       │
│  ┌──────┴─────────────────────────────────────────────┴─────┐   │
│  │             EVENT BUS (Kafka/RabbitMQ/NATS)              │   │
│  │             - dev-a.sale.created                         │   │
│  │             - dev-a.customer.updated                     │   │
│  │             - dev-b.message.sent                         │   │
│  │             - dev-c.invoice.created                      │   │
│  │             - dev-c.payment.received                     │   │
│  │             - dev-c.employee.updated                     │   │
│  └────────────────────┬────────────────────────────────────┘    │
│                       ▲                                         │
│                  (publish/subscribe)                            │
│                       │                                         │
│                  ┌────┴────┐                                    │
│                  │  DEV-C  │                                    │
│                  │ HRM/Acc │                                    │
│                  └─────────┘                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         (mỗi vendor tự maintain local materialized view
          của data subscribe được)
```

### Vendor công việc gì?

**DEV-C (publisher)**:
1. Setup outbox table hoặc bật CDC trên DB của mình
2. Mỗi lần invoice/payment thay đổi → emit event vào Event Bus
3. **Hết.** Không cần biết ai consume.

**DEV-A (subscriber)**:
1. Subscribe events `dev-c.invoice.*`, `dev-c.payment.*`
2. Khi nhận event → update local cache của DEV-A
3. Logic business của DEV-A đọc từ local cache → **không gọi DEV-C nữa**
4. Nếu cần thông tin chi tiết hơn → DEV-C đã có trong event hoặc DEV-A request lazy load (rare case)

**Hub team (Công ty A)**:
1. Vận hành Event Bus
2. Quản lý schema registry
3. Define event format chuẩn
4. Monitor & alert khi pipeline lỗi

### Lợi ích cụ thể giải quyết vấn đề hiện tại

| Vấn đề hiện tại | Sau khi áp dụng EDA |
|---|---|
| 3 tháng discuss API chưa xong | DEV-C chỉ define event schema (1-2 tuần). Không cần discuss với DEV-A. |
| "Data quá lớn" → không sync được | Chỉ delta chảy qua (KB, không phải GB). Real-time không vấn đề. |
| Chỉ batch end-of-day → data lag 24h | Real-time (ms-giây). DEV-A luôn có data mới nhất. |
| Lần sau DEV-B cần data kế toán → lại 3 tháng | DEV-B chỉ cần subscribe → 1 tuần. DEV-C không cần làm gì. |
| Schema thay đổi → vỡ liên tục | Schema registry với versioning. Producer phải tuân thủ contract. |
| DEV-C down 1 giờ → DEV-A mất data | Event Bus buffer events. DEV-C up trở lại → DEV-A nhận events đã queue. |
| Mỗi cặp tự design auth riêng | Auth tập trung ở Event Bus. Vendor chỉ cần credentials 1 lần. |

---

## 6. Áp dụng cụ thể cho case DEV-A ↔ DEV-C

### Bước 1 — Define domain events của DEV-C

Liệt kê các events DEV-C sẽ publish (DEV-C là chuyên gia về domain kế toán, họ define schema):

```yaml
# dev-c.invoice.created
event_type: dev-c.invoice.created
version: 1
payload:
  invoice_id: string
  customer_id: string         # Master Customer ID (theo MDM)
  amount: decimal
  currency: string
  issued_at: datetime
  due_date: date
  line_items: array
  tax_amount: decimal
  status: enum [draft, issued, paid, cancelled]

# dev-c.invoice.updated
# dev-c.invoice.cancelled
# dev-c.payment.received
# dev-c.payment.refunded
# dev-c.employee.hired
# dev-c.employee.terminated
# dev-c.payroll.processed
```

### Bước 2 — DEV-C implement publishing

Có 2 cách, recommend cách (B) — robust hơn:

#### Cách A — Direct publish trong application code

```
[App DEV-C code]
  on invoice_created():
    save_to_db()
    publish_to_kafka("dev-c.invoice.created", event_payload)
```

**Vấn đề**: nếu publish fail mà DB đã save → event mất.

#### Cách B — Outbox pattern (RECOMMENDED)

```
[App DEV-C code]
  on invoice_created():
    BEGIN TRANSACTION
      save_to_db(invoice)
      INSERT INTO outbox (event_type, payload, created_at, sent=false)
    COMMIT
  
[Background process]
  every 1 second:
    SELECT FROM outbox WHERE sent=false LIMIT 100
    for each event:
      publish_to_kafka(event)
      UPDATE outbox SET sent=true WHERE id=event.id
```

**Lợi ích**: atomic với DB transaction. Không bao giờ mất event.

#### Cách C — Pure CDC (Debezium đọc binlog)

```
DEV-C database (Postgres/MySQL)
  → binlog/WAL stream
  → Debezium connector
  → Kafka topic tự động
```

**Lợi ích**: DEV-C không cần đổi code gì. Mọi DB change tự thành event.
**Nhược**: cần access vào binlog của DB (DEV-C phải đồng ý).

### Bước 3 — DEV-A implement subscribing

```
[DEV-A consumer]
  subscribe to topics:
    - dev-c.invoice.*
    - dev-c.payment.*
  
  on receive event:
    if event_type == "dev-c.invoice.created":
      INSERT INTO local_invoice_cache (...)
    if event_type == "dev-c.invoice.updated":
      UPDATE local_invoice_cache (...)
    if event_type == "dev-c.payment.received":
      UPDATE local_invoice_cache.status = 'paid'
    
    ack_event()  // confirm processed
```

**Quan trọng**:
- DEV-A maintain **local materialized view** — copy data DEV-A care về
- Logic business của DEV-A đọc từ local view → **không gọi DEV-C API**
- Nếu DEV-A cần data lần đầu (cold start) → 1 lần snapshot từ DEV-C, sau đó CDC stream

### Timeline thực tế

| Giai đoạn | Thời gian |
|---|---|
| Define event schema | 1 tuần (workshop 2 bên + hub team) |
| DEV-C implement outbox + publisher | 2 tuần |
| Hub team setup Kafka + schema registry | 1 tuần (parallel) |
| DEV-A implement consumer + local cache | 2 tuần |
| Testing & migration | 1-2 tuần |
| **Tổng** | **6-7 tuần** (so với 3 tháng + chưa xong hiện tại) |

Và quan trọng: **tích hợp tiếp theo (DEV-B ↔ DEV-C) chỉ tốn 2-3 tuần** vì:
- DEV-C đã publish event rồi
- DEV-B chỉ cần implement subscriber
- Không cần discuss với DEV-C gì cả

---

## 7. Các pattern bổ trợ cần biết

### 7.1 Outbox Pattern (đã đề cập)
Đảm bảo events được publish đồng thời với DB transaction. **Bắt buộc** cho production.

### 7.2 Idempotent Consumer

Event Bus có thể deliver event 2 lần (at-least-once delivery). Consumer phải xử lý duplicate:

```
on receive event:
  if event.event_id IN processed_events_table:
    return  # đã xử lý rồi, skip
  process(event)
  INSERT event.event_id INTO processed_events_table
```

### 7.3 Schema Registry

Vendor không tự ý đổi schema. Mọi event schema được version hóa ở central registry:

```
Confluent Schema Registry / AWS Glue Schema Registry / Apicurio
  ├── dev-c.invoice.created.v1
  ├── dev-c.invoice.created.v2   ← new version, backward compatible
  └── ...
```

**Rule**: chỉ được thêm field optional, không được xóa field, không được đổi type.

### 7.4 Dead Letter Queue (DLQ)

Event không xử lý được sau N lần retry → vào DLQ → hub team review:

```
Main topic ──► consumer ──► (lỗi) ──► retry topic (3 lần) ──► DLQ
                                                                ↓
                                                  Hub team monitor & fix
```

### 7.5 Eventual Consistency

DEV-A đọc local cache → có thể lag vài giây so với DEV-C. **Hầu hết business case OK với điều này** (không phải mọi thứ cần strong consistency).

Trường hợp cần strong consistency (rare): vẫn dùng API call — nhưng đây là exception, không phải rule.

### 7.6 Saga Pattern (cho transaction phức tạp)

Khi 1 business operation cần thay đổi data ở nhiều vendor:

```
"Tạo đơn hàng + xuất hóa đơn + tạo group chat khách"
  1. DEV-A: create_order → publish "order.created"
  2. DEV-C subscribes → create_invoice → publish "invoice.created"
  3. DEV-B subscribes → create_chat_group → publish "chat.created"
  
  Nếu step 2 fail → compensation: publish "order.cancellation_required"
  → DEV-A rollback
```

### 7.7 CQRS (Command Query Responsibility Segregation)

Write side (Command): qua API trực tiếp đến vendor (ít khi xảy ra, vì hiếm khi cần)
Read side (Query): qua local materialized view (build từ events)

→ DEV-A đọc data kế toán = từ cache. Khi cần TẠO invoice mới → có thể gọi API DEV-C (rare).

### 7.8 Snapshot + Stream

Lần đầu setup, DEV-A cần historical data → bootstrap với 1 lần snapshot từ DEV-C → sau đó CDC stream tiếp.

---

## 8. Governance & Process changes

Tech không giải quyết được vấn đề một mình. Phải đi kèm process change.

### 8.1 Single owner cho Integration Hub

**Công ty A** sở hữu và vận hành hub, không outsource cho vendor. Lý do: nếu DEV-A vận hành hub → DEV-B và DEV-C không tin → conflict of interest.

### 8.2 Event schema design — Contract first, code later

Quy trình mới cho mọi tích hợp inter-vendor:

```
1. Vendor đề xuất event mới
   ↓
2. Hub team review schema (1-3 ngày)
   ↓
3. Schema approved → vào central registry
   ↓
4. Vendor implement publishing/consuming theo schema đã chốt
   ↓
5. KHÔNG được start code trước khi schema approved
```

→ Tránh được tình trạng implement xong mới argue "field này phải đổi tên".

### 8.3 Template & accelerator

Hub team build sẵn:
- Template event schema cho mỗi domain (order, customer, invoice, …)
- SDK/library cho 3 ngôn ngữ chính của vendor (C#, Java, Python tùy stack)
- Sample publisher/consumer code
- Local dev environment (docker-compose)

→ Vendor mới chỉ cần fill template, không phải design from scratch.

### 8.4 Self-service developer portal

Trang web nội bộ liệt kê:
- Tất cả events available, schema, sample payload
- Vendor nào publish, vendor nào subscribe
- Health status từng topic
- Document & runbook
- Contact owner

→ DEV-B muốn data từ DEV-C → vào portal, thấy `dev-c.invoice.created` đã có → subscribe → done. Không cần meeting với DEV-C.

### 8.5 SLA giữa Hub team và vendor

| Cam kết | Hub → Vendor | Vendor → Hub |
|---|---|---|
| Uptime Event Bus | 99.9% | (không applicable) |
| Latency event delivery | <5 giây p99 | (không applicable) |
| Schema review turnaround | 3 business days | Submit schema 5 ngày trước implement |
| Schema change notice | (không applicable) | 30 ngày trước breaking change |

### 8.6 Đưa vào hợp đồng vendor

Mọi vendor mới hoặc gia hạn:
- ✅ Phải tuân thủ Integration Hub standard (không gọi vendor khác trực tiếp)
- ✅ Phải publish events cho data domain của mình
- ✅ Phải maintain schema theo registry
- ✅ Không được charge extra cho mỗi event publish (nó là tiêu chuẩn, không phải feature)
- ✅ Phải support test/staging environment cho events

---

## 9. Migration plan cho case hiện tại

### Phase 0 — Trước khi migrate (Tuần 1-2)

- Quyết định **không tiếp tục** API hiện tại (đang làm 3 tháng) — đừng đổ thêm tiền vào sai pattern
- Thông báo cho DEV-A và DEV-C: chuyển sang event-driven
- Hub team chuẩn bị infrastructure (Kafka + schema registry + SDK)

### Phase 1 — Pilot với DEV-C → DEV-A (Tuần 3-9)

- Workshop event schema với DEV-C (kế toán domain)
- DEV-C implement outbox + publisher cho 1 entity quan trọng nhất (invoice)
- DEV-A implement consumer + local cache cho invoice
- Run dual-write 2 tuần (cả batch cũ + events mới) để verify
- Cutover: tắt batch end-of-day, dùng events full-time

### Phase 2 — Mở rộng domain DEV-C (Tuần 10-14)

- Thêm các entity còn lại: payment, employee, payroll
- DEV-A subscribe thêm các topic cần thiết
- Decommission các API cũ giữa DEV-A và DEV-C

### Phase 3 — Onboard DEV-B (Tuần 15-20)

- DEV-B publish events từ chat domain
- DEV-A và DEV-C subscribe (nếu cần)
- Đây là test case quan trọng: nếu tích hợp DEV-B mất <4 tuần → pattern thành công

### Phase 4 — Mandate cho integration mới (Tuần 21+)

- Mọi API call inter-vendor mới: BẮT BUỘC qua hub
- Cấm vendor gọi nhau trực tiếp
- API cũ legacy: deprecation timeline 6-12 tháng

---

## 10. Quy tắc cho mọi inter-vendor integration tương lai

Đưa các nguyên tắc sau vào **governance document** và hợp đồng vendor:

### Quy tắc #1 — No direct vendor-to-vendor call

> Vendor không được gọi API của vendor khác trực tiếp. Mọi data sharing phải qua Integration Hub.

### Quy tắc #2 — Vendor publishes, doesn't expose query API for cross-vendor data

> Vendor publish domain events vào hub. Vendor khác subscribe. Không expose query API cho vendor khác (trừ trường hợp ngoại lệ được duyệt).

### Quy tắc #3 — Contract first

> Event schema phải được Hub team duyệt TRƯỚC khi vendor implement. Không có schema = không có code.

### Quy tắc #4 — Bounded context

> Mỗi vendor chỉ publish events thuộc domain của mình. Không "tạo events thay" vendor khác.

### Quy tắc #5 — Backward compatibility

> Schema chỉ được thay đổi theo cách backward compatible (thêm optional field). Breaking change cần notice 30 ngày + version mới.

### Quy tắc #6 — Idempotent consumers

> Consumer phải handle duplicate events. Hub deliver at-least-once.

### Quy tắc #7 — No synchronous chains

> Không có chuỗi sync call A → B → C → D. Mọi orchestration cần saga pattern hoặc event chaining.

### Quy tắc #8 — Vendor không "sở hữu" Integration Hub

> Hub là tài sản của Công ty A. Vendor không được modify config, schema, topic của hub.

---

## Bottom line

### Tóm tắt các điểm chính

1. **Tốn 3 tháng vẫn chưa xong là TRIỆU CHỨNG của lỗi pattern, không phải lỗi vendor.** Mọi cặp vendor sẽ gặp cùng vấn đề nếu không đổi cách.

2. **"Data quá lớn" là vấn đề giả** — chỉ đúng với pattern pull-snapshot hiện tại. Với event/CDC, chỉ delta (~KB) chảy qua → không có vấn đề gì.

3. **End-of-day batch không phải giải pháp** — đó là workaround. Đừng chấp nhận là final state. Mất 24h data freshness sẽ làm khó nhiều use case (AI, real-time analytics, customer experience).

4. **Idea của Công ty A đúng intuition (cần hub) nhưng sai implementation** (vẫn nghĩ theo pull/call pattern). Cần shift sang **publish/subscribe**.

5. **Event-Driven Architecture là pattern đúng** cho tình huống này:
   - Vendor publish, vendor khác subscribe
   - Không ai call ai
   - Decoupled hoàn toàn — vendor down không sập consumer
   - Add consumer mới = vendor publisher không cần làm gì

6. **Timeline thực tế với pattern đúng**: tích hợp đầu tiên 6-7 tuần (so với 3+ tháng hiện tại), tích hợp sau 2-3 tuần.

7. **Tech là 50%, governance là 50%**:
   - Contract-first
   - Schema registry
   - Templates & SDK
   - Self-service portal
   - Đưa vào hợp đồng vendor

### Câu chốt

> **Đừng tiếp tục đổ tiền vào API hiện tại (đang sai pattern). Stop loss, redirect sang Event-Driven Architecture. Trong 6-7 tuần sẽ giải quyết được vấn đề đã 3 tháng không xong, và quan trọng hơn — tất cả các tích hợp tương lai sẽ chỉ tốn 2-3 tuần thay vì 3 tháng.**

> **Hub không phải API proxy. Hub là Event Bus. Vendor publish vào, vendor khác subscribe ra. Không có "hub call API". Không có "vendor sync về data center". Chỉ có events chảy qua.**

### Khẩu hiệu cho team lãnh đạo

🎯 **"Vendor không gọi nhau. Vendor nói với hub. Ai cần nghe thì nghe."**

🎯 **"Publish once, subscribe many. Pull once, suffer many."**
