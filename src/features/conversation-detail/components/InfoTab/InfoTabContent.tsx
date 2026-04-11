import React, { useState } from "react";
import { Users, Plus } from "lucide-react";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import { RightAccordion } from "@/features/portal/components";
import { FileManagerPhase1A } from "@/features/portal/components/FileManagerPhase1A";
import type { MessageLike } from "@/features/portal/components/FileManagerPhase1A";
import type { MinimalMember } from "../../types";
import { MemberListModal } from "../MemberListModal";

interface InfoTabContentProps {
  isDM: boolean;
  categoryName: string;
  groupName: string;
  groupId?: string;
  selectedWorkTypeId?: string;
  handleOpenSourceMessageById: (messageId: string) => void;
  messages?: MessageLike[];
  messagesQuery?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
  };
  members: MinimalMember[];
  setShowAddMemberDialog: (show: boolean) => void;
  /** When true, the info card is hidden (chat/categories loading) */
  isLoading?: boolean;
  conversationAttachment?: any;
  /** Pagination query for loading more attachments */
  conversationAttachmentsQuery?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
  };
  /** Callback to navigate to chat tab before scrolling to message */
  onNavigateToChat?: () => void;
  /** Callback to open "Nhật ký công việc" by parent message ID */
  onOpenTaskLogByMessageId?: (parentMessageId: string) => void;
}

export const InfoTabContent: React.FC<InfoTabContentProps> = ({
  isDM,
  categoryName,
  groupName,
  groupId,
  selectedWorkTypeId,
  handleOpenSourceMessageById,
  messages = [],
  messagesQuery,
  members,
  setShowAddMemberDialog,
  isLoading = false,
  conversationAttachment,
  conversationAttachmentsQuery,
  onNavigateToChat,
  onOpenTaskLogByMessageId,
}) => {
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  return (
    <div className="space-y-4 min-h-0" data-testid="info-tab-content">
      {/* Group + WorkType - Only show for group chats */}
      {!isDM && (
        <div
          className="rounded-xl border p-6 bg-gradient-to-r from-brand-50 via-emerald-50 to-cyan-50"
          data-testid="conversation-info-card"
        >
          {isLoading ? (
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-1">
              <div className="text-sm font-semibold">{categoryName}</div>
              <div className="text-xs text-gray-700">
                {selectedWorkTypeId ? (
                  <>
                    Đang xem thông tin cho{" "}
                    <span className="font-medium text-brand-600">
                      Loại việc: {groupName}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">
                    Chọn loại việc để xem thông tin
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ảnh / Video (GRID) */}
      <div className="premium-accordion-wrapper" data-testid="media-section">
        <div className="premium-light-bar" />
        <RightAccordion title="Ảnh / Video">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : selectedWorkTypeId ? (
            <FileManagerPhase1A
              mode="media"
              groupId={groupId}
              selectedWorkTypeId={selectedWorkTypeId}
              onOpenSourceMessage={handleOpenSourceMessageById}
              onNavigateToChat={onNavigateToChat}
              onOpenTaskLogByMessageId={onOpenTaskLogByMessageId}
              messages={messages}
              messagesQuery={messagesQuery}
              conversationAttachment={conversationAttachment}
              conversationAttachmentsQuery={conversationAttachmentsQuery}
            />
          ) : (
            <div className="text-center py-2 text-sm text-gray-500">
              Chọn loại việc để xem thông tin
            </div>
          )}
        </RightAccordion>
      </div>

      {/* Tài liệu (LIST) - Phase 1A (list file từ chat, không thư mục) */}
      <div
        className="premium-accordion-wrapper"
        data-testid="documents-section"
      >
        <div className="premium-light-bar" />
        <RightAccordion title="Tài liệu">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-2 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : selectedWorkTypeId ? (
            <FileManagerPhase1A
              mode="docs"
              groupId={groupId}
              selectedWorkTypeId={selectedWorkTypeId}
              onOpenSourceMessage={handleOpenSourceMessageById}
              onNavigateToChat={onNavigateToChat}
              onOpenTaskLogByMessageId={onOpenTaskLogByMessageId}
              messages={messages}
              messagesQuery={messagesQuery}
              conversationAttachment={conversationAttachment}
              conversationAttachmentsQuery={conversationAttachmentsQuery}
            />
          ) : (
            <div className="text-center py-2 text-sm text-gray-500">
              Chọn loại việc để xem thông tin
            </div>
          )}
        </RightAccordion>
      </div>

      {/* Thanh vien (Leader only + Group chat only) */}
      {hasLeaderPermissions() && !isDM ? (
        <div
          className="premium-accordion-wrapper"
          data-testid="members-section"
        >
          <div className="premium-light-bar" />
          <RightAccordion title="Thành viên">
            {isLoading ? (
              <div className="flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : !selectedWorkTypeId ? (
              <div className="text-center py-2 text-sm text-gray-500">
                Chọn loại việc để xem thông tin
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <div className="text-sm">
                    <button
                      data-testid="member-count-button"
                      onClick={() =>
                        members.length > 0 && setIsMemberListOpen(true)
                      }
                      disabled={members.length === 0}
                      className={`text-xs transition-colors ${
                        members.length > 0
                          ? "text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {members.length} thành viên
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMemberDialog(true)}
                  disabled={!selectedWorkTypeId}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                    selectedWorkTypeId
                      ? "hover:bg-brand-50 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  title={
                    !selectedWorkTypeId
                      ? "Vui lòng chọn Loại việc trước"
                      : undefined
                  }
                  data-testid="add-member-button"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm
                </button>
              </div>
            )}
          </RightAccordion>
        </div>
      ) : null}

      {/* Member List Modal - Only render when members exist */}
      {members.length > 0 && (
        <MemberListModal
          open={isMemberListOpen}
          onOpenChange={setIsMemberListOpen}
          members={members}
          categoryName={categoryName}
          groupName={groupName}
        />
      )}
    </div>
  );
};
