import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, requireFirebaseUser } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER_EMAIL = "contact.hamzutrader@gmail.com";
const ALL_PERMISSIONS = ["approveTasks", "manageUsers", "manageAdmins", "managePayments", "manageContent", "viewAnalytics"] as const;
type Permission = (typeof ALL_PERMISSIONS)[number];
type StaffRole = "editor" | "moderator" | "admin";

type Actor = {
  uid: string;
  email: string;
  owner: boolean;
  permissions: Permission[];
};

class ApiProblem extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function cleanString(value: unknown, max: number, field: string, min = 0) {
  if (typeof value !== "string") throw new ApiProblem(`${field} is required.`);
  const text = value.trim().replace(/\u0000/g, "");
  if (text.length < min) throw new ApiProblem(`${field} is too short.`);
  if (text.length > max) throw new ApiProblem(`${field} is too long.`);
  return text;
}

function permissionList(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).filter((item): item is Permission => ALL_PERMISSIONS.includes(item as Permission)))];
}

function rolePermissions(role: StaffRole): Permission[] {
  if (role === "editor") return ["manageContent", "viewAnalytics"];
  if (role === "moderator") return ["approveTasks", "manageContent", "viewAnalytics"];
  return ["approveTasks", "manageUsers", "managePayments", "manageContent", "viewAnalytics"];
}

async function loadActor(decoded: any): Promise<Actor> {
  const { db } = getFirebaseAdmin();
  const email = String(decoded.email || "").toLowerCase();
  const owner = email === OWNER_EMAIL;
  if (owner) return { uid: decoded.uid, email, owner: true, permissions: [...ALL_PERMISSIONS] };
  const snap = await db.collection("admins").doc(decoded.uid).get();
  if (!snap.exists || snap.data()?.suspended === true) throw new ApiProblem("Staff access is required.", 403);
  return { uid: decoded.uid, email, owner: false, permissions: permissionList(snap.data()?.permissions) };
}

function requirePermission(actor: Actor, permission: Permission) {
  if (!actor.owner && !actor.permissions.includes(permission)) throw new ApiProblem("You do not have permission for this action.", 403);
}

function audit(transaction: FirebaseFirestore.Transaction, actor: Actor, action: string, target: string, detail = "") {
  const { db } = getFirebaseAdmin();
  transaction.set(db.collection("audit_logs").doc(), {
    actorId: actor.uid,
    actorEmail: actor.email,
    action,
    target,
    detail: detail.slice(0, 1000),
    createdAt: FieldValue.serverTimestamp(),
  });
}

function publicProjection(uid: string, data: Record<string, any>) {
  const skills = Array.isArray(data.skills) ? data.skills.map(String).slice(0, 10) : [];
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
    languages: Array.isArray(data.languages) ? data.languages.map(String).slice(0, 10) : [],
    availability: String(data.availability || "").slice(0, 80),
    portfolioUrl: String(data.portfolioUrl || "").slice(0, 1000),
    certifications: Array.isArray(data.certifications) ? data.certifications.map(String).slice(0, 20) : [],
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

async function syncProjection(uid: string) {
  const { db } = getFirebaseAdmin();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    await db.collection("public_profiles").doc(uid).delete().catch(() => undefined);
    return;
  }
  await db.collection("public_profiles").doc(uid).set(publicProjection(uid, snap.data() || {}), { merge: true });
}

