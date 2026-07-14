"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Hammer,
  LayoutGrid,
  Plus,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
  Menu,
  X,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const isAdmin = role === "company_admin" || role === "super_admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      <Link href="/tasks" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
        <LayoutGrid className="h-4 w-4" /> Browse
      </Link>
      <Link href="/post" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
        <Plus className="h-4 w-4" /> Post
      </Link>
      {user ? (
        <>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
          <Link href="/notifications" onClick={() => setMobileOpen(false)} className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <Bell className="h-4 w-4" /> Alerts
          </Link>
          <Link href="/wallet" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <Wallet className="h-4 w-4" /> Wallet
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <div className="mx-1 h-5 w-px bg-ink-200" />
          <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <User className="h-4 w-4" /> Profile
          </Link>
          <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-400 transition hover:bg-ink-50 hover:text-ink">
            <LogOut className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="mx-1 h-5 w-px bg-ink-200" />
          <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink">
            <LogIn className="h-4 w-4" /> Log in
          </Link>
          <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow-md">
            <UserPlus className="h-4 w-4" /> Sign up
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <Hammer className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-ink">Workly</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{navLinks}</nav>
        <button className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-50 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">{navLinks}</nav>
        </div>
      )}
    </header>
  );
}
