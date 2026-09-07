"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

export default function TaskerPage({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && role !== "tasker") router.replace("/dashboard");
  }, [loading, user, role, router]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  if (role !== "tasker") return null;

  return <DashboardShell>{children}</DashboardShell>;
}