"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Minus, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, increment, addDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type TxLog = { id: string; amount: number; type: "deposit" | "withdraw" | "release"; note: string; createdAt: string };

export default function WalletPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<TxLog[]>([]);
  const [busy, setBusy] = useState(true);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);

  const load = async () => {
    if (!user || !db) return;
    setBusy(true);
    try {
      const s = await getDoc(doc(db, "users", user.uid));
      if (s.exists()) setBalance(s.data().wallet ?? 0);
      const qRef = query(collection(db, "wallet_txs"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(qRef);
      setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() } as TxLog)));
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-600"><Wallet className="h-6 w-6" /></div>
        <div><h1 className="text-2xl font-extrabold text-ink">Wallet</h1><p className="text-sm text-ink-500">Manage your balance</p></div>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card mb-6">
        <p className="text-sm text-ink-500">Available Balance</p>
        <p className="mt-1 text-4xl font-extrabold text-ink">${balance.toFixed(2)}</p>
        <p className="mt-1 text-xs text-ink-400">Hold funds for tasks. Release to taskers when satisfied.</p>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card mb-6">
        <h2 className="text-sm font-semibold text-ink mb-4">Add Funds</h2>
        <form onSubmit={addFunds} className="flex flex-col gap-3 sm:flex-row">
          <Input type="number" min={1} placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} required className="sm:max-w-[200px]" />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={actionBusy} className="flex items-center gap-1.5 rounded-xl"><Plus className="h-4 w-4" />{actionBusy ? "Adding..." : "Add"}</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink mb-4">Transaction History</h2>
        {busy ? <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></div> :
          txs.length === 0 ? <div className="py-8 text-center text-sm text-ink-500"><Clock className="mx-auto h-8 w-8 text-ink-300 mb-2" />No transactions yet</div> :
          <div className="space-y-2">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${tx.type === "deposit" ? "bg-green-50 text-green-600" : tx.type === "withdraw" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand"}`}>
                    {tx.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div><p className="text-sm font-semibold text-ink">{tx.note}</p><p className="text-xs text-ink-400">{new Date(tx.createdAt).toLocaleDateString()}</p></div>
                </div>
                <span className={`text-sm font-bold ${tx.type === "deposit" ? "text-green-600" : "text-red-600"}`}>{tx.type === "deposit" ? "+" : "-"}${tx.amount}</span>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}
