"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Eye,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  Lock,
  LogOut,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  approvePrivateTask,
  approveTask,
  listPendingTasks,
  listPrivateTasks,
  PLATFORM_FEE,
  type Task,
} from "@/lib/tasks";
import {
  addAdmin,
  ALL_PERMISSIONS,
  findUserByEmail,
  getAutoApprove,
  hasPermission,
  listAdmins,
  ownerSession,
  PERMISSION_LABELS,
  removeAdmin,
  setAutoApprove,
  setUserPrivateStatus,
  setUserPublicRole,
  updateAdminPermissions,
  type Permission,
} from "@/lib/admin";
import { formatPKR } from "@/lib/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Tab = "overview" | "approvals" | "tasks" | "finance" | "users" | "admins" | "settings";
const COMPANY_ADMIN_DEFAULTS: Permission[] = ["approveTasks", "manageUsers", "manageContent", "viewAnalytics"];

export default function AdminPage() {
  const { user, role, loading, adminSession, signOut } = useAuth();
  const router = useRouter();
  const session = adminSession
    ?? (role === "super_admin" ? ownerSession() : null)
    ?? (role === "company_admin" ? { role: "company_admin" as const, isOwner: false, permissions: COMPANY_ADMIN_DEFAULTS } : null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pending, setPending] = useState<Task[]>([]);
  const [privateTasks, setPrivateTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState("");
  const [privatePick, setPrivatePick] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [privateInviteLink, setPrivateInviteLink] = useState("");

  const can = (permission: Permission) => hasPermission(session, permission);
  const sessionKey = `${user?.uid || ""}:${role || ""}:${adminSession?.permissions?.join(",") || "owner"}`;

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/admin");
    if (!loading && user && !session) router.replace("/dashboard");
  }, [loading, user, session, router]);

  const load = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const needsUsers = can("approveTasks") || can("manageUsers") || can("viewAnalytics");
      const needsTasks = can("viewAnalytics") || can("manageContent");
      const needsFinance = can("managePayments");
      const [pendingData, privateData, usersSnap, taskSnap, adminData, transactionSnap, disputeSnap] = await Promise.all([
        can("approveTasks") ? listPendingTasks() : Promise.resolve([]),
        can("approveTasks") || can("manageContent") ? listPrivateTasks() : Promise.resolve([]),
        needsUsers && db ? getDocs(query(collection(db, "users"), limit(500))) : Promise.resolve(null),
        needsTasks && db ? getDocs(query(collection(db, "tasks"), limit(500))) : Promise.resolve(null),
        can("manageAdmins") ? listAdmins() : Promise.resolve([]),
        needsFinance && db ? getDocs(query(collection(db, "wallet_txs"), limit(500))) : Promise.resolve(null),
        needsFinance && db ? getDocs(query(collection(db, "disputes"), limit(200))) : Promise.resolve(null),
      ]);
      setPending(pendingData);
      setPrivateTasks(privateData);
      if (usersSnap) setAllUsers(usersSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
      if (taskSnap) setAllTasks(taskSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Task)));
      setAdmins(adminData);
      if (transactionSnap) setTransactions(transactionSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
      if (disputeSnap) setDisputes(disputeSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (err: any) {
      setError(err?.message || "Some admin data could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [sessionKey]);

  useEffect(() => {
    if (!session || can("viewAnalytics")) return;
    if (can("approveTasks")) setActiveTab("approvals");
    else if (can("manageUsers")) setActiveTab("users");
    else if (can("manageAdmins")) setActiveTab("admins");
    else if (can("manageContent")) setActiveTab("settings");
  }, [sessionKey]);

  const privateProviders = allUsers.filter((member) => member.isPrivate === true && member.role === "tasker");
  const completedTasks = allTasks.filter((task) => task.status === "completed").length;
  const totalRevenue = allTasks
    .filter((task) => task.heldAmount && task.paymentReleased)
    .reduce((sum, task) => sum + Math.round((task.heldAmount || 0) * PLATFORM_FEE), 0);
  const completionRate = allTasks.length ? Math.round((completedTasks / allTasks.length) * 100) : 0;
  const categoryBreakdown = useMemo(() => allTasks.reduce((acc: Record<string, number>, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {}), [allTasks]);
  const maxCategory = Math.max(1, ...Object.values(categoryBreakdown));

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (!session) return null;

  const approvePublic = async (taskId: string) => {
    setActionBusy(taskId);
    setError("");
    try {
      await approveTask(taskId, "public", user.email || "Workly admin");
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not approve this task.");
    } finally {
      setActionBusy("");
    }
  };

  const approvePrivate = async (task: Task) => {
    const providerId = privatePick[task.id!];
    const provider = privateProviders.find((item) => item.id === providerId);
    if (!provider) {
      setError("Select an internal private provider before approving.");
      return;
    }
    setActionBusy(task.id!);
    setError("");
    try {
      await approvePrivateTask({
        taskId: task.id!,
        providerId: provider.id,
        providerName: provider.name || provider.email || "Workly managed provider",
        approvedBy: user.email || "Workly admin",
      });
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not create the managed assignment.");
    } finally {
      setActionBusy("");
    }
  };

  const createPrivateInvite = async (task: Task) => {
    setActionBusy(task.id!);
    setError("");
    try {
      const token = await approveTask(task.id!, "private", user.email || "Workly admin");
      if (!token) throw new Error("Private token could not be generated.");
      const link = `${window.location.origin}/tasks/${task.id}?invite=${token}`;
      setPrivateInviteLink(link);
      try { await navigator.clipboard.writeText(link); } catch {}
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not create the private freelancer link.");
    } finally {
      setActionBusy("");
    }
  };

  const togglePrivateProvider = async (member: any) => {
    setActionBusy(member.id);
    setError("");
    try {
      await setUserPrivateStatus(member.id, !member.isPrivate);
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not update this provider.");
    } finally {
      setActionBusy("");
    }
  };

  const changeUserRole = async (member: any, nextRole: "customer" | "tasker") => {
    setActionBusy(member.id);
    setError("");
    try {
      await setUserPublicRole(member.id, nextRole);
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not change this account role.");
    } finally {
      setActionBusy("");
    }
  };

  const tabs: { id: Tab; label: string; icon: any; show: boolean; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, show: can("viewAnalytics") },
    { id: "approvals", label: "Approval centre", icon: ShieldCheck, show: can("approveTasks"), count: pending.length },
    { id: "tasks", label: "All tasks", icon: ListChecks, show: can("viewAnalytics") || can("manageContent"), count: allTasks.length },
    { id: "finance", label: "Finance & disputes", icon: ReceiptText, show: can("managePayments"), count: disputes.filter((item) => item.status !== "resolved").length },
    { id: "users", label: "People", icon: Users, show: can("manageUsers") || can("approveTasks") },
    { id: "admins", label: "Admin team", icon: KeyRound, show: can("manageAdmins") },
    { id: "settings", label: "Controls", icon: Settings, show: can("manageContent") },
  ];

  return (
    <div className="min-h-screen bg-canvas py-8 sm:py-10">
      <div className="page-shell">
        <div className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><ShieldCheck className="h-7 w-7" /></span>
              <div>
                <div className="flex items-center gap-2"><h1 className="text-2xl font-black tracking-[-0.03em]">Workly Control</h1><span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-brand-300">{session.isOwner ? "Owner" : "Admin"}</span></div>
                <p className="mt-1 text-sm font-medium text-white/50">Approvals, people, revenue and platform health.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 sm:flex"><span className="h-2 w-2 rounded-full bg-brand-light" /> Systems operational</span>
              {session.isOwner ? <button onClick={async () => { await signOut(); router.replace("/login"); }} className="inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-white px-5 text-sm font-bold text-ink transition hover:bg-brand-100">Sign out <LogOut className="h-4 w-4" /></button> : <Link href="/dashboard" className="inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-white px-5 text-sm font-bold text-ink transition hover:bg-brand-100">Exit admin <ArrowRight className="h-4 w-4" /></Link>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-ink-100 bg-white p-2 shadow-card">
          {tabs.filter((tab) => tab.show).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition ${activeTab === tab.id ? "bg-ink text-white shadow-sm" : "text-ink-500 hover:bg-ink-50 hover:text-ink"}`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
              {typeof tab.count === "number" && tab.count > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${activeTab === tab.id ? "bg-brand text-white" : "bg-amber-100 text-amber-700"}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {error && <div role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        {privateInviteLink && <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4"><p className="text-sm font-black text-brand-dark">Private freelancer link created and copied</p><div className="mt-2 flex gap-2"><Input readOnly value={privateInviteLink} className="bg-white" /><button onClick={() => navigator.clipboard.writeText(privateInviteLink)} className="shrink-0 rounded-xl bg-ink px-4 text-xs font-extrabold text-white">Copy link</button></div><p className="mt-2 text-xs font-medium text-ink-500">The first signed-in freelancer who opens this exact link can view and bid. It will not appear in the public feed.</p></div>}

        {busy ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />)}</div>
        ) : (
          <>
            {activeTab === "overview" && can("viewAnalytics") && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { icon: Users, label: "People", value: allUsers.length, note: "registered accounts", tone: "bg-blue-50 text-blue-600" },
                    { icon: BriefcaseBusiness, label: "All tasks", value: allTasks.length, note: `${pending.length} awaiting review`, tone: "bg-purple-50 text-purple-600" },
                    { icon: CheckCircle2, label: "Completion", value: `${completionRate}%`, note: `${completedTasks} tasks delivered`, tone: "bg-brand-50 text-brand" },
                    { icon: CircleDollarSign, label: "Platform revenue", value: formatPKR(totalRevenue), note: `${PLATFORM_FEE * 100}% fee collected`, tone: "bg-amber-50 text-amber-700" },
                  ].map((stat) => (
                    <div key={stat.label} className="surface p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${stat.tone}`}><stat.icon className="h-5 w-5" /></span><TrendingUp className="h-4 w-4 text-ink-200" /></div>
                      <p className="mt-5 truncate text-2xl font-black tracking-[-0.035em] text-ink">{stat.value}</p>
                      <p className="mt-1 text-xs font-black text-ink-600">{stat.label}</p>
                      <p className="mt-1 text-[11px] font-semibold text-ink-400">{stat.note}</p>
                    </div>
                  ))}
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <section className="surface p-6">
                    <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Demand intelligence</p><h2 className="mt-1 text-xl font-black text-ink">Tasks by category</h2></div><BarChart3 className="h-5 w-5 text-brand" /></div>
                    {Object.keys(categoryBreakdown).length ? (
                      <div className="mt-7 space-y-4">
                        {Object.entries(categoryBreakdown).sort((a,b) => b[1] - a[1]).slice(0, 8).map(([category, count]) => (
                          <div key={category}>
                            <div className="mb-2 flex items-center justify-between text-xs font-bold"><span className="text-ink-600">{category}</span><span className="text-ink-400">{count}</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-ink-50"><div className="h-full rounded-full bg-brand" style={{ width: `${(count / maxCategory) * 100}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="mt-8 text-sm font-medium text-ink-400">Category trends will appear as tasks are posted.</p>}
                  </section>

                  <aside className="space-y-4">
                    <button onClick={() => setActiveTab("approvals")} className="w-full rounded-3xl bg-amber-50 p-6 text-left transition hover:bg-amber-100">
                      <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-amber-700"><Clock3 className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-amber-700" /></div>
                      <p className="mt-5 text-3xl font-black text-ink">{pending.length}</p><p className="mt-1 text-sm font-black text-ink">Tasks need a decision</p><p className="mt-1 text-xs leading-5 text-ink-500">Choose public marketplace or managed private fulfilment.</p>
                    </button>
                    <div className="rounded-3xl bg-brand p-6 text-white shadow-glow">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/70"><Activity className="h-4 w-4" /> Private network</div>
                      <p className="mt-4 text-3xl font-black">{privateProviders.length}</p><p className="mt-1 text-sm font-black">Managed providers ready</p><button onClick={() => setActiveTab("users")} className="mt-4 flex items-center gap-1.5 text-xs font-extrabold text-white/80">Manage network <ArrowRight className="h-3.5 w-3.5" /></button>
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {activeTab === "approvals" && can("approveTasks") && (
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="surface overflow-hidden">
                  <div className="flex items-center justify-between border-b border-ink-100 p-6">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600">Decision queue</p><h2 className="mt-1 text-xl font-black text-ink">Pending approval</h2></div>
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">{pending.length} waiting</span>
                  </div>
                  {pending.length === 0 ? (
                    <div className="px-6 py-20 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand"><CheckCircle2 className="h-6 w-6" /></span><h3 className="mt-4 text-lg font-black text-ink">Queue is clear</h3><p className="mt-1 text-sm text-ink-500">Every submitted task has a route.</p></div>
                  ) : (
                    <div className="divide-y divide-ink-100">
                      {pending.map((task) => {
                        const selectedProvider = privatePick[task.id!];
                        return (
                          <div key={task.id} className="p-5 sm:p-6">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-ink-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink-500">{task.category}</span><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-brand-dark">{formatPKR(task.budget)}</span>{task.moderation === "review" && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">AI flagged review</span>}</div>
                                <h3 className="mt-3 text-lg font-black text-ink">{task.title}</h3>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-500">{task.description}</p>
                                <p className="mt-3 text-xs font-bold text-ink-400">{task.location} - posted by {task.posterName}</p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <Button onClick={() => approvePublic(task.id!)} disabled={actionBusy === task.id} className="gap-2 shadow-none"><Eye className="h-4 w-4" /> Publish</Button>
                                <Button variant="secondary" onClick={() => createPrivateInvite(task)} disabled={actionBusy === task.id} className="gap-2"><Link2 className="h-4 w-4" /> Private link</Button>
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="flex flex-1 items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white"><Lock className="h-4 w-4" /></span><div><p className="text-xs font-black text-ink">Managed private route</p><p className="text-[11px] font-medium text-ink-400">Creates exactly one selected internal offer</p></div></div>
                                <select value={selectedProvider || ""} onChange={(e) => setPrivatePick(current => ({ ...current, [task.id!]: e.target.value }))} className="min-h-11 min-w-[210px] rounded-xl border border-ink-200 bg-white px-3 text-xs font-bold text-ink focus:border-brand focus:outline-none">
                                  <option value="">{privateProviders.length ? "Choose private provider" : "No private providers ready"}</option>
                                  {privateProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name || provider.email}</option>)}
                                </select>
                                <Button variant="secondary" onClick={() => approvePrivate(task)} disabled={!selectedProvider || actionBusy === task.id} className="gap-2"><Lock className="h-4 w-4" /> Assign privately</Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <aside className="space-y-4 lg:sticky lg:top-24">
                  <div className="rounded-3xl bg-ink p-6 text-white shadow-elevated"><Sparkles className="h-5 w-5 text-brand-light" /><h3 className="mt-4 text-lg font-black">Two clear routes</h3><div className="mt-5 space-y-4"><div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand"><Eye className="h-3.5 w-3.5" /></span><div><p className="text-xs font-black">Public</p><p className="mt-1 text-[11px] leading-4 text-white/50">Visible to everyone. Multiple professionals can offer.</p></div></div><div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10"><Lock className="h-3.5 w-3.5" /></span><div><p className="text-xs font-black">Private managed</p><p className="mt-1 text-[11px] leading-4 text-white/50">Hidden from browse. One internal provider auto-assigned.</p></div></div></div></div>
                  <div className="surface p-5"><p className="text-xs font-black text-ink">Private assignments</p><p className="mt-2 text-2xl font-black text-ink">{privateTasks.length}</p><p className="mt-1 text-[11px] font-medium text-ink-400">Total managed tasks</p></div>
                  {privateTasks.some((task) => task.status === "open" && task.shareToken) && <div className="surface p-5"><p className="text-xs font-black text-ink">Active private links</p><div className="mt-3 space-y-2">{privateTasks.filter((task) => task.status === "open" && task.shareToken).slice(0, 8).map((task) => <button key={task.id} onClick={() => { const link = `${window.location.origin}/tasks/${task.id}?invite=${task.shareToken}`; setPrivateInviteLink(link); navigator.clipboard.writeText(link).catch(() => {}); }} className="flex w-full items-center gap-2 rounded-xl bg-ink-50 p-3 text-left text-xs font-bold text-ink-600 hover:bg-brand-50"><Link2 className="h-3.5 w-3.5 shrink-0 text-brand" /><span className="min-w-0 flex-1 truncate">{task.title}</span><span className="text-brand-dark">Copy</span></button>)}</div></div>}
                </aside>
              </div>
            )}

            {activeTab === "tasks" && (can("viewAnalytics") || can("manageContent")) && (
              <section className="surface mt-6 overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-ink-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-dark">Marketplace inventory</p><h2 className="mt-1 text-xl font-black text-ink">Every platform task</h2></div>
                  <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-dark">{allTasks.length} total</span>
                </div>
                {allTasks.length === 0 ? <p className="p-8 text-sm text-ink-500">No tasks have been created yet.</p> : <div className="divide-y divide-ink-100">{allTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="grid gap-4 p-5 transition hover:bg-ink-50/70 sm:grid-cols-[minmax(0,1fr)_150px_130px_28px] sm:items-center sm:px-6">
                    <div className="min-w-0"><p className="truncate text-sm font-black text-ink">{task.title}</p><p className="mt-1 truncate text-xs font-medium text-ink-400">{task.posterName} · {task.category} · {task.location}</p></div>
                    <p className="text-sm font-black text-ink">{formatPKR(task.budget)}</p>
                    <div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-ink-50 px-2.5 py-1 text-[10px] font-black uppercase text-ink-500">{task.status.replace("_", " ")}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${task.visibility === "private" ? "bg-purple-50 text-purple-700" : "bg-brand-50 text-brand-dark"}`}>{task.visibility}</span></div>
                    <ArrowRight className="h-4 w-4 text-ink-300" />
                  </Link>
                ))}</div>}
              </section>
            )}

            {activeTab === "finance" && can("managePayments") && (
              <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <section className="surface overflow-hidden">
                  <div className="border-b border-ink-100 p-6"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-dark">Money movement</p><h2 className="mt-1 text-xl font-black text-ink">Wallet transactions</h2></div>
                  {transactions.length === 0 ? <p className="p-8 text-sm text-ink-500">No transactions recorded yet.</p> : <div className="divide-y divide-ink-100">{transactions.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-5 sm:px-6">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><CircleDollarSign className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-ink">{item.note || item.type || "Wallet transaction"}</p><p className="mt-1 truncate text-xs font-medium text-ink-400">User: {item.userId || "—"}{item.taskId ? ` · Task: ${item.taskId}` : ""}</p></div>
                      <div className="text-right"><p className="text-sm font-black text-ink">{formatPKR(Number(item.amount) || 0)}</p><p className="mt-1 text-[10px] font-black uppercase text-ink-400">{item.type || "entry"}</p></div>
                    </div>
                  ))}</div>}
                </section>
                <section className="surface overflow-hidden">
                  <div className="border-b border-ink-100 p-6"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-600">Resolution desk</p><h2 className="mt-1 text-xl font-black text-ink">Disputes</h2></div>
                  {disputes.length === 0 ? <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-brand" /><p className="mt-3 text-sm font-bold text-ink">No disputes</p><p className="mt-1 text-xs text-ink-400">The resolution queue is clear.</p></div> : <div className="divide-y divide-ink-100">{disputes.map((item) => (
                    <div key={item.id} className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-ink">{item.reason || item.title || "Task dispute"}</p><span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase text-red-700">{item.status || "open"}</span></div><p className="mt-2 text-xs leading-5 text-ink-500">{item.description || `Task ${item.taskId || "not specified"}`}</p></div>
                  ))}</div>}
                </section>
              </div>
            )}

            {activeTab === "users" && (can("manageUsers") || can("approveTasks")) && (
              <section className="surface mt-6 overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-ink-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">People & providers</p><h2 className="mt-1 text-xl font-black text-ink">Platform members</h2></div>
                  <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-extrabold text-brand-dark"><Lock className="h-3.5 w-3.5" /> {privateProviders.length} private providers</div>
                </div>
                <div className="divide-y divide-ink-100">
                  {allUsers.map((member) => (
                    <div key={member.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black ${member.isPrivate ? "bg-ink text-white" : "bg-brand-50 text-brand-dark"}`}>{(member.name || member.email || "U")[0].toUpperCase()}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-black text-ink">{member.name || "Unnamed member"}</p>{member.isPrivate && <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-black uppercase text-white">Private network</span>}</div><p className="mt-0.5 truncate text-xs font-medium text-ink-400">{member.email}</p></div></div>
                      <div className="flex items-center gap-2">
                        {member.role === "super_admin" ? <span className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-black uppercase text-white">Owner</span> : <select value={member.role === "tasker" ? "tasker" : "customer"} onChange={(event) => changeUserRole(member, event.target.value as "customer" | "tasker")} disabled={actionBusy === member.id} className="min-h-9 rounded-xl border border-ink-200 bg-white px-3 text-[11px] font-extrabold text-ink focus:border-brand focus:outline-none"><option value="customer">Client</option><option value="tasker">Freelancer</option></select>}
                        {member.role === "tasker" && <button onClick={() => togglePrivateProvider(member)} disabled={actionBusy === member.id} className={`min-h-9 rounded-xl border px-3 text-[11px] font-extrabold transition ${member.isPrivate ? "border-red-100 text-red-600 hover:bg-red-50" : "border-brand-200 text-brand-dark hover:bg-brand-50"}`}>{member.isPrivate ? "Remove private" : "Make private provider"}</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "admins" && can("manageAdmins") && (
              <ManageAdmins admins={admins} ownerEmail={user.email || ""} onChanged={load} />
            )}

            {activeTab === "settings" && can("manageContent") && (
              <AutoApproveControl onChanged={load} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AutoApproveControl({ onChanged }: { onChanged: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    getAutoApprove().then(setEnabled).finally(() => setBusy(false));
  }, []);

  const toggle = async () => {
    setBusy(true);
    const next = !enabled;
    try {
      await setAutoApprove(next);
      setEnabled(next);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand"><Zap className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-dark">Publishing policy</p><h2 className="mt-1 text-xl font-black text-ink">Smart auto-approval</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">When enabled, every new task passes Workly&apos;s AI quality and safety screen. High-confidence tasks go public instantly; uncertain or risky content still enters the manual queue.</p></div></div>
          <button type="button" onClick={toggle} disabled={busy} aria-pressed={enabled} className={`relative h-8 w-14 shrink-0 rounded-full transition ${enabled ? "bg-brand" : "bg-ink-200"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${enabled ? "left-7" : "left-1"}`} /></button>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            [Sparkles, "AI category check", "Keeps discovery organised"],
            [ShieldCheck, "Safety scan", "Flags risky content"],
            [Clock3, "Human fallback", "Uncertain tasks wait"],
          ].map(([Icon,title,body]: any) => <div key={title} className="rounded-2xl bg-ink-50 p-4"><Icon className="h-5 w-5 text-brand" /><p className="mt-3 text-xs font-black text-ink">{title}</p><p className="mt-1 text-[11px] font-medium text-ink-400">{body}</p></div>)}
        </div>
      </section>
      <aside className={`rounded-3xl p-6 text-white ${enabled ? "bg-brand shadow-glow" : "bg-ink shadow-elevated"}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60">Current mode</p><p className="mt-3 text-2xl font-black">{enabled ? "Smart automation" : "Manual control"}</p><p className="mt-2 text-sm leading-6 text-white/65">{enabled ? "Safe tasks can reach the marketplace without team delay." : "Every new task waits for an admin decision."}</p>
      </aside>
    </div>
  );
}

function ManageAdmins({ admins, ownerEmail, onChanged }: { admins: any[]; ownerEmail: string; onChanged: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const togglePermission = (permission: Permission) => {
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const found = await findUserByEmail(email.trim());
      if (!found) throw new Error("No account exists with this email. Ask them to sign up first.");
      await addAdmin({
        uid: found.uid,
        email: found.email,
        name: name.trim() || found.name || found.email,
        addedBy: ownerEmail,
        permissions: permissions.length ? permissions : [...ALL_PERMISSIONS],
      });
      setEmail("");
      setName("");
      setPermissions([]);
      onChanged();
    } catch (err: any) {
      setError(err?.message || "Could not add this admin.");
    } finally {
      setBusy(false);
    }
  };

  const changePermissions = async (uid: string, next: Permission[]) => {
    await updateAdminPermissions(uid, next);
    onChanged();
  };

  const remove = async (uid: string) => {
    if (!confirm("Remove this admin from Workly Control?")) return;
    await removeAdmin(uid);
    onChanged();
  };

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <form onSubmit={add} className="surface p-6 lg:sticky lg:top-24">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand"><UserPlus className="h-5 w-5" /></span><div><h2 className="font-black text-ink">Add an admin</h2><p className="text-xs font-medium text-ink-400">They must already have an account</p></div></div>
        <div className="mt-6 space-y-3"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email address" required /><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name (optional)" /></div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">Access permissions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_PERMISSIONS.map((permission) => <button type="button" key={permission} onClick={() => togglePermission(permission)} className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${permissions.includes(permission) ? "border-brand bg-brand text-white" : "border-ink-100 bg-white text-ink-500 hover:border-brand-200"}`}>{PERMISSION_LABELS[permission]}</button>)}
        </div>
        {error && <p className="mt-4 text-xs font-bold text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-5 w-full gap-2">{busy ? "Adding..." : "Add to admin team"} {!busy && <ArrowRight className="h-4 w-4" />}</Button>
      </form>

      <section className="surface overflow-hidden">
        <div className="border-b border-ink-100 p-6"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Role-based access</p><h2 className="mt-1 text-xl font-black text-ink">Admin team</h2></div>
        {admins.length === 0 ? <div className="p-10 text-center text-sm font-medium text-ink-400">No additional admins yet.</div> : <div className="divide-y divide-ink-100">
          {admins.map((admin) => (
            <div key={admin.uid} className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink text-white"><ShieldCheck className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-black text-ink">{admin.name || admin.email}</p><p className="mt-0.5 truncate text-xs font-medium text-ink-400">{admin.email}</p></div></div>
                <button onClick={() => remove(admin.uid)} className="grid h-9 w-9 place-items-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50" aria-label={`Remove ${admin.name || admin.email}`}><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map((permission) => {
                  const isOn = admin.permissions?.includes(permission);
                  return <button type="button" key={permission} onClick={() => changePermissions(admin.uid, isOn ? admin.permissions.filter((item: Permission) => item !== permission) : [...(admin.permissions || []), permission])} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${isOn ? "border-brand-200 bg-brand-50 text-brand-dark" : "border-ink-100 bg-white text-ink-400"}`}>{isOn && <Check className="h-3 w-3" />}{PERMISSION_LABELS[permission]}</button>;
                })}
              </div>
            </div>
          ))}
        </div>}
      </section>
    </div>
  );
}
