"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Compass,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/tasks", icon: BriefcaseBusiness },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/profile", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const nav = (
    <nav className="space-y-1.5">
      <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">
        <Home className="h-4 w-4" /> Home
      </Link>
      <p className="px-3.5 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Workspace</p>
      {menu.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
              active ? "bg-mint text-white shadow-glow" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
      <p className="px-3.5 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Support</p>
      <Link href="/interview" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">
        <Sparkles className="h-4 w-4" /> AI Skill Check
      </Link>
      <Link href="/#learn" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">
        <Compass className="h-4 w-4" /> Learning center
      </Link>
      <Link href="/messages" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">
        <LifeBuoy className="h-4 w-4" /> Support
      </Link>
      <button
        onClick={async () => { await signOut(); router.push("/"); }}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/10"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </nav>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1280px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <aside className="sticky top-[88px] hidden h-[calc(100vh-112px)] w-[280px] shrink-0 flex-col rounded-2xl bg-deep p-4 shadow-card lg:flex">
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-black text-white">Grow your score</p>
          <p className="mt-1 text-[11px] leading-5 text-white/55">Complete the free AI Skill Check to boost how clients see you.</p>
          <Link href="/interview" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-mint">Start now <Sparkles className="h-3 w-3" /></Link>
        </div>
      </aside>

      <button className="sticky top-[84px] z-30 hidden w-full items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm font-bold text-ink-600 shadow-card lg:hidden" onClick={() => setMobileOpen(true)}>
        <LayoutDashboard className="h-4 w-4 text-mint-700" /> Menu
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-deep/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[280px] flex-col bg-deep p-4 shadow-elevated">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="font-black text-white">Parwaz</span>
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10" aria-label="Close menu"><span className="text-lg leading-none">&#10005;</span></button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
