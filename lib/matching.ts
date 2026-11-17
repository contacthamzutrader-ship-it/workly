import type { Task } from "./tasks";

// AI Matching / Ranking (docs Part 1: Matching + Ranking logic)
// Rank Score = (Semantic Similarity * 0.5) + (Trust/100 * 0.3) + (Success/100 * 0.2)
export function categorySimilarity(taskCat: string, freelancerSkills: string[] = []): number {
  if (!freelancerSkills || !freelancerSkills.length) return 0.3;
  const target = taskCat.toLowerCase().trim();
  const lowerSkills = freelancerSkills.map((s) => s.toLowerCase().trim());

  // Direct match
  if (lowerSkills.includes(target)) return 1.0;

  // Substring or token overlap
  const targetTokens = target.split(/[\s&/,-]+/).filter((t) => t.length > 2);
  for (const skill of lowerSkills) {
    if (skill.includes(target) || target.includes(skill)) return 0.9;
    for (const token of targetTokens) {
      if (skill.includes(token)) return 0.75;
    }
  }

  return 0.4;
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
// bidder's user doc (trustScore, successRate, skills, createdAt).
export function computeBidMatch(task: Task, profile: {
  trust?: number;
  success?: number;
  skills?: string[];
  createdAt?: any;
}): BidMatch {
  const similarity = categorySimilarity(task.category, profile.skills || []);
  const trust = profile.trust ?? 70;
  const success = profile.success ?? 80;
  const isFresh = isFreshTalent(profile.createdAt);
  // Fresh talent engine adds a +0.08 bonus (up to 8% rank boost) for new talent
  const freshBoost = isFresh ? 0.08 : 0;
  const baseScore = rankScore({ similarity, trust, success });
  const score = Math.min(1.0, baseScore + freshBoost);
  return { similarity, trust, success, score, percent: Math.round(score * 100) };
}

// Fresh Talent Engine (docs Part 2): accounts newer than 14 days get a boost.
export function isFreshTalent(createdAt: any): boolean {
  const seconds = createdAt?.seconds ?? 0;
  if (!seconds) return false;
  const ageDays = (Date.now() / 1000 - seconds) / 86400;
  return ageDays <= 14;
}

// Visibility Rotation Engine (epsilon-greedy rotation to ensure fair distribution)
export function withRotation<T>(items: T[], epsilon = 0.15): T[] {
  if (!items || items.length <= 1) return items || [];
  const copy = [...items];
  for (let i = 0; i < copy.length; i++) {
    if (Math.random() < epsilon) {
      const swapIdx = Math.floor(Math.random() * copy.length);
      const temp = copy[i];
      copy[i] = copy[swapIdx];
      copy[swapIdx] = temp;
    }
  }
  return copy;
}
