"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/auth-errors";
import Button from "@/components/ui/Button";
import Input, { Field } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import BrandLogo from "@/components/BrandLogo";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await resetPassword(email);
      setSent(true);
    } catch (caught) {
      setError(authErrorMessage(caught, "We could not send the reset email."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <BrandLogo />
        <h1 className="mt-6 text-[32px] font-black leading-tight tracking-[-0.04em] text-ink">Reset your password.</h1>
        <p className="mt-2 text-sm font-medium text-ink-500">
          Enter the email you signed up with and we will send a secure reset link.
        </p>
      </div>

      <div className="surface p-6 sm:p-8">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MailCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-lg font-black text-ink">Check your inbox</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
              If an account exists for <span className="font-bold text-ink">{email}</span>, a password reset link is on
              its way. It expires in one hour.
            </p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-dark">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
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
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" loading={busy} disabled={!email.includes("@") || busy} fullWidth>
              {busy ? "Sending" : "Send reset link"} {!busy && <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>

      {!sent && (
        <p className="mt-6 text-center text-sm font-medium text-ink-500">
          Remembered it?{" "}
          <Link href="/login" className="font-extrabold text-brand-dark hover:text-brand">
            Back to sign in
          </Link>
        </p>
      )}
    </div>
  );
}
