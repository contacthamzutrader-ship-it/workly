"use client";

import TaskerPage from "@/components/TaskerPage";
import ProjectList from "@/components/ProjectList";
import { useAuth } from "@/lib/auth-context";
import { listTasksAssignedTo } from "@/lib/tasks";

export default function AssignedProjectsPage() {
  const { user } = useAuth();
  const load = async () => {
    if (!user) return [];
    const assigned = await listTasksAssignedTo(user.uid);
    return assigned.filter((t) => t.status === "assigned" || t.status === "in_progress");
  };
  return (
    <TaskerPage>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">Assigned</p>
        <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink">Assigned projects</h1>
        <p className="mt-1 text-sm font-medium text-ink-500">Tasks where you have been selected and assigned as the freelancer.</p>
        <div className="mt-5">
          <ProjectList load={load} emptyHint="No tasks are assigned to you yet. When a client selects your offer, the task appears here." />
        </div>
      </div>
    </TaskerPage>
  );
}