import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import type { Message, ReceivedInfo } from "@/features/portal/types";
import { ClipboardPlus, User, ListChecks, X } from "lucide-react";

interface Props {
  open: boolean;

  source?: "message" | "receivedInfo";
  message?: Message;
  info?: ReceivedInfo;

  // Members available in the current group
  members: Array<{ id: string; name: string }>;

  // Checklist variants for the current work type
  checklistVariants?: { id: string; name: string; isDefault?: boolean }[];

  // Default variant id (optional)
  defaultChecklistVariantId?: string;

  onClose: () => void;

  onCreateTask: (payload: {
    title: string;
    messageId: string;
    assignTo: string;
    checklistVariantId?: string;
    checklistVariantName?: string;
  }) => void;
}

export const MobileAssignTaskSheet: React.FC<Props> = ({
  open,
  source = "message",
  message,
  info,
  members,
  checklistVariants = [],
  defaultChecklistVariantId,
  onClose,
  onCreateTask,
}) => {
  const [assignee, setAssignee] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [checklistVariantId, setChecklistVariantId] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;

    // Prefill title
    if (source === "message" && message) {
      const raw = message.content || "";
      setTitle(raw.length > 0 ? raw : "Công việc mới");
    } else if (source === "receivedInfo" && info) {
      setTitle(info.title || "Công việc mới");
    } else {
      setTitle("Công việc mới");
    }

    // Default assignee
    setAssignee(members[0]?.id ?? "");

    // Default variant
    const def =
      defaultChecklistVariantId ??
      checklistVariants.find((v) => v.isDefault)?.id ??
      checklistVariants[0]?.id ??
      "";
    setChecklistVariantId(def);
  }, [open, source, message, info, members, checklistVariants, defaultChecklistVariantId]);

  const canSubmit = title.trim().length > 0 && assignee;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const variant = checklistVariantId || undefined;
    const selectedVariant = checklistVariants?.find((v) => v.id === variant);
    const messageId =
      (source === "message" ? message?.id : info?.messageId) || "";

    onCreateTask({
      title: title.trim(),
      messageId,
      assignTo: assignee,
      checklistVariantId: variant,
      checklistVariantName: selectedVariant?.name,
    });

    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="
          rounded-t-2xl z-[200] shadow-2xl
          px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]
          max-h-[88vh] flex flex-col
          /* Centered narrow sheet to fit the mobile frame even on desktop preview */
          w-[92vw] max-w-[430px] left-1/2 -translate-x-1/2 right-auto top-auto
        "
        style={{
          // Inline styles win over Sheet's default inset-x:0; ensure true centering and width
          width: "min(92vw, 430px)",
          left: "50%",
          right: "auto",
          transform: "translateX(-50%)",
          marginBottom: "100px",
        }}
      >
        {/* Header (sticky) */}
        <SheetHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 -mx-4 px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardPlus className="w-5 h-5 text-brand-600" />
              <SheetTitle className="text-base font-semibold text-gray-900">Giao công việc</SheetTitle>
            </div>
            <button aria-label="Đóng" className="rounded-md p-1 hover:bg-gray-100" onClick={onClose}>
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </SheetHeader>
       

        {/* Form fields */}
        <div className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Tên công việc</Label>
            <div className="relative mt-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-full border px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
                placeholder="Nhập tên công việc…"
                maxLength={160}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                {title.length}/160
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Giao cho</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="mt-1 w-full rounded-lg border bg-white">
                <SelectValue placeholder="Chọn nhân viên…" />
              </SelectTrigger>
              <SelectContent className="max-h-[260px] z-[250]" position="popper" sideOffset={4}>
                {members.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">Chưa có thành viên trong nhóm.</div>
                ) : (
                  members.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{m.name}</span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Checklist variant — radio list (compact circular radios) */}
          {checklistVariants.length > 0 && (
            <div>
              <Label className="text-xs font-medium text-gray-700">Dạng checklist</Label>
              <RadioGroup
                className="mt-2 space-y-1"
                value={checklistVariantId}
                onValueChange={(v) => setChecklistVariantId(v)}
              >
                {checklistVariants.map((v) => {
                  const id = `rg-${v.id}`;
                  return (
                    <div key={v.id} className="flex items-center gap-3 py-2">
                      <RadioGroupItem
                        value={v.id}
                        id={id}
                        className="
                          h-5 w-5 rounded-full border-2
                          border-brand-300 text-brand-600
                          data-[state=checked]:border-brand-600
                          data-[state=checked]:ring-2 data-[state=checked]:ring-brand-200
                        "
                      />
                      <label htmlFor={id} className="flex items-center gap-2 text-sm text-gray-800">
                        <ListChecks className="w-4 h-4 text-gray-500" />
                        <span>{v.name}</span>
                        {v.isDefault && (
                          <span className="ml-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px]">
                            Mặc định
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="mt-6">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit}>
              Giao việc
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default MobileAssignTaskSheet;