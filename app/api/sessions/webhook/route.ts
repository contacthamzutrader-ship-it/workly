import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = payload?.eventType || payload?.type || 'interview_completed';
    const logged = {
      receivedAt: new Date().toISOString(),
      eventType,
      payload: payload || {},
    };

    if (db) {
      await addDoc(collection(db, 'webhook_logs'), {
        ...logged,
        createdAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook logged successfully.',
      loggedAt: logged.receivedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ success: true, totalWebhooksReceived: 0, recentEvents: [] });
    }
    const snap = await getDocs(query(collection(db, 'webhook_logs'), orderBy('createdAt', 'desc'), limit(10)));
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({
      success: true,
      totalWebhooksReceived: events.length,
      recentEvents: events,
    });
  } catch {
    return NextResponse.json({ success: true, totalWebhooksReceived: 0, recentEvents: [] });
  }
}
