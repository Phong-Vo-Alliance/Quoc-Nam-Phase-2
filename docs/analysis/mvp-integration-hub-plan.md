# Kế hoạch MVP 8 tuần — Integration Hub cho Công ty A

> **Ngày lập**: 2026-06-14
> **Thời gian**: 8 tuần (4 Sprint × 2 tuần)
> **Ngân sách dự kiến**: 130-180M VND
> **Tài liệu liên quan**: [company-a-digital-strategy-synthesis.md](./company-a-digital-strategy-synthesis.md)

---

## Mục lục

- [A. Mục tiêu MVP](#a-mục-tiêu-mvp)
- [B. Tech stack](#b-tech-stack-chốt)
- [C. Kế hoạch 8 tuần](#c-kế-hoạch-8-tuần--chia-4-sprint-mỗi-sprint-2-tuần)
- [D. Chi phí cụ thể](#d-chi-phí-cụ-thể-mvp-2-tháng)
- [E. Bảng theo dõi tiến độ](#e-bảng-theo-dõi-tiến-độ--mẫu-cho-mỗi-2-tuần)
- [F. Rủi ro & xử lý](#f-rủi-ro--cách-xử-lý)
- [G. 5 câu hỏi trước khi bắt đầu](#g-5-câu-hỏi-tự-kiểm-tra-trước-khi-bắt-đầu)
- [H. Bottom line](#h-bottom-line)

---

## A. Mục tiêu MVP

MVP này **KHÔNG phải production system**. Mục đích là **chứng minh được 4 giả thuyết** để ban lãnh đạo tin tưởng đầu tư đầy đủ:

| # | Giả thuyết cần prove | Cách demo |
|---|---|---|
| 1 | "Vendor không cần gọi API trực tiếp — chỉ cần publish event" | Live demo: tạo hóa đơn ở Producer → 200ms sau xuất hiện ở Consumer |
| 2 | "Data quá lớn" là vấn đề giả với pattern đúng | Load test 10.000 event, so sánh: pull-snapshot vs event-delta |
| 3 | Tích hợp vendor mới chỉ tốn 2-3 tuần thay vì 3 tháng | Build Producer mới trong < 1 tuần, kết nối ngay |
| 4 | Công ty A có thể tự kiểm soát "luật chơi" qua Schema Registry | Demo: vendor gửi event sai schema → bị reject tự động |

---

## B. Tech stack chốt

> Phù hợp với senior .NET/React/Node.

| Lớp | Tool | Lý do chọn |
|---|---|---|
| **Backend services** | .NET 8 Web API | Senior mạnh nhất, Confluent.Kafka client cho .NET rất ổn |
| **Event Bus** | Confluent Cloud Kafka (Basic tier) | Free trial $400 credit, không cần ops Kafka |
| **Schema Registry** | Confluent Schema Registry (managed) | Tích hợp sẵn |
| **Schema format** | Avro | Backward compatible tự động |
| **Producer DB** | PostgreSQL (Azure Flexible) | Hỗ trợ Outbox pattern, free tier nhỏ |
| **Consumer state** | PostgreSQL + Redis | Idempotency tracking |
| **Frontend dashboard** | React + TypeScript + Vite + TailwindCSS | Senior mạnh React |
| **Real-time UI** | SignalR (.NET) → React | Native với .NET, đơn giản hơn WebSocket thuần |
| **Monitoring** | Grafana Cloud (free) + Prometheus exporters | Free tier đủ |
| **Alerting** | Telegram bot (custom .NET worker) | Free |
| **CI/CD** | GitHub Actions | Free cho private repo |
| **Cloud platform** | Azure (App Service + PostgreSQL Flexible) | Tốt nhất cho .NET |
| **Container** | Docker + docker-compose (dev) | Đơn giản, sau migrate K8s |

> **Lý do KHÔNG dùng Node.js cho backend**: Senior mạnh .NET hơn → tốc độ làm cao hơn. Node có thể dùng cho 1 microservice phụ (Telegram bot worker) nếu thuận tay.

---

## C. Kế hoạch 8 tuần — Chia 4 Sprint, mỗi Sprint 2 tuần

---

### 🔵 Sprint 1 (Tuần 1-2) — Foundation & First Event

**Mục tiêu**: Một event chạy được end-to-end từ Producer → Kafka → Consumer.

#### Tuần 1 — Setup & "Hello Event"

| Task | Output cụ thể | Người thực hiện |
|---|---|---|
| Sign up Confluent Cloud (Basic tier), tạo cluster | URL cluster, API keys | Senior |
| Setup Azure subscription, Resource Group | Resource group `companya-mvp-rg` | Senior |
| Tạo GitHub repo + branch protection rules | Repo `companya/integration-hub-mvp` | Senior |
| Setup GitHub Actions CI/CD skeleton | Pipeline `.github/workflows/ci.yml` build .NET | Senior |
| Thiết lập Docker Compose local dev environment | `docker-compose.yml` chạy được | Senior |
| Vẽ kiến trúc MVP (draw.io / Excalidraw) | File `docs/architecture.png` | Senior |
| Thiết kế Avro schema đầu tiên: `invoice.created.v1` | File `schemas/invoice-created-v1.avsc` | Senior + IT Công ty A review |

#### Tuần 2 — First Event End-to-End

| Task | Output cụ thể | Người thực hiện |
|---|---|---|
| Build .NET project `Producer.DevCSimulator` (Web API) | Endpoint `POST /invoices` → ghi DB + outbox | Senior |
| Setup PostgreSQL Azure Flexible (B1ms tier) | Connection string, tables `invoices`, `outbox` | Senior |
| Build background worker đọc Outbox → publish Kafka | Service `OutboxPublisher` | Senior |
| Build .NET project `Consumer.DevASimulator` | Background consumer subscribe `dev-c.invoice.v1` | Senior |
| Idempotent consumer (track event_id) | Table `processed_events`, logic dedup | Senior |
| Smoke test end-to-end | Tạo 1 invoice → 5 giây sau xuất hiện ở Consumer DB | Senior + IT Công ty A |

#### 🎯 CHECKPOINT 1 — Cuối tuần 2

**Demo trực tiếp cho lãnh đạo**:
- ✅ Live demo: gõ lệnh tạo invoice ở Producer → mở Consumer → thấy data xuất hiện
- ✅ Show Confluent Cloud console: topic `dev-c.invoice.v1` có message
- ✅ Show schema được validate tự động
- ❓ Issues track: bất kỳ blocker nào về DEV-C cooperation, cloud cost, kỹ thuật

**Câu hỏi business cần trả lời**:
1. "Có data chảy từ A sang C qua hub không?" → Phải có
2. "Senior có on track không?" → Đánh giá velocity qua output tuần 1-2

---

### 🟢 Sprint 2 (Tuần 3-4) — Dashboard & Multiple Events

**Mục tiêu**: Có UI cho người không kỹ thuật thấy event chảy, mở rộng nhiều event type.

#### Tuần 3 — Admin Dashboard React

| Task | Output cụ thể | Người thực hiện |
|---|---|---|
| Init React + Vite + TypeScript + Tailwind project | App chạy `npm run dev` | Senior |
| Build `BackendApi.AdminApi` (.NET) để serve dashboard | REST endpoints `/api/events`, `/api/topics`, `/api/lag` | Senior |
| Setup SignalR hub trong AdminApi | Real-time push event mới về frontend | Senior |
| Dashboard page 1: Live event stream | UI bảng cuộn hiển thị event đến real-time | Senior |
| Dashboard page 2: Topic stats | Số event/phút, lag, error rate | Senior |
| Deploy AdminApi lên Azure App Service | URL `https://companya-mvp-admin.azurewebsites.net` | Senior |
| Deploy React lên Azure Static Web Apps | URL public truy cập được | Senior |

#### Tuần 4 — Mở rộng entity & error handling

| Task | Output cụ thể | Người thực hiện |
|---|---|---|
| Thêm 2 event mới: `payment.received.v1`, `invoice.status_changed.v1` | Schema mới + producer code | Senior |
| Implement Dead Letter Queue topic `dlq.dev-c.*` | Logic: schema fail → vào DLQ | Senior |
| Dashboard page 3: DLQ inspector | UI xem event lỗi, lý do, replay button | Senior |
| Telegram bot worker (.NET) | Alert vào group Telegram khi DLQ tăng | Senior |
| Schema versioning demo: thêm field optional vào v2 | Producer dùng v2, Consumer v1 vẫn đọc được | Senior |
| Test backward compatibility | Verify cả v1 + v2 chạy song song | Senior + IT Công ty A |

#### 🎯 CHECKPOINT 2 — Cuối tuần 4

**Demo có dashboard**:
- ✅ Mở browser xem dashboard live → có event chảy nhìn thấy được
- ✅ Demo: gửi 1 event sai schema → vào DLQ → Telegram báo ngay
- ✅ Demo: 3 loại event chạy đồng thời
- ✅ Demo: schema v2 thêm field, v1 consumer vẫn chạy bình thường

**Câu hỏi business cần trả lời**:
1. "Người không code có nhìn thấy hệ thống đang chạy không?" → Mở dashboard
2. "Khi có lỗi, có biết được không?" → Show Telegram alert
3. "Schema versioning có hoạt động không?" → Backward compat test

---

### 🟡 Sprint 3 (Tuần 5-6) — Performance & Real Producer

**Mục tiêu**: Prove "data quá lớn" sai. Bắt đầu kết nối với 1 vendor thật (DEV-C).

#### Tuần 5 — Load test & comparison

| Task | Output cụ thể | Người thực hiện |
|---|---|---|
| Build script generate 10.000 invoice events / 1 phút | Tool `LoadGenerator` | Senior |
| Run load test → đo throughput, lag, CPU | Báo cáo metrics | Senior |
| Build "pull-snapshot simulator" để so sánh | Script gọi REST `/invoices?since=...` mỗi 5 phút | Senior |
| Đo bandwidth & latency cả 2 cách | Báo cáo so sánh cụ thể bằng số | Senior |
| Dashboard page 4: Performance comparison | Biểu đồ trực quan event-delta vs pull-snapshot | Senior |

**Output báo cáo dự kiến**:

```
Pull-snapshot (pattern hiện tại):
  - 500MB × 288 lần/ngày = 144 GB/ngày
  - Latency dữ liệu cũ: 5 phút - 24 giờ
  - Load lên DEV-C: 288 spike/ngày

Event-delta (pattern mới):
  - 4-8 MB/ngày (chỉ thay đổi thực tế)
  - Latency dữ liệu cũ: < 5 giây
  - Load lên DEV-C: phân tán, không spike
  → Giảm ~18.000x bandwidth, latency real-time
```

#### Tuần 6 — Tích hợp Producer thật (DEV-C)

**Plan A** — Nếu DEV-C hợp tác:

| Task | Output cụ thể |
|---|---|
| Họp với DEV-C, ký NDA nếu chưa có | Biên bản họp |
| Xin staging DB access (read-only) | Connection string |
| Setup Debezium CDC connector trên Confluent | Đọc table `invoices` của DEV-C thật |
| Map schema DEV-C → schema chuẩn của hub | Transformer logic |
| Verify event từ DEV-C thật chảy qua hub | Demo live |

**Plan B** — Nếu DEV-C chưa hợp tác kịp:

| Task | Output cụ thể |
|---|---|
| Build "DevCMockServer" mô phỏng DB DEV-C realistic | API + DB seed data theo schema giống production |
| Viết tài liệu handoff chi tiết cho DEV-C | Hướng dẫn implement Outbox Pattern trong tech stack của họ |
| Demo "as if" với mock — chứng minh pattern khả thi | Video recording + live demo |

#### 🎯 CHECKPOINT 3 — Cuối tuần 6

- ✅ Báo cáo load test: con số cụ thể event-delta vs pull (bằng số thực đo)
- ✅ Live demo với DEV-C thật (Plan A) HOẶC handoff doc + mock demo (Plan B)
- ✅ Demo: 1 vendor mới onboard chỉ cần 1-2 ngày code

**Câu hỏi business cần trả lời**:
1. "Có chứng minh được pattern này scale tốt không?" → Load test report
2. "DEV-C có hợp tác được không?" → Đây là indicator chính trị quan trọng
3. "Tích hợp vendor mới có nhanh thật không?" → Đo thời gian onboard DevCSimulator

---

### 🟣 Sprint 4 (Tuần 7-8) — Polish & Handover

**Mục tiêu**: Hoàn thiện để có thể chuyển giao + chuẩn bị tài liệu cho giai đoạn full production.

#### Tuần 7 — Hardening

| Task | Output cụ thể |
|---|---|
| Authentication: API key cho Producer, JWT cho dashboard | Auth middleware .NET |
| Audit log: mọi schema change, mọi DLQ event | Log table + UI page |
| Backup config Kafka topics (Confluent built-in) | Tài liệu config |
| DR test: kill consumer → restart → resume từ offset | Test report + kết quả |
| Code review + refactor | PR checklist completed |
| Unit test + integration test coverage > 60% | Test report |
| Security check: secrets không hardcode | .env + Azure Key Vault setup |

#### Tuần 8 — Documentation & Presentation

| Task | Output cụ thể |
|---|---|
| Runbook vận hành | `docs/runbook.md` — cách restart, debug, alert |
| Schema governance policy (draft) | `docs/schema-governance.md` |
| Vendor contract clause template | `docs/vendor-contract-clauses.md` |
| Architecture Decision Records (5-10 ADR) | `docs/adr/` |
| Cost analysis thực tế 2 tháng | `docs/cost-actual.md` |
| Hand-over doc + onboarding guide | `docs/handover.md` |
| Slide presentation cho ban lãnh đạo (~20 slide) | `presentation/mvp-results.pptx` |
| Buổi demo cuối cùng + Q&A với 3 vendor | Buổi họp chính thức |

#### 🎯 CHECKPOINT 4 — Cuối tuần 8 (Final)

- ✅ Tài liệu đầy đủ, đủ để team mới tiếp quản không cần senior giải thích
- ✅ Buổi demo cho ban lãnh đạo + 3 vendor cùng dự
- ✅ Recommendation chi tiết: có nên go-prod không, lộ trình tiếp theo

**Câu hỏi business cần trả lời**:
1. "Có đủ tự tin đầu tư full production không?"
2. "Vendor có chấp nhận pattern này không?" → Demo cho cả 3 vendor
3. "Chi phí thực tế MVP có khớp dự kiến không?"

---

## D. Chi phí cụ thể MVP (2 tháng)

> Tỷ giá tham chiếu: 1 USD ≈ 25.500 VND

### D.1 Cloud Infrastructure

| Dịch vụ | Tier | Chi phí/tháng | 2 tháng |
|---|---|---|---|
| **Confluent Cloud Kafka** | Basic (~$200-300/tháng) | 5-7.5M VND | 10-15M VND |
| **Confluent Schema Registry** | Included trong Basic | $0 | $0 |
| **Azure App Service** | B1 × 2 services | 660k VND | 1.3M VND |
| **Azure Static Web Apps** (React) | Free tier | $0 | $0 |
| **Azure PostgreSQL Flexible** | B1ms (1vCPU/2GB/32GB) | 640k VND | 1.3M VND |
| **Azure Cache for Redis** | Basic C0 (250MB) | 410k VND | 820k VND |
| **Grafana Cloud** | Free tier | $0 | $0 |
| **GitHub Actions** | 2000 phút/tháng free | $0 | $0 |
| **Domain + SSL** (Cloudflare) | Free SSL + ~$10 domain | 25k VND | 50k VND |
| **Egress / misc** | ~10% phụ phí | 800k VND | 1.6M VND |
| **Tổng cloud** | | **~7.5-9.5M VND/tháng** | **~15-19M VND** |

> **Lưu ý**: Confluent Cloud có **$400 credit free trial** lần đầu signup → tháng 1 gần như miễn phí cloud.

### D.2 Nhân sự — Senior Freelance

| Loại hợp đồng | Chi phí/tháng | 2 tháng | Ghi chú |
|---|---|---|---|
| **Full-time** (160-180h/tháng) | 50-70M VND | 100-140M VND | **Khuyến nghị** |
| Part-time (~80h/tháng) | 25-35M VND | 50-70M VND | MVP sẽ kéo thành 3-4 tháng |
| Phụ phí (thiết bị, license, learning) | 2-3M VND | 4-6M VND | |

> **Lý do không chọn part-time**: Sẽ mất momentum, sprint bị chậm, 8 tuần thành 16 tuần.

### D.3 Tools & Licenses

| Tool | Chi phí 2 tháng | Ghi chú |
|---|---|---|
| JetBrains Rider (.NET IDE) | 1.5M VND | License tháng |
| Postman Team / Bruno | Free / 1M VND | API testing |
| Figma | Free | Dashboard mockup |
| Draw.io / Lucidchart | Free | Architecture diagrams |
| Notion / Outline | Free / 1M VND | Documentation |
| **Tổng tools** | **~2.5-4M VND** | |

### D.4 Tổng chi phí MVP 2 tháng

| Hạng mục | Min | Max |
|---|---|---|
| Senior freelance (full-time 2 tháng) | 100M VND | 140M VND |
| Cloud infrastructure | 15M VND | 19M VND |
| Tools & licenses | 2.5M VND | 4M VND |
| Dự phòng (10%) | 12M VND | 16M VND |
| **Tổng MVP** | **~130M VND** | **~180M VND** |

### D.5 So sánh ROI

| Chi phí | Số tiền | Kết quả |
|---|---|---|
| Chi phí ẩn hiện tại (3 tháng đàm phán DEV-A↔DEV-C chưa xong) | ~200-400M VND | Không có kết quả cụ thể |
| **MVP Integration Hub** | **~130-180M VND** | Chứng minh được pattern, có code, có tài liệu, có người biết |

> Đầu tư MVP **rẻ hơn** chi phí ẩn đang trả, lại cho ra **evidence** để quyết định 1.4 tỷ/năm tiếp theo.

---

## E. Bảng theo dõi tiến độ — Mẫu cho mỗi 2 tuần

Dán bảng này lên Notion/Excel để Công ty A tự verify mỗi checkpoint:

```
SPRINT: ___  |  TUẦN: ___-___  |  NGÀY REVIEW: ___/___/2026
NGƯỜI REVIEW: ___________________

────────────────────────────────────────────────────
✅ TASKS HOÀN THÀNH
  □ ...
  □ ...

🟡 TASKS ĐANG LÀM (ghi lý do chậm nếu có)
  □ ...

🔴 BLOCKERS (ghi cần ai action)
  □ ...
────────────────────────────────────────────────────
📊 METRICS (đo lường được)
  - Số event chảy qua hub (7 ngày qua): ___
  - Uptime hub: ___%
  - DLQ rate: ___%
  - Số schema đã định nghĩa: ___
  - Số vendor đã kết nối: ___

💰 BUDGET STATUS
  - Đã chi cloud: ___ / dự kiến ___ / còn lại ___
  - Đã chi senior: ___ / dự kiến ___ / còn lại ___
  - Tổng đã chi: ___ / ngân sách tổng ___
────────────────────────────────────────────────────
🎯 DEMO ĐÃ CHẠY (✅ = pass, ❌ = fail, ⏳ = chưa làm)
  □ Demo chính Sprint X theo checklist
  □ Issues phát hiện trong demo:
    - ...

📝 QUYẾT ĐỊNH CẦN BAN LÃNH ĐẠO (ghi rõ deadline)
  □ ...

➡️ KẾ HOẠCH 2 TUẦN TIẾP
  □ ...
  □ ...
────────────────────────────────────────────────────
```

---

## F. Rủi ro & cách xử lý

| Rủi ro | Mức | Trigger phát hiện sớm | Cách xử lý |
|---|---|---|---|
| DEV-C không hợp tác Sprint 3 | 🔴 Cao | Tuần 5 chưa có response DEV-C | Chuyển Plan B (mock) — không block MVP |
| Senior nghỉ giữa chừng | 🔴 Cao | Velocity giảm 2 sprint liền | Ràng buộc hợp đồng + yêu cầu handover docs từ tuần 2 |
| Confluent Cloud cost vượt dự kiến | 🟡 Trung | Tuần 2 đã chi > $150 | Throttle test data, tận dụng $400 free trial credit |
| Schema design sai phải làm lại | 🟡 Trung | Cuối Sprint 2 có > 3 schema thay đổi breaking | Schema review meeting trước khi code, không để senior tự decide |
| Ban lãnh đạo không hiểu demo kỹ thuật | 🟡 Trung | Checkpoint 1 lãnh đạo không hỏi câu nào | Đơn giản hóa narrative, dùng analogy "bảng tin chợ" |
| Senior over-engineering, chưa có "Hello Event" | 🟡 Trung | Tuần 2 kết thúc chưa có end-to-end chạy | Hỏi thẳng: "Tôi có thể tạo invoice và thấy ở Consumer không?" |
| Vendor khác (DEV-A, B) phản đối pattern | 🟢 Thấp | Checkpoint 4 demo có vendor không tham gia | Tín hiệu chính trị → giải quyết ở leadership level, không phải kỹ thuật |

---

## G. 5 câu hỏi tự kiểm tra trước khi bắt đầu

**Phải trả lời đủ 5 câu trước khi ký hợp đồng senior + bắt đầu chi tiền:**

| # | Câu hỏi | Cần ai trả lời | Trạng thái |
|---|---|---|---|
| 1 | Có **130-180M cho 2 tháng** sẵn sàng không? | CFO | □ |
| 2 | Senior **commit full-time** trong 2 tháng (không nhận project khác)? | HR + Senior | □ |
| 3 | DEV-C có ít nhất **1 người contact** sẵn sàng họp Sprint 3? | Account manager | □ |
| 4 | Có **người internal Công ty A** (IT lead) tham gia review hàng tuần? | CTO Công ty A | □ |
| 5 | Ban lãnh đạo **chấp nhận MVP không lên production ngay** sau 8 tuần? | Ban lãnh đạo | □ |

> Nếu trả lời **"Không"** cho bất kỳ câu nào → fix trước khi bắt đầu, đừng đốt tiền.

---

## H. Bottom line

> **MVP 2 tháng — 130-180M VND — chứng minh được 4 giả thuyết kỹ thuật cốt lõi. Sau đó Công ty A có đủ data + confidence để quyết định có go-prod (đầu tư 800M-1.4 tỷ/năm) hay không.**

> **Không build MVP = quyết định 1.4 tỷ/năm dựa trên niềm tin. Build MVP = quyết định dựa trên evidence.**

### Số liệu quan trọng nhất

| Số liệu | Ý nghĩa |
|---|---|
| **8 tuần** | Từ "không có gì" → "demo được cho ban lãnh đạo" |
| **4 checkpoint** | Mỗi 2 tuần verify tiến độ, phát hiện vấn đề sớm |
| **~150M VND** | Đầu tư MVP — rẻ hơn chi phí ẩn 3 tháng đàm phán hiện tại |
| **1 senior** | Đủ với scope MVP (không cần cả team) |
| **0** | Số dòng code phải viết bởi 3 vendor trong giai đoạn MVP |
| **4** | Số giả thuyết được prove — đủ để go/no-go production |

### Timeline tóm tắt

```
Tuần 1-2  │ 🔵 Sprint 1 │ Foundation + First Event end-to-end
Tuần 3-4  │ 🟢 Sprint 2 │ Dashboard UI + Multiple event types
Tuần 5-6  │ 🟡 Sprint 3 │ Load test + DEV-C thật (hoặc mock)
Tuần 7-8  │ 🟣 Sprint 4 │ Hardening + Documentation + Final demo
           │             │
           ▼             ▼
         Checkpoint    GO / NO-GO
         mỗi 2 tuần   Production
```

---

*Tài liệu này là kế hoạch thực thi MVP. Để xem chiến lược dài hạn, xem [company-a-digital-strategy-synthesis.md](./company-a-digital-strategy-synthesis.md).*
