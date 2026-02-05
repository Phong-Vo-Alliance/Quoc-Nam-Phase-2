# [BƯỚC 4.5] Test Requirements - DevTools Protection Default Enable

> **Feature:** DevTools Protection Default Enable  
> **Status:** ✅ APPROVED - Ready for testing  
> **Approved by:** MINH ĐÃ DUYỆT  
> **Date:** 2026-02-05

---

## 📋 Test Coverage Matrix

| Implementation File             | Test File                                      | Test Type   | # Cases | Priority    |
| ------------------------------- | ---------------------------------------------- | ----------- | ------- | ----------- |
| `src/config/security.config.ts` | `src/config/__tests__/security.config.test.ts` | Unit        | 8       | 🔴 Critical |
| `src/hooks/useSecurity.ts`      | `src/hooks/__tests__/useSecurity.test.ts`      | Integration | 4       | 🟡 High     |
| `.env.local.example`            | Manual verification                            | Manual      | 3       | 🟢 Medium   |
| `.env.development`              | Manual verification                            | Manual      | 2       | 🟢 Medium   |

**Total Test Cases:** 17

---

## 🧪 Detailed Test Cases

### Test Suite 1: Config Logic (Unit Tests)

**File:** `src/config/__tests__/security.config.test.ts`

#### TC-1.1: Default Enabled (No Env Var)

```typescript
describe("security.config.ts - Opt-Out Logic", () => {
  beforeEach(() => {
    // Reset env
    vi.unstubAllEnvs();
  });

  it("should enable devToolsProtection when env var is undefined", () => {
    // Mock: No VITE_ENABLE_DEVTOOLS_PROTECTION
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", undefined);

    // Reload config (or use dynamic import)
    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(true);
  });

  it("should enable contextMenuProtection when env var is undefined", () => {
    vi.stubEnv("VITE_ENABLE_CONTEXT_MENU_PROTECTION", undefined);

    const config = loadSecurityConfig();

    expect(config.contextMenuProtection.enabled).toBe(true);
  });

  it("should enable contentProtection when env var is undefined", () => {
    vi.stubEnv("VITE_ENABLE_CONTENT_PROTECTION", undefined);

    const config = loadSecurityConfig();

    expect(config.contentProtection.enabled).toBe(true);
  });
});
```

**Expected Result:** ✅ All 3 protections enabled by default

---

#### TC-1.2: Explicit False (Disabled)

```typescript
describe("Explicit Disable", () => {
  it('should disable devToolsProtection when env var is "false"', () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "false");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(false);
  });

  it('should disable all protections when all set to "false"', () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "false");
    vi.stubEnv("VITE_ENABLE_CONTEXT_MENU_PROTECTION", "false");
    vi.stubEnv("VITE_ENABLE_CONTENT_PROTECTION", "false");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(false);
    expect(config.contextMenuProtection.enabled).toBe(false);
    expect(config.contentProtection.enabled).toBe(false);
  });
});
```

**Expected Result:** ✅ All protections disabled when explicitly `"false"`

---

#### TC-1.3: Explicit True (Enabled)

```typescript
describe("Explicit Enable", () => {
  it('should enable devToolsProtection when env var is "true"', () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "true");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(true);
  });
});
```

**Expected Result:** ✅ Protection enabled (backward compatible)

---

#### TC-1.4: Edge Cases (Safe Fallback)

```typescript
describe("Edge Cases - Safe Fallback", () => {
  it("should enable protection for empty string", () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(true);
  });

  it('should enable protection for "False" (capital F)', () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "False");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(true);
  });

  it('should enable protection for "0"', () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "0");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(true);
  });

  it("should enable protection for random string", () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "random");

    const config = loadSecurityConfig();

    expect(config.devToolsProtection.enabled).toBe(true);
  });
});
```

**Expected Result:** ✅ All edge cases → ENABLED (secure by default)

---

### Test Suite 2: Integration Tests

**File:** `src/hooks/__tests__/useSecurity.test.ts`

#### TC-2.1: Hook Integration with Default Enabled

