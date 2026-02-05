# 📋 Message Reply Feature - Documentation Summary

> **Created:** 2026-02-03  
> **Status:** ⏳ PENDING HUMAN REVIEW  
> **Next Action:** Review và approve BƯỚC 1 requirements

---

## 🎯 What Was Created

Tôi đã tạo **initial documentation structure** cho tính năng Message Reply theo đúng quy trình Feature Development Workflow (7 bước).

---

## 📁 Folder Structure

```
docs/
├── modules/chat/features/message-reply/
│   ├── 00_README.md               ✅ Feature overview & navigation
│   └── 01_requirements.md         ⏳ Requirements & acceptance criteria
│
└── api/chat/messages/reply-to-message/
    ├── contract.md                ⏳ API specification
    └── snapshots/v1/
        └── README.md              ⏳ Hướng dẫn capture snapshots
```

---

## 📄 Documents Created

### 1. ✅ [00_README.md](./00_README.md)

**Purpose:** Feature overview & documentation index  
**Status:** Complete - No approval needed  
**Content:**

- Feature summary & user stories
- Document structure table
- Related API links
- Development workflow diagram

---

### 2. ⏳ [01_requirements.md](./01_requirements.md)

**Purpose:** Detailed requirements & acceptance criteria  
**Status:** **PENDING HUMAN APPROVAL**  
**Content:**

- ✅ 3 User stories (US-1 to US-3)
- ✅ 16 Functional requirements (FR-1 to FR-4)
- ✅ 3 UI/UX requirements with diagrams
- ✅ 5 Technical requirements
- ✅ 4 Security requirements
- ✅ 4 Performance requirements
- ✅ Impact summary (10 files to create, 6 files to modify)
- ✅ **8 Pending decisions** cho HUMAN

**⚠️ CRITICAL - HUMAN ACTION REQUIRED:**

HUMAN cần điền **8 pending decisions** trong section "PENDING DECISIONS":

| #   | Decision                  | Options                                                                          |
| --- | ------------------------- | -------------------------------------------------------------------------------- |
| 1   | Reply button icon         | ⤴️ (curved arrow) OR 💬 (bubble)?                                                |
| 2   | Parent preview max height | 2 lines OR 3 lines?                                                              |
| 3   | Scroll animation          | 500ms smooth OR instant?                                                         |
| 4   | Highlight color           | Yellow #FFF9C4 OR Blue #E3F2FD?                                                  |
| 5   | Mobile reply trigger      | Long press (500ms) OR swipe left?                                                |
| 6   | Thread view in Phase 1?   | Yes (complex) OR No (defer)?                                                     |
| 7   | Keyboard shortcut         | `R` key OR other?                                                                |
| 8   | API approach              | `POST /api/messages` với `parentMessageId` OR `POST /api/messages/{id}/replies`? |

**How to approve:**

1. Mở file [01_requirements.md](./01_requirements.md)
2. Scroll đến section "⏳ PENDING DECISIONS"
3. Điền lựa chọn vào cột "HUMAN Decision" (e.g., `⤴️`, `2 lines`, etc.)
4. Scroll đến section "✅ HUMAN CONFIRMATION"
5. Tick checkboxes:
   - [x] Đã review Impact Summary
   - [x] Đã điền Pending Decisions
   - [x] **APPROVED để thực thi**
6. Điền signature và date
7. Yêu cầu AI tiếp tục sang BƯỚC 2

---

### 3. ⏳ [API Contract](../../../api/chat/messages/reply-to-message/contract.md)

**Purpose:** API specification cho reply feature  
**Status:** **PENDING SNAPSHOTS**  
**Content:**

- ✅ 2 endpoint options (dedicated `/replies` OR generic `/messages`)
- ✅ Request/response schemas (TypeScript interfaces)
- ✅ Validation rules (7 rules)
- ✅ Error responses (400, 403, 404)
- ✅ Real-time SignalR events
- ⚠️ **Missing:** JSON snapshots

**HUMAN ACTION REQUIRED:**

Tạo snapshots bằng cách call API thực tế:

```bash
# Success case
curl -X POST https://vega-chat-api-dev.allianceitsc.com/api/messages/550e8400-e29b-41d4-a716-446655440000/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This is my reply"}' > success.json
```

Hoặc yêu cầu AI tạo mock snapshots (ít tin cậy hơn).

---

## 🚦 Current Status

### ✅ Completed (BƯỚC 0)

- Feature overview document
- Requirements document structure
- API contract document
- Snapshots folder structure

### ⏳ Pending HUMAN Action (BƯỚC 1)

**Task 1:** Review và approve [01_requirements.md](./01_requirements.md)

- Read all functional requirements
- Điền 8 pending decisions
- Tick approval checkboxes

**Task 2:** Provide API snapshots (optional but recommended)

- Capture real API responses
- OR request AI to create mocks

### 🔒 Blocked (Cannot proceed until BƯỚC 1 approved)

