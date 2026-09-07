"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, CheckCircle2, Clock3, Home, LayoutDashboard, MessageSquare, XCircle } from "lucide-react";

const SECTIONS: { label: string; items: { label: string; href: string; icon: any }[] }[] = [
  {
    label: "Home",
    items: [{ label: "Home", href: "/", icon: Home }],
  },
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: BriefcaseBusiness },
      { label: "Complete Project", href: "/projects/completed", icon: CheckCircle2 },
      { label: "Pending Project", href: "/projects/pending", icon: Clock3 },
      { label: "Cancel Project", href: "/projects/cancelled", icon: XCircle },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const desktopClasses = (href: string) => {
    const base = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition";
    return isActive(href)
      ? `${base} bg-mint text-white shadow-forest`
      : `${base} text-white/80 hover:bg-white/10 hover:text-white`;
  };

  const mobileClasses = (href: string) =>
    `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
      isActive(href) ? "bg-brand text-white shadow-forest" : "text-ink-600 hover:bg-brand-50"
    }`;

  const allItems = SECTIONS.flatMap((s) => s.items);

  return (
    <>
      {/* Mobile horizontal navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {allItems.map((item) => (
          <Link key={item.label} href={item.href} className={mobileClasses(item.href)}>
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        ))}
      </div>

      {/* Desktop green sidebar */}
      <aside className="hidden rounded-2xl bg-deep p-3 shadow-card lg:sticky lg:top-20 lg:block lg:self-start">
        <div className="mb-3 flex items-center gap-2.5 px-3 pt-1">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-white"><BriefcaseBusiness className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-black text-white">Workspace</p>
            <p className="text-[10px] font-bold text-white/45">Freelancer</p>
          </div>
        </div>
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-2 last:mb-0">
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link key={item.label} href={item.href} className={desktopClasses(item.href)}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </aside>
    </>
  );
}