"use client";

import TaskerPage from "@/components/TaskerPage";
import MyProjectsPage from "@/components/MyProjectsPage";

export default function CancelledProjectsPage() {
  return (
    <TaskerPage>
      <MyProjectsPage initialTab="cancelled" />
    </TaskerPage>
  );
}