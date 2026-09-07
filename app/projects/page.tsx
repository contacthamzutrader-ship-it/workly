"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import TaskerPage from "@/components/TaskerPage";
import ProjectList from "@/components/ProjectList";
import { useAuth } from "@/lib/auth-context";
import { listTasksAssignedTo, listBidsByUser, type Task } from "@/lib/tasks";

export default function ProjectsListPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<{ active: number; pending: number; completed: number; cancelled: number; assigned: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [assigned, bids] = await Promise.all([listTasksAssignedTo(user.uid), listBidsByUser(user.uid)]);
        setCounts({
          active: assigned.filter((t) => t.status === "assigned" || t.status === "in_progress").length,
          pending: bids.filter((b) => b.status === "pending").length,
          completed: assigned.filter((t) => t.status === "completed").length,
          cancelled: assigned.filter((t) => t.status === "cancelled").length,
          assigned: assigned.length,
        });
      } catch {
        setCounts(null);
      }
    })();
  }, [user]);

  const loadAll = async () => {
    if (!user) return [];
    const [assigned, bids] = await Promise.all([listTasksAssignedTo(user.uid), listBidsByUser(user.uid)]);
    const { listTasksWithUserBids } = await import("@/lib/tasks");
    const pendingTaskIds = new Set(bids.filter((b) => b.status === "pending").map((b) => b.taskId));
    const pendingTasks = (await listTasksWithUserBids(user.uid)).filter((t) => t.id && pendingTaskIds.has(t.id));
    const merged = new Map<string, Task>();
    [...assigned, ...pendingTasks].forEach((t) => { if (t.id) merged.set(t.id, t); });
    return Array.from(merged.values());
  };

  const cards = counts
    ? [
        { label: "Assigned Projects", value: counts.assigned, href: "/projects/assigned", tone: "bg-blue-50 text-blue-600" },
        { label: "Pending Projects", value: counts.pending, href: "/projects/pending", tone: "bg-amber-50 text-amber-600" },
        { label: "Completed Projects", value: counts.completed, href: "/projects/completed", tone: "bg-green-50 text-green-600" },
        { label: "Cancelled Projects", value: counts.cancelled, href: "/projects/cancelled", tone: "bg-red-50 text-red-600" },
      ]
    : [];

  return (
    <TaskerPage>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">Workspace</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink">All your projects</h1>
            <p className="mt-1 text-sm font-medium text-ink-500">Tasks assigned to you and offers you have submitted.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="surface p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card">
              <span className={`inline-grid h-9 w-9 place-items-center rounded-xl ${card.tone}`}><BriefcaseBusiness className="h-4 w-4" /></span>
              <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink">{card.value}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink-400"><ArrowUpRight className="h-3 w-3" /> {card.label}</p>
            </Link>
          ))}
          {cards.length === 0 && <p className="text-sm text-ink-400">Loading project counts...</p>}
        </div>

        <div className="mt-6">
          <ProjectList
            load={loadAll}
            emptyHint="You have no assigned projects or pending offers yet. Browse available tasks and send an offer to get started."
          />
        </div>
      </div>
    </TaskerPage>
  );
}