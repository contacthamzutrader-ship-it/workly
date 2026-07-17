"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createTask, CATEGORIES } from "@/lib/tasks";
import { analyzeTask, type TaskSuggestion } from "@/lib/hf";
import { getAutoApprove } from "@/lib/admin";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  ArrowRight,
  Calendar,
  Check,
  CircleDollarSign,
  FileText,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  WandSparkles,
  Zap,
} from "lucide-react";
import { formatPKR } from "@/lib/format";

export default function PostTaskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null);
  const [autoMode, setAutoMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/post");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) getAutoApprove().then(setAutoMode).catch(() => setAutoMode(false));
  }, [user]);

  const completion = useMemo(() => {
    const fields = [title.trim(), description.trim(), category, budget, location.trim()];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [title, description, category, budget, location]);

  if (loading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  }

  const handleAiSuggest = async () => {
    if (!title.trim() || !description.trim()) return;
    setAiLoading(true);
    try {
      const res = await analyzeTask(title, description);
      if (res) setSuggestion(res);
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    if (suggestion.category && CATEGORIES.includes(suggestion.category)) setCategory(suggestion.category);
    if (suggestion.improvedDescription) setDescription(suggestion.improvedDescription);
    setSuggestion(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auto = await getAutoApprove();
      const moderation = auto
        ? (suggestion || await analyzeTask(title, description))
        : null;
      const passedSmartReview = auto && moderation?.moderation === "approved";
      const id = await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        location: location.trim(),
        deadline: deadline || undefined,
        posterId: user.uid,
        posterName: user.displayName || user.email || "User",
        status: passedSmartReview ? "open" : "pending",
        visibility: "public",
        approvalMode: passedSmartReview ? "auto" : "manual",
        moderation: moderation?.moderation || "review",
      });
      router.push(`/tasks/${id}`);
    } catch (err: any) {
      setError(err.message || "Could not post task");
    } finally {
      setBusy(false);
    }
  };

  const labelClass = "mb-2 flex items-center gap-2 text-sm font-extrabold text-ink";
  const textareaClass = "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink placeholder:font-normal placeholder:text-ink-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

  return (
    <div className="bg-canvas py-10 sm:py-14">
      <div className="page-shell">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> New task</span>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">What do you need done?</h1>
            <p className="mt-3 max-w-xl text-base font-medium text-ink-500">Share the outcome, budget and timing. Workly handles the safest route from there.</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between text-xs font-bold"><span className="text-ink-400">Task completeness</span><span className="text-brand-dark">{completion}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completion}%` }} /></div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={submit} className="surface space-y-7 p-5 sm:p-8">
            <section>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-black text-white">1</span>
                <div><h2 className="font-black text-ink">Describe the outcome</h2><p className="text-xs font-medium text-ink-400">Clear details attract better professionals</p></div>
              </div>
              <div>
                <label className={labelClass}><FileText className="h-4 w-4 text-brand" /> Task title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Redesign our restaurant menu" maxLength={90} />
                <p className="mt-1.5 text-right text-[11px] font-bold text-ink-300">{title.length}/90</p>
              </div>
              <div className="mt-4">
                <label className={labelClass}><FileText className="h-4 w-4 text-brand" /> What does done look like?</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} minLength={20} placeholder="Include the current situation, expected result, important requirements and anything the tasker should bring..." className={textareaClass} />
              </div>

              {title.trim() && description.trim().length >= 20 && !suggestion && (
                <button type="button" onClick={handleAiSuggest} disabled={aiLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-sm font-extrabold text-brand-dark transition hover:bg-brand-100 disabled:opacity-50">
                  <WandSparkles className="h-4 w-4" /> {aiLoading ? "Workly AI is improving your task..." : "Improve with Workly AI"}
                </button>
              )}

              {suggestion && (
                <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                  <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm font-black text-ink"><Sparkles className="h-4 w-4 text-brand" /> AI recommendation</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${suggestion.moderation === "approved" ? "bg-white text-brand-dark" : "bg-amber-100 text-amber-700"}`}>{suggestion.moderation === "approved" ? "Looks safe" : "Manual review"}</span></div>
                  <p className="mt-3 text-sm leading-6 text-ink-600">{suggestion.improvedDescription}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{suggestion.tags.map(tag => <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink-500">#{tag}</span>)}</div>
                  <div className="mt-4 flex gap-2"><Button type="button" onClick={applySuggestion} className="min-h-9 px-4 py-1.5 text-xs">Apply suggestion</Button><button type="button" onClick={() => setSuggestion(null)} className="px-3 text-xs font-bold text-ink-400">Dismiss</button></div>
                </div>
              )}
            </section>

            <div className="h-px bg-ink-100" />

            <section>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-black text-white">2</span>
                <div><h2 className="font-black text-ink">Scope and budget</h2><p className="text-xs font-medium text-ink-400">Help the right people find your task</p></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}><Tag className="h-4 w-4 text-brand" /> Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-12 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}><CircleDollarSign className="h-4 w-4 text-brand" /> Total budget (PKR)</label>
                  <Input type="number" min={500} step={100} value={budget} onChange={(e) => setBudget(e.target.value)} required placeholder="25,000" />
                </div>
                <div>
                  <label className={labelClass}><MapPin className="h-4 w-4 text-brand" /> Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Lahore, DHA or Remote" />
                </div>
                <div>
                  <label className={labelClass}><Calendar className="h-4 w-4 text-brand" /> Preferred deadline</label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
            </section>

            {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            <div className="flex flex-col gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs font-medium text-ink-500"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span>By posting, you agree to keep communication and payment on Workly.</span></div>
              <Button type="submit" disabled={busy} className="shrink-0 gap-2 px-7">{busy ? "Checking & posting..." : "Post task"} {!busy && <ArrowRight className="h-4 w-4" />}</Button>
            </div>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-elevated">
              <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand"><ShieldCheck className="h-5 w-5" /></span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider">{autoMode ? "Smart mode on" : "Team review"}</span></div>
              <h2 className="mt-5 text-xl font-black">Your approval route</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{autoMode ? "AI checks safe, complete tasks and can publish them instantly. Anything uncertain goes to the admin team." : "Your task enters the admin approval centre before it becomes visible."}</p>
              <div className="mt-6 space-y-4">
                {[
                  [Zap, autoMode ? "AI quality & safety check" : "Manual quality review"],
                  [ShieldCheck, "Public or managed private route"],
                  [Check, "Clear status at every step"],
                ].map(([Icon, text]: any) => <div key={text} className="flex items-center gap-3 text-xs font-bold text-white/80"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><Icon className="h-4 w-4 text-brand-light" /></span>{text}</div>)}
              </div>
            </div>

            <div className="surface p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Budget preview</p>
              <p className="mt-2 text-2xl font-black text-ink">{budget ? formatPKR(Number(budget)) : "PKR -"}</p>
              <p className="mt-2 text-xs leading-5 text-ink-500">Professionals see one clear total budget. You can compare offers before choosing anyone.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
