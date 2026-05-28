import { useState } from "react";
import { X } from "lucide-react";
import { useDemoConfigStore } from "@/stores/demoConfigStore";

interface RenameGroupModalProps {
  groupId: string;
  originalName: string;
  onClose: () => void;
}

export function RenameGroupModal({ groupId, originalName, onClose }: RenameGroupModalProps) {
  const { groupDisplayNames, setGroupDisplayName } = useDemoConfigStore();

  const strippedOriginal = originalName.replace(/^NCC\s*[-–]\s*/i, "");
  const initialValue = groupDisplayNames[groupId] || strippedOriginal;

  const [value, setValue] = useState(initialValue);

  const handleConfirm = () => {
    setGroupDisplayName(groupId, value.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="w-[440px] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Đặt tên gợi nhớ</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Label 1 */}
          <p className="text-sm text-gray-700 leading-relaxed">
            Hãy đặt cho{" "}
            <span className="font-semibold text-gray-900">{originalName}</span>
            {" "}
            <span className="text-xs text-gray-400 font-normal">(tên gốc Zalo)</span>
            {" "}một cái tên dễ nhớ.
          </p>

          {/* Label 2 — warning */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
            <span className="text-amber-500 text-sm leading-none mt-0.5">⚠</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">Lưu ý:</span> Tên gợi nhớ chỉ hiển thị trong chat
              portal, không đồng bộ lên Zalo.
            </p>
          </div>

          {/* Input */}
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={strippedOriginal}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
                if (e.key === "Escape") onClose();
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
