# [BƯỚC 2B] Flow Diagram - DevTools Protection Default Enable

> **Feature:** DevTools Protection Default Enable  
> **Status:** ⏳ PENDING HUMAN APPROVAL

---

## 🔄 Logic Flow Comparison

### Current Logic (Opt-In)

```
┌─────────────────────────────────────────────────────────┐
│  Application Start                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Load Environment Variables                             │
│  - VITE_ENABLE_DEVTOOLS_PROTECTION                     │
│  - VITE_ENABLE_CONTEXT_MENU_PROTECTION                 │
│  - VITE_ENABLE_CONTENT_PROTECTION                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Env var exists?│
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
     [NO]              [YES]
        │                 │
        ▼                 ▼
   ┌─────────┐    ┌──────────────┐
   │ DEFAULT │    │ Check value: │
   │  = TẮT  │    │ === "true"?  │
   └────┬────┘    └──────┬───────┘
        │                │
        │       ┌────────┴────────┐
        │       │                 │
        │       ▼                 ▼
        │   [TRUE]            [FALSE/other]
        │       │                 │
        │       ▼                 ▼
        │   ┌──────┐         ┌─────┐
        │   │ BẬT  │         │ TẮT │
        │   └──┬───┘         └──┬──┘
        │      │                │
        └──────┴────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Initialize Security Hooks                              │
│  - useDevToolsProtection(enabled)                      │
│  - useContextMenuProtection(enabled)                   │
│  - useContentProtection(enabled)                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Whitelist Check│
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  [Whitelisted]     [Not whitelisted]
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │ BYPASS  │      │ APPLY    │
   │ All     │      │ Protection│
   └─────────┘      └──────────┘
```

### New Logic (Opt-Out) 🆕

```
┌─────────────────────────────────────────────────────────┐
│  Application Start                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Load Environment Variables                             │
│  - VITE_ENABLE_DEVTOOLS_PROTECTION                     │
│  - VITE_ENABLE_CONTEXT_MENU_PROTECTION                 │
│  - VITE_ENABLE_CONTENT_PROTECTION                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Env var exists?│
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
     [NO]              [YES]
        │                 │
        ▼                 ▼
   ┌─────────┐    ┌──────────────┐
   │ DEFAULT │    │ Check value: │
   │  = BẬT ✅│    │ !== "false"? │
   └────┬────┘    └──────┬───────┘
        │                │
        │       ┌────────┴────────┐
        │       │                 │
        │       ▼                 ▼
        │   [NOT "false"]     ["false"]
        │       │                 │
        │       ▼                 ▼
        │   ┌──────┐         ┌─────┐
        │   │ BẬT  │         │ TẮT │
        │   └──┬───┘         └──┬──┘
        │      │                │
        └──────┴────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Initialize Security Hooks                              │
│  - useDevToolsProtection(enabled)                      │
│  - useContextMenuProtection(enabled)                   │
│  - useContentProtection(enabled)                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Whitelist Check│
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  [Whitelisted]     [Not whitelisted]
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │ BYPASS  │      │ APPLY    │
   │ All     │      │ Protection│
   └─────────┘      └──────────┘
```

---

## 🎯 Key Differences

| Aspect               | Current (Opt-In) | New (Opt-Out) |
| -------------------- | ---------------- | ------------- |
| **No env var**       | TẮT ❌           | BẬT ✅        |
| **`=true`**          | BẬT ✅           | BẬT ✅        |
| **`=false`**         | TẮT ❌           | TẮT ❌        |
| **`=anything else`** | TẮT ❌           | BẬT ✅        |
| **Default safety**   | Insecure         | Secure ✅     |

---

## 🌍 Environment-Specific Flows

### Production Environment Flow

```
┌─────────────────────────────────────────────────────────┐
│  Vercel/Production Deploy                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Check Vercel Environment Variables                     │
│  (Usually not set or =true)                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Var not set?   │
         └───────┬────────┘
                 │
                 ▼ YES
         ┌───────────────┐
         │ DEFAULT = BẬT │ ✅ SECURE BY DEFAULT
         └───────┬───────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  All Security Features ACTIVE                           │
│  - F12 blocked                                          │
│  - Right-click inspect blocked                          │
│  - File content copy blocked                            │
└─────────────────────────────────────────────────────────┘
```

### Development Environment Flow

```
┌─────────────────────────────────────────────────────────┐
│  Local Development (npm run dev)                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Load .env.development                                  │
│  VITE_ENABLE_DEVTOOLS_PROTECTION=false                 │
│  VITE_ENABLE_CONTEXT_MENU_PROTECTION=false             │
│  VITE_ENABLE_CONTENT_PROTECTION=false                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Value="false"? │
         └───────┬────────┘
                 │
                 ▼ YES
         ┌───────────────┐
         │ TẮT ALL      │ ✅ DEV-FRIENDLY
         └───────┬───────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  All Security Features DISABLED                         │
│  - F12 works normally                                   │
│  - Right-click inspect works                            │
│  - Can copy/inspect files                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios Flow

### Scenario 1: Fresh Production Deploy (No Env Vars)

```
Start
  │
  ├─→ Check VITE_ENABLE_DEVTOOLS_PROTECTION
  │   └─→ undefined (không có trong Vercel env)
  │       └─→ !== "false" → true ✅
  │
  ├─→ Initialize useDevToolsProtection(true)
  │   └─→ Block F12, Ctrl+Shift+I, etc.
  │
  ├─→ User presses F12
  │   └─→ Event prevented ✅
  │       └─→ Toast: "Developer Tools không được phép"
  │
  └─→ ✅ PASS: Protection active by default
