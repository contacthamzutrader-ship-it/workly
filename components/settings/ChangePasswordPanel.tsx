"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import { auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export default function ChangePasswordPanel({ user }: { user: User }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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
          autoComplete={key === "current" ? "current-password" : "new-password"}
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
    <form onSubmit={changePassword} className="space-y-5">
      <div className="space-y-4">
        {field("Current Password", current, setCurrent, "current", "Enter your current password")}
        {field("New Password", next, setNext, "next", "Enter a new password")}
        {field("Confirm New Password", confirm, setConfirm, "confirm", "Repeat the new password")}
      </div>

      <div className="rounded-2xl bg-ink-50 p-4">
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

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
      {status && <div className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600">{status}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Changing..." : "Change Password"}
        </button>
        <span className="text-xs font-medium text-ink-400">Your password is managed by Firebase Authentication and never stored in this app.</span>
      </div>
    </form>
  );
}