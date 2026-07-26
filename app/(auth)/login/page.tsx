"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/auth-errors";
import { isOwnerEmail } from "@/lib/roles";
import Button from "@/components/ui/Button";
import Input, { Field } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import GoogleButton from "@/components/GoogleButton";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);

  const destination = () => (isOwnerEmail(email) ? "/admin" : redirect);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("email");
    setError("");
    try {
      await signInWithEmail(email, password);
      router.push(destination());
    } catch (caught) {
      setError(authErrorMessage(caught, "We could not sign you in."));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setBusy("google");
    setError("");
    try {
      const { isNewUser } = await signInWithGoogle();
      router.push(isNewUser ? "/onboarding" : redirect);
    } catch (caught) {
      setError(authErrorMessage(caught, "Google sign-in did not complete."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <BrandLogo />
        <h1 className="mt-6 text-[32px] font-black leading-tight tracking-[-0.04em] text-ink">Welcome back.</h1>
        <p className="mt-2 text-sm font-medium text-ink-500">Your tasks, offers and payments are waiting.</p>
      </div>

      <div className="surface p-6 sm:p-8">
        <GoogleButton onClick={google} disabled={busy !== null} />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-100" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">or use email</span>
          <span className="h-px flex-1 bg-ink-100" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email address" required>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Password" required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-50 hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-extrabold text-brand-dark hover:text-brand">
              Forgot your password?
            </Link>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" loading={busy === "email"} disabled={busy !== null} fullWidth>
            {busy === "email" ? "Signing in" : "Sign in"} {busy !== "email" && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400">
          <LockKeyhole className="h-3.5 w-3.5 text-brand" /> Protected by Firebase Authentication
        </p>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">
        New to Workly?{" "}
        <Link href="/signup" className="font-extrabold text-brand-dark hover:text-brand">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
