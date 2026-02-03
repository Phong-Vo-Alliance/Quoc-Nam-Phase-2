# Chat UI Issues - Bugfix Documentation

**Date:** 2026-01-30  
**Module:** Chat  
**Priority:** High  
**Status:** ✅ COMPLETED

---

## 📋 Bug Overview

Tổng hợp 4 bugs UI trong module Chat cần fix:

| Bug ID  | Description                                              | Severity | Status               |
| ------- | -------------------------------------------------------- | -------- | -------------------- |
| BUG-001 | Scroll-to-bottom button visibility inconsistent          | Medium   | ✅ Fixed             |
| BUG-002 | Auto-scroll animation when changing conversation         | High     | ✅ Verified Existing |
| BUG-003 | Empty state not showing when switching tabs              | High     | ✅ Verified Existing |
| BUG-004 | DM header showing current user name instead of recipient | Critical | ✅ Fixed             |
| BUG-005 | Wrong tab active when reloading DM conversation          | High     | ✅ Fixed             |
| BUG-006 | UI jerking when tab switches on reload                   | Medium   | ✅ Fixed             |
| BUG-007 | Category not highlighted when restoring conversation     | Medium   | ✅ Fixed             |

---

## 🎯 Expected Outcomes

1. **BUG-001:** Button cuộn xuống dưới hiển thị ổn định khi scroll lên
2. **BUG-002:** Conversation mới mở phải ở vị trí tin nhắn mới nhất (dưới cùng) ngay lập tức, không scroll animation
3. **BUG-003:** Khi chuyển tab Nhóm → Cá nhân (hoặc ngược lại) mà chưa chọn conversation, hiển thị EmptyChatState
4. **BUG-004:** DM header hiển thị tên người nhận, không phải tên user hiện tại

---

## 📂 Related Files

- `src/features/portal/components/chat/ChatHeader.tsx` - Bug #4
- `src/features/portal/workspace/ChatMain.tsx` - Bug #2, #3
- `src/features/portal/components/chat/ChatMainContainer.tsx` - Bug #1, #2, #4
- `src/components/EmptyChatState.tsx` - Bug #3
- `src/features/portal/workspace/ConversationListSidebar.tsx` - Bug #5, #6, #7
- `src/features/portal/workspace/WorkspaceView.tsx` - Bug #5

---

## 📝 Documentation Structure

```
docs/bugfixes/chat-ui-issues-20260130/
├── 00_README.md                    # This file
├── 01_analysis.md                  # [BƯỚC 1] Bug analysis ✅
├── 02_implementation-summary.md    # [BƯỚC 2] Implementation summary ✅
└── CHANGELOG.md                    # [BƯỚC 3] Change log ✅
```

---

## 🔄 Workflow Status

- [x] **BƯỚC 0:** Create documentation structure
- [x] **BƯỚC 1:** Bug analysis & root cause identification
- [x] **BƯỚC 2:** Implementation (2 fixes + 2 verified existing)
- [x] **BƯỚC 3:** Documentation complete
- [ ] **BƯỚC 4:** Manual testing & verification

---

## 👥 Stakeholders

- **Reporter:** HUMAN
- **Assignee:** AI
- **Reviewer:** HUMAN
