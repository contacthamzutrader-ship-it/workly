import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/tasks";

// Real Hugging Face integration. If HUGGINGFACE_API_KEY is set it calls the
// hosted zero-shot classifier; otherwise it falls back to a local heuristic so
// the app still works before the key is added.
export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    const text = `${title}. ${description}`.trim();

    if (process.env.HUGGINGFACE_API_KEY && text) {
      try {
        const res = await fetch(
          "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: text,
              parameters: { candidate_labels: CATEGORIES },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const category =
            Array.isArray(data?.labels) && data.labels.length
              ? data.labels[0]
              : "Other";
          const tags = text
            .toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 4)
            .slice(0, 5);
          return NextResponse.json({
            category,
            tags,
            improvedDescription: description?.trim() || `I need help with: ${title}.`,
          });
        }
      } catch {
        /* fall through to heuristic */
      }
    }

    // Heuristic fallback
    const map: Record<string, string[]> = {
      Cleaning: ["clean", "cleaning", "wash", "vacuum", "tidy"],
      Handyman: ["fix", "repair", "plumb", "tap", "leak", "handyman", "assemble"],
      Delivery: ["deliver", "courier", "pickup", "ship", "parcel"],
      Gardening: ["garden", "lawn", "mow", "plant", "tree"],
      "IT & Web": ["website", "web", "code", "app", "bug", "it", "computer", "data"],
      Design: ["design", "logo", "graphic", "brand", "poster"],
      Moving: ["move", "moving", "furniture", "relocation", "lift"],
      "Pet Care": ["pet", "dog", "cat", "walk", "sit"],
      Tutoring: ["tutor", "teach", "lesson", "math", "study"],
    };
    const lower = text.toLowerCase();
    let category = "Other";
    let best = 0;
    for (const [cat, words] of Object.entries(map)) {
      const hits = words.filter((w) => lower.includes(w)).length;
      if (hits > best) {
        best = hits;
        category = cat;
      }
    }
    if (!CATEGORIES.includes(category)) category = "Other";
    const tags = lower.split(/\s+/).filter((w) => w.length > 4).slice(0, 5);

    return NextResponse.json({
      category,
      tags,
      improvedDescription: description?.trim() || `I need help with: ${title}.`,
    });
  } catch {
    return NextResponse.json({ category: "Other", tags: [], improvedDescription: "" });
  }
}
