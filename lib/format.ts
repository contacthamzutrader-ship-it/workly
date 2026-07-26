export function formatPKR(value: number | null | undefined, compact = false) {
  const amount = Number(value || 0);
  if (compact && amount >= 100_000) {
    return `PKR ${(amount / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 1)} lac`;
  }

  return `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatDate(value: any) {
  if (!value) return "Recently";
  const raw = value?.toDate?.() ?? value;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function timeAgo(value: any) {
  if (!value) return "just now";
  const raw = value?.toDate?.() ?? (typeof value?.seconds === "number" ? new Date(value.seconds * 1000) : value);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "recently";
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

export function initialsOf(name: string | null | undefined) {
  return (name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
