"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  HardHat,
  KeyRound,
  LogOut,
  MailCheck,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MEMBER_ROLE_BLURB, MEMBER_ROLE_LABELS, STAFF_ROLE_LABELS, type MemberRole } from "@/lib/roles";
import { authErrorMessage } from "@/lib/auth-errors";
import Button from "@/components/ui/Button";
import { Alert, PageLoader } from "@/components/ui/Feedback";

export default function SettingsPage() {
  const { user, profile, role, staff, isStaff, isOwner, loading, switchRole, resetPassword, resendVerification, signOut } =
    useAuth();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/settings");
  }, [loading, user, router]);

  if (loading || !user) return <PageLoader />;

  const run = async (key: string, work: () => Promise<void>, success: string) => {
    setAction(key);
    setError("");
    setMessage("");
    try {
      await work();
      setMessage(success);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setAction("");
    }
  };

  const usesPassword = user.providerData.some((provider) => provider.providerId === "password");

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-3xl">
        <header className="mb-7">
          <span className="eyebrow">
            <UserRound className="h-3.5 w-3.5" /> Account
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">Account settings</h1>
          <p className="mt-2 text-sm font-medium text-ink-500">
            Control how you use Workly, how you sign in, and what your account can do.
          </p>
        </header>

        {message && <Alert tone="success" className="mb-4">{message}</Alert>}
        {error && <Alert tone="error" className="mb-4">{error}</Alert>}

        <div className="space-y-5">
          {/* ---------------------------------------------- Identity */}
          <section className="surface p-6 sm:p-7">
            <h2 className="text-lg font-black text-ink">Your identity</h2>
            <dl className="mt-4 space-y-3">
              <Row label="Name" value={profile?.name || user.displayName || "Not set"} />
              <Row label="Email" value={user.email || "—"} />
              <Row
                label="Email status"
                value={user.emailVerified ? "Verified" : "Not verified"}
                tone={user.emailVerified ? "text-emerald-600" : "text-amber-600"}
              />
              <Row label="Member since" value={user.metadata.creationTime?.split(" ").slice(1, 4).join(" ") || "—"} />
              <Row label="Sign-in method" value={usesPassword ? "Email & password" : "Google"} />
            </dl>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-5">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Edit profile <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {!user.emailVerified && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={action === "verify"}
                  onClick={() => run("verify", resendVerification, "Verification email sent. Check your inbox.")}
                >
                  <MailCheck className="h-3.5 w-3.5" /> Resend verification
                </Button>
              )}
            </div>
          </section>

          {/* ---------------------------------------------- Mode */}
          <section className="surface p-6 sm:p-7">
            <h2 className="text-lg font-black text-ink">How you use Workly</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              One account, two modes. Switching changes your dashboard and what you can do — nothing is deleted.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "client" as MemberRole, icon: BriefcaseBusiness },
                  { value: "freelancer" as MemberRole, icon: HardHat },
                ]
              ).map((option) => {
                const active = role === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      !active &&
                      run(
                        `switch-${option.value}`,
                        () => switchRole(option.value),
                        `You are now using Workly as a ${MEMBER_ROLE_LABELS[option.value].toLowerCase()}.`
                      )
                    }
                    disabled={active || action !== ""}
                    className={`rounded-2xl border p-5 text-left transition disabled:cursor-default ${
                      active ? "border-brand bg-brand-50" : "border-ink-100 hover:border-ink-200 hover:bg-ink-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-xl ${
                          active ? "bg-brand text-white" : "bg-ink-50 text-ink-400"
                        }`}
                      >
                        <option.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                      </span>
                      {active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-black uppercase text-white">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <ArrowLeftRight className="h-4 w-4 text-ink-300" />
                      )}
                    </div>
                    <p className={`mt-4 text-sm font-black ${active ? "text-brand-dark" : "text-ink"}`}>
                      {MEMBER_ROLE_LABELS[option.value]} mode
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-500">{MEMBER_ROLE_BLURB[option.value]}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---------------------------------------------- Staff access */}
          <section className="surface p-6 sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-black text-ink">
              <ShieldCheck className="h-5 w-5 text-brand" /> Platform access
            </h2>
            {isStaff ? (
              <>
                <div className="mt-4 rounded-2xl bg-ink p-5 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black">
                      {isOwner ? "Platform owner" : STAFF_ROLE_LABELS[staff!.role]}
                    </p>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase text-brand-300">
                      {isOwner ? "Full control" : `${staff!.permissions.length} permissions`}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {isOwner
                      ? "You have complete control over the platform, including granting and revoking staff access."
                      : "Your access was granted by the platform owner and can be changed at any time."}
                  </p>
                  <Link href="/admin" className="mt-4 inline-block">
                    <Button className="bg-white text-ink shadow-none hover:bg-brand-100" size="sm">
                      Open control centre <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-500">
                This is a standard member account. Staff roles — editor, moderator and admin — are invitation-only and
                granted by the platform owner. They can never be selected during signup.
              </p>
            )}
          </section>

          {/* ---------------------------------------------- Security */}
          <section className="surface p-6 sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-black text-ink">
              <KeyRound className="h-5 w-5 text-brand" /> Security
            </h2>
            <p className="mt-1.5 text-sm text-ink-500">
              {usesPassword
                ? `We will email a secure reset link to ${user.email}. It expires in one hour.`
                : "You sign in with Google, so your password is managed by your Google account."}
            </p>
            {usesPassword && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                loading={action === "reset"}
                onClick={() => run("reset", () => resetPassword(user.email!), "Password reset email sent.")}
              >
                Send password reset link
              </Button>
            )}
          </section>

          {/* ---------------------------------------------- Sessions */}
          <section className="surface p-6 sm:p-7">
            <h2 className="text-lg font-black text-ink">Session</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              Signing out ends this session on this device only. Your tasks, offers and messages stay intact.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </section>

          {/* ---------------------------------------------- Danger */}
          <section className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-black text-rose-700">
              <Trash2 className="h-5 w-5" /> Close your account
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-rose-800/80">
              Account closure is handled by Workly support so that any open contracts, held funds and disputes are
              settled correctly first. Contact support and we will confirm within two business days.
            </p>
            <Link href="/support#contact" className="mt-4 inline-block">
              <Button variant="danger" size="sm">
                Contact support
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-50 pb-3 last:border-0 last:pb-0">
      <dt className="text-xs font-black uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className={`text-sm font-bold ${tone}`}>{value}</dd>
    </div>
  );
}
