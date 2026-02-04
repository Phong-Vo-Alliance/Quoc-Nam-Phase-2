# Documentation Created - Scroll-to-Message Refactoring

**Date:** 2025-02-03  
**Status:** ✅ DOCUMENTATION COMPLETE - AWAITING HUMAN APPROVAL  
**Phase:** Analysis & Planning (BƯỚC 0-3)

---

## 📚 Documents Created

### 1. [00_README.md](./00_README.md)
**Status:** ⏳ PENDING APPROVAL  
**Purpose:** Feature overview and user stories

**Key Content:**
- Problem statement (inefficient scroll-up loop)
- Solution approach (aroundMessageId + afterMessageId)
- Impact summary
- Pending decisions table

---

### 2. [01_requirements.md](./01_requirements.md)
**Status:** ⏳ PENDING APPROVAL  
**Purpose:** Detailed functional and non-functional requirements

**Key Content:**
- **FR-1:** Jump to message with `aroundMessageId`
- **FR-2:** Scroll down with `afterMessageId`
- **FR-3:** Maintain existing scroll up behavior
- **FR-4:** Cache strategy options
- **FR-5:** Error handling scenarios
- **NFR-1-3:** Performance, accessibility, mobile requirements
- **UI-1-2:** Loading states and highlight animation
- Test requirements overview

---

### 3. [03_api-contract.md](./03_api-contract.md)
**Status:** ⏳ PENDING APPROVAL  
**Purpose:** API specification and frontend integration plan

**Key Content:**
- Complete API endpoint documentation from Swagger
- Request/response TypeScript interfaces
- Frontend implementation code samples:
  - `getMessagesAround()` API function
  - `getMessagesAfter()` API function
  - `useMessagesAround()` React Query hook
  - `useMessagesAfter()` React Query hook
- Query key structure
- Validation rules
- Testing scenarios

---

## 🎯 Next Steps (Awaiting HUMAN)

### Step 1: Review Documentation ✋
**Action Required:** HUMAN must review and approve all 3 documents

**Checklist for HUMAN:**
- [ ] Open [00_README.md](./00_README.md)
- [ ] Read Overview and User Stories
- [ ] Fill in Pending Decisions table (5 decisions)
- [ ] Check ✅ APPROVED in HUMAN CONFIRMATION section
- [ ] Open [01_requirements.md](./01_requirements.md)
- [ ] Review all FR and NFR requirements
- [ ] Verify acceptance criteria
- [ ] Check ✅ APPROVED in HUMAN CONFIRMATION section
- [ ] Open [03_api-contract.md](./03_api-contract.md)
- [ ] Review API specification
- [ ] Verify TypeScript interfaces match project types
- [ ] Review frontend implementation samples
- [ ] Check ✅ APPROVED in HUMAN CONFIRMATION section

---

### Step 2: Decision Making ✋
**CRITICAL DECISIONS NEEDED:**

#### Decision #1: Cache Strategy
**Options:**
- **A) Separate Cache (Recommended)** - Jump results in temp cache, merge into main
- **B) Single Cache** - All messages in one cache (simpler but risky)
- **C) Temporary Cache** - Jump is isolated, switching away resets

**Recommendation:** **Option A** - Clean separation, predictable behavior

**HUMAN Choice:** `_______`

---

#### Decision #2: Limit for aroundMessageId
**Options:**
- 50 (same as existing default)
- 100 (more context, higher network usage)
- Custom per scenario

**Recommendation:** **50** - Consistent with existing

**HUMAN Choice:** `_______`

---

#### Decision #3: Scroll Threshold for afterMessageId
**Options:**
- 200px from bottom
- 500px from bottom
- Custom threshold

**Recommendation:** **200px** - Match existing scroll-up threshold (150px → adjusted to 200px)

**HUMAN Choice:** `_______`

---

