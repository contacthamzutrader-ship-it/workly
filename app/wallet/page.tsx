"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Clock, Banknote, Send, CheckCircle2, ShieldCheck, Landmark } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, increment, addDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listTasksByPoster } from "@/lib/tasks";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

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
      setBalance(baseBalance + releasedEarnings);
      setTxs(logs);
    } catch {} finally { setBusy(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const addFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !amount) return;
    setActionBusy(true);
    try {
      const val = Math.abs(Number(amount));
      await updateDoc(doc(db, "users", user.uid), { wallet: increment(val) });
      await addDoc(collection(db, "wallet_txs"), { userId: user.uid, amount: val, type: "deposit", note: note || "Added funds", createdAt: new Date().toISOString() });
      setAmount(""); setNote(""); load();
    } catch {} finally { setActionBusy(false); }
  };

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-6xl">
      <div className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Wallet className="h-7 w-7" /></div>
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Protected wallet</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Payments, holds and releases</h1><p className="mt-1 text-sm text-white/55">Money is reserved when an offer is selected, then released after completion.</p></div>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-brand-100">Back to dashboard <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface p-6">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink-500">Available Balance</p><Landmark className="h-5 w-5 text-brand" /></div>
          <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-ink">{formatPKR(balance)}</p>
          <p className="mt-1 text-xs text-ink-400">Funds ready to use</p>
        </div>
        <div className="surface bg-brand-50 p-6">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-brand-dark">Held in escrow</p><ShieldCheck className="h-5 w-5 text-brand" /></div>
          <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-brand-dark">{formatPKR(heldBalance)}</p>
          <p className="mt-1 text-xs text-brand-600">Held for active tasks</p>
        </div>
        <div className="surface p-6">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink-500">Release requests</p><Send className="h-5 w-5 text-blue-600" /></div>
          <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-ink">{pendingRelease.length}</p>
          <p className="mt-1 text-xs text-ink-400">Waiting for your decision</p>
        </div>
      </div>

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

      <div className="surface mb-6 p-6">
        <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Plus className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-ink">Add funds</h2><p className="text-xs text-ink-400">Use this demo wallet to test escrow holds and releases.</p></div></div>
        <form onSubmit={addFunds} className="flex flex-col gap-3 sm:flex-row">
          <Input type="number" min={500} step={100} placeholder="Amount (PKR)" value={amount} onChange={(e) => setAmount(e.target.value)} required className="sm:max-w-[220px]" />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={actionBusy} className="flex items-center gap-1.5 rounded-xl"><Plus className="h-4 w-4" />{actionBusy ? "Adding..." : "Add"}</Button>
        </form>
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-black text-ink">Transaction history</h2>
        {busy ? <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></div> :
          txs.length === 0 ? <div className="py-8 text-center text-sm text-ink-500"><Clock className="mx-auto h-8 w-8 text-ink-300 mb-2" />No transactions yet</div> :
          <div className="space-y-2">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${tx.type === "deposit" ? "bg-green-50 text-green-600" : tx.type === "release" ? "bg-brand-50 text-brand" : tx.type === "payment" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                    {tx.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : tx.type === "release" ? <CheckCircle2 className="h-4 w-4" /> : tx.type === "payment" ? <Banknote className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div><p className="text-sm font-semibold text-ink">{tx.note}</p><p className="text-xs text-ink-400">{new Date(tx.createdAt).toLocaleDateString()}</p></div>
                </div>
                <span className={`text-sm font-bold ${tx.type === "deposit" || tx.type === "release" ? "text-green-600" : tx.type === "payment" ? "text-blue-600" : "text-red-600"}`}>{tx.type === "deposit" || tx.type === "release" ? "+" : tx.type === "payment" ? "" : "-"}{formatPKR(tx.amount)}</span>
              </div>
            ))}
          </div>}
      </div>
      </div>
    </div>
  );
}
