"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, MailCheck, ShieldAlert, Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * A single, non-nagging status strip: account problems first, then the one
 * next step that actually unlocks the marketplace for this member.
 */
export default function AccountBanner() {
  const { user, profile, role, isStaff, resendVerification } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || !profile || dismissed) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/onboarding")) return null;

  if (profile.suspended) {
    return (
      <Strip tone="bg-$danger-600" icon={ShieldAlert}>
        <span>
          Your account is suspended and cannot post tasks or send offers. Contact Workly support to resolve this.
        </span>
      </Strip>
    );
  }

  if (!isStaff && !profile.onboarded && pathname !== "/profile") {
    return (
      <Strip tone="bg-ink" icon={Sparkles} onDismiss={() => setDismissed(true)}>
        <span>
          Finish your {role === "freelancer" ? "freelancer" : "client"} profile so Workly can match you properly.
        </span>
        <Link href="/onboarding" className="inline-flex items-center gap-1 font-black underline underline-offset-2">
          Complete setup <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Strip>
    );
  }

  if (!user.emailVerified && user.providerData.some((provider) => provider.providerId === "password")) {
    return (
      <Strip tone="bg-$warning-500" icon={MailCheck} onDismiss={() => setDismissed(true)}>
        <span>Confirm your email address to keep your account secure.</span>
        <button
          onClick={async () => {
            if (sent) return;
            try {
              await resendVerification();
              setSent(true);
              setTimeout(() => setSent(false), 5000);
            } catch (err: any) {
              alert(err.message || "Failed to send verification email.");
            }
          }}
          className="font-black underline underline-offset-2"
        >
          {sent ? "Check your inbox!" : "Resend verification email"}
        </button>
      </Strip>
    );
  }

  if (role === "freelancer" && profile.interviewStatus === "not_started" && pathname !== "/profile/interview") {
    return (
      <Strip tone="bg-brand" icon={AlertTriangle} onDismiss={() => setDismissed(true)}>
        <span>Verified freelancers win more work. Take the short Workly skills interview.</span>
        <Link href="/profile/interview" className="inline-flex items-center gap-1 font-black underline underline-offset-2">
          Start interview <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Strip>
    );
  }

  return null;
}

function Strip({
  tone,
  icon: Icon,
  children,
  onDismiss,
}: {
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div className={`${tone} text-white`}>
      <div className="page-shell flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13px] font-semibold">
        <Icon className="h-4 w-4 shrink-0" />
        {children}
        {onDismiss && (
          <button onClick={onDismiss} aria-label="Dismiss" className="ml-auto rounded-lg p-1 hover:bg-white/15">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
