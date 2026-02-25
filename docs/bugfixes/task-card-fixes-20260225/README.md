# Bug Fix: TaskCard Issues - 2026-02-25

## 📋 Tổng quan

Sửa các lỗi liên quan đến TaskCard component trong conversation-detail.

## 🐛 Danh sách Bug

### Bug 1: Checklist cho phép check khi task chưa bắt đầu

**Mô tả:** Hiện tại có thể check vào checklist items khi task còn ở trạng thái "todo" (chưa bắt đầu).

**Expected:** Chỉ cho phép check/uncheck checklist items khi task đã bắt đầu (status = "doing" hoặc "need_to_verified").

**Solution:** Thêm điều kiện kiểm tra `status.code !== "todo"` trước khi cho phép toggle checklist item.

---

### Bug 2: Không thể nhấn Enter để lưu khi thêm/sửa mục checklist

**Mô tả:** Khi thêm hoặc sửa mục trong checklist, user phải click nút "Lưu", không thể nhấn Enter.

**Expected:** Cho phép nhấn Enter để lưu thay đổi, cải thiện UX.

**Solution:** Thêm `onKeyDown` handler để xử lý phím Enter trên input field.

---

### Bug 3: Task đã hoàn thành vẫn hiển thị dropdown select "Giao cho"

**Mô tả:** Khi task ở trạng thái "finished" (hoàn thành), phần "Giao cho" vẫn hiển thị dạng dropdown select.

**Expected:** Task đã hoàn thành nên hiển thị text tĩnh thay vì dropdown (giống trạng thái "need_to_verified").

**Solution:** Thêm điều kiện `status.code !== "finished"` vào điều kiện hiển thị dropdown.

---

## 📁 Files Changed

| File                                                       | Action   | Description      |
| ---------------------------------------------------------- | -------- | ---------------- |
| `src/features/conversation-detail/components/TaskCard.tsx` | Modified | Fix 3 bugs above |

## 🔧 Chi tiết thay đổi

### 1. Checklist Toggle Logic

```tsx
// Before: Không kiểm tra status
<button onClick={async () => { ... }}>

// After: Disable khi task chưa bắt đầu
const canToggleChecklist = t.status.code !== 'todo';

<button
  disabled={!canToggleChecklist || toggleCheckItemMutation.isPending}
  onClick={async () => { ... }}
>
```

### 2. Enter Key Handler

```tsx
// Before: Chỉ có onChange
<input
  value={newLabel}
  onChange={(e) => setNewLabel(e.target.value)}
/>

// After: Thêm onKeyDown
<input
  value={newLabel}
  onChange={(e) => setNewLabel(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && newLabel.trim()) {
      // Trigger save
    }
  }}
/>
```

### 3. Assignee Display Logic

```tsx
// Before
{
  t.status.code !== "need_to_verified" ? (
    <select>...</select>
  ) : (
    <span>...</span>
  );
}

// After
{
  t.status.code !== "need_to_verified" && t.status.code !== "finished" ? (
    <select>...</select>
  ) : (
    <span>...</span>
  );
}
```

## ✅ Testing

- [ ] Task ở trạng thái "todo" không thể check checklist items
- [ ] Task ở trạng thái "doing" có thể check/uncheck checklist items
- [ ] Nhấn Enter trong input thêm/sửa mục sẽ lưu thay đổi
- [ ] Nhấn Enter khi input trống không trigger save
- [ ] Task "finished" hiển thị text "Giao cho" thay vì dropdown
- [ ] Task "need_to_verified" vẫn hiển thị text như trước
- [ ] Button và label trong checklist được căn giữa (align center)
- [ ] Text trong label không bị chệch xuống dưới

## 🧪 data-testid additions

### Checklist Dialog

- `checklist-edit-dialog` - Dialog thêm/sửa mục
- `checklist-item-input` - Input text
- `checklist-cancel-button` - Nút Huỷ
- `checklist-save-button` - Nút Lưu

### Checklist List

- `checklist-toggle-header` - Header toggle expand/collapse
- `checklist-add-button` - Nút "+ Thêm" (khi có checklist)
- `checklist-add-button-empty` - Nút "+ Thêm" (khi không có checklist)
- `checklist-list` - Danh sách checklist
- `checklist-item-{id}` - Item trong checklist
- `checklist-toggle-{id}` - Button toggle check/uncheck
- `checklist-label-{id}` - Label text của item
- `checklist-edit-{id}` - Nút edit item
- `checklist-delete-{id}` - Nút xoá item

### Action Buttons

- `task-log-button` - Nút Nhật ký
- `task-start-button` - Nút Bắt đầu
- `task-complete-button` - Nút Hoàn tất (need verify)
- `task-finish-button` - Nút Hoàn tất (finish)

## 📅 Timeline

- **Created:** 2026-02-25
- **Status:** ✅ Completed
