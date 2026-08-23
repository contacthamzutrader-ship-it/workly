'use client';

import React, { useEffect, useState } from 'react';
import { TestEvaluationResult } from '@/types/interview';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  Terminal, 
  Radio, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  Timer,
  RefreshCw,
  Lock
} from 'lucide-react';

interface TestResultsModalProps {
  evaluation: TestEvaluationResult;
  onReturnToPlatform: () => void;
  onRetry?: () => void;
  redirectUrl?: string;
}

export default function TestResultsModal({ 
  evaluation, 
  onReturnToPlatform,
  onRetry,
  redirectUrl = '/'
}: TestResultsModalProps) {
  const [countdown, setCountdown] = useState<number>(10);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const attemptsRemaining = evaluation.attemptsRemaining ?? Math.max(0, 3 - (evaluation.attemptNumber || 1));
  const attemptNumber = evaluation.attemptNumber || 1;
  const maxAttempts = evaluation.maxAttempts || 3;
  const canRetry = !evaluation.isPassed && attemptsRemaining > 0;

  useEffect(() => {
    if (evaluation.isPassed) {
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.55 },
      });
    }
  }, [evaluation.isPassed]);

  // Automatic Countdown Redirect only if candidate PASSED
  useEffect(() => {
    if (!evaluation.isPassed) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [evaluation.isPassed]);

  const handleRedirect = () => {
    setIsRedirecting(true);
    try {
      if (evaluation.isPassed) {
        // PASSED: Unlock dashboard with Level 1 Verified badge
        const returnUrlObj = new URL(redirectUrl, window.location.origin);
        returnUrlObj.searchParams.set('status', 'passed');
        returnUrlObj.searchParams.set('assessment_status', 'passed');
        returnUrlObj.searchParams.set('score', String(evaluation.overallScorePercentage));
        returnUrlObj.searchParams.set('level', 'Level 1 Verified');
        returnUrlObj.searchParams.set('badge', 'Level 1 Verified Talent');
        returnUrlObj.searchParams.set('grade', evaluation.grade);
        returnUrlObj.searchParams.set('integrity_score', String(evaluation.integrityScorePercentage));
        returnUrlObj.searchParams.set('freelancer_badge', 'Level 1 Verified Talent');
        returnUrlObj.searchParams.set('session_id', evaluation.sessionId);
        returnUrlObj.searchParams.set('attempt', String(attemptNumber));

        window.location.href = returnUrlObj.toString();
      } else {
        // FAILED: Return to Onboarding / Test details area (NOT dashboard/profile)
        const parsedUrl = new URL(redirectUrl, window.location.origin);
        const origin = parsedUrl.origin;
        const failedReturnUrl = `${origin}/onboarding?status=failed&score=${evaluation.overallScorePercentage}&attempts_remaining=${attemptsRemaining}`;
        
        window.location.href = failedReturnUrl;
      }
    } catch {
      onReturnToPlatform();
    }
  };

  const getBadgeStyle = (badge: string) => {
    if (badge === 'Top 5% Talent') {
      return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300';
    }
    if (badge === 'Verified Expert') {
      return 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-300';
    }
    if (badge === 'Needs Review') {
      return 'bg-rose-500/20 border-rose-500/30 text-rose-300';
    }
    return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
  };

  const getIntegrityBadge = (verdict: string) => {
    if (verdict === 'Verified Clean') {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
    if (verdict === 'Low Risk') {
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    }
    if (verdict === 'Moderate Risk') {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex justify-center relative">
      <div className="max-w-4xl w-full space-y-8">
        {/* Top Automatic Redirect Banner (Shown if Passed) */}
        {evaluation.isPassed ? (
          <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
                <Timer className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-emerald-300 font-medium">Automatic Handover Ready</p>
                <p className="text-sm font-bold text-white">
                  Returning verified score to your original Freelancer Platform in{' '}
                  <span className="text-amber-400 font-mono text-base underline">{countdown}s</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleRedirect}
              disabled={isRedirecting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <span>{isRedirecting ? 'Redirecting...' : 'Redirect Now'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Failed Notice Banner with Attempt Counter */
          <div className="bg-rose-950/80 backdrop-blur-md border border-rose-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/30 flex items-center justify-center text-rose-400 font-mono font-bold">
                <RotateCcw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                    Attempt {attemptNumber} of {maxAttempts} Completed
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    {attemptsRemaining} {attemptsRemaining === 1 ? 'Attempt' : 'Attempts'} Remaining
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">
                  {attemptsRemaining > 0 
                    ? 'Score below 85% passing requirement. You can retry now with completely brand-new questions.' 
                    : 'All 3 attempts have been used. Please review your areas of improvement.'}
                </p>
              </div>
            </div>

            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/40 transition flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Test Now ({attemptsRemaining} Left)</span>
              </button>
            )}
          </div>
        )}

        {/* Main Verdict Card */}
        <div className={`bg-zinc-900/85 backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center ${
          evaluation.isPassed ? 'border-emerald-500/40' : 'border-rose-500/40'
        }`}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-3xl pointer-events-none ${
            evaluation.isPassed ? 'bg-emerald-600/20' : 'bg-rose-600/20'
          }`} />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold mb-4 shadow-lg">
            <span className={`px-3 py-1 rounded-full border ${getBadgeStyle(evaluation.freelancerBadge)}`}>
              ⭐ {evaluation.freelancerBadge}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            {evaluation.isPassed ? (
              <>
                <CheckCircle className="w-9 h-9 text-emerald-400 shrink-0" />
                <span>Assessment Passed &amp; Verified!</span>
              </>
            ) : (
              <>
                <XCircle className="w-9 h-9 text-rose-400 shrink-0" />
                <span>Assessment Failed - Passing Benchmark: 85%</span>
              </>
            )}
          </h1>

          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-2">
            Candidate: <strong className="text-white">{evaluation.candidateName}</strong> • Niche: <span className="text-indigo-400">{evaluation.nicheTitle}</span> • Attempt: <span className="text-amber-400 font-mono font-bold">{attemptNumber}/{maxAttempts}</span>
          </p>

          {/* 3 Core Big Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {/* Overall Score */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <p className="text-xs uppercase font-mono tracking-wider text-zinc-400">Technical Score</p>
              <div className={`text-4xl font-black mt-1 ${evaluation.isPassed ? 'text-white' : 'text-rose-400'}`}>
                {evaluation.overallScorePercentage}%
              </div>
              <span className={`text-xs font-mono font-semibold ${evaluation.isPassed ? 'text-indigo-400' : 'text-rose-400'}`}>
                Grade: {evaluation.grade} (Target: 85%)
              </span>
            </div>

            {/* Proctor Integrity Score */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <p className="text-xs uppercase font-mono tracking-wider text-zinc-400">Proctor Trust Score</p>
              <div className="text-4xl font-black text-emerald-400 mt-1">
                {evaluation.integrityScorePercentage}%
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold inline-block mt-1 ${getIntegrityBadge(evaluation.integrityVerdict)}`}>
                {evaluation.integrityVerdict}
              </span>
            </div>

            {/* Assessment Status */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <p className="text-xs uppercase font-mono tracking-wider text-zinc-400">Result Status</p>
              <div className="text-xl font-bold mt-2 flex items-center justify-center gap-1.5">
                {evaluation.isPassed ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-5 h-5" /> PASSED
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-5 h-5" /> FAILED ({attemptsRemaining} Left)
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                Duration: {Math.round(evaluation.durationSeconds / 60)} mins
              </span>
            </div>
          </div>
        </div>

        {/* Section Breakdown & Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. MCQ Score */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Scenario MCQs</h4>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                {evaluation.sectionScores.mcq.percentage}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${evaluation.sectionScores.mcq.percentage}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {evaluation.sectionScores.mcq.feedback}
            </p>
          </div>

          {/* 2. Practical / Code */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Practical Challenge</h4>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                {evaluation.sectionScores.practical.percentage}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${evaluation.sectionScores.practical.percentage}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {evaluation.sectionScores.practical.feedback}
            </p>
          </div>

          {/* 3. AI Voice Interview */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">AI Voice Q&amp;A</h4>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                {evaluation.sectionScores.aiInterview.percentage}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${evaluation.sectionScores.aiInterview.percentage}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {evaluation.sectionScores.aiInterview.feedback}
            </p>
          </div>
        </div>

        {/* Strengths & AI Insights */}
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> AI Competency Insights &amp; Recommendations
          </h3>
          <p className="text-sm text-zinc-300 font-sans leading-relaxed">{evaluation.aiSummary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Strengths */}
            <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Key Strengths
              </h5>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">✦</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas of Improvement */}
            <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-4">
              <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Growth Recommendations
              </h5>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {evaluation.areasOfImprovement.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400">✦</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Anti-Cheating Telemetry Audit Trail */}
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Proctoring &amp; Integrity Telemetry Log
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {evaluation.violations.length} Security Events Logged
            </span>
          </div>

          {evaluation.violations.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>
                100% Clean Session: Zero tab switches, zero paste injections, and uninterrupted full-screen compliance.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {evaluation.violations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-zinc-300">{v.details}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-rose-400">-{v.penaltyPoints} pts</span>
                    <span className="text-zinc-500 text-[11px]">{v.formattedTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-900/40 transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Test with Brand-New Questions ({attemptsRemaining} Attempts Remaining)</span>
            </button>
          )}

          <button
            onClick={handleRedirect}
            className={`py-4 px-6 text-white font-bold rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-sm sm:text-base group cursor-pointer ${
              evaluation.isPassed 
                ? 'w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40' 
                : canRetry 
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700' 
                  : 'w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
            }`}
          >
            <span>Return to Freelancer Platform</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
