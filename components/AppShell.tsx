"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OWNER_EMAIL } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const ownerMode = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && role === "super_admin";

  useEffect(() => {
    if (!loading && ownerMode && pathname !== "/admin") router.replace("/admin");
  }, [loading, ownerMode, pathname, router]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  if (ownerMode && pathname !== "/admin") {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  if (ownerMode) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
