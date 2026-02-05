# [BƯỚC 1] Requirements - DevTools Protection Default Enable

> **Feature:** DevTools Protection Default Enable  
> **Status:** ⏳ PENDING HUMAN APPROVAL

---

## 📋 Functional Requirements

### FR-1: Default Behavior Change

**Current (Opt-In):**

```typescript
// Chỉ bật khi có cờ explicitly = "true"
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION === "true";

// Behavior:
// - Không có env var → TẮT ❌
// - VITE_ENABLE_DEVTOOLS_PROTECTION=false → TẮT ❌
// - VITE_ENABLE_DEVTOOLS_PROTECTION=true → BẬT ✅
```

**New (Opt-Out):**

```typescript
// Luôn bật trừ khi explicitly = "false"
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false";

// Behavior:
// - Không có env var → BẬT ✅ (DEFAULT)
// - VITE_ENABLE_DEVTOOLS_PROTECTION=false → TẮT ❌
// - VITE_ENABLE_DEVTOOLS_PROTECTION=true → BẬT ✅
// - VITE_ENABLE_DEVTOOLS_PROTECTION=anything → BẬT ✅
```

### FR-2: Apply to All Protection Types

Áp dụng cùng logic cho cả 3 protection types:

- ✅ DevTools Protection (F12, Ctrl+Shift+I, etc.)
- ✅ Context Menu Protection (Right-click inspect)
- ✅ Content Protection (Copy/select in file previews)

### FR-3: Development Experience

**Dev environment (.env.development):**

```dotenv
# Tắt tất cả protections cho dev
VITE_ENABLE_DEVTOOLS_PROTECTION=false
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false
VITE_ENABLE_CONTENT_PROTECTION=false
```

**Production environment (default):**

```dotenv
# Không cần khai báo gì - mặc định đã BẬT
# Hoặc explicit enable:
VITE_ENABLE_DEVTOOLS_PROTECTION=true
VITE_ENABLE_CONTEXT_MENU_PROTECTION=true
VITE_ENABLE_CONTENT_PROTECTION=true
```

### FR-4: Backward Compatibility

- **Existing deployments có `=true`** → Vẫn hoạt động bình thường ✅
- **Existing deployments không có env var** → Đổi từ TẮT → BẬT (Breaking but intentional) ⚠️
- **Existing dev có `=false`** → Vẫn tắt được ✅

---

## 🔒 Security Requirements

### SR-1: Production Safety

- Mặc định protection BẬT ở production environment
- Không để lọt security bởi vì quên config env var

### SR-2: Whitelist for Production Debugging

**Requirement:** Cho phép dev/admin bypass protections ở production để debug

**Mechanism:** Email-based whitelist (đã có sẵn)

```dotenv
# .env.production (Vercel/deployment platform)
VITE_SECURITY_WHITELIST_EMAILS=dev1@company.com,dev2@company.com,admin@company.com,tester@company.com
```

**Behavior:**

- ✅ User login bằng email trong whitelist → Bypass TẤT CẢ protections
- ✅ Không ảnh hưởng user khác
- ✅ Có thể update whitelist bất kỳ lúc nào (redeploy env var)

**Example Use Cases:**

1. **Dev team debug production issue:**

   ```
   Login: dev1@company.com → DevTools hoạt động bình thường
   ```

2. **Tester verify feature:**

   ```
   Login: tester@company.com → Có thể inspect elements
   ```

3. **Admin check logs:**
   ```
   Login: admin@company.com → Console.log visible
   ```

**Security Notes:**

- ⚠️ Chỉ thêm email tin cậy vào whitelist
- ⚠️ Review whitelist định kỳ (xoá email không còn cần)
- ✅ Whitelist check ở client-side (user phải login trước)
- ✅ Normal users không bị ảnh hưởng

### SR-3: Whitelist Implementation (No Changes)

- User trong whitelist (`VITE_SECURITY_WHITELIST_EMAILS`) vẫn bypass tất cả protections
- Logic này không đổi - đã implement sẵn
- Hook `useSecurity()` đã check whitelist trước khi enable protections

---

## 📐 Technical Requirements

### TR-1: Config Changes

