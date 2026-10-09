import Link from "next/link";
import { ArrowRight, Clock3, MapPin, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatDate, formatPKR } from "@/lib/format";

const statusRecords: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  open: { label: "Open for Offers", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  assigned: { label: "Assigned · In Escrow", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function TaskCard({ task, href }: { task: Task; href?: string }) {
  const status = statusRecords[task.status] || statusRecords.open;
  const isRemote =
    !task.location ||
    ["remote", "online", "anywhere", "virtual", "wfh"].some((k) =>
      task.location.toLowerCase().includes(k)
    );

  return (
    <Link
      href={href ?? `/tasks/${task.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-card-hover"
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              {task.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> Escrow
            </span>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3.5 text-base font-extrabold leading-snug text-slate-900 transition group-hover:text-emerald-700 sm:text-lg">
          {task.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
          {task.description}
        </p>

        {/* Client & Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-bold text-slate-900">{task.posterName}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {isRemote ? "Remote (Pakistan)" : task.location}
          </span>

          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            {task.deadline ? `Due ${formatDate(task.deadline)}` : "Flexible Timeline"}
          </span>
        </div>
      </div>

      {/* Footer: Budget & CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Fixed Price Budget
          </span>
          <p className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {formatPKR(task.budget)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-bold text-slate-500 sm:inline">
            {task.bidsCount || 0} {task.bidsCount === 1 ? "offer" : "offers"}
          </span>
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition group-hover:bg-emerald-600">
            View Job <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}