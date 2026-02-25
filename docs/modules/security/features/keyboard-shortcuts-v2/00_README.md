# [BƯỚC 0] Feature Overview - Keyboard Shortcuts Enhancement v2

> **Feature:** Mở rộng chặn phím tắt (Ctrl+P, Ctrl+S) + BlockedPage  
> **Module:** Security  
> **Version:** 1.2.0  
> **Status:** ✅ IMPLEMENTED  
> **Created:** 2026-02-25  
> **Completed:** 2026-02-25

---

## 📋 Tổng quan

Bổ sung thêm các phím tắt cần chặn vào hệ thống bảo mật hiện tại + trang BlockedPage khi vi phạm:

| Phím tắt hiện tại đã chặn | Phím tắt mới đã thêm  |
| ------------------------- | --------------------- |
| F12                       | **Ctrl+P** (Print) ✅ |
| Ctrl+Shift+I              | **Ctrl+S** (Save) ✅  |
| Ctrl+Shift+J              | **Cmd+P** (Mac) ✅    |
| Ctrl+Shift+C              | **Cmd+S** (Mac) ✅    |
| Ctrl+U                    |                       |
| PrintScreen               |                       |

---

## 🎯 Mục tiêu

1. ✅ **Chặn Ctrl+P**: Ngăn người dùng in trang web
2. ✅ **Chặn Ctrl+S**: Ngăn người dùng lưu trang web về máy
3. ✅ **Master flag**: Tắt toàn bộ protections bằng 1 env var
4. ✅ **Mac support**: Chặn cả Cmd+P/S trên Mac
5. ✅ **BlockedPage**: Trang hiển thị khi user vi phạm security
6. ✅ **Simplified**: Loại bỏ toast/modal, chỉ giữ redirect

---

## 📁 Feature Documentation Structure

```
docs/modules/security/features/keyboard-shortcuts-v2/
├── 00_README.md              # [BƯỚC 0] ✅ DONE
├── 01_requirements.md        # [BƯỚC 1] ✅ APPROVED
├── 04_implementation-plan.md # [BƯỚC 4] ✅ DONE
├── 05_progress.md            # [BƯỚC 5] ✅ COMPLETED
└── 06_testing.md             # [BƯỚC 6] ⏳ (optional - manual test)
```

---

## 🔗 Related Documents

- [Client Protection Feature](../client-protection/01_requirements.md) - Tính năng gốc
- [useDevToolsProtection Hook](../../../../../src/hooks/useDevToolsProtection.ts) - Code hiện tại
- [BlockedPage](../../../../../src/pages/BlockedPage.tsx) - Trang blocked

---

## 📌 Quick Links

| Bước | Document                                      | Status      |
| ---- | --------------------------------------------- | ----------- |
| 1    | [Requirements](./01_requirements.md)          | ✅ APPROVED |
| 4    | [Implementation](./04_implementation-plan.md) | ✅ DONE     |
| 5    | [Progress](./05_progress.md)                  | ✅ DONE     |
| 6    | [Testing](./06_testing.md)                    | ⏳ PENDING  |

---

## ⚠️ Lưu ý quan trọng

- **Scope đã mở rộng**: Ngoài chặn Ctrl+P/S còn tạo BlockedPage
- **Simplified**: Loại bỏ toast/modal options, luôn redirect đến /blocked
- **Không cần wireframe/flow**: BlockedPage đơn giản
- **Không cần API contract**: Không gọi API
- **Thời gian thực tế**: ~2 giờ (including BlockedPage + simplification)
