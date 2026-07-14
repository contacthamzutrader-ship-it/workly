import Link from "next/link";
import { Tag, MapPin, DollarSign, MessageCircle } from "lucide-react";
import type { Task } from "@/lib/tasks";

const statusStyles: Record<string, string> = {
  pending: "bg-ink/10 text-ink/70",
  open: "bg-brand/10 text-brand",
  assigned: "bg-brand/10 text-brand",
  in_progress: "bg-brand/10 text-brand",
  completed: "bg-ink text-white",
  cancelled: "bg-red-100 text-red-700",
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-brand/40 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70">
          <Tag className="h-3.5 w-3.5" /> {task.category}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
          {task.status.replace("_", " ")}
        </span>
      </div>
      <h3 className="mt-3 text-base font-bold text-ink">{task.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-ink/60">{task.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 font-semibold text-brand">
          <DollarSign className="h-4 w-4" />{task.budget}
        </span>
        <span className="flex items-center gap-1 text-ink/50">
          <MapPin className="h-4 w-4" />{task.location}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-ink/40">
        <MessageCircle className="h-3.5 w-3.5" />
        {task.bidsCount} bid{task.bidsCount === 1 ? "" : "s"}
      </div>
    </Link>
  );
}
