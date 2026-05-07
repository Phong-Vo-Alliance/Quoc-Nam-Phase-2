import { useState, useMemo } from "react";
import { AtSign, Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MentionItem, includesNormalized } from "./MentionItem";
import {
  useMentionsHistory,
  flattenMentionPages,
} from "@/hooks/queries/useMentionsHistory";
import type { MentionDto } from "@/types/mentions";

type ReadFilter = "all" | "unread" | "read";

const READ_FILTER_LABEL: Record<ReadFilter, string> = {
  all: "Tất cả",
  unread: "Chưa đọc",
  read: "Đã đọc",
};

function readFilterToIsRead(filter: ReadFilter): boolean | undefined {
  if (filter === "unread") return false;
  if (filter === "read") return true;
  return undefined;
}

interface MentionsViewProps {
  /** Callback khi user click vào một mention để jump tới conversation */
  onOpenMention?: (item: MentionDto) => void;
}

function MentionsSkeleton({ count = 16 }: { count?: number }) {
  return (
    <div data-testid="mentions-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3 flex gap-3 border-b border-gray-100 last:border-0 animate-pulse"
        >
          <div className="shrink-0 h-9 w-9 rounded-full bg-gray-200" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MentionsView({ onOpenMention }: MentionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMentionsHistory({
    isRead: readFilterToIsRead(readFilter),
    pageSize: 20,
  });

  const mentions = useMemo(
    () => flattenMentionPages(data?.pages),
    [data?.pages],
  );

  const totalCount = data?.pages?.[0]?.totalCount ?? 0;

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return mentions;
    return mentions.filter(
      (m) =>
        includesNormalized(m.message?.content ?? "", searchQuery) ||
        includesNormalized(m.mentionedByUserName, searchQuery) ||
        includesNormalized(m.conversationName, searchQuery) ||
        includesNormalized(m.categoryName ?? "", searchQuery) ||
        includesNormalized(
          m.message?.parentMessage?.content ?? "",
          searchQuery,
        ),
    );
  }, [mentions, searchQuery]);

  return (
    <div
      className="flex flex-col h-full bg-white border-r border-gray-200"
      data-testid="mentions-view"
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
            <AtSign className="h-4 w-4 text-brand-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">
            Tin nhắn nhắc đến tôi
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              className="pl-9 pr-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
              placeholder="Tìm kiếm trong mentions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="mentions-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="mentions-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Select
            value={readFilter}
            onValueChange={(v) => setReadFilter(v as ReadFilter)}
          >
            <SelectTrigger
              className="h-9 w-[120px] text-sm bg-gray-50 border-gray-200"
              data-testid="mentions-filter-trigger"
            >
              <SelectValue>{READ_FILTER_LABEL[readFilter]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{READ_FILTER_LABEL.all}</SelectItem>
              <SelectItem value="unread">
                {READ_FILTER_LABEL.unread}
              </SelectItem>
              <SelectItem value="read">{READ_FILTER_LABEL.read}</SelectItem>
            </SelectContent>
          </Select>

          {readFilter !== "all" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-gray-500 hover:text-gray-700"
              onClick={() => setReadFilter("all")}
              title="Xoá bộ lọc"
              data-testid="mentions-filter-clear"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!isLoading && !isError && (
          <p
            className="mt-2 text-xs text-gray-500"
            data-testid="mentions-total-count"
          >
            Hiển thị{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            / Tổng số{" "}
            <span className="font-semibold text-gray-700">{totalCount}</span>
          </p>
        )}
      </div>

      {/* ─── Body ───────────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        {isLoading && <MentionsSkeleton />}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center mt-20 px-4">
            <p className="text-sm text-red-500 mb-1">Không thể tải dữ liệu</p>
            <p className="text-xs text-gray-400">Vui lòng thử lại sau</p>
          </div>
        )}

        {!isLoading && !isError && mentions.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center mt-20 px-6">
            <div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <AtSign className="h-8 w-8 text-brand-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Chưa có tin nhắn nào nhắc đến bạn
            </p>
            <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed">
              Khi ai đó nhắc đến bạn bằng @tên trong một cuộc trò chuyện, tin
              nhắn đó sẽ xuất hiện ở đây.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          mentions.length > 0 &&
          filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center mt-16 px-4">
              <p className="text-sm text-gray-500">
                Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div>
            {filtered.map((item) => (
              <MentionItem
                key={item.id}
                item={item}
                searchQuery={searchQuery}
                onClick={onOpenMention}
              />
            ))}

            {hasNextPage && !searchQuery && (
              <div className="px-4 py-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  data-testid="mentions-load-more"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    "Xem thêm"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default MentionsView;
