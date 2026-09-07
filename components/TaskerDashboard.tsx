"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CheckCircle2, Clock3, Coins, Layers, Search, Send, ShieldCheck, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatPKR } from "@/lib/format";
import { listTasksAssignedTo, listBidsByUser, listPublicTasks, type Task } from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAiResult, computeAiScore } from "@/lib/ai-score";

interface Stats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  cancelled: number;
  offers: number;
}

const STAT_CARDS: { key: keyof Stats; label: string; icon: any; tone: string; href: string }[] = [
  { key: "total", label: "Total Projects", icon: Layers, tone: "bg-brand-50 text-brand", href: "/projects" },
  { key: "active", label: "Active Projects", icon: BriefcaseBusiness, tone: "bg-blue-50 text-blue-600", href: "/projects/assigned" },
  { key: "pending", label: "Pending Projects", icon: Clock3, tone: "bg-amber-50 text-amber-600", href: "/projects/pending" },
  { key: "completed", label: "Completed Projects", icon: CheckCircle2, tone: "bg-green-50 text-green-600", href: "/projects/completed" },
  { key: "cancelled", label: "Cancelled Projects", icon: XCircle, tone: "bg-red-50 text-red-600", href: "/projects/cancelled" },
  { key: "offers", label: "Offers Submitted", icon: Send, tone: "bg-purple-50 text-purple-600", href: "/projects/offers" },
];

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Task[]>([]);
  const [available, setAvailable] = useState<Task[]>([]);
  const [trust, setTrust] = useState(70);
  const [skills, setSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [assigned, bids, publicTasks] = await Promise.all([
          listTasksAssignedTo(user.uid),
          listBidsByUser(user.uid),
          listPublicTasks(),
        ]);
        const active = assigned.filter((t) => t.status === "assigned" || t.status === "in_progress");
        const completed = assigned.filter((t) => t.status === "completed");
        const cancelled = assigned.filter((t) => t.status === "cancelled");
        const pendingOffers = bids.filter((b) => b.status === "pending").length;
        setOverview(active);
        setAvailable(publicTasks.filter((t) => t.status === "open").slice(0, 3));
        setStats({
          total: active.length + pendingOffers + completed.length + cancelled.length,
          active: active.length,
          pending: pendingOffers,
          completed: completed.length,
          cancelled: cancelled.length,
          offers: bids.length,
        });
      } catch {
        // Stats are optional; fall back to empty.
      }
      try {
        if (db) {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const d = snap.data();
            if (typeof d.trustScore === "number") setTrust(d.trustScore);
            if (Array.isArray(d.skills)) setSkills(d.skills);
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

  if (busy && !stats) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-ink-100 bg-white" />)}</div>;
  }

  return (
    <>
      {/* Summary cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {STAT_CARDS.map((card) => (
            <Link key={card.key} href={card.href} className="surface p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card">
              <span className={`inline-grid h-9 w-9 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-4 w-4" /></span>
              <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink">{stats[card.key]}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink-400"><ArrowUpRight className="h-3 w-3" /> {card.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Active overview */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Current overview</p>
            <h3 className="mt-1 text-lg font-black text-ink">Active projects</h3>
          </div>
          <Link href="/projects/assigned" className="inline-flex items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">All projects <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        {overview.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-5 py-8 text-center">
            <BriefcaseBusiness className="mx-auto h-6 w-6 text-ink-300" />
            <p className="mt-3 text-sm font-bold text-ink">No active project right now</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-ink-400">Browse tasks and send an offer to start your next project. Money for assigned work is held securely until completion.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {overview.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand"><Coins className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{t.title}</p>
                    <p className="truncate text-xs font-medium text-ink-400">{t.posterName} &middot; {t.category}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-ink">{formatPKR(t.heldAmount ?? t.budget)}</p>
                  <p className="text-xs font-bold text-brand">{t.status === "in_progress" ? "In progress" : "Assigned to you"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Available tasks sample */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Opportunity feed</p>
            <h3 className="mt-1 text-lg font-black text-ink">Available tasks</h3>
          </div>
          <Link href="/browse" className="inline-flex items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Browse all tasks <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-4">
          {available.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-5 py-8 text-center">
              <Search className="mx-auto h-6 w-6 text-ink-300" />
              <p className="mt-3 text-sm font-bold text-ink">No open tasks right now</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-ink-400">New tasks will appear here as soon as clients post them. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {available.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand"><BriefcaseBusiness className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{t.title}</p>
                      <p className="truncate text-xs font-medium text-ink-400">{t.category} &middot; {t.location}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-ink">{formatPKR(t.budget)}</p>
                    <p className="text-xs font-bold text-brand">Open for offers</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI skill score */}
      <div className="rounded-2xl bg-deep p-5 text-white shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <p className="font-black">Your AI skill score: {Math.max(0, Math.min(99, ai))}</p>
              <p className="mt-1 text-sm text-white/55">A stronger score improves how often your offers are recommended first.</p>
            </div>
          </div>
          <Link href="/interview" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-mint px-5 text-sm font-extrabold text-white transition hover:bg-mint-dark">
            <BriefcaseBusiness className="h-4 w-4" /> Improve skill check
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <div>
          <p className="text-xs font-bold text-ink-500">View your full project lists from the sidebar</p>
          <p className="mt-0.5 text-sm font-black text-ink">Projects, Completed, Pending and Cancelled</p>
        </div>
        <Link href="/projects" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Open Projects <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </>
  );
}