"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import TaskerPage from "@/components/TaskerPage";
import TaskCard from "@/components/TaskCard";
import { useAuth } from "@/lib/auth-context";
import { useDashboardPrefs } from "@/components/DashboardPrefs";
import { listPublicTasks, type Task } from "@/lib/tasks";
import { computeBidMatch } from "@/lib/matching";

export default function BrowsePage() {
  const { user } = useAuth();
  const { filters, sort } = useDashboardPrefs();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [profile, setProfile] = useState({ trust: 70, success: 80, skills: [] as string[] });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listPublicTasks();
        if (!cancelled) setTasks(list);
      } catch {
        if (!cancelled) setTasks([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const sorted = useMemo(() => {
    if (!tasks) return [];
    let list = [...tasks];
    if (filters.availableOnly) list = list.filter((t) => t.status === "open");
    if (filters.noOffersOnly) list = list.filter((t) => t.bidsCount === 0);
    if (sort === "recent") list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    else if (sort === "due_soon") list.sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));
    else if (sort === "lowest_price") list.sort((a, b) => a.budget - b.budget);
    else if (sort === "highest_price") list.sort((a, b) => b.budget - a.budget);
    else list.sort((a, b) => (computeBidMatch(b, profile).percent) - (computeBidMatch(a, profile).percent) || (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filters, sort]);

  return (
    <TaskerPage>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">Browse Task</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink">Browse available tasks</h1>
            <p className="mt-1 text-sm font-medium text-ink-500">{sorted.length === 0 ? "Apply your filters to narrow the feed." : `${sorted.length} ${sorted.length === 1 ? "task" : "tasks"} you can send an offer on`}</p>
          </div>
        </div>

        {(filters.availableOnly || filters.noOffersOnly) && (
          <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-dark">Filters are active on this list.</div>
        )}

        <div className="mt-6">
          {sorted === null ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl border border-ink-100 bg-white" />)}</div>
          ) : sorted.length === 0 ? (
            <div className="surface py-20 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Search className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-black text-ink">No matching tasks right now</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">Try adjusting your filters, or check back soon for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{sorted.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          )}
        </div>
      </div>
    </TaskerPage>
  );
}