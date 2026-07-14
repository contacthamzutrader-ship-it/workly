"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Clock, Lock, CheckCircle2, ArrowRight, Eye, Users, Briefcase, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listPendingTasks, listPrivateTasks, approveTask, type Task } from "@/lib/tasks";
import Button from "@/components/ui/Button";

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<Task[]>([]);
  const [privateTasks, setPrivateTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(true);

  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => { if (!loading && !user) router.replace("/login"); if (!loading && user && !isAdmin) router.replace("/dashboard"); }, [loading, user, isAdmin, router]);

  const load = async () => {
    setBusy(true);
    try { setPending(await listPendingTasks()); setPrivateTasks(await listPrivateTasks()); } catch {} finally { setBusy(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (!isAdmin) return null;

  const approve = async (taskId: string, visibility: "public" | "private") => { await approveTask(taskId, visibility); load(); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-extrabold text-ink">Admin Panel</h1><p className="text-sm text-ink-500">Manage approvals, tasks & team</p></div>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink-50">
          <ArrowRight className="h-4 w-4 rotate-180" /> Dashboard
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Clock, label: "Pending", value: pending.length, color: "bg-amber-50 text-amber-600" },
          { icon: Lock, label: "Private", value: privateTasks.length, color: "bg-purple-50 text-purple-600" },
          { icon: Briefcase, label: "Total Queue", value: pending.length + privateTasks.length, color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "Active Private", value: privateTasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length, color: "bg-green-50 text-green-600" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-xl font-extrabold text-ink">{s.value}</p><p className="text-xs text-ink-500">{s.label}</p></div></div>
          </div>
        ))}
      </div>

      {busy ? (
        <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Pending */}
          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-bold text-ink">Pending Approval</h2><p className="text-sm text-ink-500">Review manual tasks</p></div>
            </div>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" /><p className="mt-2 text-sm text-ink-500">All caught up!</p>
                </div>
              ) : pending.map(t => (
                <div key={t.id} className="flex flex-col gap-4 rounded-xl border border-ink-100 p-5 transition hover:border-brand/30 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-ink">{t.title}</h3><span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{t.category}</span></div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-500">{t.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm"><span className="font-bold text-brand">${t.budget}</span><span className="text-ink-400">{t.location}</span><span className="text-ink-400">by {t.posterName}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approve(t.id!, "public")} className="flex items-center gap-1.5 rounded-xl"><Eye className="h-4 w-4" /> Approve Public</Button>
                    <button onClick={() => approve(t.id!, "private")} className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"><Lock className="h-4 w-4" /> Approve Private</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Private Tasks */}
          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600"><Lock className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-bold text-ink">Private Tasks (Team)</h2><p className="text-sm text-ink-500">Only our team sees and bids on these</p></div>
            </div>
            <div className="space-y-3">
              {privateTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center"><Lock className="mx-auto h-8 w-8 text-ink-300" /><p className="mt-2 text-sm text-ink-500">No private tasks</p></div>
              ) : privateTasks.map(t => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 p-5 transition hover:border-brand/30 hover:shadow-sm">
                  <div className="min-w-0 flex-1"><h3 className="font-bold text-ink">{t.title}</h3><div className="mt-1 flex items-center gap-4 text-sm text-ink-500"><span className="font-bold text-brand">${t.budget}</span><span>{t.bidsCount} bids</span></div></div>
                  <span className="ml-3 shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{t.status}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
