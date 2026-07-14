import Link from "next/link";
import { MapPin, DollarSign, MessageCircle, Tag } from "lucide-react";
import type { Task } from "@/lib/tasks";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  open: "bg-brand-50 text-brand-dark border-brand-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const catColors: Record<string, string> = {
  Cleaning: "bg-blue-50 text-blue-600", Handyman: "bg-orange-50 text-orange-600", Delivery: "bg-purple-50 text-purple-600",
  Gardening: "bg-green-50 text-green-600", "IT & Web": "bg-indigo-50 text-indigo-600", Design: "bg-pink-50 text-pink-600",
  Moving: "bg-amber-50 text-amber-600", "Pet Care": "bg-teal-50 text-teal-600", Tutoring: "bg-cyan-50 text-cyan-600", Other: "bg-gray-50 text-gray-600",
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="group block rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${catColors[task.category] || catColors.Other}`}><Tag className="h-3 w-3" />{task.category}</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColors[task.status]}`}>{task.status.replace("_", " ")}</span>
      </div>
      <h3 className="mt-3 text-base font-bold text-ink group-hover:text-brand transition-colors">{task.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">{task.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-lg font-extrabold text-brand"><DollarSign className="h-4 w-4" />{task.budget}</span>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.location}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{task.bidsCount}</span>
        </div>
      </div>
    </Link>
  );
}
