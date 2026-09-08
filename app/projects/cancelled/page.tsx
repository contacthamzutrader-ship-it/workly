"use client";

import TaskerPage from "@/components/TaskerPage";
import ProjectList from "@/components/ProjectList";
import { useAuth } from "@/lib/auth-context";
import { listTasksAssignedTo, listTasksWithUserBids } from "@/lib/tasks";

export default function CancelledProjectsPage() {
  const { user } = useAuth();
  const load = async () => {
    if (!user) return [];
    const [assigned, bidTasks] = await Promise.all([listTasksAssignedTo(user.uid), listTasksWithUserBids(user.uid)]);
    const merged = new Map<string, any>();
    [...assigned, ...bidTasks].forEach((t) => { if (t.id) merged.set(t.id, t); });
    return Array.from(merged.values()).filter((t) => t.status === "cancelled");
  };
  return (
    <TaskerPage>
      <div>
        <p className="page-eyebrow">My Projects</p>
        <h1 className="page-title">Cancelled projects</h1>
        <p className="page-sub">Tasks tied to you that were cancelled. No payment is released for cancelled work.</p>
        <div className="mt-5">
          <ProjectList load={load} emptyHint="You have no cancelled projects. Cancelled tasks that involved your offers or assignments appear here." />
        </div>
      </div>
    </TaskerPage>
  );
}