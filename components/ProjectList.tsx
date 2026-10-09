"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Search, UserRound } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { formatDate, formatPKR } from "@/lib/format";

function statusInfo(status: string) {
  switch (status) {
    case "assigned":
    case "in_progress":
      return { label: "Active", className: "bg-brand-50 text-brand-dark" };
    case "completed":
      return { label: "Completed", className: "bg-green-50 text-green-700" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-red-50 text-red-700" };
    case "open":
      return { label: "Pending", className: "bg-amber-50 text-amber-700" };
    default:
      return { label: status.replace("_", " "), className: "bg-ink-50 text-ink-500" };
  }
}

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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tasks === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-ink-100 bg-white" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card px-6 py-14 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
          <Search className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-base font-bold text-ink">Nothing here yet</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {tasks.map((t) => {
        const status = statusInfo(t.status);
        return (
          <div key={t.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
            </div>

            <h3 className="mt-3 text-[17px] font-bold leading-snug text-ink">{t.title}</h3>

            <div className="mt-3 space-y-1.5 text-[13px] font-medium text-ink-500">
              <p className="flex items-center gap-2">
                <UserRound className="h-3.5 w-3.5 flex-none text-ink-400" />
                <span>Client: <span className="font-semibold text-ink">{t.posterName}</span></span>
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 flex-none text-ink-400" />
                <span>Deadline: <span className="font-semibold text-ink">{t.deadline ? formatDate(t.deadline) : "Flexible"}</span></span>
              </p>
              <p className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 flex-none" />
                <span>Budget: <span className="font-semibold text-ink">{formatPKR(t.heldAmount ?? t.budget)}</span></span>
              </p>
            </div>

            <Link
              href={`/tasks/${t.id}`}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              Open Project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}