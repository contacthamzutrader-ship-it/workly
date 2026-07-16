"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Clock, Lock, CheckCircle2, ArrowRight, Eye, Users, Briefcase, TrendingUp, DollarSign, BarChart3, PieChart, UserPlus, Trash2, KeyRound, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listPendingTasks, listPrivateTasks, approveTask, PLATFORM_FEE } from "@/lib/tasks";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  listAdmins,
  addAdmin,
  removeAdmin,
  updateAdminPermissions,
  getAutoApprove,
  setAutoApprove,
  hasPermission,
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  ownerSession,
  type Permission,
} from "@/lib/admin";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminPage() {
  const { user, role, loading, adminSession } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<any[]>([]);
  const [privateTasks, setPrivateTasks] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  // Permissions
  const session = adminSession ?? (role === "super_admin" || role === "company_admin" ? ownerSession() : null);
  const can = (p: Permission) => hasPermission(session, p);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/admin"); if (!loading && user && !session) router.replace("/dashboard"); }, [loading, user, session, router]);

  const load = async () => {
    setBusy(true);
    try {
      if (can("approveTasks")) {
        setPending(await listPendingTasks());
        setPrivateTasks(await listPrivateTasks());
      }
      if (can("viewAnalytics")) {
        if (db) {
          const [userSnap, taskSnap] = await Promise.all([
            getDocs(query(collection(db, "users"), limit(500))),
            getDocs(query(collection(db, "tasks"), limit(500))),
          ]);
          setAllUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setAllTasks(taskSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      }
      if (can("manageUsers")) {
        if (db) {
          const snap = await getDocs(query(collection(db, "users"), limit(500)));
          setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      }
      if (can("manageAdmins")) setAdmins(await listAdmins());
    } catch {} finally { setBusy(false); }
  };

  useEffect(() => { if (session) load(); }, [session]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (!session) return null;

  const approve = async (taskId: string, visibility: "public" | "private") => { await approveTask(taskId, visibility); load(); };

  const totalUsers = allUsers.length;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const paidTasks = allTasks.filter((t) => t.paymentReleased).length;
  const totalRevenue = allTasks
    .filter((t) => t.heldAmount && t.paymentReleased)
    .reduce((sum, t) => sum + Math.round(t.heldAmount * PLATFORM_FEE), 0);
  const categoryBreakdown = allTasks.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Admin Panel</h1>
            <p className="text-sm text-ink-500">
              {session?.isOwner ? "Owner — full access" : "Role-based access"}
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink-50">
          <ArrowRight className="h-4 w-4 rotate-180" /> Dashboard
        </Link>
      </div>

      {/* Platform Overview Stats */}
      {can("viewAnalytics") && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: "Users", value: totalUsers, color: "bg-blue-50 text-blue-600" },
              { icon: Briefcase, label: "Total Tasks", value: totalTasks, color: "bg-purple-50 text-purple-600" },
              { icon: CheckCircle2, label: "Completed", value: completedTasks, color: "bg-green-50 text-green-600" },
              { icon: DollarSign, label: "Revenue", value: `$${totalRevenue}`, color: "bg-brand-50 text-brand-dark" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
                <div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <div><p className="text-xl font-extrabold text-ink">{s.value}</p><p className="text-xs text-ink-500">{s.label}</p></div></div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Clock, label: "Pending Approvals", value: pending.length, color: "bg-amber-50 text-amber-600" },
              { icon: Lock, label: "Private Tasks", value: privateTasks.length, color: "bg-purple-50 text-purple-600" },
              { icon: DollarSign, label: "Platform Fee", value: `${PLATFORM_FEE * 100}%`, color: "bg-brand-50 text-brand-dark" },
              { icon: BarChart3, label: "Paid Tasks", value: paidTasks, color: "bg-green-50 text-green-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
                <div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <div><p className="text-xl font-extrabold text-ink">{s.value}</p><p className="text-xs text-ink-500">{s.label}</p></div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {busy ? (
        <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Auto-approve global setting */}
          {can("manageContent") && <AutoApproveToggle onChanged={load} />}

          {/* Category Breakdown */}
          {can("viewAnalytics") && Object.keys(categoryBreakdown).length > 0 && (
            <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><PieChart className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-bold text-ink">Tasks by Category</h2><p className="text-sm text-ink-500">How tasks are distributed</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                    <p className="text-lg font-extrabold text-ink">{count}</p>
                    <p className="text-xs text-ink-500 truncate">{cat}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending */}
          {can("approveTasks") && (
            <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-bold text-ink">Pending Approval</h2><p className="text-sm text-ink-500">Review tasks before they go live</p></div>
              </div>
              <div className="space-y-3">
                {pending.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" /><p className="mt-2 text-sm text-ink-500">All caught up!</p>
                  </div>
                ) : pending.map((t) => (
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
          )}

          {/* Private Tasks */}
          {can("manageContent") && (
            <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600"><Lock className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-bold text-ink">Private Tasks</h2><p className="text-sm text-ink-500">Shareable by link only. Make public anytime.</p></div>
              </div>
              <div className="space-y-3">
                {privateTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center"><Lock className="mx-auto h-8 w-8 text-ink-300" /><p className="mt-2 text-sm text-ink-500">No private tasks</p></div>
                ) : privateTasks.map((t) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 p-5 transition hover:border-brand/30 hover:shadow-sm">
                    <div className="min-w-0 flex-1"><h3 className="font-bold text-ink">{t.title}</h3><div className="mt-1 flex items-center gap-4 text-sm text-ink-500"><span className="font-bold text-brand">${t.budget}</span><span>{t.bidsCount} bids</span></div></div>
                    <span className="ml-3 shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{t.status}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Manage Admins */}
          {can("manageAdmins") && (
            <ManageAdmins admins={admins} ownerEmail={user?.email || ""} onChanged={load} isOwner={!!session?.isOwner} />
          )}

          {/* All Users */}
          {can("manageUsers") && (
            <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-bold text-ink">All Users ({allUsers.length})</h2><p className="text-sm text-ink-500">Platform members & roles</p></div>
              </div>
              <div className="space-y-2">
                {allUsers.length === 0 ? <p className="text-sm text-ink-500 py-4">No users found.</p> : allUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">{(u.name || u.email || "U")[0].toUpperCase()}</div>
                      <div><p className="text-sm font-semibold text-ink">{u.name || u.email || "No name"}</p><p className="text-xs text-ink-400">{u.email}</p></div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === "company_admin" || u.role === "super_admin" ? "bg-brand-50 text-brand-dark" : u.role === "tasker" ? "bg-blue-50 text-blue-700" : "bg-ink-50 text-ink-600"}`}>{u.role || "customer"}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AutoApproveToggle({ onChanged }: { onChanged: () => void }) {
  const [val, setVal] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getAutoApprove().then(setVal); }, []);
  const toggle = async () => {
    setBusy(true);
    const next = !val;
    setVal(next);
    await setAutoApprove(next);
    setBusy(false);
    onChanged();
  };
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Settings className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-ink">Auto-approve new tasks</h2>
            <p className="text-sm text-ink-500">When ON, tasks go public instantly. When OFF, they wait in the approval queue.</p>
          </div>
        </div>
        <button onClick={toggle} disabled={busy} className={`relative h-7 w-12 shrink-0 rounded-full transition ${val ? "bg-brand" : "bg-ink-200"}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${val ? "left-6" : "left-1"}`} />
        </button>
      </div>
    </section>
  );
}

function ManageAdmins({ admins, ownerEmail, onChanged, isOwner }: { admins: any[]; ownerEmail: string; onChanged: () => void; isOwner: boolean }) {
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<Permission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (p: Permission) => setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!uid.trim() || !email.trim()) { setError("UID and email are required"); setBusy(false); return; }
      await addAdmin({ uid: uid.trim(), email: email.trim(), name: name.trim() || email.trim(), addedBy: ownerEmail, permissions: perms.length ? perms : [...ALL_PERMISSIONS] });
      setUid(""); setEmail(""); setName(""); setPerms([]);
      onChanged();
    } catch (err: any) { setError(err?.message || "Could not add admin"); } finally { setBusy(false); }
  };

  const changePerms = async (u: string, next: Permission[]) => { await updateAdminPermissions(u, next); onChanged(); };
  const remove = async (u: string) => { if (!confirm("Remove this admin?")) return; await removeAdmin(u); onChanged(); };

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><UserPlus className="h-5 w-5" /></div>
        <div><h2 className="text-lg font-bold text-ink">Manage Admins</h2><p className="text-sm text-ink-500">Add admins and control each one&apos;s permissions</p></div>
      </div>

      <form onSubmit={add} className="grid grid-cols-1 gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-4 sm:grid-cols-2">
        <Input placeholder="Admin UID" value={uid} onChange={(e) => setUid(e.target.value)} required />
        <Input placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-wrap gap-2 content-center">
          {ALL_PERMISSIONS.map((p) => (
            <button type="button" key={p} onClick={() => toggle(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${perms.includes(p) ? "bg-brand text-white" : "bg-white text-ink-500 border border-ink-200"}`}>
              {PERMISSION_LABELS[p]}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={busy} className="sm:col-span-2 rounded-xl">{busy ? "Adding..." : "Add Admin"}</Button>
      </form>

      <div className="mt-4 space-y-3">
        {admins.length === 0 ? <p className="text-sm text-ink-500">No additional admins yet.</p> : admins.map((a) => (
          <div key={a.uid} className="rounded-xl border border-ink-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark"><ShieldCheck className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-ink">{a.name || a.email}</p><p className="text-xs text-ink-400">{a.email}</p></div>
              </div>
              <button onClick={() => remove(a.uid)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map((p) => {
                const on = a.permissions?.includes(p);
                return (
                  <button type="button" key={p} onClick={() => changePerms(a.uid, on ? a.permissions.filter((x: Permission) => x !== p) : [...(a.permissions || []), p])}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-brand text-white" : "bg-ink-50 text-ink-400 border border-ink-200"}`}>
                    {PERMISSION_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
