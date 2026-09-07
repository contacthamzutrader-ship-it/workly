"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatPKR } from "@/lib/format";
import { listPublicTasks, type Task } from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAiResult, computeAiScore } from "@/lib/ai-score";

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<Task[]>([]);
  const [trust, setTrust] = useState(70);
  const [skills, setSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const publicTasks = await listPublicTasks();
        setAvailable(publicTasks.filter((t) => t.status === "open").slice(0, 3));
      } catch {
        setAvailable([]);
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

  if (busy) {
    return <div className="h-72 animate-pulse rounded-2xl border border-ink-100 bg-white" />;
  }

  return (
    <>
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