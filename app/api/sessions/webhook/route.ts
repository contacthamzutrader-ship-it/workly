import { NextRequest, NextResponse } from 'next/server';

const RECEIVED_WEBHOOKS: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const logged = {
      receivedAt: new Date().toISOString(),
      payload,
    };
    RECEIVED_WEBHOOKS.unshift(logged);
    if (RECEIVED_WEBHOOKS.length > 50) RECEIVED_WEBHOOKS.pop();

    console.log('--- [GLOBAL FREELANCER PLATFORM WEBHOOK RECEIVED] ---', payload);

    return NextResponse.json({
      success: true,
      message: 'Global Freelancer platform webhook received and logged successfully.',
      loggedAt: logged.receivedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    totalWebhooksReceived: RECEIVED_WEBHOOKS.length,
    recentWebhooks: RECEIVED_WEBHOOKS.slice(0, 10),
  });
}
