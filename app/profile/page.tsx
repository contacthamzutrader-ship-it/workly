"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Star, Shield, Save, Key, CheckCircle2, Percent, Sparkles, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import { listReviewsForUser, type Review } from "@/lib/tasks";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilePage() {
  const { user, role, loading, setAccountType } = useAuth();
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
        setOrganization(d.organization ?? ""); setHiringNeeds(d.hiringNeeds ?? "");
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

  const save = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setSaved(false);
    try {
      if (!db) throw new Error("Firebase not configured");
      let uploadedAvatar = avatarUrl;
      if (avatarFile) {
        if (!avatarFile.type.startsWith("image/") || avatarFile.size > 5 * 1024 * 1024) throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
        try {
          if (!storage) throw new Error("Storage unavailable");
          const avatarRef = ref(storage, `profile-images/${user.uid}/avatar`);
          await uploadBytes(avatarRef, avatarFile, { contentType: avatarFile.type });
          uploadedAvatar = await getDownloadURL(avatarRef);
        } catch {
          uploadedAvatar = await compactProfileImage(avatarFile);
        }
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
      if (isAdmin) data.isPrivate = isPrivate;
      await updateDoc(doc(db, "users", user.uid), data); setAvatarUrl(uploadedAvatar); setAvatarFile(null); setSaved(true);
    } catch (err: any) { setError(err?.message || "Could not save"); } };

  const changePassword = async () => {
    if (!user?.email || !auth) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setError("");
      setSaved(true);
      alert("Password reset link sent to your email!");
    } catch (err: any) {
      setError(err?.message || "Could not send reset email");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl font-black">{(name || user.email || "U")[0].toUpperCase()}</span>}
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black tracking-[-0.03em]">{name || "Your Workly profile"}</h1><BadgeCheck className="h-5 w-5 text-brand-light" /></div><p className="mt-1 text-sm font-medium text-white/50">{isTasker ? "Available for work - " : ""}{role || "member"}</p></div>
          </div>
          <Link href={`/u/${user.uid}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-brand-100">View public profile <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-50 text-yellow-500"><Star className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{avg}</p><p className="text-xs text-ink-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p></div></div>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Shield className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{trust !== null ? trust : "-"}</p><p className="text-xs text-ink-500">Trust Score</p></div></div>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-600"><Percent className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{completionRate !== null ? `${completionRate}%` : "-"}</p><p className="text-xs text-ink-500">Completion Rate</p></div></div>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{tasksDone}</p><p className="text-xs text-ink-500">Tasks Done</p></div></div>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Sparkles className="h-4 w-4" /></span><div><h2 className="font-black text-ink">Profile details</h2><p className="text-xs font-medium text-ink-400">A complete profile ranks better in smart matching</p></div></div>
        {(role === "customer" || role === "tasker") && <div><label className="mb-1.5 block text-sm font-medium text-ink">Account type</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setProfileAccountType("customer"); setIsTasker(false); }} className={`rounded-xl border p-3 text-left text-sm font-extrabold ${accountType === "customer" ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500"}`}>Client<span className="mt-1 block text-[11px] font-medium">Post tasks and hire</span></button><button type="button" onClick={() => { setProfileAccountType("tasker"); setIsTasker(true); }} className={`rounded-xl border p-3 text-left text-sm font-extrabold ${accountType === "tasker" ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500"}`}>Freelancer<span className="mt-1 block text-[11px] font-medium">Find tasks and bid</span></button></div></div>}
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Profile photo</label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-200 p-4 text-sm font-semibold text-ink-500 hover:border-brand"><Camera className="h-5 w-5 text-brand" /><span>{avatarFile ? avatarFile.name : "Upload JPG, PNG or WebP (max 5 MB)"}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} /></label></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about yourself..." className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink">City</label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" /></div>
        {accountType === "tasker" ? <><div><label className="mb-1.5 block text-sm font-medium text-ink">Professional title</label><Input value={professionalTitle} onChange={(e) => setProfessionalTitle(e.target.value)} placeholder="e.g. Full-stack developer" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Skills (comma separated)</label><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Shopify, Graphic Design" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-ink">Hourly rate (PKR)</label><Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Experience (years)</label><Input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-ink">Languages</label><Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Urdu, English" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Availability</label><select value={availability} onChange={(e) => setAvailability(e.target.value)} className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink"><option>Available now</option><option>Part-time</option><option>Weekends</option><option>Not available</option></select></div></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Portfolio URL</label><Input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">Certifications (comma separated)</label><Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="Google UX, AWS, TEVTA" /></div></> : <><div><label className="mb-1.5 block text-sm font-medium text-ink">Company / organization (optional)</label><Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your company or team" /></div><div><label className="mb-1.5 block text-sm font-medium text-ink">What do you usually hire for?</label><textarea value={hiringNeeds} onChange={(e) => setHiringNeeds(e.target.value)} rows={3} placeholder="Tell freelancers what kind of help you need..." className="w-full rounded-xl border border-ink-200 px-4 py-3 text-sm text-ink" /></div></>}
        {isAdmin && <label className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-sm text-white"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/30 text-brand focus:ring-brand" /><span><span className="block font-extrabold">Internal private provider</span><span className="mt-1 block text-xs leading-5 text-white/50">Hidden from public discovery and available for managed private assignments.</span></span></label>}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">Profile saved successfully!</div>}
        <Button type="submit" className="flex items-center gap-2 rounded-xl"><Save className="h-4 w-4" /> Save profile</Button>

        <div className="border-t border-ink-100 pt-5">
          <p className="text-sm font-medium text-ink mb-2">Change Password</p>
          <p className="text-xs text-ink-500 mb-3">A reset link will be sent to {user.email}</p>
          <button type="button" onClick={changePassword} className="flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink-50">
            <Key className="h-4 w-4" /> Send reset link
          </button>
        </div>
      </form>

      {reviews.length > 0 && (
        <div className="mt-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
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

async function compactProfileImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const value = new Image();
      value.onload = () => resolve(value);
      value.onerror = () => reject(new Error("The selected image could not be read."));
      value.src = objectUrl;
    });
    const maxSide = 512;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is not supported in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = canvas.toDataURL("image/jpeg", 0.76);
    if (encoded.length > 700_000) throw new Error("Please choose a simpler or smaller profile image.");
    return encoded;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
