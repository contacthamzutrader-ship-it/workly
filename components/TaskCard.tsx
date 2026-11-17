import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Sparkles, Users } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatDate, formatPKR } from "@/lib/format";

const statusRecords: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200/60" },
  open: { label: "Available", className: "bg-brand-50 text-brand-700 border-brand-200/80" },
  assigned: { label: "Assigned", className: "bg-blue-50 text-blue-700 border-blue-200/60" },
  in_progress: { label: "In progress", className: "bg-purple-50 text-purple-700 border-purple-200/60" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200/60" },
};

export default function TaskCard({ task, href }: { task: Task; href?: string }) {
  const status = statusRecords[task.status] || statusRecords.open;
  return (
    <Link
      href={href ?? `/tasks/${task.id}`}
      className="card group relative flex flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-elevated hover:ring-2 hover:ring-brand-500/10"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-ink-600">
          <Sparkles className="h-3 w-3 text-brand" />
          {task.category}
        </span>
        <span className={`flex-none rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide ${status.className}`}>
          {status.label}
        </span>
      </div>

      <h3 className="mt-3 text-[17px] font-bold leading-snug text-ink transition-colors group-hover:text-brand-dark">
        {task.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">
        {task.description}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-600">
        <span className="text-ink-400 font-normal">Posted by</span>
        <span className="font-bold text-ink">{task.posterName}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-medium text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 flex-none text-brand" />
          {task.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 flex-none text-ink-400" />
          {task.deadline ? `Due ${formatDate(task.deadline)}` : "Flexible"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 flex-none text-ink-400" />
          {task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-100/80 pt-4">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-400">Budget</span>
          <p className="text-xl font-black tracking-tight text-ink">{formatPKR(task.budget)}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-forest transition-all group-hover:bg-brand-700 group-hover:shadow-md">
          View Task <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}