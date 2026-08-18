import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, requireFirebaseUser } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicProfile(uid: string, data: Record<string, any>) {
  const skills = Array.isArray(data.skills) ? data.skills.map(String).slice(0, 10) : [];
  const languages = Array.isArray(data.languages) ? data.languages.map(String).slice(0, 10) : [];
  const certifications = Array.isArray(data.certifications) ? data.certifications.map(String).slice(0, 20) : [];
  const ready = data.onboarded === true
    && String(data.name || "").trim().length >= 2
    && String(data.city || "").trim().length >= 2
    && String(data.bio || "").trim().length >= 20
    && (data.role !== "tasker" || (String(data.professionalTitle || "").trim().length >= 3 && skills.length > 0));

  return {
    uid,
    name: String(data.name || "").slice(0, 80),
    role: data.role === "tasker" ? "tasker" : "customer",
    avatarUrl: String(data.avatarUrl || "").slice(0, 2000),
    city: String(data.city || "").slice(0, 120),
    bio: String(data.bio || "").slice(0, 600),
    professionalTitle: String(data.professionalTitle || "").slice(0, 120),
    skills,
    hourlyRate: Math.max(0, Number(data.hourlyRate || 0)),
    experienceYears: Math.max(0, Number(data.experienceYears || 0)),
    languages,
    availability: String(data.availability || "").slice(0, 80),
    portfolioUrl: String(data.portfolioUrl || "").slice(0, 1000),
    certifications,
    organization: String(data.organization || "").slice(0, 160),
    hiringNeeds: String(data.hiringNeeds || "").slice(0, 600),
    verified: data.verified === true,
    trustScore: typeof data.trustScore === "number" ? Math.max(0, Math.min(100, data.trustScore)) : null,
    interviewStatus: String(data.interviewStatus || "not_started").slice(0, 40),
    interviewSummary: String(data.interviewSummary || "").slice(0, 1000),
    interviewTopSkills: Array.isArray(data.interviewTopSkills) ? data.interviewTopSkills.map(String).slice(0, 10) : [],
    profileComplete: ready,
    discoverable: data.role === "tasker" && ready && data.suspended !== true && data.isPrivate !== true,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseUser(request);
    const { db } = getFirebaseAdmin();
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) return NextResponse.json({ error: "Workly profile not found." }, { status: 404 });
    await db.collection("public_profiles").doc(decoded.uid).set(publicProfile(decoded.uid, userSnap.data() || {}), { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as Error)?.message === "AUTH_REQUIRED") return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    console.error("public profile sync error", error);
    return NextResponse.json({ error: "Public profile could not be updated." }, { status: 500 });
  }
}
