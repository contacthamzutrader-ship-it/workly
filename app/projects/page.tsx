"use client";

import TaskerPage from "@/components/TaskerPage";
import MyProjectsPage from "@/components/MyProjectsPage";

export default function ProjectsListPage() {
  return (
    <TaskerPage>
      <MyProjectsPage initialTab="all" />
    </TaskerPage>
  );
}