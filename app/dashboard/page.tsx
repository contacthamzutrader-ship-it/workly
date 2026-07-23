"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Gavel,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listTasksByPoster, listBidsByUser, listPublicTasks, getTask, type Task, type Bid } from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import { formatPKR } from "@/lib/format";

type BidWithTask = Bid & { task?: Task | null };
type View = "client" | "tasker";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const [posted, setPosted] = useState<Task[]>([]);
  const [opportunities, setOpportunities] = useState<Task[]>([]);
  const [myBids, setMyBids] = useState<BidWithTask[]>([]);
  const [wallet, setWallet] = useState(0);
  const [busy, setBusy] = useState(true);
  const [view, setView] = useState<View>("client");

  useEffect(() => {
    if (role === "tasker") setView("tasker");
    else setView("client");
  }, [role]);

  useEffect(() => {
    if (loading || !user || !role) return;
    (async () => {
      try {
        if (role === "tasker") {
          const [available, bids] = await Promise.all([listPublicTasks(), listBidsByUser(user.uid)]);
          const withTasks = await Promise.all(bids.map(async (bid) => ({ ...bid, task: await getTask(bid.taskId) })));
          setOpportunities(available.filter((task) => task.status === "open"));
          setMyBids(withTasks);
          setPosted([]);
        } else {
          setPosted(await listTasksByPoster(user.uid));
          setOpportunities([]);
          setMyBids([]);
        }
      } catch {
        setPosted([]);
        setOpportunities([]);
        setMyBids([]);
      }
      try {
        if (db) {
          const s = await getDoc(doc(db, "users", user.uid));
          if (s.exists()) setWallet(s.data().wallet ?? 0);
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

  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";
  const canPost = role === "customer" || role === "company_admin" || role === "super_admin";
  const activePosted = posted.filter(t => ["open", "assigned", "in_progress"].includes(t.status));
  const selectedBids = myBids.filter(b => b.status === "selected");
  const clientSpent = posted.filter(t => t.paymentReleased).reduce((sum, task) => sum + (task.heldAmount || 0), 0);
  const taskerEarned = selectedBids.filter(b => b.task?.paymentReleased).reduce((sum, bid) => sum + Math.round(bid.amount * 0.85), 0);

  const clientStats = [
    { icon: BriefcaseBusiness, label: "Tasks posted", value: posted.length, tone: "bg-brand-50 text-brand" },
    { icon: Clock3, label: "Active now", value: activePosted.length, tone: "bg-blue-50 text-blue-600" },
    { icon: CheckCircle2, label: "Completed", value: posted.filter(t => t.status === "completed").length, tone: "bg-emerald-50 text-emerald-600" },
    { icon: Wallet, label: "Total released", value: formatPKR(clientSpent), tone: "bg-amber-50 text-amber-700" },
  ];
  const taskerStats = [
    { icon: Gavel, label: "Offers sent", value: myBids.length, tone: "bg-brand-50 text-brand" },
    { icon: BadgeCheck, label: "Jobs won", value: selectedBids.length, tone: "bg-blue-50 text-blue-600" },
    { icon: CheckCircle2, label: "Completed", value: selectedBids.filter(b => b.task?.status === "completed").length, tone: "bg-emerald-50 text-emerald-600" },
    { icon: Wallet, label: "Earned", value: formatPKR(taskerEarned), tone: "bg-amber-50 text-amber-700" },
  ];
  const stats = view === "client" ? clientStats : taskerStats;
  const rows = view === "client" ? posted : opportunities;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-dark"><LayoutDashboard className="h-4 w-4" /> Workspace</div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">Good to see you, {(user.displayName || user.email || "there").split(" ")[0]}.</h1>
            <p className="mt-2 text-sm font-medium text-ink-500">Everything that needs your attention, in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && <Link href="/admin"><Button variant="ghost" className="gap-2"><ShieldCheck className="h-4 w-4" /> Admin control</Button></Link>}
            {canPost && <Link href="/post"><Button className="gap-2"><Plus className="h-4 w-4" /> Post a task</Button></Link>}
          </div>
        </div>

        <div className="mt-7 inline-flex rounded-2xl border border-ink-100 bg-white px-5 py-3 text-sm font-extrabold text-ink shadow-card">
          {isAdmin ? "Operations workspace" : view === "client" ? "Client workspace" : "Freelancer workspace"}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${stat.tone}`}><stat.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="truncate text-lg font-black tracking-[-0.025em] text-ink sm:text-xl">{stat.value}</p><p className="mt-0.5 text-[11px] font-bold text-ink-400">{stat.label}</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
              <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">{view === "client" ? "Client workspace" : "Freelancer workspace"}</p><h2 className="mt-1 text-xl font-black text-ink">{view === "client" ? "Your tasks" : "Tasks you can bid on"}</h2></div>
              <Link href={view === "client" ? "/post" : "/tasks"} className="flex items-center gap-1.5 text-xs font-extrabold text-brand-dark">{view === "client" ? "Post new" : "Find work"} <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>

            {busy ? (
              <div className="space-y-3 p-6">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-50" />)}</div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">{view === "client" ? <BriefcaseBusiness className="h-5 w-5" /> : <Search className="h-5 w-5" />}</span>
                <h3 className="mt-4 font-black text-ink">{view === "client" ? "No tasks posted yet" : "No open tasks right now"}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">{view === "client" ? "Post your first task and let Workly route it to the right professionals." : "New client tasks will appear here as soon as they are approved."}</p>
                <Link href={view === "client" ? "/post" : "/tasks"} className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-dark">{view === "client" ? "Post a task" : "Browse work"} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {view === "client" ? posted.slice(0, 8).map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="group flex items-center gap-4 p-5 transition hover:bg-ink-50/70 sm:p-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><BriefcaseBusiness className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate font-black text-ink group-hover:text-brand-dark">{task.title}</p><p className="mt-1 text-xs font-semibold text-ink-400">{formatPKR(task.budget)} - {task.bidsCount} offers</p></div>
                    <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${task.status === "pending" ? "bg-amber-50 text-amber-700" : task.status === "completed" ? "bg-green-50 text-green-700" : "bg-brand-50 text-brand-dark"}`}>{task.status.replace("_", " ")}</span>
                    <ArrowRight className="hidden h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand sm:block" />
                  </Link>
                )) : opportunities.slice(0, 8).map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="group flex items-center gap-4 p-5 transition hover:bg-ink-50/70 sm:p-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Gavel className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate font-black text-ink group-hover:text-brand-dark">{task.title}</p><p className="mt-1 truncate text-xs font-semibold text-ink-400">{task.category} · {task.location} · {task.bidsCount} offers</p></div>
                    <div className="text-right"><p className="text-sm font-black text-ink">{formatPKR(task.budget)}</p><p className="mt-1 text-[10px] font-black uppercase text-brand-dark">Bid now</p></div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-elevated">
              <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand"><Sparkles className="h-5 w-5" /></span><TrendingUp className="h-5 w-5 text-brand-light" /></div>
              <h2 className="mt-5 text-xl font-black">{view === "client" ? "Smarter hiring" : "Win better-fit work"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{view === "client" ? "Workly ranks incoming offers using skill fit, trust and success history." : "Complete your skills and trust profile to improve your AI match position."}</p>
              <Link href={view === "client" ? "/post" : "/profile"} className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-brand-300">{view === "client" ? "Post a well-scoped task" : "Improve your profile"} <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <Link href="/wallet" className="surface group flex items-center gap-4 p-5 transition hover:border-brand-200">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><Wallet className="h-5 w-5" /></span>
              <div className="flex-1"><p className="text-xs font-bold text-ink-400">Available balance</p><p className="mt-1 text-lg font-black text-ink">{formatPKR(wallet)}</p></div>
              <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          </aside>
        </div>

        {view === "tasker" && (
          <section className="surface mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
              <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Your activity</p><h2 className="mt-1 text-xl font-black text-ink">Offers you sent</h2></div>
              <Link href="/tasks" className="flex items-center gap-1.5 text-xs font-extrabold text-brand-dark">Find more work <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {myBids.length === 0 ? <p className="p-6 text-sm font-medium text-ink-500">You have not sent an offer yet.</p> : (
              <div className="divide-y divide-ink-100">{myBids.slice(0, 8).map((bid) => (
                <Link key={bid.id} href={`/tasks/${bid.taskId}`} className="flex items-center gap-4 p-5 transition hover:bg-ink-50 sm:px-6">
                  <div className="min-w-0 flex-1"><p className="truncate font-black text-ink">{bid.task?.title || "Task"}</p><p className="mt-1 truncate text-xs text-ink-400">{bid.message || "Offer submitted"}</p></div>
                  <div className="text-right"><p className="text-sm font-black text-ink">{formatPKR(bid.amount)}</p><p className="mt-1 text-[10px] font-black uppercase text-ink-400">{bid.status}</p></div>
                </Link>
              ))}</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
