export default function UnreadSeparator() {
  return (
    <div
      className="flex items-center gap-3 my-3 px-1"
      data-testid="unread-separator"
    >
      <div className="flex-1 h-px bg-brand-500" />
      <span className="text-xs font-semibold text-brand-600">
        Tin nhắn chưa đọc
      </span>
      <div className="flex-1 h-px bg-brand-500" />
    </div>
  );
}
