"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const isAdmin = role === "company_admin" || role === "super_admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const primaryLinks = (
    <>
      <Link href="/tasks" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink">
        <LayoutGrid className="h-4 w-4" /> Find work
      </Link>
      {user ? (
        <>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
        </>
      ) : (
        <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink">
          <LogIn className="h-4 w-4" /> Log in
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/80 bg-white/90 backdrop-blur-2xl">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] bg-ink text-white shadow-sm">
            <span className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-brand" />
            <Sparkles className="relative h-5 w-5" />
          </span>
          <span>
            <span className="block text-xl font-black leading-none tracking-[-0.04em] text-ink">Workly</span>
            <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.19em] text-brand">Kaam. Kamal.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">{primaryLinks}</nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link href="/post" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-brand-dark">
                <Plus className="h-4 w-4" /> Post a task
              </Link>
              <Link href="/notifications" aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-ink-100 bg-white text-ink-500 transition hover:bg-ink-50 hover:text-ink">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-brand" />
              </Link>
              <div className="relative">
                <button onClick={() => setAccountOpen(!accountOpen)} className="flex h-11 items-center gap-2 rounded-xl border border-ink-100 bg-white px-2 pr-3 text-left transition hover:bg-ink-50">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-xs font-black text-white">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate text-xs font-extrabold text-ink">{user.displayName || "Account"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-ink-100 bg-white p-2 shadow-elevated">
                    {isAdmin && <Link href="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"><ShieldCheck className="h-4 w-4" /> Admin control</Link>}
                    <Link href="/wallet" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"><Wallet className="h-4 w-4" /> Wallet</Link>
                    <Link href="/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"><User className="h-4 w-4" /> Profile</Link>
                    <button onClick={() => { signOut(); setAccountOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/signup" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-dark">
              <UserPlus className="h-4 w-4" /> Join Workly
            </Link>
          )}
        </div>

        <button className="grid h-11 w-11 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-50 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-4 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {primaryLinks}
            {user ? (
              <>
                <Link href="/post" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl bg-brand px-3 py-3 text-sm font-extrabold text-white"><Plus className="h-4 w-4" /> Post a task</Link>
                <Link href="/wallet" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600"><Wallet className="h-4 w-4" /> Wallet</Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600"><User className="h-4 w-4" /> Profile</Link>
                {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-600"><ShieldCheck className="h-4 w-4" /> Admin control</Link>}
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600"><LogOut className="h-4 w-4" /> Sign out</button>
              </>
            ) : (
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl bg-ink px-3 py-3 text-sm font-extrabold text-white"><UserPlus className="h-4 w-4" /> Join Workly</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
