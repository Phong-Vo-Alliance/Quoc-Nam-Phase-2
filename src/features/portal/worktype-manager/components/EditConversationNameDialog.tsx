import React, { useState, useEffect, useRef } from "react";
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
import { useUpdateGroupName } from "@/hooks/mutations/useGroupMutations";
import { sendMessage } from "@/api/messages.api";


interface EditConversationNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationName: string;
  categoryName: string;
  existingNames: string[];
  onSuccess?: () => void | Promise<void>;
}

export const EditConversationNameDialog: React.FC<EditConversationNameDialogProps> = ({
  open,
  onOpenChange,
  conversationId,
  conversationName,
  categoryName,
  existingNames,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const isSavingRef = useRef(false);

  const updateGroupMutation = useUpdateGroupName();

  useEffect(() => {
    if (open) {
      setName(conversationName);
      setError("");
      isSavingRef.current = false;
    }
  }, [open, conversationName]);

  const validate = (value: string): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Tên loại việc không được để trống";
    }

    if (trimmed.length > 100) {
      return "Tên loại việc không được vượt quá 100 ký tự";
    }

    // Check duplicate (excluding current name)
    if (
      existingNames.some(
        (n) => n.toLowerCase() === trimmed.toLowerCase() && n !== conversationName
      )
    ) {
      return "Tên loại việc đã tồn tại";
    }

    return null;
  };

  const handleSave = async () => {
    if (isSavingRef.current) return;

    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedName = name.trim();
    isSavingRef.current = true;

    try {
      await updateGroupMutation.mutateAsync({
        groupId: conversationId,
        name: trimmedName,
      });

      // Send system message about the rename
      try {
        await sendMessage({
          conversationId,
          content: `Loại việc ${conversationName} thuộc nhóm ${categoryName} đã đổi tên thành ${trimmedName}`,
          messageType: "SYS",
        });
      } catch (msgErr) {
        // System message failure should not block the rename
        console.warn("Failed to send system message for work type rename", msgErr);
      }

      await onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đã xảy ra lỗi khi đổi tên");
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Đổi tên loại việc</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
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
              placeholder="Nhập tên..."
              autoFocus
              maxLength={101}
            />
            <p className="text-xs text-gray-500 mt-1">
              {name.trim().length}/100 ký tự
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateGroupMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || updateGroupMutation.isPending}
          >
            {updateGroupMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
