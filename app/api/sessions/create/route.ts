import { NextRequest, NextResponse } from 'next/server';
import { createInterviewSession } from '@/lib/sessionStore';
import { CandidateProfile } from '@/types/interview';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitStatus = checkRateLimit(`sess_create_${ip}`, 20, 60_000);
    if (!limitStatus.success) {
      return NextResponse.json(
        { success: false, error: 'Too many session creation requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const candidateData: Partial<CandidateProfile> = {
      name: String(body.name || body.candidate_name || 'Freelancer Candidate').slice(0, 100),
      email: String(body.email || 'freelancer@example.com').slice(0, 150),
      niche: String(body.niche || body.category || 'frontend').slice(0, 50) as any,
      nicheTitle: String(body.nicheTitle || body.niche_title || '').slice(0, 100),
      skills: Array.isArray(body.skills) 
        ? body.skills.slice(0, 20).map((s: string) => String(s).slice(0, 50)) 
        : typeof body.skills === 'string' 
          ? body.skills.split(',').slice(0, 20).map((s: string) => s.trim().slice(0, 50)) 
          : ['JavaScript', 'React'],
      experienceLevel: (body.experienceLevel || body.experience_level || 'mid') as any,
      experienceYears: Math.min(50, Math.max(0, Number(body.experienceYears || body.experience_years) || 3)),
      hourlyRate: Math.min(10000, Math.max(5, Number(body.hourlyRate || body.hourly_rate) || 45)),
      portfolioUrl: String(body.portfolioUrl || body.portfolio_url || '').slice(0, 250),
      jobId: String(body.jobId || body.job_id || 'JOB-FREELANCER-1').slice(0, 50),
      jobTitle: String(body.jobTitle || body.job_title || 'Freelance Specialist').slice(0, 100),
      sourcePlatform: String(body.sourcePlatform || body.platform || 'Freelancer Platform').slice(0, 100),
      callbackWebhookUrl: String(body.callbackWebhookUrl || body.webhook_url || '/api/sessions/webhook').slice(0, 250),
      metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {},
    };

    const session = createInterviewSession(candidateData);

    const baseUrl = req.nextUrl.origin;
    const interviewUrl = `${baseUrl}/interview?sessionId=${session.sessionId}`;

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      interviewUrl,
      candidate: session.candidate,
      totalMCQs: session.mcqQuestions.length,
      hasCodingChallenge: !!session.codingChallenge,
      hasPracticalTask: !!session.practicalTask,
      totalAIQuestions: session.aiInterviewQuestions.length,
      message: 'Interview session created successfully. Redirect freelancer to interviewUrl.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create interview session.' },
      { status: 400 }
    );
  }
}
