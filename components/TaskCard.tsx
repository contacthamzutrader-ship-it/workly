import Link from "next/link";
import { ArrowUpRight, Clock3, Gavel, Globe2, MapPin, ShieldCheck, Zap } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatPKR, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";

const CATEGORY_TONES: Record<string, string> = {
  Cleaning: "bg-sky-50 text-sky-700",
  Handyman: "bg-orange-50 text-orange-700",
  Delivery: "bg-violet-50 text-violet-700",
  Gardening: "bg-emerald-50 text-emerald-700",
  "IT & Web": "bg-indigo-50 text-indigo-700",
  Design: "bg-pink-50 text-pink-700",
  Moving: "bg-amber-50 text-amber-700",
  "Pet Care": "bg-teal-50 text-teal-700",
  Tutoring: "bg-cyan-50 text-cyan-700",
  "Business & Admin": "bg-slate-100 text-slate-700",
  Photography: "bg-fuchsia-50 text-fuchsia-700",
  Cooking: "bg-rose-50 text-rose-700",
};

export default function TaskCard({
  task,
  matchPercent,
  footer,
}: {
  task: Task;
  matchPercent?: number;
  footer?: React.ReactNode;
}) {
  const tone = CATEGORY_TONES[task.category] || "bg-ink-50 text-ink-600";

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-black ${tone}`}>
          {task.category}
        </span>
        <div className="flex items-center gap-1.5">
          {typeof matchPercent === "number" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-black text-brand-dark">
              <Zap className="h-3 w-3" /> {matchPercent}%
            </span>
          )}
          <StatusBadge status={task.status} />
        </div>
      </div>

      <Link href={`/tasks/${task.id}`} className="mt-4 block">
        <h3 className="text-[17px] font-black leading-snug tracking-[-0.02em] text-ink transition-colors group-hover:text-brand-dark">
          {task.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-500">{task.description}</p>
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-ink-500">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5">
          {task.remote ? <Globe2 className="h-3.5 w-3.5 text-brand" /> : <MapPin className="h-3.5 w-3.5 text-brand" />}
          {task.remote ? "Remote" : task.location || "Flexible"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5">
          <Gavel className="h-3.5 w-3.5 text-brand" />
          {task.bidsCount || 0} {task.bidsCount === 1 ? "offer" : "offers"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5">
          <Clock3 className="h-3.5 w-3.5 text-brand" />
          {timeAgo(task.createdAt)}
        </span>
        {task.approvalMode === "auto" && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-dark">
            <ShieldCheck className="h-3.5 w-3.5" /> Checked
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-ink-100 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">Budget</p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">{formatPKR(task.budget)}</p>
        </div>
        {footer || (
          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-ink-50 px-3.5 text-xs font-black text-ink transition group-hover:bg-brand group-hover:text-white"
          >
            View task <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
