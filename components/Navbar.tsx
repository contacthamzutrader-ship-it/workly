"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { subscribeNotifications } from "@/lib/notifications";
import { MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/roles";
import BrandLogo from "@/components/BrandLogo";
import Avatar from "@/components/ui/Avatar";

type NavLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export default function Navbar() {
  const { user, profile, role, staff, isStaff, capabilities, switchRole, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [switching, setSwitching] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    try {
      return subscribeNotifications(user.uid, (items) => setUnread(items.filter((item) => !item.read).length));
    } catch {
      setUnread(0);
    }
  }, [user]);

  const links: NavLink[] = user
    ? role === "freelancer"
      ? [
          { href: "/tasks", label: "Find work", icon: Compass },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/messages", label: "Messages", icon: MessageSquare },
        ]
      : [
          { href: "/dashboard", label: "My tasks", icon: LayoutDashboard },
          { href: "/talent", label: "Browse talent", icon: Users },
          { href: "/messages", label: "Messages", icon: MessageSquare },
        ]
    : [
        { href: "/tasks", label: "Browse tasks", icon: Compass },
        { href: "/talent", label: "Find talent", icon: Users },
        { href: "/how-it-works", label: "How it works", icon: LifeBuoy },
      ];

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const handleSwitch = async (next: MemberRole) => {
    if (next === role || switching) return;
    setSwitching(true);
    try {
      await switchRole(next);
      setAccountOpen(false);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/70 bg-white/90 backdrop-blur-2xl">
      <div className="page-shell flex h-[74px] items-center gap-4">
        <BrandLogo compact />

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                isActive(link.href) ? "bg-brand-50 text-brand-dark" : "text-ink-600 hover:bg-ink-50 hover:text-ink"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {capabilities.canPostTask && (
                <Link
                  href="/post"
                  className="hidden min-h-11 items-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-bold text-white shadow-glow transition hover:bg-brand-dark sm:inline-flex"
                >
                  <Plus className="h-4 w-4" /> Post a task
                </Link>
              )}
              {role === "freelancer" && (
                <Link
                  href="/tasks"
                  className="hidden min-h-11 items-center gap-2 rounded-[14px] border border-ink-200 px-4 text-sm font-bold text-ink transition hover:bg-ink-50 sm:inline-flex lg:hidden"
                >
                  <Search className="h-4 w-4" /> Find work
                </Link>
              )}

              <Link
                href="/notifications"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-ink-100 text-ink-500 transition hover:border-ink-200 hover:text-ink"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-$danger-500 px-1 text-[10px] font-black text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex min-h-11 items-center gap-2 rounded-[14px] border border-ink-100 py-1 pl-1 pr-2.5 transition hover:border-ink-200"
                >
                  <Avatar name={profile?.name || user.displayName || user.email || "You"} src={profile?.avatarUrl} size="sm" />
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[110px] truncate text-[13px] font-black leading-tight text-ink">
                      {(profile?.name || user.displayName || user.email || "You").split(" ")[0]}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                      {isStaff ? "Staff" : MEMBER_ROLE_LABELS[role]}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-ink-400 transition ${accountOpen ? "rotate-180" : ""}`} />
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="animate-slide-up absolute right-0 top-[calc(100%+10px)] w-[288px] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-elevated"
                  >
                    <div className="flex items-center gap-3 border-b border-ink-100 p-4">
                      <Avatar name={profile?.name || user.email || "You"} src={profile?.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-ink">{profile?.name || user.displayName || "Your account"}</p>
                        <p className="truncate text-xs font-medium text-ink-400">{user.email}</p>
                      </div>
                    </div>

                    {!isStaff && (
                      <div className="border-b border-ink-100 p-3">
                        <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">
                          Using Parwaz as
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["client", "freelancer"] as MemberRole[]).map((option) => (
                            <button
                              key={option}
                              onClick={() => handleSwitch(option)}
                              disabled={switching}
                              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-black transition disabled:opacity-60 ${
                                role === option
                                  ? "bg-brand text-white"
                                  : "border border-ink-100 text-ink-500 hover:border-brand-200 hover:text-brand-dark"
                              }`}
                            >
                              {role === option ? <Check className="h-3.5 w-3.5" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
                              {MEMBER_ROLE_LABELS[option]}
                            </button>
                          ))}
                        </div>
                        <p className="px-1 pt-2 text-[11px] leading-4 text-ink-400">
                          Switch any time. Your history stays on one account.
                        </p>
                      </div>
                    )}

                    <div className="p-2">
                      <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                      <MenuLink href="/profile" icon={UserRound} label="Profile & verification" />
                      <MenuLink href="/wallet" icon={Wallet} label="Payments" />
                      <MenuLink href="/settings" icon={Settings} label="Account settings" />
                      {isStaff && (
                        <MenuLink
                          href="/admin"
                          icon={ShieldCheck}
                          label={staff?.isOwner ? "Owner control centre" : "Staff control centre"}
                          highlight
                        />
                      )}
                    </div>

                    <div className="border-t border-ink-100 p-2">
                      <button
                        onClick={async () => {
                          await signOut();
                          router.push("/");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-$danger-600 transition hover:bg-$danger-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden min-h-11 items-center gap-2 rounded-[14px] px-4 text-sm font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink sm:inline-flex"
              >
                <LogIn className="h-4 w-4" /> Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-bold text-white shadow-glow transition hover:bg-brand-dark"
              >
                <Sparkles className="h-4 w-4" /> Join Parwaz
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="grid h-11 w-11 place-items-center rounded-[14px] border border-ink-100 text-ink lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-slide-up border-t border-ink-100 bg-white lg:hidden">
          <nav className="page-shell flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
                  isActive(link.href) ? "bg-brand-50 text-brand-dark" : "text-ink-600"
                }`}
              >
                <link.icon className="h-4 w-4" /> {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <span className="mt-2 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">Account</span>
                {capabilities.canPostTask && (
                  <Link href="/post" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-600">
                    <Plus className="h-4 w-4" /> Post a task
                  </Link>
                )}
                <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-600">
                  <UserRound className="h-4 w-4" /> Profile
                </Link>
                <Link href="/wallet" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-600">
                  <Wallet className="h-4 w-4" /> Payments
                </Link>
                <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-600">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                {isStaff && (
                  <Link href="/admin" className="flex items-center gap-3 rounded-xl bg-ink px-3 py-3 text-sm font-bold text-white">
                    <ShieldCheck className="h-4 w-4" /> Control centre
                  </Link>
                )}
                {!isStaff && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["client", "freelancer"] as MemberRole[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSwitch(option)}
                        className={`rounded-xl px-3 py-3 text-xs font-black ${
                          role === option ? "bg-brand text-white" : "border border-ink-200 text-ink-500"
                        }`}
                      >
                        {MEMBER_ROLE_LABELS[option]} mode
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    router.push("/");
                  }}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-$danger-600"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink-600">
                  <LogIn className="h-4 w-4" /> Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-3.5 text-sm font-black text-white"
                >
                  <BriefcaseBusiness className="h-4 w-4" /> Create free account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  highlight = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
        highlight ? "bg-ink text-white hover:bg-ink-800" : "text-ink-600 hover:bg-ink-50 hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}
