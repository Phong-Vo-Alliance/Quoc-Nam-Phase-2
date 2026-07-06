// Mockup store for "Thu hồi tin nhắn" feature.
// Local-only — does not call any backend. Tracks recalled message ids and the
// time they were recalled so the bubble can render the recalled state.

type Listener = () => void;

const recalledAt = new Map<string, string>(); // messageId -> ISO datetime
const listeners = new Set<Listener>();

// Tin nhắn chỉ được phép thu hồi trong vòng 1 ngày kể từ khi gửi.
export const RECALL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isRecalled(messageId: string): boolean {
  return recalledAt.has(messageId);
}

export function getRecalledAt(messageId: string): string | undefined {
  return recalledAt.get(messageId);
}

// Định dạng thời điểm thu hồi: "Thứ Ba, 09/06/2026 lúc 17:57".
export function formatRecalledAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${days[date.getDay()]}, ${day}/${month}/${year} lúc ${time}`;
}

export function recallMessage(messageId: string): void {
  if (recalledAt.has(messageId)) return;
  recalledAt.set(messageId, new Date().toISOString());
  listeners.forEach((l) => l());
}

export function canRecall(sentAt: string): boolean {
  const sentTime = new Date(sentAt).getTime();
  if (Number.isNaN(sentTime)) return false;
  return Date.now() - sentTime <= RECALL_WINDOW_MS;
}

export function subscribeMockRecall(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
