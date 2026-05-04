import React from "react";
import { ChecklistTemplateItem, ChecklistVariant } from "../types";
import { Plus, X as XIcon, Trash, Save, StickyNote } from "lucide-react";
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
import { useEscapeToClose } from "@/hooks/useEscapeToClose";

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
  const {
    data: apiTemplates,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
  } = useChecklistTemplates(conversationId);

  // Update template mutation
  const updateTemplateMutation = useUpdateChecklistTemplate();

  useEscapeToClose(
    open && !templatesLoading && !updateTemplateMutation.isPending,
    onClose,
  );

  // State for selected API template
  const [selectedApiTemplateId, setSelectedApiTemplateId] =
    React.useState<string>("");
  const [selectedTemplateName, setSelectedTemplateName] =
    React.useState<string>("");
  const [selectedTemplateDescription, setSelectedTemplateDescription] =
    React.useState<string>("");

  const [items, setItems] = React.useState<ChecklistTemplateItem[]>(template);
  const [expandedNoteIds, setExpandedNoteIds] = React.useState<Set<string>>(
    new Set(),
  );
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const noteRefs = React.useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [focusedNoteId, setFocusedNoteId] = React.useState<string | null>(null);
  const newItemRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedVariantId, setSelectedVariantId] = React.useState(
    activeVariantId ?? checklistVariants?.[0]?.id ?? "",
  );

  // Track if we've refetched for this dialog open session
  const hasRefetchedRef = React.useRef(false);

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

  // Reset state and refetch when dialog opens
  React.useEffect(() => {
    if (open) {
      // Reset selection to trigger auto-select again
      setSelectedApiTemplateId("");
      setSelectedTemplateName("");
      setSelectedTemplateDescription("");
      setItems([]);
      setExpandedNoteIds(new Set());

      // Force refetch once per dialog open to get latest data
      if (conversationId && !hasRefetchedRef.current) {
        hasRefetchedRef.current = true;
        refetchTemplates();
      }
    } else {
      // Reset refetch flag when dialog closes
      hasRefetchedRef.current = false;
    }
  }, [open, conversationId, refetchTemplates]);

  // Auto-select default template after data is loaded
  React.useEffect(() => {
    if (
      open &&
      apiTemplates &&
      apiTemplates.length > 0 &&
      !selectedApiTemplateId &&
      !templatesLoading
    ) {
      // Find default template, or use first template if no default exists
      const defaultTemplate =
        apiTemplates.find((t) => t.isDefault) || apiTemplates[0];

      // Load template
      setSelectedApiTemplateId(defaultTemplate.id);
      const transformed = transformTemplateItems(defaultTemplate);
      setItems(transformed);
      setSelectedTemplateName(defaultTemplate.name ?? "");
      setSelectedTemplateDescription(defaultTemplate.description || "");
    }
  }, [open, apiTemplates, selectedApiTemplateId, templatesLoading]);

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

  const updateNote = (id: string, note: string) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, note } : c)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
    setExpandedNoteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleNote = (id: string) => {
    let opened = false;
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        opened = true;
      }
      return next;
    });
    if (opened) {
      setFocusedNoteId(id);
    }
  };

  React.useEffect(() => {
    if (!focusedNoteId) return;
    const el = noteRefs.current[focusedNoteId];
    if (el) {
      el.focus();
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [focusedNoteId]);

  const isNoteVisible = (item: ChecklistTemplateItem) =>
    expandedNoteIds.has(item.id) || !!item.note?.trim();

  const add = () => {
    const newId = "tpl_" + Date.now().toString(36);

    setItems((prev) => [
      ...prev.map((item) => ({ ...item, label: item.label.trim() })),
      { id: newId, label: "", note: null },
    ]);

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
        const transformedItems = items
          .filter((item) => item.label.trim() !== "")
          .map((item) => ({
            content: item.label.trim(),
            note: item.note?.trim() ? item.note.trim() : null,
          }));

        // Get isDefault property from selected template
        const selectedTemplate = apiTemplates?.find(
          (t: CheckListTemplateResponse) => t.id === selectedApiTemplateId,
        );

        await updateTemplateMutation.mutateAsync({
          templateId: selectedApiTemplateId,
          payload: {
            id: selectedApiTemplateId,
            name: selectedTemplateName,
            description: selectedTemplateDescription || undefined,
            conversationId: conversationId || undefined,
            isDefault: selectedTemplate?.isDefault ?? false,
            items: transformedItems.length > 0 ? transformedItems : undefined,
          },
        });

        // Mutation will auto-invalidate queries, no need to manual refetch
        // All components using useChecklistTemplates will auto-refetch

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
  const conversationName =
    useConversationStore((s) => s.getConversationName()) || "Nhóm";

  if (!open) return null;

  // Use all templates from API - already filtered by conversationId
  const _apiTemplates = apiTemplates || [];

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
                Checklist mặc định
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
                Chọn checklist để chỉnh sửa
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
              {items.map((it) => {
                const noteVisible = isNoteVisible(it);
                const hasNote = !!it.note?.trim();
                return (
                  <div
                    key={it.id}
                    className="
                      group
                      rounded-md border border-gray-200 bg-white
                      hover:border-brand-300 hover:bg-brand-50/40
                      focus-within:border-brand-400
                      transition-colors
                      px-3 py-1.5
                      relative z-0 overflow-visible
                      min-w-full
                    "
                  >
                    <div className="flex items-center justify-between gap-1">
                      <input
                        ref={(el) => {
                          inputRefs.current[it.id] = el;
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
                        onBlur={() => update(it.id, it.label.trim())}
                        placeholder="Tên mục..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const isLast =
                              items[items.length - 1]?.id === it.id;
                            const trimmedLabel = it.label.trim();
                            const hasValue = trimmedLabel !== "";

                            if (isLast && hasValue) {
                              const newId = "tpl_" + Date.now().toString(36);

                              setItems((prev) => [
                                ...prev.map((item) =>
                                  item.id === it.id
                                    ? { ...item, label: trimmedLabel }
                                    : item,
                                ),
                                { id: newId, label: "", note: null },
                              ]);

                              requestAnimationFrame(() => {
                                if (newItemRef.current) {
                                  newItemRef.current.focus();
                                }
                              });
                            }
                          }
                        }}
                      />

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleNote(it.id)}
                          aria-pressed={noteVisible}
                          aria-label={
                            noteVisible ? "Ẩn ghi chú" : "Thêm ghi chú"
                          }
                          title={
                            hasNote
                              ? "Ghi chú"
                              : noteVisible
                                ? "Ẩn ghi chú"
                                : "Thêm ghi chú"
                          }
                          className={`
                            shrink-0 p-1 rounded-full transition
                            ${
                              hasNote
                                ? "text-brand-500 hover:text-brand-600 opacity-100"
                                : noteVisible
                                  ? "text-brand-600 opacity-100"
                                  : "text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            }
                          `}
                        >
                          <StickyNote className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          className="
                            shrink-0
                            opacity-0 group-hover:opacity-100 focus:opacity-100
                            text-gray-400 hover:text-rose-500
                            p-1 rounded-full transition
                          "
                          title="Xoá mục"
                          aria-label="Xoá mục"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {noteVisible && (
                      <div className="mt-1.5 border-l-2 border-brand-400">
                        <div className="flex items-center">
                          {focusedNoteId === it.id ? (
                            <textarea
                              ref={(el) => {
                                noteRefs.current[it.id] = el;
                              }}
                              value={it.note ?? ""}
                              maxLength={500}
                              autoFocus
                              onChange={(e) =>
                                updateNote(it.id, e.target.value.slice(0, 500))
                              }
                              onBlur={() => {
                                updateNote(it.id, (it.note ?? "").trim());
                                setFocusedNoteId((curr) =>
                                  curr === it.id ? null : curr,
                                );
                              }}
                              placeholder="Ghi chú thêm cho mục này..."
                              rows={1}
                              className="
                                w-full resize-none bg-transparent
                                text-[11px] text-gray-600 italic
                                placeholder:text-gray-400 placeholder:not-italic
                                border-none px-2 py-0
                                focus:outline-none focus:ring-0
                                leading-relaxed self-center
                              "
                              onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                              }}
                            />
                          ) : (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setFocusedNoteId(it.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setFocusedNoteId(it.id);
                                }
                              }}
                              className={`
                                w-full px-2 py-0 truncate cursor-text
                                text-[11px] leading-relaxed
                                ${
                                  it.note?.trim()
                                    ? "text-gray-600 italic"
                                    : "text-gray-400"
                                }
                              `}
                              title={it.note?.trim() || undefined}
                            >
                              {it.note?.trim() ||
                                "Ghi chú thêm cho mục này..."}
                            </div>
                          )}
                        </div>
                        <div
                          className={`px-2 pb-0.5 text-[10px] text-right ${
                            (it.note?.length ?? 0) >= 500
                              ? "text-rose-500"
                              : "text-gray-400"
                          }`}
                        >
                          Tối đa: {it.note?.length ?? 0}/500 ký tự
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Chưa có mục nào</p>
              <p className="text-xs mt-1">
                Chọn checklist từ danh sách phía trên để bắt đầu chỉnh sửa
              </p>
            </div>
          )}

          <button
            onClick={add}
            disabled={
              !selectedApiTemplateId ||
              items.some((item) => item.label.trim() === "")
            }
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 rounded-full border border-dashed border-emerald-300 px-3 py-1.5 hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
