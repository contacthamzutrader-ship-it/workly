"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  INTERVIEW_MAX_ANSWER_LENGTH,
  INTERVIEW_MIN_ANSWER_LENGTH,
  INTERVIEW_QUESTION_COUNT,
  type InterviewAssessment,
  type InterviewQuestion,
  type InterviewRecord,
  type InterviewStatus,
} from "@/lib/interview";
import Button from "@/components/ui/Button";

type ApiState = {
  attemptId: string;
  attemptNumber: number;
  status: InterviewStatus;
  questionIndex: number;
  totalQuestions: number;
  question: InterviewQuestion | null;
  answers: InterviewRecord["answers"];
  assessment: InterviewAssessment | null;
};

type ProfileReadiness = {
  name: string;
  professionalTitle: string;
  bio: string;
  skills: string[];
};

export default function FreelancerInterviewPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileReadiness | null>(null);
  const [session, setSession] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/profile/interview");
    if (!authLoading && user && role && role !== "freelancer") router.replace("/profile");
  }, [authLoading, user, role, router]);

  useEffect(() => {
    if (!user || !db || role !== "freelancer") return;
    let active = true;
    (async () => {
      try {
        const [profileSnap, interviewSnap] = await Promise.all([
          getDoc(doc(db!, "users", user.uid)),
          getDoc(doc(db!, "interviews", user.uid)),
        ]);
        if (!active) return;
        const data = profileSnap.data() || {};
        setProfile({
          name: String(data.name || ""),
          professionalTitle: String(data.professionalTitle || ""),
          bio: String(data.bio || ""),
          skills: Array.isArray(data.skills) ? data.skills : [],
        });
        if (interviewSnap.exists()) {
          const record = interviewSnap.data() as InterviewRecord;
          setSession({
            attemptId: record.attemptId,
            attemptNumber: record.attemptNumber,
            status: record.status,
            questionIndex: record.answers?.length || 0,
            totalQuestions: INTERVIEW_QUESTION_COUNT,
            question: record.status === "in_progress" ? record.questions?.[record.answers?.length || 0] || null : null,
            answers: record.answers || [],
            assessment: record.assessment || null,
          });
          if (record.status === "in_progress") setConsent(true);
        }
      } catch {
        setError("We could not load your interview. Refresh and try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, role]);

  const readiness = useMemo(() => ({
    title: Boolean(profile?.professionalTitle.trim()),
    bio: Boolean(profile?.bio.trim()),
    skills: Boolean(profile?.skills.length),
  }), [profile]);
  const profileReady = readiness.title && readiness.bio && readiness.skills;

  const callInterview = async (body: Record<string, unknown>) => {
    if (!user) throw new Error("Sign in to continue.");
    const token = await user.getIdToken();
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "The interview service could not respond.");
    return data as ApiState;
  };

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await callInterview({ action: "start", consent });
      setSession(data);
    } catch (err: any) {
      setError(err?.message || "Could not start the interview.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const data = await callInterview({ action: "answer", attemptId: session.attemptId, answer });
      setSession(data);
      setAnswer("");
    } catch (err: any) {
      setError(err?.message || "Could not save this answer.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading || !user || role !== "freelancer") {
    return <div className="grid min-h-[70vh] place-items-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>;
  }

  if (!profileReady) {
    return (
      <div className="bg-canvas py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to profile</Link>
          <div className="mt-6 overflow-hidden rounded-[32px] bg-ink p-7 text-white shadow-elevated sm:p-10">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><ClipboardCheck className="h-7 w-7" /></span>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-brand-300">One step before the interview</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Give Aira enough context to ask useful questions.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">Complete the role-specific parts of your profile first. Your interview questions are based on this information.</p>
          </div>
          <div className="mt-5 surface p-6">
            <div className="space-y-3">
              {[
                ["Professional title", readiness.title],
                ["Profile bio", readiness.bio],
                ["At least one skill", readiness.skills],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center gap-3 rounded-2xl bg-ink-50 p-4">
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "bg-white text-ink-300"}`}>{done ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>
                  <span className={`text-sm font-extrabold ${done ? "text-ink" : "text-ink-500"}`}>{label}</span>
                </div>
              ))}
            </div>
            <Link href="/profile?setup=1" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-glow">Complete profile <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    );
  }

  if (session && ["awaiting_review", "verified"].includes(session.status)) {
    const isVerified = session.status === "verified";
    return (
      <div className="bg-canvas py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to profile</Link>
          <div className={`mt-6 overflow-hidden rounded-[34px] p-7 text-white shadow-elevated sm:p-10 ${isVerified ? "bg-emerald-700" : "bg-ink"}`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${isVerified ? "bg-white/15" : "bg-brand"}`}>{isVerified ? <BadgeCheck className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}</span>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-white/60">{isVerified ? "Workly interviewed" : "Interview submitted"}</p>
                <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{isVerified ? "Your interview badge is live." : "A human reviewer is next."}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">{isVerified ? "Clients can now see that your structured interview and evidence were reviewed by Workly." : "Aira prepared an evidence summary. A Workly team member—not the AI—makes the badge decision."}</p>
              </div>
              {session.assessment && <div className="min-w-32 rounded-2xl bg-white/10 p-5 text-center"><p className="text-4xl font-black">{session.assessment.score}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/55">Evidence score</p></div>}
            </div>
          </div>

          {session.assessment && (
            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="surface p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-dark">Assessment summary</p>
                <p className="mt-3 text-base font-semibold leading-7 text-ink-600">{session.assessment.summary}</p>
                <div className="mt-6 space-y-4">
                  {session.assessment.dimensions.map((dimension) => (
                    <div key={dimension.key}>
                      <div className="mb-2 flex items-center justify-between text-xs font-extrabold"><span className="text-ink-600">{dimension.label}</span><span className="text-brand-dark">{dimension.score}/100</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-50"><div className="h-full rounded-full bg-brand" style={{ width: `${dimension.score}%` }} /></div>
                      <p className="mt-1.5 text-[11px] leading-5 text-ink-400">{dimension.evidence}</p>
                    </div>
                  ))}
                </div>
              </section>
              <aside className="space-y-4">
                <div className="surface p-5"><ShieldCheck className="h-5 w-5 text-brand" /><h2 className="mt-3 text-sm font-black text-ink">Responsible review</h2><p className="mt-2 text-xs leading-5 text-ink-500">The score supports review; it does not automatically approve, reject, rank, or suspend anyone.</p></div>
                <Link href="/profile" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white">Return to profile <ArrowRight className="h-4 w-4" /></Link>
              </aside>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (session?.status === "in_progress" && session.question) {
    const progress = Math.round((session.questionIndex / session.totalQuestions) * 100);
    return (
      <div className="min-h-[80vh] bg-canvas py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Save & exit</Link>
            <span className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-ink-400">Attempt {session.attemptNumber} of 3</span>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="overflow-hidden rounded-[30px] border border-ink-100 bg-white shadow-card">
              <div className="bg-ink p-6 text-white sm:p-8">
                <div className="flex items-center gap-3"><span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-brand"><Bot className="h-6 w-6" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink bg-emerald-400" /></span><div><p className="font-black">Aira</p><p className="text-xs font-semibold text-white/45">Structured interview agent</p></div></div>
                <div className="mt-6 flex items-center justify-between text-xs font-bold"><span className="text-white/50">Question {session.questionIndex + 1} of {session.totalQuestions}</span><span className="text-brand-300">{progress}% complete</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-light transition-all" style={{ width: `${Math.max(8, progress)}%` }} /></div>
              </div>

              <form onSubmit={submitAnswer} className="p-6 sm:p-8">
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-brand-dark">{session.question.competency.replace(/([A-Z])/g, " $1")}</span>
                <h1 className="mt-5 text-2xl font-black leading-9 tracking-[-0.025em] text-ink sm:text-3xl">{session.question.question}</h1>
                <p className="mt-3 text-sm leading-6 text-ink-500">Be specific about your own actions, tools, decisions, and results. Honest examples are more useful than perfect wording.</p>
                <textarea
                  autoFocus
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value.slice(0, INTERVIEW_MAX_ANSWER_LENGTH))}
                  rows={9}
                  placeholder="Write your answer here..."
                  className="mt-6 w-full resize-y rounded-2xl border border-ink-200 bg-ink-50/50 px-4 py-4 text-sm font-medium leading-6 text-ink placeholder:text-ink-300 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold"><span className={answer.trim().length >= INTERVIEW_MIN_ANSWER_LENGTH ? "text-emerald-600" : "text-ink-400"}>{answer.trim().length < INTERVIEW_MIN_ANSWER_LENGTH ? `${INTERVIEW_MIN_ANSWER_LENGTH - answer.trim().length} more characters recommended` : "Detailed enough to submit"}</span><span className="text-ink-300">{answer.length}/{INTERVIEW_MAX_ANSWER_LENGTH}</span></div>
                {error && <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
                <div className="mt-6 flex flex-col gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs font-semibold text-ink-400"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Each answer is saved securely</p>
                  <Button type="submit" disabled={busy || answer.trim().length < INTERVIEW_MIN_ANSWER_LENGTH} className="gap-2 px-6">{busy ? "Aira is reviewing..." : session.questionIndex + 1 === session.totalQuestions ? "Submit interview" : "Save & next question"} {!busy && <ArrowRight className="h-4 w-4" />}</Button>
                </div>
              </form>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="surface p-5"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Already covered</p><div className="mt-4 space-y-3">{session.answers.map((item, index) => <div key={`${item.competency}-${index}`} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-3.5 w-3.5" /></span><span className="text-xs font-extrabold capitalize text-ink-500">{item.competency.replace(/([A-Z])/g, " $1")}</span></div>)}{session.answers.length === 0 && <p className="text-xs leading-5 text-ink-400">Your completed competencies will appear here.</p>}</div></div>
              <div className="rounded-3xl bg-brand-50 p-5"><LockKeyhole className="h-5 w-5 text-brand" /><h2 className="mt-3 text-sm font-black text-ink">No surveillance</h2><p className="mt-2 text-xs leading-5 text-ink-500">Workly does not use video, face, voice, eye movement, emotion, or personality scoring.</p></div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to profile</Link>
        <div className="mt-6 grid overflow-hidden rounded-[36px] bg-ink text-white shadow-elevated lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative p-7 sm:p-10 lg:p-12">
            <div className="absolute inset-0 noise opacity-40" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-brand-300"><Sparkles className="h-3.5 w-3.5" /> Workly interview</span>
              <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">Show clients how you think—not just what you claim.</h1>
              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-white/60">Aira asks four structured questions based on your service. Your evidence is summarized for a Workly human reviewer before any badge goes live.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[[MessageSquareText, "4 questions", "Role-relevant"], [Clock3, "10–15 min", "Save as you go"], [UserRoundCheck, "Human review", "AI never decides"]].map(([Icon, title, body]: any) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><Icon className="h-5 w-5 text-brand-300" /><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-[11px] text-white/45">{body}</p></div>)}
              </div>
            </div>
          </div>

          <div className="bg-white p-7 text-ink sm:p-10 lg:p-12">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-black">Before you begin</h2><p className="text-xs font-semibold text-ink-400">Transparent, text-only assessment</p></div></div>
            <div className="mt-7 space-y-4">
              {[
                "Questions and answers are stored with your Workly account for reviewer access.",
                "The AI evaluates job-related evidence only; it does not analyze protected traits or biometrics.",
                "A human reviewer makes the badge decision and can override the automated summary.",
                "Do not include client secrets, passwords, private contact details, or confidential files.",
              ].map((item) => <div key={item} className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-3 w-3" /></span><p className="text-xs font-semibold leading-5 text-ink-500">{item}</p></div>)}
            </div>
            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand" />
              <span><span className="block text-sm font-extrabold text-ink">I understand and agree to this AI-assisted interview</span><span className="mt-1 block text-[11px] leading-5 text-ink-400">I can stop and return later. My submitted answers remain available to authorized reviewers.</span></span>
            </label>
            {error && <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
            <Button onClick={start} disabled={!consent || busy} className="mt-5 w-full gap-2">{busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Preparing your interview...</> : <>Begin interview <ArrowRight className="h-4 w-4" /></>}</Button>
            <p className="mt-3 text-center text-[10px] font-semibold text-ink-300">Do not refresh while Aira is preparing the next question.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
