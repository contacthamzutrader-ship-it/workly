// Hugging Face integration helpers (Phase 4).
// Kept as a ready-to-use client boundary so the rest of the app can call
// these without changes later. The actual model calls happen server-side
// (API route) to keep HUGGINGFACE_API_KEY secret.

export type TaskSuggestion = {
  category: string;
  tags: string[];
  improvedDescription: string;
};

// Placeholder until Phase 4 wiring. Will POST to /api/hf/analyze.
export async function analyzeTask(title: string, description: string): Promise<TaskSuggestion | null> {
  try {
    const res = await fetch("/api/hf/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TaskSuggestion;
  } catch {
    return null;
  }
}
