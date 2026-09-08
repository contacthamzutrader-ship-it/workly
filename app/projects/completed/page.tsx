"use client";

import TaskerPage from "@/components/TaskerPage";
import MyProjectsPage from "@/components/MyProjectsPage";

export default function CompletedProjectsPage() {
  return (
    <TaskerPage>
      <MyProjectsPage initialTab="completed" />
    </TaskerPage>
  );
}