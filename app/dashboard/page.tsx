"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, Gavel, ShieldCheck, Clock, CheckCircle2, ArrowRight, Search, Wallet, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listTasksByPoster, listBidsByUser, getTask, type Task, type Bid } from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";

type BidWithTask = Bid & { task?: Task | null };

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const [posted, setPosted] = useState<Task[]>([]);
  const [myBids, setMyBids] = useState<BidWithTask[]>([]);
  const [wallet, setWallet] = useState<number>(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const [p, b] = await Promise.all([listTasksByPoster(user.uid), listBidsByUser(user.uid)]);
      const withTasks = await Promise.all(b.map(async (bid) => ({ ...bid, task: await getTask(bid.taskId) })));
      setPosted(p);
      setMyBids(withTasks);
      try { if (db) { const s = await getDoc(doc(db, "users", user.uid)); if (s.exists()) setWallet(s.data().wallet ?? 0); } } catch {}
      setBusy(false);
    })();
  }, [loading, user]);

  if (!loading && !user) { if (typeof window !== "undefined") window.location.href = "/login"; return null; }
  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const isAdmin = role === "company_admin" || role === "super_admin";
  const active = posted.filter(t => t.status === "open" || t.status === "assigned" || t.status === "in_progress");
  const done = posted.filter(t => t.status === "completed");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Dashboard</h1>
          <p className="mt-1 text-ink-500">Welcome back, {user.displayName || user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/post"><Button className="flex items-center gap-2 rounded-xl px-5 py-2.5"><Plus className="h-4 w-4" /> Post a Task</Button></Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-100">
              <ShieldCheck className="h-4 w-4" /> Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Briefcase, label: "Posted", value: posted.length, color: "bg-brand-50 text-brand" },
          { icon: Clock, label: "Active", value: active.length, color: "bg-blue-50 text-blue-600" },
          { icon: CheckCircle2, label: "Completed", value: done.length, color: "bg-green-50 text-green-600" },
          { icon: Wallet, label: "Wallet", value: `$${wallet}`, color: "bg-purple-50 text-purple-600" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-xl font-extrabold text-ink">{s.value}</p><p className="text-xs text-ink-500">{s.label}</p></div></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink"><Briefcase className="mr-2 inline-block h-5 w-5 text-brand" />My Tasks</h2>
            <Link href="/post" className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1">Post new <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-4 space-y-3">
            {posted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-ink-300" />
                <p className="mt-2 text-sm text-ink-500">No tasks posted yet</p>
                <Link href="/post" className="mt-2 inline-block text-sm font-semibold text-brand">Post your first task</Link>
              </div>
            ) : posted.slice(0, 5).map(t => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 p-4 transition hover:border-brand/30 hover:shadow-sm">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{t.title}</p><p className="mt-0.5 text-sm text-ink-500">${t.budget} · {t.bidsCount} bids</p></div>
                <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === "completed" ? "bg-green-50 text-green-700" : t.status === "open" ? "bg-brand-50 text-brand-dark" : "bg-ink-50 text-ink-600"}`}>{t.status.replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* My Bids */}
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink"><Gavel className="mr-2 inline-block h-5 w-5 text-brand" />My Bids</h2>
            <Link href="/tasks" className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1">Browse <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-4 space-y-3">
            {myBids.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center">
                <Search className="mx-auto h-8 w-8 text-ink-300" />
                <p className="mt-2 text-sm text-ink-500">No bids placed yet</p>
                <Link href="/tasks" className="mt-2 inline-block text-sm font-semibold text-brand">Find tasks to bid on</Link>
              </div>
            ) : myBids.slice(0, 5).map(b => (
              <Link key={b.id} href={`/tasks/${b.taskId}`} className="flex items-center justify-between rounded-xl border border-ink-100 p-4 transition hover:border-brand/30 hover:shadow-sm">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{b.task?.title ?? "Task"}</p><p className="mt-0.5 text-sm text-ink-500">{b.message || "No message"}</p></div>
                <div className="ml-3 flex shrink-0 items-center gap-2"><span className="text-sm font-bold text-brand">${b.amount}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === "selected" ? "bg-green-50 text-green-700" : "bg-ink-50 text-ink-600"}`}>{b.status}</span></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
