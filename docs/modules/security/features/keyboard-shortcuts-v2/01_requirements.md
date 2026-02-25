# [BƯỚC 1] Requirements - Keyboard Shortcuts Enhancement v2

> **Feature:** Mở rộng chặn phím tắt (Ctrl+P, Ctrl+S) + BlockedPage  
> **Module:** Security  
> **Version:** 1.2.0  
> **Status:** ✅ APPROVED & IMPLEMENTED  
> **Created:** 2026-02-25  
> **Completed:** 2026-02-25

---

## 📋 Version History

| Version | Date       | Changes                                 | Author | Status  |
| ------- | ---------- | --------------------------------------- | ------ | ------- |
| 1.0.0   | 2026-01-13 | Initial security features               | AI     | ✅ DONE |
| 1.1.0   | 2026-02-25 | Thêm chặn Ctrl+P, Ctrl+S                | AI     | ✅ DONE |
| 1.2.0   | 2026-02-25 | BlockedPage, simplified (redirect only) | AI     | ✅ DONE |

---

## 1. Background & Context

### 1.1 Yêu cầu hiện tại đã triển khai

File: `src/hooks/useDevToolsProtection.ts` hiện đang chặn các phím sau:

| #   | Phím tắt     | Mục đích        | Status |
| --- | ------------ | --------------- | ------ |
| 1   | F12          | DevTools        | ✅     |
| 2   | Ctrl+Shift+I | Inspect Element | ✅     |
| 3   | Ctrl+Shift+J | Console         | ✅     |
| 4   | Ctrl+Shift+C | Element Picker  | ✅     |
| 5   | Ctrl+U       | View Source     | ✅     |
| 6   | PrintScreen  | Screenshot      | ✅     |

### 1.2 Yêu cầu mới cần bổ sung

| #   | Phím tắt | Mục đích         | Lý do cần chặn                    |
| --- | -------- | ---------------- | --------------------------------- |
| 7   | Ctrl+P   | Print (In trang) | Ngăn in nội dung nhạy cảm ra giấy |
| 8   | Ctrl+S   | Save (Lưu trang) | Ngăn lưu HTML source về máy local |

---

## 2. Functional Requirements

### 2.1 Chặn phím Print (Ctrl+P)

| ID     | Requirement                | Priority | Acceptance Criteria                        |
| ------ | -------------------------- | -------- | ------------------------------------------ |
| FR-7.1 | Chặn Ctrl+P                | High     | Nhấn Ctrl+P không mở hộp thoại Print       |
| FR-7.2 | Hiển thị toast thông báo   | Medium   | Toast "Không được phép in trang" xuất hiện |
| FR-7.3 | Không ảnh hưởng input/form | High     | User vẫn nhập được ký tự 'p' trong ô input |

### 2.2 Chặn phím Save (Ctrl+S)

| ID     | Requirement                | Priority | Acceptance Criteria                         |
| ------ | -------------------------- | -------- | ------------------------------------------- |
| FR-8.1 | Chặn Ctrl+S                | High     | Nhấn Ctrl+S không mở hộp thoại Save         |
| FR-8.2 | Hiển thị toast thông báo   | Medium   | Toast "Không được phép lưu trang" xuất hiện |
| FR-8.3 | Không ảnh hưởng input/form | High     | User vẫn nhập được ký tự 's' trong ô input  |

---

## 3. Technical Requirements

### 3.1 Implementation Location

- **File duy nhất cần sửa**: `src/hooks/useDevToolsProtection.ts`
- **Function**: `handleKeyDown` trong `useDevToolsProtection` hook

### 3.2 Code Pattern (Reference)

Làm tương tự các phím đã chặn:

```typescript
// Ctrl+P (Print)
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "p") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("Không được phép in trang");
  return false;
}

// Ctrl+S (Save)
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "s") {
  e.preventDefault();
  e.stopPropagation();
  toast.warning("Không được phép lưu trang");
  return false;
}
```

### 3.3 Edge Cases cần xử lý

| Case            | Mô tả                         | Xử lý                                     |
| --------------- | ----------------------------- | ----------------------------------------- |
| Input focus     | User đang focus trong ô input | ⚠️ Vẫn chặn vì Ctrl+P/S không phải gõ chữ |
| Mac OS          | Command+P / Command+S         | Cần xử lý thêm `e.metaKey`                |
| Whitelist users | Admin/Dev bypass              | Đã có logic whitelist hiện tại            |

---

## 4. Non-Functional Requirements

| Category      | Requirement             | Target                        |
| ------------- | ----------------------- | ----------------------------- |
| Performance   | Event handler execution | < 1ms                         |
| UX            | Toast không spam        | Debounce messages             |
| Compatibility | Cross-browser           | Chrome, Firefox, Edge, Safari |
| Mac Support   | Cmd key                 | Sử dụng `e.metaKey` cho Mac   |

---

## 5. Out of Scope

- ❌ Chặn menu File > Print của browser (không thể chặn)
- ❌ Chặn Print từ DevTools (đã chặn DevTools rồi)
- ❌ Watermark trang in (không áp dụng vì đã chặn print)

---

## 📋 IMPACT SUMMARY

### Files sẽ tạo mới:

- (không có)

### Files sẽ sửa đổi:

| File                                 | Chi tiết thay đổi                                            |
| ------------------------------------ | ------------------------------------------------------------ |
| `src/hooks/useDevToolsProtection.ts` | Thêm 2 case handlers: Ctrl+P và Ctrl+S (khoảng 20 dòng code) |

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - sử dụng `sonner` toast đã có sẵn)

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                        | Lựa chọn                                                                             | HUMAN Decision                 |
| --- | ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| 1   | Toast message khi chặn Ctrl+P | (1) "Không được phép in trang", (2) "Tính năng in đã bị tắt", (3) Không hiện toast   | ✅ **Tính năng in đã bị tắt**  |
| 2   | Toast message khi chặn Ctrl+S | (1) "Không được phép lưu trang", (2) "Tính năng lưu đã bị tắt", (3) Không hiện toast | ✅ **Tính năng lưu đã bị tắt** |
| 3   | Hỗ trợ Mac (Cmd+P/Cmd+S)      | (1) Có - chặn cả metaKey, (2) Không - chỉ Windows/Linux                              | ✅ **Có - chặn cả metaKey**    |
| 4   | Toast debounce time           | (1) Không debounce, (2) 2 giây, (3) 5 giây                                           | ✅ **Không debounce**          |

> ✅ **All decisions filled - Implementation completed**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                          | Status       |
| --------------------------------- | ------------ |
| Đã review Functional Requirements | ✅ Đã review |
| Đã review Technical Requirements  | ✅ Đã review |
| Đã review Impact Summary          | ✅ Đã review |
| Đã điền Pending Decisions         | ✅ Đã điền   |
| **APPROVED để thực thi**          | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-25

> ✅ **Implementation completed successfully**

---

## 📌 Notes for Implementation

1. **Thêm vào cuối `handleKeyDown` function** trước `return` cuối cùng
2. **Test trên nhiều browser**: Chrome, Firefox, Edge, Safari
3. **Test trên Mac**: Sử dụng Cmd key thay vì Ctrl
4. **Không cần tạo test file mới**: Thêm test cases vào file test hiện tại

---

## 🔗 Related Documents

- [Implementation Plan](./04_implementation-plan.md) - ⏳ After approval
- [Testing Requirements](./06_testing.md) - ⏳ After implementation plan
- [Current Hook Code](../../../../../src/hooks/useDevToolsProtection.ts)
