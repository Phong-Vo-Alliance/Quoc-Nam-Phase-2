import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, X } from "lucide-react";
import type { CheckListTemplateResponse } from "@/types/checklist-templates";

interface AddEditChecklistTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CheckListTemplateResponse | null; // null = add new
  conversationId: string;
  existingNames: string[];
  onSave: (data: {
    name: string;
    description: string | null;
    items: string[]; // Changed to string array to match API
  }) => void;
}

interface TemplateItem {
  id: string;
  content: string;
  order: number;
}

export const AddEditChecklistTemplateDialog: React.FC<AddEditChecklistTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  conversationId,
  existingNames,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (template) {
        // Edit mode
        setName(template.name);
        setDescription(template.description || "");
        setItems(
          template.items.map((item) => ({
            id: item.id,
            content: item.content,
            order: item.order,
          }))
        );
      } else {
        // Add mode - start with one empty item
        setName("");
        setDescription("");
        setItems([
          {
            id: `item-${Date.now()}`,
            content: "",
            order: 0,
          },
        ]);
      }
      setError("");
    }
  }, [open, template]);

  const validate = (): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Tên mẫu checklist không được để trống";
    }

    if (trimmedName.length > 100) {
      return "Tên mẫu không được vượt quá 100 ký tự";
    }

    // Check duplicate (exclude current template when editing)
    const isDuplicate = existingNames.some(
      (n) =>
        n.toLowerCase() === trimmedName.toLowerCase() &&
        n !== template?.name
    );
    if (isDuplicate) {
      return "Tên mẫu checklist đã tồn tại";
    }

    // Validate items
    const filledItems = items.filter((item) => item.content.trim());
    if (filledItems.length === 0) {
      return "Phải có ít nhất 1 mục trong checklist";
    }

    return null;
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        content: "",
        order: items.length,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setError("Phải có ít nhất 1 mục trong checklist");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, content: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, content } : item))
    );
    setError("");
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Filter out empty items and return as simple string array
    const validItems = items
      .filter((item) => item.content.trim())
      .map((item) => item.content.trim());

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      items: validItems,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, isTextarea: boolean = false) => {
    if (e.key === "Enter" && !isTextarea && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? "Chỉnh sửa Mẫu Checklist" : "Thêm Mẫu Checklist"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Template Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tên mẫu checklist <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên mẫu checklist..."
              autoFocus
              maxLength={101}
            />
            <p className="text-xs text-gray-500 mt-1">
              {name.trim().length}/100 ký tự
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Mô tả (tùy chọn)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho mẫu checklist..."
              rows={2}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.trim().length}/500 ký tự
            </p>
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Các mục trong checklist <span className="text-rose-500">*</span>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddItem}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Thêm mục
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-3 min-w-[20px]">
                    {index + 1}.
                  </span>
                  <Input
                    value={item.content}
                    onChange={(e) => handleItemChange(item.id, e.target.value)}
                    placeholder="Nhập nội dung mục..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={items.length <= 1}
                    className="mt-1"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Tổng số mục: {items.filter((i) => i.content.trim()).length}
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Lưu ý:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Tên mẫu không được trùng với mẫu hiện có</li>
                <li>Phải có ít nhất 1 mục trong checklist</li>
                <li>Các mục để trống sẽ bị bỏ qua khi lưu</li>
                <li>Mẫu này sẽ được áp dụng cho nhóm chat hiện tại</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || items.filter((i) => i.content.trim()).length === 0}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
