// InformationPanel - Information tab content for ConversationDetailPanel

import React, { useEffect, useState } from "react";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import { RightAccordion } from "../components";
import {
  FileManagerPhase1A,
  MessageLike,
} from "../components/FileManagerPhase1A";
import { Users, Plus, FileText } from "lucide-react";
import { ViewAllFilesModal } from "@/components/files";
import { useViewFiles } from "@/hooks/useViewFiles";

type ViewMode = "lead" | "staff";

type MinimalMember = { id: string; name: string; role?: "Leader" | "Member" };

interface InformationPanelProps {
  viewMode?: ViewMode;
  groupId?: string;
  groupName?: string;
  workTypeName?: string;
  selectedWorkTypeId?: string;
  members?: MinimalMember[];
  onAddMember?: () => void;
  onOpenSourceMessage?: (messageId: string) => void;

  /** Callback to navigate to chat tab (Phase 2) */
  onNavigateToChat?: () => void;

  messages?: MessageLike[]; // Messages from chat to extract files from

  /** Phase 2: Messages query object for auto-loading older messages */
  messagesQuery?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
  };
}

/**
 * InformationPanel Component
 *
 * Displays information tab content:
 * - Group and work type info
 * - Media files (images/videos)
 * - Documents
 * - Members (leader only)
 */
export const InformationPanel: React.FC<InformationPanelProps> = ({
  viewMode = "staff",
  groupId,
  groupName = "Nhóm",
  workTypeName = "—",
  selectedWorkTypeId,
  members = [],
  onAddMember,
  onOpenSourceMessage,
  onNavigateToChat,
  messages = [],
  messagesQuery, // Phase 2: For auto-loading older messages
}) => {
  const [conversationMessages, setConversationMessages] =
    useState<MessageLike[]>(messages);
  const { openModal, closeModal, isOpen } = useViewFiles();

  // Update conversation messages when messages prop changes
  useEffect(() => {
    setConversationMessages(messages);
  }, [messages]);

  const handleViewAllFiles = () => {
    // Open modal with messages from conversation
    openModal(conversationMessages, groupId || "", selectedWorkTypeId);
  };

  return (
    <div className="space-y-4 min-h-0">
      {/* Group + WorkType */}
      <div className="rounded-xl border p-6 bg-gradient-to-r from-brand-50 via-emerald-50 to-cyan-50">
        <div className="flex flex-col items-center text-center gap-1">
          <div className="text-sm font-semibold">{groupName}</div>
          <div className="text-xs text-gray-700">
            Đang xem thông tin cho{" "}
            <span className="font-medium text-brand-600">
              Loại việc: {workTypeName}
            </span>
          </div>
        </div>
      </div>

      {/* Ảnh / Video (GRID) */}
      <div className="premium-accordion-wrapper" data-testid="info-tab-media">
        <div className="premium-light-bar" />
        <RightAccordion title="Ảnh / Video">
          <FileManagerPhase1A
            mode="media"
            groupId={groupId}
            selectedWorkTypeId={selectedWorkTypeId}
            onOpenSourceMessage={onOpenSourceMessage}
            onNavigateToChat={onNavigateToChat}
            messages={messages}
            messagesQuery={messagesQuery}
          />
        </RightAccordion>
      </div>

      {/* Tất Cả Tệp - NEW (View All Files) */}
      <div
        className="premium-accordion-wrapper"
        data-testid="info-tab-all-files"
      >
        <div className="premium-light-bar" />
        <RightAccordion title="Tất Cả Tệp">
          <button
            data-testid="view-all-files-button"
            onClick={handleViewAllFiles}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-brand-50 text-brand-700 border border-brand-300 hover:bg-brand-100 hover:border-brand-400 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Xem Tất Cả Tệp
          </button>
        </RightAccordion>
      </div>

      {/* Tài liệu (LIST) - Phase 1A (list file từ chat, không thư mục) */}
      <div
        className="premium-accordion-wrapper"
        data-testid="info-tab-documents"
      >
        <div className="premium-light-bar" />
        <RightAccordion title="Tài liệu">
          <FileManagerPhase1A
            mode="docs"
            groupId={groupId}
            selectedWorkTypeId={selectedWorkTypeId}
            onOpenSourceMessage={onOpenSourceMessage}
            onNavigateToChat={onNavigateToChat}
            messages={messages}
            messagesQuery={messagesQuery}
          />
        </RightAccordion>
      </div>

      {/* Thành viên (Leader only) */}
      {hasLeaderPermissions() && (
        <div
          className="premium-accordion-wrapper"
          data-testid="info-tab-members"
        >
          <div className="premium-light-bar" />
          <RightAccordion title="Thành viên">
            <div className="flex items-center justify-between rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <div className="text-sm">
                  <div className="text-xs text-gray-500">
                    {members.length} thành viên
                  </div>
                </div>
              </div>
              <button
                onClick={onAddMember}
                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-brand-50"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm
              </button>
            </div>
          </RightAccordion>
        </div>
      )}

      {/* View All Files Modal - Controlled via props */}
      <ViewAllFilesModal
        isOpen={isOpen}
        onOpenChange={(open) => !open && closeModal()}
      />
    </div>
  );
};
