"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Banknote,
  Send,
  CheckCircle2,
  ShieldCheck,
  Landmark,
  CreditCard,
  AlertCircle,
  X,
  Smartphone,
  Building,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listTasksByPoster } from "@/lib/tasks";
import { formatPKR } from "@/lib/format";

type TxLog = {
  id: string;
  amount: number;
  type: "deposit" | "withdraw" | "release" | "payment" | "hold";
  note: string;
  createdAt: string;
  taskId?: string;
  status?: "pending" | "completed" | "failed";
  payoutMethod?: string;
};

export default function WalletPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [pendingRelease, setPendingRelease] = useState<
    { id: string; title: string; amount: number }[]
  >([]);
  const [txs, setTxs] = useState<TxLog[]>([]);
  const [busy, setBusy] = useState(true);

  // Withdrawal modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"raast" | "bank" | "jazzcash" | "easypaisa">("raast");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/wallet");
  }, [loading, user, router]);

  const load = async () => {
    if (!user || !db) return;
    setBusy(true);
    try {
      const s = await getDoc(doc(db, "users", user.uid));
      const baseBalance = s.exists() ? s.data().wallet ?? 0 : 0;

      const posted = await listTasksByPoster(user.uid);
      const held = posted.filter((t) => t.heldAmount && !t.paymentReleased);
      const heldTotal = held.reduce((sum, t) => sum + (t.heldAmount || 0), 0);
      setHeldBalance(heldTotal);
      setPendingRelease(
        held
          .filter((t) => t.paymentRequested)
          .map((t) => ({ id: t.id!, title: t.title, amount: t.heldAmount || 0 }))
      );

      const qRef = query(
        collection(db, "wallet_txs"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(qRef);
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TxLog));
      const releasedEarnings = logs
        .filter((item) => item.type === "release")
        .reduce((sum, item) => sum + item.amount, 0);
      setBalance(baseBalance + releasedEarnings);
      setTxs(logs);
    } catch (e) {
      console.warn("Failed to load wallet data:", e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWithdrawMsg(null);
    const amountNum = Number(withdrawAmount);

    if (!amountNum || amountNum < 500) {
      setWithdrawMsg({ type: "error", text: "Minimum withdrawal amount is PKR 500." });
      return;
    }

    if (amountNum > balance) {
      setWithdrawMsg({ type: "error", text: `Requested amount exceeds available balance (${formatPKR(balance)}).` });
      return;
    }

    if (!accountTitle.trim() || !accountNumber.trim()) {
      setWithdrawMsg({ type: "error", text: "Please provide valid account title and number." });
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount: amountNum,
          payoutMethod,
          accountTitle: accountTitle.trim(),
          accountNumber: accountNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit withdrawal request.");
      }

      setWithdrawMsg({
        type: "success",
        text: `Withdrawal request for ${formatPKR(amountNum)} submitted successfully! Processed within 1 business day.`,
      });
      setWithdrawAmount("");
      setAccountNumber("");
      setAccountTitle("");
      setTimeout(() => {
        setWithdrawOpen(false);
        setWithdrawMsg(null);
      }, 2000);
      load();
    } catch (err: any) {
      setWithdrawMsg({ type: "error", text: err?.message || "Failed to process withdrawal." });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-6xl">
        {/* Header banner */}
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">
                  Protected Escrow Wallet
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                  Payments, Escrow & Withdrawals
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  Funds are secured via Safepay escrow when an offer is accepted, then released upon your review.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWithdrawOpen(true)}
                disabled={balance < 500}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="h-4 w-4" /> Withdraw Earnings
              </button>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-brand-100"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Balance cards */}
        <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="surface p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink-500">Available Balance</p>
              <Landmark className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-ink">
              {formatPKR(balance)}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-ink-400">Ready for withdrawal</p>
              {balance >= 500 && (
                <button
                  onClick={() => setWithdrawOpen(true)}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>

          <div className="surface bg-brand-50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-brand-dark">Held in Escrow</p>
              <ShieldCheck className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-brand-dark">
              {formatPKR(heldBalance)}
            </p>
            <p className="mt-2 text-xs text-brand-600">Reserved for active contracts</p>
          </div>

          <div className="surface p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink-500">Release Requests</p>
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-ink">
              {pendingRelease.length}
            </p>
            <p className="mt-2 text-xs text-ink-400">Deliverables awaiting approval</p>
          </div>
        </div>

        {/* Pending release contracts */}
        {pendingRelease.length > 0 && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold text-ink">
                Pending Releases ({pendingRelease.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingRelease.map((p) => (
                <Link
                  key={p.id}
                  href={`/tasks/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-4 transition hover:border-blue-400"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.title}</p>
                    <p className="text-xs text-ink-400">Review deliverables to release payment</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {formatPKR(p.amount)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SBP & Safepay Gateway Compliance Banner */}
        <div className="mb-6 rounded-3xl border border-brand-200 bg-brand-50/70 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <h2 className="text-sm font-black text-ink">
                Regulated Escrow & Safepay Gateway Protected
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                Workly operates with State Bank of Pakistan (SBP) regulated payment infrastructure powered by Safepay.
                Client funds are kept in protected escrow accounts until milestone deliverables are formally submitted and approved.
                Freelancers receive instant local payouts through Raast, Bank IBAN, or JazzCash / Easypaisa.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction ledger */}
        <div className="surface p-6">
          <h2 className="mb-4 text-sm font-black text-ink">Transaction History & Ledger</h2>
          {busy ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : txs.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-500">
              <Clock className="mx-auto mb-2 h-8 w-8 text-ink-300" />
              No transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {txs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5 transition hover:bg-canvas/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-xl ${
                        tx.type === "deposit"
                          ? "bg-green-50 text-green-600"
                          : tx.type === "release"
                          ? "bg-brand-50 text-brand"
                          : tx.type === "payment"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {tx.type === "deposit" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : tx.type === "release" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : tx.type === "payment" ? (
                        <Banknote className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink">{tx.note}</p>
                        {tx.status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              tx.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : tx.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-black ${
                      tx.type === "deposit" || tx.type === "release"
                        ? "text-green-600"
                        : tx.type === "payment"
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "deposit" || tx.type === "release" ? "+" : "-"}
                    {formatPKR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Freelancer Payout Withdrawal Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2 text-ink">
                <Landmark className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-bold">Request Payout Withdrawal</h3>
              </div>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="rounded-lg p-1 text-ink-400 hover:bg-ink-50 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {withdrawMsg && (
              <div
                className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
                  withdrawMsg.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {withdrawMsg.text}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">
                  Payout Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "raast", label: "Raast ID", icon: Smartphone },
                    { id: "bank", label: "Bank (IBAN)", icon: Building },
                    { id: "jazzcash", label: "JazzCash", icon: Smartphone },
                    { id: "easypaisa", label: "Easypaisa", icon: Smartphone },
                  ].map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setPayoutMethod(method.id as any)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                        payoutMethod === method.id
                          ? "border-brand bg-brand-50 text-brand-dark"
                          : "border-ink-200 text-ink-600 hover:bg-ink-50"
                      }`}
                    >
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">
                  Account Holder Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Raza"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 p-2.5 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">
                  {payoutMethod === "bank"
                    ? "IBAN (PK...)"
                    : payoutMethod === "raast"
                    ? "Raast ID / Registered Mobile"
                    : `${payoutMethod === "jazzcash" ? "JazzCash" : "Easypaisa"} Mobile Number`} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    payoutMethod === "bank"
                      ? "PK36MEZN0001234567890123"
                      : "03001234567"
                  }
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 p-2.5 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-ink-600">
                    Withdrawal Amount (PKR) *
                  </label>
                  <span className="text-xs text-ink-400">
                    Max: {formatPKR(balance)}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min={500}
                  max={balance}
                  step={100}
                  placeholder="Minimum 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 p-2.5 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={withdrawing || balance < 500}
                  className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {withdrawing ? "Submitting..." : "Confirm Withdrawal"}
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawOpen(false)}
                  className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
