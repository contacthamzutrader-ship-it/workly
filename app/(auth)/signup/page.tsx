"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, Sparkles, UserRoundSearch } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountType, setAccountType] = useState<"customer" | "tasker">("customer");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signUpWithEmail(email, password, name, accountType);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "We could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle(accountType);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Google sign-up failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-7">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-glow"><Sparkles className="h-5 w-5" /></span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-ink">Choose how you use Workly.</h1>
        <p className="mt-2 text-sm font-medium text-ink-500">Your workspace and permissions will match this account type.</p>
      </div>

      <div className="surface p-6 sm:p-8">
        <div className="mb-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
          <button type="button" role="radio" aria-checked={accountType === "customer"} onClick={() => setAccountType("customer")} className={`rounded-2xl border p-4 text-left transition ${accountType === "customer" ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500 hover:border-ink-200"}`}>
            <BriefcaseBusiness className="h-5 w-5" /><span className="mt-2 block text-sm font-black">I want to hire</span><span className="mt-1 block text-[11px] leading-4">Post work and hire talent</span>
          </button>
          <button type="button" role="radio" aria-checked={accountType === "tasker"} onClick={() => setAccountType("tasker")} className={`rounded-2xl border p-4 text-left transition ${accountType === "tasker" ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500 hover:border-ink-200"}`}>
            <UserRoundSearch className="h-5 w-5" /><span className="mt-2 block text-sm font-black">I want to work</span><span className="mt-1 block text-[11px] leading-4">Build a profile and send offers</span>
          </button>
        </div>
        <button onClick={google} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-ink-50 disabled:opacity-50">
          <GoogleMark /> Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-ink-100" /><span className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">or email</span><span className="h-px flex-1 bg-ink-100" /></div>

        <form onSubmit={submit} className="space-y-4">
          <div><label className="mb-2 block text-sm font-extrabold text-ink">Full name</label><Input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" autoComplete="name" /></div>
          <div><label className="mb-2 block text-sm font-extrabold text-ink">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" autoComplete="email" /></div>
          <div><label className="mb-2 block text-sm font-extrabold text-ink">Create password</label><div className="relative"><Input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" autoComplete="new-password" className="pr-11" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-ink-400 hover:text-ink" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full gap-2">{busy ? "Creating account..." : "Create free account"} {!busy && <ArrowRight className="h-4 w-4" />}</Button>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-ink-400"><span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-brand" /> Free to join</span><span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-brand" /> Hire or earn</span><span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-brand" /> Secure payments</span></div>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">Already a member? <Link href="/login" className="font-extrabold text-brand-dark hover:text-brand">Sign in</Link></p>
    </div>
  );
}

function GoogleMark() {
  return <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-ink-200 text-xs font-black text-blue-600">G</span>;
}
