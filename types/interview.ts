export type NicheCategory = 
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'ai_datascience'
  | 'uiux_design'
  | 'digital_marketing'
  | 'copywriting'
  | 'devops'
  | 'qa_cybersecurity'
  | 'custom';

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  niche: NicheCategory;
  nicheTitle: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  experienceYears?: number;
  hourlyRate?: number;
  portfolioUrl?: string;
  jobId?: string;
  jobTitle?: string;
  sourcePlatform?: string;
  callbackWebhookUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  scenario: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: 'medium';
  tags: string[];
  points: number;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description: string;
  isHidden?: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'medium';
  language: 'javascript' | 'typescript' | 'python' | 'html_css';
  starterCode: string;
  solutionCode?: string;
  testCases: TestCase[];
  hints: string[];
  realWorldContext: string;
  timeLimitMinutes: number;
}

export interface PracticalTask {
  id: string;
  title: string;
  type: 'design_critique' | 'marketing_copy' | 'seo_audit' | 'architecture_review' | 'bug_report';
  scenario: string;
  instructions: string[];
  rubric: {
    criteria: string;
    weight: number;
  }[];
  starterContent: string;
  timeLimitMinutes: number;
}

export interface AIInterviewQuestion {
  id: string;
  question: string;
  category: 'technical_depth' | 'problem_solving' | 'freelance_delivery' | 'architecture';
  expectedKeyPoints: string[];
  followUpPrompt?: string;
}

export type AntiCheatViolationType = 
  | 'tab_switch'
  | 'window_blur'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'fullscreen_exit'
  | 'devtools_opened'
  | 'no_face_detected'
  | 'multiple_faces_detected'
  | 'rapid_bulk_paste'
  | 'right_click_attempt';

export interface AntiCheatViolation {
  id: string;
  type: AntiCheatViolationType;
  timestamp: number;
  formattedTime: string;
  details: string;
  penaltyPoints: number;
}

export interface CandidateAnswer {
  questionId: string;
  selectedOptionId?: string;
  submittedCode?: string;
  practicalResponse?: string;
  aiInterviewAudioTranscript?: string;
  timeSpentSeconds: number;
  isCorrect?: boolean;
  score?: number;
  maxScore?: number;
}

export interface SectionScore {
  sectionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
}

export interface TestEvaluationResult {
  sessionId: string;
  candidateId: string;
  candidateName: string;
  niche: NicheCategory;
  nicheTitle: string;
  overallScorePercentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'Fail';
  isPassed: boolean; // >= 65% is Pass
  sectionScores: {
    mcq: SectionScore;
    practical: SectionScore;
    aiInterview: SectionScore;
  };
  integrityScorePercentage: number; // Starts at 100%, drops with violations
  integrityVerdict: 'Verified Clean' | 'Low Risk' | 'Moderate Risk' | 'High Suspicion' | 'Disqualified';
  violations: AntiCheatViolation[];
  aiSummary: string;
  strengths: string[];
  areasOfImprovement: string[];
  freelancerBadge: 'Top 5% Talent' | 'Verified Expert' | 'Proficient Freelancer' | 'Needs Review';
  completedAt: string;
  durationSeconds: number;
  attemptNumber: number;
  attemptsRemaining: number;
  maxAttempts: number;
}

export interface InterviewSession {
  sessionId: string;
  createdAt: number;
  status: 'pending_verification' | 'in_progress' | 'completed' | 'terminated_cheating';
  candidate: CandidateProfile;
  mcqQuestions: MCQQuestion[];
  codingChallenge?: CodingChallenge;
  practicalTask?: PracticalTask;
  aiInterviewQuestions: AIInterviewQuestion[];
  answers: Record<string, CandidateAnswer>;
  violations: AntiCheatViolation[];
  currentStepIndex: number;
  evaluation?: TestEvaluationResult;
  attemptNumber: number;
  maxAttempts: number;
}

export interface WebhookResultPayload {
  event: 'interview.completed' | 'interview.terminated';
  sessionId: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    niche: string;
    experienceLevel: string;
  };
  evaluation: TestEvaluationResult;
  verificationBadgeUrl?: string;
  signature: string;
}
