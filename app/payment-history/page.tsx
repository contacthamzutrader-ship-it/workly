"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock3, SearchX, TrendingUp, Undo2, Wallet, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listTasksAssignedTo, PLATFORM_FEE, type Task } from "@/lib/tasks";
import { formatPKR, formatDate } from "@/lib/format";

type PaymentStatus = "pending" | "completed" | "cancelled" | "refunded";

type PaymentRow = {
  id: string;
  taskId: string;
  title: string;
  client: string;
  date: any;
  gross: number;
  fee: number;
  net: number;
  status: PaymentStatus;
};

const STATUS_META: Record<PaymentStatus, { label: string; chip: string; icon: any }> = {
  pending: { label: "Pending", chip: "bg-amber-50 text-amber-600", icon: Clock3 },
  completed: { label: "Completed", chip: "bg-green-50 text-green-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", chip: "bg-red-50 text-red-600", icon: XCircle },
  refunded: { label: "Refunded", chip: "bg-blue-50 text-blue-600", icon: Undo2 },
};

type StatusFilter = "all" | PaymentStatus;
type SortMode = "newest" | "oldest" | "highest" | "lowest";

function timeValue(d: any) {
  if (!d) return 0;
  if (typeof d === "object" && "seconds" in d) return Number(d.seconds) * 1000;
  const ms = new Date(d).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export default function PaymentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/payment-history"); }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      setBusy(true);
      try {
        const [assigned, txSnap] = await Promise.all([
          listTasksAssignedTo(user.uid),
          getDocs(query(collection(db, "wallet_txs"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(200))),
        ]);
        const txIdByTask = new Map<string, string>();
        txSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.type === "release" && data.taskId) txIdByTask.set(data.taskId, d.id);
        });

        const result: PaymentRow[] = [];
        assigned.forEach((t: Task) => {
          if (!t.heldAmount) return;
          const gross = t.heldAmount;
          const fee = Math.round(gross * PLATFORM_FEE);
          let status: PaymentStatus;
          if (t.paymentReleased) status = "completed";
          else if (t.status === "cancelled") status = "cancelled";
          else status = "pending";
          const net = status === "cancelled" ? 0 : Math.max(0, gross - fee);
          const txId = txIdByTask.get(t.id || "");
          result.push({
            id: txId || `TASK-${t.id}`,
            taskId: t.id || "",
            title: t.title,
            client: t.posterName,
            date: t.paidAt ?? t.heldAt ?? t.approvedAt ?? t.createdAt,
            gross,
            fee,
            net,
            status,
          });
        });
        setRows(result.sort((a, b) => timeValue(b.date) - timeValue(a.date)));
      } catch {
        setRows([]);
      } finally {
        setBusy(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    let list = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
    const sorted = [...list];
    if (sortMode === "newest") sorted.sort((a, b) => timeValue(b.date) - timeValue(a.date));
    else if (sortMode === "oldest") sorted.sort((a, b) => timeValue(a.date) - timeValue(b.date));
    else if (sortMode === "highest") sorted.sort((a, b) => b.net - a.net);
    else sorted.sort((a, b) => a.net - b.net);
    return sorted;
  }, [rows, statusFilter, sortMode]);

  const summary = useMemo(() => {
    const completed = rows.filter((r) => r.status === "completed");
    const pending = rows.filter((r) => r.status === "pending");
    return {
      received: completed.reduce((s, r) => s + r.net, 0),
      fees: completed.reduce((s, r) => s + r.fee, 0),
      pending: pending.reduce((s, r) => s + r.net, 0),
    };
  }, [rows]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-6xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Wallet className="h-7 w-7" /></div>
              <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Freelancer ledger</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Payment History</h1><p className="mt-1 text-sm text-white/55">Every payment tied to your tasks, with platform fees and net amounts.</p></div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65"><Wallet className="h-4 w-4 text-brand-300" /> {rows.length} payment{rows.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="surface p-6">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink-500">Total received</p><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-ink">{formatPKR(summary.received)}</p>
            <p className="mt-1 text-xs text-ink-400">Net amount from completed payments</p>
          </div>
          <div className="surface bg-amber-50 p-6">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-amber-700">Platform deduction</p><Wallet className="h-5 w-5 text-amber-600" /></div>
            <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-amber-700">{formatPKR(summary.fees)}</p>
            <p className="mt-1 text-xs text-amber-600">{Math.round(PLATFORM_FEE * 100)}% commission on completed payments</p>
          </div>
          <div className="surface bg-blue-50 p-6">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-blue-700">Pending payout</p><Clock3 className="h-5 w-5 text-blue-600" /></div>
            <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-blue-700">{formatPKR(summary.pending)}</p>
            <p className="mt-1 text-xs text-blue-600">Held for active tasks, paid on completion</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink-400">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="min-h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink-400">Sort</span>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="min-h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </div>
          <span className="ml-auto text-xs font-semibold text-ink-400">{filtered.length} of {rows.length} payments</span>
        </div>

        {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
          filtered.length === 0 ? (
            <div className="surface py-16 text-center">
              <SearchX className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-4 text-lg font-black text-ink">{rows.length === 0 ? "No payments yet" : "Nothing matches this filter"}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-500">
                {rows.length === 0
                  ? "Money shows here once a client holds funds for one of your tasks and it is released on completion."
                  : "Try a different status or sort order to view other payments."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[1000px] rounded-2xl border border-ink-100 bg-white shadow-card">
                  <div className="grid grid-cols-[150px_minmax(220px,1.5fr)_130px_115px_105px_100px_125px_115px] gap-3 border-b border-ink-100 px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">
                    <span>Transaction ID</span><span>Task / Project</span><span>Client</span><span>Date</span><span>Amount</span><span>Deduction</span><span>Net received</span><span>Status</span>
                  </div>
                  <div className="divide-y divide-ink-100">
                    {filtered.map((r) => {
                      const meta = STATUS_META[r.status];
                      return (
                        <Link key={`${r.id}-${r.taskId}`} href={`/tasks/${r.taskId}`} className="grid grid-cols-[150px_minmax(220px,1.5fr)_130px_115px_105px_100px_125px_115px] items-center gap-3 px-5 py-4 text-sm transition hover:bg-brand-50/40">
                          <span className="truncate font-mono text-xs font-bold text-ink-300">{r.id}</span>
                          <span className="truncate font-bold text-ink">{r.title}</span>
                          <span className="truncate font-semibold text-ink-500">{r.client}</span>
                          <span className="truncate font-medium text-ink-500">{formatDate(r.date)}</span>
                          <span className="font-bold text-ink-600">{formatPKR(r.gross)}</span>
                          <span className="font-bold text-red-500">- {formatPKR(r.fee)}</span>
                          <span className="font-black text-ink">{formatPKR(r.net)}</span>
                          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${meta.chip}`}><meta.icon className="h-3.5 w-3.5" /> {meta.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {filtered.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <Link key={`${r.id}-${r.taskId}`} href={`/tasks/${r.taskId}`} className="block rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition hover:border-brand/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">{r.title}</p>
                          <p className="truncate font-mono text-[11px] font-bold text-ink-300">{r.id}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${meta.chip}`}><meta.icon className="h-3.5 w-3.5" /> {meta.label}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div><p className="font-semibold text-ink-400">Client</p><p className="mt-0.5 truncate font-bold text-ink">{r.client}</p></div>
                        <div><p className="font-semibold text-ink-400">Date</p><p className="mt-0.5 font-bold text-ink">{formatDate(r.date)}</p></div>
                        <div><p className="font-semibold text-ink-400">Amount</p><p className="mt-0.5 font-bold text-ink-600">{formatPKR(r.gross)}</p></div>
                        <div><p className="font-semibold text-ink-400">Platform deduction</p><p className="mt-0.5 font-bold text-red-500">- {formatPKR(r.fee)}</p></div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                        <p className="text-xs font-semibold text-ink-400">Net received</p>
                        <p className="text-base font-black text-ink">{formatPKR(r.net)}</p>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-brand">Open task <ArrowUpRight className="h-3.5 w-3.5" /></div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
      </div>
    </div>
  );
}