- BƯỚC 2A: Wireframe
- BƯỚC 2B: Flow
- BƯỚC 3: API Contract approval
- BƯỚC 4: Implementation Plan
- BƯỚC 5: Coding

---

## 📊 Requirements Overview

### Scope Summary

| Category                 | Count  | Details                         |
| ------------------------ | ------ | ------------------------------- |
| User Stories             | 3      | Reply, View Parent, Reply Count |
| Functional Requirements  | 16     | FR-1 to FR-4                    |
| UI/UX Requirements       | 3      | Hover, Input, Bubble            |
| Technical Requirements   | 5      | API, Data, State                |
| Security Requirements    | 4      | Validation, Auth, Sanitize      |
| Performance Requirements | 4      | Animation, Scroll, Real-time    |
| **Total**                | **35** | **Requirements defined**        |

### Files Impact Summary

| Action           | Count    | Details                          |
| ---------------- | -------- | -------------------------------- |
| **Create**       | 10 files | Components, hooks, stores, tests |
| **Modify**       | 6 files  | Existing components + types      |
| **Delete**       | 0 files  | No breaking changes              |
| **Dependencies** | 0 new    | Use existing stack               |

### Decision Impact

**8 Pending Decisions** will determine:

- UI appearance (icon, colors, layout)
- UX behavior (animations, gestures)
- Technical approach (API endpoint choice)
- Scope (Phase 1 vs Phase 2)

---

## 🎯 Next Steps for HUMAN

### Step 1: Review Requirements (15-20 minutes)

1. Open [01_requirements.md](./01_requirements.md)
2. Read sections 1-7 (Description → Constraints)
3. Verify tính năng có đúng ý đồ không

### Step 2: Make Decisions (5-10 minutes)

Fill trong bảng PENDING DECISIONS:

```markdown
| 1 | Reply button icon | ⤴️ hoặc 💬? | ⬜ ⤴️ | ← Example: Choose ⤴️
| 2 | Parent preview max height | 2 lines or 3 lines? | ⬜ 3 lines |
... (tiếp tục cho 8 decisions)
```

### Step 3: Approve (1 minute)

Tick checkboxes trong section "✅ HUMAN CONFIRMATION":

```markdown
| Đã review Impact Summary | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền |
| **APPROVED để thực thi** | ✅ APPROVED |

**HUMAN Signature:** [Your Name]  
**Date:** [2026-02-03]
```

### Step 4: Request Next Step

Yêu cầu AI:

```
Tôi đã approve BƯỚC 1 requirements. Tiếp tục BƯỚC 2A: Wireframe
```

---

## 📌 Important Notes

### ⚠️ AI Will NOT Proceed Without Approval

Theo CRITICAL RULES:

- AI KHÔNG ĐƯỢC tạo code nếu requirements chưa approve
- AI KHÔNG ĐƯỢC guess decisions - HUMAN phải điền
- AI PHẢI tuân thủ quy trình 7 bước

### ✅ What HUMAN Gets After Approval

Once BƯỚC 1 approved → AI sẽ tạo:

- **BƯỚC 2A:** Wireframe với responsive designs (Desktop/Tablet/Mobile)
- **BƯỚC 2B:** Flow diagrams (User interactions)
- **BƯỚC 3:** API Contract finalization (với snapshots)
- **BƯỚC 4:** Implementation Plan (detailed tasks)
- **BƯỚC 5:** Actual code implementation
- **BƯỚC 6:** Test requirements & coverage
- **BƯỚC 7:** E2E testing (optional)

### 🔄 Can Change Later

Nếu sau này HUMAN muốn thay đổi decisions:

- Create `v2/` folder trong docs
- Document migration guide
- Không breaking existing implementation

---

## 📞 Contact for Questions

Nếu có thắc mắc về:

- **Requirements:** Review sections trong [01_requirements.md](./01_requirements.md)
- **API Spec:** Check swagger at https://vega-chat-api-dev.allianceitsc.com/swagger
- **Decisions:** Ask AI to explain implications của từng choice

---

## ✅ Review Checklist for HUMAN

Before approving, ensure:

- [ ] Feature description đúng với yêu cầu ban đầu
- [ ] User stories cover tất cả use cases
- [ ] Functional requirements complete (không thiếu case quan trọng)
- [ ] UI/UX mockups dễ hiểu
- [ ] Technical approach reasonable (không over-engineering)
- [ ] Impact summary realistic (files to create/modify)
- [ ] **All 8 pending decisions filled**
- [ ] Approval checkbox ticked

---

**Status:** ⏳ WAITING FOR HUMAN APPROVAL  
**Blocker:** 8 pending decisions cần HUMAN input  
**Estimated Review Time:** 20-30 minutes  
**Expected AI Time After Approval:** 2-3 hours for BƯỚC 2-4

---

**Created by:** AI Assistant  
**Date:** 2026-02-03  
**Version:** 1.0.0
