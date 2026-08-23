import { NextRequest, NextResponse } from 'next/server';
import { createInterviewSession } from '@/lib/sessionStore';
import { CandidateProfile } from '@/types/interview';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidateData: Partial<CandidateProfile> = {
      name: body.name || body.candidate_name || 'Freelancer Candidate',
      email: body.email || 'freelancer@example.com',
      niche: body.niche || body.category || 'frontend',
      nicheTitle: body.nicheTitle || body.niche_title || '',
      skills: Array.isArray(body.skills) 
        ? body.skills 
        : typeof body.skills === 'string' 
          ? body.skills.split(',').map((s: string) => s.trim()) 
          : ['JavaScript', 'React'],
      experienceLevel: body.experienceLevel || body.experience_level || 'mid',
      experienceYears: Number(body.experienceYears || body.experience_years) || 3,
      hourlyRate: Number(body.hourlyRate || body.hourly_rate) || 45,
      portfolioUrl: body.portfolioUrl || body.portfolio_url || '',
      jobId: body.jobId || body.job_id || 'JOB-FREELANCER-1',
      jobTitle: body.jobTitle || body.job_title || 'Freelance Specialist',
      sourcePlatform: body.sourcePlatform || body.platform || 'Freelancer Platform',
      callbackWebhookUrl: body.callbackWebhookUrl || body.webhook_url || '/api/sessions/webhook',
      metadata: body.metadata || {},
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
