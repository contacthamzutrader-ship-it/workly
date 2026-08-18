"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  Landmark,
  ReceiptText,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  PLATFORM_FEE,
  listTasksByPoster,
  listTasksForFreelancer,
  subscribeWalletTxs,
  subscribeTasksByPoster,
  subscribeTasksForFreelancer,
  type Task,
} from "@/lib/tasks";
import { formatDate, formatPKR } from "@/lib/format";
import Button from "@/components/ui/Button";
import { Alert, EmptyState, PageLoader, Skeleton } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";

type LedgerEntry = {
  id: string;
  amount: number;
  type: "deposit" | "withdraw" | "release" | "payment" | "hold" | "refund";
  note: string;
  createdAt: unknown;
  taskId?: string;
};

const ENTRY_STYLES: Record<LedgerEntry["type"], { tone: string; icon: typeof Banknote; sign: string }> = {
  deposit: { tone: "bg-emerald-50 text-emerald-600", icon: ArrowDownLeft, sign: "+" },
  release: { tone: "bg-brand-50 text-brand", icon: CheckCircle2, sign: "+" },
  refund: { tone: "bg-sky-50 text-sky-600", icon: ArrowDownLeft, sign: "+" },
  payment: { tone: "bg-indigo-50 text-indigo-600", icon: Banknote, sign: "" },
  hold: { tone: "bg-amber-50 text-amber-700", icon: Clock3, sign: "−" },
  withdraw: { tone: "bg-rose-50 text-rose-600", icon: ArrowUpRight, sign: "−" },
};

export default function WalletPage() {
  const { user, profile, role, loading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [held, setHeld] = useState(0);
  const [pendingApproval, setPendingApproval] = useState<Task[]>([]);
  const [earnedTotal, setEarnedTotal] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/wallet");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    const unsubs: (() => void)[] = [];
    let postedTasks: Task[] = [];
    let assignedTasks: Task[] = [];

    const recompute = () => {
      const activeHolds = postedTasks.filter((task) => task.heldAmount && !task.paymentReleased);
      setHeld(activeHolds.reduce((total, task) => total + (task.heldAmount || 0), 0));
      setPendingApproval(postedTasks.filter((task) => task.status === "submitted"));
      setEarnedTotal(
        assignedTasks
          .filter((task) => task.paymentReleased)
          .reduce((total, task) => total + Math.round((task.heldAmount || 0) * (1 - PLATFORM_FEE)), 0)
      );
      setBusy(false);
    };

    try {
      unsubs.push(
        subscribeTasksByPoster(user.uid, (tasks) => {
          postedTasks = tasks;
          recompute();
        })
      );
      unsubs.push(
        subscribeTasksForFreelancer(user.uid, (tasks) => {
          assignedTasks = tasks;
          recompute();
        })
      );
      unsubs.push(
        subscribeWalletTxs(
          user.uid,
          (ledger) => {
            setEntries(ledger as LedgerEntry[]);
            setBusy(false);
          },
          () => setBusy(false)
        )
      );
    } catch {
      (async () => {
        try {
          const [posted, assigned] = await Promise.all([
            listTasksByPoster(user.uid).catch(() => [] as Task[]),
            listTasksForFreelancer(user.uid).catch(() => [] as Task[]),
          ]);
          postedTasks = posted;
          assignedTasks = assigned;
          recompute();
        } finally {
          setBusy(false);
        }
      })();
    }

    return () => unsubs.forEach((fn) => fn());
  }, [user]);

  if (loading || !user) return <PageLoader />;

  const isFreelancer = role === "freelancer";

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
        <section className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand">
                <Wallet className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Payments</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                  {isFreelancer ? "Your earnings" : "Holds and releases"}
                </h1>
                <p className="mt-1 text-sm text-white/55">Every movement on your contracts, in one record.</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="bg-white text-ink shadow-none hover:bg-brand-100">
                Back to dashboard <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <div className="my-6 grid gap-4 sm:grid-cols-3">
          <div className="surface p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-ink-500">Available balance</p>
              <Landmark className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-2 text-4xl font-black tracking-[-0.04em] text-ink">{formatPKR(profile?.wallet || 0)}</p>
            <p className="mt-1.5 text-xs text-ink-400">Internal Workly balance for contract testing</p>
          </div>

          <div className="surface bg-brand-50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-brand-dark">{isFreelancer ? "Total recorded earnings" : "Held on contracts"}</p>
              <ShieldCheck className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-2 text-4xl font-black tracking-[-0.04em] text-brand-dark">
              {formatPKR(isFreelancer ? earnedTotal : held)}
            </p>
            <p className="mt-1.5 text-xs text-brand-700">
              {isFreelancer ? `Internal ledger after the ${Math.round(PLATFORM_FEE * 100)}% service fee` : "Internal contract hold record"}
            </p>
          </div>

          <div className="surface p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-ink-500">Awaiting your review</p>
              <Send className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-2 text-4xl font-black tracking-[-0.04em] text-ink">{pendingApproval.length}</p>
            <p className="mt-1.5 text-xs text-ink-400">Deliveries needing a decision</p>
          </div>
        </div>

        {pendingApproval.length > 0 && (
          <section className="mb-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              <h2 className="text-sm font-black text-ink">Deliveries waiting for you ({pendingApproval.length})</h2>
            </div>
            <ul className="space-y-2">
              {pendingApproval.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white p-4 transition hover:border-indigo-400"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink">{task.title}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        Review the delivery for {formatPKR(task.heldAmount || 0)} from {task.assignedName}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-black text-indigo-700">
                      {formatPKR(task.heldAmount || 0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Alert tone="warning" title="Live payment onboarding is still in progress" className="mb-6">
          These are internal contract records, not a bank balance or regulated escrow. Before Workly accepts real
          customer money, we must complete merchant and marketplace/held-funds approval with a State Bank of
          Pakistan-regulated provider. The production flow is checkout → verified webhook → held funds → approval →
          payout. Balances are never editable in the browser.
        </Alert>

        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Transaction history</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">Your internal ledger</h2>
            </div>
            <ReceiptText className="h-5 w-5 text-ink-300" />
          </div>

          {busy ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-16" />)}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState icon={Clock3} title="No transactions yet" description="Internal holds, releases and refunds appear here as your contracts progress." />
          ) : (
            <ul className="divide-y divide-ink-50">
              {entries.map((entry) => {
                const style = ENTRY_STYLES[entry.type] || ENTRY_STYLES.payment;
                return (
                  <li key={entry.id} className="flex items-center gap-4 p-4 sm:px-6">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.tone}`}>
                      <style.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-ink">{entry.note}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge>{entry.type}</Badge>
                        <span className="text-xs text-ink-400">{entry.createdAt ? formatDate(entry.createdAt) : ""}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-black ${style.sign === "+" ? "text-emerald-600" : style.sign === "−" ? "text-rose-600" : "text-ink"}`}>
                        {style.sign}{formatPKR(entry.amount)}
                      </p>
                      {entry.taskId && (
                        <Link href={`/tasks/${entry.taskId}`} className="text-[11px] font-black text-brand-dark">View task</Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
