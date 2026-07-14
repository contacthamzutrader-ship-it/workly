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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const isAdmin = role === "company_admin" || role === "super_admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      <Link href="/tasks" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
        <LayoutGrid className="h-4 w-4" /> Browse
      </Link>
      <Link href="/post" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
        <Plus className="h-4 w-4" /> Post
      </Link>
      {user ? (
        <>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/messages" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
          <Link href="/notifications" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
            <Bell className="h-4 w-4" /> Alerts
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <Link href="/profile" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
            <User className="h-4 w-4" /> Profile
          </Link>
          <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="flex items-center gap-1.5 text-ink/70 hover:text-ink" onClick={() => setMobileOpen(false)}>
            <LogIn className="h-4 w-4" /> Login
          </Link>
          <Link href="/signup" className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark" onClick={() => setMobileOpen(false)}>
            <UserPlus className="h-4 w-4" /> Sign up
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
            <Hammer className="h-5 w-5" />
          </span>
          Workly
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          {navLinks}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 hover:bg-ink/5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <nav className="flex flex-col gap-3 border-t border-ink/10 bg-white px-4 py-4 text-sm font-medium md:hidden">
          {navLinks}
        </nav>
      )}
    </header>
  );
}
