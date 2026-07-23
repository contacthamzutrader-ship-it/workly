"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BrandLogo from "@/components/BrandLogo";
import { OWNER_EMAIL } from "@/lib/admin";

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirect, setRedirect] = useState("/dashboard");

  useEffect(() => {
    const destination = new URLSearchParams(window.location.search).get("redirect");
    if (destination) setRedirect(destination);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmail(email, password);
      router.push(email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase() ? "/admin" : redirect);
    } catch (err: any) {
      setError(err?.message || "We could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <BrandLogo />
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-ink">Welcome back.</h1>
        <p className="mt-2 text-sm font-medium text-ink-500">Your tasks, offers and payments are waiting.</p>
      </div>

      <div className="surface p-6 sm:p-8">
        <button onClick={google} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-ink-50 disabled:opacity-50">
          <GoogleMark /> Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-ink-100" /><span className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">or email</span><span className="h-px flex-1 bg-ink-100" /></div>

        <form onSubmit={submit} className="space-y-4">
          <div><label className="mb-2 block text-sm font-extrabold text-ink">Email address</label><Input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div>
          <div>
            <div className="mb-2 flex items-center justify-between"><label className="text-sm font-extrabold text-ink">Password</label><span className="text-xs font-bold text-brand-dark">Secure sign in</span></div>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="pr-11" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-ink-400 hover:text-ink" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full gap-2">{busy ? "Signing in..." : "Sign in"} {!busy && <ArrowRight className="h-4 w-4" />}</Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400"><LockKeyhole className="h-3.5 w-3.5 text-brand" /> Protected by Firebase Authentication</div>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">New to Workly? <Link href="/signup" className="font-extrabold text-brand-dark hover:text-brand">Create a free account</Link></p>
    </div>
  );
}

function GoogleMark() {
  return <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-ink-200 text-xs font-black text-blue-600">G</span>;
}
