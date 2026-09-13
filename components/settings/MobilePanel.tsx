"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Save, Smartphone } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MobilePanel({ user }: { user: User }) {
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setPhoneDraft(snap.data().phone ?? "");
      } catch { /* Profile is optional for settings. */ }
    })();
  }, [user]);

  const saveMobile = async () => {
    if (!user || !db) return;
    const cleaned = phoneDraft.trim();
    if (!/^(\+92|0)?3\d{9}$/.test(cleaned)) {
      setPhoneError("Enter a valid Pakistan mobile number, e.g. 03001234567.");
      setPhoneSaved(false);
      return;
    }
    setPhoneError("");
    try {
      await updateDoc(doc(db, "users", user.uid), { phone: cleaned });
      setPhoneSaved(true);
    } catch (err: any) {
      setPhoneError(err?.message || "Could not save your mobile number.");
    }
  };

  return (
    <div>
      <div className="flex items-start gap-3 rounded-2xl border border-ink-100 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Smartphone className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <label className="block text-sm font-medium text-ink">Mobile number</label>
          <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} inputMode="tel" placeholder="03001234567" className="mt-1.5 min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          <p className="mt-2 text-xs leading-5 text-ink-400">Shown only to the clients who hire you, and used for payment alerts. No OTP is sent - the number acts as your contact detail.</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={saveMobile} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save number</button>
        {phoneSaved && <span className="text-sm font-bold text-green-600">Number saved.</span>}
      </div>
      {phoneError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{phoneError}</div>}
    </div>
  );
}