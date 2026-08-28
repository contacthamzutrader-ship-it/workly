import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, MessageCircle, ShieldCheck, Tag } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatPKR } from "@/lib/format";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  open: "bg-brand-50 text-brand-dark border-brand-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const catColors: Record<string, string> = {
  Cleaning: "bg-blue-50 text-blue-600",
  Handyman: "bg-orange-50 text-orange-600",
  Delivery: "bg-purple-50 text-purple-600",
  Gardening: "bg-green-50 text-green-600",
  "IT & Web": "bg-indigo-50 text-indigo-600",
  Design: "bg-pink-50 text-pink-600",
  Moving: "bg-amber-50 text-amber-600",
  "Pet Care": "bg-teal-50 text-teal-600",
  Tutoring: "bg-cyan-50 text-cyan-600",
  Other: "bg-gray-50 text-gray-600",
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="group block rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${catColors[task.category] || catColors.Other}`}><Tag className="h-3 w-3" />{task.category}</span>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-ink-100 text-ink-400 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span>
      </div>
      <h3 className="mt-5 text-lg font-black leading-snug tracking-[-0.02em] text-ink transition-colors group-hover:text-brand-dark">{task.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">{task.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-500">
        <span className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-2"><MapPin className="h-3.5 w-3.5 text-brand" />{task.location}</span>
        <span className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-2"><MessageCircle className="h-3.5 w-3.5 text-brand" />{task.bidsCount} bids</span>
        {task.approvalMode === "auto" && <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-2 text-brand-dark"><ShieldCheck className="h-3.5 w-3.5" />AI checked</span>}
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-ink-100 pt-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Task budget</p><p className="mt-1 text-lg font-black text-ink">{formatPKR(task.budget)}</p></div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusColors[task.status]}`}><Clock3 className="h-3 w-3" />{task.status.replace("_", " ")}</span>
      </div>
    </Link>
  );
}
