import type { ReactNode } from "react";
import { TASK_STATUS_META, type TaskStatus } from "@/lib/tasks";

export function Badge({
  children,
  tone = "bg-ink-50 text-ink-600 border-ink-200",
  className = "",
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] ${tone} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = "" }: { status: TaskStatus; className?: string }) {
  const meta = TASK_STATUS_META[status] || TASK_STATUS_META.pending;
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function Stat({
  icon: Icon,
  label,
  value,
  tone = "bg-brand-50 text-brand",
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-black tracking-[-0.025em] text-ink sm:text-xl">{value}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-ink-400">{label}</p>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs leading-5 text-ink-400">{hint}</p>}
    </div>
  );
}
