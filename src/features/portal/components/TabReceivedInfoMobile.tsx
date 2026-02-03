import React from "react";
import { ArrowLeft, Inbox, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReceivedInfo, GroupChat } from "../types";
import { Button } from "@/components/ui/button";
import { MobileAssignTaskSheet } from "@/components/sheet/MobileAssignTaskSheet";
import { MobileGroupTransferSheet } from "@/components/sheet/MobileGroupTransferSheet";

interface TabReceivedInfoMobileProps {
  open: boolean;
  onBack: () => void;
  receivedInfos:  ReceivedInfo[];
  currentUserId: string;
  currentUserName?: string;
    
  // Data for assign sheet
  mobileMembers?:  Array<{ id: string; name: string }>;
  checklistVariants?: Array<{ id:  string; name: string; isDefault?: boolean }>;
  defaultChecklistVariantId?: string;

  // For assign task
  onCreateTaskFromMessage?: (payload: {
    title: string;
    messageId: string;
    assignTo: string;
    checklistVariantId?: string;
    checklistVariantName?: string;
  }) => void;

  // For group transfer
  groups?: GroupChat[]; // All groups available for transfer
  onConfirmGroupTransfer?: (payload: {
    infoId: string;
    toGroupId: string;
    workTypeId: string;
    assignTo: string;
    toGroupName: string;
    toWorkTypeName: string;
  }) => void;
}

// Helper:  check if date is today
const isToday = (iso?:  string) => {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};

