"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Camera,
  CheckCircle2,
  Percent,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, listReviewsForUser, type Review } from "@/lib/tasks";
import { hasPermission, MEMBER_ROLE_LABELS } from "@/lib/roles";
import { interviewStatusLabel, interviewStatusTone, type InterviewStatus } from "@/lib/interview";
import Button from "@/components/ui/Button";
import Input, { Field, Select, Textarea } from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import { Alert, PageLoader } from "@/components/ui/Feedback";
import { Stat } from "@/components/ui/Badge";

const AVAILABILITY = ["Available now", "Part-time", "Weekends only", "Booked until further notice"];

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function ProfilePage() {
  const { user, profile, role, staff, isStaff, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [professionalTitle, setProfessionalTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState("");
  const [availability, setAvailability] = useState(AVAILABILITY[0]);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [certifications, setCertifications] = useState("");

  const [organization, setOrganization] = useState("");
  const [hiringNeeds, setHiringNeeds] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [trust, setTrust] = useState<number | null>(null);
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [tasksDone, setTasksDone] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>("not_started");
  const [interviewScore, setInterviewScore] = useState<number | null>(null);
  const [interviewSummary, setInterviewSummary] = useState("");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/profile");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      const snapshot = await getDoc(doc(db!, "users", user.uid));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setName(data.name || "");
        setBio(data.bio || "");
        setCity(data.city || "");
        setAvatarUrl(data.avatarUrl || "");
        setProfessionalTitle(data.professionalTitle || "");
        setSkills(Array.isArray(data.skills) ? data.skills : []);
        setHourlyRate(data.hourlyRate ? String(data.hourlyRate) : "");
        setExperienceYears(data.experienceYears ? String(data.experienceYears) : "");
        setLanguages((data.languages || []).join(", "));
        setAvailability(data.availability || AVAILABILITY[0]);
        setPortfolioUrl(data.portfolioUrl || "");
        setCertifications((data.certifications || []).join(", "));
        setOrganization(data.organization || "");
        setHiringNeeds(data.hiringNeeds || "");
        setIsPrivate(data.isPrivate === true);
        setTrust(typeof data.trustScore === "number" ? data.trustScore : null);
        setInterviewStatus(data.interviewStatus || "not_started");
        setInterviewScore(typeof data.interviewScore === "number" ? data.interviewScore : null);
        setInterviewSummary(data.interviewSummary || "");
      }

      setReviews(await listReviewsForUser(user.uid).catch(() => []));

      try {
        const assignedSnapshot = await getDocs(query(collection(db!, "tasks"), where("assignedTo", "==", user.uid)));
        const assigned = assignedSnapshot.docs.map((item) => item.data());
        if (assigned.length > 0) {
          const completed = assigned.filter((item) => item.status === "completed");
          setTasksDone(completed.length);
          setCompletionRate(Math.round((completed.length / assigned.length) * 100));
        }
      } catch {
        // Non-critical stats.
      }
    })();
  }, [user]);

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview]
  );

  if (loading || !user) return <PageLoader />;

  const isFreelancer = role === "freelancer";
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const pickAvatar = (file: File | null) => {
    setAvatarFile(file);
    setAvatarPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : "";
    });
  };

  const toggleSkill = (skill: string) =>
    setSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : current.length < 10 ? [...current, skill] : current
    );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);

    try {
      if (!db) throw new Error("Workly is not connected to Firebase.");

      const normalizedName = normalizeName(name);
      const normalizedCity = city.trim();
      const normalizedBio = bio.trim();
      const normalizedTitle = professionalTitle.trim();
      const rate = hourlyRate.trim() ? Number(hourlyRate) : 0;
      const years = experienceYears.trim() ? Number(experienceYears) : 0;

      if (normalizedName.length < 2 || normalizedName.length > 80) {
        throw new Error("Enter your real full name using 2 to 80 characters.");
      }
      if (normalizedCity.length < 2 || normalizedCity.length > 100) {
        throw new Error("Enter a valid city or location.");
      }
      if (normalizedBio.length < 20 || normalizedBio.length > 600) {
        throw new Error("Your profile introduction must be between 20 and 600 characters.");
      }
      if (isFreelancer && normalizedTitle.length < 3) {
        throw new Error("Add a clear professional title before saving your freelancer profile.");
      }
      if (isFreelancer && skills.length === 0) {
        throw new Error("Select at least one service category before saving your freelancer profile.");
      }
      if (!Number.isFinite(rate) || rate < 0 || rate > 1_000_000) {
        throw new Error("Enter a valid hourly rate between 0 and 1,000,000 PKR.");
      }
      if (!Number.isFinite(years) || years < 0 || years > 80) {
        throw new Error("Enter a valid number of years of experience.");
      }
      if (!isHttpUrl(portfolioUrl)) {
        throw new Error("Enter a valid portfolio URL beginning with http:// or https://.");
      }

      let uploadedAvatar = avatarUrl;
      if (avatarFile) {
        if (!avatarFile.type.startsWith("image/") || avatarFile.size > 5 * 1024 * 1024) {
          throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
        }
        if (!storage) throw new Error("Profile photo storage is not configured yet.");
        try {
          const avatarRef = ref(storage, `profile-images/${user.uid}/avatar`);
          await uploadBytes(avatarRef, avatarFile, { contentType: avatarFile.type });
          uploadedAvatar = await getDownloadURL(avatarRef);
        } catch {
          throw new Error("We could not upload your profile photo. Please retry with a JPG, PNG or WebP image under 5 MB.");
        }
      }

      const data: Record<string, unknown> = {
        name: normalizedName,
        bio: normalizedBio,
        city: normalizedCity,
        avatarUrl: uploadedAvatar,
        onboarded: true,
        profileComplete: true,
        profileUpdatedAt: serverTimestamp(),
      };

      if (isFreelancer) {
        data.professionalTitle = normalizedTitle;
        data.skills = skills;
        data.hourlyRate = rate;
        data.experienceYears = years;
        data.languages = languages.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 10);
        data.availability = availability;
        data.portfolioUrl = portfolioUrl.trim();
        data.certifications = certifications.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
      } else {
        data.organization = organization.trim().slice(0, 120);
        data.hiringNeeds = hiringNeeds.trim().slice(0, 600);
      }

      if (hasPermission(staff, "manageUsers")) data.isPrivate = isPrivate;

      await setDoc(doc(db, "users", user.uid), data, { merge: true });
      if (user.displayName !== normalizedName) {
        await updateProfile(user, { displayName: normalizedName }).catch(() => undefined);
      }

      setName(normalizedName);
      setCity(normalizedCity);
      setBio(normalizedBio);
      setProfessionalTitle(normalizedTitle);
      setAvatarUrl(uploadedAvatar);
      setAvatarFile(null);
      setAvatarPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return "";
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (caught) {
      setError((caught as Error)?.message || "We could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
        <section className="surface overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand to-brand-light" />
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-wrap items-end gap-5">
              <div className="relative">
                <Avatar
                  name={name || user.email || "You"}
                  src={avatarPreview || avatarUrl}
                  size="xl"
                  className="ring-4 ring-white"
                />
                <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-xl bg-ink text-white shadow-card transition hover:bg-ink-800">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => pickAvatar(event.target.files?.[0] || null)}
                  />
                  <span className="sr-only">Change profile photo</span>
                </label>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-[-0.035em] text-ink">{name || "Your profile"}</h1>
                  {interviewStatus === "verified" && <BadgeCheck className="h-5 w-5 text-$success-600" />}
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-brand-dark">
                    {MEMBER_ROLE_LABELS[role]}
                  </span>
                  {isStaff && (
                    <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                      Staff
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-ink-500">{professionalTitle || organization || user.email}</p>
              </div>

              <Link href={`/u/${user.uid}`} className="pb-1">
                <Button variant="ghost" size="sm">
                  View public profile <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Star} label="Average rating" value={averageRating} tone="bg-$warning-50 text-$warning-600" />
          <Stat icon={CheckCircle2} label="Tasks completed" value={tasksDone} tone="bg-$success-50 text-$success-600" />
          <Stat
            icon={Percent}
            label="Completion rate"
            value={completionRate === null ? "—" : `${completionRate}%`}
            tone="bg-$info-50 text-$info-600"
          />
          <Stat icon={TrendingUp} label="Trust score" value={trust ?? "—"} tone="bg-brand-50 text-brand" />
        </div>

        {isFreelancer && (
          <section className="mt-5 overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-elevated sm:p-7">
            <div className="flex flex-wrap items-center gap-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand">
                <Bot className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">Workly skills interview</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${interviewStatusTone(interviewStatus)}`}>
                    {interviewStatusLabel(interviewStatus)}
                  </span>
                </div>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/60">
                  {interviewStatus === "verified"
                    ? interviewSummary || "Your answers were reviewed and your profile carries the verified badge."
                    : interviewStatus === "awaiting_review"
                      ? "Your evidence summary is ready. A human reviewer makes the badge decision."
                      : interviewStatus === "in_progress"
                        ? "Your previous answers are saved. Continue with the next question."
                        : "Answer four role-specific questions, show real evidence, and earn a reviewed profile badge."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {interviewScore !== null && (
                  <div className="hidden rounded-xl bg-white/10 px-4 py-2 text-center sm:block">
                    <p className="text-xl font-black">{interviewScore}</p>
                    <p className="text-[9px] font-black uppercase text-white/45">Evidence</p>
                  </div>
                )}
                <Link href="/profile/interview">
                  <Button className="bg-white text-ink shadow-none hover:bg-brand-100">
                    {interviewStatus === "not_started" || interviewStatus === "needs_improvement"
                      ? "Start interview"
                      : interviewStatus === "in_progress"
                        ? "Continue"
                        : "View result"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        <form onSubmit={save} className="mt-5 space-y-6">
          <section className="surface p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-ink-100 pb-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-black text-ink">Basic details</h2>
                <p className="text-xs font-medium text-ink-400">Required before marketplace actions are unlocked</p>
              </div>
            </div>

            <div className="space-y-5">
              <Field label="Full name" hint="2–80 characters" required>
                <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" required />
              </Field>
              <Field label="City or location" required>
                <Input value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} placeholder="e.g. Lahore" required />
              </Field>
              <Field label="About you" hint={`${bio.length}/600 · minimum 20 characters`} required>
                <Textarea
                  rows={4}
                  minLength={20}
                  maxLength={600}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder={
                    isFreelancer
                      ? "What you do, the results you deliver, and how you work reliably."
                      : "What your business or household needs, and how you like to work with freelancers."
                  }
                  required
                />
              </Field>
            </div>
          </section>

          {isFreelancer ? (
            <section className="surface p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-ink-100 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-$info-50 text-$info-600">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-black text-ink">Freelancer details</h2>
                  <p className="text-xs font-medium text-ink-400">Required before you can send offers</p>
                </div>
              </div>

              <div className="space-y-5">
                <Field label="Professional title" hint="At least 3 characters" required>
                  <Input
                    value={professionalTitle}
                    onChange={(event) => setProfessionalTitle(event.target.value)}
                    placeholder="e.g. Full-stack developer"
                    maxLength={100}
                    required
                  />
                </Field>

                <Field label="Service categories" hint={`${skills.length}/10 selected · choose at least one`} required>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => {
                      const selected = skills.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSkill(item)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            selected
                              ? "border-brand bg-brand text-white"
                              : "border-ink-200 text-ink-500 hover:border-brand-200 hover:text-brand-dark"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Hourly rate (PKR)" hint="Optional">
                    <Input
                      type="number"
                      min={0}
                      max={1000000}
                      step={100}
                      value={hourlyRate}
                      onChange={(event) => setHourlyRate(event.target.value)}
                    />
                  </Field>
                  <Field label="Years of experience" hint="Optional">
                    <Input
                      type="number"
                      min={0}
                      max={80}
                      value={experienceYears}
                      onChange={(event) => setExperienceYears(event.target.value)}
                    />
                  </Field>
                  <Field label="Languages" hint="Comma separated">
                    <Input value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="Urdu, English" />
                  </Field>
                  <Field label="Availability">
                    <Select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                      {AVAILABILITY.map((item) => <option key={item}>{item}</option>)}
                    </Select>
                  </Field>
                </div>

                <Field label="Portfolio URL" hint="Optional · http:// or https://">
                  <Input
                    type="url"
                    value={portfolioUrl}
                    onChange={(event) => setPortfolioUrl(event.target.value)}
                    placeholder="https://yourportfolio.com"
                  />
                </Field>
                <Field label="Certifications" hint="Comma separated">
                  <Input
                    value={certifications}
                    onChange={(event) => setCertifications(event.target.value)}
                    placeholder="Google UX, AWS, TEVTA"
                  />
                </Field>
              </div>
            </section>
          ) : (
            <section className="surface p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-ink-100 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-$warning-50 text-$warning-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-black text-ink">Client details</h2>
                  <p className="text-xs font-medium text-ink-400">Useful context for freelancers considering your tasks</p>
                </div>
              </div>

              <div className="space-y-5">
                <Field label="Company or organisation" hint="Optional">
                  <Input
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    maxLength={120}
                    placeholder="Your business or team"
                  />
                </Field>
                <Field label="What do you usually hire for?" hint={`${hiringNeeds.length}/600 · optional`}>
                  <Textarea
                    rows={4}
                    maxLength={600}
                    value={hiringNeeds}
                    onChange={(event) => setHiringNeeds(event.target.value)}
                    placeholder="Tell freelancers what kind of help you regularly need."
                  />
                </Field>
              </div>
            </section>
          )}

          {hasPermission(staff, "manageUsers") && (
            <label className="flex cursor-pointer items-start gap-3 rounded-3xl bg-ink p-6 text-sm text-white">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 text-brand focus:ring-brand"
              />
              <span>
                <span className="block font-black">Internal private provider (manageUsers)</span>
                <span className="mt-1 block text-xs leading-5 text-white/55">
                  Hidden from public discovery and available for managed private assignments only. Requires private-provider permission.
                </span>
              </span>
            </label>
          )}

          {error && <Alert tone="error">{error}</Alert>}
          {saved && <Alert tone="success">Your profile has been saved and account readiness has been recalculated.</Alert>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={busy} disabled={busy}>
              <Save className="h-4 w-4" /> Save profile
            </Button>
            <Link href="/settings" className="text-sm font-bold text-ink-500 hover:text-ink">
              Account settings & security →
            </Link>
          </div>
        </form>

        {reviews.length > 0 && (
          <section className="surface mt-6 p-6">
            <h2 className="text-lg font-black text-ink">Reviews about you</h2>
            <ul className="mt-4 space-y-3">
              {reviews.slice(0, 8).map((review) => (
                <li key={review.id} className="rounded-2xl border border-ink-100 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-sun text-sun" />
                      ))}
                    </div>
                    <span className="text-sm font-black text-ink">{review.fromName}</span>
                  </div>
                  {review.comment && <p className="mt-2 text-sm leading-6 text-ink-500">{review.comment}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
