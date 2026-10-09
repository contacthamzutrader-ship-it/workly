import { NextRequest, NextResponse } from 'next/server';
import { getInterviewSessionAsync, saveInterviewSession, computeEvaluation, createInterviewSession } from '@/lib/sessionStore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { candidate, answers, violations, durationSeconds } = body;

    let session = await getInterviewSessionAsync(id);
    if (!session) {
      // Recreate session dynamically if server restarted or session expired from memory
      session = createInterviewSession(candidate || {});
    }

    const evaluation = computeEvaluation(
      session,
      answers || {},
      violations || [],
      Number(durationSeconds) || 900
    );

    session.status = evaluation.isPassed ? 'completed' : 'failed';
    session.evaluation = evaluation;
    session.answers = answers || {};
    session.violations = violations || [];
    saveInterviewSession(session);

    return NextResponse.json({
      success: true,
      evaluation,
      session: {
        sessionId: session.sessionId,
        status: session.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit assessment.' },
      { status: 400 }
    );
  }
}
