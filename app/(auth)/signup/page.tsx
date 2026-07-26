"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, HardHat, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage, checkPassword } from "@/lib/auth-errors";
import { MEMBER_ROLE_BLURB, MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/roles";
import Button from "@/components/ui/Button";
import Input, { Field } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import GoogleButton from "@/components/GoogleButton";
import BrandLogo from "@/components/BrandLogo";

const ROLE_CARDS: { value: MemberRole; icon: typeof BriefcaseBusiness; perks: string[] }[] = [
  {
    value: "client",
    icon: BriefcaseBusiness,
    perks: ["Post tasks free", "Compare offers", "Pay when approved"],
  },
  {
    value: "freelancer",
    icon: HardHat,
    perks: ["Browse open work", "Send offers", "Build a verified profile"],
  },
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);

  useEffect(() => {
    const requested = searchParams.get("role");
    if (requested === "freelancer" || requested === "tasker") setRole("freelancer");
  }, [searchParams]);

  const strength = checkPassword(password);
  const canSubmit = name.trim().length > 1 && email.includes("@") && password.length >= 8 && agreed;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy("email");
    setError("");
    try {
      await signUpWithEmail({ email, password, name, role });
      router.push("/onboarding");
    } catch (caught) {
      setError(authErrorMessage(caught, "We could not create your account."));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setBusy("google");
    setError("");
    try {
      const { isNewUser } = await signInWithGoogle(role);
      router.push(isNewUser ? "/onboarding" : "/dashboard");
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
        <h1 className="mt-6 text-[32px] font-black leading-tight tracking-[-0.04em] text-ink">
          Create your Workly account.
        </h1>
        <p className="mt-2 text-sm font-medium text-ink-500">
          Pick how you want to start. You can switch modes any time from your account menu.
        </p>
      </div>

      <div className="surface p-6 sm:p-8">
        <fieldset className="mb-6">
          <legend className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">
            I am joining to
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ROLE_CARDS.map((card) => {
              const selected = role === card.value;
              return (
                <button
                  key={card.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(card.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-brand bg-brand-50 shadow-[0_0_0_3px_rgba(23,107,255,0.1)]"
                      : "border-ink-100 hover:border-ink-200 hover:bg-ink-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${
                        selected ? "bg-brand text-white" : "bg-ink-50 text-ink-400"
                      }`}
                    >
                      <card.icon className="h-4 w-4" />
                    </span>
                    {selected && <Check className="h-4 w-4 text-brand" />}
                  </div>
                  <p className={`mt-3 text-sm font-black ${selected ? "text-brand-dark" : "text-ink"}`}>
                    {card.value === "client" ? "Hire for tasks" : "Work and earn"}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-ink-500">{MEMBER_ROLE_BLURB[card.value]}</p>
                  <ul className="mt-3 space-y-1">
                    {card.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500">
                        <Check className="h-3 w-3 text-brand" /> {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </fieldset>

        <GoogleButton
          onClick={google}
          disabled={busy !== null}
          label={`Sign up with Google as ${MEMBER_ROLE_LABELS[role]}`}
        />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-100" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">or use email</span>
          <span className="h-px flex-1 bg-ink-100" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Full name" required>
            <Input
              placeholder="Ayesha Khan"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </Field>

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

          <Field label="Password" hint="Minimum 8 characters" required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
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
            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition ${
                        index < strength.score ? strength.tone : "bg-ink-100"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] font-bold text-ink-400">
                  {strength.label}
                  {strength.problems.length > 0 && ` · ${strength.problems[0]}`}
                </p>
              </div>
            )}
          </Field>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-ink-50 p-3.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
            />
            <span className="text-[12px] font-semibold leading-5 text-ink-600">
              I agree to Workly&apos;s marketplace terms, and I understand that all payments and communication must stay
              on the platform.
            </span>
          </label>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" loading={busy === "email"} disabled={!canSubmit || busy !== null} fullWidth>
            {busy === "email" ? "Creating account" : `Create ${MEMBER_ROLE_LABELS[role].toLowerCase()} account`}
            {busy !== "email" && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-5 flex items-start gap-2 text-[11px] font-semibold leading-5 text-ink-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          Staff and admin access is never granted at signup. It is invitation-only, controlled by the platform owner.
        </p>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-extrabold text-brand-dark hover:text-brand">
          Log in
        </Link>
      </p>
    </div>
  );
}
