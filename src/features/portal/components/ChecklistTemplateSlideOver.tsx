import React from "react";
import { ChecklistTemplateItem, ChecklistVariant } from "../types";
import { Plus, X as XIcon, Trash, Save } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useChecklistTemplates } from "@/hooks/queries/useChecklistTemplates";
import { transformTemplateItems } from "@/utils/checklistTemplateTransform";
import { useUpdateChecklistTemplate } from "@/hooks/mutations/useTaskMutations";
import type { CheckListTemplateResponse } from "@/types/tasks_api";
import { useConversationStore } from "@/stores";

type Props = {
  open: boolean;
  onClose: () => void;
  workTypeName: string;
  template: ChecklistTemplateItem[];
  onChange: (next: ChecklistTemplateItem[]) => void;
  conversationId?: string; // Current active conversation/group chat ID
  // Optional – danh sách “Dạng checklist” cho Loại việc hiện tại
  checklistVariants?: ChecklistVariant[];
  // Variant đang được chọn (ví dụ khi lead vừa chọn sub-work-type trong AssignTaskSheet)
  activeVariantId?: string;
  // Notify ra ngoài khi user đổi “Dạng checklist”
  onChangeVariant?: (variantId: string) => void;
};

export const ChecklistTemplateSlideOver: React.FC<Props> = ({
  open,
  onClose,
  workTypeName,
  template,
  onChange,
  conversationId,
  checklistVariants,
  activeVariantId,
  onChangeVariant,
}) => {
  // Fetch templates from API filtered by conversationId
  const { data: apiTemplates, isLoading: templatesLoading } =
    useChecklistTemplates();

  // Update template mutation
  const updateTemplateMutation = useUpdateChecklistTemplate();

  // State for selected API template
  const [selectedApiTemplateId, setSelectedApiTemplateId] =
    React.useState<string>("");
  const [selectedTemplateName, setSelectedTemplateName] =
    React.useState<string>("");
  const [selectedTemplateDescription, setSelectedTemplateDescription] =
    React.useState<string>("");

  const [items, setItems] = React.useState<ChecklistTemplateItem[]>(template);
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const newItemRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedVariantId, setSelectedVariantId] = React.useState(
    activeVariantId ?? checklistVariants?.[0]?.id ?? "",
  );

  // Đồng bộ lại khi props activeVariantId hoặc danh sách variant thay đổi
  React.useEffect(() => {
    setSelectedVariantId((prev) => {
      if (activeVariantId && activeVariantId !== prev) {
        return activeVariantId;
      }
      if (!prev && checklistVariants && checklistVariants.length > 0) {
        return checklistVariants[0].id;
      }
      return prev;
    });
  }, [activeVariantId, checklistVariants]);

  React.useEffect(() => {
    setItems(template);
  }, [template]);

  // Load template when API template is selected
  const handleLoadApiTemplate = (templateId: string) => {
    setSelectedApiTemplateId(templateId);
    const selectedTemplate = apiTemplates?.find(
      (t: CheckListTemplateResponse) => t.id === templateId,
    );
    if (selectedTemplate) {
      const transformed = transformTemplateItems(selectedTemplate);
      setItems(transformed);
      setSelectedTemplateName(selectedTemplate.name ?? "");
      setSelectedTemplateDescription(selectedTemplate.description || "");
    }
  };

  const update = (id: string, label: string) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
  };

  const add = () => {
    const newId = "tpl_" + Date.now().toString(36);

    setItems((prev) => [...prev, { id: newId, label: "" }]);

    // Sau khi state cập nhật, focus vào input mới
    setTimeout(() => {
      const el = inputRefs.current[newId];
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "nearest" });
      }
    }, 0);
  };

  const save = async () => {
    // If a template is selected from API, update it via API
    if (selectedApiTemplateId && selectedApiTemplateId !== "new") {
      try {
        const itemLabels = items
          .map((item) => item.label)
          .filter((label) => label.trim() !== "");

        // Transform string[] items to proper checklist item format
        const transformedItems = itemLabels.map((label, index) => ({
          content: label,
          order: index,
          isRequired: false,
        }));

        await updateTemplateMutation.mutateAsync({
          templateId: selectedApiTemplateId,
          payload: {
            id: selectedApiTemplateId,
            name: selectedTemplateName,
            description: selectedTemplateDescription || null,
            conversationId: conversationId || null,
            items: transformedItems.length > 0 ? transformedItems.map(item => item.content) : undefined,
          },
        });

        // Notify parent and close
        onChange(items);
        onClose();
      } catch (error) {
        console.error("Failed to update template:", error);
        // Could show a toast notification here
      }
    } else {
      // Just update local state if no API template is selected
      onChange(items);
      onClose();
    }
  };

  // Get conversation/group name from store (MUST be before early return to follow React hooks rules)
  const conversationName = useConversationStore((s) => s.getConversationName()) || "Nhóm";

  console.log("Rendering ChecklistTemplateSlideOver with items:", items);
  console.log("Selected API Template ID:", selectedApiTemplateId);
  if (!open) return null;
  const _apiTemplates = apiTemplates?.filter( api_template => {return checklistVariants?.map( _ => _.id).includes(api_template.id)});
  console.log("Filtered API Templates for current variants:",checklistVariants);
  console.log(apiTemplates)
  console.log(_apiTemplates)
  
  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-black/30">
      <div className="w-[400px] max-w-full h-full bg-white shadow-2xl border-l border-emerald-50 animate-slide-left flex flex-col">
        {/* Header – Linear Style */}
        <div
          className="
            px-4 py-4 
            bg-gradient-to-r from-white via-emerald-50/20 to-white
            shadow-lg border-l border-gray-200
          "
        >
          {/* Top row: Title + Close */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Checklist Mặc Định
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Áp dụng cho loại việc:{" "}
                <span className="font-medium text-gray-700">
                  {conversationName}
                </span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="
                rounded-full px-2 py-1 text-[11px]
                bg-gray-50 hover:bg-gray-100
                text-gray-500 hover:text-emerald-600
                border border-gray-200
                transition
              "
            >
              ✕
            </button>
          </div>

          {/* Template Selection Section */}
          <div className="mt-4">
            {/* Select from existing templates */}
            <div>
              <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">
                Chọn checklist Để Chỉnh Sửa
              </label>
              <div className="mt-1">
                <Select
                  value={selectedApiTemplateId}
                  onValueChange={handleLoadApiTemplate}
                  disabled={templatesLoading}
                >
                  <SelectTrigger className="w-full h-8 text-xs rounded-md border border-gray-300 bg-white px-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue
                      placeholder={
                        templatesLoading
                          ? "Đang tải..."
                          : "Chọn Checklist để chỉnh sửa..."
                      }
                    />
                  </SelectTrigger>

                  <SelectContent position="popper" className="z-[9999]">
                    {_apiTemplates && _apiTemplates.length > 0 ? (
                      _apiTemplates.map((t: CheckListTemplateResponse) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name || `Template ${t.id.slice(0, 8)}`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-gray-500">
                        Chưa có template nào
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 pt-5 pb-2">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="
                    group
                    flex items-center justify-between
                    rounded-md border border-gray-200 bg-white
                    hover:bg-emerald-50/40 transition-colors
                    px-3 py-1.5
                    relative z-0 overflow-visible
                    min-w-full
                  "
                >
                  <input
                    ref={(el) => {
                      // nếu là item cuối thì gán ref
                      if (items[items.length - 1]?.id === it.id) {
                        newItemRef.current = el;
                      }
                    }}
                    className="
                      flex-grow bg-transparent border-none px-0
                      focus:outline-none focus:ring-0
                      text-[12px] text-gray-800 placeholder:text-gray-400 min-w-0                  
                    "
                    value={it.label}
                    onChange={(e) => update(it.id, e.target.value)}
                    placeholder="Tên mục..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const isLast = items[items.length - 1]?.id === it.id;
                        if (isLast) {
                          const newId = "tpl_" + Date.now().toString(36);

                          setItems((prev) => [
                            ...prev,
                            { id: newId, label: "" },
                          ]);

                          // báo rằng item mới cần được focus
                          requestAnimationFrame(() => {
                            if (newItemRef.current) {
                              newItemRef.current.focus();
                            }
                          });
                        }
                      }
                    }}
                  />

                  <div className="relative group shrink-0">
                    <button
                      onClick={() => remove(it.id)}
                      className="
                        shrink-0
                        opacity-0 group-hover:opacity-100
                        text-gray-400 hover:text-rose-500
                        p-1 rounded-full
                        transition
                      "
                      title="Xoá mục"
                    >
                      <Trash className="h-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Chưa có mục nào</p>
              <p className="text-xs mt-1">
                Chọn template từ danh sách hoặc nhấn "Thêm mục" để bắt đầu
              </p>
            </div>
          )}

          <button
            onClick={add}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 rounded-full border border-dashed border-emerald-300 px-3 py-1.5 hover:bg-emerald-50 transition"
          >
            <Plus className="w-3 h-3" /> Thêm mục
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto px-4 pt-3 pb-3 border-t border-gray-200 bg-white/95 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {items.length} mục trong checklist mặc định
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[12px] text-gray-600 bg-gray-50 hover:bg-gray-100"
            >
              Hủy
            </button>

            <button
              onClick={save}
              disabled={
                items.length === 0 ||
                updateTemplateMutation.isPending ||
                !selectedApiTemplateId
              }
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="save-checklist-button"
            >
              <Save className="w-3 h-3" />
              {updateTemplateMutation.isPending ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>

      {/* ANIMATION */}
      <style>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slide-left 0.22s ease-out;
        }
      `}</style>
    </div>
  );
};
