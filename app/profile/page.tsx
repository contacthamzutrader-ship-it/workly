"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Bell,
  BellRing,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  CreditCard,
  Fingerprint,
  GraduationCap,
  History,
  Images,
  KeyRound,
  Languages,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Percent,
  Save,
  Settings2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listReviewsForUser, type Review } from "@/lib/tasks";
import { uploadProfileImage, withTimeout } from "@/lib/profile-image";
import { getAiResult, computeAiScore } from "@/lib/ai-score";
import { formatPKR } from "@/lib/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MobilePanel from "@/components/settings/MobilePanel";
import EmailPanel from "@/components/settings/EmailPanel";
import VerifyAccountPanel from "@/components/settings/VerifyAccountPanel";
import ChangePasswordPanel from "@/components/settings/ChangePasswordPanel";
import NotificationSettingsPanel from "@/components/settings/NotificationSettingsPanel";
import TaskerAlertPanel from "@/components/settings/TaskerAlertPanel";
import SkillsPanel from "@/components/settings/SkillsPanel";
import BadgesPanel from "@/components/settings/BadgesPanel";
import PortfolioPanel from "@/components/settings/PortfolioPanel";
import PaymentMethodPanel from "@/components/settings/PaymentMethodPanel";
import PaymentHistoryPanel from "@/components/settings/PaymentHistoryPanel";
import IdVerificationPanel from "@/components/settings/IdVerificationPanel";

