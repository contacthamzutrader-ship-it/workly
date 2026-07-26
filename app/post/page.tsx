"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CircleDollarSign,
  FileText,
  Globe2,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, MIN_BUDGET, createTask, type Urgency } from "@/lib/tasks";
import { analyzeTask, type TaskSuggestion } from "@/lib/hf";
import { getPlatformSettings } from "@/lib/admin";
import { formatPKR } from "@/lib/format";
import Button from "@/components/ui/Button";
import Input, { Field, Select, Textarea } from "@/components/ui/Input";
import { Alert, PageLoader } from "@/components/ui/Feedback";

const URGENCIES: { value: Urgency; label: string; hint: string }[] = [
  { value: "flexible", label: "Flexible", hint: "No rush" },
  { value: "this_week", label: "This week", hint: "Within 7 days" },
  { value: "urgent", label: "Urgent", hint: "As soon as possible" },
];

const STEPS = ["Describe it", "Scope & budget", "Review & post"];

export default function PostTaskPage() {
  const { user, profile, role, capabilities, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("flexible");

  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [autoMode, setAutoMode] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login?redirect=/post");
    else if (!capabilities.canPostTask) router.replace("/dashboard");
  }, [loading, user, capabilities.canPostTask, router]);

  useEffect(() => {
    getPlatformSettings()
      .then((settings) => setAutoMode(settings.autoApprove))
      .catch(() => setAutoMode(false));
  }, []);

  const completion = useMemo(() => {
    const fields = [title.trim(), description.trim().length >= 30, category, budget, remote || location.trim()];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [title, description, category, budget, location, remote]);

  if (loading || !user) return <PageLoader />;

  const stepValid =
    step === 0
      ? title.trim().length >= 8 && description.trim().length >= 30
      : step === 1
        ? Number(budget) >= MIN_BUDGET && (remote || location.trim().length > 1)
        : true;

  const runAi = async () => {
    setAiBusy(true);
    try {
      const result = await analyzeTask(title, description);
      if (result) setSuggestion(result);
    } finally {
      setAiBusy(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    if (suggestion.category && CATEGORIES.includes(suggestion.category)) setCategory(suggestion.category);
    if (suggestion.improvedDescription) setDescription(suggestion.improvedDescription);
    setSuggestion(null);
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const settings = await getPlatformSettings();
      const moderation = settings.autoApprove ? suggestion || (await analyzeTask(title, description)) : null;
      const autoApproved = settings.autoApprove && moderation?.moderation === "approved";

      const id = await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        skills: suggestion?.tags?.slice(0, 6) || [],
        budget: Number(budget),
        location: remote ? "Remote" : location.trim(),
        remote,
        urgency,
        deadline: deadline || undefined,
        posterId: user.uid,
        posterName: profile?.name || user.displayName || user.email || "Client",
        status: autoApproved ? "open" : "pending",
        visibility: "public",
        approvalMode: autoApproved ? "auto" : "manual",
        moderation: moderation?.moderation || "review",
      });
      router.push(`/tasks/${id}`);
    } catch (caught) {
      setError((caught as Error)?.message || "We could not post your task.");
      setBusy(false);
    }
  };

  return (
    <div className="bg-canvas py-8 sm:py-12">
      <div className="page-shell">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> New task
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
              What do you need done?
            </h1>
            <p className="mt-3 max-w-xl text-base font-medium text-ink-500">
              Share the outcome, budget and timing. Workly routes it safely from there.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span className="text-ink-400">Task completeness</span>
              <span className="text-brand-dark">{completion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="surface overflow-hidden">
            <div className="flex border-b border-ink-100">
              {STEPS.map((label, index) => (
                <button
                  key={label}
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-4 text-xs font-black transition sm:text-sm ${
                    index === step
                      ? "border-b-2 border-brand text-brand-dark"
                      : index < step
                        ? "text-ink-500 hover:text-ink"
                        : "text-ink-300"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                      index < step ? "bg-brand text-white" : index === step ? "bg-brand-50 text-brand-dark" : "bg-ink-50 text-ink-300"
                    }`}
                  >
                    {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-6 p-5 sm:p-8">
              {step === 0 && (
                <>
                  <Field label="Task title" hint={`${title.length}/90`} required>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={90}
                      placeholder="e.g. Redesign our restaurant menu"
                    />
                  </Field>

                  <Field
                    label="What does done look like?"
                    hint={`${description.length} characters · minimum 30`}
                    required
                  >
                    <Textarea
                      rows={7}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe the current situation, the expected result, key requirements, and anything the freelancer needs to bring or know."
                    />
                  </Field>

                  {title.trim() && description.trim().length >= 30 && !suggestion && (
                    <button
                      type="button"
                      onClick={runAi}
                      disabled={aiBusy}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-sm font-black text-brand-dark transition hover:bg-brand-100 disabled:opacity-55"
                    >
                      <WandSparkles className="h-4 w-4" />
                      {aiBusy ? "Workly AI is reviewing your task…" : "Improve this with Workly AI"}
                    </button>
                  )}

                  {suggestion && (
                    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-black text-ink">
                          <Sparkles className="h-4 w-4 text-brand" /> AI recommendation
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                            suggestion.moderation === "approved" ? "bg-white text-brand-dark" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {suggestion.moderation === "approved" ? "Looks safe" : "Manual review"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink-600">{suggestion.improvedDescription}</p>
                      {suggestion.tags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {suggestion.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button type="button" size="sm" onClick={applySuggestion}>
                          Apply suggestion
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Category" required>
                      <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                        {CATEGORIES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Total budget (PKR)" hint={`Minimum ${formatPKR(MIN_BUDGET)}`} required>
                      <Input
                        type="number"
                        min={MIN_BUDGET}
                        step={100}
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        placeholder="25000"
                      />
                    </Field>
                  </div>

                  <Field label="Where does this happen?" required>
                    <div className="space-y-2.5">
                      <Input
                        value={remote ? "Remote — anywhere in Pakistan" : location}
                        onChange={(event) => setLocation(event.target.value)}
                        disabled={remote}
                        placeholder="Lahore, DHA Phase 5"
                      />
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-ink-50 px-3.5 py-3">
                        <input
                          type="checkbox"
                          checked={remote}
                          onChange={(event) => setRemote(event.target.checked)}
                          className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
                        />
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink-600">
                          <Globe2 className="h-4 w-4 text-brand" /> This can be done remotely
                        </span>
                      </label>
                    </div>
                  </Field>

                  <Field label="How soon do you need it?">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {URGENCIES.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setUrgency(option.value)}
                          className={`rounded-xl border p-3.5 text-left transition ${
                            urgency === option.value
                              ? "border-brand bg-brand-50 text-brand-dark"
                              : "border-ink-100 text-ink-500 hover:border-ink-200"
                          }`}
                        >
                          <span className="block text-sm font-black">{option.label}</span>
                          <span className="mt-0.5 block text-[11px]">{option.hint}</span>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Preferred deadline" hint="Optional">
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Preview</p>
                    <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-ink">{title || "Untitled task"}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-600">{description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink-500">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5">
                        <Tag className="h-3.5 w-3.5 text-brand" /> {category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5">
                        <CircleDollarSign className="h-3.5 w-3.5 text-brand" /> {budget ? formatPKR(Number(budget)) : "—"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5">
                        <MapPin className="h-3.5 w-3.5 text-brand" /> {remote ? "Remote" : location || "—"}
                      </span>
                      {deadline && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5">
                          <Calendar className="h-3.5 w-3.5 text-brand" /> {deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  <Alert tone="info" title={autoMode ? "Smart review is on" : "Your task goes to the review queue"}>
                    {autoMode
                      ? "Workly AI checks safe, complete tasks and can publish them instantly. Anything uncertain goes to a human moderator."
                      : "A Workly moderator will approve your task before freelancers can see it. This usually takes a short while."}
                  </Alert>

                  <p className="flex items-start gap-2 text-xs font-medium leading-5 text-ink-500">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    By posting, you agree to keep communication and payment on Workly. This protects both sides if
                    anything goes wrong.
                  </p>
                </>
              )}

              {error && <Alert tone="error">{error}</Alert>}

              <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-6">
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => setStep((current) => current - 1)} disabled={busy}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Link href="/dashboard" className="text-sm font-bold text-ink-400 hover:text-ink">
                    Cancel
                  </Link>
                )}

                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep((current) => current + 1)} disabled={!stepValid}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={submit} loading={busy} disabled={completion < 100}>
                    {busy ? "Posting" : "Post task"} {!busy && <ArrowRight className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[90px]">
            <div className="overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-elevated">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  {autoMode === null ? "Checking" : autoMode ? "Smart mode" : "Team review"}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black">Your approval route</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {autoMode
                  ? "AI checks safe, complete tasks and can publish them instantly. Anything uncertain goes to the admin team."
                  : "Your task enters the moderation queue before it becomes visible to freelancers."}
              </p>
              <div className="mt-6 space-y-3.5">
                {[
                  [Zap, autoMode ? "AI quality & safety check" : "Human quality review"],
                  [ShieldCheck, "Public or managed private route"],
                  [Check, "Clear status at every step"],
                ].map(([Icon, text]) => {
                  const Component = Icon as React.ComponentType<{ className?: string }>;
                  return (
                    <div key={String(text)} className="flex items-center gap-3 text-xs font-bold text-white/80">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
                        <Component className="h-4 w-4 text-brand-light" />
                      </span>
                      {String(text)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Budget preview</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">
                {budget ? formatPKR(Number(budget)) : "PKR —"}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-500">
                Freelancers see one clear total. You compare every offer before choosing anyone, and funds are only held
                once you hire.
              </p>
            </div>

            <div className="surface p-5">
              <p className="flex items-center gap-2 text-sm font-black text-ink">
                <FileText className="h-4 w-4 text-brand" /> Tips for better offers
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-ink-500">
                {[
                  "Say what success looks like, not just the task.",
                  "Mention any tools, access or materials you provide.",
                  "Give a realistic budget — very low budgets get few offers.",
                  "Add a deadline if timing actually matters.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
