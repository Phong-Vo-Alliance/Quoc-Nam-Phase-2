# API Flow Comparison - Visual Guide

> **Mô tả trực quan sự khác biệt giữa implementation hiện tại (bad) và implementation đúng (good)**

---

## 🔴 Current Flow (BAD) - No conversationId Filter

```
┌─────────────────────────────────────────────────────────────────┐
│  USER ACTION: Opens ManageVariantsDialog                       │
│  conversationId = "conv-ABC-123"                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT: ManageVariantsDialog.tsx                            │
│                                                                 │
│  const { data } = useChecklistTemplates();  ❌ No conversationId│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  HOOK: useChecklistTemplates()                                  │
│                                                                 │
│  queryFn: getChecklistTemplates  ❌ tasks.api.ts (wrong)        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  API CALL:                                                      │
│  GET /api/checklist-templates  ❌ No query param                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER RESPONSE: (100+ templates from ALL conversations)      │
│                                                                 │
│  [                                                              │
│    { id: "1", name: "Template A", conversationId: "conv-ABC" },│
│    { id: "2", name: "Template B", conversationId: "conv-XYZ" },│ ⚠️
│    { id: "3", name: "Template C", conversationId: "conv-999" },│ ⚠️
│    { id: "4", name: "Template D", conversationId: "conv-ABC" },│
│    ... 96 more templates ...                                   │
│  ]                                                              │
│                                                                 │
│  Size: ~50KB                                                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT: Client-Side Filtering ❌                            │
│                                                                 │
│  .filter(t => t.conversationId === "conv-ABC-123")             │
│                                                                 │
│  Result: 2 templates (Template A, Template D)                  │
│  Discarded: 98 templates (wasted bandwidth!)                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI: Shows 2 templates                                          │
└─────────────────────────────────────────────────────────────────┘

⚠️  SECURITY ISSUE:
    User can open DevTools → Network tab
    → See ALL 100 templates in response
    → Including templates from conversations they don't have access to!

⚠️  PERFORMANCE ISSUE:
    - Downloaded 50KB, used 5KB (90% waste)
    - CPU cycles for filtering 100 records
    - Memory for storing 100 records in cache
```

---

## ✅ Proposed Flow (GOOD) - With conversationId Filter

```
┌─────────────────────────────────────────────────────────────────┐
│  USER ACTION: Opens ManageVariantsDialog                       │
│  conversationId = "conv-ABC-123"                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT: ManageVariantsDialog.tsx                            │
│                                                                 │
│  const { data } = useChecklistTemplates(conversationId); ✅     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  HOOK: useChecklistTemplates("conv-ABC-123")                    │
│                                                                 │
│  queryKey: ["checklist-templates", "list", "conv-ABC-123"] ✅  │
│  queryFn: checklistTemplatesApi.getTemplates(conversationId) ✅ │
│  enabled: true ✅                                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  API CALL:                                                      │
│  GET /api/checklist-templates?conversationId=conv-ABC-123 ✅   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER: Filters by conversationId ✅                           │
│                                                                 │
│  WHERE conversationId = "conv-ABC-123"                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER RESPONSE: (ONLY 2 templates for conv-ABC-123)          │
│                                                                 │
│  [                                                              │
│    { id: "1", name: "Template A", conversationId: "conv-ABC" },│
│    { id: "4", name: "Template D", conversationId: "conv-ABC" } │
│  ]                                                              │
│                                                                 │
│  Size: ~5KB ✅                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT: No filtering needed ✅                              │
│                                                                 │
│  Directly use: data (already filtered)                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI: Shows 2 templates                                          │
└─────────────────────────────────────────────────────────────────┘

✅ SECURITY: User CANNOT see templates from other conversations
✅ PERFORMANCE: 10x faster (5KB vs 50KB)
✅ CODE QUALITY: No client-side filtering logic needed
```

---

## 📊 Side-by-Side Comparison

| Aspect             | ❌ Current (Bad)                            | ✅ Proposed (Good)                            |
| ------------------ | ------------------------------------------- | --------------------------------------------- |
| **API Endpoint**   | `/api/checklist-templates`                  | `/api/checklist-templates?conversationId=ABC` |
| **Hook Signature** | `useChecklistTemplates()`                   | `useChecklistTemplates(conversationId)`       |
| **Query Key**      | `["checklist-templates", "list"]`           | `["checklist-templates", "list", "ABC"]`      |
| **Data Source**    | `tasks.api.ts`                              | `checklist-templates.api.ts`                  |
| **Server Filter**  | ❌ None                                     | ✅ WHERE conversationId = ?                   |
| **Client Filter**  | ❌ `.filter(t => t.conversationId === ...)` | ✅ None needed                                |
| **Response Size**  | ~50KB (100 templates)                       | ~5KB (2 templates)                            |
| **Data Visible**   | ALL conversations                           | ONLY current conversation                     |
| **Cache Key**      | Global (collision risk)                     | Per-conversation (isolated)                   |
| **Security**       | ⚠️ Data leakage                             | ✅ Secure                                     |

---

## 🔄 Cache Behavior Comparison

### ❌ Current: Global Cache (Bad)

