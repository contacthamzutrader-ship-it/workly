export const INTERVIEW_QUESTION_COUNT = 4;
export const INTERVIEW_MIN_ANSWER_LENGTH = 60;
export const INTERVIEW_MAX_ANSWER_LENGTH = 2400;
export const INTERVIEW_CONSENT_VERSION = "2026-07-26";

export type InterviewStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_review"
  | "verified"
  | "needs_improvement";

export type InterviewCompetency =
  | "experience"
  | "expertise"
  | "problemSolving"
  | "communication";

export type InterviewQuestion = {
  question: string;
  competency: InterviewCompetency;
};

export type InterviewAnswer = InterviewQuestion & {
  answer: string;
  answeredAt?: unknown;
};

export type InterviewDimension = {
  key: "expertise" | "problemSolving" | "communication" | "professionalism";
  label: string;
  score: number;
  evidence: string;
};

export type InterviewAssessment = {
  score: number;
  summary: string;
  strengths: string[];
  developmentAreas: string[];
  verifiedSkills: string[];
  dimensions: InterviewDimension[];
  assessmentMode: "ai" | "structured_fallback";
};

export type InterviewRecord = {
  userId: string;
  attemptId: string;
  attemptNumber: number;
  status: InterviewStatus;
  consentVersion: string;
  profileSnapshot: {
    name: string;
    professionalTitle: string;
    skills: string[];
    experienceYears: number;
    languages: string[];
  };
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  assessment?: InterviewAssessment;
  startedAt?: unknown;
  updatedAt?: unknown;
  completedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  reviewNote?: string;
};

export function interviewStatusLabel(status?: string) {
  switch (status) {
    case "in_progress": return "Interview in progress";
    case "awaiting_review": return "Human review pending";
    case "verified": return "Workly interviewed";
    case "needs_improvement": return "Retake available";
    default: return "Interview not started";
  }
}

export function interviewStatusTone(status?: string) {
  switch (status) {
    case "verified": return "bg-$success-50 text-$success-700 border-$success-200";
    case "awaiting_review": return "bg-$warning-50 text-$warning-700 border-$warning-200";
    case "in_progress": return "bg-$info-50 text-$info-700 border-$info-200";
    case "needs_improvement": return "bg-$danger-50 text-$danger-700 border-$danger-200";
    default: return "bg-ink-50 text-ink-500 border-ink-100";
  }
}
