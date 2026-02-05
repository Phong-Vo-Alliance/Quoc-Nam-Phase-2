# [BƯỚC 0] Client-Side Protection - Overview

> **Feature:** Client-Side Security Protection  
> **Module:** Security  
> **Version:** 1.0.0  
> **Status:** 📝 Requirements Phase  
> **Created:** 2026-01-13

---

## 📋 Feature Overview

Tính năng bảo mật client-side để bảo vệ ứng dụng khỏi các hành động không mong muốn của người dùng, bao gồm:

1. **DevTools Protection** - Ngăn chặn truy cập Developer Tools (F12, Ctrl+Shift+I, etc.)
2. **Context Menu Protection** - Ngăn chặn right-click inspect
3. **Content Protection** - Chống copy/select cho file preview (có feature flag)

---

## 🎯 Goals

- Bảo vệ source code khỏi bị inspect dễ dàng
- Ngăn chặn user copy nội dung nhạy cảm từ file preview
- Tăng độ bảo mật cho portal nội bộ
- Có thể disable linh hoạt qua environment variables

## 🔐 Default Behavior (Updated 2026-02-05)

**Security protections are ENABLED by default** (secure by default):

- **Production Environment:** All protections active automatically (no config needed)
- **Development Environment:** Explicitly set `=false` in `.env.development` to disable

**Opt-Out Logic:**

```typescript
enabled: import.meta.env.VITE_ENABLE_ * _PROTECTION !== "false";
```

**Behavior Table:**

| Environment Variable Value | Protection Status |
| -------------------------- | ----------------- |
| Not set (undefined)        | **ENABLED** ✅    |
| `=false`                   | **DISABLED** ❌   |
| `=true`                    | **ENABLED** ✅    |
| Any other value            | **ENABLED** ✅    |

**Environment Configuration:**

### Production (No Config Needed)

```dotenv
# .env.production
# No need to set anything - protections enabled by default

# Optional: Whitelist for dev/admin debugging
VITE_SECURITY_WHITELIST_EMAILS=admin@company.com,dev@company.com
```

### Development (Explicit Disable)

```dotenv
# .env.development
VITE_ENABLE_DEVTOOLS_PROTECTION=false
VITE_ENABLE_CONTEXT_MENU_PROTECTION=false
VITE_ENABLE_CONTENT_PROTECTION=false
```

**Migration Details:** See [devtools-protection-default-on](../devtools-protection-default-on/)

---

## 📂 Document Structure

| File                      | Status     | Description                           |
| ------------------------- | ---------- | ------------------------------------- |
| 01_requirements.md        | ⏳ Pending | Functional, UI, Security requirements |
| 02b_flow.md               | ⏳ Pending | Logic flow cho từng protection        |
| 04_implementation-plan.md | ⏳ Pending | Chi tiết implementation               |
| 06_testing.md             | ⏳ Pending | Test coverage matrix                  |

---

## 🔗 Related Modules

- **Foundation** - App-wide configuration
- **File** - File preview protection integration

---

## ⚠️ Important Notes

- Đây là client-side protection, không thể chặn hoàn toàn user có kiến thức kỹ thuật cao
- Mục đích chính: ngăn chặn casual users, không phải security professionals
- Feature flags cần được cấu hình trong environment variables
