"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Briefcase,
  ChevronDown,
  Compass,
  FileCheck,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const { user, role, signOut, setAccountType } = useAuth();
  const pathname = usePathname();
  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";
  const isFreelancer = role === "tasker";
  const isClient = role === "customer" || isAdmin;
  const canPost = role === "customer" || isAdmin;
  const canFindWork = !user || role === "tasker";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setAvatarUrl(snap.data().avatarUrl || "");
      } catch {
        // fallback to initials badge
      }
    })();
  }, [user]);

  // Click outside to close account dropdown
  useEffect(() => {
    if (!accountOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [accountOpen]);

  const close = () => {
    setMobileOpen(false);
    setAccountOpen(false);
  };

  const handleToggleRole = async () => {
    try {
      setSwitchingRole(true);
      const nextRole = isFreelancer ? "customer" : "tasker";
      await setAccountType(nextRole);
      close();
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all shadow-sm">
      <div className="page-shell flex h-[72px] items-center justify-between gap-4">
        {/* Brand Logo & Left Navigation */}
        <div className="flex items-center gap-6">
          <BrandLogo compact />

          {/* Desktop Navigation based on Role */}
          <nav className="hidden items-center gap-1 md:flex">
            {!user ? (
              <>
                <Link
                  href="/browse"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/browse")
                      ? "bg-ink-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Find Work
                </Link>
                <Link
                  href="/how-it-works"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/how-it-works")
                      ? "bg-ink-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  href="/interview"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/interview")
                      ? "bg-ink-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-brand" /> AI Skill Vetting
                </Link>
              </>
            ) : isFreelancer ? (
              <>
                <Link
                  href="/dashboard"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    pathname === "/dashboard"
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/browse"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/browse")
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Find Work
                </Link>
                <Link
                  href="/projects"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/projects")
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  My Work & Offers
                </Link>
                <Link
                  href="/interview"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isLinkActive("/interview")
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-brand-dark bg-brand-50/50 hover:bg-brand-50 hover:text-brand"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-brand" /> Get Verified Badge
                </Link>
                <Link
                  href="/messages"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/messages")
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Messages
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    pathname === "/dashboard"
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/browse"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/browse")
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Browse Talent & Tasks
                </Link>
                <Link
                  href="/messages"
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isLinkActive("/messages")
                      ? "bg-brand-50 text-brand font-bold"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink"
                  }`}
                >
                  Messages
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Actions & User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role badge */}
              <span className="hidden sm:inline-flex items-center rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-600 border border-ink-100">
                {isAdmin ? "Admin" : isFreelancer ? "Freelancer" : "Client"}
              </span>

              {/* Client Post a Job Button */}
              {isClient && (
                <Link
                  href="/post"
                  className="hidden sm:inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-bold text-white shadow-forest transition hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" /> Post a Job
                </Link>
              )}

              {/* Notifications */}
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-ink-50 text-ink-600 transition hover:bg-ink-100 hover:text-ink"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-brand" />
              </Link>

              {/* Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-2 py-1 transition hover:bg-ink-50 focus:outline-none"
                  aria-expanded={accountOpen}
                >
                  <span className={avatarUrl ? "h-7 w-7 overflow-hidden rounded-lg" : "grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white"}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (user.displayName || user.email || "U")[0].toUpperCase()
                    )}
                  </span>
                  <span className="hidden max-w-[100px] truncate text-xs font-semibold text-ink md:inline-block">
                    {user.displayName ? user.displayName.split(" ")[0] : "Account"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-ink-400" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-ink-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                    <div className="border-b border-ink-100 px-3 py-2.5">
                      <p className="truncate text-sm font-bold text-ink">
                        {user.displayName || "User"}
                      </p>
                      <p className="truncate text-xs font-medium text-ink-400">{user.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand">
                        <span>●</span> {isAdmin ? "Admin Ops" : isFreelancer ? "Freelancer Mode" : "Client Mode"}
                      </div>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={close}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-ink-50"
                        >
                          <ShieldCheck className="h-4 w-4 text-brand" /> Admin Console
                        </Link>
                      )}
                      <Link
                        href="/dashboard"
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-ink-50"
                      >
                        <LayoutDashboard className="h-4 w-4 text-brand" /> Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-ink-50"
                      >
                        <User className="h-4 w-4 text-brand" /> My Profile
                      </Link>
                      {isFreelancer && (
                        <Link
                          href="/projects"
                          onClick={close}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-ink-50"
                        >
                          <FolderKanban className="h-4 w-4 text-brand" /> My Work & Proposals
                        </Link>
                      )}
                      <Link
                        href="/wallet"
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-ink-50"
                      >
                        <Wallet className="h-4 w-4 text-brand" /> {isFreelancer ? "Earnings & Wallet" : "Payments & Balance"}
                      </Link>
                      <Link
                        href="/settings"
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-ink-50"
                      >
                        <Settings className="h-4 w-4 text-ink-400" /> Account Settings
                      </Link>
                    </div>

                    <div className="border-t border-ink-100 pt-1">
                      {/* Role Switcher */}
                      <button
                        onClick={handleToggleRole}
                        disabled={switchingRole}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-50 transition"
                      >
                        <span className="flex items-center gap-2">
                          <RefreshCw className={`h-3.5 w-3.5 ${switchingRole ? "animate-spin" : ""}`} />
                          Switch to {isFreelancer ? "Client" : "Freelancer"} Mode
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => {
                          signOut();
                          close();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex min-h-10 items-center rounded-xl border border-ink-200 bg-white px-4 text-xs font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="min-h-10 inline-flex items-center rounded-xl bg-ink-900 px-4 text-xs font-bold text-white transition hover:bg-ink-800"
              >
                Sign Up
              </Link>
              <Link
                href="/post"
                className="min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-bold text-white shadow-forest transition hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Post a Job
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="grid h-10 w-10 place-items-center rounded-xl text-ink transition hover:bg-ink-50 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-5 pb-6 pt-3 md:hidden">
          <nav className="flex flex-col gap-1.5">
            {!user ? (
              <>
                <Link href="/browse" onClick={close} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50">
                  Find Work
                </Link>
                <Link href="/how-it-works" onClick={close} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50">
                  How It Works
                </Link>
                <Link href="/interview" onClick={close} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-50">
                  <Sparkles className="h-4 w-4" /> AI Skill Vetting
                </Link>
                <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3">
                  <Link href="/login" onClick={close} className="flex h-10 items-center justify-center rounded-xl border border-ink-200 text-xs font-bold text-ink">
                    Log In
                  </Link>
                  <Link href="/signup" onClick={close} className="flex h-10 items-center justify-center rounded-xl bg-ink-900 text-xs font-bold text-white">
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 rounded-xl bg-ink-50 p-3 text-xs">
                  <p className="font-bold text-ink">{user.displayName || "User"}</p>
                  <p className="text-ink-400 truncate">{user.email}</p>
                  <span className="mt-1 inline-block font-bold text-brand">
                    ● Mode: {isFreelancer ? "Freelancer" : "Client"}
                  </span>
                </div>

                <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-ink-50">
                  <LayoutDashboard className="h-4 w-4 text-brand" /> Dashboard
                </Link>
                <Link href="/browse" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-ink-50">
                  <Search className="h-4 w-4 text-brand" /> {isFreelancer ? "Find Work" : "Browse Talent & Tasks"}
                </Link>
                {isFreelancer && (
                  <Link href="/projects" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-ink-50">
                    <FolderKanban className="h-4 w-4 text-brand" /> My Work & Proposals
                  </Link>
                )}
                <Link href="/messages" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-ink-50">
                  <MessageSquare className="h-4 w-4 text-brand" /> Messages
                </Link>
                <Link href="/profile" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-ink-50">
                  <User className="h-4 w-4 text-brand" /> Profile
                </Link>
                <Link href="/wallet" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-ink-50">
                  <Wallet className="h-4 w-4 text-brand" /> Wallet
                </Link>

                {isFreelancer && (
                  <Link href="/interview" onClick={close} className="flex items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-bold text-brand">
                    <Sparkles className="h-4 w-4" /> Take AI Skill Check
                  </Link>
                )}

                <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3">
                  <button
                    onClick={handleToggleRole}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand-50 text-xs font-bold text-brand"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Switch to {isFreelancer ? "Client" : "Freelancer"} Mode
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      close();
                    }}
                    className="flex h-10 items-center justify-center rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
