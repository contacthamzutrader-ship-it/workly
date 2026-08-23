"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Globe,
  Languages,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const STEPS = [
  { id: 1, name: "Identity", desc: "Basic details" },
  { id: 2, name: "Pricing", desc: "Rates & experience" },
  { id: 3, name: "About", desc: "Bio & languages" },
  { id: 4, name: "Expertise", desc: "Skills & tools" },
  { id: 5, name: "Portfolio", desc: "Links & certificates" },
  { id: 6, name: "Review", desc: "Verify profile" },
];

export default function OnboardingPage() {
  const { user, setOnboardingCompleted } = useAuth();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Input states
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    professionalTitle: "",
    hourlyRate: "",
    experienceYears: "",
    availability: "Available now",
    bio: "",
    languages: [] as string[],
    skills: [] as string[],
    portfolioUrl: "",
    certifications: [] as string[],
  });

  // Intermediate input handlers for lists
  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newCert, setNewCert] = useState("");



  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (!db) return;
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setFormData({
            name: d.name || user.displayName || "",
            city: d.city || "",
            professionalTitle: d.professionalTitle || "",
            hourlyRate: d.hourlyRate ? String(d.hourlyRate) : "",
            experienceYears: d.experienceYears ? String(d.experienceYears) : "",
            availability: d.availability || "Available now",
            bio: d.bio || "",
            languages: d.languages || [],
            skills: d.skills || [],
            portfolioUrl: d.portfolioUrl || "",
            certifications: d.certifications || [],
          });
        }
      } catch (err) {
        console.error("Error fetching user data for onboarding:", err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  if (loadingProfile) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-mint" />
        <p className="text-sm font-semibold text-ink-500">Loading your profile details...</p>
      </div>
    );
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      setError("");
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setError("");
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError("Please enter your full name.");
        return false;
      }
      if (!formData.city.trim()) {
        setError("Please enter your city.");
        return false;
      }
      if (!formData.professionalTitle.trim()) {
        setError("Please enter your professional title.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
        setError("Please enter a valid hourly rate (greater than 0).");
        return false;
      }
      if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
        setError("Please enter your years of experience.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.bio.trim() || formData.bio.trim().length < 20) {
        setError("Please enter a bio (minimum 20 characters) describing your expertise.");
        return false;
      }
      if (formData.languages.length === 0) {
        setError("Please add at least one language.");
        return false;
      }
    }
    if (currentStep === 4) {
      if (formData.skills.length === 0) {
        setError("Please add at least one skill.");
        return false;
      }
    }
    return true;
  };

  const isStepValid = (stepNumber: number) => {
    if (stepNumber === 1) {
      return formData.name.trim() !== "" && formData.city.trim() !== "" && formData.professionalTitle.trim() !== "";
    }
    if (stepNumber === 2) {
      return formData.hourlyRate !== "" && Number(formData.hourlyRate) > 0 && formData.experienceYears !== "" && Number(formData.experienceYears) >= 0;
    }
    if (stepNumber === 3) {
      return formData.bio.trim().length >= 20 && formData.languages.length > 0;
    }
    if (stepNumber === 4) {
      return formData.skills.length > 0;
    }
    return true;
  };

  // List manipulation helpers
  const addSkill = (skill: string) => {
    const clean = skill.trim();
    if (clean && !formData.skills.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, clean],
      }));
      setNewSkill("");
      setError("");
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const addLang = (lang: string) => {
    const clean = lang.trim();
    if (clean && !formData.languages.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, clean],
      }));
      setNewLang("");
      setError("");
    }
  };

  const removeLang = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const addCert = (cert: string) => {
    const clean = cert.trim();
    if (clean && !formData.certifications.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, clean],
      }));
      setNewCert("");
      setError("");
    }
  };

  const removeCert = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const detectNiche = () => {
    const title = formData.professionalTitle.toLowerCase();
    const skillsList = formData.skills.map((s) => s.toLowerCase());

    const isDesign =
      title.includes("design") ||
      title.includes("ui") ||
      title.includes("ux") ||
      skillsList.some((s) => s.includes("design") || s.includes("photoshop") || s.includes("figma") || s.includes("ui"));
    if (isDesign) return "uiux_design";

    const isBackend =
      title.includes("backend") ||
      title.includes("node") ||
      title.includes("python") ||
      title.includes("database") ||
      title.includes("sql") ||
      skillsList.some((s) => s.includes("node") || s.includes("backend") || s.includes("django") || s.includes("express"));
    if (isBackend) return "backend";

    const isFullstack =
      title.includes("fullstack") || title.includes("full stack") || title.includes("mern");
    if (isFullstack) return "fullstack";

    const isAi =
      title.includes("ai") ||
      title.includes("machine") ||
      title.includes("data") ||
      title.includes("ml") ||
      skillsList.some((s) => s.includes("python") || s.includes("ai") || s.includes("tensorflow") || s.includes("pytorch"));
    if (isAi) return "ai_datascience";

    const isMobile =
      title.includes("mobile") ||
      title.includes("app") ||
      title.includes("react-native") ||
      title.includes("react native") ||
      title.includes("flutter") ||
      title.includes("android") ||
      title.includes("ios");
    if (isMobile) return "mobile";

    const isMarketing =
      title.includes("marketing") ||
      title.includes("seo") ||
      title.includes("ads") ||
      skillsList.some((s) => s.includes("seo") || s.includes("marketing") || s.includes("sem"));
    if (isMarketing) return "digital_marketing";

    const isWriting =
      title.includes("write") ||
      title.includes("content") ||
      title.includes("copy") ||
      skillsList.some((s) => s.includes("write") || s.includes("content") || s.includes("copy"));
    if (isWriting) return "copywriting";

    return "frontend"; // Default fallback
  };

  const handleSubmitProfile = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (!db || !user) throw new Error("Firebase auth/db configuration missing.");

      // Save to Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: formData.name.trim(),
        city: formData.city.trim(),
        professionalTitle: formData.professionalTitle.trim(),
        hourlyRate: Number(formData.hourlyRate),
        experienceYears: Number(formData.experienceYears),
        availability: formData.availability,
        bio: formData.bio.trim(),
        languages: formData.languages,
        skills: formData.skills,
        portfolioUrl: formData.portfolioUrl.trim(),
        certifications: formData.certifications,
        profileComplete: true,
        onboardingCompleted: true,
        profileUpdatedAt: new Date().toISOString(),
      });

      // Update auth context state to unlock dashboard/etc.
      setOnboardingCompleted(true);

      // Redirect immediately to the local proctored interview page
      const niche = detectNiche();
      const redirectUrl = `${window.location.origin}/dashboard`;
      const queryParams = new URLSearchParams();
      queryParams.set("name", formData.name.trim());
      queryParams.set("email", user.email || "");
      queryParams.set("niche", niche);
      queryParams.set("rate", String(formData.hourlyRate));
      queryParams.set("experience", Number(formData.experienceYears) >= 5 ? "senior" : Number(formData.experienceYears) >= 2 ? "mid" : "junior");
      queryParams.set("redirect_url", redirectUrl);

      // Navigate directly to the integrated proctored test room
      window.location.href = `/interview?${queryParams.toString()}`;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to submit onboarding profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {step < 7 && (
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
            Freelancer Onboarding Wizard
          </h1>
          <p className="mt-2 text-sm font-medium text-ink-400">
            Let&apos;s build a professional profile to unlock smart matches and proceed to the AI verification interview.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Step Indicator Sidebar */}
        {step < 7 && (
          <aside className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft h-fit">
            <nav className="space-y-4">
              {STEPS.map((s) => {
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => step < 6 && s.id < step && setStep(s.id)}
                    disabled={step === 6 || s.id >= step}
                    className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${
                      isActive
                        ? "bg-mint-50/70 text-mint"
                        : "text-ink-400 hover:text-ink"
                    } ${s.id < step && step < 7 ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black transition-colors ${
                        isActive
                          ? "bg-mint text-white"
                          : isCompleted
                          ? "bg-mint text-white"
                          : "bg-ink-50 text-ink-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : `0${s.id}`}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-black tracking-wide uppercase ${isActive ? "text-mint-700" : "text-ink-500"}`}>
                        {s.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium leading-4 text-ink-400 truncate">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Wizard Form Panel */}
        <main className={`w-full ${step === 7 ? "lg:col-span-2 max-w-2xl mx-auto" : ""}`}>
          <div className="surface p-6 sm:p-8 shadow-card border border-ink-100 min-h-[460px] flex flex-col justify-between">
            {/* Step Contents */}
            <div>
              {/* STEP 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                      <User className="h-3.5 w-3.5" /> Step 1 of 5
                    </span>
                    <h2 className="mt-3 text-xl font-black text-ink">Basic Identity</h2>
                    <p className="text-xs text-ink-400">Tell clients who you are and where you are located.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Full Name <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        placeholder="e.g. Ali Ahmed"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">City / Location <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        placeholder="e.g. Lahore, Pakistan"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Professional Title <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        placeholder="e.g. Creative Graphic Designer, Node.js Expert"
                        value={formData.professionalTitle}
                        onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Hourly Rate & Experience */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                      <Briefcase className="h-3.5 w-3.5" /> Step 2 of 5
                    </span>
                    <h2 className="mt-3 text-xl font-black text-ink">Pricing & Scope</h2>
                    <p className="text-xs text-ink-400">Set your billing rate and availability window.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Hourly Rate (PKR / hr) <span className="text-red-500">*</span></label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 1500"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Years of Experience <span className="text-red-500">*</span></label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 3"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Work Availability</label>
                      <select
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        className="min-h-12 w-full rounded-xl border border-ink-100 bg-white px-4 py-3 text-[15px] font-medium text-ink shadow-soft focus:border-mint focus:outline-none focus:ring-4 focus:ring-mint/15"
                      >
                        <option value="Available now">Available now (Full-time)</option>
                        <option value="Part-time">Part-time hours</option>
                        <option value="Weekends">Weekends only</option>
                        <option value="Not available">Not available currently</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: About Bio & Languages */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                      <Globe className="h-3.5 w-3.5" /> Step 3 of 5
                    </span>
                    <h2 className="mt-3 text-xl font-black text-ink">Professional Bio</h2>
                    <p className="text-xs text-ink-400">Introduce yourself and list the languages you speak.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Bio Summary <span className="text-red-500">*</span> <span className="text-[10px] text-ink-400 font-normal">(Min 20 characters)</span></label>
                      <textarea
                        rows={4}
                        placeholder="Detail your skills, professional backgrounds, and client successes. Min 20 characters."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full rounded-xl border border-ink-100 bg-white px-4 py-3 text-[15px] font-medium text-ink shadow-soft placeholder:font-normal placeholder:text-ink-400 transition focus:border-mint focus:outline-none focus:ring-4 focus:ring-mint/15"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Languages Spoken <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="e.g. English (press Add or Enter)"
                          value={newLang}
                          onChange={(e) => setNewLang(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLang(newLang))}
                        />
                        <button
                          type="button"
                          onClick={() => addLang(newLang)}
                          className="flex min-h-12 items-center justify-center rounded-xl bg-ink-900 px-4 text-white hover:bg-ink-700 transition"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Language badges */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.languages.map((lang, idx) => (
                          <span
                            key={lang}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 border border-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700"
                          >
                            <Languages className="h-3 w-3 text-ink-400" /> {lang}
                            <button
                              type="button"
                              onClick={() => removeLang(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Skills & Expertise */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                      <Sparkles className="h-3.5 w-3.5" /> Step 4 of 5
                    </span>
                    <h2 className="mt-3 text-xl font-black text-ink">Add Skills & Expertise</h2>
                    <p className="text-xs text-ink-400">List specific skills that will rank you in client jobs.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Skills <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="e.g. React, UI/UX, Copywriting (press Add or Enter)"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(newSkill))}
                        />
                        <button
                          type="button"
                          onClick={() => addSkill(newSkill)}
                          className="flex min-h-12 items-center justify-center rounded-xl bg-ink-900 px-4 text-white hover:bg-ink-700 transition"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Skill badges */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {formData.skills.length === 0 ? (
                          <p className="text-xs font-medium text-ink-300">No skills added yet. Add at least one.</p>
                        ) : (
                          formData.skills.map((skill, idx) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 border border-mint-100 px-3 py-1.5 text-xs font-extrabold text-mint-700"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(idx)}
                                className="text-mint-700 hover:text-red-500 transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Portfolio & Certifications */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                      <Globe className="h-3.5 w-3.5" /> Step 5 of 5
                    </span>
                    <h2 className="mt-3 text-xl font-black text-ink">Portfolio & Certifications</h2>
                    <p className="text-xs text-ink-400">Share your past work URLs and certificates (optional).</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Portfolio URL</label>
                      <Input
                        type="url"
                        placeholder="https://behance.net/username or https://github.com/username"
                        value={formData.portfolioUrl}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-ink">Certifications</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="e.g. AWS Certified Developer (press Add or Enter)"
                          value={newCert}
                          onChange={(e) => setNewCert(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert(newCert))}
                        />
                        <button
                          type="button"
                          onClick={() => addCert(newCert)}
                          className="flex min-h-12 items-center justify-center rounded-xl bg-ink-900 px-4 text-white hover:bg-ink-700 transition"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Certifications list */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.certifications.map((cert, idx) => (
                          <span
                            key={cert}
                            className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-bold text-yellow-800"
                          >
                            {cert}
                            <button
                              type="button"
                              onClick={() => removeCert(idx)}
                              className="text-yellow-700 hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Review & Final Check */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Last Check
                    </span>
                    <h2 className="mt-3 text-xl font-black text-ink">Review Profile Info</h2>
                    <p className="text-xs text-ink-400">Aik baar check ker lain. All items can be edited or changed.</p>
                  </div>

                  <div className="space-y-6 divide-y divide-ink-100">
                    {/* Section 1: Basic info */}
                    <div className="pt-2 first:pt-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-deep uppercase tracking-wider">Identity Details</h3>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-black text-mint-700 hover:underline"
                        >
                          Edit Section
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <span className="block text-xs font-bold text-ink-400">Full Name</span>
                          <span className="font-semibold text-ink">{formData.name}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-ink-400">City</span>
                          <span className="font-semibold text-ink">{formData.city}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="block text-xs font-bold text-ink-400">Professional Title</span>
                          <span className="font-semibold text-ink">{formData.professionalTitle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Rates */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-deep uppercase tracking-wider">Rates & Availability</h3>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs font-black text-mint-700 hover:underline"
                        >
                          Edit Section
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <span className="block text-xs font-bold text-ink-400">Hourly Rate</span>
                          <span className="font-semibold text-ink">PKR {formData.hourlyRate} / hr</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-ink-400">Experience Years</span>
                          <span className="font-semibold text-ink">{formData.experienceYears} Years</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-ink-400">Availability</span>
                          <span className="font-semibold text-ink">{formData.availability}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Bio & Languages */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-deep uppercase tracking-wider">About & Bio</h3>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="text-xs font-black text-mint-700 hover:underline"
                        >
                          Edit Section
                        </button>
                      </div>
                      <div className="mt-3 space-y-3 text-sm">
                        <div>
                          <span className="block text-xs font-bold text-ink-400">Bio Summary</span>
                          <p className="font-semibold text-ink leading-relaxed text-justify">{formData.bio}</p>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-ink-400 mb-2">Languages Spoken</span>
                          <div className="flex flex-wrap gap-2">
                            {formData.languages.map((lang, idx) => (
                              <span
                                key={lang}
                                className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 border border-ink-100 px-3 py-1 text-xs font-bold text-ink-700"
                              >
                                {lang}
                                <button
                                  type="button"
                                  onClick={() => removeLang(idx)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove language"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          {/* Quick Add Languages */}
                          <div className="mt-2 flex max-w-xs gap-1">
                            <input
                              type="text"
                              placeholder="Add language..."
                              value={newLang}
                              onChange={(e) => setNewLang(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLang(newLang))}
                              className="h-8 rounded-lg border border-ink-200 bg-white px-2.5 text-xs text-ink focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => addLang(newLang)}
                              className="h-8 rounded-lg bg-ink-900 px-2 text-xs text-white hover:bg-ink-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Skills */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-deep uppercase tracking-wider">Expertise & Skills</h3>
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="text-xs font-black text-mint-700 hover:underline"
                        >
                          Edit Section
                        </button>
                      </div>
                      <div className="mt-3">
                        <span className="block text-xs font-bold text-ink-400 mb-2">Skills (click X to remove)</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, idx) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 border border-mint-100 px-3 py-1.5 text-xs font-extrabold text-mint-700"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(idx)}
                                className="text-mint-700 hover:text-red-500"
                                title="Remove skill"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        {/* Quick Add Skills */}
                        <div className="mt-3 flex max-w-sm gap-2">
                          <input
                            type="text"
                            placeholder="Add skill..."
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(newSkill))}
                            className="h-9 rounded-xl border border-ink-100 bg-white px-3 text-xs text-ink focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/10"
                          />
                          <button
                            type="button"
                            onClick={() => addSkill(newSkill)}
                            className="h-9 rounded-xl bg-ink-900 px-3 text-xs text-white hover:bg-ink-700"
                          >
                            Add Skill
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Extras */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-deep uppercase tracking-wider">Portfolio & Certifications</h3>
                        <button
                          type="button"
                          onClick={() => setStep(5)}
                          className="text-xs font-black text-mint-700 hover:underline"
                        >
                          Edit Section
                        </button>
                      </div>
                      <div className="mt-3 space-y-3 text-sm">
                        {formData.portfolioUrl && (
                          <div>
                            <span className="block text-xs font-bold text-ink-400">Portfolio Link</span>
                            <a
                              href={formData.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-mint-700 hover:underline truncate block max-w-xs"
                            >
                              {formData.portfolioUrl}
                            </a>
                          </div>
                        )}
                        <div>
                          <span className="block text-xs font-bold text-ink-400 mb-2">Certifications</span>
                          {formData.certifications.length === 0 ? (
                            <p className="text-xs text-ink-400">No certifications listed.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {formData.certifications.map((cert, idx) => (
                                <span
                                  key={cert}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs font-bold text-yellow-800"
                                >
                                  {cert}
                                  <button
                                    type="button"
                                    onClick={() => removeCert(idx)}
                                    className="text-yellow-700 hover:text-red-500"
                                    title="Remove certificate"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Quick Add Certifications */}
                          <div className="mt-3 flex max-w-sm gap-2">
                            <input
                              type="text"
                              placeholder="Add certificate..."
                              value={newCert}
                              onChange={(e) => setNewCert(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert(newCert))}
                              className="h-9 rounded-xl border border-ink-100 bg-white px-3 text-xs text-ink focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/10"
                            />
                            <button
                              type="button"
                              onClick={() => addCert(newCert)}
                              className="h-9 rounded-xl bg-ink-900 px-3 text-xs text-white hover:bg-ink-700"
                            >
                              Add Certificate
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {error && step <= 6 && (
              <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Navigation buttons */}
            {step <= 6 && (
              <div className="mt-8 flex items-center justify-between border-t border-ink-50 pt-5">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || submitting}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-extrabold text-ink-400 transition hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(step)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-ink-900 px-5 text-sm font-extrabold text-white hover:bg-ink-700 transition disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Button
                    onClick={handleSubmitProfile}
                    disabled={submitting || !isStepValid(1) || !isStepValid(2) || !isStepValid(3) || !isStepValid(4)}
                    className="gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Submit & Start Interview <Sparkles className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
