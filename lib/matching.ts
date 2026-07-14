import type { Task } from "./tasks";

// AI Matching / Ranking (docs Part 1: Matching + Ranking logic)
// Rank Score = (Semantic Similarity * 0.5) + (Trust/100 * 0.3) + (Success/100 * 0.2)
export function categorySimilarity(taskCat: string, freelancerSkills: string[] = []): number {
  if (!freelancerSkills.length) return 0.3;
  return freelancerSkills.includes(taskCat) ? 1 : 0.4;
}

export function rankScore(opts: { similarity: number; trust: number; success: number }): number {
  return opts.similarity * 0.5 + (opts.trust / 100) * 0.3 + (opts.success / 100) * 0.2;
}

export interface BidMatch {
  similarity: number;
  trust: number;
  success: number;
  score: number;
  percent: number;
}

// Compute a candidate's match against a task. `profile` comes from the
// bidder's user doc (trustScore, successRate, skills).
export function computeBidMatch(task: Task, profile: {
  trust?: number;
  success?: number;
  skills?: string[];
}): BidMatch {
  const similarity = categorySimilarity(task.category, profile.skills || []);
  const trust = profile.trust ?? 70;
  const success = profile.success ?? 80;
  const score = rankScore({ similarity, trust, success });
  return { similarity, trust, success, score, percent: Math.round(score * 100) };
}

// Fresh Talent Engine (docs Part 2): accounts newer than 14 days get a boost.
export function isFreshTalent(createdAt: any): boolean {
  const seconds = createdAt?.seconds ?? 0;
  if (!seconds) return false;
  const ageDays = (Date.now() / 1000 - seconds) / 86400;
  return ageDays <= 14;
}

// Visibility Rotation (docs Part 2): inject ~10% fresh/unseen candidates.
export function withRotation<T>(ranked: T[], fresh: T[]): T[] {
  if (!fresh.length) return ranked;
  const rotated: T[] = [];
  ranked.forEach((item, i) => {
    rotated.push(item);
    if (i % 10 === 9 && fresh.length) rotated.push(fresh.shift() as T);
  });
  return rotated.concat(fresh);
}
