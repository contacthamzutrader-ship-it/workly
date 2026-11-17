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
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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

      // Perform a direct Firestore check to see if we should redirect to onboarding
      const currentUser = auth?.currentUser;
      if (currentUser && db) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.role === "tasker" && !d.onboardingCompleted) {
            router.push("/onboarding");
            return;
          }
        }
      }

      router.push(redirect);
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

      // Perform a direct Firestore check to see if we should redirect to onboarding
      const currentUser = auth?.currentUser;
      if (currentUser && db) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.role === "tasker" && !d.onboardingCompleted) {
            router.push("/onboarding");
            return;
          }
        }
      }

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
          <Button type="submit" size="lg" disabled={busy} className="w-full gap-2">{busy ? "Signing in..." : "Sign in"} {!busy && <ArrowRight className="h-4 w-4" />}</Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400"><LockKeyhole className="h-3.5 w-3.5 text-brand" /> Protected by Firebase Authentication</div>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">New to AventriqTalent? <Link href="/signup" className="font-extrabold text-brand-dark hover:text-brand">Create a free account</Link></p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
