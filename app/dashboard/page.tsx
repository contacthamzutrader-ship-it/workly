"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Plus, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listTasksByPoster, listPublicTasks, type Task } from "@/lib/tasks";
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
      <div className="page-shell py-8 sm:py-10">
        <TaskerDashboard />
      </div>
    );
  }

  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";
  const canPost = role === "customer" || role === "company_admin" || role === "super_admin";
  const activePosted = posted.filter((t) => ["open", "assigned", "in_progress"].includes(t.status));
  const openForOffers = posted.filter((t) => t.status === "open");
  const inProgress = posted.filter((t) => ["assigned", "in_progress"].includes(t.status));
  const completed = posted.filter((t) => t.status === "completed");
  const clientSpent = posted.filter((t) => t.paymentReleased).reduce((sum, task) => sum + (task.heldAmount || 0), 0);
  const totalOffersReceived = posted.reduce((sum, t) => sum + (t.bidsCount || 0), 0);

  const firstName = (user.displayName || user.email || "there").split(" ")[0];

  return (
    <div className="page-shell py-8 sm:py-10 font-ui space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-deep via-[#003B16] to-[#00280F] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> {isAdmin ? "Operations Console" : "Client Workspace"}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1.5 text-sm text-white/70 max-w-xl">
              Post projects, evaluate verified proposals with AI match scores, and collaborate with top Pakistani freelance talent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" className="gap-2 text-white border-white/20 hover:bg-white/10">
                  <ShieldCheck className="h-4 w-4" /> Admin Console
                </Button>
              </Link>
            )}
            {canPost && (
              <Link href="/post">
                <Button className="gap-2 bg-brand text-white shadow-forest hover:bg-brand-700">
                  <Plus className="h-4 w-4" /> Post a Project
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Key Metric Cards */}
      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="card px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Active Projects</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink">{activePosted.length}</p>
          <span className="mt-1 block text-xs text-ink-500">{openForOffers.length} accepting offers</span>
        </div>

        <div className="card px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Offers Received</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink">{totalOffersReceived}</p>
          <span className="mt-1 block text-xs text-ink-500">Across all projects</span>
        </div>

        <div className="card px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">In Progress</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink">{inProgress.length}</p>
          <span className="mt-1 block text-xs text-ink-500">{completed.length} completed</span>
        </div>

        <Link href="/wallet" className="card px-5 py-4 transition hover:border-brand-300">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Released</span>
            <Wallet className="h-4 w-4 text-brand" />
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink">{formatPKR(clientSpent)}</p>
          <span className="mt-1 block text-xs text-brand font-semibold">Wallet balance: {formatPKR(wallet)}</span>
        </Link>
      </section>

      {/* Main Content Layout */}
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Posted Projects */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 sm:px-6">
            <div>
              <p className="page-eyebrow">Project Management</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Your Posted Projects</h2>
            </div>
            {canPost && (
              <Link href="/post" className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700">
                + Post new <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {busy ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-50" />
              ))}
            </div>
          ) : posted.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand">
                <BriefcaseBusiness className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">No projects posted yet</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">
                Post your project scope and budget to receive tailored proposals from AI-verified talent.
              </p>
              <Link
                href="/post"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
              >
                Post your first project <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {posted.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 p-5 transition hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="truncate text-[16px] font-bold text-ink hover:text-brand-dark transition"
                      >
                        {task.title}
                      </Link>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                          task.status === "open"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : task.status === "assigned" || task.status === "in_progress"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : task.status === "completed"
                            ? "bg-brand-50 text-brand-dark border border-brand-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                      <span className="font-semibold text-ink-600">{formatPKR(task.budget)}</span>
                      <span>·</span>
                      <span>{task.category}</span>
                      <span>·</span>
                      <span className="font-bold text-brand">{task.bidsCount} proposals received</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-ink-50 px-4 text-xs font-bold text-ink transition hover:bg-brand hover:text-white"
                    >
                      Review Proposals ({task.bidsCount}) <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-deep via-[#003B16] to-[#00280F] p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </span>
              <TrendingUp className="h-5 w-5 text-brand-300" />
            </div>
            <h3 className="mt-4 text-lg font-bold">AI Skill Verification</h3>
            <p className="mt-1.5 text-xs leading-5 text-white/70">
              Every applicant on Workly carries an AI skill assessment score, helping you select verified experts and reduce hiring risk.
            </p>
            <Link
              href="/browse"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-300 transition hover:text-white"
            >
              Browse Verified Talent <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Link
            href="/wallet"
            className="group flex items-center gap-3.5 rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
              <Wallet className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-ink-400">Escrow & Wallet</span>
              <span className="block text-lg font-bold text-ink">{formatPKR(wallet)}</span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>

          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">Quick Links</h4>
            <div className="mt-3 space-y-2">
              <Link href="/post" className="block text-xs font-bold text-ink hover:text-brand transition">
                → Post a New Job
              </Link>
              <Link href="/browse" className="block text-xs font-bold text-ink hover:text-brand transition">
                → Explore Freelancer Profiles
              </Link>
              <Link href="/settings" className="block text-xs font-bold text-ink hover:text-brand transition">
                → Account & Notification Settings
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}