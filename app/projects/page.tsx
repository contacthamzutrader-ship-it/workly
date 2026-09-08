"use client";

import { useEffect, useState } from "react";
import TaskerPage from "@/components/TaskerPage";
import ProjectList from "@/components/ProjectList";
import { useAuth } from "@/lib/auth-context";
import { listTasksAssignedTo, listBidsByUser, listTasksWithUserBids, type Task } from "@/lib/tasks";

type Tab = "all" | "active" | "pending" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function ProjectsListPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [counts, setCounts] = useState<Record<Tab, number> | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [assigned, bids, bidTasks] = await Promise.all([listTasksAssignedTo(user.uid), listBidsByUser(user.uid), listTasksWithUserBids(user.uid)]);
        const pendingIds = new Set(bids.filter((b) => b.status === "pending").map((b) => b.taskId));
        const pending = bidTasks.filter((t) => t.id && pendingIds.has(t.id));
        setCounts({
          all: assigned.length + pending.length,
          active: assigned.filter((t) => t.status === "assigned" || t.status === "in_progress").length,
          pending: pending.length,
          completed: assigned.filter((t) => t.status === "completed").length,
          cancelled: assigned.filter((t) => t.status === "cancelled").length,
        });
      } catch {
        setCounts(null);
      }
    })();
  }, [user]);

  const load = async (): Promise<Task[]> => {
    if (!user) return [];
    const [assigned, bids, bidTasks] = await Promise.all([listTasksAssignedTo(user.uid), listBidsByUser(user.uid), listTasksWithUserBids(user.uid)]);
    const pendingIds = new Set(bids.filter((b) => b.status === "pending").map((b) => b.taskId));
    const pending = bidTasks.filter((t) => t.id && pendingIds.has(t.id));
    if (tab === "all") {
      const merged = new Map<string, Task>();
      [...assigned, ...pending].forEach((t) => { if (t.id) merged.set(t.id, t); });
      return Array.from(merged.values());
    }
    if (tab === "active") return assigned.filter((t) => t.status === "assigned" || t.status === "in_progress");
    if (tab === "pending") return pending;
    if (tab === "completed") return assigned.filter((t) => t.status === "completed");
    return [...assigned, ...bidTasks].filter((t) => (t.id && t.status === "cancelled"));
  };

  const emptyHints: Record<Tab, string> = {
    all: "You have no assigned projects or pending offers yet. Browse available tasks and send an offer to get started.",
    active: "No active tasks right now. When a client selects your offer, active work appears here.",
    pending: "You have no pending offers right now. Send an offer on an available task to see it here.",
    completed: "You have not completed any projects yet. Assigned tasks show up here once completed.",
    cancelled: "No cancelled projects. Cancelled tasks involving your offers or assignments appear here.",
  };

  return (
    <TaskerPage>
      <div className="font-ui space-y-6">
        <div>
          <p className="page-eyebrow">My Projects</p>
          <h1 className="page-title">My Projects</h1>
          <p className="page-sub">Manage and track your current and previous work.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white p-1.5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-brand-50 text-brand-dark" : "text-ink-500 hover:bg-ink-50 hover:text-ink"}`}
              >
                {t.label}
                {counts && <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${active ? "bg-brand text-white" : "bg-ink-50 text-ink-400"}`}>{counts[t.key]}</span>}
              </button>
            );
          })}
        </div>

        <ProjectList key={tab} load={load} emptyHint={emptyHints[tab]} />
      </div>
    </TaskerPage>
  );
}