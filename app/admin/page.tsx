"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  History,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  Lock,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { collection, doc, getDocs, limit, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  DEFAULT_SETTINGS,
  addAdmin,
  findUserByEmail,
  getPlatformSettings,
  listAdmins,
  listAudit,
  recordAudit,
  removeAdmin,
  savePlatformSettings,
  setUserPrivateStatus,
  setUserRole,
  setUserSuspended,
  setUserVerified,
  updateAdmin,
  type AdminDoc,
  type AuditEntry,
  type PlatformSettings,
} from "@/lib/admin";
import {
  ALL_PERMISSIONS,
  PERMISSION_HINTS,
  PERMISSION_LABELS,
  STAFF_ROLE_BLURB,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_PERMISSIONS,
  hasPermission,
  normalizeRole,
  type MemberRole,
  type Permission,
  type StaffRole,
} from "@/lib/roles";
import {
  PLATFORM_FEE,
  approvePrivateTask,
  approveTask,
  listPendingTasks,
  listPrivateTasks,
  rejectTask,
  type Task,
} from "@/lib/tasks";
import { formatPKR, timeAgo } from "@/lib/format";
import type { InterviewRecord } from "@/lib/interview";
import Button from "@/components/ui/Button";
import Input, { Field, Select, Textarea } from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Alert, EmptyState, PageLoader, Skeleton } from "@/components/ui/Feedback";
import { AdminHeader, AdminTabs, Panel, type TabDefinition, type TabId } from "./components/AdminChrome";

type InterviewWithId = InterviewRecord & { id: string };
type MemberRecord = Record<string, any> & { id: string };

const ASSIGNABLE_STAFF_ROLES: StaffRole[] = ["editor", "moderator", "admin"];

