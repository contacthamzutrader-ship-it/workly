"use client";

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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const isAdmin = role === "company_admin" || role === "super_admin";

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
            <Hammer className="h-5 w-5" />
          </span>
          Workly
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/tasks" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
            <LayoutGrid className="h-4 w-4" /> Browse
          </Link>
          <Link href="/post" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
            <Plus className="h-4 w-4" /> Post
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link href="/messages" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                <MessageSquare className="h-4 w-4" /> Messages
              </Link>
              <Link href="/notifications" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                <Bell className="h-4 w-4" /> Alerts
              </Link>
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                <User className="h-4 w-4" /> Profile
              </Link>
              <button onClick={signOut} className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-ink/70 hover:text-ink">
                <LogIn className="h-4 w-4" /> Login
              </Link>
              <Link href="/signup" className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark">
                <UserPlus className="h-4 w-4" /> Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
