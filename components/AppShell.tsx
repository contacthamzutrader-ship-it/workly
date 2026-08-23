"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OWNER_EMAIL } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, loading, onboardingCompleted, interviewPassed } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const ownerMode = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && role === "super_admin";

  useEffect(() => {
    if (loading) return;

    if (ownerMode) {
      if (pathname !== "/admin") {
        router.replace("/admin");
      }
      return;
    }

    if (user && role === "tasker") {
      if (!onboardingCompleted) {
        const publicRoutes = ["/login", "/signup", "/"];
        const isOnboarding = pathname === "/onboarding";
        const isPublic = publicRoutes.includes(pathname);
        if (!isOnboarding && !isPublic) {
          router.replace("/onboarding");
        }
      } else if (!interviewPassed) {
        if (pathname === "/profile") {
          router.replace("/dashboard");
        } else if (pathname === "/onboarding") {
          router.replace("/dashboard");
        }
      } else if (pathname === "/onboarding") {
        router.replace("/dashboard");
      }
    }
  }, [loading, ownerMode, user, role, onboardingCompleted, interviewPassed, pathname, router]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  const isPublicRoute = ["/login", "/signup", "/"].includes(pathname);
  const isOnboardingRoute = pathname === "/onboarding";
  const blockAccess =
    user &&
    role === "tasker" &&
    (
      (!onboardingCompleted && !isOnboardingRoute && !isPublicRoute) ||
      (onboardingCompleted && !interviewPassed && pathname === "/profile")
    );

  if (blockAccess) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  const isInterviewRoute = pathname === "/interview" || pathname === "/ai-interview";

  if (ownerMode && pathname !== "/admin") {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  if (ownerMode || isInterviewRoute) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
