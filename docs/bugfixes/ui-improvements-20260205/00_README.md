# Bugfix: UI Improvements (5 Issues)

**Date:** 2026-02-05  
**Type:** UI Bug Fixes (Non-invasive)  
**Module:** Chat, ConversationList  
**Priority:** Medium

---

## 📋 Overview

Sửa 5 vấn đề UI minor không ảnh hưởng logic:

1. **ChatHeader Loading State** - ChatHeader hiển thị tên category khi categories đang load
2. **Empty Chat Scrollbar** - Scroll bar xuất hiện khi chưa có tin nhắn
3. **Category List Scroll** - Scroll category list kéo theo cả search box
4. **Tab Switch on Quote Jump** - Click "xem tin nhắn gốc" ở tab Công việc bị nhảy về tab Thông tin
5. **Starred Modal Auto-Close** - Modal "Tin đánh dấu (tất cả)" tự đóng khi click vào tin nhắn

---

## 📁 Structure

```
docs/bugfixes/ui-improvements-20260205/
├── 00_README.md                    # This file
├── 01_analysis.md                  # Root cause analysis
├── 02_implementation-plan.md       # Fix plan with HUMAN confirmation
└── 03_progress.md                  # Implementation progress (auto-generated)
```

---

## 🔗 Related Files

- `src/features/portal/components/chat/ChatMainContainer.tsx` - Issues #1, #2, #5
- `src/features/portal/components/chat/ChatHeader.tsx` - Issue #1
- `src/features/portal/components/ConversationListSidebar.tsx` - Issue #3
- `src/features/portal/components/InformationPanel.tsx` - Issue #4

---

## 📊 Status

| File                      | Status     |
| ------------------------- | ---------- |
| 00_README.md              | ✅ Created |
| 01_analysis.md            | ⏳ Next    |
| 02_implementation-plan.md | ⏳ Pending |
| 03_progress.md            | ⏳ Pending |

---

## 🎯 Success Criteria

- [ ] ChatHeader shows skeleton when categories loading
- [ ] No scrollbar in empty chat
- [ ] Category list scrolls independently from search box
- [ ] Tab stays on "Công việc" when clicking quoted message
- [ ] Starred modal stays open when clicking message
