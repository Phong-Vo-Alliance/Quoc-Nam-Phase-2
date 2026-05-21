// Mockup store for "Xác nhận tin nhắn" feature.
// Local-only — does not call any backend. Seeds deterministic fake confirmers
// per message id so previews look consistent across renders, and lets the
// current user toggle their own confirmation against any message in the real
// chat UI.

export type MockConfirmer = {
  userId: string;
  name: string;
  confirmedAt: string; // HH:mm
};

type Listener = () => void;

const seededState = new Map<string, MockConfirmer[]>();
const listeners = new Set<Listener>();

const SEED_POOL: Omit<MockConfirmer, "confirmedAt">[] = [
  { userId: "u-mock-bin", name: "Trần Văn Bình" },
  { userId: "u-mock-ha", name: "Lê Thị Hà" },
  { userId: "u-mock-nam", name: "Phạm Quốc Nam" },
  { userId: "u-mock-long", name: "Vũ Hoàng Long" },
  { userId: "u-mock-an", name: "Đỗ Minh An" },
  { userId: "u-mock-mai", name: "Nguyễn Thị Mai" },
];

// Stable hash so the same message always seeds the same confirmers.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seed(messageId: string): MockConfirmer[] {
  const h = hash(messageId);
  const count = h % 5; // 0..4 confirmers
  if (count === 0) return [];
  return SEED_POOL.slice(0, count).map((u, idx) => ({
    ...u,
    confirmedAt: `${String(8 + ((h + idx) % 10)).padStart(2, "0")}:${String(
      (h * (idx + 1)) % 60,
    ).padStart(2, "0")}`,
  }));
}

export function getMockConfirmers(messageId: string): MockConfirmer[] {
  if (!seededState.has(messageId)) {
    seededState.set(messageId, seed(messageId));
  }
  return seededState.get(messageId)!;
}

export function hasUserConfirmed(messageId: string, userId: string): boolean {
  return getMockConfirmers(messageId).some((c) => c.userId === userId);
}

export function toggleMockConfirm(
  messageId: string,
  user: { userId: string; name: string },
): void {
  const current = getMockConfirmers(messageId);
  const next = current.some((c) => c.userId === user.userId)
    ? current.filter((c) => c.userId !== user.userId)
    : [
        ...current,
        {
          userId: user.userId,
          name: user.name,
          confirmedAt: `${String(new Date().getHours()).padStart(2, "0")}:${String(
            new Date().getMinutes(),
          ).padStart(2, "0")}`,
        },
      ];
  seededState.set(messageId, next);
  listeners.forEach((l) => l());
}

export function subscribeMockConfirm(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
