# [BƯỚC 4] Implementation Plan - Keyboard Shortcuts Enhancement v2

> **Feature:** Mở rộng chặn phím tắt (Ctrl+P, Ctrl+S) + BlockedPage  
> **Module:** Security  
> **Version:** 1.2.0  
> **Status:** ✅ COMPLETED  
> **Created:** 2026-02-25  
> **Completed:** 2026-02-25

---

## 📋 Prerequisites

| Bước | Document                             | Status      |
| ---- | ------------------------------------ | ----------- |
| 1    | [Requirements](./01_requirements.md) | ✅ APPROVED |

---

## 1. Implementation Overview

### 1.1 Scope

| Item                  | Status      |
| --------------------- | ----------- |
| Files mới cần tạo     | 1 (Phase 2) |
| Files cần sửa         | 10          |
| Test files cần update | 1           |
| Actual time           | ~2 giờ      |

### 1.2 File Changes Summary

```
# Phase 1: Keyboard Shortcuts
src/config/env.config.ts           # +20 lines (master + print/save flags)
src/types/security.ts              # +15 lines (PrintSaveProtectionConfig)
src/config/security.config.ts      # +15 lines (print/save configs)
src/hooks/useDevToolsProtection.ts # +24 lines (Ctrl+P/S handlers)
src/hooks/useSecurity.ts           # +5 lines (master flag check)
.env.local.example                 # +12 lines (documentation)

# Phase 2: BlockedPage & Simplification
src/pages/BlockedPage.tsx          # +80 lines (NEW)
src/pages/index.ts                 # +1 line (export)
src/routes/routes.ts               # +1 line (BLOCKED constant)
src/routes/index.tsx               # +5 lines (/blocked route)
src/vite-env.d.ts                  # -1 line (remove VITE_DEVTOOLS_ACTION)
.env.development                   # -2 lines (remove VITE_DEVTOOLS_ACTION)
.env.local                         # -2 lines (remove VITE_DEVTOOLS_ACTION)
.env.local.example                 # -2 lines (remove VITE_DEVTOOLS_ACTION)
```

---

## 2. Implementation Steps - Phase 1: Keyboard Shortcuts

### Step 1: Thêm Ctrl+P Handler

**File:** `src/hooks/useDevToolsProtection.ts`

**Location:** Trong function `handleKeyDown`, sau block PrintScreen

```typescript
// Ctrl+P (Print) - Ngăn in trang
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "p") {
  e.preventDefault();
  e.stopPropagation();
  // Toast message sẽ được điền từ PENDING DECISIONS
  toast.warning("[PENDING_DECISION_1]");
  return false;
}

// Mac: Cmd+P
if (e.metaKey && !e.shiftKey && e.key.toLowerCase() === "p") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("[PENDING_DECISION_1]");
  return false;
}
```

### Step 2: Thêm Ctrl+S Handler

**File:** `src/hooks/useDevToolsProtection.ts`

**Location:** Ngay sau Ctrl+P handlers

```typescript
// Ctrl+S (Save) - Ngăn lưu trang
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "s") {
  e.preventDefault();
  e.stopPropagation();
  // Toast message sẽ được điền từ PENDING DECISIONS
  toast.warning("[PENDING_DECISION_2]");
  return false;
}

// Mac: Cmd+S
if (e.metaKey && !e.shiftKey && e.key.toLowerCase() === "s") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("[PENDING_DECISION_2]");
  return false;
}
```

### Step 3: Thêm Test Cases

**File:** `src/hooks/__tests__/useDevToolsProtection.test.ts`

```typescript
describe("Ctrl+P (Print) blocking", () => {
  it("should prevent Ctrl+P", () => {
    // Test implementation
  });

  it("should show toast when Ctrl+P is pressed", () => {
    // Test implementation
  });

  it("should prevent Cmd+P on Mac", () => {
    // Test implementation
  });
});

describe("Ctrl+S (Save) blocking", () => {
  it("should prevent Ctrl+S", () => {
    // Test implementation
  });

  it("should show toast when Ctrl+S is pressed", () => {
    // Test implementation
  });

  it("should prevent Cmd+S on Mac", () => {
    // Test implementation
  });
});
```