File: `src/config/security.config.ts`

```typescript
// BEFORE (Opt-In)
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION === "true";

// AFTER (Opt-Out)
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false";
```

Apply cho cả 3 configs:

- `devToolsProtection.enabled`
- `contextMenuProtection.enabled`
- `contentProtection.enabled`

### TR-2: Environment Documentation

File: `.env.local.example`

Update comments để làm rõ default behavior mới:

```dotenv
# ==========================================
# Security Features (Client-Side Protection)
# ⚠️ DEFAULT: ALL PROTECTIONS ARE ENABLED
# Set to "false" to disable in dev environment
# ==========================================

# DevTools Protection - Blocks F12, Ctrl+Shift+I, etc.
# Default: ENABLED (set to "false" to disable)
VITE_ENABLE_DEVTOOLS_PROTECTION=false  # ← Dev example

# Context Menu Protection - Blocks right-click inspect
# Default: ENABLED (set to "false" to disable)
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false  # ← Dev example

# Content Protection - Prevents copy/select in file previews
# Default: ENABLED (set to "false" to disable)
VITE_ENABLE_CONTENT_PROTECTION=false  # ← Dev example

# ==========================================
# Security Whitelist (Production Debugging)
# ==========================================

# Whitelist emails that bypass ALL protections (for dev/admin debugging in production)
# Separate multiple emails with commas
# Example: dev1@company.com,dev2@company.com,admin@company.com
VITE_SECURITY_WHITELIST_EMAILS=
```

### TR-2.1: Production Environment Example

File: Documentation for Vercel/deployment platform

```dotenv
# .env.production (Production deployment)
# ⚠️ Không cần set protection flags - mặc định đã ENABLED

# Chỉ cần config whitelist để dev/admin có thể debug khi cần
VITE_SECURITY_WHITELIST_EMAILS=dev1@company.com,dev2@company.com,admin@company.com

# Hoặc để trống nếu không cần whitelist
# VITE_SECURITY_WHITELIST_EMAILS=
```

### TR-3: Development Environment

File: `.env.development`

```dotenv
# Development environment - Disable all security protections
VITE_ENABLE_DEVTOOLS_PROTECTION=false
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false
VITE_ENABLE_CONTENT_PROTECTION=false
```

### TR-4: No Logic Changes

**Không thay đổi:**

- Hook implementation (`useDevToolsProtection`, `useSecurity`)
- Detection logic (`detectDevTools`)
- Action behaviors (toast/modal/redirect)
- Whitelist logic

**Chỉ thay đổi:**

- Config default value logic (3 lines)
- Environment documentation (comments)

---

## 🧪 Test Requirements

### Test Case 1: Default Enabled (No Env Var)

```typescript
// Không có VITE_ENABLE_DEVTOOLS_PROTECTION trong env
// Expected: enabled = true
describe("security.config.ts default behavior", () => {
  it("should enable protection when env var is undefined", () => {
    // Mock import.meta.env without the variable
    expect(securityConfig.devToolsProtection.enabled).toBe(true);
  });
});
```

### Test Case 2: Explicit False

```typescript
// VITE_ENABLE_DEVTOOLS_PROTECTION=false
// Expected: enabled = false
it("should disable protection when env var is 'false'", () => {
  // Mock import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION = "false"
  expect(securityConfig.devToolsProtection.enabled).toBe(false);
});
```

### Test Case 3: Explicit True

```typescript
// VITE_ENABLE_DEVTOOLS_PROTECTION=true
// Expected: enabled = true
it("should enable protection when env var is 'true'", () => {
  expect(securityConfig.devToolsProtection.enabled).toBe(true);
});
```

### Test Case 4: Any Other Value

```typescript
// VITE_ENABLE_DEVTOOLS_PROTECTION=yes
// Expected: enabled = true (treat as enabled)
it("should enable protection for any value other than 'false'", () => {
  // Mock import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION = "yes"
  expect(securityConfig.devToolsProtection.enabled).toBe(true);
});
```

### Test Case 5: Whitelist Still Bypasses

```typescript
// Whitelisted user với protection enabled
// Expected: protection không chạy
it("should bypass protection for whitelisted users even when enabled", () => {
  // Existing test - should still pass
});
```

