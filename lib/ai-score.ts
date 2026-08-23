export type AiResult = {
  skillScore: number;
  confidence: number;
  categories: string[];
  learning: string[];
  takenAt: string;
};

const KEY = "workly-ai-result";

export function saveAiResult(result: AiResult) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function getAiResult(): AiResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiResult;
  } catch {
    return null;
  }
}

export function computeAiScore(data: any): AiResult {
  const skills = Array.isArray(data?.skills) ? data.skills.length : 0;
  const certs = Array.isArray(data?.certifications) ? data.certifications.length : 0;
  const hasBio = Boolean(data?.bio?.trim());
  const hasTitle = Boolean(data?.professionalTitle?.trim());
  const trust = typeof data?.trustScore === "number" ? data.trustScore : 0;

  const skillScore = Math.min(
    99,
    30 +
      Math.min(skills, 6) * 7 +
      certs * 4 +
      (hasBio ? 8 : 0) +
      (hasTitle ? 8 : 0) +
      Math.round(trust * 0.15)
  );

  const confidence = Math.min(95, 40 + Math.min(skills, 5) * 6 + (hasTitle ? 12 : 0) + certs * 3 + Math.round(trust * 0.12));

  return {
    skillScore,
    confidence,
    categories:
      skills >= 3
        ? ["Web & App", "Content & Writing", "Virtual Assistant"]
        : ["Virtual Assistant", "Content & Writing", "Data Entry"],
    learning: [
      "Add 2–3 specific skills to unlock more job categories",
      "Complete your professional title for a stronger match",
      "Write a short bio clients can trust",
    ],
    takenAt: new Date().toISOString(),
  };
}
