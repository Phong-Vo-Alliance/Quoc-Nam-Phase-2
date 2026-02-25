# Security Module

> **Module:** Client-Side Security Features  
> **Version:** 1.1.0  
> **Status:** ✅ v1.1 Implemented  
> **Last updated:** 2026-02-25

---

## 📋 Overview

Module này quản lý các tính năng bảo mật client-side cho Portal Internal Chat, bao gồm:

- **DevTools Protection** - Ngăn chặn F12 và truy cập Developer Tools
- **Context Menu Protection** - Ngăn chặn right-click inspect
- **Content Protection** - Chống copy/select cho preview files (feature flag)

---

## 🎯 Features

| Feature                         | Status         | Priority | Version |
| ------------------------------- | -------------- | -------- | ------- |
| DevTools Protection             | ✅ Implemented | High     | v1.0    |
| Context Menu Protection         | ✅ Implemented | High     | v1.0    |
| Content Protection (Copy Guard) | ✅ Implemented | Medium   | v1.0    |
| **Keyboard Shortcuts v2**       | ✅ Implemented | High     | v1.1    |

---

## 📁 Features Documentation

- [Client Protection](./features/client-protection/01_requirements.md) - DevTools, Inspect, Copy protection
- [DevTools Default On](./features/devtools-protection-default-on/00_README.md) - Opt-out model migration
- [**Keyboard Shortcuts v2**](./features/keyboard-shortcuts-v2/01_requirements.md) - ✅ Chặn Ctrl+P, Ctrl+S, Cmd+P/S

---

## 🔗 Dependencies

- No external API dependencies
- Client-side only implementation
- Feature flags via environment variables

---

## 📌 Roadmap

### Phase 1: Foundation (v1.0) ✅ DONE

- [x] DevTools blocking (F12, Ctrl+Shift+I, etc.)
- [x] Context menu blocking
- [x] Copy protection for file preview
- [x] Feature flag configuration

### Phase 1.1: Keyboard Enhancement (v1.1) ✅ DONE

- [x] Chặn Ctrl+P (Print page)
- [x] Chặn Ctrl+S (Save page)
- [x] Mac support (Cmd+P, Cmd+S)
- [x] Master flag (enableAllProtections)

### Phase 2: Enhancements (v2.0)

- [ ] Advanced bypass detection
- [ ] Security event logging
- [ ] Whitelist for admin users

---

## 📄 Related Documents

- [Client Protection Implementation](./features/client-protection/04_implementation-plan.md)
- [Client Protection Testing](./features/client-protection/06_testing.md)
- [Keyboard Shortcuts v2 Requirements](./features/keyboard-shortcuts-v2/01_requirements.md) - ✅ Approved
- [Keyboard Shortcuts v2 Progress](./features/keyboard-shortcuts-v2/05_progress.md) - ✅ Completed