async function parseBody(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 20_000) throw new ApiProblem("Request is too large.", 413);
  const raw = await request.text();
  if (raw.length > 20_000) throw new ApiProblem("Request is too large.", 413);
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ApiProblem("Invalid request body.");
  }
}

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseUser(request);
    const actor = await loadActor(decoded);
    const body = await parseBody(request);
    const action = String(body.action || "");
    const { db } = getFirebaseAdmin();

    if (action === "add_admin") {
      requirePermission(actor, "manageAdmins");
      const uid = cleanString(body.uid, 200, "User", 1);
      const role = String(body.staffRole || "") as StaffRole;
      if (!(["editor", "moderator", "admin"] as string[]).includes(role)) throw new ApiProblem("Choose a valid staff role.");
      const userSnap = await db.collection("users").doc(uid).get();
      if (!userSnap.exists) throw new ApiProblem("The staff member must create a normal Workly account first.", 404);
      const user = userSnap.data() || {};
      const email = String(user.email || "").toLowerCase();
      if (!email || email === OWNER_EMAIL) throw new ApiProblem("The owner account cannot be added as staff.", 409);
      const requested = permissionList(body.permissions);
      const permissions = requested.length ? requested : rolePermissions(role);
      await db.runTransaction(async (transaction) => {
        const ref = db.collection("admins").doc(uid);
        const existing = await transaction.get(ref);
        if (existing.exists) throw new ApiProblem("This account already has staff access.", 409);
        transaction.set(ref, {
          uid,
          email,
          name: String(user.name || "Staff member").slice(0, 80),
          staffRole: role,
          addedBy: actor.uid,
          permissions,
          suspended: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        audit(transaction, actor, "staff.add", uid, `${role}: ${permissions.join(",")}`);
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "update_admin") {
      requirePermission(actor, "manageAdmins");
      const uid = cleanString(body.uid, 200, "Staff account", 1);
      const ref = db.collection("admins").doc(uid);
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new ApiProblem("Staff account not found.", 404);
        if (String(snap.data()?.email || "").toLowerCase() === OWNER_EMAIL) throw new ApiProblem("The owner record cannot be changed here.", 403);
        const changes = body.changes && typeof body.changes === "object" && !Array.isArray(body.changes) ? body.changes as Record<string, unknown> : {};
        const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (changes.staffRole !== undefined) {
          const role = String(changes.staffRole) as StaffRole;
          if (!(["editor", "moderator", "admin"] as string[]).includes(role)) throw new ApiProblem("Choose a valid staff role.");
          update.staffRole = role;
          if (changes.permissions === undefined) update.permissions = rolePermissions(role);
        }
        if (changes.permissions !== undefined) update.permissions = permissionList(changes.permissions);
        if (changes.suspended !== undefined) update.suspended = changes.suspended === true;
        transaction.update(ref, update);
        audit(transaction, actor, "staff.update", uid, JSON.stringify({ staffRole: update.staffRole, permissions: update.permissions, suspended: update.suspended }));
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "remove_admin") {
      requirePermission(actor, "manageAdmins");
      const uid = cleanString(body.uid, 200, "Staff account", 1);
      if (uid === actor.uid && !actor.owner) throw new ApiProblem("You cannot remove your own staff access.", 409);
      const ref = db.collection("admins").doc(uid);
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new ApiProblem("Staff account not found.", 404);
        if (String(snap.data()?.email || "").toLowerCase() === OWNER_EMAIL) throw new ApiProblem("The owner cannot be removed.", 403);
        transaction.delete(ref);
        audit(transaction, actor, "staff.remove", uid);
      });
      return NextResponse.json({ ok: true });
    }

    if (["set_user_private", "set_user_role", "set_user_suspended", "set_user_verified"].includes(action)) {
      requirePermission(actor, "manageUsers");
      const uid = cleanString(body.uid, 200, "Member", 1);
      const ref = db.collection("users").doc(uid);
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new ApiProblem("Member account not found.", 404);
        const data = snap.data() || {};
        if (String(data.email || "").toLowerCase() === OWNER_EMAIL) throw new ApiProblem("The owner account cannot be managed as a normal member.", 403);
        const update: Record<string, unknown> = { profileUpdatedAt: FieldValue.serverTimestamp() };
        if (action === "set_user_private") {
          const value = body.isPrivate === true;
          update.isPrivate = value;
          if (value) { update.role = "tasker"; update.isTasker = true; }
        }
        if (action === "set_user_role") {
          const role = String(body.role || "");
          if (!['client', 'freelancer'].includes(role)) throw new ApiProblem("Choose a valid member role.");
          update.role = role === "freelancer" ? "tasker" : "customer";
          update.isTasker = role === "freelancer";
          update.roleUpdatedAt = FieldValue.serverTimestamp();
        }
        if (action === "set_user_suspended") {
          const suspended = body.suspended === true;
          update.suspended = suspended;
          update.suspendedReason = suspended ? cleanString(body.reason || "Suspended by Workly operations", 1000, "Reason", 3) : "";
          update.suspendedAt = suspended ? FieldValue.serverTimestamp() : null;
        }
        if (action === "set_user_verified") update.verified = body.verified === true;
        transaction.update(ref, update);
        audit(transaction, actor, action.replace("set_user_", "user."), uid, JSON.stringify(update));
      });
      await syncProjection(uid);
      return NextResponse.json({ ok: true });
    }

    if (action === "save_settings") {
      requirePermission(actor, "manageContent");
      const changes = body.changes && typeof body.changes === "object" && !Array.isArray(body.changes) ? body.changes as Record<string, unknown> : {};
      const allowed = new Set(["autoApprove", "clientFeePercent", "freelancerFeePercent", "minTaskBudget", "maintenanceMode", "allowNewSignups", "requireInterviewToBid"]);
      const update: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(changes)) {
        if (!allowed.has(key)) continue;
        if (["clientFeePercent", "freelancerFeePercent", "minTaskBudget"].includes(key)) requirePermission(actor, "managePayments");
        if (["autoApprove", "maintenanceMode", "allowNewSignups", "requireInterviewToBid"].includes(key)) {
          if (typeof value !== "boolean") throw new ApiProblem(`${key} must be true or false.`);
          update[key] = value;
        } else {
          const number = Number(value);
          if (!Number.isFinite(number)) throw new ApiProblem(`${key} must be a number.`);
          if ((key === "clientFeePercent" || key === "freelancerFeePercent") && (number < 0 || number > 30)) throw new ApiProblem("Service fee must be between 0% and 30%.");
          if (key === "minTaskBudget" && (number < 100 || number > 10_000_000)) throw new ApiProblem("Minimum task budget is outside the allowed range.");
          update[key] = number;
        }
      }
      if (!Object.keys(update).length) throw new ApiProblem("No valid setting changes were supplied.");
      await db.runTransaction(async (transaction) => {
        transaction.set(db.collection("settings").doc("platform"), update, { merge: true });
        audit(transaction, actor, "settings.update", "platform", JSON.stringify(update));
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "resolve_dispute") {
      requirePermission(actor, "managePayments");
      const disputeId = cleanString(body.disputeId, 200, "Dispute", 1);
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "Reviewed by Workly operations.";
      const disputeRef = db.collection("disputes").doc(disputeId);
      await db.runTransaction(async (transaction) => {
        const disputeSnap = await transaction.get(disputeRef);
        if (!disputeSnap.exists) throw new ApiProblem("Dispute not found.", 404);
        const dispute = disputeSnap.data() || {};
        if (dispute.status === "resolved") return;
        const taskRef = db.collection("tasks").doc(String(dispute.taskId || disputeId));
        const taskSnap = await transaction.get(taskRef);
        if (!taskSnap.exists) throw new ApiProblem("Contract task not found.", 404);
        const restore = ["submitted", "changes_requested", "completed"].includes(String(dispute.previousTaskStatus)) ? String(dispute.previousTaskStatus) : "submitted";
        transaction.update(disputeRef, { status: "resolved", resolvedBy: actor.email || actor.uid, resolutionNote: note, resolvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        transaction.update(taskRef, { status: restore, updatedAt: FieldValue.serverTimestamp() });
        audit(transaction, actor, "dispute.resolve", disputeId, `${restore}: ${note}`);
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "review_interview") {
      requirePermission(actor, "manageUsers");
      const uid = cleanString(body.uid, 200, "Freelancer", 1);
      const decision = String(body.decision || "");
      if (!['verified', 'needs_improvement'].includes(decision)) throw new ApiProblem("Choose a valid interview decision.");
      const interviewRef = db.collection("interviews").doc(uid);
      const userRef = db.collection("users").doc(uid);
      await db.runTransaction(async (transaction) => {
        const [interviewSnap, userSnap] = await Promise.all([transaction.get(interviewRef), transaction.get(userRef)]);
        if (!interviewSnap.exists || !userSnap.exists) throw new ApiProblem("Interview or user record not found.", 404);
        if (interviewSnap.data()?.status !== "awaiting_review") throw new ApiProblem("This interview is no longer awaiting review.", 409);
        const note = decision === "verified" ? "Evidence reviewed and badge approved." : "More concrete role evidence is needed before approval.";
        transaction.update(interviewRef, { status: decision, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: actor.email || actor.uid, reviewNote: note, updatedAt: FieldValue.serverTimestamp() });
        transaction.update(userRef, { interviewStatus: decision, interviewUpdatedAt: FieldValue.serverTimestamp(), ...(decision === "verified" ? { interviewVerifiedAt: FieldValue.serverTimestamp() } : {}) });
        audit(transaction, actor, "interview.review", uid, decision);
      });
      await syncProjection(uid);
      return NextResponse.json({ ok: true });
    }

    if (action === "sync_public_profiles") {
      requirePermission(actor, "manageUsers");
      const snapshot = await db.collection("users").limit(500).get();
      let synced = 0;
      for (const user of snapshot.docs) {
        await db.collection("public_profiles").doc(user.id).set(publicProjection(user.id, user.data()), { merge: true });
        synced += 1;
      }
      await db.collection("audit_logs").add({ actorId: actor.uid, actorEmail: actor.email, action: "public_profiles.sync", target: "all", detail: `${synced} profiles`, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ synced });
    }

    throw new ApiProblem("Unknown admin action.");
  } catch (error) {
    if ((error as Error)?.message === "AUTH_REQUIRED") return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    if (error instanceof ApiProblem) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("admin api error", error);
    return NextResponse.json({ error: "The admin service could not complete that action." }, { status: 500 });
  }
}
