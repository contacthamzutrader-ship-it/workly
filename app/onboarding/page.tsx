"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  HardHat,
  LogOut,
  PartyPopper,
  Sparkles,
  UserRound,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { MEMBER_ROLE_BLURB, toStoredRole, type MemberRole } from "@/lib/roles";
import { CATEGORIES } from "@/lib/tasks";
import Button from "@/components/ui/Button";
import Input, { Field, Select, Textarea } from "@/components/ui/Input";
import { Alert, PageLoader } from "@/components/ui/Feedback";

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Remote / anywhere",
];

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validDisplayName(value: string) {
  const normalized = normalizeName(value);
  const letters = normalized.match(/\p{L}/gu)?.length ?? 0;
  return normalized.length >= 2 && normalized.length <= 80 && letters >= 2;
}

export default function OnboardingPage() {
  const { user, profile, role, loading, profileLoading, signOut } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [chosenRole, setChosenRole] = useState<MemberRole>(role);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [organization, setOrganization] = useState("");
  const [hiringNeeds, setHiringNeeds] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/onboarding");
  }, [loading, user, router]);

  useEffect(() => {
    if (profile?.onboarded) router.replace("/dashboard");
  }, [profile?.onboarded, router]);

  useEffect(() => {
    if (!profile) return;
    const source = profile as typeof profile & {
      bio?: string;
      professionalTitle?: string;
      skills?: string[];
      hourlyRate?: number;
      organization?: string;
      hiringNeeds?: string;
    };
    setChosenRole(profile.role);
    setName((current) => current || profile.name || user?.displayName || "");
    setCity((current) => current || profile.city || "");
    setBio((current) => current || source.bio || "");
    setProfessionalTitle((current) => current || source.professionalTitle || "");
    setSkills((current) => (current.length > 0 ? current : Array.isArray(source.skills) ? source.skills.slice(0, 8) : []));
    setHourlyRate((current) => current || (source.hourlyRate ? String(source.hourlyRate) : ""));
    setOrganization((current) => current || source.organization || "");
    setHiringNeeds((current) => current || source.hiringNeeds || "");
  }, [profile, user]);

  const steps = useMemo(
    () => [
      { title: "Choose your Workly mode", subtitle: "Your mode controls the actions and dashboard you see." },
      { title: "Complete your member profile", subtitle: "A real name, location and useful introduction are required." },
      {
        title: chosenRole === "freelancer" ? "Set up your professional profile" : "Tell us what you usually hire for",
        subtitle:
          chosenRole === "freelancer"
            ? "Add enough detail for clients to understand what you actually do."
            : "This helps Workly make your posting experience more relevant.",
      },
    ],
    [chosenRole]
  );

  if (loading || profileLoading || !user) return <PageLoader label="Preparing your account" />;

  if (!profile) {
    return (
      <div className="bg-canvas py-16">
        <div className="page-shell max-w-xl">
          <div className="surface p-6 sm:p-8">
            <Alert tone="error" title="Your Workly profile could not be loaded">
              Your sign-in is active, but the required member profile is missing. For account safety, Workly will not silently create a replacement profile.
            </Alert>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  router.replace("/login");
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
              <Button onClick={() => router.push("/support")}>Contact support</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile.onboarded) return <PageLoader label="Opening your dashboard" />;

  const normalizedName = normalizeName(name);
  const nameValid = validDisplayName(name);
  const cityValid = city.trim().length >= 2;
  const bioValid = bio.trim().length >= 20;
  const titleValid = professionalTitle.trim().length >= 3;
  const skillsValid = skills.length > 0;
  const parsedRate = hourlyRate.trim() === "" ? null : Number(hourlyRate);
  const rateValid = parsedRate === null || (Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 1_000_000);

  const stepOneValid = nameValid && cityValid && bioValid;
  const stepTwoValid = chosenRole === "client" ? true : titleValid && skillsValid && rateValid;
  const canContinue = step === 0 ? true : step === 1 ? stepOneValid : stepTwoValid;

  const finish = async () => {
    setError("");
    if (!stepOneValid) {
      setStep(1);
      setError("Complete your name, location and introduction before finishing setup.");
      return;
    }
    if (!stepTwoValid) {
      setStep(2);
      setError("Add a professional title and at least one service category before finishing your freelancer profile.");
      return;
    }
    if (!db) {
      setError("Workly profile storage is not configured.");
      return;
    }

    setBusy(true);
    try {
      const profileComplete =
        nameValid && cityValid && bioValid && (chosenRole === "client" || (titleValid && skillsValid && rateValid));

      const data: Record<string, unknown> = {
        name: normalizedName,
        city: city.trim(),
        bio: bio.trim(),
        role: toStoredRole(chosenRole),
        isTasker: chosenRole === "freelancer",
        onboarded: true,
        profileComplete,
        profileUpdatedAt: serverTimestamp(),
        roleUpdatedAt: serverTimestamp(),
      };

      if (chosenRole === "freelancer") {
        data.professionalTitle = professionalTitle.trim();
        data.skills = skills;
        data.hourlyRate = parsedRate ?? 0;
        data.organization = "";
        data.hiringNeeds = "";
      } else {
        data.organization = organization.trim();
        data.hiringNeeds = hiringNeeds.trim();
        data.professionalTitle = "";
        data.skills = [];
        data.hourlyRate = 0;
      }

      await setDoc(doc(db, "users", user.uid), data, { merge: true });
      if (user.displayName !== normalizedName) {
        await updateProfile(user, { displayName: normalizedName }).catch(() => undefined);
      }

      router.replace(chosenRole === "freelancer" ? "/tasks" : "/post");
    } catch (caught) {
      setError((caught as Error)?.message || "We could not save your account setup. Please try again.");
      setBusy(false);
    }
  };

  const toggleSkill = (skill: string) =>
    setSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : current.length < 8 ? [...current, skill] : current
    );

  return (
    <div className="bg-canvas py-10 sm:py-16">
      <div className="page-shell max-w-2xl">
        <div className="mb-8 flex items-center gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, index) => (
            <div key={index} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                  index <= step ? "bg-brand text-white" : "bg-ink-100 text-ink-400"
                }`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < steps.length - 1 && <span className={`h-1 flex-1 rounded-full ${index < step ? "bg-brand" : "bg-ink-100"}`} />}
            </div>
          ))}
        </div>

        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8">
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Step {step + 1} of {steps.length}</span>
            <h1 className="mt-4 text-2xl font-black tracking-[-0.035em] text-ink sm:text-3xl">{steps[step].title}</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-ink-500">{steps[step].subtitle}</p>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { value: "client" as MemberRole, icon: BriefcaseBusiness, title: "I need work done" },
                  { value: "freelancer" as MemberRole, icon: HardHat, title: "I want to earn" },
                ]).map((option) => {
                  const selected = chosenRole === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setChosenRole(option.value)}
                      disabled={busy}
                      className={`rounded-2xl border p-5 text-left transition disabled:opacity-60 ${
                        selected ? "border-brand bg-brand-50 shadow-[0_0_0_3px_rgba(23,107,255,0.08)]" : "border-ink-100 hover:border-ink-200"
                      }`}
                    >
                      <span className={`grid h-11 w-11 place-items-center rounded-xl ${selected ? "bg-brand text-white" : "bg-ink-50 text-ink-400"}`}>
                        <option.icon className="h-5 w-5" />
                      </span>
                      <p className={`mt-4 text-base font-black ${selected ? "text-brand-dark" : "text-ink"}`}>{option.title}</p>
                      <p className="mt-1.5 text-xs leading-5 text-ink-500">{MEMBER_ROLE_BLURB[option.value]}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <>
                <Field label="Full name" hint="Shown to other members" error={!nameValid && name.length > 0 ? "Use your real name with at least two letters." : ""} required>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onBlur={() => setName((current) => normalizeName(current))}
                    placeholder="Ayesha Khan"
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </Field>
                <Field label="Where are you based?" error={!cityValid && city.length > 0 ? "Choose your location." : ""} required>
                  <Select value={city} onChange={(event) => setCity(event.target.value)} required>
                    <option value="">Select a city</option>
                    {CITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </Field>
                <Field
                  label="Short introduction"
                  hint={`${bio.length}/400 · minimum 20 characters`}
                  error={bio.length > 0 && !bioValid ? "Write at least 20 useful characters." : ""}
                  required
                >
                  <Textarea
                    rows={4}
                    minLength={20}
                    maxLength={400}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder={
                      chosenRole === "freelancer"
                        ? "Describe what you do, your experience and how you work reliably."
                        : "Briefly describe your business, team, household or the kind of help you usually need."
                    }
                    required
                  />
                </Field>
              </>
            )}

            {step === 2 && chosenRole === "freelancer" && (
              <>
                <Field label="Professional title" hint="Shown on your profile" error={professionalTitle.length > 0 && !titleValid ? "Add a clear professional title." : ""} required>
                  <Input
                    value={professionalTitle}
                    onChange={(event) => setProfessionalTitle(event.target.value)}
                    placeholder="Full-stack developer · Shopify specialist"
                    maxLength={100}
                    required
                  />
                </Field>
                <Field label="Service categories" hint={`${skills.length}/8 selected`} error={!skillsValid ? "Select at least one category." : ""} required>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => {
                      const selected = skills.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleSkill(category)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            selected ? "border-brand bg-brand text-white" : "border-ink-200 text-ink-500 hover:border-brand-200 hover:text-brand-dark"
                          }`}
                        >
                          {selected && <Check className="mr-1 inline h-3 w-3" />}{category}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Typical hourly rate (PKR)" hint="Optional" error={!rateValid ? "Enter a valid rate between 0 and 1,000,000 PKR." : ""}>
                  <Input
                    type="number"
                    min={0}
                    max={1000000}
                    step={100}
                    value={hourlyRate}
                    onChange={(event) => setHourlyRate(event.target.value)}
                    placeholder="2500"
                    inputMode="numeric"
                  />
                </Field>
                <Alert tone="info" title="A complete profile earns more trust">
                  Your title, introduction and service categories appear together when clients review your offers.
                </Alert>
              </>
            )}

            {step === 2 && chosenRole === "client" && (
              <>
                <Field label="Company or organisation" hint="Optional">
                  <Input
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    placeholder="Your business, team or household"
                    maxLength={120}
                  />
                </Field>
                <Field label="What do you usually hire for?" hint="Optional">
                  <Textarea
                    rows={4}
                    maxLength={400}
                    value={hiringNeeds}
                    onChange={(event) => setHiringNeeds(event.target.value)}
                    placeholder="Office cleaning, web development, brand design, delivery support..."
                  />
                </Field>
                <Alert tone="info" title="Your first task comes next">
                  After setup, Workly takes you directly to the task posting flow.
                </Alert>
              </>
            )}

            {error && <Alert tone="error">{error}</Alert>}

            <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-5">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => { setError(""); setStep((current) => current - 1); }} disabled={busy}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await signOut();
                    router.replace("/");
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-400 hover:text-ink disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              )}

              {step < steps.length - 1 ? (
                <Button
                  onClick={() => { setError(""); setStep((current) => current + 1); }}
                  disabled={!canContinue || busy}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finish} loading={busy} disabled={!canContinue} size="lg">
                  {busy ? "Saving account" : "Finish setup"} {!busy && <PartyPopper className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400">
          <UserRound className="h-3.5 w-3.5" /> You can edit these details later from your profile settings.
        </p>
      </div>
    </div>
  );
}
