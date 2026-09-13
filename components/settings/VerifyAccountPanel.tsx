"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import Link from "next/link";
import { CheckCircle2, Clock3, GraduationCap, ShieldCheck } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";

export default function VerifyAccountPanel({
  user,
  onGotoMobile,
  onGotoProfile,
}: {
  user: User;
  onGotoMobile?: () => void;
  onGotoProfile?: () => void;
}) {
  const [profilePhone, setProfilePhone] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);
  const [interviewPassed, setInterviewPassed] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfilePhone(d.phone ?? "");
          setProfileComplete(Boolean(d.profileComplete));
          setInterviewPassed(Boolean(d.interviewPassed));
        }
      } catch { /* Profile is optional for settings. */ }
    })();
  }, [user]);

  const sendVerifyEmail = async () => {
    const current = auth?.currentUser;
    if (!current) return;
    try {
      await sendEmailVerification(current);
      setVerifySent(true);
    } catch (err: any) {
      setVerifySent(false);
      setEmailError(err?.message || "Could not send the verification email.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
        <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${user.emailVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{user.emailVerified ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">Email address</p><p className="text-xs text-ink-400">{user.emailVerified ? "Verified" : user.email || "Not verified yet"}</p></div></div>
        {!user.emailVerified && <button onClick={sendVerifyEmail} className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Resend link</button>}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
        <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${profilePhone ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{profilePhone ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">Mobile number</p><p className="text-xs text-ink-400">{profilePhone ? profilePhone : "Not added yet"}</p></div></div>
        <button onClick={onGotoMobile} className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Add now</button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
        <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${profileComplete ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{profileComplete ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">Profile completeness</p><p className="text-xs text-ink-400">{profileComplete ? "Name, bio and city added" : "Add name, bio and city"}</p></div></div>
        <button onClick={onGotoProfile} className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Complete</button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
        <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${interviewPassed ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{interviewPassed ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">AI skill check</p><p className="text-xs text-ink-400">{interviewPassed ? "Assessment passed" : "Take the short assessment"}</p></div></div>
        {!interviewPassed && <Link href="/interview" className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Take check</Link>}
      </div>
      {verifySent && <div className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600"><ShieldCheck className="mr-1 inline h-4 w-4" /> Verification email sent. Check your inbox.</div>}
      {!user.emailVerified && !verifySent && emailError && <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{emailError}</div>}
    </div>
  );
}