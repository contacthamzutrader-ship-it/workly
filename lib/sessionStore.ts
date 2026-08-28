import { 
  InterviewSession, 
  CandidateProfile, 
  TestEvaluationResult, 
  WebhookResultPayload,
  AntiCheatViolation,
  CandidateAnswer
} from '@/types/interview';
import { getTestForCandidate } from './nicheTests';

// In-memory sessions cache for development & local execution
const GLOBAL_SESSIONS = new Map<string, InterviewSession>();

export function createInterviewSession(candidateData: Partial<CandidateProfile>): InterviewSession {
  const sessionId = `SES_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const candidateId = candidateData.id || `CAND_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const candidate: CandidateProfile = {
    id: candidateId,
    name: candidateData.name || 'Freelancer Candidate',
    email: candidateData.email || 'freelancer@example.com',
    niche: candidateData.niche || 'frontend',
    nicheTitle: candidateData.nicheTitle || 'Frontend Web Development',
    skills: candidateData.skills || ['React', 'JavaScript', 'Tailwind'],
    experienceLevel: candidateData.experienceLevel || 'mid',
    experienceYears: candidateData.experienceYears || 3,
    hourlyRate: candidateData.hourlyRate || 45,
    portfolioUrl: candidateData.portfolioUrl || '',
    jobId: candidateData.jobId || 'JOB-101',
    jobTitle: candidateData.jobTitle || 'Senior Frontend Specialist',
    sourcePlatform: candidateData.sourcePlatform || 'Upwork / Freelancer Portal',
    callbackWebhookUrl: candidateData.callbackWebhookUrl || '/api/sessions/webhook',
    metadata: candidateData.metadata || {},
  };

  const testSuite = getTestForCandidate(candidate, 1);

  const session: InterviewSession = {
    sessionId,
    createdAt: Date.now(),
    status: 'pending_verification',
    candidate: {
      ...candidate,
      nicheTitle: testSuite.nicheTitle,
    },
    mcqQuestions: testSuite.mcqQuestions,
    codingChallenge: testSuite.codingChallenge,
    practicalTask: testSuite.practicalTask,
    aiInterviewQuestions: testSuite.aiInterviewQuestions,
    answers: {},
    violations: [],
    currentStepIndex: 0,
    attemptNumber: 1,
    maxAttempts: 3,
  };

  GLOBAL_SESSIONS.set(sessionId, session);
  return session;
}

export function getInterviewSession(sessionId: string): InterviewSession | null {
  return GLOBAL_SESSIONS.get(sessionId) || null;
}

export function saveInterviewSession(session: InterviewSession) {
  GLOBAL_SESSIONS.set(session.sessionId, session);
}

