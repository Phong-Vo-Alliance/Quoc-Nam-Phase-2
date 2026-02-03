# [BƯỚC 0] Feature: Hide Tasks Tab in Personal Chat

> **Module:** Chat  
> **Feature:** Conditional tab visibility in ConversationDetailPanel  
> **Status:** ✅ COMPLETED  
> **Created:** 2026-02-02  
> **Completed:** 2026-02-02

---

## 📋 Overview

Ẩn tab "Công việc" trong ConversationDetailPanel khi đang ở chat cá nhân (1-1 chat). Chỉ hiển thị tab "Thông tin".

## 🎯 Goals

- Hide "Công việc" tab for personal (1-1) conversations
- Keep "Thông tin" tab visible
- Maintain current behavior for group chats (both tabs visible)

## 📁 Documents

| Step | File                      | Status          |
| ---- | ------------------------- | --------------- |
| 0    | 00_README.md              | ✅ Done         |
| 1    | 01_requirements.md        | ✅ Approved     |
| 2A   | 02a_wireframe.md          | ✅ Approved     |
| 3    | 03_api-contract.md        | ❌ N/A (no API) |
| 4    | 04_implementation-plan.md | ✅ Approved     |
| 5    | 05_progress.md            | ✅ Complete     |
| 6    | 06_testing.md             | ❌ N/A (manual) |

## 🔗 Related

- Component: `ConversationDetailPanel.tsx`
- Related feature: Message Date Separators (same session)
