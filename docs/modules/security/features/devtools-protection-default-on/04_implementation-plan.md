# [BƯỚC 4] Implementation Plan - DevTools Protection Default Enable

> **Feature:** DevTools Protection Default Enable  
> **Status:** ✅ APPROVED - Ready to implement  
> **Approved by:** MINH ĐÃ DUYỆT  
> **Date:** 2026-02-05

---

## 📋 Implementation Overview

Đổi logic security protection từ **Opt-In** (mặc định TẮT) sang **Opt-Out** (mặc định BẬT).

**Core Change:**

```typescript
// FROM (Opt-In):
enabled: import.meta.env.VITE_ENABLE_ * _PROTECTION === "true";

// TO (Opt-Out):
enabled: import.meta.env.VITE_ENABLE_ * _PROTECTION !== "false";
```

---

## 🎯 Implementation Steps

### Phase 1: Config Logic Update ⏱️ 5 mins

**File:** `src/config/security.config.ts`

#### Step 1.1: Update devToolsProtection.enabled

```typescript
// Line 10 - BEFORE:
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION === "true",

// AFTER:
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false",
```

#### Step 1.2: Update contextMenuProtection.enabled

```typescript
// Line 20 - BEFORE:
enabled: import.meta.env.VITE_ENABLE_CONTEXT_MENU_PROTECTION === "true",

// AFTER:
enabled: import.meta.env.VITE_ENABLE_CONTEXT_MENU_PROTECTION !== "false",
```

#### Step 1.3: Update contentProtection.enabled

```typescript
// Line 25 - BEFORE:
enabled: import.meta.env.VITE_ENABLE_CONTENT_PROTECTION === "true",

// AFTER:
enabled: import.meta.env.VITE_ENABLE_CONTENT_PROTECTION !== "false",
```

**Verification:**

- TypeScript compilation success ✅
- No runtime errors ✅
- Import paths unchanged ✅

---

### Phase 2: Environment Configuration ⏱️ 10 mins

#### Step 2.1: Update `.env.local.example`

**File:** `.env.local.example` (lines ~29-43)

```dotenv
# BEFORE:
# ==========================================
# Security Features (Client-Side Protection)
# ==========================================

# DevTools Protection - Blocks F12, Ctrl+Shift+I, etc.
VITE_ENABLE_DEVTOOLS_PROTECTION=true

# Context Menu Protection - Blocks right-click inspect
VITE_ENABLE_CONTEXT_MENU_PROTECTION=true

# Content Protection - Prevents copy/select in file previews
VITE_ENABLE_CONTENT_PROTECTION=true
```

```dotenv
# AFTER:
# ==========================================
# Security Features (Client-Side Protection)
# ⚠️ DEFAULT: ALL PROTECTIONS ARE ENABLED
# Set to "false" to disable (e.g., in development)
# ==========================================

# DevTools Protection - Blocks F12, Ctrl+Shift+I, etc.
# Default: ENABLED. Set to "false" to disable.
VITE_ENABLE_DEVTOOLS_PROTECTION=false

# Action when DevTools detected: toast | modal | redirect
VITE_DEVTOOLS_ACTION=toast

# Context Menu Protection - Blocks right-click inspect
# Default: ENABLED. Set to "false" to disable.
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false

# Content Protection - Prevents copy/select in file previews
# Default: ENABLED. Set to "false" to disable.
VITE_ENABLE_CONTENT_PROTECTION=false

# File types to protect (comma-separated, no spaces)
VITE_CONTENT_PROTECTION_FILE_TYPES=pdf,docx,xlsx,png,jpg

# Whitelist emails - Users who bypass all protections (comma-separated)
# Example: admin@company.com,dev@company.com
VITE_SECURITY_WHITELIST_EMAILS=
```

**Changes:**

- Add warning comment về default enabled
- Change examples to `=false` (for dev usage)
- Clarify each setting's default behavior

#### Step 2.2: Update `.env.development`

**File:** `.env.development` (add at end of security section)

```dotenv
# ==========================================
# Security - Disable for Development
# ==========================================
VITE_ENABLE_DEVTOOLS_PROTECTION=false
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false
VITE_ENABLE_CONTENT_PROTECTION=false
```

**Verification:**

- Dev server restart: `npm run dev` ✅
- DevTools can open (F12 works) ✅
- No console errors ✅

---

### Phase 3: Documentation Update ⏱️ 15 mins

#### Step 3.1: Update existing security docs

**File:** `docs/modules/security/features/client-protection/00_README.md`

**Section to update:** "Default Behavior"

```markdown
# BEFORE:

## Default Behavior

Security features are **disabled by default**. Enable them by setting environment variables:

- `VITE_ENABLE_DEVTOOLS_PROTECTION=true`
- `VITE_ENABLE_CONTEXT_MENU_PROTECTION=true`
- `VITE_ENABLE_CONTENT_PROTECTION=true`
```

```markdown
# AFTER:

## Default Behavior

Security features are **enabled by default** (secure by default). Disable them explicitly for development:

- Set `VITE_ENABLE_DEVTOOLS_PROTECTION=false` to allow DevTools
- Set `VITE_ENABLE_CONTEXT_MENU_PROTECTION=false` to allow right-click
- Set `VITE_ENABLE_CONTENT_PROTECTION=false` to allow copy/select

**Production:** No configuration needed - protections are active.
**Development:** Use `.env.development` with all protections set to `false`.
```

