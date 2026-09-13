"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Banknote, Check, CreditCard, Landmark, Plus, Smartphone, Trash2, Wallet } from "lucide-react";
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PaymentMethod {
  id: string;
  method: string;
  accountTitle: string;
  accountNumber: string;
}

const METHODS = [
  { value: "bank", label: "Bank Account", icon: Landmark },
  { value: "jazzcash", label: "JazzCash", icon: Smartphone },
  { value: "easypaisa", label: "EasyPaisa", icon: Smartphone },
  { value: "payoneer", label: "Payoneer", icon: Wallet },
];

export default function PaymentMethodPanel({ user }: { user: User }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [method, setMethod] = useState("bank");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && Array.isArray(snap.data().paymentMethods)) {
          setMethods(snap.data().paymentMethods);
        }
      } catch { /* Falls back to empty. */ }
      setLoaded(true);
    })();
  }, [user]);

  const addMethod = async () => {
    if (!db) return;
    setError("");
    setStatus("");
    const title = accountTitle.trim();
    const number = accountNumber.trim();
    if (!title) {
      setError("Enter the account holder name.");
      return;
    }
    if (!number) {
      setError("Enter the account number, IBAN or email.");
      return;
    }
    setBusy(true);
    try {
      const item: PaymentMethod = { id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, method, accountTitle: title, accountNumber: number };
      await updateDoc(doc(db, "users", user.uid), { paymentMethods: arrayUnion(item) });
      setMethods((m) => [...m, item]);
      setFormOpen(false);
      setAccountTitle("");
      setAccountNumber("");
      setStatus("Payment method added.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not add the payment method.");
    } finally {
      setBusy(false);
    }
  };

  const removeMethod = async (item: PaymentMethod) => {
    if (!db) return;
    if (!confirm(`Remove ${item.method} (${item.accountTitle}) as a payment method?`)) return;
    setError("");
    setStatus("");
    try {
      await updateDoc(doc(db, "users", user.uid), { paymentMethods: arrayRemove(item) });
      setMethods((m) => m.filter((x) => x.id !== item.id));
      setStatus("Payment method removed.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not remove the payment method.");
    }
  };

  const inputClass = "min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div>
      {!loaded && <p className="text-sm font-medium text-ink-400">Loading your payment methods...</p>}

      {formOpen && (
        <div className="rounded-2xl border border-ink-100 bg-canvas p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Add a payment method</p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Method</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {METHODS.map((m) => (
                  <button key={m.value} type="button" onClick={() => setMethod(m.value)} className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-extrabold transition ${method === m.value ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500 hover:border-brand/40"}`}>
                    <m.icon className="h-5 w-5" /> {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Account holder name</label>
              <input value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} placeholder={method === "payoneer" ? "Payoneer account name" : "Full name on the account"} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{method === "payoneer" ? "Payoneer email" : method === "bank" ? "Bank account / IBAN" : "Mobile number"}</label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={method === "payoneer" ? "you@email.com" : method === "bank" ? "e.g. PK36 XXXXXXXX1234" : "03001234567"} className={inputClass} />
            </div>
          </div>
          {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={addMethod} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-60"><Plus className="h-4 w-4" /> {busy ? "Adding..." : "Add method"}</button>
            <button type="button" onClick={() => { setFormOpen(false); setError(""); }} className="inline-flex min-h-11 items-center rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">Cancel</button>
          </div>
        </div>
      )}

      {methods.length === 0 && !formOpen ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 py-8 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-ink-300" />
          <h3 className="mt-2 text-base font-black text-ink">No payment methods yet</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-400">Add a bank account, JazzCash, EasyPaisa or Payoneer to receive your task payments.</p>
          <button onClick={() => setFormOpen(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700"><Plus className="h-4 w-4" /> Add payment method</button>
        </div>
      ) : (
        methods.map((item, index) => (
          <div key={item.id} className="mt-2 first:mt-0 flex items-center gap-3 rounded-2xl border border-ink-100 p-4">
            {(() => { const Icon = (METHODS.find((m) => m.value === item.method) || METHODS[0]).icon; return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span>; })()}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-black text-ink">{item.method === "bank" ? "Bank Account" : item.method === "jazzcash" ? "JazzCash" : item.method === "easypaisa" ? "EasyPaisa" : "Payoneer"}{index === 0 && <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-extrabold text-brand-dark"><Check className="h-3 w-3" /> Default</span>}</p>
              <p className="truncate text-xs text-ink-400">{item.accountTitle}</p>
              <p className="truncate text-xs font-semibold text-ink-500">{item.accountNumber}</p>
            </div>
            <button onClick={() => removeMethod(item)} aria-label="Remove payment method" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink-100 text-ink-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))
      )}

      {methods.length > 0 && !formOpen && (
        <button onClick={() => setFormOpen(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-bold text-ink-600 transition hover:bg-ink-50"><Banknote className="h-4 w-4 text-brand" /> Add another method</button>
      )}

      {(status || error) && !formOpen && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-semibold ${error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{error || status}</div>
      )}
    </div>
  );
}