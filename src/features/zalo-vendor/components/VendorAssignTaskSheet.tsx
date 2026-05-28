import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useVendorMembers } from "../hooks/useVendorMessages";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import type { VendorTaskChecklist } from "@/types/zalo";

// Hardcoded checklist templates for vendor context demo
const CHECKLIST_TEMPLATES: { id: string; name: string; items: string[] }[] = [
  {
    id: "tpl_contact",
    name: "Liên hệ & Xác nhận",
    items: ["Liên hệ NCC xác nhận thông tin", "Ghi nhận phản hồi", "Cập nhật vào hệ thống"],
  },
  {
    id: "tpl_check",
    name: "Kiểm tra hàng hóa",
    items: ["Kiểm tra số lượng thực tế", "Đối chiếu chứng từ", "Báo cáo kết quả"],
  },
  {
    id: "tpl_empty",
    name: "Không có checklist",
    items: [],
  },
];

// Mask phone numbers in plain text (for textarea values)
function maskPhoneInText(text: string): string {
  return text.replace(
    /(?:(?:\+|00)84|0)[2-9]\d[\s.]?\d{3,4}[\s.]?\d{3,4}|1[89]00(?:[\s.]?\d){4,7}/g,
    (phone) => {
      const digits = phone.replace(/[\s.]/g, "");
      return digits.slice(0, 2) + "*".repeat(digits.length - 2);
    },
  );
}

interface Props {
  open: boolean;
  groupId: string;
  messageId?: string;
  messageContent?: string;
  phoneHidden?: boolean;
  onClose: () => void;
  onAssigned?: () => void;
  onAssignTask: (
    messageId: string | null,
    title: string,
    assignToId: string,
    assignToName: string,
    checklist: VendorTaskChecklist[],
  ) => void;
}

export const VendorAssignTaskSheet: React.FC<Props> = ({
  open,
  groupId,
  messageId,
  messageContent,
  phoneHidden = false,
  onClose,
  onAssigned,
  onAssignTask,
}) => {
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const isAdmin = currentUser.role === "ADMIN";
  const { data: allMembers } = useVendorMembers(groupId);

  // Only internal members (ADMIN/STAFF) can be assigned — memoized to keep
  // the reference stable and avoid triggering the auto-select useEffect on every render.
  const assignableMembers = useMemo(
    () => allMembers.filter((m) => m.role !== "VENDOR"),
    [allMembers],
  );

  const [title, setTitle] = useState("");
  const [assignToId, setAssignToId] = useState("");
  const [templateId, setTemplateId] = useState(CHECKLIST_TEMPLATES[0].id);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [errors, setErrors] = useState<{ title?: string; assignTo?: string }>({});

  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-fill title from message content when sheet opens
  useEffect(() => {
    if (!open) return;
    if (messageContent) {
      const raw = messageContent.substring(0, 255);
      setTitle(!isAdmin && phoneHidden ? maskPhoneInText(raw) : raw);
    }
  }, [open, messageContent, isAdmin, phoneHidden]);

  // Auto-select current user as default assignee
  useEffect(() => {
    if (!open || assignToId) return;
    const self = assignableMembers.find(
      (m) => m.internalUserId === currentUser.id || m.id === currentUser.id,
    );
    if (self) {
      setAssignToId(self.internalUserId ?? self.id);
    } else if (assignableMembers.length > 0) {
      setAssignToId(assignableMembers[0].internalUserId ?? assignableMembers[0].id);
    }
  }, [open, assignableMembers, currentUser.id, assignToId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTitle("");
      setAssignToId("");
      setTemplateId(CHECKLIST_TEMPLATES[0].id);
      setCustomItems([]);
      setNewItem("");
      setErrors({});
    }
  }, [open]);

  // Auto-resize title textarea
  const autoResize = () => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [title]);

  const selectedTemplate = CHECKLIST_TEMPLATES.find((t) => t.id === templateId);

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setCustomItems((prev) => [...prev, trimmed]);
    setNewItem("");
  };

  const handleRemoveItem = (idx: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = "Tên công việc là bắt buộc";
    if (!assignToId) errs.assignTo = "Vui lòng chọn người thực hiện";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const member = assignableMembers.find(
      (m) => (m.internalUserId ?? m.id) === assignToId,
    );
    const assignToName = member?.displayName ?? assignToId;

    // Build checklist from template + custom items
    const templateItems = (selectedTemplate?.items ?? []).map((text, i) => ({
      id: `chk_tpl_${Date.now()}_${i}`,
      text,
      done: false,
    }));
    const customChecklist = customItems.map((text, i) => ({
      id: `chk_custom_${Date.now()}_${i}`,
      text,
      done: false,
    }));
    const checklist: VendorTaskChecklist[] = [...templateItems, ...customChecklist];

    onAssignTask(messageId ?? null, title.trim(), assignToId, assignToName, checklist);
    onAssigned?.();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-gray-100">
          <SheetTitle className="text-base font-semibold text-gray-900">
            Giao công việc
          </SheetTitle>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Tạo công việc mới cho thành viên trong nhóm
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 mt-4 space-y-4">
          {/* Task title */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Tên công việc <span className="text-red-500">*</span>
            </Label>
            <Textarea
              ref={titleRef}
              value={title}
              onChange={(e) => {
                const val = e.target.value.replace(/\n/g, "").slice(0, 255);
                setTitle(val);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Nhập tên công việc"
              rows={1}
              className={`resize-none overflow-hidden ${errors.title ? "border-red-500" : ""}`}
            />
            <div className="flex justify-between items-center">
              {errors.title ? (
                <p className="text-xs text-red-500">{errors.title}</p>
              ) : (
                <span />
              )}
              <span className={`text-xs ${title.length >= 255 ? "text-red-500" : "text-gray-400"}`}>
                {title.length}/255
              </span>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Giao cho <span className="text-red-500">*</span>
            </Label>
            <Select
              value={assignToId || undefined}
              onValueChange={(v) => {
                setAssignToId(v);
                if (errors.assignTo) setErrors((p) => ({ ...p, assignTo: undefined }));
              }}
            >
              <SelectTrigger className={errors.assignTo ? "border-red-500" : ""}>
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {assignableMembers.map((m) => {
                  const id = m.internalUserId ?? m.id;
                  const isSelf =
                    m.internalUserId === currentUser.id || m.id === currentUser.id;
                  return (
                    <SelectItem
                      key={m.id}
                      value={id}
                      className="group focus:bg-brand-600 focus:text-white"
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span>
                          {m.displayName}
                          {isSelf && " (Tôi)"}
                        </span>
                        <span className="text-[11px] text-gray-500 group-focus:text-white/75 capitalize">
                          {m.role === "ADMIN" ? "Quản lý" : "Nhân viên"}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.assignTo && (
              <p className="text-xs text-red-500">{errors.assignTo}</p>
            )}
          </div>

          {/* Checklist template */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Mẫu checklist</Label>
            <Select
              value={templateId}
              onValueChange={setTemplateId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECKLIST_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template preview + custom items */}
          {(selectedTemplate?.items.length ?? 0) > 0 || customItems.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-medium text-gray-700">
                Các mục checklist ({(selectedTemplate?.items.length ?? 0) + customItems.length})
              </div>
              <ul className="space-y-1.5">
                {(selectedTemplate?.items ?? []).map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
                {customItems.map((text, i) => (
                  <li key={`custom_${i}`} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                    <span className="flex-1">{text}</span>
                    <button
                      onClick={() => handleRemoveItem(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Add custom checklist item */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder="Thêm mục checklist..."
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-brand-400 transition-colors"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="px-2"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-white">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit}>Giao việc</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
