"use client";

import FreelancerHeader from "@/components/FreelancerHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { DashboardPrefsProvider } from "@/components/DashboardPrefs";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardPrefsProvider>
      <div className="min-h-screen bg-canvas">
        <FreelancerHeader />
<div className="page-shell pb-16 pt-6 sm:pt-8">
        <div className="grid items-start gap-8 lg:grid-cols-[248px_minmax(0,1fr)]">
          <DashboardSidebar />
          <main className="min-w-0 space-y-6">{children}</main>
        </div>
      </div>
      </div>
    </DashboardPrefsProvider>
  );
}