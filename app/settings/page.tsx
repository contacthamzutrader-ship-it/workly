"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Bell,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Images,
  KeyRound,
  Mail,
  Pencil,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { updateEmail, sendEmailVerification } from "firebase/auth";

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
  | "portfolio";

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
];

const DEDICATED: Partial<Record<SettingKey, string>> = {
  password: "/change-password",
  notifications: "/notification-settings",
  "tasker-alert": "/tasker-alert",
  skills: "/skills",
  badges: "/badges",
  portfolio: "/portfolio",
};

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<SettingKey>("mobile");
  const [profile, setProfile] = useState<any>({});

  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  const [verifySent, setVerifySent] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/settings"); }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfile(d);
          setPhoneDraft(d.phone ?? "");
          setEmailDraft(d.email ?? user.email ?? "");
        }
      } catch { /* Profile is optional for settings. */ }
    })();
  }, [user]);

  const saveMobile = async () => {
    if (!user || !db) return;
    const cleaned = phoneDraft.trim();
    if (!/^(\+92|0)?3\d{9}$/.test(cleaned)) {
      setPhoneError("Enter a valid Pakistan mobile number, e.g. 03001234567.");
      setPhoneSaved(false);
      return;
    }
    setPhoneError("");
    try {
      await updateDoc(doc(db, "users", user.uid), { phone: cleaned });
      setProfile((p: any) => ({ ...p, phone: cleaned }));
      setPhoneSaved(true);
    } catch (err: any) {
      setPhoneError(err?.message || "Could not save your mobile number.");
    }
  };

  const changeEmail = async () => {
    if (!user || !db) return;
    const next = emailDraft.trim();
    if (!next || !/.+@.+\..+/.test(next)) {
      setEmailError("Enter a valid email address.");
      setEmailStatus("");
      return;
    }
    if (next.toLowerCase() === (user.email || "").toLowerCase()) {
      setEmailError("Enter a different email address to change it.");
      setEmailStatus("");
      return;
    }
    setEmailError("");
    try {
      const current = auth?.currentUser;
      if (!current) throw new Error("Sign in again before changing your email.");
      await updateEmail(current, next);
      await sendEmailVerification(current);
      await updateDoc(doc(db, "users", user.uid), { email: next });
      setEmailStatus("Verification email sent. Confirm it to finish changing your address.");
      setEmailDraft(next);
    } catch (err: any) {
      const code = err?.code || "";
      if (code.includes("requires-recent-login")) {
        setEmailError("For security, sign out and sign back in, then try again.");
      } else {
        setEmailError(err?.message || "Could not update your email.");
      }
      setEmailStatus("");
    }
  };

  const sendVerifyEmail = async () => {
    const current = auth?.currentUser;
    if (!current) return;
    try {
      await sendEmailVerification(current);
      setVerifySent(true);
    } catch (err: any) {
      setVerifySent(false);
      setEmailError(err?.message || "Could not send the verification email.");
    }
  };

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const emailVerified = user.emailVerified;
  const interviewPassed = Boolean(profile.interviewPassed);
  const profileComplete = Boolean(profile.profileComplete);

  const panelHeader = (icon: any, title: string, sub: string) => (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">{icon}</span>
      <div><h2 className="text-lg font-black tracking-[-0.03em] text-ink">{title}</h2><p className="text-xs font-medium text-ink-400">{sub}</p></div>
    </div>
  );

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-6xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Settings2 className="h-7 w-7" /></div>
              <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Account centre</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Account &amp; Settings</h1><p className="mt-1 text-sm text-white/55">Manage your contact details, security, alerts and professional profile.</p></div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65"><Settings2 className="h-4 w-4 text-brand-300" /> {SECTIONS.length} settings</div>
          </div>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav className="rounded-3xl border border-ink-100 bg-white p-3 shadow-card lg:sticky lg:top-6">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {SECTIONS.map((section) => {
                const target = DEDICATED[section.key];
                const isActive = section.key === active;
                const outer = `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-bold transition lg:w-full ${
                  isActive ? "bg-brand-50 text-brand-dark" : "text-ink-600 hover:bg-ink-50"
                }`;
                const inner = (<>
                  <section.icon className={`h-4 w-4 ${isActive ? "text-brand" : "text-ink-400"}`} />
                  <span className="hidden sm:inline">{section.label}</span>
                  <ChevronRight className={`ml-auto h-3.5 w-3.5 lg:block ${isActive ? "text-brand" : "text-ink-300"} hidden`} />
                </>);
                return target ? (
                  <Link key={section.key} href={target} className={outer}>{inner}</Link>
                ) : (
                  <button key={section.key} onClick={() => setActive(section.key)} className={outer}>{inner}</button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 space-y-5">
            {active === "mobile" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Smartphone className="h-5 w-5" />, "Mobile", "Your registered contact number.")}
                <div className="mt-5">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Mobile number</label>
                  <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} inputMode="tel" placeholder="03001234567" className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                  <p className="mt-2 text-xs leading-5 text-ink-400">Shown only to the clients who hire you, and used for payment alerts. No OTP is sent - the number acts as your contact detail.</p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={saveMobile} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save number</button>
                  {phoneSaved && <span className="text-sm font-bold text-green-600">Number saved.</span>}
                </div>
                {phoneError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{phoneError}</div>}
              </section>
            )}

            {active === "email" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Mail className="h-5 w-5" />, "Email", "The address you use to sign in.")}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${emailVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}><BadgeCheck className="h-3.5 w-3.5" /> {emailVerified ? "Verified" : "Not verified"}</span>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Email address</label>
                  <input value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} type="email" className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </div>
                <p className="mt-2 text-xs leading-5 text-ink-400">After saving, a verification link is sent to the new address before it becomes active.</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button onClick={changeEmail} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save email</button>
                  {emailStatus && <span className="text-sm font-bold text-green-600">{emailStatus}</span>}
                </div>
                {emailError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{emailError}</div>}
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
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${emailVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{emailVerified ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">Email address</p><p className="text-xs text-ink-400">{emailVerified ? "Verified" : user.email || "Not verified yet"}</p></div></div>
                    {!emailVerified && <button onClick={sendVerifyEmail} className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Resend link</button>}
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${profile.phone ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{profile.phone ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">Mobile number</p><p className="text-xs text-ink-400">{profile.phone ? profile.phone : "Not added yet"}</p></div></div>
                    <button onClick={() => setActive("mobile")} className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Add now</button>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${profileComplete ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{profileComplete ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">Profile completeness</p><p className="text-xs text-ink-400">{profileComplete ? "Name, bio and city added" : "Add name, bio and city"}</p></div></div>
                    <button onClick={() => setActive("profile")} className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Complete</button>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${interviewPassed ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{interviewPassed ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span><div><p className="text-sm font-bold text-ink">AI skill check</p><p className="text-xs text-ink-400">{interviewPassed ? "Assessment passed" : "Take the short assessment"}</p></div></div>
                    {!interviewPassed && <Link href="/interview" className="shrink-0 rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-extrabold text-brand transition hover:bg-brand-50">Take check</Link>}
                  </div>
                </div>
                {verifySent && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600">Verification email sent. Check your inbox.</div>}
                {!emailVerified && !verifySent && emailError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{emailError}</div>}
              </section>
            )}

            {(active === "password" || active === "notifications" || active === "tasker-alert" || active === "skills" || active === "badges" || active === "portfolio") && (
              <section className="surface p-6 sm:p-7">
                {(() => {
                  const meta = SECTIONS.find((s) => s.key === active)!;
                  return panelHeader(<meta.icon className="h-5 w-5" />, meta.label, "Managed on a dedicated page");
                })()}
                <p className="mt-4 text-sm leading-6 text-ink-500">
                  {active === "password" && "Set a new password by confirming your current one. Includes visibility toggles, validation and minimum requirements."}
                  {active === "notifications" && "Toggle new task, offer, project, payment, message and system notifications. Preferences are saved to your account."}
                  {active === "tasker-alert" && "Enable or pause task alerts, choose your preferred categories from the live task catalogue and control offer, assignment and payout alerts."}
                  {active === "skills" && "Add, edit or remove the skills you offer and view your existing AI skill assessment."}
                  {active === "badges" && "Review the badges you have earned from real activity, with descriptions and where available the date they were awarded."}
                  {active === "portfolio" && "Showcase your projects with titles, descriptions, skills, images and links. Add, edit or delete each project."}
                </p>
                <div className="mt-5">
                  <Link href={DEDICATED[active]!} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]">Open {SECTIONS.find((s) => s.key === active)!.label} page <ArrowUpRight className="h-4 w-4" /></Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}