---

## 📊 Impact Analysis

### Affected Users/Environments

| Environment                 | Current | After Change | Impact                          |
| --------------------------- | ------- | ------------ | ------------------------------- |
| **Production (no env var)** | TẮT ❌  | BẬT ✅       | ⚠️ Breaking (Intended)          |
| **Production (=true)**      | BẬT ✅  | BẬT ✅       | ✅ No change                    |
| **Dev (no env var)**        | TẮT ❌  | BẬT ✅       | ⚠️ Breaking (Annoying for devs) |
| **Dev (=false)**            | TẮT ❌  | TẮT ❌       | ✅ No change                    |

### Migration Path

**For Production:**

- Đã có `=true` → Không cần làm gì ✅
- Chưa có env var → Sẽ tự động bật (desired behavior) ✅

**For Development:**

- Update `.env.development` với `=false` cho tất cả protections
- Update `.env.local.example` với hướng dẫn mới
- Thông báo team cần update local `.env.local`

---

## 📖 Documentation Updates

### Files Cần Update:

1. **`.env.local.example`**
   - Update comments để làm rõ default = enabled
   - Update examples với `=false` cho dev

2. **`.env.development`**
   - Thêm explicit `=false` cho tất cả protections

3. **`docs/modules/security/features/client-protection/`**
   - Update existing docs với behavior mới
   - Giải thích opt-out model

4. **`README.md` (root)**
   - Update security section nếu có

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                                          | Lựa chọn                                                         | HUMAN Decision                             |
| --- | ----------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| 1   | Có nên thông báo team về breaking change không? | A) Yes - Send notification<br>B) No - Just update docs           | ✅ **B** - Just update docs                |
| 2   | Có nên tạo migration guide không?               | A) Yes - Create migration.md<br>B) No - Just update .env.example | ✅ **B** - Just update .env.example        |
| 3   | Có nên update Vercel env vars guide không?      | A) Yes - Add deployment notes<br>B) No - Skip                    | ✅ **B** - Skip (document later if needed) |

---

## 📋 IMPACT SUMMARY

### Files sẽ tạo mới:

- `docs/modules/security/features/devtools-protection-default-on/02b_flow.md` - Logic flow diagram
- `docs/modules/security/features/devtools-protection-default-on/04_implementation-plan.md` - Implementation steps
- `docs/modules/security/features/devtools-protection-default-on/06_testing.md` - Test requirements
- (Optional) `docs/modules/security/features/devtools-protection-default-on/migration.md` - Migration guide

### Files sẽ sửa đổi:

- `src/config/security.config.ts` - Đổi 3 lines logic từ `=== "true"` sang `!== "false"`
  - Line 10: `devToolsProtection.enabled`
  - Line 20: `contextMenuProtection.enabled`
  - Line 25: `contentProtection.enabled`

- `.env.local.example` - Update comments và examples
  - Add warning về default enabled
  - Change examples to `=false` for dev

- `.env.development` - Add explicit false values
  - Add `VITE_ENABLE_DEVTOOLS_PROTECTION=false`
  - Add `VITE_ENABLE_CONTEXT_MENU_PROTECTION=false`
  - Add `VITE_ENABLE_CONTENT_PROTECTION=false`

- `docs/modules/security/features/client-protection/00_README.md` - Update behavior docs
  - Update "Default Behavior" section
  - Update examples

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - chỉ logic change)

### Testing Requirements:

- Unit tests: 5 test cases cho config logic
- Integration tests: 2 test cases (with/without env var)
- Manual testing: Verify trên dev và staging

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status          |
| ------------------------- | --------------- |
| Đã review Impact Summary  | ✅ Đã review    |
| Đã điền Pending Decisions | ✅ Đã điền      |
| **APPROVED để thực thi**  | ✅ **APPROVED** |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-05

> ✅ **APPROVED - AI có thể tiến hành implementation**

---

## 📝 Notes

- Breaking change có chủ đích: Muốn default là bật để secure by default
- Dev experience không bị ảnh hưởng nếu có `.env.development` proper
- Whitelist mechanism vẫn cho phép bypass nếu cần
