import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatDate, formatPKR } from "@/lib/format";

const statusRecords: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  open: { label: "Available", className: "bg-brand-50 text-brand-dark" },
  assigned: { label: "Assigned", className: "bg-blue-50 text-blue-700" },
  in_progress: { label: "In progress", className: "bg-purple-50 text-purple-700" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700" },
};

export default function TaskCard({ task }: { task: Task }) {
  const status = statusRecords[task.status] || statusRecords.open;
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400">{task.category}</span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug text-ink group-hover:text-brand-dark">{task.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-ink-500">{task.description}</p>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
        <div>
          <p className="text-[11px] font-medium text-ink-400">Budget</p>
          <p className="mt-0.5 text-lg font-bold text-ink">{formatPKR(task.budget)}</p>
        </div>
        <div className="text-right text-xs text-ink-400">
          <p className="flex items-center justify-end gap-1"><MapPin className="h-3.5 w-3.5" />{task.location}</p>
          <p className="mt-1 flex items-center justify-end gap-1"><Clock3 className="h-3.5 w-3.5" />{task.deadline ? `Due ${formatDate(task.deadline)}` : "Flexible"}</p>
        </div>
      </div>
    </Link>
  );
}