"use client";

import TaskerPage from "@/components/TaskerPage";
import ProjectList from "@/components/ProjectList";
import { useAuth } from "@/lib/auth-context";
import { listTasksAssignedTo } from "@/lib/tasks";

export default function CompletedProjectsPage() {
  const { user } = useAuth();
  const load = async () => {
    if (!user) return [];
    const assigned = await listTasksAssignedTo(user.uid);
    return assigned.filter((t) => t.status === "completed");
  };
  return (
    <TaskerPage>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">Completed</p>
        <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink">Completed projects</h1>
        <p className="mt-1 text-sm font-medium text-ink-500">Tasks you finished and got paid for.</p>
        <div className="mt-5">
          <ProjectList load={load} emptyHint="You have not completed any projects yet. Assigned tasks show up here once they are completed." />
        </div>
      </div>
    </TaskerPage>
  );
}