"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
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
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  DEFAULT_SETTINGS,
  addAdmin,
  findUserByEmail,
  getPlatformSettings,
  listAdmins,
  listAudit,
  removeAdmin,
  resolveDispute,
  reviewInterviewDecision,
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
  MEMBER_ROLE_LABELS,
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
type FinanceRecord = Record<string, any> & { id: string };

const STAFF_ROLES: StaffRole[] = ["editor", "moderator", "admin"];

export default function AdminPage() {
  const { user, staff, loading, signOut, refreshStaff } = useAuth();
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
  const [transactions, setTransactions] = useState<FinanceRecord[]>([]);
  const [disputes, setDisputes] = useState<FinanceRecord[]>([]);
  const [interviews, setInterviews] = useState<InterviewWithId[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  const [rejectFor, setRejectFor] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [privatePick, setPrivatePick] = useState<Record<string, string>>({});
  const [inviteLink, setInviteLink] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const can = useCallback((permission: Permission) => hasPermission(staff, permission), [staff]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (!staff) router.replace("/dashboard");
  }, [loading, user, staff, router]);

  useEffect(() => {
    if (!staff || can("viewAnalytics")) return;
    if (can("approveTasks")) setTab("approvals");
    else if (can("manageUsers")) setTab("people");
    else if (can("managePayments")) setTab("finance");
    else if (can("manageAdmins")) setTab("staff");
    else setTab("settings");
  }, [staff, can]);

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
        can("manageAdmins") || can("manageUsers") || can("managePayments") ? listAudit(100) : Promise.resolve([]),
      ]);

      setPending(pendingData);
      setPrivateTasks(privateData);
      setAllTasks(taskSnapshot ? taskSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task) : []);
      setMembers(memberSnapshot ? memberSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) : []);
      setAdmins(adminData);
      setTransactions(transactionSnapshot ? transactionSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) : []);
      setDisputes(disputeSnapshot ? disputeSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) : []);
      setInterviews(
        interviewSnapshot
          ? interviewSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as InterviewWithId)
          : []
      );
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

  const run = async (key: string, work: () => Promise<void>, success: string) => {
    setAction(key);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(success);
      await load();
    } catch (caught) {
      setError((caught as Error)?.message || "That action could not be completed.");
    } finally {
      setAction("");
    }
  };

  const privateProviders = useMemo(
    () => members.filter((member) => member.isPrivate === true && normalizeRole(member.role) === "freelancer" && !member.suspended),
    [members]
  );
  const openDisputes = disputes.filter((item) => item.status !== "resolved");
  const pendingInterviews = interviews.filter((item) => item.status === "awaiting_review");
  const completed = allTasks.filter((task) => task.status === "completed");
  const volume = allTasks.filter((task) => task.paymentReleased).reduce((sum, task) => sum + (task.heldAmount || 0), 0);
  const revenue = Math.round(volume * PLATFORM_FEE);

  const tabs: TabDefinition[] = ([
    { id: "overview", label: "Overview", icon: LayoutDashboard, permission: "viewAnalytics" },
    { id: "approvals", label: "Approvals", icon: ShieldCheck, permission: "approveTasks", count: pending.length },
    { id: "tasks", label: "Tasks", icon: ListChecks, permission: "viewAnalytics", count: allTasks.length },
    { id: "interviews", label: "Interviews", icon: Bot, permission: "manageUsers", count: pendingInterviews.length },
    { id: "finance", label: "Finance", icon: ReceiptText, permission: "managePayments", count: openDisputes.length },
    { id: "people", label: "People", icon: Users, permission: "manageUsers" },
    { id: "staff", label: "Staff", icon: KeyRound, permission: "manageAdmins", count: admins.length },
    { id: "settings", label: "Platform", icon: Settings, permission: "manageContent" },
    { id: "audit", label: "Audit", icon: History, permission: "manageAdmins" },
  ] as TabDefinition[]).filter((item) => item.permission === null || can(item.permission));

  if (loading || !user) return <PageLoader label="Verifying your access" />;
  if (!staff) return null;

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

        {error && <Alert tone="error" className="mt-5">{error}</Alert>}
        {notice && <Alert tone="success" className="mt-5">{notice}</Alert>}
        {inviteLink && (
          <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-brand-dark">Private invitation link</p>
              <button type="button" onClick={() => setInviteLink("")} aria-label="Dismiss" className="text-brand-dark"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 flex gap-2">
              <Input readOnly value={inviteLink} className="bg-white" />
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(inviteLink)}>Copy</Button>
            </div>
          </div>
        )}

        {busy ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</div>
        ) : (
          <div className="mt-6 space-y-6">
            {tab === "overview" && can("viewAnalytics") && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard icon={Users} label="Members" value={String(members.length)} note="Known marketplace accounts" />
                  <StatCard icon={BriefcaseBusiness} label="Tasks" value={String(allTasks.length)} note={`${pending.length} awaiting review`} />
                  <StatCard icon={CheckCircle2} label="Completed" value={String(completed.length)} note={allTasks.length ? `${Math.round((completed.length / allTasks.length) * 100)}% completion` : "No task history yet"} />
                  <StatCard icon={CircleDollarSign} label="Internal volume" value={formatPKR(volume)} note={`${formatPKR(revenue)} recorded fee value`} />
                </div>
                <Alert tone="warning" title="Operational records, not regulated escrow">
                  Finance figures in this control centre are internal application records until an approved PSP marketplace flow is live.
                </Alert>
              </>
            )}

            {tab === "approvals" && can("approveTasks") && (
              <Panel title="Pending task approval" eyebrow="Server-authorized moderation" action={<Badge>{pending.length} waiting</Badge>}>
                {pending.length === 0 ? <EmptyState icon={CheckCircle2} title="Queue is clear" /> : (
                  <ul className="divide-y divide-ink-100">
                    {pending.map((task) => (
                      <li key={task.id} className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2"><Badge>{task.category}</Badge><Badge>{formatPKR(task.budget)}</Badge>{task.moderation === "review" && <Badge tone="bg-amber-50 text-amber-700 border-amber-200">Flagged</Badge>}</div>
                            <h3 className="mt-3 text-lg font-black text-ink">{task.title}</h3>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-500">{task.description}</p>
                            <p className="mt-2 text-xs text-ink-400">{task.posterName} · {timeAgo(task.createdAt)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" loading={action === `publish-${task.id}`} onClick={() => run(`publish-${task.id}`, () => approveTask(task.id!, "public").then(() => undefined), "Task published.")}><Eye className="h-4 w-4" /> Publish</Button>
                            <Button size="sm" variant="secondary" loading={action === `link-${task.id}`} onClick={() => run(`link-${task.id}`, async () => {
                              const token = await approveTask(task.id!, "private");
                              if (!token) throw new Error("Private invitation token was not created.");
                              const link = `${window.location.origin}/tasks/${task.id}?invite=${token}`;
                              setInviteLink(link);
                              await navigator.clipboard.writeText(link).catch(() => undefined);
                            }, "Private link created.")}><Link2 className="h-4 w-4" /> Private link</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setRejectFor(task.id!); setRejectReason(""); }}>Reject</Button>
                          </div>
                        </div>

                        {rejectFor === task.id && (
                          <form className="mt-4 space-y-3 rounded-2xl bg-rose-50 p-4" onSubmit={(event) => {
                            event.preventDefault();
                            run(`reject-${task.id}`, () => rejectTask(task.id!, rejectReason), "Task rejected.").then(() => setRejectFor(""));
                          }}>
                            <Textarea rows={2} required value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Explain exactly what must change." />
                            <div className="flex gap-2"><Button type="submit" size="sm" variant="danger">Confirm</Button><Button type="button" size="sm" variant="ghost" onClick={() => setRejectFor("")}>Cancel</Button></div>
                          </form>
                        )}

                        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:flex-row sm:items-center">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white"><Lock className="h-4 w-4" /></span>
                          <Select value={privatePick[task.id!] || ""} onChange={(event) => setPrivatePick((current) => ({ ...current, [task.id!]: event.target.value }))} className="sm:max-w-xs">
                            <option value="">Managed private provider</option>
                            {privateProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name || provider.email || provider.id}</option>)}
                          </Select>
                          <Button size="sm" variant="secondary" disabled={!privatePick[task.id!]} loading={action === `assign-${task.id}`} onClick={() => {
                            const provider = privateProviders.find((item) => item.id === privatePick[task.id!]);
                            if (!provider) return;
                            run(`assign-${task.id}`, () => approvePrivateTask({ taskId: task.id!, providerId: provider.id, providerName: provider.name || "Private provider", approvedBy: user.email || user.uid }), "Managed provider assigned.");
                          }}>Assign privately</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            {tab === "tasks" && can("viewAnalytics") && (
              <Panel title="Marketplace tasks" eyebrow="Read-only operations view">
                {allTasks.length === 0 ? <EmptyState icon={ListChecks} title="No tasks yet" /> : (
                  <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-ink-100 text-[10px] uppercase text-ink-400"><tr><th className="p-4">Task</th><th className="p-4">Client</th><th className="p-4">Budget</th><th className="p-4">Status</th><th className="p-4" /></tr></thead><tbody className="divide-y divide-ink-50">{allTasks.slice(0, 150).map((task) => <tr key={task.id}><td className="p-4"><p className="font-black text-ink">{task.title}</p><p className="text-xs text-ink-400">{task.category}</p></td><td className="p-4 text-xs font-bold">{task.posterName}</td><td className="p-4 font-black">{formatPKR(task.budget)}</td><td className="p-4"><StatusBadge status={task.status} /></td><td className="p-4 text-right"><Link href={`/tasks/${task.id}`} className="text-xs font-black text-brand-dark">Open</Link></td></tr>)}</tbody></table></div>
                )}
              </Panel>
            )}

            {tab === "interviews" && can("manageUsers") && (
              <Panel title="Interview review" eyebrow="Human decision, server audited" action={<Badge>{pendingInterviews.length} awaiting</Badge>}>
                {interviews.length === 0 ? <EmptyState icon={Bot} title="No interviews" /> : (
                  <ul className="divide-y divide-ink-100">{interviews.map((record) => <li key={record.id} className="flex flex-wrap items-start gap-4 p-5 sm:p-6"><Avatar name={record.profileSnapshot?.name || "Freelancer"} size="md" /><div className="min-w-0 flex-1"><p className="font-black text-ink">{record.profileSnapshot?.name || "Freelancer"}</p><p className="mt-1 text-xs text-ink-400">{record.profileSnapshot?.professionalTitle || "No professional title"} · attempt {record.attemptNumber}</p>{record.assessment?.summary && <p className="mt-2 text-sm leading-6 text-ink-600">{record.assessment.summary}</p>}<div className="mt-2"><Badge>{record.status.replaceAll("_", " ")}</Badge></div></div>{record.status === "awaiting_review" && <div className="flex gap-2"><Button size="sm" variant="success" loading={action === `verify-${record.id}`} onClick={() => run(`verify-${record.id}`, () => reviewInterviewDecision(record.userId, "verified"), "Interview badge approved.")}>Approve</Button><Button size="sm" variant="ghost" loading={action === `needs-${record.id}`} onClick={() => run(`needs-${record.id}`, () => reviewInterviewDecision(record.userId, "needs_improvement"), "More evidence requested.")}>Needs work</Button></div>}</li>)}</ul>
                )}
              </Panel>
            )}

            {tab === "finance" && can("managePayments") && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard icon={CircleDollarSign} label="Gross volume" value={formatPKR(volume)} note="Internal record" /><StatCard icon={ReceiptText} label="Ledger entries" value={String(transactions.length)} note="Server-authored" /><StatCard icon={Activity} label="Open disputes" value={String(openDisputes.length)} note="Needs human review" /><StatCard icon={CheckCircle2} label="Completed" value={String(completed.length)} note="Approved tasks" /></div>
                <Alert tone="warning" title="Live payments are not enabled">Internal ledger records are not regulated escrow. Real money requires approved PSP credentials, signed webhooks, KYC and reconciliation.</Alert>
                <Panel title="Disputes" eyebrow="Server-audited resolution">
                  {disputes.length === 0 ? <EmptyState icon={CheckCircle2} title="No disputes" /> : <ul className="divide-y divide-ink-100">{disputes.map((dispute) => <li key={dispute.id} className="flex flex-wrap items-start gap-4 p-5"><div className="min-w-0 flex-1"><div className="flex gap-2"><p className="font-black text-ink">{dispute.openedByName || "Member"}</p><Badge>{dispute.status}</Badge></div><p className="mt-2 text-sm leading-6 text-ink-600">{dispute.reason}</p><Link href={`/tasks/${dispute.taskId}`} className="mt-2 inline-block text-xs font-black text-brand-dark">Open task record</Link></div>{dispute.status !== "resolved" && <Button size="sm" variant="ghost" loading={action === `resolve-${dispute.id}`} onClick={() => run(`resolve-${dispute.id}`, () => resolveDispute(dispute.id, "Resolved after reviewing the on-platform contract record."), "Dispute resolved and task state restored.")}>Resolve</Button>}</li>)}</ul>}
                </Panel>
                <Panel title="Recent ledger" eyebrow="Read-only money trail">{transactions.length === 0 ? <EmptyState icon={ReceiptText} title="No ledger entries" /> : <ul className="divide-y divide-ink-50">{transactions.slice(0, 60).map((entry) => <li key={entry.id} className="flex items-center gap-3 p-4 px-6"><Badge>{entry.type}</Badge><p className="min-w-0 flex-1 truncate text-sm text-ink-600">{entry.note}</p><p className="font-black text-ink">{formatPKR(entry.amount || 0)}</p></li>)}</ul>}</Panel>
              </>
            )}

            {tab === "people" && can("manageUsers") && (
              <Panel title="Member accounts" eyebrow="Server-authorized account operations" action={<Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search name or email" className="max-w-xs" />}>
                <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-ink-100 text-[10px] uppercase text-ink-400"><tr><th className="p-4">Member</th><th className="p-4">Mode</th><th className="p-4">Status</th><th className="p-4">Network</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y divide-ink-50">{members.filter((member) => { const needle = memberSearch.trim().toLowerCase(); return !needle || String(member.name || "").toLowerCase().includes(needle) || String(member.email || "").toLowerCase().includes(needle); }).slice(0, 200).map((member) => { const memberRole = normalizeRole(member.role); return <tr key={member.id}><td className="p-4"><div className="flex items-center gap-3"><Avatar name={member.name || member.email} src={member.avatarUrl} size="sm" /><div><p className="font-black text-ink">{member.name || "Unnamed"}</p><p className="text-xs text-ink-400">{member.email}</p></div></div></td><td className="p-4"><Select value={memberRole} onChange={(event) => run(`role-${member.id}`, () => setUserRole(member.id, event.target.value as MemberRole), "Member mode updated.")}><option value="client">Client</option><option value="freelancer">Freelancer</option></Select></td><td className="p-4"><Badge>{member.suspended ? "Suspended" : member.verified ? "Verified" : "Active"}</Badge></td><td className="p-4"><Button size="sm" variant="ghost" loading={action === `private-${member.id}`} onClick={() => run(`private-${member.id}`, () => setUserPrivateStatus(member.id, !member.isPrivate), "Private provider status updated.")}>{member.isPrivate ? "Managed" : "Public"}</Button></td><td className="p-4"><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => run(`verify-user-${member.id}`, () => setUserVerified(member.id, !member.verified), "Verification updated.")}>{member.verified ? "Unverify" : "Verify"}</Button><Button size="sm" variant={member.suspended ? "success" : "danger"} onClick={() => run(`suspend-${member.id}`, () => setUserSuspended(member.id, !member.suspended, member.suspended ? "" : "Suspended by Workly operations"), "Account status updated.")}>{member.suspended ? "Restore" : "Suspend"}</Button></div></td></tr>; })}</tbody></table></div>
              </Panel>
            )}

            {tab === "staff" && can("manageAdmins") && <StaffPanel admins={admins} action={action} onRun={run} onRefreshStaff={refreshStaff} />}

            {tab === "settings" && can("manageContent") && (
              <SettingsPanel settings={settings} canManagePayments={can("managePayments")} action={action} onChange={setSettings} onSave={(changes) => run("save-settings", () => savePlatformSettings(changes), "Platform settings saved.")} />
            )}

            {tab === "audit" && can("manageAdmins") && (
              <Panel title="Audit log" eyebrow="Append-only accountability">
                {audit.length === 0 ? <EmptyState icon={History} title="No audit records" /> : <ul className="divide-y divide-ink-50">{audit.map((entry) => <li key={entry.id} className="p-4 px-6"><div className="flex flex-wrap gap-2"><Badge>{entry.action}</Badge><p className="text-sm font-black text-ink">{entry.target}</p></div><p className="mt-1 text-xs text-ink-400">{entry.actorEmail}{entry.detail ? ` · ${entry.detail}` : ""}</p></li>)}</ul>}
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) {
  return <div className="surface p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span><p className="mt-4 truncate text-2xl font-black text-ink">{value}</p><p className="mt-1 text-xs font-black text-ink-600">{label}</p><p className="mt-1 text-[11px] text-ink-400">{note}</p></div>;
}

function StaffPanel({ admins, action, onRun, onRefreshStaff }: { admins: AdminDoc[]; action: string; onRun: (key: string, work: () => Promise<void>, success: string) => Promise<void>; onRefreshStaff: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("editor");

  const invite = async () => {
    const found = await findUserByEmail(email);
    if (!found) throw new Error("This person must create a normal Workly account first.");
    await addAdmin({ uid: found.uid, email: found.email, name: found.name, addedBy: "server", staffRole: role, permissions: STAFF_ROLE_PERMISSIONS[role] });
    setEmail("");
    await onRefreshStaff();
  };

  return <div className="space-y-6"><Panel title="Invite staff" eyebrow="Existing Workly accounts only"><form className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_180px_auto]" onSubmit={(event) => { event.preventDefault(); onRun("invite-staff", invite, "Staff access granted."); }}><Field label="Account email"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@example.com" /></Field><Field label="Role"><Select value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>{STAFF_ROLES.map((item) => <option key={item} value={item}>{STAFF_ROLE_LABELS[item]}</option>)}</Select></Field><div className="self-end"><Button type="submit" loading={action === "invite-staff"}><UserPlus className="h-4 w-4" /> Grant access</Button></div></form></Panel><Panel title="Current staff" eyebrow="Granular permission records">{admins.length === 0 ? <EmptyState icon={KeyRound} title="No delegated staff" /> : <ul className="divide-y divide-ink-100">{admins.map((record) => <li key={record.uid} className="flex flex-wrap items-center gap-4 p-5"><div className="min-w-0 flex-1"><p className="font-black text-ink">{record.name || record.email}</p><p className="text-xs text-ink-400">{record.email} · {record.permissions.length} permissions</p></div><Select value={record.staffRole} onChange={(event) => onRun(`staff-role-${record.uid}`, () => updateAdmin(record.uid, { staffRole: event.target.value as StaffRole, permissions: STAFF_ROLE_PERMISSIONS[event.target.value as StaffRole] }), "Staff role updated.")}>{STAFF_ROLES.map((item) => <option key={item} value={item}>{STAFF_ROLE_LABELS[item]}</option>)}</Select><Button size="sm" variant={record.suspended ? "success" : "ghost"} onClick={() => onRun(`staff-suspend-${record.uid}`, () => updateAdmin(record.uid, { suspended: !record.suspended }), "Staff status updated.")}>{record.suspended ? "Restore" : "Suspend"}</Button><Button size="sm" variant="danger" onClick={() => onRun(`staff-remove-${record.uid}`, () => removeAdmin(record.uid), "Staff access removed.")}><Trash2 className="h-4 w-4" /> Remove</Button></li>)}</ul>}</Panel></div>;
}

function SettingsPanel({ settings, canManagePayments, action, onChange, onSave }: { settings: PlatformSettings; canManagePayments: boolean; action: string; onChange: (settings: PlatformSettings) => void; onSave: (changes: Partial<PlatformSettings>) => Promise<void> }) {
  const save = async () => {
    const changes: Partial<PlatformSettings> = {
      autoApprove: settings.autoApprove,
      maintenanceMode: settings.maintenanceMode,
      allowNewSignups: settings.allowNewSignups,
      requireInterviewToBid: settings.requireInterviewToBid,
    };
    if (canManagePayments) {
      changes.clientFeePercent = settings.clientFeePercent;
      changes.freelancerFeePercent = settings.freelancerFeePercent;
      changes.minTaskBudget = settings.minTaskBudget;
    }
    await onSave(changes);
  };

  return <Panel title="Platform settings" eyebrow="Permission-scoped configuration"><div className="grid gap-5 p-6 sm:grid-cols-2"><Toggle label="Auto approve low-risk tasks" checked={settings.autoApprove} onChange={(value) => onChange({ ...settings, autoApprove: value })} /><Toggle label="Allow new signups" checked={settings.allowNewSignups} onChange={(value) => onChange({ ...settings, allowNewSignups: value })} /><Toggle label="Maintenance mode" checked={settings.maintenanceMode} onChange={(value) => onChange({ ...settings, maintenanceMode: value })} /><Toggle label="Require interview before bidding" checked={settings.requireInterviewToBid} onChange={(value) => onChange({ ...settings, requireInterviewToBid: value })} />{canManagePayments && <><Field label="Client fee %"><Input type="number" min={0} max={30} value={settings.clientFeePercent} onChange={(event) => onChange({ ...settings, clientFeePercent: Number(event.target.value) })} /></Field><Field label="Freelancer fee %"><Input type="number" min={0} max={30} value={settings.freelancerFeePercent} onChange={(event) => onChange({ ...settings, freelancerFeePercent: Number(event.target.value) })} /></Field><Field label="Minimum task budget"><Input type="number" min={100} value={settings.minTaskBudget} onChange={(event) => onChange({ ...settings, minTaskBudget: Number(event.target.value) })} /></Field></>}<div className="sm:col-span-2"><Button loading={action === "save-settings"} onClick={save}>Save settings</Button></div></div></Panel>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4"><span className="text-sm font-black text-ink">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-ink-300 text-brand focus:ring-brand" /></label>;
}
