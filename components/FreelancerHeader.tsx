"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FreelancerHeader() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setAvatarUrl(snap.data().avatarUrl || "");
      } catch {
        // Avatar is optional; the initials badge is used as a fallback.
      }
    })();
  }, [user]);

  const close = () => {
    setOpen(false);
    setConfirmLogout(false);
  };

  const navigate = (href: string) => {
    close();
    router.push(href);
  };

  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white">
      <div className="page-shell flex items-center gap-4 py-3">
        <BrandLogo size="sm" />

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/browse"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 text-sm font-semibold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-ink"
          >
            <BriefcaseBusiness className="h-4 w-4 text-brand" />
            <span className="hidden sm:inline">Browse Tasks</span>
            <span className="sm:hidden">Browse</span>
          </Link>

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-ink-100 bg-white text-ink-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className={`flex h-10 items-center gap-1.5 rounded-xl border bg-white pl-1 pr-2 transition hover:bg-ink-50 ${open ? "border-brand-200 bg-brand-50" : "border-ink-100"}`}
              aria-label="Open profile menu"
            >
              <span className={avatarUrl ? "h-8 w-8 overflow-hidden rounded-lg" : "grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-black text-white"}>
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.displayName || user?.email || "U")[0].toUpperCase()}
              </span>
            </button>

            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-ink-100 bg-white p-2 shadow-elevated">
                <div className="rounded-xl bg-ink-50 px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-ink">{user?.displayName || "Freelancer"}</p>
                  <p className="truncate text-xs font-medium text-ink-400">{role === "tasker" ? "Freelancer" : "Member"}</p>
                </div>

                <div className="mt-2 space-y-0.5">
                  {isAdmin && (
                    <button onClick={() => navigate("/admin")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink-600 transition hover:bg-brand-50">
                      <Settings className="h-4 w-4 text-ink-400" /> Admin control
                    </button>
                  )}
                  <button onClick={() => navigate("/dashboard")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink-600 transition hover:bg-brand-50">
                    <LayoutDashboard className="h-4 w-4 text-ink-400" /> Dashboard
                  </button>
                  <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink-600 transition hover:bg-brand-50">
                    <UserRound className="h-4 w-4 text-ink-400" /> Profile
                  </button>
                  <button onClick={() => navigate("/settings")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink-600 transition hover:bg-brand-50">
                    <Settings className="h-4 w-4 text-ink-400" /> Settings
                  </button>
                </div>

                <div className="mt-2 space-y-0.5 border-t border-ink-100 pt-2">
                  {confirmLogout ? (
                    <div className="mt-1 rounded-xl bg-red-50 p-3">
                      <p className="text-sm font-bold text-ink">Log out of Parwaz?</p>
                      <p className="mt-0.5 text-xs font-medium leading-5 text-ink-500">Your session will be ended securely.</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setConfirmLogout(false)} className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50">Cancel</button>
                        <button onClick={async () => { close(); await signOut(); router.replace("/login"); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"><LogOut className="h-4 w-4" /> Log out</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href="/contact" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-brand-50"><Mail className="h-4 w-4 text-ink-400" /> Contact Us</Link>
                      <button onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut className="h-4 w-4" /> Log Out</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}