// Client boundary for Workly's AI task quality, moderation and categorisation.
// Model calls stay server-side so HUGGINGFACE_API_KEY remains private.

export type TaskSuggestion = {
  category: string;
  tags: string[];
  improvedDescription: string;
  moderation: "approved" | "review";
  confidence: number;
};

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
