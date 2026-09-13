"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ArrowDownToLine, ArrowUpFromLine, History, Landmark, Wallet } from "lucide-react";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDate } from "@/lib/format";

interface Tx {
  id: string;
  userId?: string;
  amount?: number;
  type?: string;
  note?: string;
  createdAt?: string;
  taskId?: string;
}

const TYPE_META: Record<string, { label: string; icon: any; cls: string }> = {
  hold: { label: "Funds held", icon: ArrowUpFromLine, cls: "bg-amber-50 text-amber-600" },
  payment: { label: "Payment", icon: Landmark, cls: "bg-blue-50 text-blue-600" },
  release: { label: "Payment released", icon: ArrowDownToLine, cls: "bg-green-50 text-green-600" },
  topup: { label: "Wallet top-up", icon: ArrowDownToLine, cls: "bg-green-50 text-green-600" },
  refund: { label: "Refund", icon: ArrowDownToLine, cls: "bg-green-50 text-green-600" },
};

export default function PaymentHistoryPanel({ user }: { user: User }) {
  const [wallet, setWallet] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && typeof snap.data().wallet === "number") setWallet(snap.data().wallet);
      } catch { /* Wallet is optional. */ }
      try {
        const q = query(collection(db, "wallet_txs"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);
        setTxs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tx));
      } catch { /* History is best-effort. */ }
      setLoaded(true);
    })();
  }, [user]);

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#00501F] p-4 text-white">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand"><Wallet className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Available wallet balance</p>
          <p className="text-xl font-extrabold tracking-[-0.02em]">PKR {(wallet ?? 0).toLocaleString("en-PK")}</p>
        </div>
      </div>

      {!loaded ? (
        <p className="mt-4 text-sm font-medium text-ink-400">Loading your payment history...</p>
      ) : txs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 py-8 text-center">
          <History className="mx-auto h-8 w-8 text-ink-300" />
          <h3 className="mt-2 text-base font-black text-ink">No payments yet</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-400">When you hire, get paid or top up your wallet, every transaction will appear here.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {txs.map((tx) => {
            const meta = TYPE_META[tx.type || "other"] || { label: "Transaction", icon: Wallet, cls: "bg-ink-100 text-ink-500" };
            const Icon = meta.icon;
            return (
              <div key={tx.id} className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.cls}`}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">{tx.note || meta.label}</p>
                  <p className="text-xs text-ink-400">{tx.createdAt ? formatDate(tx.createdAt) : "Date unavailable"}</p>
                </div>
                <span className={`shrink-0 text-sm font-extrabold ${tx.type === "release" || tx.type === "topup" || tx.type === "refund" ? "text-green-600" : tx.type === "hold" ? "text-amber-600" : "text-ink"}`}>
                  {typeof tx.amount === "number" ? `${tx.type === "release" || tx.type === "topup" || tx.type === "refund" ? "+" : "-"}PKR ${tx.amount.toLocaleString("en-PK")}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}