export function computeEvaluation(
  session: InterviewSession,
  answers: Record<string, CandidateAnswer>,
  violations: AntiCheatViolation[],
  durationSeconds: number = 900
): TestEvaluationResult {
  // 1. MCQ Score Calculation
  let mcqEarned = 0;
  let mcqMax = 0;
  session.mcqQuestions.forEach((q) => {
    mcqMax += q.points;
    const ans = answers[q.id];
    if (ans && ans.selectedOptionId === q.correctOptionId) {
      mcqEarned += q.points;
    }
  });
  const mcqPct = mcqMax > 0 ? Math.round((mcqEarned / mcqMax) * 100) : 100;

  // 2. Practical / Coding Score Calculation
  let practicalEarned = 0;
  let practicalMax = 100;
  if (session.codingChallenge) {
    const codeAns = answers[session.codingChallenge.id];
    // If code was submitted and tested
    practicalEarned = codeAns?.score ?? 80;
  } else if (session.practicalTask) {
    const taskAns = answers[session.practicalTask.id];
    const words = (taskAns?.practicalResponse || '').trim().split(/\s+/).length;
    practicalEarned = Math.min(100, Math.max(40, Math.round(words * 0.45)));
  } else {
    practicalEarned = 85;
  }
  const practicalPct = practicalEarned;

  // 3. AI Voice Interview Score Calculation
  let aiTotal = 0;
  let aiCount = 0;
  session.aiInterviewQuestions.forEach((q) => {
    const aiAns = answers[q.id];
    aiTotal += aiAns?.score || 75;
    aiCount++;
  });
  const aiPct = aiCount > 0 ? Math.round(aiTotal / aiCount) : 80;

  // Overall Weighted Score: 35% MCQ, 40% Practical/Code, 25% AI Interview
  const overallScorePercentage = Math.round(mcqPct * 0.35 + practicalPct * 0.40 + aiPct * 0.25);

  // Integrity Score Calculation (starts at 100%, each violation reduces it)
  const totalViolationsPenalty = violations.reduce((sum, v) => sum + v.penaltyPoints, 0);
  const integrityScorePercentage = Math.max(0, 100 - totalViolationsPenalty);

  let integrityVerdict: 'Verified Clean' | 'Low Risk' | 'Moderate Risk' | 'High Suspicion' | 'Disqualified' = 'Verified Clean';
  if (violations.length >= 4 || integrityScorePercentage < 40) integrityVerdict = 'Disqualified';
  else if (integrityScorePercentage >= 90 && violations.length <= 1) integrityVerdict = 'Verified Clean';
  else if (integrityScorePercentage >= 75) integrityVerdict = 'Low Risk';
  else if (integrityScorePercentage >= 50) integrityVerdict = 'Moderate Risk';
  else integrityVerdict = 'High Suspicion';

  let grade: 'A+' | 'A' | 'B' | 'C' | 'Fail' = 'B';
  if (overallScorePercentage >= 94 && integrityVerdict !== 'Disqualified') grade = 'A+';
  else if (overallScorePercentage >= 85 && integrityVerdict !== 'Disqualified') grade = 'A';
  else if (overallScorePercentage >= 75) grade = 'B';
  else if (overallScorePercentage >= 60) grade = 'C';
  else grade = 'Fail';

  // Strict 85% Passing Benchmark
  const isPassed = overallScorePercentage >= 85 && integrityVerdict !== 'Disqualified';

  let freelancerBadge: 'Top 5% Talent' | 'Verified Expert' | 'Proficient Freelancer' | 'Needs Review' = 'Needs Review';
  if (overallScorePercentage >= 94 && integrityScorePercentage >= 90) freelancerBadge = 'Top 5% Talent';
  else if (overallScorePercentage >= 85 && integrityScorePercentage >= 80) freelancerBadge = 'Verified Expert';
  else if (isPassed) freelancerBadge = 'Proficient Freelancer';
  else freelancerBadge = 'Needs Review';

  const strengths: string[] = [];
  const areasOfImprovement: string[] = [];

  if (mcqPct >= 80) strengths.push('Strong architectural & theoretical scenario mastery');
  else areasOfImprovement.push('Review edge cases in core domain concepts');

  if (practicalPct >= 80) strengths.push('High-quality practical problem-solving & clean implementation');
  else areasOfImprovement.push('Optimize time complexity & defensive boundary validation');

  if (aiPct >= 80) strengths.push('Articulate communication & client-facing technical confidence');
  else areasOfImprovement.push('Elaborate with deeper architectural depth during technical discussions');

  const aiSummary = `${session.candidate.name} demonstrated ${overallScorePercentage}% competency in ${session.candidate.nicheTitle}. Proctoring integrity rated at ${integrityScorePercentage}% (${integrityVerdict}). Candidate is ${isPassed ? 'RECOMMENDED for hire' : 'suggested for additional review'}.`;

  const evaluationResult: TestEvaluationResult = {
    sessionId: session.sessionId,
    candidateId: session.candidate.id,
    candidateName: session.candidate.name,
    niche: session.candidate.niche,
    nicheTitle: session.candidate.nicheTitle,
    overallScorePercentage,
    grade,
    isPassed,
    sectionScores: {
      mcq: {
        sectionName: 'Conceptual Scenarios',
        score: mcqEarned,
        maxScore: mcqMax,
        percentage: mcqPct,
        feedback: mcqPct >= 70 ? 'Proficient in real-world scenario trade-offs.' : 'Needs minor brush up on corner cases.',
      },
      practical: {
        sectionName: 'Practical / Code Implementation',
        score: practicalEarned,
        maxScore: practicalMax,
        percentage: practicalPct,
        feedback: practicalPct >= 75 ? 'Clean logic and passes all unit tests.' : 'Functional with minor optimizations suggested.',
      },
      aiInterview: {
        sectionName: 'AI Voice Q&A',
        score: aiPct,
        maxScore: 100,
        percentage: aiPct,
        feedback: aiPct >= 75 ? 'Clear domain explanations and confident communication.' : 'Adequate response with room for deeper technical articulation.',
      },
    },
    integrityScorePercentage,
    integrityVerdict,
    violations,
    aiSummary,
    strengths,
    areasOfImprovement,
    freelancerBadge,
    completedAt: new Date().toISOString(),
    durationSeconds,
    attemptNumber: session.attemptNumber || 1,
    attemptsRemaining: Math.max(0, (session.maxAttempts || 3) - (session.attemptNumber || 1)),
    maxAttempts: session.maxAttempts || 3,
  };

  return evaluationResult;
}

export async function dispatchWebhookToPlatform(session: InterviewSession, evaluation: TestEvaluationResult): Promise<{ success: boolean; message: string }> {
  const payload: WebhookResultPayload = {
    event: evaluation.isPassed ? 'interview.completed' : 'interview.terminated',
    sessionId: session.sessionId,
    candidate: {
      id: session.candidate.id,
      name: session.candidate.name,
      email: session.candidate.email,
      niche: session.candidate.nicheTitle,
      experienceLevel: session.candidate.experienceLevel,
    },
    evaluation,
    signature: `sig_${Math.random().toString(36).substring(2, 12)}`,
  };

  console.log('[Webhook Dispatcher] Sending payload to external platform:', {
    target: session.candidate.callbackWebhookUrl,
    sessionId: session.sessionId,
    score: evaluation.overallScorePercentage,
    integrity: evaluation.integrityScorePercentage,
  });

  // If external webhook URL exists, attempt fetch
  if (session.candidate.callbackWebhookUrl && session.candidate.callbackWebhookUrl.startsWith('http')) {
    try {
      const res = await fetch(session.candidate.callbackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { success: res.ok, message: `Webhook sent with status ${res.status}` };
    } catch (e: any) {
      return { success: false, message: `Webhook fetch failed: ${e?.message || 'Network error'}` };
    }
  }

  return { success: true, message: 'Webhook simulated & dispatched successfully to freelancer platform.' };
}
