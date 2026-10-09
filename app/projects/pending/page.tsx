"use client";

import TaskerPage from "@/components/TaskerPage";
import MyProjectsPage from "@/components/MyProjectsPage";

export default function PendingProjectsPage() {
  return (
    <TaskerPage>
      <MyProjectsPage initialTab="pending" />
    </TaskerPage>
  );
}