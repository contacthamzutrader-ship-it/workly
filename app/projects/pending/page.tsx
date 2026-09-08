"use client";

import TaskerPage from "@/components/TaskerPage";
import ProjectList from "@/components/ProjectList";
import { useAuth } from "@/lib/auth-context";
import { listBidsByUser, listTasksWithUserBids } from "@/lib/tasks";

export default function PendingProjectsPage() {
  const { user } = useAuth();
  const load = async () => {
    if (!user) return [];
    const bids = await listBidsByUser(user.uid);
    const pendingTaskIds = new Set(bids.filter((b) => b.status === "pending").map((b) => b.taskId));
    const tasks = await listTasksWithUserBids(user.uid);
    return tasks.filter((t) => t.id && pendingTaskIds.has(t.id));
  };
  return (
    <TaskerPage>
      <div>
        <p className="page-eyebrow">My Projects</p>
        <h1 className="page-title">Pending projects</h1>
        <p className="page-sub">Tasks where your offer is still waiting for the client to decide.</p>
        <div className="mt-5">
          <ProjectList load={load} emptyHint="You have no pending offers right now. Send an offer on an available task to see it here." />
        </div>
      </div>
    </TaskerPage>
  );
}