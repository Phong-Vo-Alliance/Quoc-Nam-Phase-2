# Bug Fix: Empty State Shown While Loading Categories

**Bug ID:** `empty-state-shown-while-loading-20260131`  
**Date Reported:** 2026-01-31  
**Date Implemented:** 2026-02-02  
**Status:** ✅ **IMPLEMENTED** (Ready for Testing)  
**Severity:** 🔴 **HIGH** (Poor UX affecting all users)

---

## 📋 Quick Summary

**Problems Fixed:**

1. Empty state flash during categories loading
2. Stale cached messages displayed during loading
3. Category not auto-selected on reload

**Root Causes:**

- Missing `categoriesQuery.isLoading` check in empty state condition
- React Query cached data used without staleness check
- No auto-detect logic to find category from conversationId

**Solutions Implemented:**

1. Combined categories and messages loading checks
2. Added safeguard against stale cached messages
3. Auto-detect category from conversationId on reload

---

## 📂 Documentation Structure

```
empty-state-shown-while-loading-20260131/
├── README.md                    # 👈 You are here
├── bug_report.md                # Detailed root cause analysis
├── implementation_plan.md       # Code changes and steps
├── testing_plan.md              # Test cases and coverage
└── CHANGELOG.md                 # Version history
```

---

## 📖 Reading Order (Recommended)

### For HUMAN Reviewer:

1. **[bug_report.md](./bug_report.md)** (10 min read)
   - Understand the bug symptoms
   - Review root cause analysis
   - See timeline of bug occurrence
   - Compare current vs expected behavior

2. **[implementation_plan.md](./implementation_plan.md)** (15 min read)
   - Review proposed solution (Solution 3)
   - Check impact summary
   - **IMPORTANT:** Fill pending decisions table
   - Approve implementation

3. **[testing_plan.md](./testing_plan.md)** (10 min read)
   - Review test coverage matrix
   - Check new test cases
   - **IMPORTANT:** Fill pending decisions table
   - Approve test plan

4. **[CHANGELOG.md](./CHANGELOG.md)** (2 min read)
   - Track progress and next steps

### For AI Developer:

1. Read all documents in order
2. Wait for HUMAN approval on implementation_plan.md
3. Wait for HUMAN approval on testing_plan.md
4. Only after BOTH approved → Implement code changes
5. Update CHANGELOG.md after each milestone

---

## 🎯 Current Status

### Implementation Complete ✅

**Date:** 2026-02-02  
**Approved by:** MINH  
**Status:** All fixes implemented, ready for testing

### Fixes Implemented

| Fix  | Description                    | Status  | File                  |
| ---- | ------------------------------ | ------- | --------------------- |
| v3.0 | Combined loading states check  | ✅ Done | ChatMainContainer.tsx |
| v3.1 | Stale messages safeguard       | ✅ Done | ChatMainContainer.tsx |
| v3.2 | Category auto-detect on reload | ✅ Done | ChatMainContainer.tsx |

### Documents

| Document                                                     | Status      | Last Updated |
| ------------------------------------------------------------ | ----------- | ------------ |
| [bug_report.md](./bug_report.md)                             | ✅ Complete | 2026-02-02   |
| [implementation_plan.md](./implementation_plan.md)           | ✅ Approved | 2026-02-02   |
| [testing_plan.md](./testing_plan.md)                         | ✅ Approved | 2026-02-02   |
| [stale_messages_analysis.md](./stale_messages_analysis.md)   | ✅ Complete | 2026-02-02   |
| [category_auto_detect_fix.md](./category_auto_detect_fix.md) | ✅ Complete | 2026-02-02   |
| [CHANGELOG.md](./CHANGELOG.md)                               | ✅ Updated  | 2026-02-02   |

### Code Changes Summary

**Total:** ~155 lines changed in ChatMainContainer.tsx

1. **Loading State (Lines ~1313-1350):**
   - Combined `categoriesQuery.isLoading || messagesQuery.isLoading`
   - Conditional ChatHeader props based on loading state

2. **Categories Error Handling (Lines ~1352-1403):**
   - New error state for categories failures
   - Retry button with refetch functionality

3. **Empty State Check (Lines ~1405-1415):**
   - Added `!categoriesQuery.isLoading` condition
   - Only shows when truly empty and loaded

4. **Messages Safeguard (Lines ~690-705):**
   - useMemo with staleness checks
   - Returns empty array during loading or non-success states

5. **Auto-Detect Category (Lines ~360-410):**
   - useEffect to find category from conversationId
   - Auto-select and save to localStorage
   - Notify parent via onChatChange

---

## 📚 Complete Fix Documentation

### Primary Issue: Empty State During Loading

**Document:** [bug_report.md](./bug_report.md)  
**Analysis:** [implementation_plan.md](./implementation_plan.md)

**Problem:** Empty state shown while categories loading  
**Solution:** Combined loading state check  
**Impact:** Fixed confusing UX flash

### Secondary Issue: Stale Cached Messages

**Document:** [stale_messages_analysis.md](./stale_messages_analysis.md)

**Problem:** React Query cached messages displayed during loading  
**Solution:** Added staleness checks in messages derivation  
**Impact:** Prevents wrong conversation messages from showing

