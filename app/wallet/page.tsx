"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Banknote, Send, CheckCircle2, ShieldCheck, Landmark, PlusCircle, Building2, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listTasksByPoster } from "@/lib/tasks";
import { formatPKR } from "@/lib/format";

type TxLog = { id: string; amount: number; type: "deposit" | "withdraw" | "release" | "payment" | "hold"; note: string; createdAt: string; taskId?: string };

export default function WalletPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [pendingRelease, setPendingRelease] = useState<{ id: string; title: string; amount: number }[]>([]);
  const [txs, setTxs] = useState<TxLog[]>([]);
  const [busy, setBusy] = useState(true);

  // Withdrawal modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"raast" | "bank" | "easypaisa" | "jazzcash">("raast");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/wallet"); }, [loading, user, router]);

  const load = async () => {
    if (!user || !db) return;
    setBusy(true);
    try {
      const s = await getDoc(doc(db, "users", user.uid));
      const baseBalance = s.exists() ? (s.data().wallet ?? 0) : 0;

      const posted = await listTasksByPoster(user.uid);
      const held = posted.filter(t => t.heldAmount && !t.paymentReleased);
      const heldTotal = held.reduce((sum, t) => sum + (t.heldAmount || 0), 0);
      setHeldBalance(heldTotal);
      setPendingRelease(held.filter(t => t.paymentRequested).map(t => ({ id: t.id!, title: t.title, amount: t.heldAmount || 0 })));

      const qRef = query(collection(db, "wallet_txs"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(qRef);
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as TxLog));
      const releasedEarnings = logs.filter(item => item.type === "release").reduce((sum, item) => sum + item.amount, 0);
      const withdrawn = logs.filter(item => item.type === "withdraw").reduce((sum, item) => sum + item.amount, 0);
      const deposits = logs.filter(item => item.type === "deposit").reduce((sum, item) => sum + item.amount, 0);
      setBalance(Math.max(0, baseBalance + releasedEarnings + deposits - withdrawn));
      setTxs(logs);
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    } finally { setBusy(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWithdrawBusy(true);
    setWithdrawMsg(null);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount: Number(withdrawAmount),
          payoutMethod,
          accountTitle: accountTitle.trim(),
          accountNumber: accountNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not process withdrawal.");
      }
      setWithdrawMsg({ type: "success", text: "Payout request submitted successfully. Processing via financial switch." });
      setWithdrawAmount("");
      setAccountTitle("");
      setAccountNumber("");
      await load();
      setTimeout(() => setWithdrawOpen(false), 2000);
    } catch (err: any) {
      setWithdrawMsg({ type: "error", text: err.message || "Withdrawal failed." });
    } finally {
      setWithdrawBusy(false);
    }
  };

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-6xl">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-[#074b24] to-[#042813] p-6 text-white shadow-elevated sm:p-8 border border-white/10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand shadow-forest"><Wallet className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Protected wallet</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">Payments, holds and releases</h1>
              <p className="mt-1 text-sm text-white/70">Money is reserved when an offer is selected, then released after completion.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setWithdrawOpen(true)}
              disabled={balance < 500}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-50"
            >
              <Banknote className="h-4 w-4" /> Withdraw Funds
            </button>
            <Link href="/dashboard" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 text-sm font-bold text-white transition hover:bg-white/20">Back to dashboard <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>

      <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface border-l-4 border-l-brand p-5 sm:p-6 shadow-sm transition hover:shadow-card-hover">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink-500">Available Balance</p><Landmark className="h-5 w-5 text-brand" /></div>
          <p className="mt-1 text-3xl font-black tracking-tight text-ink">{formatPKR(balance)}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-ink-400">Funds ready to use or withdraw</p>
            {balance >= 500 && (
              <button onClick={() => setWithdrawOpen(true)} className="text-xs font-bold text-brand hover:underline">
                Withdraw &rarr;
              </button>
            )}
          </div>
        </div>
        <div className="surface border-l-4 border-l-forest bg-gradient-to-br from-brand-50 to-white p-5 sm:p-6 shadow-sm transition hover:shadow-card-hover">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-brand-dark">Held in escrow</p><ShieldCheck className="h-5 w-5 text-brand" /></div>
          <p className="mt-1 text-3xl font-black tracking-tight text-brand-dark">{formatPKR(heldBalance)}</p>
          <p className="mt-1 text-xs text-brand-600">Held for active tasks</p>
        </div>
        <div className="surface border-l-4 border-l-blue-500 p-5 sm:p-6 shadow-sm transition hover:shadow-card-hover">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink-500">Release requests</p><Send className="h-5 w-5 text-blue-600" /></div>
          <p className="mt-1 text-3xl font-black tracking-tight text-ink">{pendingRelease.length}</p>
          <p className="mt-1 text-xs text-ink-400">Waiting for your decision</p>
        </div>
      </div>

      {/* Withdrawal Drawer / Modal */}
      {withdrawOpen && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-ink">Request Payout to Bank / Raast / Mobile Wallet</h2>
            </div>
            <button onClick={() => setWithdrawOpen(false)} className="text-sm text-ink-400 hover:text-ink font-bold">
              Cancel
            </button>
          </div>

          {withdrawMsg && (
            <div className={`mb-4 rounded-xl p-3 text-sm font-semibold ${withdrawMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {withdrawMsg.text}
            </div>
          )}

          <form onSubmit={handleWithdrawalRequest} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Payout Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "raast", label: "Raast P2P", icon: Smartphone },
                  { id: "bank", label: "Bank Account", icon: Building2 },
                  { id: "easypaisa", label: "Easypaisa", icon: Smartphone },
                  { id: "jazzcash", label: "JazzCash", icon: Smartphone },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayoutMethod(m.id as any)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${payoutMethod === m.id ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-600 hover:border-ink-200"}`}
                  >
                    <m.icon className="h-4 w-4" /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Account Title / Beneficiary Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Raza"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Account Number / IBAN / Mobile No</label>
                <input
                  type="text"
                  required
                  placeholder={payoutMethod === "raast" ? "03xxxxxxxxx" : payoutMethod === "bank" ? "PKxx..." : "03xxxxxxxxx"}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Withdrawal Amount (Min PKR 500, Max PKR {balance.toLocaleString("en-PK")})</label>
              <input
                type="number"
                required
                min={500}
                max={balance}
                placeholder="5000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>

            <button
              type="submit"
              disabled={withdrawBusy || balance < 500}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-50"
            >
              {withdrawBusy ? "Submitting Payout..." : "Submit Withdrawal Request"}
            </button>
          </form>
        </div>
      )}

      {pendingRelease.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-card mb-6">
          <div className="flex items-center gap-2 mb-4"><Send className="h-5 w-5 text-blue-600" /><h2 className="text-sm font-bold text-ink">Pending Releases ({pendingRelease.length})</h2></div>
          <div className="space-y-2">
            {pendingRelease.map(p => (
              <Link key={p.id} href={`/tasks/${p.id}`} className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-4 transition hover:border-blue-400">
                <div><p className="text-sm font-semibold text-ink">{p.title}</p><p className="text-xs text-ink-400">Release {formatPKR(p.amount)} to tasker</p></div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{formatPKR(p.amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="text-sm font-black text-ink">Live payment onboarding required</h2><p className="mt-1 text-sm leading-6 text-ink-600">Demo balance creation has been removed. Before accepting customer money, AventriqTalent must complete merchant and marketplace/escrow approval with a State Bank of Pakistan-regulated provider. The production flow is checkout &rarr; verified webhook &rarr; held funds &rarr; completion approval &rarr; provider payout; balances must never be editable in the browser.</p></div></div>
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-black text-ink">Transaction history</h2>
        {busy ? <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></div> :
          txs.length === 0 ? <div className="py-8 text-center text-sm text-ink-500"><Clock className="mx-auto h-8 w-8 text-ink-300 mb-2" />No transactions yet</div> :
          <div className="space-y-2">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${tx.type === "deposit" ? "bg-brand-50 text-brand-600" : tx.type === "release" ? "bg-brand-50 text-brand" : tx.type === "payment" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                    {tx.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : tx.type === "release" ? <CheckCircle2 className="h-4 w-4" /> : tx.type === "payment" ? <Banknote className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div><p className="text-sm font-semibold text-ink">{tx.note}</p><p className="text-xs text-ink-400">{new Date(tx.createdAt).toLocaleDateString()}</p></div>
                </div>
                <span className={`text-sm font-bold ${tx.type === "deposit" || tx.type === "release" ? "text-brand-600" : tx.type === "payment" ? "text-blue-600" : "text-red-600"}`}>{tx.type === "deposit" || tx.type === "release" ? "+" : tx.type === "payment" ? "" : "-"}{formatPKR(tx.amount)}</span>
              </div>
            ))}
          </div>}
      </div>
      </div>
    </div>
  );
}
