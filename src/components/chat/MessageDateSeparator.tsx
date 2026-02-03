/**
 * MessageDateSeparator - Date separator for chat messages
 * Displays formatted date labels like "Hôm nay", "Hôm qua", "Thứ năm, 30/01/2026"
 */

interface MessageDateSeparatorProps {
  date: string; // Formatted date label from formatDateSeparator()
}

export default function MessageDateSeparator({
  date,
}: MessageDateSeparatorProps) {
  return (
    <div
      className="flex justify-center my-4"
      data-testid="message-date-separator"
    >
      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
        {date}
      </div>
    </div>
  );
}
