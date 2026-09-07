"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatPKR } from "@/lib/format";
import { listPublicTasks, listBidsByUser, getTask, type Task, type Bid } from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAiResult, computeAiScore } from "@/lib/ai-score";

type BidWithTask = Bid & { task?: Task | null };

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<Task[]>([]);
  const [bids, setBids] = useState<BidWithTask[]>([]);
  const [trust, setTrust] = useState(70);
  const [skills, setSkills] = useState<string[]>([]);
  const [profileComplete, setProfileComplete] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [publicTasks, myBids] = await Promise.all([listPublicTasks(), listBidsByUser(user.uid)]);
        const withTasks = await Promise.all(myBids.map(async (bid) => ({ ...bid, task: await getTask(bid.taskId) })));
        setAvailable(publicTasks.filter((t) => t.status === "open").slice(0, 4));
        setBids(withTasks);
      } catch {
        setAvailable([]);
        setBids([]);
      }
      try {
        if (db) {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const d = snap.data();
            if (typeof d.trustScore === "number") setTrust(d.trustScore);
            if (Array.isArray(d.skills)) setSkills(d.skills);
            setProfileComplete(Boolean(d.profileComplete));
          }
        }
      } catch {
        // Ignore profile fetch errors.
      }
      setBusy(false);
    })();
  }, [user]);

  const ai = (() => {
    const stored = getAiResult();
    if (stored) return stored.skillScore;
    return computeAiScore({ trustScore: trust, bio: "", skills, professionalTitle: "" }).skillScore;
  })();
  const aiScore = Math.max(0, Math.min(99, ai));

  const selected = bids.filter((b) => b.status === "selected");
  const earned = selected.filter((b) => b.task?.paymentReleased).reduce((sum, b) => sum + Math.round(b.amount * 0.85), 0);
  const completed = selected.filter((b) => b.task?.status === "completed").length;
  const profilePct = profileComplete ? 100 : Math.min(85, 30 + trust * 0.3);

  const stats = [
    { label: "Offers sent", value: String(bids.length) },
    { label: "Jobs won", value: String(selected.length) },
    { label: "Completed", value: String(completed) },
    { label: "Earned", value: formatPKR(earned) },
  ];

  if (busy) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-ink-50" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-50" />)}</div>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="h-80 animate-pulse rounded-2xl bg-ink-50" />
          <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink-50" />)}</div>
        </div>
      </div>
    );
  }

  const firstName = (user?.displayName || "there").split(" ")[0];

  return (
    <div className="font-ui space-y-8">
      {/* Welcome band */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-eyebrow">Freelancer workspace</p>
          <h1 className="page-title">Welcome back, {firstName}.</h1>
          <p className="page-sub">Your next opportunity is closer than you think. Here&apos;s your activity and the newest work waiting for you.</p>
        </div>
        <Link href="/browse" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700">
          <BriefcaseBusiness className="h-4 w-4" /> Browse tasks
        </Link>
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
              <p className="page-eyebrow">Recommended for you</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Available tasks</h2>
            </div>
            <Link href="/browse" className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {available.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300"><BriefcaseBusiness className="h-5 w-5" /></span>
              <h3 className="mt-4 text-base font-bold text-ink">No open tasks right now</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">New beginner-friendly tasks appear here as soon as clients post them. Check back soon.</p>
              <Link href="/browse" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">Browse all tasks <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {available.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-canvas sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink group-hover:text-brand-dark">{t.title}</p>
                    <p className="mt-0.5 text-xs font-medium text-ink-400">{t.category} · {t.location}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-ink">{formatPKR(t.budget)}</p>
                    <p className="mt-0.5 text-xs font-medium text-ink-400">{t.bidsCount} {t.bidsCount === 1 ? "offer" : "offers"}</p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand"><Sparkles className="h-4 w-4" /></span>
              <p className="page-eyebrow">AI skill score</p>
            </div>
            <p className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-ink">{aiScore}</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">A stronger score raises how often your offers are recommended first.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${aiScore}%` }} />
            </div>
            <Link href="/interview" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700">Improve skill check <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand"><UserRound className="h-4 w-4" /></span>
              <p className="page-eyebrow">Profile</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-500">Completed</span>
              <span className="font-bold text-ink">{Math.round(profilePct)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-ink-300 transition-all" style={{ width: `${profilePct}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-400">A complete profile helps clients trust you and boosts your match position.</p>
            <Link href="/profile" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700">Complete profile <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </aside>
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Find work", body: "Browse open tasks and send an offer.", href: "/browse" },
          { title: "Test your skills", body: "Free AI skill check, instant score.", href: "/interview" },
          { title: "Review your projects", body: "Track offers, active and completed work.", href: "/projects" },
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