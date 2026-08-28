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
