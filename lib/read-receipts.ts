const KEY = "parwaz.read-receipts.v1";

type Receipts = Record<string, number>;

function load(): Receipts {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function save(receipts: Receipts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(receipts));
  } catch {
    // Storage unavailable; read receipts stay in memory for this session.
  }
}

function tsToMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
  if (typeof ts === "number") return ts;
  return 0;
}

export function isUnread(convId: string, updatedAt: any): boolean {
  const at = tsToMs(updatedAt);
  if (!at) return false;
  const receipts = load();
  return at >= (receipts[convId] || 0) + 5000;
}

export function markRead(convId: string) {
  const receipts = load();
  receipts[convId] = Date.now();
  save(receipts);
}