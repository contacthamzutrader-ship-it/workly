"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, LayoutDashboard, MessageSquare, Search } from "lucide-react";

const SECTIONS: { label: string; items: { label: string; href: string; icon: any }[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Browse Tasks", href: "/browse", icon: Search },
      { label: "Projects", href: "/projects", icon: BriefcaseBusiness },
      { label: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Notifications", href: "/notifications", icon: Bell }],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const desktopClasses = (href: string) => {
    const base = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition";
    return isActive(href)
      ? `${base} bg-brand-50 font-bold text-brand-dark`
      : `${base} font-medium text-ink-600 hover:bg-ink-50 hover:text-ink`;
  };

  const mobileClasses = (href: string) =>
    `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
      isActive(href) ? "border-brand-200 bg-brand-50 text-brand-dark" : "border-ink-100 bg-white text-ink-600 shadow-card"
    }`;

  const allItems = SECTIONS.flatMap((s) => s.items);

  return (
    <>
      {/* Mobile horizontal navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 lg:hidden">
        {allItems.map((item) => (
          <Link key={item.label} href={item.href} className={mobileClasses(item.href)}>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Desktop light sidebar */}
      <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start lg:pr-1">
        <div className="mb-6">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Workspace</p>
          <div className="mt-2 space-y-1">
            {SECTIONS[0].items.map((item) => (
              <Link key={item.label} href={item.href} className={desktopClasses(item.href)}>
                <item.icon className="h-[18px] w-[18px] shrink-0 text-ink-400" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Account</p>
          <div className="mt-2 space-y-1">
            {SECTIONS[1].items.map((item) => (
              <Link key={item.label} href={item.href} className={desktopClasses(item.href)}>
                <item.icon className="h-[18px] w-[18px] shrink-0 text-ink-400" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}