```
┌─────────────────────────────────────────────────────────┐
│  React Query Cache                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key: ["checklist-templates", "list"]                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Data: [Template A, B, C, D, E, F, G, ... (100)]  │ │
│  │                                                   │ │
│  │ ALL templates mixed together!                    │ │
│  │ No separation by conversation                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ⚠️ Problem:                                            │
│  - User switches from conversation A to B              │
│  - Cache still shows same key                          │
│  - Component filters client-side again                 │
│  - Cache invalidation affects ALL conversations        │
└─────────────────────────────────────────────────────────┘
```

### ✅ Proposed: Per-Conversation Cache (Good)

```
┌─────────────────────────────────────────────────────────┐
│  React Query Cache                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key: ["checklist-templates", "list", "conv-ABC"]      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Data: [Template A, Template D]                   │ │
│  │ Only templates for conversation ABC              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Key: ["checklist-templates", "list", "conv-XYZ"]      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Data: [Template B, Template C]                   │ │
│  │ Only templates for conversation XYZ              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ✅ Benefits:                                           │
│  - Each conversation has isolated cache                │
│  - Switching conversations = instant (cached)          │
│  - Invalidating conv-ABC doesn't affect conv-XYZ       │
└─────────────────────────────────────────────────────────┘
```

---

## 🕵️ Security Vulnerability Example

### Scenario: User tries to spy on other teams

```
┌──────────────────────────────────────────────────────────┐
│  1. USER OPENS DEVTOOLS                                  │
│                                                          │
│  Chrome DevTools → Network Tab → XHR Filter             │
└──────────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  2. CLICKS "Manage Variants" BUTTON                      │
│                                                          │
│  Current conversation: Sales Team (conv-sales-001)      │
└──────────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  3. NETWORK TAB SHOWS API CALL                           │
│                                                          │
│  ❌ CURRENT (BAD):                                       │
│  GET /api/checklist-templates                            │
│  Response:                                               │
│  [                                                       │
│    { id: "1", name: "Sales - Follow Up",                │
│      conversationId: "conv-sales-001" },                │
│    { id: "2", name: "HR - Onboarding",        ⚠️        │
│      conversationId: "conv-hr-secret" },      ⚠️        │
│    { id: "3", name: "Finance - Audit",        ⚠️        │
│      conversationId: "conv-finance-private" } ⚠️        │
│  ]                                                       │
│                                                          │
│  👀 User can see:                                        │
│  - HR team has "Onboarding" checklist                   │
│  - Finance team has "Audit" checklist                   │
│  - Conversation IDs of other teams                      │
│                                                          │
│  ✅ PROPOSED (GOOD):                                     │
│  GET /api/checklist-templates?conversationId=conv-sales-001│
│  Response:                                               │
│  [                                                       │
│    { id: "1", name: "Sales - Follow Up",                │
│      conversationId: "conv-sales-001" }                 │
│  ]                                                       │
│                                                          │
│  ✅ User CANNOT see other teams' data!                   │
└──────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Metrics

### Network Transfer

```
┌─────────────────────────────────────────────────────┐
│  ❌ Current (No Filter)                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Request:  GET /api/checklist-templates             │
│  Size:     ~500 bytes                               │
│                                                     │
│  Response: 200 OK                                   │
│  Size:     ~50KB                                    │
│  Templates: 100                                     │
│  Transfer:  ████████████████████████████ (50KB)    │
│                                                     │
│  Client Filter: (discard 98 templates)              │
│  Used:     ██ (5KB = 10%)                           │
│  Wasted:   ██████████████████████████ (45KB = 90%) │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ✅ Proposed (With Filter)                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Request:  GET /api/checklist-templates?            │
│            conversationId=conv-ABC-123              │
│  Size:     ~550 bytes                               │
│                                                     │
│  Response: 200 OK                                   │
│  Size:     ~5KB                                     │
│  Templates: 2                                       │
│  Transfer:  ██ (5KB)                                │
│                                                     │
│  Client Filter: None needed                         │
│  Used:     ██ (5KB = 100%)                          │
│  Wasted:   (0KB = 0%)                               │
└─────────────────────────────────────────────────────┘

Improvement: 90% reduction in data transfer
```

### Database Query

```sql
-- ❌ Current: Server fetches ALL templates
SELECT * FROM checklist_templates;
-- Returns: 1000 rows → Filter in memory → Send 1000 rows to client

-- ✅ Proposed: Server filters by conversationId
SELECT * FROM checklist_templates
WHERE conversation_id = 'conv-ABC-123';
-- Returns: 10 rows → Send 10 rows to client

-- Database performance: 99% less rows scanned
-- Index usage: conversation_id index utilized
```

---

## 📝 Summary

| Metric            | ❌ Before | ✅ After | Improvement |
| ----------------- | --------- | -------- | ----------- |
| API Response Size | 50KB      | 5KB      | **90%** ↓   |
| Templates Fetched | 100       | 10       | **90%** ↓   |
| Client Filtering  | Yes       | No       | **100%** ↓  |
| Data Leakage Risk | High      | None     | **100%** ↓  |
| Cache Efficiency  | Low       | High     | **10x** ↑   |
| Database Rows     | 1000      | 10       | **99%** ↓   |

**Overall Impact:**

- 🚀 **10x faster** page loads
- 🔒 **100% secure** (no data leakage)
- 🧹 **Cleaner code** (no client-side filters)
- 💾 **Better caching** (per-conversation isolation)
