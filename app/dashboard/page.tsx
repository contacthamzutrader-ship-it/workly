"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Plus, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listTasksByPoster, type Task } from "@/lib/tasks";
import DashboardShell from "@/components/DashboardShell";
import TaskerDashboard from "@/components/TaskerDashboard";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import { formatPKR } from "@/lib/format";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const [posted, setPosted] = useState<Task[]>([]);
  const [wallet, setWallet] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading || !user || !role) return;
    (async () => {
      if (role !== "tasker") {
        try {
          setPosted(await listTasksByPoster(user.uid));
        } catch {
          setPosted([]);
        }
      }
      try {
        if (db) {
          const s = await getDoc(doc(db, "users", user.uid));
          if (s.exists()) {
            const d = s.data();
            setWallet(d.wallet ?? 0);
          }
        }
      } catch {}
      setBusy(false);
    })();
  }, [loading, user, role]);

  if (!loading && !user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }
  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  if (role === "tasker") {
    return (
      <DashboardShell>
        <TaskerDashboard />
      </DashboardShell>
    );
  }

  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";
  const canPost = role === "customer" || role === "company_admin" || role === "super_admin";
  const activePosted = posted.filter((t) => ["open", "assigned", "in_progress"].includes(t.status));
  const clientSpent = posted.filter((t) => t.paymentReleased).reduce((sum, task) => sum + (task.heldAmount || 0), 0);

  const firstName = (user.displayName || user.email || "there").split(" ")[0];

  const stats = [
    { label: "Active projects", value: String(activePosted.length) },
    { label: "Completed", value: String(posted.filter((t) => t.status === "completed").length) },
    { label: "Average rating", value: "\u2014" },
    { label: "Total released", value: formatPKR(clientSpent) },
  ];

  return (
    <div className="font-ui space-y-8">
      {/* Welcome band */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-eyebrow">{isAdmin ? "Operations workspace" : "Client workspace"}</p>
          <h1 className="page-title">Welcome back, {firstName}.</h1>
          <p className="page-sub">Hire confidently - every freelancer carries an AI-verified skill score, so you can trust the talent you bring on.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isAdmin && (
            <Link href="/admin"><Button variant="ghost" className="gap-2"><ShieldCheck className="h-4 w-4" /> Admin control</Button></Link>
          )}
          {canPost && (
            <Link href="/post"><Button className="gap-2"><Plus className="h-4 w-4" /> Post a job</Button></Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card px-5 py-4">
            <p className="text-2xl font-extrabold tracking-[-0.02em] text-ink">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-ink-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Main content */}
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 sm:px-6">
            <div>
              <p className="page-eyebrow">Your work</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Active projects</h2>
            </div>
            <Link href="/post" className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700">
              Post new <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {busy ? (
            <div className="space-y-3 p-6">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-50" />)}</div>
          ) : posted.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand"><BriefcaseBusiness className="h-5 w-5" /></span>
              <h3 className="mt-4 text-base font-bold text-ink">No projects yet</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">Post your first job and let matched freelancers come to you with offers.</p>
              <Link href="/post" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">Post a job <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {posted.slice(0, 6).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-canvas sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink group-hover:text-brand-dark">{task.title}</p>
                    <p className="mt-0.5 text-xs font-medium text-ink-400">{formatPKR(task.budget)} · {task.bidsCount} offers</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${task.status === "pending" ? "bg-amber-50 text-amber-700" : task.status === "completed" ? "bg-green-50 text-green-700" : "bg-brand-50 text-brand-dark"}`}>{task.status.replace("_", " ")}</span>
                  <ArrowRight className="hidden h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-deep p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand"><Sparkles className="h-4 w-4" /></span>
              <TrendingUp className="h-4 w-4 text-brand-300" />
            </div>
            <h3 className="mt-4 text-lg font-bold">Smarter hiring</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/60">Every profile shows an AI skill score, so you can confidently hire even newcomers.</p>
            <Link href="/post" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 transition hover:text-brand-200">Post a well-scoped job <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <Link href="/wallet" className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-5 py-4 transition hover:border-brand-200 hover:bg-brand-50/30">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand"><Wallet className="h-4 w-4" /></span>
            <p className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-ink-400">Available balance</span>
              <span className="block text-lg font-bold text-ink">{formatPKR(wallet)}</span>
            </p>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        </aside>
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Post your next job", body: "One click to the right place.", href: "/post" },
          { title: "Take the AI Skill Check", body: "Free, 5 minutes, instant score.", href: "/interview" },
          { title: "Complete your profile", body: "Unlock better match position.", href: "/profile" },
        ].map((action) => (
          <Link key={action.title} href={action.href} className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-5 py-4 transition hover:border-brand-200 hover:bg-brand-50/30">
            <p className="min-w-0 flex-1">
              <span className="block font-bold text-ink group-hover:text-brand-dark">{action.title}</span>
              <span className="mt-0.5 block text-sm text-ink-500">{action.body}</span>
            </p>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </section>
    </div>
  );
}