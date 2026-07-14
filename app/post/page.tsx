"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createTask, CATEGORIES, type ApprovalMode, type Visibility } from "@/lib/tasks";
import { analyzeTask, type TaskSuggestion } from "@/lib/hf";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Sparkles } from "lucide-react";

export default function PostTaskPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("auto");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-ink/60">Loading...</div>;
  }

  const isAdmin = role === "company_admin" || role === "super_admin";

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
    if (suggestion.category && CATEGORIES.includes(suggestion.category)) {
      setCategory(suggestion.category);
    }
    if (suggestion.improvedDescription) {
      setDescription(suggestion.improvedDescription);
    }
    setSuggestion(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const vis: Visibility = isAdmin && visibility === "private" ? "private" : "public";
      const id = await createTask({
        title,
        description,
        category,
        budget: Number(budget),
        location,
        posterId: user.uid,
        posterName: user.displayName || user.email || "User",
        status: approvalMode === "auto" ? "open" : "pending",
        visibility: vis,
        approvalMode,
      });
      router.push(`/tasks/${id}`);
    } catch (err: any) {
      setError(err?.message || "Could not post task");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-ink">Post a Task</h1>
      <p className="mt-1 text-sm text-ink/60">
        Describe what you need done. Choose how it gets approved.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Fix leaking kitchen tap" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Add details, timing, requirements..."
            className="w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        {title.trim() && description.trim() && !suggestion && (
          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {aiLoading ? "Analyzing with AI..." : "Suggest category & improve description"}
          </button>
        )}

        {suggestion && (
          <div className="rounded-lg border border-brand/30 bg-brand/5 p-4 space-y-2">
            <p className="text-sm font-medium text-ink">AI Suggestion</p>
            <p className="text-sm text-ink/70">
              Category: <span className="font-semibold text-brand">{suggestion.category}</span>
            </p>
            {suggestion.improvedDescription && (
              <p className="text-sm text-ink/70 line-clamp-3">{suggestion.improvedDescription}</p>
            )}
            {suggestion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestion.tags.map((t) => (
                  <span key={t} className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">{t}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={applySuggestion} className="text-xs px-3 py-1.5">
                Apply
              </Button>
              <button type="button" onClick={() => setSuggestion(null)} className="text-xs px-3 py-1.5 text-ink/50 hover:text-ink">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Budget ($)</label>
            <Input type="number" min={1} value={budget} onChange={(e) => setBudget(e.target.value)} required placeholder="50" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="City, area" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Approval mode</label>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-ink/15 p-3 text-sm">
              <input type="radio" name="mode" checked={approvalMode === "auto"} onChange={() => setApprovalMode("auto")} />
              <span><span className="font-semibold">Auto</span> — approved &amp; public instantly</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-ink/15 p-3 text-sm">
              <input type="radio" name="mode" checked={approvalMode === "manual"} onChange={() => setApprovalMode("manual")} />
              <span><span className="font-semibold">Manual</span> — our team reviews it</span>
            </label>
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Visibility</label>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-ink/15 p-3 text-sm">
                <input type="radio" name="vis" checked={visibility === "public"} onChange={() => setVisibility("public")} />
                <span>Public</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-ink/15 p-3 text-sm">
                <input type="radio" name="vis" checked={visibility === "private"} onChange={() => setVisibility("private")} />
                <span>Private (only our team)</span>
              </label>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Posting..." : "Post Task"}
        </Button>
      </form>
    </div>
  );
}
