import { useState } from "react";
import { X, Pencil, Trash2, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoConfigStore, TAG_COLORS } from "@/stores/demoConfigStore";
import type { VendorTag } from "@/stores/demoConfigStore";

interface Props {
  onClose: () => void;
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="absolute right-0 top-8 z-50 rounded-xl bg-white p-3 shadow-2xl border border-gray-100">
      <p className="mb-2 text-xs font-medium text-gray-500">Thay đổi màu thẻ</p>
      <div className="flex gap-1.5">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{ backgroundColor: c }}
          >
            {value === c && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tag Row (view mode) ───────────────────────────────────────────────────────

function TagRow({
  tag,
  onEdit,
  onDelete,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  tag: VendorTag;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 group transition-colors select-none",
        isDragging ? "opacity-40" : "opacity-100",
        isDragOver ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-gray-50",
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-gray-300 cursor-grab active:cursor-grabbing" />
      <span
        className="inline-block h-5 w-5 shrink-0 rounded"
        style={{ backgroundColor: tag.color }}
      />
      <span className="flex-1 text-sm text-gray-800">{tag.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Inline Edit / Add Form ───────────────────────────────────────────────────

function TagForm({
  initialName,
  initialColor,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  initialColor: string;
  submitLabel: string;
  onSubmit: (name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      <p className="mb-1.5 text-xs font-medium text-gray-500">Tên thẻ phân loại</p>
      <div className="relative mb-3">
        <input
          autoFocus
          type="text"
          placeholder="Nhập tên thẻ phân loại"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSubmit(name.trim(), color);
            if (e.key === "Escape") onCancel();
          }}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="rounded"
          >
            <span
              className="block h-5 w-5 rounded"
              style={{ backgroundColor: color }}
            />
          </button>
          {showPicker && (
            <ColorPicker
              value={color}
              onChange={(c) => {
                setColor(c);
                setShowPicker(false);
              }}
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => name.trim() && onSubmit(name.trim(), color)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors",
            name.trim()
              ? "bg-brand-600 hover:bg-brand-700"
              : "cursor-not-allowed bg-gray-200 text-gray-400",
          )}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function TagManagementModal({ onClose }: Props) {
  const { vendorTags, addVendorTag, updateVendorTag, deleteVendorTag, reorderVendorTags } =
    useDemoConfigStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDraggingIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (index !== draggingIndex) setDragOverIndex(index);
  };

  const handleDrop = (toIndex: number) => {
    if (draggingIndex !== null && draggingIndex !== toIndex) {
      reorderVendorTags(draggingIndex, toIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] max-h-[80vh] flex flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-800">Quản lý thẻ phân loại</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Danh sách thẻ phân loại
          </p>

          {vendorTags.length === 0 && !isAdding && (
            <p className="py-4 text-center text-sm text-gray-400">
              Chưa có thẻ phân loại nào.
            </p>
          )}

          {vendorTags.map((tag, index) =>
            editingId === tag.id ? (
              <div key={tag.id} className="mb-1">
                <TagForm
                  initialName={tag.name}
                  initialColor={tag.color}
                  submitLabel="Lưu"
                  onSubmit={(name, color) => {
                    updateVendorTag(tag.id, name, color);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <TagRow
                key={tag.id}
                tag={tag}
                index={index}
                isDragging={draggingIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onEdit={() => {
                  setIsAdding(false);
                  setEditingId(tag.id);
                }}
                onDelete={() => deleteVendorTag(tag.id)}
              />
            ),
          )}

          {isAdding && (
            <div className="mt-1">
              <TagForm
                initialName=""
                initialColor={TAG_COLORS[0]}
                submitLabel="Thêm phân loại"
                onSubmit={(name, color) => {
                  addVendorTag(name, color);
                  setIsAdding(false);
                }}
                onCancel={() => setIsAdding(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!isAdding && editingId === null && (
          <div className="border-t border-gray-100 px-6 py-3">
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Thêm phân loại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