export default function AdminPage() {
  const { user, staff, isOwner, loading, signOut, refreshStaff } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<TabId>("overview");
  const [busy, setBusy] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [pending, setPending] = useState<Task[]>([]);
  const [privateTasks, setPrivateTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<InterviewWithId[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  const [privatePick, setPrivatePick] = useState<Record<string, string>>({});
  const [rejectFor, setRejectFor] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const can = useCallback((permission: Permission) => hasPermission(staff, permission), [staff]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (!staff) router.replace("/dashboard");
  }, [loading, user, staff, router]);

  const load = useCallback(async () => {
    if (!staff) return;
    setBusy(true);
    setError("");
    try {
      const [
        pendingData,
        privateData,
        taskSnapshot,
        memberSnapshot,
        adminData,
        transactionSnapshot,
        disputeSnapshot,
        interviewSnapshot,
        settingsData,
        auditData,
      ] = await Promise.all([
        can("approveTasks") ? listPendingTasks() : Promise.resolve([]),
        can("approveTasks") || can("manageContent") ? listPrivateTasks() : Promise.resolve([]),
        db && (can("viewAnalytics") || can("manageContent"))
          ? getDocs(query(collection(db, "tasks"), limit(500)))
          : Promise.resolve(null),
        db && (can("manageUsers") || can("viewAnalytics") || can("approveTasks"))
          ? getDocs(query(collection(db, "users"), limit(500)))
          : Promise.resolve(null),
        can("manageAdmins") ? listAdmins() : Promise.resolve([]),
        db && can("managePayments") ? getDocs(query(collection(db, "wallet_txs"), limit(500))) : Promise.resolve(null),
        db && can("managePayments") ? getDocs(query(collection(db, "disputes"), limit(200))) : Promise.resolve(null),
        db && (can("manageUsers") || can("approveTasks"))
          ? getDocs(query(collection(db, "interviews"), limit(200)))
          : Promise.resolve(null),
        getPlatformSettings(),
        can("manageAdmins") || can("manageUsers") ? listAudit(60) : Promise.resolve([]),
      ]);

      setPending(pendingData);
      setPrivateTasks(privateData);
      if (taskSnapshot) setAllTasks(taskSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task));
      if (memberSnapshot) setMembers(memberSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setAdmins(adminData);
      if (transactionSnapshot) setTransactions(transactionSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      if (disputeSnapshot) setDisputes(disputeSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      if (interviewSnapshot)
        setInterviews(interviewSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as InterviewWithId));
      setSettings(settingsData);
      setAudit(auditData);
    } catch (caught) {
      setError((caught as Error)?.message || "Some control-centre data could not be loaded.");
    } finally {
      setBusy(false);
    }
  }, [staff, can]);

  useEffect(() => {
    if (staff) load();
  }, [staff, load]);

  // Land on the first tab this operator is actually allowed to see.
  useEffect(() => {
    if (!staff || can("viewAnalytics")) return;
    if (can("approveTasks")) setTab("approvals");
    else if (can("manageUsers")) setTab("people");
    else if (can("manageAdmins")) setTab("staff");
    else if (can("managePayments")) setTab("finance");
    else setTab("settings");
  }, [staff, can]);

  const privateProviders = useMemo(
    () => members.filter((member) => member.isPrivate === true),
    [members]
  );
  const pendingInterviews = interviews.filter((item) => item.status === "awaiting_review");
  const openDisputes = disputes.filter((item) => item.status !== "resolved");

  const analytics = useMemo(() => {
    const completed = allTasks.filter((task) => task.status === "completed");
    const revenue = allTasks
      .filter((task) => task.paymentReleased)
      .reduce((total, task) => total + Math.round((task.heldAmount || 0) * PLATFORM_FEE), 0);
    const volume = allTasks
      .filter((task) => task.paymentReleased)
      .reduce((total, task) => total + (task.heldAmount || 0), 0);
    const categories = allTasks.reduce<Record<string, number>>((accumulator, task) => {
      accumulator[task.category] = (accumulator[task.category] || 0) + 1;
      return accumulator;
    }, {});
    return {
      completed: completed.length,
      completionRate: allTasks.length ? Math.round((completed.length / allTasks.length) * 100) : 0,
      revenue,
      volume,
      categories,
      maxCategory: Math.max(1, ...Object.values(categories)),
      clients: members.filter((member) => normalizeRole(member.role) === "client").length,
      freelancers: members.filter((member) => normalizeRole(member.role) === "freelancer").length,
    };
  }, [allTasks, members]);

  if (loading || !user) return <PageLoader label="Verifying your access" />;
  if (!staff) return null;

  const run = async (key: string, work: () => Promise<void>, success?: string) => {
    setAction(key);
    setError("");
    setNotice("");
    try {
      await work();
      if (success) setNotice(success);
      await load();
    } catch (caught) {
      setError((caught as Error)?.message || "That action could not be completed.");
    } finally {
      setAction("");
    }
  };

  const audited = (entry: { action: string; target: string; detail?: string }) =>
    recordAudit({ actorId: user.uid, actorEmail: user.email || "", ...entry });

  const tabs: TabDefinition[] = (
    [
      { id: "overview", label: "Overview", icon: LayoutDashboard, permission: "viewAnalytics" },
      { id: "approvals", label: "Approvals", icon: ShieldCheck, permission: "approveTasks", count: pending.length },
      { id: "tasks", label: "All tasks", icon: ListChecks, permission: "viewAnalytics", count: allTasks.length },
      { id: "interviews", label: "Interviews", icon: Bot, permission: "manageUsers", count: pendingInterviews.length },
      { id: "finance", label: "Finance", icon: ReceiptText, permission: "managePayments", count: openDisputes.length },
      { id: "people", label: "People", icon: Users, permission: "manageUsers" },
      { id: "staff", label: "Staff & roles", icon: KeyRound, permission: "manageAdmins", count: admins.length },
      { id: "settings", label: "Platform", icon: Settings, permission: "manageContent" },
      { id: "audit", label: "Audit log", icon: History, permission: "manageAdmins" },
    ] as TabDefinition[]
  ).filter((item) => item.permission === null || can(item.permission));

  return (
    <div className="min-h-screen bg-canvas py-8 sm:py-10">
      <div className="page-shell">
        <AdminHeader
          session={staff}
          email={user.email || ""}
          onSignOut={async () => {
            await signOut();
            router.replace("/login");
          }}
        />
        <AdminTabs tabs={tabs} active={tab} onSelect={setTab} />

        {error && (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        )}
        {notice && (
          <Alert tone="success" className="mt-5">
            {notice}
          </Alert>
        )}
        {inviteLink && (
          <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-brand-dark">Private invitation link created and copied</p>
              <button onClick={() => setInviteLink("")} aria-label="Dismiss" className="text-brand-dark">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <Input readOnly value={inviteLink} className="bg-white" />
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                Copy
              </Button>
            </div>
            <p className="mt-2 text-xs font-medium text-ink-500">
              The first signed-in freelancer who opens this exact link can view and bid. It never appears in the public
              feed.
            </p>
          </div>
        )}

        {busy ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {/* ------------------------------------------------ Overview */}
            {tab === "overview" && can("viewAnalytics") && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    {
                      icon: Users,
                      label: "People",
                      value: members.length,
                      note: `${analytics.clients} clients · ${analytics.freelancers} freelancers`,
                      tone: "bg-$info-50 text-$info-600",
                    },
                    {
                      icon: BriefcaseBusiness,
                      label: "All tasks",
                      value: allTasks.length,
                      note: `${pending.length} awaiting review`,
                      tone: "bg-$deep-50 text-$deep-600",
                    },
                    {
                      icon: CheckCircle2,
                      label: "Completion rate",
                      value: `${analytics.completionRate}%`,
                      note: `${analytics.completed} tasks delivered`,
                      tone: "bg-brand-50 text-brand",
                    },
                    {
                      icon: CircleDollarSign,
                      label: "Platform revenue",
                      value: formatPKR(analytics.revenue),
                      note: `${Math.round(PLATFORM_FEE * 100)}% of ${formatPKR(analytics.volume)} volume`,
                      tone: "bg-$warning-50 text-$warning-700",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="surface p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`grid h-11 w-11 place-items-center rounded-xl ${stat.tone}`}>
                          <stat.icon className="h-5 w-5" />
                        </span>
                        <TrendingUp className="h-4 w-4 text-ink-200" />
                      </div>
                      <p className="mt-5 truncate text-2xl font-black tracking-[-0.035em] text-ink">{stat.value}</p>
                      <p className="mt-1 text-xs font-black text-ink-600">{stat.label}</p>
                      <p className="mt-1 text-[11px] font-semibold text-ink-400">{stat.note}</p>
                    </div>
                  ))}
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <Panel title="Tasks by category" eyebrow="Demand intelligence" action={<BarChart3 className="h-5 w-5 text-brand" />}>
                    <div className="p-6">
                      {Object.keys(analytics.categories).length ? (
                        <div className="space-y-4">
                          {Object.entries(analytics.categories)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 9)
                            .map(([category, count]) => (
                              <div key={category}>
                                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                  <span className="text-ink-600">{category}</span>
                                  <span className="text-ink-400">{count}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-ink-50">
                                  <div
                                    className="h-full rounded-full bg-brand transition-all"
                                    style={{ width: `${(count / analytics.maxCategory) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-ink-400">Category trends appear as tasks are posted.</p>
                      )}
                    </div>
                  </Panel>

                  <aside className="space-y-4">
                    {can("approveTasks") && (
                      <button
                        onClick={() => setTab("approvals")}
                        className="w-full rounded-3xl bg-$warning-50 p-6 text-left transition hover:bg-$warning-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-$warning-700">
                            <Clock3 className="h-5 w-5" />
                          </span>
                          <ArrowRight className="h-4 w-4 text-$warning-700" />
                        </div>
                        <p className="mt-5 text-3xl font-black text-ink">{pending.length}</p>
                        <p className="mt-1 text-sm font-black text-ink">Tasks need a decision</p>
                        <p className="mt-1 text-xs leading-5 text-ink-500">
                          Publish publicly, invite privately, or reject with a reason.
                        </p>
                      </button>
                    )}

                    <div className="rounded-3xl bg-brand p-6 text-white shadow-glow">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/70">
                        <Activity className="h-4 w-4" /> Private network
                      </div>
                      <p className="mt-4 text-3xl font-black">{privateProviders.length}</p>
                      <p className="mt-1 text-sm font-black">Managed providers ready</p>
                      {can("manageUsers") && (
                        <button
                          onClick={() => setTab("people")}
                          className="mt-4 flex items-center gap-1.5 text-xs font-black text-white/85"
                        >
                          Manage network <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {can("manageUsers") && pendingInterviews.length > 0 && (
                      <button
                        onClick={() => setTab("interviews")}
                        className="surface w-full p-5 text-left transition hover:border-brand-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-$info-50 text-$info-600">
                            <Bot className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-lg font-black text-ink">{pendingInterviews.length}</p>
                            <p className="text-xs font-bold text-ink-400">Interviews awaiting review</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </aside>
                </div>
              </div>
            )}

            {/* ------------------------------------------------ Approvals */}
            {tab === "approvals" && can("approveTasks") && (
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <Panel
                  title="Pending approval"
                  eyebrow="Decision queue"
                  action={
                    <span className="rounded-full bg-$warning-50 px-3 py-1.5 text-xs font-black text-$warning-700">
                      {pending.length} waiting
                    </span>
                  }
                >
                  {pending.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="Queue is clear" description="Every submitted task has a route." />
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {pending.map((task) => (
                        <li key={task.id} className="p-5 sm:p-6">
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge>{task.category}</Badge>
                                <Badge tone="bg-brand-50 text-brand-dark border-brand-200">{formatPKR(task.budget)}</Badge>
                                {task.moderation === "review" && (
                                  <Badge tone="bg-$warning-50 text-$warning-700 border-$warning-200">AI flagged</Badge>
                                )}
                              </div>
                              <h3 className="mt-3 text-lg font-black text-ink">{task.title}</h3>
                              <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-500">{task.description}</p>
                              <p className="mt-3 text-xs font-bold text-ink-400">
                                {task.location} · posted by {task.posterName} · {timeAgo(task.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button
                                size="sm"
                                loading={action === `publish-${task.id}`}
                                onClick={() =>
                                  run(
                                    `publish-${task.id}`,
                                    async () => {
                                      await approveTask(task.id!, "public", user.email || "Workly admin");
                                      await audited({ action: "task.publish", target: task.id!, detail: task.title });
                                    },
                                    "Task published to the public marketplace."
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" /> Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={action === `invite-${task.id}`}
                                onClick={() =>
                                  run(`invite-${task.id}`, async () => {
                                    const token = await approveTask(task.id!, "private", user.email || "Workly admin");
                                    if (!token) throw new Error("A private token could not be generated.");
                                    const link = `${window.location.origin}/tasks/${task.id}?invite=${token}`;
                                    setInviteLink(link);
                                    await navigator.clipboard.writeText(link).catch(() => undefined);
                                    await audited({ action: "task.private_link", target: task.id!, detail: task.title });
                                  })
                                }
                              >
                                <Link2 className="h-4 w-4" /> Private link
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectFor(rejectFor === task.id ? "" : task.id!);
                                  setRejectReason("");
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>

                          {rejectFor === task.id && (
                            <form
                              className="mt-4 space-y-3 rounded-2xl border border-$danger-200 bg-$danger-50 p-4"
                              onSubmit={(event) => {
                                event.preventDefault();
                                run(
                                  `reject-${task.id}`,
                                  async () => {
                                    await rejectTask(task.id!, rejectReason, user.email || "Workly admin");
                                    await audited({ action: "task.reject", target: task.id!, detail: rejectReason });
                                  },
                                  "Task rejected and the client has been told why."
                                ).then(() => setRejectFor(""));
                              }}
                            >
                              <Textarea
                                rows={2}
                                required
                                value={rejectReason}
                                onChange={(event) => setRejectReason(event.target.value)}
                                placeholder="Tell the client exactly what needs to change."
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" variant="danger" loading={action === `reject-${task.id}`}>
                                  Confirm rejection
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setRejectFor("")}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          )}

                          <div className="mt-5 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="flex flex-1 items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">
                                  <Lock className="h-4 w-4" />
                                </span>
                                <div>
                                  <p className="text-xs font-black text-ink">Managed private fulfilment</p>
                                  <p className="text-[11px] font-medium text-ink-400">
                                    Creates exactly one selected internal offer
                                  </p>
                                </div>
                              </div>
                              <Select
                                value={privatePick[task.id!] || ""}
                                onChange={(event) =>
                                  setPrivatePick((current) => ({ ...current, [task.id!]: event.target.value }))
                                }
                                className="min-h-11 py-2 text-xs sm:min-w-[210px]"
                              >
                                <option value="">
                                  {privateProviders.length ? "Choose provider" : "No private providers ready"}
                                </option>
                                {privateProviders.map((provider) => (
                                  <option key={provider.id} value={provider.id}>
                                    {provider.name || provider.email}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!privatePick[task.id!]}
                                loading={action === `assign-${task.id}`}
                                onClick={() => {
                                  const provider = privateProviders.find((item) => item.id === privatePick[task.id!]);
                                  if (!provider) return;
                                  run(
                                    `assign-${task.id}`,
                                    async () => {
                                      await approvePrivateTask({
                                        taskId: task.id!,
                                        providerId: provider.id,
                                        providerName: provider.name || provider.email || "Workly provider",
                                        approvedBy: user.email || "Workly admin",
                                      });
                                      await audited({
                                        action: "task.private_assign",
                                        target: task.id!,
                                        detail: provider.email || provider.id,
                                      });
                                    },
                                    "Task assigned to a managed provider."
                                  );
                                }}
                              >
                                Assign privately
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <aside className="space-y-4 lg:sticky lg:top-6">
                  <div className="rounded-3xl bg-ink p-6 text-white shadow-elevated">
                    <Sparkles className="h-5 w-5 text-brand-light" />
                    <h3 className="mt-4 text-lg font-black">Three routes</h3>
                    <div className="mt-5 space-y-4">
                      {[
                        [Eye, "Public", "Visible to everyone. Multiple freelancers can offer."],
                        [Lock, "Private managed", "Hidden from browse. One internal provider auto-assigned."],
                        [Link2, "Private invite", "One shareable link. First freelancer to open it can bid."],
                      ].map(([Icon, title, body]) => {
                        const Component = Icon as React.ComponentType<{ className?: string }>;
                        return (
                          <div key={String(title)} className="flex gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
                              <Component className="h-3.5 w-3.5 text-brand-light" />
                            </span>
                            <div>
                              <p className="text-xs font-black">{String(title)}</p>
                              <p className="mt-1 text-[11px] leading-4 text-white/50">{String(body)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="surface p-5">
                    <p className="text-xs font-black text-ink">Private assignments</p>
                    <p className="mt-2 text-2xl font-black text-ink">{privateTasks.length}</p>
                    <p className="mt-1 text-[11px] font-medium text-ink-400">Total managed tasks</p>
                  </div>

                  {privateTasks.some((task) => task.status === "open" && task.shareToken) && (
                    <div className="surface p-5">
                      <p className="text-xs font-black text-ink">Active private links</p>
                      <div className="mt-3 space-y-2">
                        {privateTasks
                          .filter((task) => task.status === "open" && task.shareToken)
                          .slice(0, 8)
                          .map((task) => (
                            <button
                              key={task.id}
                              onClick={() => {
                                const link = `${window.location.origin}/tasks/${task.id}?invite=${task.shareToken}`;
                                setInviteLink(link);
                                navigator.clipboard.writeText(link).catch(() => undefined);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl bg-ink-50 p-3 text-left text-xs font-bold text-ink-600 transition hover:bg-brand-50"
                            >
                              <Link2 className="h-3.5 w-3.5 shrink-0 text-brand" />
                              <span className="min-w-0 flex-1 truncate">{task.title}</span>
                              <span className="text-brand-dark">Copy</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            )}

            {/* ------------------------------------------------ All tasks */}
            {tab === "tasks" && can("viewAnalytics") && (
              <Panel title="Every task on the platform" eyebrow="Marketplace records">
                {allTasks.length === 0 ? (
                  <EmptyState icon={ListChecks} title="No tasks yet" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-ink-100 text-[10px] uppercase tracking-wider text-ink-400">
                        <tr>
                          <th className="p-4 font-black">Task</th>
                          <th className="p-4 font-black">Client</th>
                          <th className="p-4 font-black">Budget</th>
                          <th className="p-4 font-black">Offers</th>
                          <th className="p-4 font-black">Status</th>
                          <th className="p-4 font-black" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-50">
                        {allTasks
                          .slice()
                          .sort((a, b) => ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0))
                          .slice(0, 100)
                          .map((task) => (
                            <tr key={task.id} className="transition hover:bg-ink-50/60">
                              <td className="max-w-xs p-4">
                                <p className="truncate font-black text-ink">{task.title}</p>
                                <p className="mt-0.5 text-xs text-ink-400">
                                  {task.category} · {timeAgo(task.createdAt)}
                                </p>
                              </td>
                              <td className="p-4 text-xs font-bold text-ink-600">{task.posterName}</td>
                              <td className="p-4 text-xs font-black text-ink">{formatPKR(task.budget)}</td>
                              <td className="p-4 text-xs font-bold text-ink-500">{task.bidsCount || 0}</td>
                              <td className="p-4">
                                <StatusBadge status={task.status} />
                              </td>
                              <td className="p-4 text-right">
                                <Link href={`/tasks/${task.id}`} className="text-xs font-black text-brand-dark">
                                  Open
                                </Link>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            )}

            {/* ------------------------------------------------ Interviews */}
            {tab === "interviews" && can("manageUsers") && (
              <Panel
                title="Freelancer interview review"
                eyebrow="Human-in-the-loop vetting"
                action={
                  <span className="rounded-full bg-$info-50 px-3 py-1.5 text-xs font-black text-$info-700">
                    {pendingInterviews.length} awaiting
                  </span>
                }
              >
                {interviews.length === 0 ? (
                  <EmptyState icon={Bot} title="No interviews yet" description="Freelancer interview attempts will appear here." />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {interviews
                      .slice()
                      .sort((a, b) => (a.status === "awaiting_review" ? -1 : 1))
                      .map((record) => (
                        <li key={record.id} className="p-5 sm:p-6">
                          <div className="flex flex-wrap items-start gap-4">
                            <Avatar name={record.profileSnapshot?.name || "Freelancer"} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link href={`/u/${record.userId}`} className="text-sm font-black text-ink hover:text-brand">
                                  {record.profileSnapshot?.name || "Freelancer"}
                                </Link>
                                <Badge
                                  tone={
                                    record.status === "verified"
                                      ? "bg-$success-50 text-$success-700 border-$success-200"
                                      : record.status === "awaiting_review"
                                        ? "bg-$warning-50 text-$warning-700 border-$warning-200"
                                        : "bg-ink-50 text-ink-500 border-ink-200"
                                  }
                                >
                                  {record.status.replace("_", " ")}
                                </Badge>
                                {record.assessment?.score !== undefined && (
                                  <Badge tone="bg-brand-50 text-brand-dark border-brand-200">
                                    Score {record.assessment.score}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs font-semibold text-ink-400">
                                {record.profileSnapshot?.professionalTitle || "No title"} · attempt{" "}
                                {record.attemptNumber}
                              </p>
                              {record.assessment?.summary && (
                                <p className="mt-2 text-sm leading-6 text-ink-600">{record.assessment.summary}</p>
                              )}
                            </div>
                            {record.status === "awaiting_review" && (
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  loading={action === `verify-${record.id}`}
                                  onClick={() => run(`verify-${record.id}`, () => reviewInterview(record, "verified", user.email || user.uid), "Badge approved.")}
                                >
                                  Approve badge
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  loading={action === `reject-int-${record.id}`}
                                  onClick={() =>
                                    run(
                                      `reject-int-${record.id}`,
                                      () => reviewInterview(record, "needs_improvement", user.email || user.uid),
                                      "Freelancer asked to improve their evidence."
                                    )
                                  }
                                >
                                  Needs work
                                </Button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </Panel>
            )}

            {/* ------------------------------------------------ Finance */}
            {tab === "finance" && can("managePayments") && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Gross volume", value: formatPKR(analytics.volume), tone: "bg-$info-50 text-$info-600" },
                    { label: "Platform revenue", value: formatPKR(analytics.revenue), tone: "bg-$success-50 text-$success-600" },
                    { label: "Ledger entries", value: String(transactions.length), tone: "bg-$deep-50 text-$deep-600" },
                    { label: "Open disputes", value: String(openDisputes.length), tone: "bg-$danger-50 text-$danger-600" },
                  ].map((item) => (
                    <div key={item.label} className="surface p-5">
                      <span className={`inline-grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}>
                        <CircleDollarSign className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-xl font-black tracking-[-0.03em] text-ink">{item.value}</p>
                      <p className="mt-0.5 text-[11px] font-bold text-ink-400">{item.label}</p>
                    </div>
                  ))}
                </div>

                <Alert tone="warning" title="Live payments are not enabled">
                  These are internal contract records only. Before customer money moves, Workly needs an approved
                  marketplace/held-funds agreement with a State Bank of Pakistan-regulated provider, plus signed
                  server-side webhooks.
                </Alert>

                <Panel title="Disputes" eyebrow="Needs a human decision">
                  {disputes.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="No disputes" description="Nothing has been escalated." />
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {disputes.map((dispute) => (
                        <li key={dispute.id} className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-black text-ink">{dispute.openedByName || "Member"}</p>
                              <Badge
                                tone={
                                  dispute.status === "resolved"
                                    ? "bg-$success-50 text-$success-700 border-$success-200"
                                    : "bg-$danger-50 text-$danger-700 border-$danger-200"
                                }
                              >
                                {dispute.status}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-ink-600">{dispute.reason}</p>
                            <Link href={`/tasks/${dispute.taskId}`} className="mt-2 inline-block text-xs font-black text-brand-dark">
                              Open the task record
                            </Link>
                          </div>
                          {dispute.status !== "resolved" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={action === `dispute-${dispute.id}`}
                              onClick={() =>
                                run(
                                  `dispute-${dispute.id}`,
                                  async () => {
                                    if (!db) return;
                                    await runTransaction(db, async (transaction) => {
                                      transaction.update(doc(db!, "disputes", dispute.id), {
                                        status: "resolved",
                                        resolvedBy: user.email || user.uid,
                                        resolvedAt: serverTimestamp(),
                                      });
                                    });
                                    await audited({ action: "dispute.resolve", target: dispute.id });
                                  },
                                  "Dispute marked resolved."
                                )
                              }
                            >
                              Mark resolved
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel title="Recent ledger entries" eyebrow="Money trail">
                  {transactions.length === 0 ? (
                    <EmptyState icon={ReceiptText} title="No entries yet" />
                  ) : (
                    <ul className="divide-y divide-ink-50">
                      {transactions
                        .slice()
                        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
                        .slice(0, 40)
                        .map((entry) => (
                          <li key={entry.id} className="flex items-center gap-4 p-4 px-6">
                            <Badge
                              tone={
                                entry.type === "release"
                                  ? "bg-$success-50 text-$success-700 border-$success-200"
                                  : entry.type === "hold"
                                    ? "bg-$warning-50 text-$warning-700 border-$warning-200"
                                    : entry.type === "refund"
                                      ? "bg-$info-50 text-$info-700 border-$info-200"
                                      : "bg-ink-50 text-ink-600 border-ink-200"
                              }
                            >
                              {entry.type}
                            </Badge>
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-600">{entry.note}</p>
                            <p className="shrink-0 text-sm font-black text-ink">{formatPKR(entry.amount)}</p>
                          </li>
                        ))}
                    </ul>
                  )}
                </Panel>
              </div>
            )}

            {/* ------------------------------------------------ People */}
            {tab === "people" && can("manageUsers") && (
              <Panel
                title="Member accounts"
                eyebrow="People"
                action={
                  <Input
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search name or email"
                    className="min-h-10 max-w-xs py-2 text-sm"
                  />
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="border-b border-ink-100 text-[10px] uppercase tracking-wider text-ink-400">
                      <tr>
                        <th className="p-4 font-black">Member</th>
                        <th className="p-4 font-black">Mode</th>
                        <th className="p-4 font-black">Status</th>
                        <th className="p-4 font-black">Private provider</th>
                        <th className="p-4 font-black">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {members
                        .filter((member) => {
                          const needle = memberSearch.trim().toLowerCase();
                          if (!needle) return true;
                          return (
                            String(member.name || "").toLowerCase().includes(needle) ||
                            String(member.email || "").toLowerCase().includes(needle)
                          );
                        })
                        .slice(0, 150)
                        .map((member) => {
                          const memberRole = normalizeRole(member.role);
                          return (
                            <tr key={member.id} className="transition hover:bg-ink-50/60">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={member.name || member.email} src={member.avatarUrl} size="sm" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-ink">{member.name || "Unnamed"}</p>
                                    <p className="truncate text-xs text-ink-400">{member.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Select
                                  value={memberRole}
                                  onChange={(event) =>
                                    run(
                                      `role-${member.id}`,
                                      async () => {
                                        await setUserRole(member.id, event.target.value as MemberRole);
                                        await audited({
                                          action: "user.role",
                                          target: member.email || member.id,
                                          detail: event.target.value,
                                        });
                                      },
                                      "Account mode updated."
                                    )
                                  }
                                  className="min-h-9 py-1.5 text-xs"
                                >
                                  <option value="client">Client</option>
                                  <option value="freelancer">Freelancer</option>
                                </Select>
                              </td>
                              <td className="p-4">
                                {member.suspended ? (
                                  <Badge tone="bg-$danger-50 text-$danger-700 border-$danger-200">Suspended</Badge>
                                ) : member.verified ? (
                                  <Badge tone="bg-$success-50 text-$success-700 border-$success-200">Verified</Badge>
                                ) : (
                                  <Badge>Active</Badge>
                                )}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() =>
                                    run(
                                      `private-${member.id}`,
                                      async () => {
                                        await setUserPrivateStatus(member.id, !member.isPrivate);
                                        await audited({
                                          action: "user.private_provider",
                                          target: member.email || member.id,
                                          detail: String(!member.isPrivate),
                                        });
                                      },
                                      "Private provider status updated."
                                    )
                                  }
                                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
                                    member.isPrivate
                                      ? "bg-ink text-white"
                                      : "border border-ink-200 text-ink-400 hover:border-ink-300"
                                  }`}
                                >
                                  {member.isPrivate ? "Managed" : "Public"}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    onClick={() =>
                                      run(
                                        `verify-${member.id}`,
                                        async () => {
                                          await setUserVerified(member.id, !member.verified);
                                          await audited({
                                            action: "user.verify",
                                            target: member.email || member.id,
                                            detail: String(!member.verified),
                                          });
                                        },
                                        "Verification updated."
                                      )
                                    }
                                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11px] font-black text-ink-500 transition hover:border-$success-300 hover:text-$success-700"
                                  >
                                    {member.verified ? "Unverify" : "Verify"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      run(
                                        `suspend-${member.id}`,
                                        async () => {
                                          await setUserSuspended(
                                            member.id,
                                            !member.suspended,
                                            "Suspended by Workly staff"
                                          );
                                          await audited({
                                            action: "user.suspend",
                                            target: member.email || member.id,
                                            detail: String(!member.suspended),
                                          });
                                        },
                                        "Account status updated."
                                      )
                                    }
                                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11px] font-black text-ink-500 transition hover:border-$danger-300 hover:text-$danger-700"
                                  >
                                    {member.suspended ? "Restore" : "Suspend"}
                                  </button>
                                  <Link
                                    href={`/u/${member.id}`}
                                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11px] font-black text-ink-500 transition hover:border-brand-300 hover:text-brand-dark"
                                  >
                                    Profile
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {/* ------------------------------------------------ Staff */}
            {tab === "staff" && can("manageAdmins") && (
              <StaffTab
                admins={admins}
                ownerEmail={user.email || ""}
                isOwner={isOwner}
                action={action}
                onInvite={async (email, name, uid, staffRole) => {
                  await addAdmin({ uid, email, name, addedBy: user.email || user.uid, staffRole });
                  await audited({ action: "staff.add", target: email, detail: staffRole });
                  await refreshStaff();
                }}
                onUpdate={async (record, changes) => {
                  await updateAdmin(record.uid, changes);
                  await audited({
                    action: "staff.update",
                    target: record.email,
                    detail: JSON.stringify(changes),
                  });
                  await refreshStaff();
                }}
                onRemove={async (record) => {
                  await removeAdmin(record.uid);
                  await audited({ action: "staff.remove", target: record.email });
                  await refreshStaff();
                }}
                run={run}
              />
            )}

            {/* ------------------------------------------------ Platform settings */}
            {tab === "settings" && can("manageContent") && (
              <SettingsTab
                settings={settings}
                action={action}
                onSave={(changes, label) =>
                  run(
                    "settings",
                    async () => {
                      await savePlatformSettings(changes);
                      await audited({ action: "settings.update", target: "platform", detail: label });
                    },
                    "Platform settings saved."
                  )
                }
              />
            )}

            {/* ------------------------------------------------ Audit */}
            {tab === "audit" && can("manageAdmins") && (
              <Panel title="Privileged action log" eyebrow="Accountability">
                {audit.length === 0 ? (
                  <EmptyState icon={History} title="No entries yet" description="Staff actions are recorded here." />
                ) : (
                  <ul className="divide-y divide-ink-50">
                    {audit.map((entry) => (
                      <li key={entry.id} className="flex flex-wrap items-center gap-3 p-4 px-6">
                        <Badge tone="bg-ink-50 text-ink-600 border-ink-200">{entry.action}</Badge>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-600">
                          <span className="font-black text-ink">{entry.actorEmail}</span> → {entry.target}
                          {entry.detail && <span className="text-ink-400"> · {entry.detail}</span>}
                        </p>
                        <span className="shrink-0 text-xs font-bold text-ink-400">{timeAgo(entry.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

async function reviewInterview(record: InterviewWithId, decision: "verified" | "needs_improvement", reviewer: string) {
  if (!db) throw new Error("Firebase is not connected.");
  await runTransaction(db, async (transaction) => {
    const interviewRef = doc(db!, "interviews", record.id);
    const userRef = doc(db!, "users", record.userId);
    const latest = await transaction.get(interviewRef);
    if (!latest.exists() || latest.data().status !== "awaiting_review") {
      throw new Error("This interview was already reviewed.");
    }
    transaction.update(interviewRef, {
      status: decision,
      reviewedBy: reviewer,
      reviewedAt: serverTimestamp(),
      reviewNote:
        decision === "verified"
          ? "Evidence reviewed and badge approved."
          : "More concrete role evidence is needed before approval.",
    });
    transaction.update(userRef, {
      interviewStatus: decision,
      interviewUpdatedAt: serverTimestamp(),
      ...(decision === "verified" ? { interviewVerifiedAt: serverTimestamp() } : {}),
    });
  });
}

// ---------------------------------------------------------------------------

function StaffTab({
  admins,
  ownerEmail,
  isOwner,
  action,
  onInvite,
  onUpdate,
  onRemove,
  run,
}: {
  admins: AdminDoc[];
  ownerEmail: string;
  isOwner: boolean;
  action: string;
  onInvite: (email: string, name: string, uid: string, staffRole: StaffRole) => Promise<void>;
  onUpdate: (record: AdminDoc, changes: { staffRole?: StaffRole; permissions?: Permission[]; suspended?: boolean }) => Promise<void>;
  onRemove: (record: AdminDoc) => Promise<void>;
  run: (key: string, work: () => Promise<void>, success?: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("moderator");
  const [lookupError, setLookupError] = useState("");
  const [expanded, setExpanded] = useState("");

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setLookupError("");
    const found = await findUserByEmail(email);
    if (!found) {
      setLookupError("No Workly member uses that email. Ask them to create an account first, then invite them.");
      return;
    }
    await run(
      "invite-staff",
      () => onInvite(found.email, found.name, found.uid, staffRole),
      `${found.name || found.email} now has ${STAFF_ROLE_LABELS[staffRole].toLowerCase()} access.`
    );
    setEmail("");
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="Staff team" eyebrow="Who can control Workly">
        <div className="border-b border-ink-100 bg-brand-50/50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar name="Owner" size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-ink">{ownerEmail}</p>
                <Badge tone="bg-ink text-white border-ink">Owner</Badge>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-ink-500">
                Permanent full control. This account cannot be edited or removed from the interface.
              </p>
            </div>
          </div>
        </div>

        {admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff added yet"
            description="Invite trusted people as editors, moderators or admins. Every grant is logged."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {admins.map((record) => (
              <li key={record.uid} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar name={record.name || record.email} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-ink">{record.name || record.email}</p>
                      <Badge tone="bg-brand-50 text-brand-dark border-brand-200">
                        {STAFF_ROLE_LABELS[record.staffRole]}
                      </Badge>
                      {record.suspended && <Badge tone="bg-$danger-50 text-$danger-700 border-$danger-200">Suspended</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-400">{record.email}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {record.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="rounded-lg bg-ink-50 px-2 py-1 text-[10px] font-black text-ink-500"
                        >
                          {PERMISSION_LABELS[permission]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === record.uid ? "" : record.uid)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={action === `remove-${record.uid}`}
                      onClick={() => run(`remove-${record.uid}`, () => onRemove(record), "Staff access revoked.")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {expanded === record.uid && (
                  <div className="mt-5 space-y-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
                    <Field label="Staff role">
                      <Select
                        value={record.staffRole}
                        onChange={(event) =>
                          run(
                            `staffrole-${record.uid}`,
                            () => onUpdate(record, { staffRole: event.target.value as StaffRole }),
                            "Staff role updated."
                          )
                        }
                        className="min-h-10 py-2 text-sm"
                      >
                        {ASSIGNABLE_STAFF_ROLES.map((option) => (
                          <option key={option} value={option}>
                            {STAFF_ROLE_LABELS[option]} — {STAFF_ROLE_BLURB[option]}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Fine-tune permissions">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ALL_PERMISSIONS.map((permission) => {
                          const enabled = record.permissions.includes(permission);
                          return (
                            <label
                              key={permission}
                              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                                enabled ? "border-brand bg-white" : "border-ink-100 bg-white/60"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() =>
                                  run(`perm-${record.uid}-${permission}`, () =>
                                    onUpdate(record, {
                                      permissions: enabled
                                        ? record.permissions.filter((item) => item !== permission)
                                        : [...record.permissions, permission],
                                    })
                                  )
                                }
                                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
                              />
                              <span>
                                <span className="block text-xs font-black text-ink">{PERMISSION_LABELS[permission]}</span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-ink-400">
                                  {PERMISSION_HINTS[permission]}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </Field>

                    <Button
                      size="sm"
                      variant="ghost"
                      loading={action === `suspend-staff-${record.uid}`}
                      onClick={() =>
                        run(
                          `suspend-staff-${record.uid}`,
                          () => onUpdate(record, { suspended: !record.suspended }),
                          record.suspended ? "Staff access restored." : "Staff access paused."
                        )
                      }
                    >
                      {record.suspended ? "Restore access" : "Pause access"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <div className="surface p-6">
          <h3 className="flex items-center gap-2 text-lg font-black text-ink">
            <UserPlus className="h-5 w-5 text-brand" /> Invite staff
          </h3>
          <p className="mt-1.5 text-xs leading-5 text-ink-500">
            The person must already have a Workly account. Access takes effect on their next page load.
          </p>
          <form onSubmit={invite} className="mt-4 space-y-3">
            <Field label="Their Workly email" required>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                required
              />
            </Field>
            <Field label="Role">
              <Select value={staffRole} onChange={(event) => setStaffRole(event.target.value as StaffRole)}>
                {ASSIGNABLE_STAFF_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {STAFF_ROLE_LABELS[option]}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="rounded-xl bg-ink-50 p-3 text-[11px] leading-4 text-ink-500">
              {STAFF_ROLE_BLURB[staffRole]}
            </p>
            {lookupError && <Alert tone="error">{lookupError}</Alert>}
            <Button type="submit" loading={action === "invite-staff"} fullWidth>
              Grant {STAFF_ROLE_LABELS[staffRole].toLowerCase()} access
            </Button>
          </form>
        </div>

        <div className="rounded-3xl bg-ink p-6 text-white">
          <ShieldCheck className="h-5 w-5 text-brand-light" />
          <h3 className="mt-4 text-base font-black">Role guide</h3>
          <div className="mt-4 space-y-3">
            {ASSIGNABLE_STAFF_ROLES.map((option) => (
              <div key={option}>
                <p className="text-xs font-black text-brand-300">{STAFF_ROLE_LABELS[option]}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/50">{STAFF_ROLE_BLURB[option]}</p>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs font-black text-brand-300">Owner</p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/50">
                {isOwner ? "That is you. " : ""}Permanent, single account, full control of everything including staff.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SettingsTab({
  settings,
  action,
  onSave,
}: {
  settings: PlatformSettings;
  action: string;
  onSave: (changes: Partial<PlatformSettings>, label: string) => void;
}) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  const toggles: { key: keyof PlatformSettings; title: string; body: string }[] = [
    {
      key: "autoApprove",
      title: "Smart auto-approval",
      body: "Let Workly AI publish clean, complete tasks instantly. Anything uncertain still goes to the queue.",
    },
    {
      key: "allowNewSignups",
      title: "Allow new signups",
      body: "Turn off to temporarily close public registration.",
    },
    {
      key: "requireInterviewToBid",
      title: "Require verified interview to bid",
      body: "Only freelancers with an approved skills badge can send offers.",
    },
    {
      key: "maintenanceMode",
      title: "Maintenance mode",
      body: "Show a maintenance notice on the marketplace while you work on it.",
    },
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Panel title="Marketplace controls" eyebrow="Platform">
        <ul className="divide-y divide-ink-100">
          {toggles.map((item) => {
            const enabled = Boolean(draft[item.key]);
            return (
              <li key={String(item.key)} className="flex items-start gap-4 p-5 sm:p-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-ink">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-500">{item.body}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.title}
                  onClick={() => {
                    setDraft((current) => ({ ...current, [item.key]: !enabled }));
                    onSave({ [item.key]: !enabled } as Partial<PlatformSettings>, `${String(item.key)}=${!enabled}`);
                  }}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-brand" : "bg-ink-200"}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      enabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Commercial settings" eyebrow="Fees & limits">
        <form
          className="space-y-5 p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(
              {
                freelancerFeePercent: Number(draft.freelancerFeePercent) || 0,
                clientFeePercent: Number(draft.clientFeePercent) || 0,
                minTaskBudget: Number(draft.minTaskBudget) || 500,
              },
              "fees"
            );
          }}
        >
          <Field label="Freelancer service fee (%)" hint="Disclosed before an offer is sent">
            <Input
              type="number"
              min={0}
              max={40}
              value={draft.freelancerFeePercent}
              onChange={(event) => setDraft({ ...draft, freelancerFeePercent: Number(event.target.value) })}
            />
          </Field>
          <Field label="Client service fee (%)" hint="Shown separately at checkout">
            <Input
              type="number"
              min={0}
              max={30}
              value={draft.clientFeePercent}
              onChange={(event) => setDraft({ ...draft, clientFeePercent: Number(event.target.value) })}
            />
          </Field>
          <Field label="Minimum task budget (PKR)">
            <Input
              type="number"
              min={100}
              step={100}
              value={draft.minTaskBudget}
              onChange={(event) => setDraft({ ...draft, minTaskBudget: Number(event.target.value) })}
            />
          </Field>
          <Alert tone="warning">
            Changing fees affects new contracts only. Existing contracts keep the rate fixed at hire time.
          </Alert>
          <Button type="submit" loading={action === "settings"}>
            Save commercial settings
          </Button>
        </form>
      </Panel>
    </div>
  );
}
