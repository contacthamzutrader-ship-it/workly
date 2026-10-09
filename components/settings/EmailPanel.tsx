"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { BadgeCheck, Mail, Save } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { updateEmail, sendEmailVerification } from "firebase/auth";

export default function EmailPanel({ user }: { user: User }) {
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailVerified, setEmailVerified] = useState(user.emailVerified);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setEmailDraft(snap.data().email ?? user.email ?? "");
      } catch { /* Profile is optional for settings. */ }
    })();
  }, [user]);

  const changeEmail = async () => {
    if (!user || !db) return;
    const next = emailDraft.trim();
    if (!next || !/.+@.+\..+/.test(next)) {
      setEmailError("Enter a valid email address.");
      setEmailStatus("");
      return;
    }
    if (next.toLowerCase() === (user.email || "").toLowerCase()) {
      setEmailError("Enter a different email address to change it.");
      setEmailStatus("");
      return;
    }
    setEmailError("");
    try {
      const current = auth?.currentUser;
      if (!current) throw new Error("Sign in again before changing your email.");
      await updateEmail(current, next);
      await sendEmailVerification(current);
      await updateDoc(doc(db, "users", user.uid), { email: next });
      setEmailVerified(current.emailVerified);
      setEmailStatus("Verification email sent. Confirm it to finish changing your address.");
      setEmailDraft(next);
    } catch (err: any) {
      const code = err?.code || "";
      if (code.includes("requires-recent-login")) {
        setEmailError("For security, sign out and sign back in, then try again.");
      } else {
        setEmailError(err?.message || "Could not update your email.");
      }
      setEmailStatus("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Mail className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="text-sm font-black text-ink">{user.email}</p><p className="mt-0.5 text-xs leading-5 text-ink-400">The address you use to sign in.</p></div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${emailVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}><BadgeCheck className="h-3.5 w-3.5" /> {emailVerified ? "Verified" : "Not verified"}</span>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-ink">Email address</label>
        <input value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} type="email" className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-400">After saving, a verification link is sent to the new address before it becomes active.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={changeEmail} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save email</button>
        {emailStatus && <span className="text-sm font-bold text-green-600">{emailStatus}</span>}
      </div>
      {emailError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{emailError}</div>}
    </div>
  );
}