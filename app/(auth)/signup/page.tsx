"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  HardHat,
  Lock,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage, checkPassword } from "@/lib/auth-errors";
import { MEMBER_ROLE_BLURB, MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/roles";
import { getPlatformSettings } from "@/lib/admin";
import Button from "@/components/ui/Button";
import Input, { Field } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import GoogleButton from "@/components/GoogleButton";
import BrandLogo from "@/components/BrandLogo";

const ROLE_CARDS: { value: MemberRole; icon: typeof BriefcaseBusiness; title: string; summary: string }[] = [
  {
    value: "client",
    icon: BriefcaseBusiness,
    title: "Hire for tasks",
    summary: "Post work, compare offers and manage delivery in one place.",
  },
  {
    value: "freelancer",
    icon: HardHat,
    title: "Work and earn",
    summary: "Build your profile, find relevant work and send professional offers.",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validDisplayName(value: string) {
  const normalized = normalizeName(value);
  const letters = normalized.match(/\p{L}/gu)?.length ?? 0;
  return normalized.length >= 2 && normalized.length <= 80 && letters >= 2;
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<MemberRole>("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [allowSignups, setAllowSignups] = useState<boolean | null>(null);

  useEffect(() => {
    const requested = searchParams.get("role");
    if (requested === "freelancer" || requested === "tasker") setRole("freelancer");
  }, [searchParams]);

  useEffect(() => {
    getPlatformSettings()
      .then((settings) => setAllowSignups(settings.allowNewSignups))
      .catch(() => {
        setAllowSignups(false);
        setError("Account registration is temporarily unavailable because Workly could not verify signup availability.");
      });
  }, []);

  const normalizedName = normalizeName(name);
  const normalizedEmail = email.trim().toLowerCase();
  const strength = checkPassword(password);
  const nameValid = validDisplayName(name);
  const emailValid = EMAIL_PATTERN.test(normalizedEmail);
  const passwordValid = password.length > 0 && strength.problems.length === 0;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const nameError = attempted && !nameValid ? "Enter your real full name using at least two letters." : "";
  const emailError = attempted && !emailValid ? "Enter a valid email address." : "";
  const passwordError = attempted && !passwordValid ? strength.problems[0] || "Choose a stronger password." : "";
  const confirmError = attempted && !passwordsMatch ? "Passwords do not match." : "";

  const canSubmit =
    allowSignups === true && nameValid && emailValid && passwordValid && passwordsMatch && agreed && busy === null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    setError("");

    if (allowSignups !== true) {
      setError(allowSignups === false ? "New account creation is temporarily unavailable." : "Checking account availability. Please try again.");
      return;
    }
    if (!nameValid || !emailValid || !passwordValid || !passwordsMatch) return;
    if (!agreed) {
      setError("Please accept the marketplace signup terms before creating your account.");
      return;
    }

    setBusy("email");
    try {
      await signUpWithEmail({ email: normalizedEmail, password, name: normalizedName, role });
      router.push("/onboarding");
    } catch (caught) {
      setError(authErrorMessage(caught, "We could not create your account."));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setAttempted(true);
    setError("");

    if (allowSignups !== true) {
      setError(allowSignups === false ? "New account creation is temporarily unavailable." : "Checking account availability. Please try again.");
      return;
    }
    if (!agreed) {
      setError("Accept the marketplace signup terms before continuing with Google.");
      return;
    }

    setBusy("google");
    try {
      const { isNewUser, isOwner } = await signInWithGoogle(role);
      router.push(isOwner ? "/admin" : isNewUser ? "/onboarding" : "/dashboard");
    } catch (caught) {
      setError(authErrorMessage(caught, "Google sign-up did not complete."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-7">
        <BrandLogo />
        <h1 className="mt-6 text-[32px] font-black leading-tight tracking-[-0.04em] text-ink">Create your account.</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-ink-500">
          Choose how you want to use Workly, then create one secure member account.
        </p>
      </div>

      {allowSignups === false && (
        <Alert tone="warning" title="New signups are temporarily unavailable" className="mb-5">
          <span className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" /> Existing members can still log in. New membership creation is currently blocked.
          </span>
        </Alert>
      )}

      <div className="surface overflow-hidden">
        <div className="border-b border-ink-100 bg-ink-50/60 px-6 py-5 sm:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Account type</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {ROLE_CARDS.map((card) => {
              const selected = role === card.value;
              return (
                <button
                  key={card.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={busy !== null || allowSignups === false}
                  onClick={() => setRole(card.value)}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? "border-brand bg-white shadow-[0_0_0_3px_rgba(23,107,255,0.08)]"
                      : "border-ink-100 bg-white/70 hover:border-ink-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${selected ? "bg-brand text-white" : "bg-ink-50 text-ink-400"}`}>
                      <card.icon className="h-4 w-4" />
                    </span>
                    {selected && <Check className="h-4 w-4 text-brand" />}
                  </div>
                  <p className={`mt-3 text-sm font-black ${selected ? "text-brand-dark" : "text-ink"}`}>{card.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-ink-500">{card.summary}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-4 text-ink-400">{MEMBER_ROLE_BLURB[role]}</p>
        </div>

        <div className="p-6 sm:p-8">
          <GoogleButton
            onClick={google}
            disabled={busy !== null || allowSignups !== true || !agreed}
            label={busy === "google" ? "Connecting to Google..." : `Continue with Google as ${MEMBER_ROLE_LABELS[role]}`}
          />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-100" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">or use email</span>
            <span className="h-px flex-1 bg-ink-100" />
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Full name" hint="Shown on your profile" error={nameError} required>
              <Input
                placeholder="Ayesha Khan"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setName((current) => normalizeName(current))}
                autoComplete="name"
                maxLength={80}
                aria-invalid={Boolean(nameError)}
                disabled={busy !== null || allowSignups === false}
                required
              />
            </Field>

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
                disabled={busy !== null || allowSignups === false}
                required
              />
            </Field>

            <Field label="Password" hint="8+ chars, upper/lower case and a number" error={passwordError} required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="pr-12"
                  aria-invalid={Boolean(passwordError)}
                  disabled={busy !== null || allowSignups === false}
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
              {password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map((index) => (
                      <span key={index} className={`h-1.5 flex-1 rounded-full transition ${index < strength.score ? strength.tone : "bg-ink-100"}`} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] font-bold text-ink-400">
                    {strength.label}{strength.problems.length > 0 && ` · ${strength.problems[0]}`}
                  </p>
                </div>
              )}
            </Field>

            <Field label="Confirm password" error={confirmError} required>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Type your password again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(confirmError)}
                disabled={busy !== null || allowSignups === false}
                required
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50/70 p-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                disabled={busy !== null || allowSignups === false}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
              />
              <span className="text-[12px] font-semibold leading-5 text-ink-600">
                I agree to Workly&apos;s marketplace signup terms and understand that platform work, communication and payments must follow Workly policy.
              </span>
            </label>

            {attempted && !agreed && !error && <p className="text-xs font-bold text-rose-600">You must accept the signup terms to continue.</p>}
            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" loading={busy === "email"} disabled={!canSubmit} fullWidth size="lg">
              {busy === "email" ? "Creating secure account" : `Create ${MEMBER_ROLE_LABELS[role].toLowerCase()} account`}
              {busy !== "email" && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-5 grid gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-[11px] font-semibold leading-4 text-ink-500">
            <span className="flex items-start gap-2"><MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> Email accounts receive a verification link after signup.</span>
            <span className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> Staff and admin access is never granted at signup. It is invitation-only.</span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-extrabold text-brand-dark hover:text-brand">Log in</Link>
      </p>
    </div>
  );
}