```typescript
describe("useSecurity - Default Enabled Behavior", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", undefined);
  });

  it("should apply protection when no env var and user not whitelisted", () => {
    // Mock user không trong whitelist
    const { result } = renderHook(() => useSecurity());

    expect(result.current.isProtected).toBe(true);
    expect(result.current.isWhitelisted).toBe(false);
  });

  it("should bypass protection when user is whitelisted (even with default enabled)", () => {
    // Mock user trong whitelist
    vi.stubEnv("VITE_SECURITY_WHITELIST_EMAILS", "admin@test.com");

    // Mock authStore
    useAuthStore.setState({
      user: { identifier: "admin@test.com" },
    });

    const { result } = renderHook(() => useSecurity());

    expect(result.current.isProtected).toBe(false);
    expect(result.current.isWhitelisted).toBe(true);
  });
});
```

**Expected Result:**

- ✅ Default enabled → protection active
- ✅ Whitelist still bypasses

---

#### TC-2.2: Hook with Explicit Disable

```typescript
describe("useSecurity - Explicit Disable", () => {
  it("should not apply protection when explicitly disabled", () => {
    vi.stubEnv("VITE_ENABLE_DEVTOOLS_PROTECTION", "false");
    vi.stubEnv("VITE_ENABLE_CONTEXT_MENU_PROTECTION", "false");
    vi.stubEnv("VITE_ENABLE_CONTENT_PROTECTION", "false");

    const { result } = renderHook(() => useSecurity());

    expect(result.current.isProtected).toBe(false);
  });
});
```

**Expected Result:** ✅ Protection disabled when explicitly set to `"false"`

---

#### TC-2.3: DevTools Protection Hook Behavior

```typescript
describe("useDevToolsProtection Hook", () => {
  it("should block F12 when enabled=true", () => {
    const { unmount } = renderHook(() => useDevToolsProtection(true));

    // Simulate F12 keypress
    const event = new KeyboardEvent("keydown", { key: "F12" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();

    unmount();
  });

  it("should NOT block F12 when enabled=false", () => {
    const { unmount } = renderHook(() => useDevToolsProtection(false));

    // Simulate F12 keypress
    const event = new KeyboardEvent("keydown", { key: "F12" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();

    unmount();
  });
});
```

**Expected Result:**

- ✅ F12 blocked when enabled
- ✅ F12 works when disabled

---

### Test Suite 3: Manual Verification Tests

#### TC-3.1: Development Environment

**Steps:**

1. Open `.env.development`
2. Verify có 3 dòng:
   ```dotenv
   VITE_ENABLE_DEVTOOLS_PROTECTION=false
   VITE_ENABLE_CONTEXT_MENU_PROTECTION=false
   VITE_ENABLE_CONTENT_PROTECTION=false
   ```
3. Run `npm run dev`
4. Press F12
5. Right-click on page
6. Try to copy text

**Expected:**

- ✅ DevTools opens normally
- ✅ Context menu appears
- ✅ Can copy text

---

#### TC-3.2: Production Simulation (No Env Vars)

**Steps:**

1. Create `.env.local` (empty or without security vars)
2. Run `npm run dev` (simulates production build)
3. Press F12
4. Right-click on page
5. Try to copy protected content

**Expected:**

- ✅ F12 blocked → Toast error
- ✅ Right-click blocked
- ✅ Copy blocked in file previews

---

#### TC-3.3: Whitelist User Bypass

**Steps:**

1. Set `.env.local`:
   ```dotenv
   VITE_SECURITY_WHITELIST_EMAILS=test@example.com
   ```
2. Login as `test@example.com`
3. Press F12
4. Right-click on page

**Expected:**

- ✅ F12 works (bypassed)
- ✅ Right-click works (bypassed)

---

## 📊 Test Data & Mocks

### Mock Environment Variables

```typescript
// Test data object
export const testEnvConfigs = {
  allDisabled: {
    VITE_ENABLE_DEVTOOLS_PROTECTION: "false",
    VITE_ENABLE_CONTEXT_MENU_PROTECTION: "false",
    VITE_ENABLE_CONTENT_PROTECTION: "false",
  },
  allEnabled: {
    VITE_ENABLE_DEVTOOLS_PROTECTION: "true",
    VITE_ENABLE_CONTEXT_MENU_PROTECTION: "true",
    VITE_ENABLE_CONTENT_PROTECTION: "true",
  },
  defaultBehavior: {
    // No env vars → should default to enabled
  },
  withWhitelist: {
    VITE_SECURITY_WHITELIST_EMAILS: "admin@test.com,dev@test.com",
  },
};
```

