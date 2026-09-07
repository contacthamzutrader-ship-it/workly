"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MapPin, Search } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatDate, formatPKR } from "@/lib/format";

const STATUS_CHIP: Record<string, string> = {
  open: "bg-brand-50 text-brand-dark",
  assigned: "bg-blue-50 text-blue-700",
  in_progress: "bg-purple-50 text-purple-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function ProjectList({ load, emptyHint }: { load: () => Promise<Task[]>; emptyHint: string }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await load();
        if (!cancelled) setTasks(list);
      } catch {
        if (!cancelled) setTasks([]);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tasks === null) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl border border-ink-100 bg-white" />)}</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="card py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Search className="h-6 w-6" /></span>
        <h3 className="mt-5 text-lg font-bold text-ink">Nothing here yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {tasks.map((t) => (
        <Link key={t.id} href={`/tasks/${t.id}`} className="group flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-canvas">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><BriefcaseBusiness className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink group-hover:text-brand-dark">{t.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-ink-400">
                <span>{t.posterName}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location || "Remote"}</span>
                {t.deadline && <span>Due {formatDate(t.deadline)}</span>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <p className="text-base font-bold text-ink">{formatPKR(t.heldAmount ?? t.budget)}</p>
              <span className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[t.status] || "bg-ink-50 text-ink-500"}`}>{t.status.replace("_", " ")}</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </div>
        </Link>
      ))}
    </div>
  );
}