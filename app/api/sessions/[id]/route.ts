import { NextRequest, NextResponse } from 'next/server';
import { getInterviewSessionAsync } from '@/lib/sessionStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getInterviewSessionAsync(id);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
  }

  // Defensively sanitize MCQ questions to prevent answer key leak to candidate browser
  const sanitizedMcqQuestions = (session.mcqQuestions || []).map((q) => ({
    id: q.id,
    scenario: q.scenario,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
    tags: q.tags,
    points: q.points,
  }));

  return NextResponse.json({
    success: true,
    session: {
      sessionId: session.sessionId,
      candidate: session.candidate,
      status: session.status,
      mcqQuestions: sanitizedMcqQuestions,
      codingChallenge: session.codingChallenge,
      practicalTask: session.practicalTask,
      aiInterviewQuestions: session.aiInterviewQuestions,
      evaluation: session.evaluation,
    },
  });
}
