"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export default function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/change-password"); }, [loading, user, router]);
  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const checks = [
    { label: "At least 8 characters", ok: next.length >= 8 },
    { label: "At least one letter", ok: /[A-Za-z]/.test(next) },
    { label: "At least one number", ok: /\d/.test(next) },
  ];

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    const currentUser = auth?.currentUser;
    if (!currentUser?.email) {
      setError("Your account is missing an email address. Please contact support.");
      return;
    }
    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (!checks.every((c) => c.ok)) {
      setError("Your new password does not meet the minimum requirements.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from your current password.");
      return;
    }
    setBusy(true);
    try {
      await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, current));
      await updatePassword(currentUser, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus("Password changed successfully. Use your new password next time you sign in.");
    } catch (err: any) {
      const code = err?.code || "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Your current password is incorrect.");
      } else if (code.includes("weak-password")) {
        setError("New password must be at least 8 characters and include a letter and a number.");
      } else if (code.includes("requires-recent-login")) {
        setError("For security, sign out and sign back in, then try again.");
      } else {
        setError(err?.message || "Could not change your password.");
      }
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    key: "current" | "next" | "confirm",
    placeholder: string
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          type={show[key] ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete={key === "current" ? "current-password" : key === "next" ? "new-password" : "new-password"}
          className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 pr-11 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
          aria-label={show[key] ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink"
        >
          {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-3xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><KeyRound className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Account security</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Change Password</h1>
              <p className="mt-1 text-sm text-white/55">Set a new password for {user.email}</p>
            </div>
            <div className="ml-auto hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65 sm:inline-flex"><ShieldCheck className="h-4 w-4 text-brand-300" /> Encrypted at rest</div>
          </div>
        </div>

        <form onSubmit={changePassword} className="surface mt-6 p-6 sm:p-8">
          <div className="space-y-5">
            {field("Current Password", current, setCurrent, "current", "Enter your current password")}
            {field("New Password", next, setNext, "next", "Enter a new password")}
            {field("Confirm New Password", confirm, setConfirm, "confirm", "Repeat the new password")}
          </div>

          <div className="mt-5 rounded-2xl bg-ink-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Minimum requirements</p>
            <ul className="mt-2 space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className={`flex items-center gap-2 text-sm font-semibold ${c.ok ? "text-green-600" : "text-ink-400"}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full ${c.ok ? "bg-green-600 text-white" : "bg-ink-100 text-ink-300"}`}>{c.ok ? <Check className="h-3 w-3" /> : <Lock className="h-3 w-3" />}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
          {status && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600">{status}</div>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Changing..." : "Change Password"}
            </button>
            <span className="text-xs font-medium text-ink-400">Your password is never stored or logged in this app - it is managed by Firebase Authentication.</span>
          </div>
        </form>
      </div>
    </div>
  );
}