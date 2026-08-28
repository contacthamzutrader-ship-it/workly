'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  InterviewSession, 
  CandidateAnswer, 
  AntiCheatViolation, 
  TestEvaluationResult,
  MCQQuestion,
  CandidateProfile 
} from '@/types/interview';
import { getTestForCandidate } from '@/lib/nicheTests';
import { computeEvaluation } from '@/lib/sessionStore';
import { useAuth } from '@/lib/auth-context';
import AntiCheatGuard from '@/components/AntiCheatGuard';
import CandidateVerificationModal from '@/components/CandidateVerificationModal';
import CodeEditor from '@/components/CodeEditor';
import DesignAndCaseStudyEditor from '@/components/DesignAndCaseStudyEditor';
import AIInterviewerCard from '@/components/AIInterviewerCard';
import TestResultsModal from '@/components/TestResultsModal';
import BackgroundVideoPlaylist from '@/components/BackgroundVideoPlaylist';
import { 
  Cpu, 
  Terminal, 
  Radio, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

function InterviewRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setInterviewPassed } = useAuth();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lockoutStatus, setLockoutStatus] = useState<{ isLocked: boolean; unlockDate?: Date } | null>(null);
  const [stage, setStage] = useState<'verification' | 'round1_mcq' | 'round2_practical' | 'round3_ai_interview' | 'results'>('verification');

  // Candidate Answers & Anti-Cheat state
  const [answers, setAnswers] = useState<Record<string, CandidateAnswer>>({});
  const [violations, setViolations] = useState<AntiCheatViolation[]>([]);
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [evaluationResult, setEvaluationResult] = useState<TestEvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Round 1 MCQ Navigation state
  const [currentMcqIndex, setCurrentMcqIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Round 3 AI Interview Navigation state
  const [currentAiIndex, setCurrentAiIndex] = useState<number>(0);

  // Timer & Attempt Tracking
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1800); // 30 minutes total
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const maxAttempts = 3;

  // Initialize Session from sessionId, Firestore profile, or URL Params
  useEffect(() => {
    async function init() {
      const sessionId = searchParams.get('sessionId');

      if (sessionId) {
        try {
          const res = await fetch(`/api/sessions/${sessionId}`);
          const data = await res.json();
          if (data.success && data.session) {
            setSession(data.session);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Could not fetch server session, falling back to local creation.');
        }
      }

      // Read candidate details from active logged-in user profile in Firestore
      let candidateData: Partial<CandidateProfile> = {};
      let initialAttemptNumber = 1;
      try {
        const { auth, db } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const currentUser = auth?.currentUser;
        if (currentUser && db) {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          if (snap.exists()) {
            const d = snap.data();
            
            // Check Lockout Status first!
            const failedAttempts = d.interviewFailedAttempts || 0;
            const lastAttemptTime = d.lastInterviewAttemptAt;
            
            if (failedAttempts >= 3 && lastAttemptTime) {
              const lastAttemptDate = new Date(lastAttemptTime);
              const unlockDate = new Date(lastAttemptDate);
              unlockDate.setMonth(unlockDate.getMonth() + 6);
              
              if (new Date() < unlockDate) {
                setLockoutStatus({ isLocked: true, unlockDate });
                setLoading(false);
                return;
              } else {
                // Reset failed count if 6 months passed
                try {
                  const { updateDoc } = await import('firebase/firestore');
                  await updateDoc(doc(db, "users", currentUser.uid), {
                    interviewFailedAttempts: 0
                  });
                } catch (e) {
                  console.error("Failed to reset lockout count in Firestore:", e);
                }
              }
            } else {
              initialAttemptNumber = failedAttempts + 1;
              setAttemptNumber(initialAttemptNumber);
            }

            // Helper to detect niche based on skills and title
            const detectNicheFromProfile = (pTitle: string, pSkills: string[]) => {
              const title = pTitle.toLowerCase();
              const skillsList = (pSkills || []).map(s => s.toLowerCase());

              if (title.includes("design") || title.includes("ui") || title.includes("ux") || skillsList.some(s => s.includes("design") || s.includes("photoshop") || s.includes("figma") || s.includes("ui"))) {
                return "uiux_design";
              }
              if (title.includes("backend") || title.includes("node") || title.includes("python") || title.includes("database") || title.includes("sql") || skillsList.some(s => s.includes("node") || s.includes("backend") || s.includes("django") || s.includes("express"))) {
                return "backend";
              }
              if (title.includes("fullstack") || title.includes("full stack") || title.includes("mern")) {
                return "fullstack";
              }
              if (title.includes("ai") || title.includes("machine") || title.includes("data") || title.includes("ml") || skillsList.some(s => s.includes("python") || s.includes("ai") || s.includes("tensorflow") || s.includes("pytorch"))) {
                return "ai_datascience";
              }
              if (title.includes("mobile") || title.includes("app") || title.includes("react-native") || title.includes("react native") || title.includes("flutter") || title.includes("android") || title.includes("ios")) {
                return "mobile";
              }
              if (title.includes("marketing") || title.includes("seo") || title.includes("ads") || skillsList.some(s => s.includes("seo") || s.includes("marketing") || s.includes("sem"))) {
                return "digital_marketing";
              }
              if (title.includes("write") || title.includes("content") || title.includes("copy") || skillsList.some(s => s.includes("write") || s.includes("content") || s.includes("copy"))) {
                return "copywriting";
              }
              return "frontend";
            };

            candidateData = {
              name: d.name || currentUser.displayName || 'Freelance Candidate',
              email: d.email || currentUser.email || 'freelancer@platform.com',
              niche: detectNicheFromProfile(d.professionalTitle || '', d.skills || []) as any,
              experienceLevel: (d.experienceYears >= 5 ? "senior" : d.experienceYears >= 2 ? "mid" : "junior") as any,
              hourlyRate: Number(d.hourlyRate) || 50,
              callbackWebhookUrl: '/api/sessions/webhook',
            };
          }
        }
      } catch (err) {
        console.error("Error fetching Firestore profile for interview room:", err);
      }

      // Fallback to query params if Firestore fetch did not succeed or user not logged in
      if (!candidateData.name) {
        candidateData = {
          name: searchParams.get('candidate_name') || searchParams.get('name') || 'Talent Candidate',
          email: searchParams.get('email') || 'freelancer@example.com',
          niche: (searchParams.get('niche') as any) || 'frontend',
          nicheTitle: searchParams.get('niche_title') || '',
          experienceLevel: (searchParams.get('experience') as any) || 'mid',
          hourlyRate: Number(searchParams.get('rate')) || 50,
          callbackWebhookUrl: searchParams.get('callback_url') || '/api/sessions/webhook',
        };
      }

      const testSuite = getTestForCandidate(candidateData, initialAttemptNumber);
      const generatedSession: InterviewSession = {
        sessionId: sessionId || `SES_${Date.now()}_LOCAL`,
        createdAt: Date.now(),
        status: 'pending_verification',
        candidate: {
          id: `CAND_${Date.now()}`,
          name: candidateData.name!,
          email: candidateData.email!,
          niche: candidateData.niche!,
          nicheTitle: testSuite.nicheTitle,
          skills: ['Domain Expertise', 'Problem Solving'],
          experienceLevel: candidateData.experienceLevel!,
          hourlyRate: candidateData.hourlyRate || 50,
          callbackWebhookUrl: candidateData.callbackWebhookUrl!,
        },
        mcqQuestions: testSuite.mcqQuestions,
        codingChallenge: testSuite.codingChallenge,
        practicalTask: testSuite.practicalTask,
        aiInterviewQuestions: testSuite.aiInterviewQuestions,
        answers: {},
        violations: [],
        currentStepIndex: 0,
        attemptNumber: initialAttemptNumber,
        maxAttempts: 3,
      };

      setSession(generatedSession);
      setLoading(false);
    }

    init();
  }, [searchParams, router]);

  // Overall Assessment Countdown Timer
  useEffect(() => {
    if (stage === 'verification' || stage === 'results') return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const [cheatingRestartModal, setCheatingRestartModal] = useState<boolean>(false);
  const [cheatingRestartReason, setCheatingRestartReason] = useState<string>('');

  const triggerCheatingAutoRestart = (reason: string) => {
    setCheatingRestartReason(reason);
    setCheatingRestartModal(true);

    // Reshuffle questions for restarted test
    const candidateData = session?.candidate || { niche: 'frontend' };
    const freshTestSuite = getTestForCandidate(candidateData, attemptNumber + 1);

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mcqQuestions: freshTestSuite.mcqQuestions,
        codingChallenge: freshTestSuite.codingChallenge,
        practicalTask: freshTestSuite.practicalTask,
        aiInterviewQuestions: freshTestSuite.aiInterviewQuestions,
        answers: {},
        violations: [],
      };
    });

    // Full state reset
    setAnswers({});
    setViolations([]);
    setIntegrityScore(100);
    setCurrentMcqIndex(0);
    setCurrentAiIndex(0);
    setSelectedOption(null);
    setTimeRemainingSeconds(1800);
    setStage('round1_mcq');
  };

  const handleViolation = (violation: AntiCheatViolation, allViolations: AntiCheatViolation[]) => {
    setViolations([...allViolations]);
    const penaltyTotal = allViolations.reduce((sum, v) => sum + v.penaltyPoints, 0);
    setIntegrityScore(Math.max(0, 100 - penaltyTotal));

    // 1. Strict Tab-Switch Rule: Immediate Auto-Restart
    if (violation.type === 'tab_switch') {
      triggerCheatingAutoRestart('Tab Switch Detected: Leaving the active assessment window is strictly prohibited. The test has been restarted from Question 1 with a fresh question set.');
      return;
    }

    // 2. Cheating Limit Exceeded Rule (4 Security Flags Triggered)
    if (allViolations.length >= 4 || penaltyTotal >= 60) {
      triggerCheatingAutoRestart('Cheating Limit Exceeded: Maximum allowable security flags (4/4) reached. The test has been automatically restarted from Question 1 with a fresh question set.');
    }
  };

  const handleTermination = (reason: string) => {
    triggerCheatingAutoRestart(`Security Protocol Triggered: ${reason}. Test has been restarted.`);
  };

  // 1. MCQ Handlers
  const handleSelectOption = (optionId: string) => {
    if (!session) return;
    const currentQ = session.mcqQuestions[currentMcqIndex];
    setSelectedOption(optionId);

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOptionId: optionId,
        isCorrect: optionId === currentQ.correctOptionId,
        score: optionId === currentQ.correctOptionId ? currentQ.points : 0,
        maxScore: currentQ.points,
        timeSpentSeconds: 45,
      },
    }));
  };

  const handleNextMcq = () => {
    if (!session) return;
    if (currentMcqIndex < session.mcqQuestions.length - 1) {
      const nextIdx = currentMcqIndex + 1;
      setCurrentMcqIndex(nextIdx);
      const nextQ = session.mcqQuestions[nextIdx];
      setSelectedOption(answers[nextQ.id]?.selectedOptionId || null);
    } else {
      // Proceed to Round 2 (Practical / Code)
      if (session.codingChallenge || session.practicalTask) {
        setStage('round2_practical');
      } else {
        setStage('round3_ai_interview');
      }
    }
  };

  // 2. Practical / Code Handlers
  const handleCodeChange = (code: string, passPercentage: number) => {
    if (!session?.codingChallenge) return;
    const challengeId = session.codingChallenge.id;
    setAnswers((prev) => ({
      ...prev,
      [challengeId]: {
        questionId: challengeId,
        submittedCode: code,
        score: passPercentage,
        maxScore: 100,
        timeSpentSeconds: 300,
      },
    }));
  };

  const handlePracticalContentChange = (content: string, wordCount: number) => {
    if (!session?.practicalTask) return;
    const taskId = session.practicalTask.id;
    const calculatedScore = Math.min(100, Math.max(40, Math.round(wordCount * 0.45)));
    setAnswers((prev) => ({
      ...prev,
      [taskId]: {
        questionId: taskId,
        practicalResponse: content,
        score: calculatedScore,
        maxScore: 100,
        timeSpentSeconds: 300,
      },
    }));
  };

  // 3. AI Voice Interview Handlers
  const handleAiAnswerSubmit = (transcript: string, score: number) => {
    if (!session) return;
    const currentQ = session.aiInterviewQuestions[currentAiIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        aiInterviewAudioTranscript: transcript,
        score,
        maxScore: 100,
        timeSpentSeconds: 60,
      },
    }));
  };

  const handleNextAiQuestion = () => {
    if (!session) return;
    if (currentAiIndex < session.aiInterviewQuestions.length - 1) {
      setCurrentAiIndex((prev) => prev + 1);
    } else {
      // Finished all rounds -> submit for evaluation
      handleSubmitAssessment();
    }
  };

  const syncResultsToPlatform = async (evaluation: TestEvaluationResult) => {
    // 1. Save to local storage for instant dashboard widget update
    const aiResult = {
      skillScore: evaluation.overallScorePercentage,
      confidence: evaluation.integrityScorePercentage,
      categories: [evaluation.nicheTitle || evaluation.niche],
      learning: evaluation.areasOfImprovement || [],
      takenAt: evaluation.completedAt,
    };
    localStorage.setItem("parwaz_ai_score", JSON.stringify(aiResult));

    // 2. Save to Firestore under current logged-in user
    try {
      const { auth, db } = await import('@/lib/firebase');
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const currentUser = auth?.currentUser;
      if (currentUser && db) {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        let failedCount = 0;
        if (snap.exists()) {
          failedCount = snap.data().interviewFailedAttempts || 0;
        }

        const isPassed = evaluation.isPassed;
        const newFailedCount = isPassed ? 0 : failedCount + 1;

        await updateDoc(userRef, {
          trustScore: evaluation.integrityScorePercentage,
          aiScore: evaluation.overallScorePercentage,
          freelancerBadge: evaluation.freelancerBadge,
          interviewPassed: isPassed,
          interviewFailedAttempts: newFailedCount,
          lastInterviewAttemptAt: new Date().toISOString(),
        });
        console.log("Successfully synced proctored assessment scores to Firestore.");
        setInterviewPassed(isPassed);
      }
    } catch (e) {
      console.error("Failed to sync assessment results to Firestore:", e);
    }
  };

  // Final Submit Handler
  const handleSubmitAssessment = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/sessions/${session.sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: session.candidate,
          answers,
          violations,
          durationSeconds: 1800 - timeRemainingSeconds,
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluationResult(data.evaluation);
        syncResultsToPlatform(data.evaluation);
        setStage('results');
      } else {
        // Fallback local compute if endpoint fails
        const { computeEvaluation } = await import('@/lib/sessionStore');
        const localEval = computeEvaluation(session, answers, violations, 1800 - timeRemainingSeconds);
        setEvaluationResult(localEval);
        syncResultsToPlatform(localEval);
        setStage('results');
      }
    } catch (err) {
      const localEval = computeEvaluation(session, answers, violations, 1800 - timeRemainingSeconds);
      localEval.attemptNumber = attemptNumber;
      localEval.attemptsRemaining = Math.max(0, maxAttempts - attemptNumber);
      localEval.maxAttempts = maxAttempts;
      setEvaluationResult(localEval);
      syncResultsToPlatform(localEval);
      setStage('results');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry Handler for Failed Assessments: Generates completely brand-new questions!
  const handleRetryAssessment = () => {
    const nextAttempt = attemptNumber + 1;
    if (nextAttempt > maxAttempts) {
      alert('All attempts have been used.');
      return;
    }
    setAttemptNumber(nextAttempt);

    // Generate fresh randomized questions & shuffled options
    const candidateData = session?.candidate || { niche: 'frontend' };
    const freshTestSuite = getTestForCandidate(candidateData, nextAttempt);

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        attemptNumber: nextAttempt,
        mcqQuestions: freshTestSuite.mcqQuestions,
        codingChallenge: freshTestSuite.codingChallenge,
        practicalTask: freshTestSuite.practicalTask,
        aiInterviewQuestions: freshTestSuite.aiInterviewQuestions,
        answers: {},
        violations: [],
      };
    });

    setAnswers({});
    setViolations([]);
    setIntegrityScore(100);
    setCurrentMcqIndex(0);
    setCurrentAiIndex(0);
    setSelectedOption(null);
    setTimeRemainingSeconds(1800);
    setEvaluationResult(null);
    setStage('round1_mcq');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 font-mono text-sm">Configuring Secure Assessment Room...</p>
      </div>
    );
  }

  if (lockoutStatus && lockoutStatus.isLocked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950 text-red-400 border border-red-500/30">
            <span className="text-2xl font-black">!</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Assessment Locked</h2>
            <p className="text-sm font-semibold text-red-400">Maximum Attempts Reached</p>
            <p className="text-xs text-zinc-400 leading-relaxed pt-2">
              Aap ne 3 bar test attempt kiya aur fail ho gaye hain. Policy ke mutabiq, aap agla test 6 months baad hi de saktay hain taaki aap mazeed seekh kar dubara try karain.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You have failed 3 test attempts. As per platform policy, you must wait 6 months to retake the skill check.
            </p>
          </div>

          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4">
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Unlocks On</span>
            <span className="block mt-1 text-lg font-black text-white">
              {lockoutStatus.unlockDate?.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full min-h-12 bg-zinc-850 hover:bg-zinc-800 text-white rounded-xl text-sm font-extrabold transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white space-y-4">
        <p className="text-zinc-400 font-mono text-sm">Failed to generate dynamic session. Please retry from dashboard.</p>
      </div>
    );
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const redirectUrl = searchParams.get('redirect_url') || '/';

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col select-none relative overflow-hidden">
      {/* Background Video Playlist looping through the 7 videos in sequence */}
      <BackgroundVideoPlaylist />

      {/* 1. Device Verification & Readiness Stage */}
      {stage === 'verification' && (
        <CandidateVerificationModal
          candidate={session.candidate}
          totalMCQs={session.mcqQuestions.length}
          hasCoding={!!session.codingChallenge}
          hasPractical={!!session.practicalTask}
          totalAIQuestions={session.aiInterviewQuestions.length}
          onProceed={() => setStage('round1_mcq')}
        />
      )}

      {/* Cheating Limit Exceeded / Security Violation Auto-Restart Alert Modal */}
      {cheatingRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-zinc-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold uppercase text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                Anti-Cheat Policy Violation
              </span>
              <h3 className="text-xl font-bold text-white mt-3">
                Assessment Restarted From Beginning
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 text-left font-mono">
              {cheatingRestartReason || 'Cheating limit exceeded or unauthorized tab switch detected. Your previous answers have been invalidated and your 30-minute test has been reset to Question 1 with a fresh question pool.'}
            </p>

            <button
              onClick={() => setCheatingRestartModal(false)}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-900/50 cursor-pointer"
            >
              I Understand &amp; Resume Restarted Test
            </button>
          </div>
        </div>
      )}

      {/* 2. Results Modal Stage */}
      {stage === 'results' && evaluationResult && (
        <TestResultsModal
          evaluation={evaluationResult}
          onReturnToPlatform={() => router.push(redirectUrl)}
          onRetry={handleRetryAssessment}
          redirectUrl={redirectUrl}
        />
      )}

      {/* Active Assessment Navigation & Header Bar */}
      {stage !== 'verification' && stage !== 'results' && (
        <>
          {/* AI Anti-Cheat Guard & Webcam Proctoring Feed */}
          <AntiCheatGuard
            isActive={true}
            onViolation={handleViolation}
            onTerminate={handleTermination}
            violations={violations}
            integrityScore={integrityScore}
          />

          {/* Top Assessment Header */}
          <header className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">
                  {session.candidate.nicheTitle}
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  Candidate: {session.candidate.name} ({session.candidate.experienceLevel.toUpperCase()})
                </p>
              </div>
            </div>

            {/* Stages Step Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                  stage === 'round1_mcq'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Round 1: Scenarios
              </span>

              <span
                className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                  stage === 'round2_practical'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Round 2: Practical
              </span>

              <span
                className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                  stage === 'round3_ai_interview'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Round 3: AI Voice
              </span>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-xl font-mono text-xs text-zinc-200">
              <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Time Left: <strong className="text-white">{formatTimer(timeRemainingSeconds)}</strong></span>
            </div>
          </header>

          {/* Main Assessment Container */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
            {/* STAGE 1: Real-World Scenario MCQs */}
            {stage === 'round1_mcq' && session.mcqQuestions.length > 0 && (
              <div className="space-y-6">
                {/* Question Progress Header */}
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                    Scenario Question {currentMcqIndex + 1} of {session.mcqQuestions.length}
                  </span>
                  <span>{session.mcqQuestions[currentMcqIndex].points} Points • Medium Difficulty</span>
                </div>

                {/* Question Card */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                  {/* Scenario Context */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200 leading-relaxed font-sans">
                    <strong className="text-white block mb-1 font-mono uppercase tracking-wider text-[11px]">
                      Scenario Context:
                    </strong>
                    {session.mcqQuestions[currentMcqIndex].scenario}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {session.mcqQuestions[currentMcqIndex].question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    {session.mcqQuestions[currentMcqIndex].options.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 text-xs sm:text-sm ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                              : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-600 text-white'
                                : 'border-zinc-700 bg-zinc-900'
                            }`}
                          >
                            {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                    <button
                      disabled={currentMcqIndex === 0}
                      onClick={() => {
                        const prevIdx = currentMcqIndex - 1;
                        setCurrentMcqIndex(prevIdx);
                        const prevQ = session.mcqQuestions[prevIdx];
                        setSelectedOption(answers[prevQ.id]?.selectedOptionId || null);
                      }}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous Question</span>
                    </button>

                    <button
                      onClick={handleNextMcq}
                      disabled={!selectedOption}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition flex items-center gap-2"
                    >
                      <span>
                        {currentMcqIndex === session.mcqQuestions.length - 1
                          ? 'Proceed to Round 2 (Practical)'
                          : 'Next Scenario'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: Practical Coding / Case Study Sandbox */}
            {stage === 'round2_practical' && (
              <div className="space-y-4">
                {session.codingChallenge ? (
                  <CodeEditor
                    challenge={session.codingChallenge}
                    onCodeChange={handleCodeChange}
                    initialCode={answers[session.codingChallenge.id]?.submittedCode}
                  />
                ) : session.practicalTask ? (
                  <DesignAndCaseStudyEditor
                    task={session.practicalTask}
                    onContentChange={handlePracticalContentChange}
                    initialContent={answers[session.practicalTask.id]?.practicalResponse}
                  />
                ) : null}

                {/* Proceed to Round 3 Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStage('round3_ai_interview')}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-900/40 transition flex items-center gap-2"
                  >
                    <span>Proceed to Round 3 (Live AI Voice Interview)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: AI Voice & Audio Interviewer */}
            {stage === 'round3_ai_interview' && session.aiInterviewQuestions.length > 0 && (
              <div className="space-y-4">
                <AIInterviewerCard
                  question={session.aiInterviewQuestions[currentAiIndex]}
                  questionNumber={currentAiIndex + 1}
                  totalQuestions={session.aiInterviewQuestions.length}
                  onAnswerSubmit={handleAiAnswerSubmit}
                  initialTranscript={
                    answers[session.aiInterviewQuestions[currentAiIndex].id]?.aiInterviewAudioTranscript
                  }
                />

                {/* AI Navigation / Finish Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentAiIndex === 0}
                    onClick={() => setCurrentAiIndex((prev) => prev - 1)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous Question</span>
                  </button>

                  <button
                    onClick={handleNextAiQuestion}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-emerald-900/40 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {currentAiIndex === session.aiInterviewQuestions.length - 1
                        ? isSubmitting
                          ? 'Evaluating & Generating Verified Report...'
                          : 'Complete Assessment & Generate Report'
                        : 'Next AI Voice Question'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default function InterviewRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InterviewRoomContent />
    </Suspense>
  );
}
