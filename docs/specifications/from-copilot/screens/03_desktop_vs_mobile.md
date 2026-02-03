# 03. Desktop vs Mobile

> **Mục đích:** So sánh giao diện Desktop và Mobile

---

## 1. Layout Comparison

### 1.1 Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────┐  ┌─────────────────────────┐  ┌────────────────────┐  │
│   │            │  │                         │  │                    │  │
│   │   LEFT     │  │                         │  │      RIGHT         │  │
│   │   PANEL    │  │      CHAT MAIN          │  │      PANEL         │  │
│   │            │  │                         │  │                    │  │
│   │   280px    │  │       flex: 1           │  │      320px         │  │
│   │            │  │                         │  │                    │  │
│   └────────────┘  └─────────────────────────┘  └────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

• 3 cột hiển thị đồng thời
• Right panel có thể toggle on/off
```

### 1.2 Tablet (768-1023px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────┐  ┌────────────────────────────────────────────────┐   │
│   │            │  │                                                │   │
│   │   LEFT     │  │                                                │   │
│   │   PANEL    │  │              CHAT MAIN                         │   │
│   │            │  │                                                │   │
│   │   250px    │  │              flex: 1                           │   │
│   │            │  │                                                │   │
│   └────────────┘  └────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

• 2 cột chính
• Right panel: Slide-in overlay khi click [ℹ️]
```

### 1.3 Mobile (<768px)

```
VIEW 1: Conversation List         VIEW 2: Chat
┌─────────────────────────┐      ┌─────────────────────────┐
│  Header                 │      │  [←] Group Name    [ℹ️] │
├─────────────────────────┤      ├─────────────────────────┤
│                         │      │                         │
│  🔍 Search...           │      │                         │
│                         │      │    Message List         │
│  ┌───────────────────┐  │      │                         │
│  │ Conversation 1    │──│──────│→                        │
│  └───────────────────┘  │      │                         │
│                         │      │                         │
│  ┌───────────────────┐  │      ├─────────────────────────┤
│  │ Conversation 2    │  │      │  Input Area             │
│  └───────────────────┘  │  ←───│──[←] Back               │
│                         │      └─────────────────────────┘
└─────────────────────────┘

• Single view tại một thời điểm
• Navigation: List → Chat → Back to List
• Right panel: Full-screen overlay
```

---

## 2. Navigation Differences

### 2.1 Desktop Navigation

```
Click conversation → Load chat (URL update)
Right panel always visible (toggle on/off)
No back button needed
```

### 2.2 Mobile Navigation

```
Step 1: View Conversation List
        │
        ▼ Click conversation
Step 2: View Chat (full screen)
        │
        ├─→ Click [ℹ️] → View Right Panel (overlay)
        │
        └─→ Click [←] → Back to List
```

---

## 3. Touch Interactions (Mobile)

### 3.1 Swipe Gestures

| Gesture               | Action                      |
| --------------------- | --------------------------- |
| Swipe right on chat   | Back to conversation list   |
| Swipe left on message | Show actions menu           |
| Long press message    | Show context menu           |
| Pull down             | Refresh/Load older messages |

### 3.2 Touch-Friendly Sizing

| Element           | Desktop        | Mobile            |
| ----------------- | -------------- | ----------------- |
| Conversation card | 64px height    | 72px height       |
| Message bubble    | Normal padding | Increased padding |
| Action buttons    | 32px           | 44px (tap target) |
| Input field       | 40px           | 48px              |

---

## 4. Feature Differences

| Feature            | Desktop    | Mobile              |
| ------------------ | ---------- | ------------------- |
| Hover actions      | ✅         | ❌ (use long press) |
| Drag & drop files  | ✅         | ❌ (use button)     |
| Keyboard shortcuts | ✅         | ❌                  |
| Right panel        | Toggle     | Full overlay        |
| Typing indicator   | Inline     | Bottom bar          |
| Multi-select       | Ctrl+Click | Long press + tap    |

---

## 5. Input Area

### 5.1 Desktop Input

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [📎]  [Nhập tin nhắn...]                                 [😊]  [➤]   │
└─────────────────────────────────────────────────────────────────────────┘

• Enter = Gửi
• Shift+Enter = Xuống dòng
```

### 5.2 Mobile Input

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [📎]  [📷]  [Nhập tin nhắn...]                           [😊]  [➤]   │
└─────────────────────────────────────────────────────────────────────────┘

• Thêm button camera [📷]
• Keyboard auto-show khi focus
• Send button luôn hiện (không cần Enter)
```

---

## 6. Right Panel on Mobile

### 6.1 Opening

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  [←] Group Name   [ℹ️]  │     │  RIGHT PANEL        [X] │
├─────────────────────────┤ ──→ ├─────────────────────────┤
│                         │     │                         │
│      Chat Main          │     │  [ℹ️] [📋] [📁] [👥]   │
│                         │     │                         │
│                         │     │     Tab Content         │
│                         │     │                         │
└─────────────────────────┘     └─────────────────────────┘
     Click [ℹ️]                     Full screen overlay
```

### 6.2 Closing

- Click [X]
- Swipe right
- Click outside (if partial overlay)
- Back button (Android)

---

## 7. Responsive Breakpoints

```css
/* Breakpoints used */
--mobile: 0 - 767px --tablet: 768px - 1023px --desktop: 1024px+;
```

---

## 8. Performance Considerations

| Aspect          | Desktop          | Mobile                |
| --------------- | ---------------- | --------------------- |
| Image loading   | Full quality     | Compressed thumbnails |
| Infinite scroll | Load 50 messages | Load 20 messages      |
| Animations      | All enabled      | Reduced motion option |
| Pre-fetch       | Aggressive       | Conservative          |

---

## 9. Liên Kết Tài Liệu

- 🔗 [Bản Đồ Màn Hình](./02_ban_do_man_hinh.md)
- 🔗 [Panel Thông Tin](./01_panel_thong_tin.md)
- 🔗 [Giao Diện Chat](../features/chat/01_giao_dien_chat.md)

---

_Cập nhật: 27/01/2026_