export default function ProfilePage() {
  const { user, role, loading, setAccountType, interviewPassed } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isTasker, setIsTasker] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [trust, setTrust] = useState<number | null>(null);
  const [skills, setSkills] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [tasksDone, setTasksDone] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [city, setCity] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [languages, setLanguages] = useState("");
  const [accountType, setProfileAccountType] = useState<"customer" | "tasker">("customer");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [availability, setAvailability] = useState("Available now");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [certifications, setCertifications] = useState("");
  const [organization, setOrganization] = useState("");
  const [hiringNeeds, setHiringNeeds] = useState("");
  const [education, setEducation] = useState("");
  const [editing, setEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/profile"); }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!db) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const publicRole = d.role === "tasker" ? "tasker" : "customer";
        setName(d.name ?? ""); setBio(d.bio ?? ""); setIsTasker(publicRole === "tasker"); setProfileAccountType(publicRole); setIsPrivate(d.isPrivate ?? false);
        setAvatarUrl(d.avatarUrl ?? ""); setCity(d.city ?? ""); setHourlyRate(d.hourlyRate ? String(d.hourlyRate) : ""); setLanguages((d.languages || []).join(", "));
        setTrust(typeof d.trustScore === "number" ? d.trustScore : null); setSkills((d.skills || []).join(", "));
        setProfessionalTitle(d.professionalTitle ?? ""); setExperienceYears(d.experienceYears ? String(d.experienceYears) : "");
        setAvailability(d.availability ?? "Available now"); setPortfolioUrl(d.portfolioUrl ?? ""); setCertifications((d.certifications || []).join(", "));
        setOrganization(d.organization ?? ""); setHiringNeeds(d.hiringNeeds ?? ""); setEducation(d.education ?? "");
      }
      setReviews(await listReviewsForUser(user.uid));

      const taskSnap = await getDocs(query(collection(db, "tasks"), where("assignedTo", "==", user.uid)));
      const assigned = taskSnap.docs.map(d => d.data());
      const completed = assigned.filter(t => t.status === "completed" && t.paymentReleased);
      const total = assigned.filter(t => t.status === "completed" || t.status === "cancelled" || t.status === "in_progress");
      if (assigned.length > 0) {
        setTasksDone(completed.length);
        const rate = assigned.filter(t => t.status === "completed" || t.paymentReleased).length / assigned.length;
        setCompletionRate(Math.round(rate * 100));
      }
    })();
  }, [user]);

  if (!user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "\u2014";

  const skillsArr = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const ai = useMemo(() => {
    const stored = getAiResult();
    if (stored) return stored;
    return computeAiScore({ trustScore: trust, bio, skills: skillsArr, professionalTitle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trust, bio, skills, professionalTitle]);

  const badges = [
    { label: "Email verified", earned: user?.emailVerified === true, icon: BadgeCheck },
    { label: "Profile complete", earned: Boolean(name.trim() && bio.trim() && city.trim()), icon: CheckCircle2 },
    { label: "Skills ready", earned: skillsArr.length > 0, icon: Award },
    { label: "Task Pro", earned: tasksDone >= 1, icon: BriefcaseBusiness },
    { label: "Trusted talent", earned: (trust ?? 0) >= 80, icon: Percent },
    { label: "Skill check passed", earned: interviewPassed, icon: GraduationCap },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  const save = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setSaved(false);
    try {
      if (!db) throw new Error("Firebase not configured");
      let uploadedAvatar = avatarUrl;
      if (avatarFile) {
        uploadedAvatar = await uploadProfileImage(user.uid, avatarFile);
      }
      if ((role === "customer" || role === "tasker") && role !== accountType) await setAccountType(accountType);
      const data: any = {
        name, bio, city, avatarUrl: uploadedAvatar,
        profileComplete: Boolean(name.trim() && bio.trim() && city.trim() && (accountType === "customer" || skills.trim())),
        profileUpdatedAt: new Date().toISOString(),
      };
      if (accountType === "tasker") {
        data.skills = skills.split(",").map(s => s.trim()).filter(Boolean);
        data.languages = languages.split(",").map(s => s.trim()).filter(Boolean);
        data.hourlyRate = Math.max(0, Number(hourlyRate) || 0);
        data.professionalTitle = professionalTitle.trim();
        data.experienceYears = Math.max(0, Number(experienceYears) || 0);
        data.availability = availability;
        data.portfolioUrl = portfolioUrl.trim();
        data.certifications = certifications.split(",").map(s => s.trim()).filter(Boolean);
      } else {
        data.organization = organization.trim();
        data.hiringNeeds = hiringNeeds.trim();
      }
      data.education = education.trim();
      if (isAdmin) data.isPrivate = isPrivate;
      await withTimeout(updateDoc(doc(db, "users", user.uid), data), 25000, "Saving is taking too long. Check your connection and try again.");
      setAvatarUrl(uploadedAvatar); setAvatarFile(null); setSaved(true);
    } catch (err: any) { setError(err?.message || "Could not save"); } };

  const pickPhoto = (file?: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setAvatarFile(file);
    setError("");
  };

  const savePhoto = async () => {
    if (!avatarFile || !user) return;
    if (!db) { setError("Photo saving is unavailable right now. Please try again later."); return; }
    setPhotoUpdating(true);
    setError("");
    try {
      const url = await uploadProfileImage(user.uid, avatarFile);
      await withTimeout(updateDoc(doc(db, "users", user.uid), { avatarUrl: url, profileUpdatedAt: new Date().toISOString() }), 15000, "Saving took too long. Check your connection and try again.");
      setAvatarUrl(url);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      setAvatarFile(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Could not save your photo. Try a JPG, PNG or WebP under 5 MB.");
    } finally {
      setPhotoUpdating(false);
    }
  };

  const removePhoto = async () => {
    if (!user) return;
    if (!db) { setError("Photo removal is unavailable right now. Please try again later."); return; }
    setPhotoUpdating(true);
    setError("");
    try {
      await withTimeout(updateDoc(doc(db, "users", user.uid), { avatarUrl: "", profileUpdatedAt: new Date().toISOString() }), 15000, "Saving took too long. Check your connection and try again.");
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setAvatarUrl("");
      setAvatarFile(null);
      setPhotoPreview("");
      if (photoInputRef.current) photoInputRef.current.value = "";
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Could not remove your photo.");
    } finally {
      setPhotoUpdating(false);
    }
  };

  const cancelPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setAvatarFile(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
    setError("");
  };

  const scrollToSection = (id: string) => () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const AccountSection = ({ id, icon, title, sub, children }: { id: string; icon: any; title: string; sub: string; children: React.ReactNode }) => (
    <section id={id} className="card scroll-mt-24 p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">{icon}</span>
        <div><h2 className="text-lg font-black tracking-[-0.03em] text-ink">{title}</h2><p className="text-xs font-medium text-ink-400">{sub}</p></div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4" id="account-profile">
          <div className="shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl font-black text-white">{(name || user.email || "U")[0].toUpperCase()}</span>
            )}
          </div>
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-[28px] font-extrabold tracking-[-0.025em] text-ink sm:text-[32px]">{name || "Your Parwaz profile"}</h1><BadgeCheck className="h-5 w-5 text-brand" /></div><p className="mt-1 text-sm font-medium text-ink-500">{isTasker ? "Available for work - " : ""}{role || "member"}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700"><Pencil className="h-4 w-4" /> Edit Profile</button>
          <Link href={`/u/${user.uid}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink-100 bg-white px-4 text-sm font-semibold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50">View public profile <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-50 text-yellow-500"><Star className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{avg}</p><p className="text-sm text-ink-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p></div></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Shield className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{trust !== null ? trust : "-"}</p><p className="text-sm text-ink-500">Trust Score</p></div></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-600"><Percent className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{completionRate !== null ? `${completionRate}%` : "-"}</p><p className="text-sm text-ink-500">Completion Rate</p></div></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{tasksDone}</p><p className="text-sm text-ink-500">Tasks Done</p></div></div>
        </div>
      </div>

      {editing ? (
      <form onSubmit={save} className="card mt-6 space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Sparkles className="h-4 w-4" /></span><div><h2 className="font-bold text-ink">Profile details</h2><p className="text-xs font-medium text-ink-400">A complete profile ranks better in smart matching</p></div></div>
        {(role === "customer" || role === "tasker") && <div><label className="mb-1.5 block text-sm font-medium text-ink">Account type</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setProfileAccountType("customer"); setIsTasker(false); }} className={`rounded-xl border p-3 text-left text-sm font-extrabold ${accountType === "customer" ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500"}`}>Client<span className="mt-1 block text-[11px] font-medium">Post tasks and hire</span></button><button type="button" onClick={() => { setProfileAccountType("tasker"); setIsTasker(true); }} className={`rounded-xl border p-3 text-left text-sm font-extrabold ${accountType === "tasker" ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500"}`}>Freelancer<span className="mt-1 block text-[11px] font-medium">Find tasks and bid</span></button></div></div>}
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Profile photo</label>
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-canvas p-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="New profile photo preview" className="h-20 w-20 rounded-2xl object-cover" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand text-3xl font-black text-white">{(name || user.email || "U")[0].toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-xs font-extrabold text-ink-600 transition hover:bg-ink-50">
                <Camera className="h-4 w-4 text-brand" /> {avatarUrl || photoPreview ? "Choose a different photo" : "Upload photo"}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              </label>
              {photoPreview && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={savePhoto} disabled={photoUpdating} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-extrabold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-60"><Save className="h-3.5 w-3.5" /> {photoUpdating ? "Saving..." : "Save photo"}</button>
                  <button type="button" onClick={cancelPhoto} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-xs font-extrabold text-ink-600 transition hover:bg-ink-50"><X className="h-3.5 w-3.5" /> Cancel</button>
                </div>
              )}
              {avatarUrl && !photoPreview && (
                <button type="button" onClick={removePhoto} disabled={photoUpdating} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Remove photo</button>
              )}
              <p className="text-xs font-medium text-ink-400">JPG, PNG or WebP under 5 MB. Changes save instantly - the same photo shows in your header and profile everywhere.</p>
            </div>
          </div>
        </div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about yourself..." className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink">City</label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" /></div>
        {accountType === "tasker" ? <><div><label className="mb-1.5 block text-sm font-medium text-ink">Professional title</label><Input value={professionalTitle} onChange={(e) => setProfessionalTitle(e.target.value)} placeholder="e.g. Full-stack developer" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Skills (comma separated)</label><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Shopify, Graphic Design" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-ink">Hourly rate (PKR)</label><Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Experience (years)</label><Input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-ink">Languages</label><Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Urdu, English" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Availability</label><select value={availability} onChange={(e) => setAvailability(e.target.value)} className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink"><option>Available now</option><option>Part-time</option><option>Weekends</option><option>Not available</option></select></div></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Education</label><Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. BS Computer Science, Lahore" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Portfolio URL</label><Input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Certifications</label><Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="e.g. AWS Certified, Google Ads" /></div></> : <><div><label className="mb-1.5 block text-sm font-medium text-ink">Organization</label><Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your company or brand name" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Hiring needs</label><Input value={hiringNeeds} onChange={(e) => setHiringNeeds(e.target.value)} placeholder="e.g. Need a developer for 3 months" /></div></>}
        {isAdmin && <label className="flex items-start gap-3 rounded-2xl bg-[#00501F] p-4 text-sm text-white"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/30 text-brand focus:ring-brand" /><span><span className="block font-extrabold">Internal private provider</span><span className="mt-1 block text-xs leading-5 text-white/50">Hidden from public discovery and available for managed private assignments.</span></span></label>}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">Profile saved successfully!</div>}
        <Button type="submit" className="flex items-center gap-2 rounded-xl"><Save className="h-4 w-4" /> Save profile</Button>
      </form>
      ) : (
        <div className="card mt-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-5">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-card" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl font-black text-white">{(name || user.email || "U")[0].toUpperCase()}</span>
              )}
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.025em] text-ink">{name || "Your Parwaz profile"}</h2>
                <p className="mt-0.5 text-sm font-semibold text-ink-500">{professionalTitle || (isTasker ? "Freelancer" : "Member")}{city ? ` \u00b7 ${city}` : ""}</p>
                <p className="mt-0.5 text-xs font-medium text-ink-400">{isTasker ? (availability || "Available now") : "Look what our clients need"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700"><Pencil className="h-4 w-4" /> Edit Profile</button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ink-400">About</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">{bio || "No bio yet - tell clients what you can help with."}</p>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ink-400">Details</p>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-100 p-3.5"><dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400"><BriefcaseBusiness className="h-3.5 w-3.5" /> Experience</dt><dd className="mt-1 text-sm font-bold text-ink">{experienceYears ? `${experienceYears} year${experienceYears !== "1" ? "s" : ""}` : "Not set"}</dd></div>
                  <div className="rounded-xl border border-ink-100 p-3.5"><dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400"><Languages className="h-3.5 w-3.5" /> Languages</dt><dd className="mt-1 text-sm font-bold text-ink">{languages || "Not set"}</dd></div>
                  <div className="rounded-xl border border-ink-100 p-3.5"><dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400"><GraduationCap className="h-3.5 w-3.5" /> Education</dt><dd className="mt-1 text-sm font-bold text-ink">{education || "Not set"}</dd></div>
                  <div className="rounded-xl border border-ink-100 p-3.5"><dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400"><MapPin className="h-3.5 w-3.5" /> Location</dt><dd className="mt-1 text-sm font-bold text-ink">{city || "Not set"}</dd></div>
                  <div className="rounded-xl border border-ink-100 p-3.5"><dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400"><Sparkles className="h-3.5 w-3.5" /> Hourly rate</dt><dd className="mt-1 text-sm font-bold text-ink">{hourlyRate ? `${formatPKR(Math.max(0, Number(hourlyRate) || 0))}/hr` : "Not set"}</dd></div>
                  <div className="rounded-xl border border-ink-100 p-3.5"><dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400"><Link2 className="h-3.5 w-3.5" /> Portfolio</dt><dd className="mt-1 text-sm font-bold text-ink">{portfolioUrl ? <a href={portfolioUrl} target="_blank" rel="noreferrer" className="text-brand underline decoration-brand/30 underline-offset-2">{portfolioUrl.replace(/^https?:\/\//, "").slice(0, 32)}</a> : "Not set"}</dd></div>
                </dl>
              </div>

              {skillsArr.length > 0 && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ink-400">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{skillsArr.map((skill) => <span key={skill} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-dark">{skill}</span>)}</div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ink-400">Badges ({earnedCount}/{badges.length})</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${b.earned ? "bg-green-50 text-green-700" : "bg-ink-50 text-ink-300"}`}><b.icon className="h-3.5 w-3.5" /> {b.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-fit rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand" /><p className="page-eyebrow">AI skill score</p></div>
              <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] text-ink">{ai.skillScore}</p>
              <p className="mt-2 text-xs leading-5 text-ink-500">Computed from your skills, bio and trust score. Improves how often your offers are recommended first.</p>
              <Link href="/interview" className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-bold text-white transition hover:bg-brand-700">Improve skill check <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white"><Settings2 className="h-5 w-5" /></span>
          <div><h2 className="text-xl font-black tracking-[-0.03em] text-ink">Account &amp; settings</h2><p className="text-sm text-ink-400">Everything about your account - all in one place.</p></div>
        </div>
        <div className="mt-6 space-y-6">
          <AccountSection id="mobile" icon={<Smartphone className="h-5 w-5" />} title="Mobile" sub="Your registered contact number."><MobilePanel user={user} /></AccountSection>
          <AccountSection id="email" icon={<Mail className="h-5 w-5" />} title="Email" sub="The address you use to sign in."><EmailPanel user={user} /></AccountSection>
          <AccountSection id="verify" icon={<ShieldCheck className="h-5 w-5" />} title="Verify Account" sub="Status of your identity and profile checks."><VerifyAccountPanel user={user} onGotoMobile={scrollToSection("mobile")} onGotoProfile={scrollToSection("account-profile")} /></AccountSection>
          <AccountSection id="password" icon={<KeyRound className="h-5 w-5" />} title="Change Password" sub="Set a new password by confirming your current one."><ChangePasswordPanel user={user} /></AccountSection>
          <AccountSection id="notifications" icon={<Bell className="h-5 w-5" />} title="Notification Settings" sub="Choose what you want to be notified about."><NotificationSettingsPanel user={user} /></AccountSection>
          <AccountSection id="tasker-alert" icon={<BellRing className="h-5 w-5" />} title="Tasker Alert" sub="Control the tasks and alerts you receive as a freelancer."><TaskerAlertPanel user={user} /></AccountSection>
          <AccountSection id="skills" icon={<Award className="h-5 w-5" />} title="Skills" sub="Add, edit or remove the services and tools you offer."><SkillsPanel user={user} /></AccountSection>
          <AccountSection id="badges" icon={<Sparkles className="h-5 w-5" />} title="Badges" sub="Milestones that build client trust. Every badge is earned."><BadgesPanel user={user} /></AccountSection>
          <AccountSection id="portfolio" icon={<Images className="h-5 w-5" />} title="Portfolio" sub="Show clients the work you have delivered."><PortfolioPanel user={user} /></AccountSection>
          <AccountSection id="payment-method" icon={<CreditCard className="h-5 w-5" />} title="Payment Method" sub="Where your task payments are paid out."><PaymentMethodPanel user={user} /></AccountSection>
          <AccountSection id="payment-history" icon={<History className="h-5 w-5" />} title="Payment History" sub="Every hold, payout and wallet movement."><PaymentHistoryPanel user={user} /></AccountSection>
          <AccountSection id="id-verification" icon={<Fingerprint className="h-5 w-5" />} title="ID Verification" sub="Confirm your identity with a government ID."><IdVerificationPanel user={user} /></AccountSection>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold text-ink">Reviews</h2>
          <div className="mt-4 space-y-3">{reviews.map(r => (
            <div key={r.id} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2"><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div><span className="text-sm font-semibold text-ink">{r.fromName}</span></div>
              {r.comment && <p className="mt-2 text-sm text-ink-500">{r.comment}</p>}
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}