### Tertiary Issue: Category Not Auto-Selected

**Document:** [category_auto_detect_fix.md](./category_auto_detect_fix.md)

**Problem:** Conversation shown without category context on reload  
**Solution:** Auto-detect category from conversationId  
**Impact:** Restores proper category context on page reload

---

## 🎯 Next Steps

### Manual Testing Required ⏳

Please test the following scenarios to verify all fixes:

#### Test 1: Reload with Category Selected

1. Open chat, select category, select conversation
2. **Reload page (F5)**
3. ✅ Expected: Loading skeleton → correct messages
4. ❌ Bug (if not fixed): Empty state or stale messages flash

#### Test 2: Slow Network Simulation

1. DevTools → Network → Slow 3G
2. Reload page with category selected
3. ✅ Expected: Loading skeleton for 3-5 seconds
4. ❌ Bug (if not fixed): Empty state or stale messages

#### Test 3: Category Auto-Detect

1. Open Group 3 in category 22334455
2. Reload page
3. ✅ Expected: Group 3 shows INSIDE category 22334455
4. ❌ Bug (if not fixed): Group 3 shows as standalone

#### Test 4: Categories Error Handling

1. Mock categories API to return error
2. ✅ Expected: Error message with retry button
3. Click retry → Should refetch categories

---

## 📊 Bug Overview

### Affected Component

[ChatMainContainer.tsx](../../../src/features/portal/components/chat/ChatMainContainer.tsx)

**Lines Modified:**

- ~690-705: Messages safeguard
- ~360-410: Auto-detect category
- ~1313-1415: Loading/error/empty state checks

### User Impact Before Fix

- **Who:** All users opening chat with category selected
- **When:** Every page load / reload
- **What:** See confusing "no conversations" message OR stale messages
- **Impact:** Poor UX, appears buggy, confusing

### User Impact After Fix

- ✅ Smooth loading experience with skeleton
- ✅ No stale messages from cache
- ✅ Category context preserved on reload
- ✅ Clear error handling with retry

### Technical Impact

- **Files to modify:** 1 (ChatMainContainer.tsx)
- **Lines changed:** ~60 (refactor conditional renders)
- **Test cases:** 6 new + 2 updated
- **Breaking changes:** None

---

## 🔄 Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Bug Analysis (COMPLETED ✅)                         │
│ - Created bug_report.md with root cause                     │
│ - Analyzed data flow during loading                         │
│ - Identified exact code location                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Solution Design (COMPLETED ✅)                      │
│ - Created implementation_plan.md                            │
│ - Evaluated 3 solution options                              │
│ - Selected Solution 3 (most comprehensive)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Test Planning (COMPLETED ✅)                        │
│ - Created testing_plan.md                                   │
│ - Designed 8 test cases (6 new + 2 updates)                 │
│ - Created test coverage matrix                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: HUMAN Review (⏳ PENDING)                           │
│ - [ ] Review implementation_plan.md                         │
│ - [ ] Fill pending decisions                                │
│ - [ ] Approve implementation                                │
│ - [ ] Review testing_plan.md                                │
│ - [ ] Approve test plan                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Implementation (🔜 NEXT)                            │
│ - Modify ChatMainContainer.tsx                              │
│ - Add categories loading check                              │
│ - Add categories error handling                             │
│ - Update ChatHeader props logic                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Testing (🔜 NEXT)                                   │
│ - Add 6 new test cases                                      │
│ - Update 2 existing tests                                   │
│ - Run full test suite                                       │
│ - Manual QA with Slow 3G                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Deployment (🔜 LATER)                               │
│ - Commit changes                                            │
│ - Create PR                                                 │
│ - Code review                                               │
│ - Merge and deploy                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Related

- **Feature:** CBN-002 - Category-Based Conversation Selector
- **Components:** ChatMainContainer, EmptyCategoryState
- **Hooks:** useCategories, useMessages
- **Parent Folder:** [docs/bugfixes/](../)

---

## 📝 Notes for HUMAN Reviewer

### What to Focus On

1. **implementation_plan.md:**
   - Does Solution 3 make sense?
   - Is the error handling approach correct?
   - Fill all pending decisions (wording, naming, etc.)

2. **testing_plan.md:**
   - Is test coverage sufficient?
   - Are test cases realistic?
   - Should we add E2E test?

### Quick Approval Checklist

- [ ] Read bug_report.md root cause analysis
- [ ] Review implementation_plan.md solution
- [ ] Fill pending decisions in implementation_plan.md
- [ ] Check "APPROVED để thực thi" in implementation_plan.md
- [ ] Review testing_plan.md test cases
- [ ] Fill pending decisions in testing_plan.md
- [ ] Check "APPROVED để thực thi" in testing_plan.md

### Questions to Consider

1. Should categories error take precedence over messages error?
2. What should ChatHeader show during categories loading? (empty dropdown or hide it?)
3. Do we need E2E test for this scenario?
4. Should we add telemetry to track how often this happens?

---

## 📞 Contact

**Reported by:** HUMAN  
**Analyzed by:** AI (GitHub Copilot - Claude Sonnet 4.5)  
**Date Created:** 2026-02-02

---

**Status Update:** Waiting for HUMAN to review and approve implementation + testing plans.
