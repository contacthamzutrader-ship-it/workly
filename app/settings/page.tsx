"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Award,
  Bell,
  BellRing,
  ChevronRight,
  CreditCard,
  Fingerprint,
  History,
  Images,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
} from "lucide-react";
import FreelancerHeader from "@/components/FreelancerHeader";
import MobilePanel from "@/components/settings/MobilePanel";
import EmailPanel from "@/components/settings/EmailPanel";
import VerifyAccountPanel from "@/components/settings/VerifyAccountPanel";
import NotificationSettingsPanel from "@/components/settings/NotificationSettingsPanel";
import TaskerAlertPanel from "@/components/settings/TaskerAlertPanel";
import SkillsPanel from "@/components/settings/SkillsPanel";
import BadgesPanel from "@/components/settings/BadgesPanel";
import PortfolioPanel from "@/components/settings/PortfolioPanel";
import ChangePasswordPanel from "@/components/settings/ChangePasswordPanel";
import PaymentMethodPanel from "@/components/settings/PaymentMethodPanel";
import PaymentHistoryPanel from "@/components/settings/PaymentHistoryPanel";
import IdVerificationPanel from "@/components/settings/IdVerificationPanel";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SettingKey =
  | "mobile"
  | "email"
  | "profile"
  | "verify"
  | "password"
  | "notifications"
  | "tasker-alert"
  | "skills"
  | "badges"
  | "portfolio"
  | "payment-method"
  | "payment-history"
  | "id-verification";

const SECTIONS: { key: SettingKey; label: string; icon: any }[] = [
  { key: "mobile", label: "Mobile", icon: Smartphone },
  { key: "email", label: "Email", icon: Mail },
  { key: "profile", label: "Profile", icon: User },
  { key: "verify", label: "Verify Account", icon: ShieldCheck },
  { key: "password", label: "Change Password", icon: KeyRound },
  { key: "notifications", label: "Notification Settings", icon: Bell },
  { key: "tasker-alert", label: "Tasker Alert", icon: BellRing },
  { key: "skills", label: "Skills", icon: Award },
  { key: "badges", label: "Badges", icon: Sparkles },
  { key: "portfolio", label: "Portfolio", icon: Images },
  { key: "payment-method", label: "Payment Method", icon: CreditCard },
  { key: "payment-history", label: "Payment History", icon: History },
  { key: "id-verification", label: "ID Verification", icon: Fingerprint },
];

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<SettingKey>("mobile");
  const [profile, setProfile] = useState<any>({});

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/settings"); }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfile(d);
        }
      } catch { /* Profile is optional for settings. */ }
    })();
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const profileComplete = Boolean(profile.profileComplete);

  const panelHeader = (icon: any, title: string, sub: string) => (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">{icon}</span>
      <div><h2 className="text-lg font-black tracking-[-0.03em] text-ink">{title}</h2><p className="text-xs font-medium text-ink-400">{sub}</p></div>
    </div>
  );

  const renderSettings = (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-6xl">
        <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="rounded-2xl bg-brand p-3 text-white shadow-card lg:sticky lg:top-[76px]">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {SECTIONS.map((section) => {
                const isActive = section.key === active;
                const outer = `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-bold transition lg:w-full ${
                  isActive ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
                }`;
                return (
                  <button key={section.key} onClick={() => setActive(section.key)} className={outer}>
                    <section.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/70"}`} />
                    <span className="hidden sm:inline">{section.label}</span>
                    <ChevronRight className={`ml-auto h-3.5 w-3.5 lg:block ${isActive ? "text-white" : "text-white/40"} hidden`} />
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            {active === "mobile" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Smartphone className="h-5 w-5" />, "Mobile", "Your registered contact number.")}
                <div className="mt-5"><MobilePanel user={user} /></div>
              </section>
            )}

            {active === "email" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Mail className="h-5 w-5" />, "Email", "The address you use to sign in.")}
                <div className="mt-5"><EmailPanel user={user} /></div>
              </section>
            )}

            {active === "profile" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<User className="h-5 w-5" />, "Profile", "Everything clients see about you.")}
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-ink-50 p-4">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl font-black text-white">{(profile.name || user.email || "U")[0].toUpperCase()}</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-ink">{profile.name || "Your Parwaz profile"}</p>
                    <p className="truncate text-sm font-semibold text-ink-400">{profile.professionalTitle || "Freelancer"}</p>
                    <p className="mt-0.5 text-xs font-medium text-ink-400">{profileComplete ? "Profile complete" : "Profile incomplete"}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-ink-500">Your complete profile includes your photo, professional title, bio, location, skills, experience, education, languages, portfolio, badges and scores. Clients review it before contacting you.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/profile" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700"><Pencil className="h-4 w-4" /> Edit Profile</Link>
                  <Link href="/profile" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-sm font-extrabold text-ink transition hover:bg-ink-50">View full profile <ArrowUpRight className="h-4 w-4" /></Link>
                </div>
              </section>
            )}

            {active === "verify" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<ShieldCheck className="h-5 w-5" />, "Verify Account", "Status of your identity and profile checks.")}
                <div className="mt-5"><VerifyAccountPanel user={user} onGotoMobile={() => setActive("mobile")} onGotoProfile={() => setActive("profile")} /></div>
              </section>
            )}

            {active === "password" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<KeyRound className="h-5 w-5" />, "Change Password", "Set a new password by confirming your current one.")}
                <div className="mt-5"><ChangePasswordPanel user={user} /></div>
              </section>
            )}

            {active === "notifications" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Bell className="h-5 w-5" />, "Notification Settings", "Choose what you want to be notified about.")}
                <div className="mt-5"><NotificationSettingsPanel user={user} /></div>
              </section>
            )}

            {active === "tasker-alert" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<BellRing className="h-5 w-5" />, "Tasker Alert", "Control the tasks and alerts you receive as a freelancer.")}
                <div className="mt-5"><TaskerAlertPanel user={user} /></div>
              </section>
            )}

            {active === "skills" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Award className="h-5 w-5" />, "Skills", "Add, edit or remove the services and tools you offer.")}
                <div className="mt-5"><SkillsPanel user={user} /></div>
              </section>
            )}

            {active === "badges" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Sparkles className="h-5 w-5" />, "Badges", "Milestones that build client trust. Every badge is earned.")}
                <div className="mt-5"><BadgesPanel user={user} /></div>
              </section>
            )}

            {active === "portfolio" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Images className="h-5 w-5" />, "Portfolio", "Show clients the work you have delivered.")}
                <div className="mt-5"><PortfolioPanel user={user} /></div>
              </section>
            )}

            {active === "payment-method" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<CreditCard className="h-5 w-5" />, "Payment Method", "Where your task payments are paid out.")}
                <div className="mt-5"><PaymentMethodPanel user={user} /></div>
              </section>
            )}

            {active === "payment-history" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<History className="h-5 w-5" />, "Payment History", "Every hold, payout and wallet movement.")}
                <div className="mt-5"><PaymentHistoryPanel user={user} /></div>
              </section>
            )}

            {active === "id-verification" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Fingerprint className="h-5 w-5" />, "ID Verification", "Confirm your identity with a government ID.")}
                <div className="mt-5"><IdVerificationPanel user={user} /></div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <FreelancerHeader />
      {renderSettings}
    </div>
  );
}