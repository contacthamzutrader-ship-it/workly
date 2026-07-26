"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  HardHat,
  MapPin,
  PartyPopper,
  Sparkles,
  UserRound,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { MEMBER_ROLE_BLURB, type MemberRole } from "@/lib/roles";
import { CATEGORIES } from "@/lib/tasks";
import Button from "@/components/ui/Button";
import Input, { Field, Select, Textarea } from "@/components/ui/Input";
import { Alert, PageLoader } from "@/components/ui/Feedback";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Remote / anywhere"];

export default function OnboardingPage() {
  const { user, profile, role, loading, switchRole, markOnboarded } = useAuth();
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
    if (profile) {
      setChosenRole(profile.role);
      setName((current) => current || profile.name || user?.displayName || "");
      setCity((current) => current || profile.city || "");
    }
  }, [profile, user]);

  const steps = useMemo(
    () => [
      { title: "How will you use Workly?", subtitle: "This shapes your dashboard and what you can do." },
      { title: "Tell us who you are", subtitle: "Members with complete profiles get far better results." },
      {
        title: chosenRole === "freelancer" ? "What work do you do?" : "What do you need help with?",
        subtitle: chosenRole === "freelancer" ? "We use this to match you with the right tasks." : "We use this to route your tasks to the right people.",
      },
    ],
    [chosenRole]
  );

  if (loading || !user) return <PageLoader label="Preparing your setup" />;

  const canContinue =
    step === 0 ? true : step === 1 ? name.trim().length > 1 && city.trim().length > 1 : true;

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      if (chosenRole !== role) await switchRole(chosenRole);
      if (db) {
        const data: Record<string, unknown> = {
          name: name.trim(),
          city: city.trim(),
          bio: bio.trim(),
          onboarded: true,
          profileComplete: Boolean(name.trim() && city.trim() && bio.trim()),
          profileUpdatedAt: new Date().toISOString(),
        };
        if (chosenRole === "freelancer") {
          data.professionalTitle = professionalTitle.trim();
          data.skills = skills;
          data.hourlyRate = Math.max(0, Number(hourlyRate) || 0);
        } else {
          data.organization = organization.trim();
          data.hiringNeeds = hiringNeeds.trim();
        }
        await setDoc(doc(db, "users", user.uid), data, { merge: true });
      } else {
        await markOnboarded();
      }
      router.push(chosenRole === "freelancer" ? "/tasks" : "/post");
    } catch (caught) {
      setError((caught as Error)?.message || "We could not save your setup.");
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
        <div className="mb-8 flex items-center gap-2">
          {steps.map((_, index) => (
            <div key={index} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                  index <= step ? "bg-brand text-white" : "bg-ink-100 text-ink-400"
                }`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className={`h-1 flex-1 rounded-full ${index < step ? "bg-brand" : "bg-ink-100"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Step {step + 1} of {steps.length}
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-[-0.035em] text-ink sm:text-3xl">{steps[step].title}</h1>
            <p className="mt-2 text-sm font-medium text-ink-500">{steps[step].subtitle}</p>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: "client" as MemberRole, icon: BriefcaseBusiness, title: "I need work done" },
                    { value: "freelancer" as MemberRole, icon: HardHat, title: "I want to earn" },
                  ]
                ).map((option) => {
                  const selected = chosenRole === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setChosenRole(option.value)}
                      className={`rounded-2xl border p-5 text-left transition ${
                        selected ? "border-brand bg-brand-50" : "border-ink-100 hover:border-ink-200"
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-xl ${
                          selected ? "bg-brand text-white" : "bg-ink-50 text-ink-400"
                        }`}
                      >
                        <option.icon className="h-5 w-5" />
                      </span>
                      <p className={`mt-4 text-base font-black ${selected ? "text-brand-dark" : "text-ink"}`}>
                        {option.title}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-ink-500">{MEMBER_ROLE_BLURB[option.value]}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <>
                <Field label="Your name" required>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ayesha Khan" />
                </Field>
                <Field label="Where are you based?" required>
                  <Select value={city} onChange={(event) => setCity(event.target.value)}>
                    <option value="">Select a city</option>
                    {CITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Short introduction"
                  hint={`${bio.length}/400`}
                >
                  <Textarea
                    rows={4}
                    maxLength={400}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder={
                      chosenRole === "freelancer"
                        ? "What you do, who you have worked with, and what makes your work reliable."
                        : "What your business or household usually needs help with."
                    }
                  />
                </Field>
              </>
            )}

            {step === 2 && chosenRole === "freelancer" && (
              <>
                <Field label="Professional title" hint="Shown on your profile">
                  <Input
                    value={professionalTitle}
                    onChange={(event) => setProfessionalTitle(event.target.value)}
                    placeholder="Full-stack developer · Shopify specialist"
                  />
                </Field>
                <Field label="Your service categories" hint={`${skills.length}/8 selected`}>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => {
                      const selected = skills.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleSkill(category)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            selected
                              ? "border-brand bg-brand text-white"
                              : "border-ink-200 text-ink-500 hover:border-brand-200 hover:text-brand-dark"
                          }`}
                        >
                          {selected && <Check className="mr-1 inline h-3 w-3" />}
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Typical hourly rate (PKR)" hint="Optional">
                  <Input
                    type="number"
                    min={0}
                    value={hourlyRate}
                    onChange={(event) => setHourlyRate(event.target.value)}
                    placeholder="2500"
                  />
                </Field>
              </>
            )}

            {step === 2 && chosenRole === "client" && (
              <>
                <Field label="Company or organisation" hint="Optional">
                  <Input
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    placeholder="Your business, team or household"
                  />
                </Field>
                <Field label="What do you usually hire for?">
                  <Textarea
                    rows={4}
                    value={hiringNeeds}
                    onChange={(event) => setHiringNeeds(event.target.value)}
                    placeholder="Office cleaning twice a week, occasional web development, brand design..."
                  />
                </Field>
                <Alert tone="info" title="You can post your first task next">
                  Workly reviews new tasks before they go live so freelancers only see genuine work.
                </Alert>
              </>
            )}

            {error && <Alert tone="error">{error}</Alert>}

            <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-5">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((current) => current - 1)} disabled={busy}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <Link href="/dashboard" className="text-sm font-bold text-ink-400 hover:text-ink">
                  Skip for now
                </Link>
              )}

              {step < steps.length - 1 ? (
                <Button onClick={() => setStep((current) => current + 1)} disabled={!canContinue}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finish} loading={busy}>
                  {busy ? "Finishing" : "Finish setup"} {!busy && <PartyPopper className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400">
          <UserRound className="h-3.5 w-3.5" /> You can change everything later in your profile.
        </p>
      </div>
    </div>
  );
}
