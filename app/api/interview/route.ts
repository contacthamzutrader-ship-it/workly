import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, requireFirebaseUser } from "@/lib/firebase-admin-server";
import {
  INTERVIEW_CONSENT_VERSION,
  INTERVIEW_MAX_ANSWER_LENGTH,
  INTERVIEW_MIN_ANSWER_LENGTH,
  INTERVIEW_QUESTION_COUNT,
  type InterviewAnswer,
  type InterviewRecord,
} from "@/lib/interview";
import { assessInterview, generateQuestion, sanitizeProfile } from "@/lib/interview-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type StartBody = {
  action: "start";
  consent: boolean;
};

type AnswerBody = {
  action: "answer";
  attemptId: string;
  answer: string;
};

type InterviewRequestBody = StartBody | AnswerBody;

function responseFromRecord(record: InterviewRecord) {
  const index = record.answers?.length || 0;
  return {
    attemptId: record.attemptId,
    attemptNumber: record.attemptNumber,
    status: record.status,
    questionIndex: Math.min(index, INTERVIEW_QUESTION_COUNT),
    totalQuestions: INTERVIEW_QUESTION_COUNT,
    question: record.status === "in_progress" ? record.questions?.[index] || null : null,
    answers: record.answers || [],
    assessment: record.assessment || null,
  };
}

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseBody(request: Request): Promise<InterviewRequestBody | null> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return null;
  }

  if (!isRecord(value)) return null;
  if (value.action === "start") {
    return {
      action: "start",
      consent: value.consent === true,
    };
  }
  if (value.action === "answer") {
    return {
      action: "answer",
      attemptId: typeof value.attemptId === "string" ? value.attemptId.trim() : "",
      answer: typeof value.answer === "string" ? value.answer : "",
    };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseUser(request);
    const body = await parseBody(request);
    if (!body) return apiError("Invalid interview request.", 400);

    const { db } = getFirebaseAdmin();
    const userRef = db.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return apiError("Complete account setup before starting the interview.", 404);
    const userData = userSnap.data() || {};
    if (userData.role !== "tasker") return apiError("The Workly interview is available to freelancer accounts.", 403);

    const interviewRef = db.collection("interviews").doc(decoded.uid);

    if (body.action === "start") {
      if (body.consent !== true) return apiError("Consent is required before the interview can begin.", 400);

      const existingSnap = await interviewRef.get();
      if (existingSnap.exists) {
        const existing = existingSnap.data() as InterviewRecord;
        if (["in_progress", "awaiting_review", "verified"].includes(existing.status)) {
          return NextResponse.json(responseFromRecord(existing));
        }
      }

      const profile = sanitizeProfile(userData);
      if (!userData.bio?.trim() || !profile.professionalTitle || profile.skills.length === 0) {
        return apiError("Add your professional title, bio, and at least one skill before starting.", 409);
      }

      const previous = existingSnap.exists ? existingSnap.data() as InterviewRecord : null;
      const attemptNumber = (previous?.attemptNumber || 0) + 1;
      if (attemptNumber > 3) {
        return apiError("You have reached the self-service retake limit. Contact Workly support for help.", 429);
      }

      const firstQuestion = await generateQuestion(profile, []);
      const record: InterviewRecord = {
        userId: decoded.uid,
        attemptId: crypto.randomUUID(),
        attemptNumber,
        status: "in_progress",
        consentVersion: INTERVIEW_CONSENT_VERSION,
        profileSnapshot: profile,
        questions: [firstQuestion],
        answers: [],
        startedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await db.runTransaction(async (transaction) => {
        const latest = await transaction.get(interviewRef);
        const latestRecord = latest.exists ? latest.data() as InterviewRecord : null;

        if (latestRecord && ["in_progress", "awaiting_review", "verified"].includes(latestRecord.status)) {
          throw new Error("INTERVIEW_STATE_CHANGED");
        }

        if ((latestRecord?.attemptNumber || 0) !== (previous?.attemptNumber || 0)) {
          throw new Error("INTERVIEW_STATE_CHANGED");
        }

        if (latestRecord?.attemptId) {
          const historyRef = interviewRef.collection("history").doc(latestRecord.attemptId);
          transaction.set(historyRef, {
            ...latestRecord,
            archivedAt: Timestamp.now(),
          });
        }

        transaction.set(interviewRef, record);
        transaction.update(userRef, {
          interviewStatus: "in_progress",
          interviewAttemptNumber: attemptNumber,
          interviewUpdatedAt: FieldValue.serverTimestamp(),
        });
      });

      return NextResponse.json(responseFromRecord(record));
    }

    if (body.action === "answer") {
      const answer = body.answer.trim();
      if (!body.attemptId) return apiError("This interview session is invalid. Please restart it.", 400);
      if (answer.length < INTERVIEW_MIN_ANSWER_LENGTH) {
        return apiError(`Please give a little more detail (at least ${INTERVIEW_MIN_ANSWER_LENGTH} characters).`, 400);
      }
      if (answer.length > INTERVIEW_MAX_ANSWER_LENGTH) {
        return apiError(`Keep each answer under ${INTERVIEW_MAX_ANSWER_LENGTH.toLocaleString()} characters.`, 400);
      }

      const currentSnap = await interviewRef.get();
      if (!currentSnap.exists) return apiError("No active interview was found.", 404);
      const current = currentSnap.data() as InterviewRecord;
      if (current.attemptId !== body.attemptId) return apiError("This interview tab is out of date. Refresh to continue.", 409);
      if (current.status !== "in_progress") return NextResponse.json(responseFromRecord(current));

      const answerIndex = current.answers?.length || 0;
      if (answerIndex >= INTERVIEW_QUESTION_COUNT) return apiError("All interview questions are already complete.", 409);
      const activeQuestion = current.questions?.[answerIndex];
      if (!activeQuestion) return apiError("The current interview question could not be loaded.", 409);

      const answered: InterviewAnswer = {
        ...activeQuestion,
        answer,
        answeredAt: Timestamp.now(),
      };
      const nextAnswers = [...(current.answers || []), answered];
      const isComplete = nextAnswers.length >= INTERVIEW_QUESTION_COUNT;
      const assessment = isComplete ? await assessInterview(current.profileSnapshot, nextAnswers) : undefined;
      const nextQuestion = isComplete ? null : await generateQuestion(current.profileSnapshot, nextAnswers);

      let savedRecord: InterviewRecord | null = null;
      await db.runTransaction(async (transaction) => {
        const latestSnap = await transaction.get(interviewRef);
        if (!latestSnap.exists) throw new Error("INTERVIEW_NOT_FOUND");
        const latest = latestSnap.data() as InterviewRecord;
        if (latest.attemptId !== body.attemptId || latest.status !== "in_progress") throw new Error("INTERVIEW_STALE");
        if ((latest.answers?.length || 0) !== answerIndex) throw new Error("ANSWER_ALREADY_SAVED");

        const update: Record<string, unknown> = {
          answers: nextAnswers,
          updatedAt: Timestamp.now(),
        };
        if (isComplete && assessment) {
          update.status = "awaiting_review";
          update.assessment = assessment;
          update.completedAt = Timestamp.now();
          transaction.update(userRef, {
            interviewStatus: "awaiting_review",
            interviewScore: assessment.score,
            interviewSummary: assessment.summary,
            interviewTopSkills: assessment.verifiedSkills,
            interviewUpdatedAt: FieldValue.serverTimestamp(),
          });
        } else if (nextQuestion) {
          update.questions = [...latest.questions, nextQuestion];
        }
        transaction.update(interviewRef, update);
        savedRecord = { ...latest, ...update } as InterviewRecord;
      });

      if (!savedRecord) return apiError("The interview could not be saved.", 500);
      return NextResponse.json(responseFromRecord(savedRecord));
    }

    return apiError("Unsupported interview action.", 400);
  } catch (error: unknown) {
    const typedError = error as { code?: unknown; message?: unknown } | null;
    const code = String(typedError?.code || "");
    const message = String(typedError?.message || "");
    if (message === "AUTH_REQUIRED" || code.includes("id-token") || code.includes("auth/")) {
      return apiError("Your session expired. Sign in again and retry.", 401);
    }
    if (["INTERVIEW_ALREADY_STARTED", "INTERVIEW_STATE_CHANGED", "ANSWER_ALREADY_SAVED", "INTERVIEW_STALE"].includes(message)) {
      return apiError("Your interview changed in another tab. Refresh this page to continue.", 409);
    }
    if (code.includes("credential") || message.includes("Could not load the default credentials")) {
      return apiError("The secure interview service is not configured yet. An administrator must add Firebase server credentials.", 503);
    }
    console.error("Interview API error", error);
    return apiError("The interview service is temporarily unavailable. Your previous answers are safe; please retry.", 500);
  }
}