// Helper: format time
const formatTime = (iso:  string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TabReceivedInfoMobile:  React.FC<TabReceivedInfoMobileProps> = ({
  open,
  onBack,
  receivedInfos,
  currentUserId,
  currentUserName,
  mobileMembers = [],
  checklistVariants = [],
  defaultChecklistVariantId,
  groups = [],
  onCreateTaskFromMessage,
  onConfirmGroupTransfer,
}) => {
  // State for "Giao Task" sheet
  const [assignSheetOpen, setAssignSheetOpen] = React.useState(false);
  const [selectedInfoForAssign, setSelectedInfoForAssign] = React.useState<ReceivedInfo | null>(null);

  // State for "Chuyển nhóm" sheet
  const [transferSheetOpen, setTransferSheetOpen] = React.useState(false);
  const [selectedInfoForTransfer, setSelectedInfoForTransfer] = React.useState<ReceivedInfo | null>(null);

  // Filter:  Show "waiting" + processed today
  const displayInfos = React.useMemo(() => {
    return receivedInfos.filter(info => 
      info.status === 'waiting' || 
      ((info.status === 'assigned' || info.status === 'transferred') && isToday(info.createdAt))
    );
  }, [receivedInfos]);

  // Stats
  const waitingCount = displayInfos.filter(i => i.status === 'waiting').length;
  const assignedTodayCount = displayInfos. filter(i => i.status === 'assigned').length;
  const transferredTodayCount = displayInfos.filter(i => i.status === 'transferred').length;

  // Group by status
  const waitingInfos = displayInfos.filter(i => i.status === 'waiting');
  const processedInfos = displayInfos.filter(i => i.status !== 'waiting');

  // ===== HANDLERS =====
  const handleOpenAssignSheet = (info: ReceivedInfo) => {
    setSelectedInfoForAssign(info);
    setAssignSheetOpen(true);
  };

  const handleOpenTransferSheet = (info: ReceivedInfo) => {
    setSelectedInfoForTransfer(info);
    setTransferSheetOpen(true);
  };

  if (! open) return null;

  return (
    <>
      <div className="absolute inset-0 z-[100] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-white px-3 py-3 sticky top-0 z-10">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              Tiếp nhận công việc
            </h2>
            <p className="text-xs text-gray-500">
              Thông tin được tiếp nhận từ tin nhắn
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {/* Summary Card */}
          {displayInfos.length > 0 && (
            <div className="mx-3 mt-3 rounded-xl border border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Inbox className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold text-gray-900">
                  Tổng quan
                </span>
              </div>

              <div className="space-y-1">
                {waitingCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-orange-700">
                      {waitingCount}
                    </span>
                    <span className="text-gray-600">chờ xử lý</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {assignedTodayCount > 0 && (
                    <span>✓ {assignedTodayCount} đã giao task</span>
                  )}
                  {transferredTodayCount > 0 && (
                    <span>➜ {transferredTodayCount} đã chuyển nhóm</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {displayInfos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Chưa có thông tin nào
              </p>
              <p className="text-xs text-gray-500 text-center">
                Các thông tin được tiếp nhận sẽ xuất hiện ở đây
              </p>
            </div>
          )}

          {/* Waiting Section */}
          {waitingInfos.length > 0 && (
            <div className="mx-3 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Chờ xử lý ({waitingInfos.length})
                </h3>
              </div>

              <div className="space-y-3">
                {waitingInfos.map(info => (
                  <ReceivedInfoCard
                    key={info.id}
                    info={info}
                    onAssignTask={() => handleOpenAssignSheet(info)}
                    onTransferGroup={() => handleOpenTransferSheet(info)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Processed Section */}
          {processedInfos.length > 0 && (
            <div className="mx-3 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Đã xử lý hôm nay ({processedInfos.length})
                </h3>
              </div>

              <div className="space-y-2">
                {processedInfos.map(info => (
                  <ProcessedInfoCard key={info.id} info={info} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Task Sheet */}
      <MobileAssignTaskSheet
        open={assignSheetOpen}
        source="receivedInfo"
        info={selectedInfoForAssign ?? undefined}
        members={mobileMembers}
        checklistVariants={checklistVariants}
        defaultChecklistVariantId={defaultChecklistVariantId}
        onClose={() => {
          setAssignSheetOpen(false);
          setSelectedInfoForAssign(null);
        }}
        onCreateTask={(payload) => {
          onCreateTaskFromMessage?.(payload);
          setAssignSheetOpen(false);
          setSelectedInfoForAssign(null);
        }}
      />

      {/* Group Transfer Sheet */}
      <MobileGroupTransferSheet
        open={transferSheetOpen}
        info={selectedInfoForTransfer ?? undefined}
        groups={groups}
        currentUserId={currentUserId}
        currentUserName={currentUserName ?? ""}
        members={mobileMembers}
        onClose={() => {
          setTransferSheetOpen(false);
          setSelectedInfoForTransfer(null);
        }}
        onConfirm={(payload) => {
          onConfirmGroupTransfer?.(payload);
          setTransferSheetOpen(false);
          setSelectedInfoForTransfer(null);
        }}
      />
    </>
  );
};

// Component: Waiting Info Card
const ReceivedInfoCard: React.FC<{
  info: ReceivedInfo;
  onAssignTask: () => void;
  onTransferGroup: () => void;
}> = ({ info, onAssignTask, onTransferGroup }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      {/* Title */}
      <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
        {info.title}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span>Từ:</span>
        <span className="font-semibold text-gray-700">{info. sender}</span>
        <span>•</span>
        <span>{formatTime(info.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onAssignTask}
          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
        >
          Giao Task
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onTransferGroup}
          className="flex-1"
        >
          Chuyển nhóm
        </Button>
      </div>
    </div>
  );
};

// Component: Processed Info Card (read-only)
const ProcessedInfoCard: React.FC<{
  info: ReceivedInfo;
}> = ({ info }) => {
  const isAssigned = info.status === 'assigned';
  const isTransferred = info.status === 'transferred';

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      {/* Title */}
      <div className="text-sm font-medium text-gray-700 mb-1 line-clamp-1">
        {info.title}
      </div>

      {/* Status */}
      {isAssigned && (
        <div className="flex items-center gap-1. 5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Đã giao task</span>
        </div>
      )}

      {isTransferred && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <ArrowRight className="h-3.5 w-3.5" />
          <span>
            Đã chuyển sang{" "}
            <span className="font-semibold">{info.transferredToGroupName}</span>
            {info.transferredWorkTypeName && (
              <> • {info.transferredWorkTypeName}</>
            )}
          </span>
        </div>
      )}

      {/* Time */}
      <div className="text-xs text-gray-400 mt-1">
        {formatTime(info.createdAt)}
      </div>
    </div>
  );
};