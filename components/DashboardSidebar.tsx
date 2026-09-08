"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  X,
  XCircle,
} from "lucide-react";

type SidebarItem = { label: string; href: string; icon: any; exact?: boolean };

const SECTIONS: { label: string; items: SidebarItem[] }[] = [
  {
    label: "Home",
    items: [
      { label: "Home", href: "/", icon: Home, exact: true },
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Projects", href: "/projects", icon: BriefcaseBusiness, exact: true },
      { label: "Pending Projects", href: "/projects/pending", icon: Clock3 },
      { label: "Completed Projects", href: "/projects/completed", icon: CheckCircle2 },
      { label: "Cancelled Projects", href: "/projects/cancelled", icon: XCircle },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (item: SidebarItem) => {
    if (item.href === "/") return pathname === "/";
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">{section.label}</p>
          <div className="mt-2 space-y-1">
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[40px] w-full items-center gap-3 rounded-xl px-3 text-sm transition ${
                    active
                      ? "bg-brand-50 font-semibold text-brand-dark"
                      : "font-medium text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brand" : "text-ink-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function DashboardSidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile: trigger button (opens drawer) */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-10 w-full max-w-[200px] items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 text-sm font-semibold text-ink-600 shadow-card transition hover:border-brand-200 hover:text-ink"
        >
          <Menu className="h-4 w-4 text-brand" />
          Workspace menu
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-20 lg:-mr-2 lg:block lg:self-start">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace navigation">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[272px] max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Workspace</p>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-50 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}