"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/auth-errors";
import Button from "@/components/ui/Button";
import Input, { Field } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import GoogleButton from "@/components/GoogleButton";
import BrandLogo from "@/components/BrandLogo";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeInternalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

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
  const redirect = safeInternalRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_PATTERN.test(normalizedEmail);
  const passwordValid = password.length > 0;
  const emailError = attempted && !emailValid ? "Enter a valid email address." : "";
  const passwordError = attempted && !passwordValid ? "Enter your password." : "";
  const canSubmit = emailValid && passwordValid && busy === null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    setError("");
    if (!emailValid || !passwordValid) return;

    setBusy("email");
    try {
      const { isOwner, onboarded } = await signInWithEmail(normalizedEmail, password);
      router.push(isOwner ? "/admin" : onboarded ? redirect : "/onboarding");
    } catch (caught) {
      setError(authErrorMessage(caught, "We could not sign you in."));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError("");
    setBusy("google");
    try {
      const { isOwner, onboarded } = await signInWithGoogle();
      router.push(isOwner ? "/admin" : onboarded ? redirect : "/onboarding");
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
        <p className="mt-2 text-sm font-medium leading-6 text-ink-500">Sign in to manage your tasks, offers and account activity.</p>
      </div>

      <div className="surface p-6 sm:p-8">
        <GoogleButton onClick={google} disabled={busy !== null} label={busy === "google" ? "Connecting to Google..." : "Continue with Google"} />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-100" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">or use email</span>
          <span className="h-px flex-1 bg-ink-100" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email address" error={emailError} required>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmail((current) => current.trim().toLowerCase())}
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(emailError)}
              disabled={busy !== null}
              required
            />
          </Field>

          <Field label="Password" error={passwordError} required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="pr-12"
                aria-invalid={Boolean(passwordError)}
                disabled={busy !== null}
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

          <Button type="submit" loading={busy === "email"} disabled={!canSubmit} fullWidth size="lg">
            {busy === "email" ? "Signing in securely" : "Sign in"} {busy !== "email" && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400">
          <LockKeyhole className="h-3.5 w-3.5 text-brand" /> Existing Parwaz accounts only. New members join from Create account.
        </p>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">
        New to Parwaz?{" "}
        <Link href="/signup" className="font-extrabold text-brand-dark hover:text-brand">Create a free account</Link>
      </p>
    </div>
  );
}