```

### Scenario 2: Development with .env.development

```
Start
  │
  ├─→ Check VITE_ENABLE_DEVTOOLS_PROTECTION
  │   └─→ "false" (từ .env.development)
  │       └─→ !== "false" → false ❌
  │
  ├─→ Initialize useDevToolsProtection(false)
  │   └─→ No blocking active
  │
  ├─→ User presses F12
  │   └─→ DevTools opens normally ✅
  │
  └─→ ✅ PASS: Dev can use DevTools
```

### Scenario 3: Whitelisted User in Production

```
Start
  │
  ├─→ Check VITE_ENABLE_DEVTOOLS_PROTECTION
  │   └─→ undefined → true (protection enabled)
  │
  ├─→ Check user email
  │   └─→ "admin@company.com"
  │       └─→ In VITE_SECURITY_WHITELIST_EMAILS ✅
  │
  ├─→ useSecurity() returns { isWhitelisted: true }
  │   └─→ shouldApplyProtection = false
  │
  ├─→ Initialize useDevToolsProtection(false)
  │   └─→ No blocking for whitelisted user
  │
  └─→ ✅ PASS: Admin can use DevTools
```

### Scenario 4: Explicit =true in Production

```
Start
  │
  ├─→ Check VITE_ENABLE_DEVTOOLS_PROTECTION
  │   └─→ "true" (explicitly set in Vercel)
  │       └─→ !== "false" → true ✅
  │
  ├─→ Initialize useDevToolsProtection(true)
  │   └─→ Block F12, etc.
  │
  └─→ ✅ PASS: Protection active (backward compatible)
```

---

## 🔀 State Transitions

### Config Initialization

```
[App Start]
     │
     ▼
[Load Env Vars]
     │
     ▼
[Evaluate !== "false"]
     │
     ├─→ undefined → true
     ├─→ "false" → false
     ├─→ "true" → true
     └─→ "anything" → true
     │
     ▼
[Set securityConfig.*.enabled]
     │
     ▼
[Pass to useSecurity()]
     │
     ▼
[Check whitelist]
     │
     ├─→ Whitelisted → shouldApplyProtection = false
     └─→ Not whitelisted → shouldApplyProtection = enabled
     │
     ▼
[Pass to individual hooks]
     │
     ├─→ useDevToolsProtection(shouldApplyProtection && enabled)
     ├─→ useContextMenuProtection(shouldApplyProtection && enabled)
     └─→ useContentProtection(shouldApplyProtection && enabled)
     │
     ▼
[Hooks active/inactive]
```

---

## 🚨 Edge Cases

### Edge Case 1: Typo in Env Var Value

```
VITE_ENABLE_DEVTOOLS_PROTECTION=ture  # Typo!

Flow:
  "ture" !== "false" → true
  → Protection BẬT ✅

Result: Safe fallback (secure by default)
```

### Edge Case 2: Empty String

```
VITE_ENABLE_DEVTOOLS_PROTECTION=  # Empty string

Flow:
  "" !== "false" → true
  → Protection BẬT ✅

Result: Safe fallback
```

### Edge Case 3: Case Sensitivity

```
VITE_ENABLE_DEVTOOLS_PROTECTION=False  # Capital F
VITE_ENABLE_DEVTOOLS_PROTECTION=FALSE  # All caps

Flow:
  "False" !== "false" → true
  "FALSE" !== "false" → true
  → Protection BẬT ✅

Result: Must use lowercase "false" to disable (intentional)
```

---

## 📊 Decision Table

| Env Value    | `!== "false"` | Enabled | Note               |
| ------------ | ------------- | ------- | ------------------ |
| `undefined`  | ✅ true       | ✅ BẬT  | Default behavior   |
| `"false"`    | ❌ false      | ❌ TẮT  | Explicit disable   |
| `"true"`     | ✅ true       | ✅ BẬT  | Explicit enable    |
| `"False"`    | ✅ true       | ✅ BẬT  | Case-sensitive     |
| `""` (empty) | ✅ true       | ✅ BẬT  | Safe fallback      |
| `"0"`        | ✅ true       | ✅ BẬT  | Not boolean false  |
| `"no"`       | ✅ true       | ✅ BẬT  | Not "false" string |
| `"anything"` | ✅ true       | ✅ BẬT  | Secure by default  |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                 | Status          |
| ------------------------ | --------------- |
| Đã review flow diagrams  | ✅ Đã review    |
| Đã review decision table | ✅ Đã review    |
| Đã review edge cases     | ✅ Đã review    |
| **APPROVED để thực thi** | ✅ **APPROVED** |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-05

> ✅ **APPROVED - AI có thể tiến hành implementation**
