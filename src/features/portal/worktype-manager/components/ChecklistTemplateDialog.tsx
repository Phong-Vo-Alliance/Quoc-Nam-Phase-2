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

interface ChecklistTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CheckListTemplateResponse | null;
  conversationId: string;
  existingNames: string[];
  onSave: (data: {
    name: string;
    description: string | null;
    items: string[];
  }) => void;
}

export const ChecklistTemplateDialog: React.FC<ChecklistTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  conversationId,
  existingNames,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [error, setError] = useState("");

  const isEdit = !!template;

  // Initialize form when template changes or dialog opens
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setDescription(template.description || "");
        // Extract content strings from TemplateItemDto[] objects
        const itemStrings = template.items && template.items.length > 0 
          ? template.items.map(item => item.content) 
          : [""];
        setItems(itemStrings);
      } else {
        setName("");
        setDescription("");
        setItems([""]);
      }
      setError("");
    }
  }, [open, template]);

  const validate = (): string => {
    if (!name.trim()) {
      return "Vui lòng nhập tên mẫu checklist";
    }

    const trimmedName = name.trim();
    const isDuplicate = existingNames.some(
      (existingName) =>
        existingName.toLowerCase() === trimmedName.toLowerCase() &&
        existingName !== template?.name
    );

    if (isDuplicate) {
      return "Tên mẫu checklist đã tồn tại";
    }

    const validItems = items.filter((item) => item.trim());
    if (validItems.length === 0) {
      return "Vui lòng thêm ít nhất một mục trong checklist";
    }

    return "";
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const validItems = items.filter((item) => item.trim()).map((item) => item.trim());

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      items: validItems,
    });

    onOpenChange(false);
  };

  const handleAddItem = () => {
    setItems([...items, ""]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="checklist-template-dialog">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa mẫu checklist" : "Thêm mẫu checklist mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <Alert variant="destructive" data-testid="template-error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Template Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tên mẫu <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="VD: Checklist giao hàng"
              data-testid="template-name-input"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả (tùy chọn)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về mẫu checklist này..."
              rows={2}
              data-testid="template-description-input"
            />
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Các mục trong checklist <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="h-7"
                data-testid="add-item-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm mục
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={item}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      placeholder={`Mục ${index + 1}`}
                      data-testid={`item-input-${index}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="h-9 w-9 p-0"
                    data-testid={`remove-item-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Thêm các mục cần kiểm tra. Để trống để xóa mục không cần thiết.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="cancel-button"
          >
            Hủy
          </Button>
          <Button onClick={handleSave} data-testid="save-button">
            {isEdit ? "Cập nhật" : "Tạo mẫu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
