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
import { AlertCircle, Loader2 } from "lucide-react";
import type { WorkType } from "../../types";

interface AddEditWorkTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workType: WorkType | null; // null = add new
  existingNames: string[];
  onSave: (name: string) => Promise<void>;
}

export const AddEditWorkTypeDialog: React.FC<AddEditWorkTypeDialogProps> = ({
  open,
  onOpenChange,
  workType,
  existingNames,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(workType?.name ?? "");
      setError("");
      setIsSubmitting(false);
    }
  }, [open, workType]);

  const validate = (value: string): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Tên loại việc không được để trống";
    }

    if (trimmed.length > 50) {
      return "Tên loại việc không được vượt quá 50 ký tự";
    }

    // Check special characters (only allow letters, numbers, spaces, Vietnamese, and -_,)
    const specialCharRegex = /[^a-zA-ZÀ-ỹ0-9\s\-_,]/;
    if (specialCharRegex.test(trimmed)) {
      return "Tên loại việc không được chứa ký tự đặc biệt";
    }

    // Check duplicate
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return "Tên loại việc đã tồn tại trong nhóm";
    }

    return null;
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSave(name.trim());
      // Dialog will be closed by parent after success
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại");
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => !isSubmitting && onOpenChange(open)}
    >
      <DialogContent
        className="max-w-[450px]"
        data-testid="add-edit-work-type-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {workType ? "Chỉnh sửa loại việc" : "Thêm loại việc"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tên loại việc <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên loại việc..."
              autoFocus
              maxLength={51} // Allow 51 to show error
              disabled={isSubmitting}
              data-testid="work-type-name-input"
            />
            <p
              className="text-xs text-gray-500 mt-1"
              data-testid="work-type-name-char-count"
            >
              {name.trim().length}/50 ký tự
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" data-testid="work-type-name-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          {workType ? (
            <Alert data-testid="work-type-info-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Cập nhật tên loại việc sẽ ảnh hưởng đến tất cả task và tin nhắn
                liên quan.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert data-testid="work-type-info-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Lưu ý:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Tên không được trùng với loại việc hiện có</li>
                  <li>Không được chứa ký tự đặc biệt</li>
                  <li>Sau khi thêm, bạn có thể quản lý dạng checklist</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            data-testid="work-type-cancel-button"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSubmitting}
            data-testid="work-type-save-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
