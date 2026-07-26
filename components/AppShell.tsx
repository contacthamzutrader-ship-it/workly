"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountBanner from "@/components/AccountBanner";
import { Spinner } from "@/components/ui/Feedback";

/** Routes that render their own full-bleed chrome. */
const BARE_ROUTES = ["/admin"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <Spinner />
      </div>
    );
  }

  if (bare) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <AccountBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
