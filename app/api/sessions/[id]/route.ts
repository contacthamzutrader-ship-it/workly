import { NextRequest, NextResponse } from 'next/server';
import { getInterviewSession } from '@/lib/sessionStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getInterviewSession(id);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    session: {
      sessionId: session.sessionId,
      candidate: session.candidate,
      status: session.status,
      mcqQuestions: session.mcqQuestions,
      codingChallenge: session.codingChallenge,
      practicalTask: session.practicalTask,
      aiInterviewQuestions: session.aiInterviewQuestions,
      evaluation: session.evaluation,
    },
  });
}
