import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, requireFirebaseUser } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Cleaning", "Handyman", "Delivery", "Gardening", "IT & Web", "Design", "Moving", "Pet Care",
  "Tutoring", "Business & Admin", "Photography", "Cooking", "Furniture Assembly", "Painting",
  "Marketing & Design", "Writing & Translation", "Video & Audio", "Other",
];

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function enforceRateLimit(uid: string) {
  const { db } = getFirebaseAdmin();
  const minute = Math.floor(Date.now() / 60_000);
  const ref = db.collection("api_rate_limits").doc(`task-analysis_${uid}_${minute}`);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const count = Number(snap.data()?.count || 0);
    if (count >= 20) throw new Error("RATE_LIMIT");
    transaction.set(ref, {
      uid,
      endpoint: "task-analysis",
      count: count + 1,
      bucket: minute,
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis((minute + 120) * 60_000),
    }, { merge: true });
  });
}

function normalizeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : "";
}

function moderationFor(text: string) {
  const riskyPatterns = [
    /\b(whatsapp|telegram|direct transfer|crypto payment|password|otp|bank login)\b/i,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    /(?:\+?\d[\d\s().-]{7,}\d)/,
    /(.)\1{7,}/,
  ];
  return text.length < 25 || riskyPatterns.some((pattern) => pattern.test(text)) ? "review" : "approved";
}

function tagsFor(text: string) {
  return [...new Set(
    text.toLowerCase().split(/\s+/).map((word) => word.replace(/[^a-z0-9-]/g, "")).filter((word) => word.length > 4)
  )].slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseUser(request);
    await enforceRateLimit(decoded.uid);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 10_000) return error("Task analysis request is too large.", 413);
    const raw = await request.text();
    if (raw.length > 10_000) return error("Task analysis request is too large.", 413);

    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return error("Invalid request.", 400);
      body = parsed as Record<string, unknown>;
    } catch {
      return error("Invalid request.", 400);
    }

    const title = normalizeText(body.title, 90);
    const description = normalizeText(body.description, 6000);
    if (title.length < 3 || description.length < 10) return error("Add a task title and description before using AI review.", 400);

    const text = `${title}. ${description}`.trim();
    const moderation = moderationFor(text) as "approved" | "review";
    const tags = tagsFor(text);

    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const response = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text, parameters: { candidate_labels: CATEGORIES } }),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          const data = await response.json();
          const suggested = Array.isArray(data?.labels) && data.labels.length ? String(data.labels[0]) : "Other";
          const category = CATEGORIES.includes(suggested) ? suggested : "Other";
          const score = Array.isArray(data?.scores) && Number.isFinite(Number(data.scores[0])) ? Number(data.scores[0]) : null;
          return NextResponse.json({
            category,
            tags,
            improvedDescription: description,
            moderation,
            confidence: score,
            analysisMode: "huggingface",
          });
        }
      } catch {
        // Provider outages degrade to the bounded local heuristic below.
      }
    }

    const map: Record<string, string[]> = {
      Cleaning: ["clean", "cleaning", "wash", "vacuum", "tidy"],
      Handyman: ["fix", "repair", "plumb", "tap", "leak", "handyman", "assemble"],
      Delivery: ["deliver", "courier", "pickup", "ship", "parcel"],
      Gardening: ["garden", "lawn", "mow", "plant", "tree"],
      "IT & Web": ["website", "web", "code", "app", "bug", "computer", "data"],
      Design: ["design", "logo", "graphic", "brand", "poster"],
      Moving: ["move", "moving", "furniture", "relocation", "lift"],
      "Pet Care": ["pet", "dog", "cat", "walk", "sit"],
      Tutoring: ["tutor", "teach", "lesson", "math", "study"],
    };
    const lower = text.toLowerCase();
    let category = "Other";
    let best = 0;
    for (const [candidate, words] of Object.entries(map)) {
      const hits = words.filter((word) => lower.includes(word)).length;
      if (hits > best) {
        best = hits;
        category = candidate;
      }
    }

    return NextResponse.json({
      category,
      tags,
      improvedDescription: description,
      moderation,
      confidence: null,
      analysisMode: "heuristic",
    });
  } catch (caught) {
    const message = (caught as Error)?.message;
    if (message === "AUTH_REQUIRED") return error("Sign in to use task analysis.", 401);
    if (message === "RATE_LIMIT") return error("Too many AI reviews. Try again in a minute.", 429);
    console.error("task analysis error", caught);
    return error("Task analysis is temporarily unavailable.", 503);
  }
}
