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
  BriefcaseBusiness,
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
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendPasswordResetEmail, updateEmail, sendEmailVerification } from "firebase/auth";
import { subscribeNotifications, type AppNotification } from "@/lib/notifications";
import { listTasksAssignedTo } from "@/lib/tasks";
import { formatDate } from "@/lib/format";

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

const TASKER_ALERT_TYPES = ["selected", "private_assignment", "payment_released"];

function isTaskerAlert(n: AppNotification) {
  return TASKER_ALERT_TYPES.includes(n.type) || /(offer|assigned|payment)/i.test(n.title || "");
}

export default function SettingsPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<SettingKey>("mobile");
  const [profile, setProfile] = useState<any>({});
  const [assignedCount, setAssignedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);

  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  const [passwordSent, setPasswordSent] = useState(false);

  const [skillsDraft, setSkillsDraft] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [skillsSaved, setSkillsSaved] = useState(false);

  const [portfolioDraft, setPortfolioDraft] = useState("");
  const [portfolioError, setPortfolioError] = useState("");
  const [portfolioSaved, setPortfolioSaved] = useState(false);

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
          setSkillsDraft((d.skills || []).join(", "));
          setPortfolioDraft(d.portfolioUrl ?? "");
        }
      } catch { /* Profile is optional for settings. */ }
      try {
        const assigned = await listTasksAssignedTo(user.uid);
        setAssignedCount(assigned.length);
        setCompletedCount(assigned.filter((t) => t.status === "completed").length);
      } catch { /* Stats are secondary. */ }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      return subscribeNotifications(user.uid, (next) => setItems(next));
    } catch { /* Notifications are optional. */ }
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

  const sendPasswordLink = async () => {
    if (!user?.email || !auth) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordSent(true);
    } catch (err: any) {
      setPasswordSent(false);
      setEmailError(err?.message || "Could not send the reset link.");
    }
  };

  const saveSkills = async () => {
    if (!user || !db) return;
    const skills = skillsDraft.split(",").map((s) => s.trim()).filter(Boolean);
    if (skills.length > 30) {
      setSkillsError("Keep it focused - a maximum of 30 skills.");
      setSkillsSaved(false);
      return;
    }
    setSkillsError("");
    try {
      await updateDoc(doc(db, "users", user.uid), { skills });
      setProfile((p: any) => ({ ...p, skills }));
      setSkillsSaved(true);
    } catch (err: any) {
      setSkillsError(err?.message || "Could not save your skills.");
    }
  };

  const savePortfolio = async () => {
    if (!user || !db) return;
    const url = portfolioDraft.trim();
    if (url && (url.length > 300 || !/^https?:\/\//i.test(url))) {
      setPortfolioError("Enter a valid link that starts with http:// or https://");
      setPortfolioSaved(false);
      return;
    }
    setPortfolioError("");
    try {
      await updateDoc(doc(db, "users", user.uid), { portfolioUrl: url });
      setProfile((p: any) => ({ ...p, portfolioUrl: url }));
      setPortfolioSaved(true);
    } catch (err: any) {
      setPortfolioError(err?.message || "Could not save your portfolio link.");
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
  const skillsList = Array.isArray(profile.skills) ? profile.skills : [];
  const trustScore = typeof profile.trustScore === "number" ? profile.trustScore : null;
  const interviewPassed = Boolean(profile.interviewPassed);
  const profileComplete = Boolean(profile.profileComplete);

  const badges = [
    { key: "email", label: "Email verified", desc: "Your email address is confirmed.", earned: emailVerified, icon: Mail },
    { key: "complete", label: "Profile complete", desc: "Name, bio and city are filled in.", earned: profileComplete, icon: User },
    { key: "first", label: "First assignment", desc: "A client assigned you a task.", earned: assignedCount > 0, icon: BriefcaseBusiness },
    { key: "pro", label: "Task Pro", desc: "You completed a task end to end.", earned: completedCount > 0, icon: CheckCircle2 },
    { key: "trusted", label: "Trusted talent", desc: "Reach a trust score of 80+.", earned: (trustScore ?? 0) >= 80, icon: ShieldCheck },
    { key: "verified", label: "Verified talent", desc: "Pass the skill check and complete work.", earned: interviewPassed && completedCount > 0, icon: BadgeCheck },
  ];
  const earnedBadges = badges.filter((b) => b.earned).length;

  const alerts = items.filter(isTaskerAlert);

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
                const isActive = section.key === active;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActive(section.key)}
                    className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-bold transition lg:w-full ${
                      isActive ? "bg-brand-50 text-brand-dark" : "text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    <section.icon className={`h-4 w-4 ${isActive ? "text-brand" : "text-ink-400"}`} />
                    <span className="hidden sm:inline">{section.label}</span>
                    <ChevronRight className={`ml-auto h-3.5 w-3.5 lg:block ${isActive ? "text-brand" : "text-ink-300"} hidden`} />
                  </button>
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

            {active === "password" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<KeyRound className="h-5 w-5" />, "Change Password", "Reset your sign-in password securely.")}
                <p className="mt-4 text-sm leading-6 text-ink-500">A reset link is emailed to <span className="font-bold text-ink">{user.email}</span>. Click it to choose a new password. The old password stops working immediately.</p>
                <div className="mt-5 flex items-center gap-2">
                  <button onClick={sendPasswordLink} disabled={passwordSent} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"><Mail className="h-4 w-4" /> {passwordSent ? "Reset link sent" : "Send reset link"}</button>
                </div>
                {emailError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{emailError}</div>}
              </section>
            )}

            {active === "notifications" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Bell className="h-5 w-5" />, "Notification Settings", "Recent activity across the platform.")}
                <p className="mt-4 text-sm leading-6 text-ink-500">Offers, assignments and payment updates appear in your notification centre the moment they happen.</p>
                <div className="mt-4 space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 py-8 text-center"><Bell className="mx-auto h-6 w-6 text-ink-300" /><p className="mt-2 text-sm font-bold text-ink">No notifications yet</p><p className="mt-1 text-xs text-ink-400">Your latest activity will show up here.</p></div>
                  ) : (
                    items.slice(0, 4).map((n) => (
                      <Link key={n.id} href={n.link || "/notifications"} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-brand/30">
                        <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand"><Bell className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{n.title}</p><p className="truncate text-xs text-ink-400">{n.body} &middot; {formatDate(n.createdAt)}</p></div></div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                      </Link>
                    ))
                  )}
                </div>
                <Link href="/notifications" className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand">Open notification centre <ArrowUpRight className="h-4 w-4" /></Link>
              </section>
            )}

            {active === "tasker-alert" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<BellRing className="h-5 w-5" />, "Tasker Alert", "Important alerts about your offers and payouts.")}
                <p className="mt-4 text-sm leading-6 text-ink-500">Bid acceptances, new private assignments and released payments are shown here first.</p>
                <div className="mt-4 space-y-2">
                  {alerts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 py-8 text-center"><BellRing className="mx-auto h-6 w-6 text-ink-300" /><p className="mt-2 text-sm font-bold text-ink">No tasker alerts yet</p><p className="mt-1 text-xs text-ink-400">Watch your inbox - alerts appear the moment a client reacts to your offer.</p></div>
                  ) : (
                    alerts.slice(0, 6).map((n) => (
                      <Link key={n.id} href={n.link || "/notifications"} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-brand/30">
                        <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><BellRing className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{n.title}</p><p className="truncate text-xs text-ink-400">{n.body} &middot; {formatDate(n.createdAt)}</p></div></div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                      </Link>
                    ))
                  )}
                </div>
                <Link href="/notifications" className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand">Manage all alerts <ArrowUpRight className="h-4 w-4" /></Link>
              </section>
            )}

            {active === "skills" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Award className="h-5 w-5" />, "Skills", "The services and tools you offer.")}
                <div className="mt-5">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Skills (comma separated)</label>
                  <textarea value={skillsDraft} onChange={(e) => setSkillsDraft(e.target.value)} rows={3} placeholder="e.g. Web Development, React, WordPress, Graphic Design" className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </div>
                {skillsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skillsList.map((skill: string) => <span key={skill} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-dark">{skill}</span>)}
                  </div>
                )}
                <p className="mt-2 text-xs leading-5 text-ink-400">Skills power your AI match score and help clients find you faster. Maximum 30.</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={saveSkills} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save skills</button>
                  {skillsSaved && <span className="text-sm font-bold text-green-600">Skills saved.</span>}
                </div>
                {skillsError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{skillsError}</div>}
              </section>
            )}

            {active === "badges" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Sparkles className="h-5 w-5" />, "Badges", "Milestones that build client trust.")}
                <p className="mt-4 text-sm leading-6 text-ink-500">You have earned <span className="font-black text-ink">{earnedBadges}</span> of {badges.length} badges. Badges update automatically as you use the platform.</p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {badges.map((b) => (
                    <div key={b.key} className={`rounded-2xl border p-4 ${b.earned ? "border-green-200 bg-green-50/60" : "border-ink-100 bg-ink-50/40"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-10 place-items-center rounded-xl ${b.earned ? "bg-green-600 text-white" : "bg-ink-100 text-ink-300"}`}>{b.earned ? <b.icon className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</span>
                        <div><p className="text-sm font-black text-ink">{b.label}</p><p className="mt-0.5 text-xs leading-5 text-ink-400">{b.desc}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {active === "portfolio" && (
              <section className="surface p-6 sm:p-7">
                {panelHeader(<Images className="h-5 w-5" />, "Portfolio", "A link to your best work.")}
                <div className="mt-5">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Portfolio URL</label>
                  <input value={portfolioDraft} onChange={(e) => setPortfolioDraft(e.target.value)} type="url" placeholder="https://yourportfolio.com" className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20" />
                  <p className="mt-2 text-xs leading-5 text-ink-400">Clients can open your work samples from your public profile.</p>
                </div>
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-extrabold text-brand transition hover:bg-brand-50">Open current portfolio <ArrowUpRight className="h-4 w-4" /></a>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={savePortfolio} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save portfolio</button>
                  {portfolioSaved && <span className="text-sm font-bold text-green-600">Portfolio saved.</span>}
                </div>
                {portfolioError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{portfolioError}</div>}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}