---

## 3. Code Review Checklist

| #   | Check | Description                           |
| --- | ----- | ------------------------------------- |
| 1   | ✅    | `e.preventDefault()` được gọi         |
| 2   | ✅    | `e.stopPropagation()` được gọi        |
| 3   | ✅    | Master flag hoạt động đúng            |
| 4   | ✅    | Mac support với `e.metaKey`           |
| 5   | ✅    | Không conflict với Ctrl+Shift+S đã có |
| 6   | ✅    | BlockedPage renders correctly         |
| 7   | ✅    | DevTools detection works              |
| 8   | ✅    | TypeScript compiles without errors    |

---

## 4. Phase 2: BlockedPage & Simplification

### Step 1: Create BlockedPage

**File:** `src/pages/BlockedPage.tsx` (NEW)

```tsx
// UI component với:
// - Brand color (#38AE3C)
// - Shield icon với animation
// - DevTools detection
// - Conditional button (disabled khi DevTools còn mở)
```

### Step 2: Add Route

**Files:** `src/routes/routes.ts`, `src/routes/index.tsx`

```typescript
// routes.ts
export const ROUTES = {
  BLOCKED: "/blocked",
  // ...
};

// index.tsx
{
  path: ROUTES.BLOCKED,
  element: <BlockedPage />,
}
```

### Step 3: Simplify Architecture

**Changes:**

- Remove `action` field from `DevToolsProtectionConfig`
- Remove `VITE_DEVTOOLS_ACTION` from all env files
- Always redirect to /blocked (no toast/modal)

---

## 5. Rollback Plan

Nếu có vấn đề sau khi deploy:

```typescript
// Option 1: Disable all protections via env
VITE_DEV_ENABLE_ALL_PROTECTIONS = false;

// Option 2: Disable individual protections
VITE_DEV_ENABLE_PRINT_PROTECTION = false;
VITE_DEV_ENABLE_SAVE_PROTECTION = false;
VITE_DEV_ENABLE_DEVTOOLS_PROTECTION = false;
```

---

## 📋 IMPACT SUMMARY

### Files đã tạo mới:

| File                        | Description                             |
| --------------------------- | --------------------------------------- |
| `src/pages/BlockedPage.tsx` | UI trang blocked với DevTools detection |

### Files đã sửa đổi:

| File                                 | Chi tiết thay đổi                               |
| ------------------------------------ | ----------------------------------------------- |
| `src/config/env.config.ts`           | Added master + print/save flags                 |
| `src/types/security.ts`              | Added PrintSaveProtectionConfig, removed action |
| `src/config/security.config.ts`      | Added print/save, removed action config         |
| `src/hooks/useDevToolsProtection.ts` | Added Ctrl+P/S, simplified redirect             |
| `src/hooks/useSecurity.ts`           | Added master flag check                         |
| `src/pages/index.ts`                 | Export BlockedPage                              |
| `src/routes/routes.ts`               | BLOCKED constant                                |
| `src/routes/index.tsx`               | /blocked route                                  |
| `src/vite-env.d.ts`                  | Removed VITE_DEVTOOLS_ACTION                    |
| `.env.development`                   | Removed VITE_DEVTOOLS_ACTION                    |
| `.env.local`                         | Removed VITE_DEVTOOLS_ACTION                    |
| `.env.local.example`                 | New env vars, removed action                    |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status      |
| ------------------------------ | ----------- |
| 01_requirements.md đã APPROVED | ✅ APPROVED |
| Phase 1 completed              | ✅ Done     |
| Phase 2 completed              | ✅ Done     |
| **IMPLEMENTATION COMPLETE**    | ✅ DONE     |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-25

---

## 🔗 Related Documents

- [Requirements](./01_requirements.md) - ✅ APPROVED
- [Progress Tracking](./05_progress.md) - ✅ COMPLETED
- [AI Action Log](../../../../sessions/ai_action_log.md)
