import { auth } from "./firebase";

// Client boundary for Workly's AI task quality, moderation and categorisation.
// Model calls stay server-side so provider credentials remain private.
export type TaskSuggestion = {
  category: string;
  tags: string[];
  improvedDescription: string;
  moderation: "approved" | "review";
  confidence: number | null;
  analysisMode?: "huggingface" | "heuristic";
};

export async function analyzeTask(title: string, description: string): Promise<TaskSuggestion | null> {
  try {
    const user = auth?.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    const res = await fetch("/api/hf/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TaskSuggestion;
  } catch {
    return null;
  }
}