#### Step 3.2: Update environment variable examples

**Same file:** Add "Environment Configuration" section

````markdown
## Environment Configuration

### Production (Default)

No environment variables needed - all protections are enabled by default.

### Development

Create `.env.development`:

```dotenv
VITE_ENABLE_DEVTOOLS_PROTECTION=false
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false
VITE_ENABLE_CONTENT_PROTECTION=false
```
````

### Opt-Out Logic

Protections are enabled unless explicitly set to `"false"`:

- No env var → ENABLED ✅
- `=false` → DISABLED ❌
- `=true` → ENABLED ✅
- Any other value → ENABLED ✅ (secure fallback)

````

---

### Phase 4: Testing ⏱️ 20 mins

See [06_testing.md](./06_testing.md) for detailed test requirements.

**Quick verification checklist:**

#### Manual Testing

1. **Test default enabled (no env var):**
   - Remove all security env vars from `.env.local`
   - Restart dev server
   - Try F12 → Should be blocked ✅
   - Expected: Toast "Developer Tools không được phép sử dụng"

2. **Test explicit disable:**
   - Add `VITE_ENABLE_DEVTOOLS_PROTECTION=false` to `.env.local`
   - Restart dev server
   - Try F12 → Should open DevTools ✅

3. **Test whitelist bypass:**
   - Add email to `VITE_SECURITY_WHITELIST_EMAILS`
   - Login as that user
   - Try F12 → Should work (bypassed) ✅

#### Unit Tests

Run existing tests to ensure backward compatibility:
```bash
npm run test -- src/config/__tests__/security.config.test.ts
npm run test -- src/hooks/__tests__/useSecurity.test.ts
````

Expected: All existing tests pass (or update if needed)

---

## 📦 Deliverables Checklist

### Code Changes

- [ ] `src/config/security.config.ts` - 3 lines changed
  - [ ] `devToolsProtection.enabled` logic updated
  - [ ] `contextMenuProtection.enabled` logic updated
  - [ ] `contentProtection.enabled` logic updated

### Configuration Changes

- [ ] `.env.local.example` - Updated with new comments and defaults
- [ ] `.env.development` - Added explicit `=false` values

### Documentation Changes

- [ ] `docs/modules/security/features/client-protection/00_README.md` - Updated default behavior
- [ ] Update "Environment Configuration" section

### Testing

- [ ] Manual test: Default enabled (no env var)
- [ ] Manual test: Explicit disable (`=false`)
- [ ] Manual test: Whitelist bypass
- [ ] Unit tests: Run and update if needed
- [ ] Integration tests: Verify security hooks

---

## 🔄 Rollback Plan

If issues occur, revert in this order:

1. **Revert config logic:**

   ```bash
   git revert <commit-hash>
   ```

2. **Or manual rollback:**
   Change all 3 lines back to:

   ```typescript
   enabled: import.meta.env.VITE_ENABLE_ * _PROTECTION === "true";
   ```

3. **Revert environment files:**

   ```bash
   git checkout HEAD -- .env.local.example .env.development
   ```

4. **Redeploy:**
   ```bash
   git push origin main
   vercel --prod
   ```

---

## ⚠️ Deployment Notes

### Vercel/Production Deployment

**Before deployment:**

- Ensure no breaking changes for existing deployments with `=true`
- Verify `.env.development` has `=false` values

**After deployment:**

- Monitor logs for security-related errors
- Test F12 blocking on production URL
- Verify whitelist users can still bypass

**If needed - Force enable in production:**

```bash
# In Vercel dashboard, set:
VITE_ENABLE_DEVTOOLS_PROTECTION=true
VITE_ENABLE_CONTEXT_MENU_PROTECTION=true
VITE_ENABLE_CONTENT_PROTECTION=true

# (Not needed, but makes it explicit)
```

---

## 🧪 Test Results Tracking

After implementation, record results here:

| Test Case            | Expected            | Actual | Status |
| -------------------- | ------------------- | ------ | ------ |
| No env var → enabled | F12 blocked         | \_\_\_ | ⬜     |
| `=false` → disabled  | F12 works           | \_\_\_ | ⬜     |
| `=true` → enabled    | F12 blocked         | \_\_\_ | ⬜     |
| Whitelist bypass     | F12 works           | \_\_\_ | ⬜     |
| Context menu blocked | Right-click blocked | \_\_\_ | ⬜     |
| Content protection   | Copy blocked        | \_\_\_ | ⬜     |

---

## 📊 Progress Tracking

| Phase     | Task                | Status     | Time    |
| --------- | ------------------- | ---------- | ------- |
| 1         | Config logic update | ⏳ Pending | 5m      |
| 2         | Environment config  | ⏳ Pending | 10m     |
| 3         | Documentation       | ⏳ Pending | 15m     |
| 4         | Testing             | ⏳ Pending | 20m     |
| **Total** |                     |            | **50m** |

---

## ✅ Sign-Off

**Implementation Plan Approved By:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-05  
**Ready to implement:** ✅ YES

> 🚀 **Next:** Tạo test requirements (06_testing.md), sau đó bắt đầu implementation (BƯỚC 5)
