"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Compass,
  Gavel,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  ACTIVE_STATUSES,
  PLATFORM_FEE,
  subscribeBidsByUser,
  subscribePublicTasks,
  subscribeTasksByPoster,
  subscribeTasksForFreelancer,
  TASK_STATUS_META,
  type Bid,
  type Task,
} from "@/lib/tasks";
import { formatPKR, timeAgo } from "@/lib/format";
import { MEMBER_ROLE_LABELS } from "@/lib/roles";
import Button from "@/components/ui/Button";
import TaskCard from "@/components/TaskCard";
import { Stat, StatusBadge } from "@/components/ui/Badge";
import { EmptyState, PageLoader, Skeleton } from "@/components/ui/Feedback";

export default function DashboardPage() {
  const { user, profile, role, staff, isStaff, capabilities, loading } = useAuth();
  const router = useRouter();

  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [recommended, setRecommended] = useState<Task[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsubscribers: (() => void)[] = [];
    try {
      unsubscribers.push(
        subscribeTasksByPoster(user.uid, (tasks) => {
          setPostedTasks(tasks);
          setBusy(false);
        })
      );
      unsubscribers.push(subscribeTasksForFreelancer(user.uid, setAssignedTasks));
      unsubscribers.push(subscribeBidsByUser(user.uid, setMyBids));
    } catch {
      setBusy(false);
    }
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  useEffect(() => {
    if (role !== "freelancer") return;
    // Realtime recommendations — update the moment a new open task is approved.
    try {
      return subscribePublicTasks({ sort: "newest" }, (tasks) =>
        setRecommended(tasks.filter((task) => task.status === "open").slice(0, 6))
      );
    } catch {
      setRecommended([]);
    }
  }, [role]);

  const clientMetrics = useMemo(() => {
    const active = postedTasks.filter((task) => ACTIVE_STATUSES.includes(task.status));
    const awaiting = postedTasks.filter((task) => task.status === "submitted");
    const offers = postedTasks.reduce((total, task) => total + (task.bidsCount || 0), 0);
    const spent = postedTasks
      .filter((task) => task.paymentReleased)
      .reduce((total, task) => total + (task.heldAmount || 0), 0);
    return { active, awaiting, offers, spent };
  }, [postedTasks]);

  const freelancerMetrics = useMemo(() => {
    const pending = myBids.filter((bid) => bid.status === "pending");
    const won = myBids.filter((bid) => bid.status === "selected");
    const active = assignedTasks.filter((task) => ACTIVE_STATUSES.includes(task.status));
    const earned = assignedTasks
      .filter((task) => task.paymentReleased)
      .reduce((total, task) => total + Math.round((task.heldAmount || 0) * (1 - PLATFORM_FEE)), 0);
    return { pending, won, active, earned };
  }, [myBids, assignedTasks]);

  if (loading || !user) return <PageLoader />;

  const firstName = (profile?.name || user.displayName || user.email || "there").split(" ")[0];
  const isClient = role === "client";

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-dark">
              <LayoutDashboard className="h-4 w-4" /> {MEMBER_ROLE_LABELS[role]} workspace
            </div>
            <h1 className="mt-3 text-[32px] font-black leading-tight tracking-[-0.04em] text-ink sm:text-4xl">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-2 text-sm font-medium text-ink-500">
              {isClient
                ? "Everything you have posted, plus what needs your decision."
                : "Your offers, active jobs and fresh work worth bidding on."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isStaff && (
              <Link href="/admin">
                <Button variant="ghost">
                  <ShieldCheck className="h-4 w-4" /> {staff?.isOwner ? "Owner control" : "Staff control"}
                </Button>
              </Link>
            )}
            {isClient && capabilities.canPostTask ? (
              <Link href="/post">
                <Button>
                  <Plus className="h-4 w-4" /> Post a task
                </Button>
              </Link>
            ) : (
              <Link href="/tasks">
                <Button>
                  <Compass className="h-4 w-4" /> Find work
                </Button>
              </Link>
            )}
          </div>
        </header>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isClient ? (
            <>
              <Stat icon={BriefcaseBusiness} label="Tasks posted" value={postedTasks.length} />
              <Stat icon={Gavel} label="Offers received" value={clientMetrics.offers} tone="bg-$info-50 text-$info-600" />
              <Stat
                icon={Inbox}
                label="Awaiting your review"
                value={clientMetrics.awaiting.length}
                tone="bg-$deep-50 text-$deep-600"
              />
              <Stat icon={Wallet} label="Total released" value={formatPKR(clientMetrics.spent)} tone="bg-$warning-50 text-$warning-700" />
            </>
          ) : (
            <>
              <Stat icon={Gavel} label="Offers pending" value={freelancerMetrics.pending.length} />
              <Stat icon={BadgeCheck} label="Jobs won" value={freelancerMetrics.won.length} tone="bg-$info-50 text-$info-600" />
              <Stat
                icon={CalendarClock}
                label="Active jobs"
                value={freelancerMetrics.active.length}
                tone="bg-$deep-50 text-$deep-600"
              />
              <Stat icon={Wallet} label="Earned" value={formatPKR(freelancerMetrics.earned)} tone="bg-$success-50 text-$success-700" />
            </>
          )}
        </div>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {isClient ? (
              <ClientWorkspace tasks={postedTasks} busy={busy} />
            ) : (
              <FreelancerWorkspace tasks={assignedTasks} bids={myBids} busy={busy} />
            )}
          </div>

          <aside className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-elevated">
              <div className="absolute inset-0 noise opacity-50" />
              <div className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                  <Sparkles className="h-5 w-5 text-brand-light" />
                </span>
                <h2 className="mt-5 text-lg font-black">{isClient ? "Get better offers" : "Win more work"}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {isClient
                    ? "Tasks with a clear scope, budget and deadline receive around three times more quality offers."
                    : "A verified profile with real evidence ranks higher in every client's offer list."}
                </p>
                <Link
                  href={isClient ? "/post" : "/profile/interview"}
                  className="mt-5 inline-flex items-center gap-2 text-xs font-black text-brand-300"
                >
                  {isClient ? "Post a well-scoped task" : "Take the skills interview"} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <Link href="/wallet" className="surface group flex items-center gap-4 p-5 transition hover:border-brand-200">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-$warning-50 text-$warning-700">
                <Wallet className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink-400">Parwaz balance</p>
                <p className="mt-0.5 text-lg font-black text-ink">{formatPKR(profile?.wallet || 0)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand" />
            </Link>

            <Link href="/messages" className="surface group flex items-center gap-4 p-5 transition hover:border-brand-200">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink-400">Conversations</p>
                <p className="mt-0.5 text-sm font-black text-ink">Open your inbox</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand" />
            </Link>

            {!isClient && (
              <div className="surface p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand" />
                  <p className="text-sm font-black text-ink">Your service fee</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Parwaz takes {Math.round(PLATFORM_FEE * 100)}% of each completed job. You always see your exact take-home
                  before sending an offer.
                </p>
              </div>
            )}
          </aside>
        </div>

        {!isClient && recommended.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Recommended</p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">Fresh work you can bid on</h2>
              </div>
              <Link href="/tasks" className="flex items-center gap-1.5 text-xs font-black text-brand-dark">
                Browse all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recommended.slice(0, 3).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ClientWorkspace({ tasks, busy }: { tasks: Task[]; busy: boolean }) {
  const [filter, setFilter] = useState<"all" | "active" | "review" | "done">("all");

  const filtered = tasks.filter((task) => {
    if (filter === "active") return ACTIVE_STATUSES.includes(task.status);
    if (filter === "review") return task.status === "submitted" || task.status === "pending";
    if (filter === "done") return task.status === "completed";
    return true;
  });

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Client workspace</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">Your tasks</h2>
        </div>
        <div className="flex gap-1 rounded-xl bg-ink-50 p-1">
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["review", "Needs action"],
              ["done", "Completed"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                filter === value ? "bg-white text-ink shadow-sm" : "text-ink-400 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {busy ? (
        <div className="space-y-3 p-6">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={tasks.length === 0 ? "No tasks posted yet" : "Nothing in this view"}
          description={
            tasks.length === 0
              ? "Post your first task and Parwaz will route it to professionals who actually match."
              : "Try a different filter to see the rest of your tasks."
          }
          action={
            tasks.length === 0 ? (
              <Link href="/post">
                <Button>
                  <Plus className="h-4 w-4" /> Post a task
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {filtered.map((task) => (
            <li key={task.id}>
              <Link href={`/tasks/${task.id}`} className="group flex items-center gap-4 p-5 transition hover:bg-ink-50/70 sm:p-6">
                <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand sm:grid">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-ink transition group-hover:text-brand-dark">{task.title}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-ink-400">
                    {formatPKR(task.budget)} · {task.bidsCount || 0} offers · {timeAgo(task.createdAt)}
                  </p>
                  <p className="mt-1 truncate text-xs text-ink-400">{TASK_STATUS_META[task.status]?.hint}</p>
                </div>
                <StatusBadge status={task.status} />
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FreelancerWorkspace({ tasks, bids, busy }: { tasks: Task[]; bids: Bid[]; busy: boolean }) {
  const activeJobs = tasks.filter((task) => ACTIVE_STATUSES.includes(task.status));
  const openBids = bids.filter((bid) => bid.status === "pending");

  return (
    <>
      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">In progress</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">Jobs you were hired for</h2>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-dark">{activeJobs.length}</span>
        </div>

        {busy ? (
          <div className="space-y-3 p-6">
            {[1, 2].map((index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        ) : activeJobs.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No active jobs yet"
            description="Send strong, specific offers on open tasks. Clients respond fastest to offers that show relevant work."
            action={
              <Link href="/tasks">
                <Button>
                  <Compass className="h-4 w-4" /> Find work
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {activeJobs.map((task) => (
              <li key={task.id}>
                <Link href={`/tasks/${task.id}`} className="group flex items-center gap-4 p-5 transition hover:bg-ink-50/70 sm:p-6">
                  <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-$info-50 text-$info-600 sm:grid">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-ink transition group-hover:text-brand-dark">{task.title}</p>
                    <p className="mt-1 text-xs font-semibold text-ink-400">
                      {formatPKR(task.heldAmount || task.budget)} agreed · {TASK_STATUS_META[task.status]?.hint}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Your activity</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">Offers you sent</h2>
          </div>
          <Link href="/tasks" className="flex items-center gap-1.5 text-xs font-black text-brand-dark">
            Find more <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {bids.length === 0 ? (
          <EmptyState icon={Gavel} title="No offers yet" description="Your sent offers and their status will appear here." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {bids.slice(0, 10).map((bid) => (
              <li key={bid.id}>
                <Link href={`/tasks/${bid.taskId}`} className="flex items-center gap-4 p-5 transition hover:bg-ink-50/70 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-ink">{bid.taskTitle || "Task"}</p>
                    <p className="mt-1 truncate text-xs text-ink-400">{bid.message || "Offer submitted"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-ink">{formatPKR(bid.amount)}</p>
                    <p
                      className={`mt-1 text-[10px] font-black uppercase tracking-wider ${
                        bid.status === "selected"
                          ? "text-$success-600"
                          : bid.status === "rejected"
                            ? "text-$danger-500"
                            : bid.status === "withdrawn"
                              ? "text-ink-400"
                              : "text-brand"
                      }`}
                    >
                      {bid.status === "selected" ? "Hired" : bid.status}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {openBids.length > 0 && (
          <div className="flex items-center gap-2 border-t border-ink-100 bg-brand-50/60 px-6 py-3 text-xs font-bold text-brand-dark">
            <CheckCircle2 className="h-4 w-4" /> {openBids.length} offer{openBids.length === 1 ? "" : "s"} waiting for a
            client decision.
          </div>
        )}
      </section>
    </>
  );
}
