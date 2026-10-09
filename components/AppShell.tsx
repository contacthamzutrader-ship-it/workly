"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OWNER_EMAIL } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorklyCopilot from "@/components/WorklyCopilot";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const ownerMode = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && role === "super_admin";

  useEffect(() => {
    if (loading) return;

    if (ownerMode && pathname !== "/admin") {
      router.replace("/admin");
    }
  }, [loading, ownerMode, pathname, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" />
      </div>
    );
  }

  const isInterviewRoute = pathname === "/interview" || pathname === "/ai-interview";
  const isChatRoute = pathname.startsWith("/messages");

  // For fullscreen assessment/interview, hide standard shell headers
  if (isInterviewRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <Navbar />
        <main className="flex-1">{children}</main>
        {!isChatRoute && <Footer />}
      </div>
      <WorklyCopilot />
    </>
  );
}
