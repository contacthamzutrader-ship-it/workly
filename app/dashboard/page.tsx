"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Gavel,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listTasksByPoster, listBidsByUser, listPublicTasks, getTask, type Task, type Bid } from "@/lib/tasks";
import FreelancerDashboard from "@/components/FreelancerDashboard";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import { formatPKR } from "@/lib/format";
import { getAiResult, computeAiScore } from "@/lib/ai-score";

type BidWithTask = Bid & { task?: Task | null };
type View = "client" | "tasker";

function ScoreRing({ value, label, sub, icon: Icon }: { value: number; label: string; sub: string; icon: any }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="#00CB75" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} />
        </svg>
        <span className="absolute text-lg font-black text-ink">{value}</span>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-black text-ink"><Icon className="h-4 w-4 text-mint-700" /> {label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-ink-400">{sub}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const [posted, setPosted] = useState<Task[]>([]);
  const [opportunities, setOpportunities] = useState<Task[]>([]);
  const [myBids, setMyBids] = useState<BidWithTask[]>([]);
  const [wallet, setWallet] = useState(0);
  const [trust, setTrust] = useState(60);
  const [profileComplete, setProfileComplete] = useState(false);
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
          if (s.exists()) {
            const d = s.data();
            setWallet(d.wallet ?? 0);
            if (typeof d.trustScore === "number") setTrust(d.trustScore);
            setProfileComplete(Boolean(d.profileComplete));
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
  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mint border-t-transparent" /></div>;

  if (role === "tasker") return <FreelancerDashboard />;

  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";
  const canPost = role === "customer" || role === "company_admin" || role === "super_admin";
  const activePosted = posted.filter(t => ["open", "assigned", "in_progress"].includes(t.status));
  const selectedBids = myBids.filter(b => b.status === "selected");
  const clientSpent = posted.filter(t => t.paymentReleased).reduce((sum, task) => sum + (task.heldAmount || 0), 0);
  const taskerEarned = selectedBids.filter(b => b.task?.paymentReleased).reduce((sum, bid) => sum + Math.round(bid.amount * 0.85), 0);

  const firstName = (user.displayName || user.email || "there").split(" ")[0];
  const ai = getAiResult() ?? computeAiScore({ trustScore: trust, bio: "", skills: [], professionalTitle: "" });
  const aiScore = Math.max(0, Math.min(99, ai.skillScore));
  const profilePct = profileComplete ? 100 : Math.min(85, 30 + trust * 0.3);
  const recommended = opportunities.slice(0, 3);

  const stats = view === "client"
    ? [
        { icon: BriefcaseBusiness, label: "Active projects", value: activePosted.length, tone: "bg-mint-50 text-mint-700" },
        { icon: CheckCircle2, label: "Completed", value: posted.filter(t => t.status === "completed").length, tone: "bg-green-50 text-success" },
        { icon: Star, label: "Average rating", value: "\u2014", tone: "bg-amber-50 text-warning" },
        { icon: Wallet, label: "Total released", value: formatPKR(clientSpent), tone: "bg-mint-50 text-deep" },
      ]
    : [
        { icon: Gavel, label: "Offers sent", value: myBids.length, tone: "bg-mint-50 text-mint-700" },
        { icon: BadgeCheck, label: "Jobs won", value: selectedBids.length, tone: "bg-green-50 text-success" },
        { icon: CheckCircle2, label: "Completed", value: selectedBids.filter(b => b.task?.status === "completed").length, tone: "bg-mint-50 text-deep" },
        { icon: Wallet, label: "Earned", value: formatPKR(taskerEarned), tone: "bg-amber-50 text-warning" },
      ];

  const rows = view === "client" ? posted : opportunities;

  return (
    <div className="page-shell space-y-6 py-6 sm:py-8">
      <section className="relative overflow-hidden rounded-2xl bg-deep p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-40" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-mint-300/30 bg-mint/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-mint">
              {isAdmin ? "Operations workspace" : view === "client" ? "Client workspace" : "Freelancer workspace"}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Welcome back, {firstName}.</h1>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-white/60">
              {view === "client"
                ? "Hire confidently — every freelancer carries an AI-verified skill score."
                : "Your first freelance opportunity is closer than you think. Let's get you there."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && <Link href="/admin"><Button variant="ghost" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"><ShieldCheck className="h-4 w-4" /> Admin control</Button></Link>}
            {canPost ? (
              <Link href="/post"><Button className="gap-2"><Plus className="h-4 w-4" /> Post a job</Button></Link>
            ) : (
              <Link href="/interview"><Button className="gap-2"><Sparkles className="h-4 w-4" /> AI Skill Check</Button></Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface p-5">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${stat.tone}`}><stat.icon className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="truncate text-xl font-black tracking-[-0.025em] text-ink">{stat.value}</p><p className="mt-0.5 text-[11px] font-bold text-ink-400">{stat.label}</p></div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">AI assessment</p><h2 className="mt-1 text-lg font-black text-ink">Your AI Skill Score</h2></div>
            <Link href="/interview" className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-[11px] font-extrabold text-mint-700 transition hover:bg-mint-100">Improve <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-5">
            <ScoreRing value={aiScore} label="Skill score" sub={aiScore >= 85 ? "Excellent — clients will notice you." : aiScore >= 70 ? "Good — a few tweaks will boost you." : "A great starting point — keep growing."} icon={Sparkles} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-canvas p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-400">Confidence</p>
              <p className="mt-1 text-lg font-black text-mint-700">{ai.confidence}%</p>
            </div>
            <div className="rounded-xl bg-canvas p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-400">Best for</p>
              <p className="mt-1 truncate text-sm font-extrabold text-ink">{ai.categories[0]}</p>
            </div>
          </div>
        </div>

        <div className="surface p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Reputation</p><h2 className="mt-1 text-lg font-black text-ink">Trust score</h2></div>
            <ShieldCheck className="h-5 w-5 text-mint-700" />
          </div>
          <div className="mt-5">
            <ScoreRing value={trust} label="Trust score" sub={trust >= 75 ? "Clients can hire you with confidence." : "Complete jobs to grow this number."} icon={BadgeCheck} />
          </div>
          <div className="mt-5 rounded-xl bg-canvas p-4">
            <div className="flex items-center justify-between text-xs font-bold text-ink-500">
              <span>Profile completion</span><span className="text-deep">{Math.round(profilePct)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${profilePct}%` }} />
            </div>
            <Link href="/profile" className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-mint-700">Complete your profile <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">{view === "client" ? "Client workspace" : "Freelancer workspace"}</p><h2 className="mt-1 text-xl font-black text-ink">{view === "client" ? "Active projects" : "Recommended jobs for you"}</h2></div>
            <Link href={view === "client" ? "/post" : "/tasks"} className="flex items-center gap-1.5 text-xs font-extrabold text-mint-700">{view === "client" ? "Post new" : "Find work"} <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          {busy ? (
            <div className="space-y-3 p-6">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-50" />)}</div>
          ) : rows.length === 0 && recommended.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mint-50 text-mint-700">{view === "client" ? <BriefcaseBusiness className="h-5 w-5" /> : <Search className="h-5 w-5" />}</span>
              <h3 className="mt-4 font-black text-ink">{view === "client" ? "No projects yet" : "No open jobs right now"}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">{view === "client" ? "Post your first job and let matched freelancers come to you." : "New beginner-friendly jobs will appear here as soon as they are approved."}</p>
              <Link href={view === "client" ? "/post" : "/tasks"} className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-mint-700">{view === "client" ? "Post a job" : "Browse jobs"} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {(view === "client" ? posted.slice(0, 6) : opportunities.slice(0, 6)).map(task => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="group flex items-center gap-4 p-5 transition hover:bg-canvas sm:px-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint-50 text-mint-700"><BriefcaseBusiness className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate font-black text-ink group-hover:text-deep">{task.title}</p><p className="mt-1 text-xs font-semibold text-ink-400">{view === "client" ? `${formatPKR(task.budget)} · ${task.bidsCount} offers` : `${task.category} · ${task.location}`}</p></div>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${task.status === "pending" ? "bg-amber-50 text-warning" : task.status === "completed" ? "bg-green-50 text-success" : "bg-mint-50 text-mint-700"}`}>{task.status.replace("_", " ")}</span>
                  <ArrowRight className="hidden h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-mint-700 sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-deep p-6 text-white shadow-card">
            <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-mint"><Sparkles className="h-5 w-5" /></span><TrendingUp className="h-5 w-5 text-mint" /></div>
            <h2 className="mt-5 text-xl font-black">{view === "client" ? "Smarter hiring" : "Win better-fit work"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">{view === "client" ? "Every profile shows an AI skill score, so you can confidently hire beginners." : "Take the AI Skill Check to raise your match position on real jobs."}</p>
            <Link href={view === "client" ? "/post" : "/interview"} className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-mint">{view === "client" ? "Post a well-scoped job" : "Boost your score"} <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <Link href="/wallet" className="surface group flex items-center gap-4 p-5 transition hover:border-mint-200">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint-50 text-mint-700"><Wallet className="h-5 w-5" /></span>
            <div className="flex-1"><p className="text-xs font-bold text-ink-400">Available balance</p><p className="mt-1 text-lg font-black text-ink">{formatPKR(wallet)}</p></div>
            <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-mint-700" />
          </Link>
          <Link href="/messages" className="surface group flex items-center gap-4 p-5 transition hover:border-mint-200">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-info"><MessageSquare className="h-5 w-5" /></span>
            <div className="flex-1"><p className="text-xs font-bold text-ink-400">Recent messages</p><p className="mt-1 text-sm font-black text-ink">Check your inbox</p></div>
            <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-mint-700" />
          </Link>
          <Link href="/notifications" className="surface group flex items-center gap-4 p-5 transition hover:border-mint-200">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-warning"><Clock3 className="h-5 w-5" /></span>
            <div className="flex-1"><p className="text-xs font-bold text-ink-400">Notifications</p><p className="mt-1 text-sm font-black text-ink">New updates may be waiting</p></div>
            <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-mint-700" />
          </Link>
        </aside>
      </section>

      {view === "tasker" && (
        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Your activity</p><h2 className="mt-1 text-xl font-black text-ink">Offers you sent</h2></div>
            <Link href="/tasks" className="flex items-center gap-1.5 text-xs font-extrabold text-mint-700">Find more work <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {myBids.length === 0 ? <p className="p-6 text-sm font-medium text-ink-500">You have not sent an offer yet.</p> : (
            <div className="divide-y divide-ink-100">{myBids.slice(0, 8).map((bid) => (
              <Link key={bid.id} href={`/tasks/${bid.taskId}`} className="flex items-center gap-4 p-5 transition hover:bg-canvas sm:px-6">
                <div className="min-w-0 flex-1"><p className="truncate font-black text-ink">{bid.task?.title || "Task"}</p><p className="mt-1 truncate text-xs text-ink-400">{bid.message || "Offer submitted"}</p></div>
                <div className="text-right"><p className="text-sm font-black text-ink">{formatPKR(bid.amount)}</p><p className="mt-1 text-[10px] font-black uppercase text-ink-400">{bid.status}</p></div>
              </Link>
            ))}</div>
          )}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: UserRoundCheck, title: view === "client" ? "Post your next job" : "Apply to your next job", body: "One click to the right place.", href: view === "client" ? "/post" : "/tasks" },
          { icon: Sparkles, title: "Take the AI Skill Check", body: "Free, 5 minutes, instant score.", href: "/interview" },
          { icon: Award, title: "Complete your profile", body: "Unlock better match position.", href: "/profile" },
        ].map((action) => (
          <Link key={action.title} href={action.href} className="surface group flex items-start gap-4 p-5 transition hover:border-mint-200 hover:shadow-card-hover">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint-50 text-mint-700"><action.icon className="h-5 w-5" /></span>
            <div className="flex-1"><p className="font-black text-ink group-hover:text-deep">{action.title}</p><p className="mt-1 text-xs font-medium leading-5 text-ink-400">{action.body}</p></div>
            <ArrowRight className="mt-1 h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-mint-700" />
          </Link>
        ))}
      </section>
    </div>
  );
}
