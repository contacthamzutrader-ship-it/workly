import { NextRequest, NextResponse } from 'next/server';
import { getInterviewSession, saveInterviewSession, computeEvaluation, dispatchWebhookToPlatform, createInterviewSession } from '@/lib/sessionStore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    let session = getInterviewSession(id);

    // Fallback: If session not in memory, dynamically recreate it from payload or default
    if (!session) {
      const candidateData = body.candidate || {
        niche: body.niche || 'frontend',
        name: body.candidate_name || 'Freelance Candidate',
        email: body.email || 'freelancer@platform.com',
        callbackWebhookUrl: body.callback_url || '/api/sessions/webhook',
      };
      session = createInterviewSession(candidateData);
      session.sessionId = id;
    }

    const answers = body.answers || {};
    const violations = body.violations || [];
    const durationSeconds = body.durationSeconds || 600;

    session.answers = answers;
    session.violations = violations;

    const evaluation = computeEvaluation(session, answers, violations, durationSeconds);
    session.evaluation = evaluation;
    session.status = evaluation.integrityVerdict === 'Disqualified' ? 'terminated_cheating' : 'completed';

    saveInterviewSession(session);

    // Trigger webhook notification asynchronously to external platform
    const webhookResult = await dispatchWebhookToPlatform(session, evaluation);

    return NextResponse.json({
      success: true,
      evaluation,
      webhookResult,
      message: 'Assessment evaluated and submitted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit assessment.' },
      { status: 500 }
    );
  }
}
