import { db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { listReviewsForUser } from "./tasks";

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

// Review-based component of the trust score (base 70; +2 per 5 stars, -2 per <=2 stars).
export async function computeTrustScore(uid: string): Promise<number> {
  let score = 70;
  const reviews = await listReviewsForUser(uid);
  for (const r of reviews) {
    if (r.rating >= 5) score += 2;
    else if (r.rating <= 2) score -= 2;
  }
  return score;
}

// Full trust score = review-based + stored penalty (e.g. fraud -20).
export async function recalcTrust(uid: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const penalty = snap.exists() ? (snap.data().trustPenalty ?? 0) : 0;
  const score = clamp((await computeTrustScore(uid)) + penalty);
  await updateDoc(ref, { trustScore: score });
}

// Fraud Detection applies a persistent penalty stored separately so it
// survives future review-based recalculations.
export async function applyTrustPenalty(uid: string, points: number): Promise<void> {
  if (!db) return;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const penalty = (snap.exists() ? (snap.data().trustPenalty ?? 0) : 0) + points;
  const score = clamp((await computeTrustScore(uid)) + penalty);
  await updateDoc(ref, { trustPenalty: penalty, trustScore: score });
}
