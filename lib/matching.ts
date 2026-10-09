import type { Task } from "./tasks";

// Comprehensive domain taxonomy mapping categories to relevant technical and domain skills
const SKILL_TAXONOMY: Record<string, string[]> = {
  "it & web": [
    "react", "next.js", "nextjs", "javascript", "typescript", "node", "nodejs",
    "python", "django", "fastapi", "frontend", "backend", "fullstack", "web",
    "html", "css", "tailwind", "tailwindcss", "wordpress", "php", "laravel",
    "shopify", "developer", "programming", "software", "database", "sql", "postgresql",
    "mongodb", "api", "rest", "graphql", "mobile", "flutter", "react native", "vue",
    "angular", "git", "aws", "docker", "devops", "cloud", "ai", "machine learning"
  ],
  "design": [
    "figma", "ui/ux", "ui", "ux", "graphic design", "logo", "logo design",
    "branding", "brand identity", "photoshop", "illustrator", "creative",
    "banner", "social media design", "posters", "typography", "canva",
    "video editing", "after effects", "premiere pro", "3d", "blender", "wireframe", "prototype"
  ],
  "marketing & design": [
    "marketing", "digital marketing", "seo", "social media", "social media marketing",
    "ads", "meta ads", "facebook ads", "google ads", "instagram marketing",
    "content marketing", "copywriting", "growth", "campaign", "funnel", "email marketing",
    "content creation", "influencer marketing", "sem"
  ],
  "business & admin": [
    "virtual assistant", "va", "data entry", "excel", "google sheets", "admin",
    "administrative", "customer support", "transcription", "email handling",
    "accounting", "bookkeeping", "quickbooks", "crm", "lead generation",
    "project management", "market research"
  ],
  "tutoring": [
    "math", "mathematics", "english", "physics", "science", "chemistry",
    "coding tutor", "programming tutor", "teaching", "urdu", "academic writing",
    "assignment help", "sat", "o levels", "a levels", "matric", "fsc"
  ],
  "handyman": [
    "carpentry", "plumbing", "electrician", "appliance repair", "ac repair",
    "ac servicing", "installation", "maintenance", "wiring", "welding", "technician"
  ],
  "delivery": [
    "delivery", "courier", "rider", "dispatch", "errands", "parcel", "pickup", "dropoff"
  ],
  "cleaning": [
    "deep cleaning", "house cleaning", "maid", "office cleaning", "car wash",
    "sofa cleaning", "carpet cleaning", "sanitization"
  ],
  "moving": [
    "moving", "packing", "shifting", "loaders", "relocation", "heavy lifting", "transport"
  ],
  "gardening": [
    "gardening", "landscaping", "lawn mowing", "plants", "horticulture", "garden maintenance"
  ],
  "pet care": [
    "pet care", "dog walking", "pet sitting", "grooming", "vet", "pet trainer"
  ],
  "photography": [
    "photography", "videography", "photo editing", "event photography",
    "portrait", "product photography", "camera", "lightroom"
  ],
  "cooking": [
    "cooking", "catering", "chef", "baking", "meal prep", "food preparation"
  ],
  "furniture assembly": [
    "furniture assembly", "ikea assembly", "carpentry", "woodwork", "installation"
  ],
  "painting": [
    "painting", "wall painting", "whitewash", "interior painting", "exterior painting"
  ],
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

/**
 * Intelligent Semantic Similarity calculation:
 * Evaluates skill relevance using domain taxonomy, keyword overlap, and direct matches.
 */
export function categorySimilarity(taskCat: string, freelancerSkills: string[] = []): number {
  if (!freelancerSkills || freelancerSkills.length === 0) return 0.35;

  const normalizedCat = normalizeText(taskCat);
  const normalizedSkills = freelancerSkills.map((s) => normalizeText(s));

  // 1. Direct exact match
  if (normalizedSkills.some((s) => s === normalizedCat || normalizedCat.includes(s) || s.includes(normalizedCat))) {
    return 1.0;
  }

  // 2. Taxonomy lookup for category
  const relatedKeywords = SKILL_TAXONOMY[normalizedCat] || [];
  let taxonomyMatches = 0;

  for (const skill of normalizedSkills) {
    if (relatedKeywords.includes(skill)) {
      taxonomyMatches += 2;
    } else if (relatedKeywords.some((k) => skill.includes(k) || k.includes(skill))) {
      taxonomyMatches += 1;
    }
  }

  if (taxonomyMatches >= 3) return 0.95;
  if (taxonomyMatches === 2) return 0.88;
  if (taxonomyMatches === 1) return 0.75;

  // 3. Fallback token-level overlap
  const catTokens = normalizedCat.split(/\s+/).filter((t) => t.length > 2);
  const skillTokens = normalizedSkills.flatMap((s) => s.split(/\s+/)).filter((t) => t.length > 2);

  const overlap = catTokens.some((ct) => skillTokens.includes(ct));
  if (overlap) return 0.65;

  return 0.40;
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

/**
 * Computes a candidate's intelligent match against a task.
 * Incorporates semantic skill matching, trust scoring, and historical success.
 */
export function computeBidMatch(
  task: Task,
  profile: {
    trust?: number;
    success?: number;
    skills?: string[];
  }
): BidMatch {
  let similarity = categorySimilarity(task.category || "", profile.skills || []);

  // Contextual boost if task title has direct keyword matches with freelancer skills
  if (task.title && profile.skills?.length) {
    const normTitle = normalizeText(task.title);
    const hasTitleKeyword = profile.skills.some((skill) => {
      const normSkill = normalizeText(skill);
      return normSkill.length > 2 && normTitle.includes(normSkill);
    });
    if (hasTitleKeyword) {
      similarity = Math.min(1.0, similarity + 0.15);
    }
  }

  const trust = Math.max(0, Math.min(100, profile.trust ?? 70));
  const success = Math.max(0, Math.min(100, profile.success ?? 80));
  const score = rankScore({ similarity, trust, success });
  const percent = Math.min(99, Math.max(35, Math.round(score * 100)));

  return { similarity, trust, success, score, percent };
}

// Fresh Talent Engine: accounts newer than 14 days get a discovery boost.
// Resilient to Firestore Timestamps, ISO strings, and Date objects.
export function isFreshTalent(createdAt: any): boolean {
  if (!createdAt) return false;
  let millis = 0;
  if (typeof createdAt?.toMillis === "function") {
    millis = createdAt.toMillis();
  } else if (typeof createdAt?.seconds === "number") {
    millis = createdAt.seconds * 1000;
  } else if (typeof createdAt === "string" || typeof createdAt === "number" || createdAt instanceof Date) {
    millis = new Date(createdAt).getTime();
  }
  if (!millis || Number.isNaN(millis)) return false;
  const ageDays = (Date.now() - millis) / (1000 * 86400);
  return ageDays >= 0 && ageDays <= 14;
}
