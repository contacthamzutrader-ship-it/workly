import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, requireFirebaseUser } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseUser(request);
    const raw = await request.text();
    if (raw.length > 5000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
    if (!taskId) return NextResponse.json({ error: "Task is required." }, { status: 400 });

    const { db } = getFirebaseAdmin();
    const taskSnap = await db.collection("tasks").doc(taskId).get();
    if (!taskSnap.exists) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    const task = taskSnap.data() || {};
    const isClient = task.posterId === decoded.uid;
    const isFreelancer = task.assignedTo === decoded.uid;
    if (!isClient && !isFreelancer) return NextResponse.json({ error: "Only contract participants can refresh reputation." }, { status: 403 });

    const targetUid = isClient ? String(task.assignedTo || "") : String(task.posterId || "");
    if (!targetUid) return NextResponse.json({ error: "Review recipient could not be identified." }, { status: 409 });
    const reviewSnap = await db.collection("reviews").doc(`${taskId}_${decoded.uid}`).get();
    if (!reviewSnap.exists || reviewSnap.data()?.toId !== targetUid) {
      return NextResponse.json({ error: "A completed review is required before recalculating reputation." }, { status: 409 });
    }

    const reviews = await db.collection("reviews").where("toId", "==", targetUid).limit(500).get();
    const ratings = reviews.docs
      .map((item) => Number(item.data().rating))
      .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);

    const userRef = db.collection("users").doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
    const penalty = Math.min(0, Number(userSnap.data()?.trustPenalty || 0));
    const score = ratings.length
      ? Math.max(0, Math.min(100, Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 20 + penalty)))
      : null;

    const userUpdate: Record<string, unknown> = { trustUpdatedAt: FieldValue.serverTimestamp() };
    userUpdate.trustScore = score === null ? FieldValue.delete() : score;
    await userRef.update(userUpdate);

    const publicRef = db.collection("public_profiles").doc(targetUid);
    await publicRef.set({ trustScore: score, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return NextResponse.json({ score, reviewCount: ratings.length });
  } catch (error) {
    if ((error as Error)?.message === "AUTH_REQUIRED") return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    console.error("trust recalculation error", error);
    return NextResponse.json({ error: "Reputation could not be recalculated." }, { status: 500 });
  }
}