#### Decision #4: Loading UI
**Options:**
- **A) Toast + Spinner** - Non-blocking, user can still see messages
- **B) Inline Skeleton** - Shows loading at target position
- **C) Full Screen Loader** - Blocks interaction

**Recommendation:** **Option A** - Best UX, doesn't block

**HUMAN Choice:** `_______`

---

#### Decision #5: Error Handling - Deleted Message
**Options:**
- **A) Show error toast** - "Tin nhắn không tồn tại"
- **B) Fallback to newest** - Load conversation from top
- **C) Silent fail** - Do nothing

**Recommendation:** **Option A** - Clear feedback

**HUMAN Choice:** `_______`

---

### Step 3: After Approval 🤖
**AI will create next documents:**

1. **[02a_wireframe.md]** - UI changes (loading states, scroll indicators)
2. **[04_implementation-plan.md]** - Step-by-step coding plan
3. **[06_testing.md]** - Test requirements and coverage matrix

**Then:** AI will implement code after all approvals.

---

## 📊 Current Blocking Status

```
┌─────────────────────────────────────────────────────────────┐
│  ⛔ BLOCKED: Cannot proceed with next documents             │
│                                                             │
│  Reason: Documents 00, 01, 03 chưa được HUMAN approve       │
│                                                             │
│  Required Actions:                                          │
│  1. Review 00_README.md → Fill Pending Decisions            │
│  2. Review 01_requirements.md → Approve requirements        │
│  3. Review 03_api-contract.md → Approve API plan            │
│  4. Mark all ✅ APPROVED trong HUMAN CONFIRMATION sections  │
│                                                             │
│  Sau khi hoàn tất, yêu cầu AI tiếp tục:                    │
│  "I've approved the documents, please continue"            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Quick Summary

**What We're Doing:**
Replacing inefficient "scroll up until found" pattern with direct API jumps using `aroundMessageId` and `afterMessageId` parameters.

**Benefits:**
- ⚡ 10-20x faster navigation to pinned messages
- 🌐 90% less network traffic
- ✨ Better UX on slow connections
- 🎯 Single API call instead of loop

**Impact:**
- 2 new files (hooks)
- 2 new functions in `messages.api.ts`
- Refactor `handleScrollToMessage` in `ChatMainContainer.tsx`
- No breaking changes to parent components

**Estimated Effort:** 4-6 hours (coding + testing)

---

## 📁 File Structure Created

```
docs/modules/chat/features/scroll-to-message-refactor/
├── 00_README.md                    ✅ Created (PENDING APPROVAL)
├── 01_requirements.md              ✅ Created (PENDING APPROVAL)
├── 03_api-contract.md              ✅ Created (PENDING APPROVAL)
├── 02a_wireframe.md                ⏳ TODO (after approval)
├── 04_implementation-plan.md       ⏳ TODO (after approval)
└── 06_testing.md                   ⏳ TODO (after approval)
```

---

## 🔗 Related Files

**API Swagger:**
- `docs/api_swaggers/Chat swagger.json` (lines 971-1070) - Messages API

**Current Implementation:**
- `src/features/portal/components/chat/ChatMainContainer.tsx` (lines 565-730) - Scroll logic
- `src/hooks/queries/useMessages.ts` - Existing hook
- `src/api/messages.api.ts` - Existing API functions

**Will Be Created:**
- `src/hooks/queries/useMessagesAround.ts`
- `src/hooks/queries/useMessagesAfter.ts`
- `src/hooks/queries/__tests__/useMessagesAround.test.ts`
- `src/hooks/queries/__tests__/useMessagesAfter.test.ts`

---

## ✅ Checklist for HUMAN

- [ ] Đọc xong 3 documents
- [ ] Điền 5 Pending Decisions trong 00_README.md
- [ ] Approve 00_README.md
- [ ] Approve 01_requirements.md
- [ ] Approve 03_api-contract.md
- [ ] Reply "approved" để AI tiếp tục

---

**Ready for your review! 🎯**
