"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import DashboardVideoSlider from "@/components/DashboardVideoSlider";
import { useAuth } from "@/lib/auth-context";

export default function TaskerPage({
  children,
  headerSlot,
}: {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && role !== "tasker") router.replace("/dashboard");
  }, [loading, user, role, router]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  if (role !== "tasker") return null;

  // On /projects routes, display the full-width DashboardVideoSlider
  const activeHeaderSlot =
    headerSlot !== undefined
      ? headerSlot
      : pathname.startsWith("/projects")
      ? <DashboardVideoSlider />
      : undefined;

  return <DashboardShell headerSlot={activeHeaderSlot}>{children}</DashboardShell>;
}