### Mock User Data

```typescript
export const mockUsers = {
  whitelisted: {
    identifier: "admin@test.com",
    name: "Admin User",
  },
  nonWhitelisted: {
    identifier: "user@test.com",
    name: "Regular User",
  },
};
```

---

## ✅ Test Generation Checklist

### Unit Tests

- [ ] Create/update `src/config/__tests__/security.config.test.ts`
  - [ ] Test undefined env var → enabled (TC-1.1) - 3 cases
  - [ ] Test `"false"` → disabled (TC-1.2) - 2 cases
  - [ ] Test `"true"` → enabled (TC-1.3) - 1 case
  - [ ] Test edge cases → enabled (TC-1.4) - 4 cases

### Integration Tests

- [ ] Update `src/hooks/__tests__/useSecurity.test.ts`
  - [ ] Default enabled integration (TC-2.1) - 2 cases
  - [ ] Explicit disable (TC-2.2) - 1 case
- [ ] Update `src/hooks/__tests__/useDevToolsProtection.test.ts`
  - [ ] F12 blocking behavior (TC-2.3) - 2 cases

### Manual Tests

- [ ] Dev environment verification (TC-3.1)
- [ ] Production simulation (TC-3.2)
- [ ] Whitelist bypass (TC-3.3)

---

## 🎯 Test Success Criteria

### All Tests Must Pass:

✅ **Unit Tests (10 cases):**

- 3 default enabled tests
- 2 explicit disable tests
- 1 explicit enable test
- 4 edge case tests

✅ **Integration Tests (5 cases):**

- 2 useSecurity tests
- 1 explicit disable test
- 2 useDevToolsProtection tests

✅ **Manual Tests (3 scenarios):**

- Dev environment works
- Production blocks by default
- Whitelist bypass works

---

## 🚨 Failure Scenarios & Handling

### Scenario 1: Test Fails - Default Not Enabled

**Symptom:** TC-1.1 fails, protection still disabled by default

**Cause:** Logic not updated correctly in `security.config.ts`

**Fix:**

```typescript
// Check line:
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false";
//                                                          ^^ Must be !== not ===
```

---

### Scenario 2: Test Fails - Cannot Disable

**Symptom:** TC-1.2 fails, setting `=false` doesn't disable

**Cause:** Typo in comparison operator

**Fix:**

```typescript
// Check:
enabled: import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION !== "false";
//       Must be strict inequality, not other operators
```

---

### Scenario 3: Whitelist Not Bypassing

**Symptom:** TC-2.1 second test fails, whitelist user still blocked

**Cause:** `useSecurity` hook logic issue

**Fix:** Verify `shouldApplyProtection` calculation:

```typescript
const shouldApplyProtection = !isWhitelisted;
// Must be inverted - if whitelisted, DON'T apply protection
```

---

## 📝 Test Execution Log

After running tests, record results:

| Test Suite          | Pass     | Fail  | Skip  | Duration   |
| ------------------- | -------- | ----- | ----- | ---------- |
| Config Logic (Unit) | 0/10     | 0     | 0     | \_\_\_     |
| Integration Tests   | 0/5      | 0     | 0     | \_\_\_     |
| Manual Tests        | 0/3      | 0     | 0     | \_\_\_     |
| **Total**           | **0/18** | **0** | **0** | **\_\_\_** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status          |
| ------------------------------ | --------------- |
| Đã review Test Coverage Matrix | ✅ Đã review    |
| Đã review Test Cases           | ✅ Đã review    |
| Đã review Success Criteria     | ✅ Đã review    |
| **APPROVED để thực thi**       | ✅ **APPROVED** |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-05

> ✅ **APPROVED - AI có thể proceed với coding (BƯỚC 5)**

---

## 🚀 Next Steps

1. ✅ Test requirements approved
2. ⏳ Proceed to BƯỚC 5 - Implementation
3. ⏳ Write tests simultaneously with code changes
4. ⏳ Run tests after each change
5. ⏳ Update progress in 05_progress.md
