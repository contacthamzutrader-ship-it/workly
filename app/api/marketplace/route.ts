import { randomBytes, timingSafeEqual } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, requireFirebaseUser } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER_EMAIL = "contact.hamzutrader@gmail.com";
const MIN_BUDGET = 500;
const MIN_OFFER = 500;
const PLATFORM_FEE = 0.15;
const CATEGORIES = new Set([
  "Cleaning", "Handyman", "Delivery", "Gardening", "IT & Web", "Design", "Moving", "Pet Care",
  "Tutoring", "Business & Admin", "Photography", "Cooking", "Furniture Assembly", "Painting",
  "Marketing & Design", "Writing & Translation", "Video & Audio", "Other",
]);
const PERMISSIONS = ["approveTasks", "manageUsers", "manageAdmins", "managePayments", "manageContent", "viewAnalytics"] as const;
type Permission = (typeof PERMISSIONS)[number];

type Actor = {
  uid: string;
  email: string;
  name: string;
  user: Record<string, any>;
  owner: boolean;
  permissions: Permission[];
  staff: boolean;
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

function optionalString(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return "";
  return cleanString(value, max, "Value");
}

function finiteNumber(value: unknown, field: string, min = 0, max = 100_000_000) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new ApiProblem(`${field} is invalid.`);
  return number;
}

function integer(value: unknown, field: string, min: number, max: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new ApiProblem(`${field} is invalid.`);
  return number;
}

function isOwnerEmail(email: unknown) {
  return String(email || "").trim().toLowerCase() === OWNER_EMAIL;
}

function memberReady(user: Record<string, any>) {
  return user.onboarded === true
    && String(user.name || "").trim().length >= 2
    && String(user.city || "").trim().length >= 2
    && String(user.bio || "").trim().length >= 20
    && (user.role !== "tasker"
      || (String(user.professionalTitle || "").trim().length >= 3 && Array.isArray(user.skills) && user.skills.length > 0));
}

function requireMember(actor: Actor, role?: "customer" | "tasker") {
  if (actor.user?.suspended === true) throw new ApiProblem("This account is suspended.", 403);
  if (role && actor.user?.role !== role) throw new ApiProblem("Your current Workly mode cannot perform this action.", 403);
  if (!memberReady(actor.user)) throw new ApiProblem("Complete your Workly profile before using marketplace actions.", 409);
}

function requirePermission(actor: Actor, permission: Permission) {
  if (!actor.owner && !actor.permissions.includes(permission)) throw new ApiProblem("You do not have permission for this action.", 403);
}

async function loadActor(decoded: any): Promise<Actor> {
  const { db } = getFirebaseAdmin();
  const email = String(decoded.email || "").toLowerCase();
  const owner = isOwnerEmail(email);
  const [userSnap, adminSnap] = await Promise.all([
    db.collection("users").doc(decoded.uid).get(),
    db.collection("admins").doc(decoded.uid).get(),
  ]);
  if (!userSnap.exists && !owner) throw new ApiProblem("Your Workly profile could not be found.", 403);
  const user = userSnap.data() || {};
  const admin = adminSnap.exists ? adminSnap.data() || {} : {};
  const permissions = owner
    ? [...PERMISSIONS]
    : adminSnap.exists && admin.suspended !== true
      ? (Array.isArray(admin.permissions) ? admin.permissions.filter((item: unknown): item is Permission => PERMISSIONS.includes(item as Permission)) : [])
      : [];
  return {
    uid: decoded.uid,
    email,
    name: String(user.name || decoded.name || email || "Workly member"),
    user,
    owner,
    permissions,
    staff: owner || (adminSnap.exists && admin.suspended !== true),
  };
}

async function safeNotify(userId: string | undefined, type: string, title: string, body: string, link?: string) {
  if (!userId) return;
  try {
    const { db } = getFirebaseAdmin();
    await db.collection("notifications").add({
      userId,
      type,
      title: title.slice(0, 120),
      body: body.slice(0, 500),
      link: link || "",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    // Notification delivery must never roll back a committed marketplace action.
  }
}

function auditInTransaction(transaction: FirebaseFirestore.Transaction, actor: Actor, action: string, target: string, detail = "") {
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

function taskModeration(title: string, description: string) {
  const text = `${title} ${description}`;
  const risky = [
    /\b(whatsapp|telegram|direct transfer|crypto payment|password|otp|bank login)\b/i,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    /(?:\+?\d[\d\s().-]{7,}\d)/,
    /(.)\1{7,}/,
  ];
  return risky.some((pattern) => pattern.test(text)) ? "review" : "approved";
}

function scanMessage(text: string) {
  const patterns: [string, RegExp][] = [
    ["PayPal", /paypal/i], ["direct transfer", /direct\s*(transfer|payment)/i], ["bank transfer", /bank\s*transfer/i],
    ["Western Union", /western\s*union/i], ["WhatsApp", /\bwhatsapp\b/i],
    ["email address", /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i],
    ["phone number", /(?:\+?\d[\d\s().-]{7,}\d)/],
  ];
  const reasons = patterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return { flagged: reasons.length > 0, reasons };
}

async function parseBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 25_000) throw new ApiProblem("Request is too large.", 413);
  const raw = await request.text();
  if (raw.length > 25_000) throw new ApiProblem("Request is too large.", 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new ApiProblem("Invalid request body."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiProblem("Invalid request body.");
  return body as Record<string, unknown>;
}

function secureTokenEquals(provided: string, expected: string) {
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const decoded = await requireFirebaseUser(request);
    const actor = await loadActor(decoded);
    const body = await parseBody(request);
    const action = String(body.action || "");
    const { db } = getFirebaseAdmin();

    switch (action) {
      case "create_task": {
        requireMember(actor, "customer");
        const title = cleanString(body.title, 90, "Task title", 8);
        const description = cleanString(body.description, 6000, "Description", 30);
        const category = cleanString(body.category, 80, "Category", 2);
        if (!CATEGORIES.has(category)) throw new ApiProblem("Choose a valid category.");
        const budget = finiteNumber(body.budget, "Budget", MIN_BUDGET);
        const remote = body.remote === true;
        const location = remote ? "Remote" : cleanString(body.location, 120, "Location", 2);
        const urgency = ["flexible", "this_week", "urgent"].includes(String(body.urgency)) ? String(body.urgency) : "flexible";
        const deadline = optionalString(body.deadline, 40);
        const skills = Array.isArray(body.skills)
          ? body.skills.map((item) => String(item).trim()).filter(Boolean).slice(0, 10).map((item) => item.slice(0, 80))
          : [];
        const moderation = taskModeration(title, description);
        const settingsSnap = await db.collection("settings").doc("platform").get();
        const autoApprove = settingsSnap.exists && settingsSnap.data()?.autoApprove === true;
        const status = autoApprove && moderation === "approved" ? "open" : "pending";
        const taskRef = db.collection("tasks").doc();
        await taskRef.set({
          title, description, category, skills, budget, location, remote, urgency,
          ...(deadline ? { deadline } : {}),
          posterId: actor.uid,
          posterName: actor.name,
          status,
          visibility: "public",
          approvalMode: status === "open" ? "auto" : "manual",
          moderation,
          bidsCount: 0,
          revisionCount: 0,
          paymentRequested: false,
          paymentReleased: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ taskId: taskRef.id, status });
      }

      case "update_task": {
        requireMember(actor, "customer");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const ref = db.collection("tasks").doc(taskId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (task.posterId !== actor.uid) throw new ApiProblem("Only the task owner can edit this task.", 403);
          if (!["draft", "pending", "open"].includes(task.status)) throw new ApiProblem("This contract can no longer be edited.", 409);
          const changes = (body.changes && typeof body.changes === "object" && !Array.isArray(body.changes)) ? body.changes as Record<string, unknown> : {};
          const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
          if (changes.title !== undefined) update.title = cleanString(changes.title, 90, "Task title", 8);
          if (changes.description !== undefined) update.description = cleanString(changes.description, 6000, "Description", 30);
          if (changes.category !== undefined) {
            const category = cleanString(changes.category, 80, "Category", 2);
            if (!CATEGORIES.has(category)) throw new ApiProblem("Choose a valid category.");
            update.category = category;
          }
          if (changes.budget !== undefined) {
            if ((task.bidsCount || 0) > 0) throw new ApiProblem("Budget cannot change after offers have arrived.", 409);
            update.budget = finiteNumber(changes.budget, "Budget", MIN_BUDGET);
          }
          if (changes.remote !== undefined) update.remote = changes.remote === true;
          if (changes.location !== undefined) update.location = cleanString(changes.location, 120, "Location", 2);
          if (changes.deadline !== undefined) update.deadline = optionalString(changes.deadline, 40);
          if (changes.urgency !== undefined && ["flexible", "this_week", "urgent"].includes(String(changes.urgency))) update.urgency = String(changes.urgency);
          if (changes.skills !== undefined && Array.isArray(changes.skills)) update.skills = changes.skills.map((item) => String(item).trim()).filter(Boolean).slice(0, 10).map((item) => item.slice(0, 80));
          transaction.update(ref, update);
        });
        return NextResponse.json({ ok: true });
      }

      case "place_bid": {
        requireMember(actor, "tasker");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const amount = finiteNumber(body.amount, "Offer amount", MIN_OFFER);
        const message = cleanString(body.message, 3000, "Offer message", 10);
        const deliveryDays = body.deliveryDays === undefined ? 0 : integer(body.deliveryDays, "Delivery days", 0, 365);
        const taskRef = db.collection("tasks").doc(taskId);
        const bidRef = db.collection("bids").doc(`${taskId}_${actor.uid}`);
        await db.runTransaction(async (transaction) => {
          const [taskSnap, existingBid] = await Promise.all([transaction.get(taskRef), transaction.get(bidRef)]);
          if (!taskSnap.exists) throw new ApiProblem("This task is no longer available.", 404);
          const task = taskSnap.data() || {};
          if (task.status !== "open") throw new ApiProblem("This task is not accepting offers right now.", 409);
          if (task.posterId === actor.uid) throw new ApiProblem("You cannot send an offer on your own task.", 409);
          if (task.visibility === "private") {
            const inviteSnap = await transaction.get(db.collection("task_invites").doc(taskId));
            if (!inviteSnap.exists || inviteSnap.data()?.userId !== actor.uid) throw new ApiProblem("This private task is not assigned to your invitation.", 403);
          }
          if (existingBid.exists && existingBid.data()?.status !== "withdrawn") throw new ApiProblem("You already have an offer on this task. Edit it instead.", 409);
          transaction.set(bidRef, {
            taskId, taskTitle: task.title || "Task", bidderId: actor.uid, bidderName: actor.name,
            amount, message, deliveryDays, status: "pending", isManaged: false,
            createdAt: existingBid.exists ? existingBid.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          transaction.update(taskRef, { bidsCount: FieldValue.increment(existingBid.exists ? 0 : 1), updatedAt: FieldValue.serverTimestamp() });
        });
        const taskSnap = await taskRef.get();
        const task = taskSnap.data() || {};
        await safeNotify(task.posterId, "bid", "New offer on your task", `${actor.name} offered PKR ${Math.round(amount).toLocaleString()} for \"${task.title || "your task"}\".`, `/tasks/${taskId}`);
        return NextResponse.json({ bidId: bidRef.id });
      }

      case "update_bid": {
        requireMember(actor, "tasker");
        const bidId = cleanString(body.bidId, 300, "Offer", 1);
        const amount = finiteNumber(body.amount, "Offer amount", MIN_OFFER);
        const message = cleanString(body.message, 3000, "Offer message", 10);
        const deliveryDays = body.deliveryDays === undefined ? 0 : integer(body.deliveryDays, "Delivery days", 0, 365);
        const bidRef = db.collection("bids").doc(bidId);
        await db.runTransaction(async (transaction) => {
          const bidSnap = await transaction.get(bidRef);
          if (!bidSnap.exists) throw new ApiProblem("Offer not found.", 404);
          const bid = bidSnap.data() || {};
          if (bid.bidderId !== actor.uid) throw new ApiProblem("You can only edit your own offer.", 403);
          if (bid.status !== "pending") throw new ApiProblem("This offer can no longer be edited.", 409);
          const taskSnap = await transaction.get(db.collection("tasks").doc(String(bid.taskId)));
          if (!taskSnap.exists || taskSnap.data()?.status !== "open") throw new ApiProblem("This task is no longer open.", 409);
          transaction.update(bidRef, { amount, message, deliveryDays, updatedAt: FieldValue.serverTimestamp() });
        });
        return NextResponse.json({ ok: true });
      }

      case "withdraw_bid": {
        requireMember(actor, "tasker");
        const bidId = cleanString(body.bidId, 300, "Offer", 1);
        const bidRef = db.collection("bids").doc(bidId);
        await db.runTransaction(async (transaction) => {
          const bidSnap = await transaction.get(bidRef);
          if (!bidSnap.exists) throw new ApiProblem("Offer not found.", 404);
          const bid = bidSnap.data() || {};
          if (bid.bidderId !== actor.uid) throw new ApiProblem("You can only withdraw your own offer.", 403);
          if (bid.status !== "pending") throw new ApiProblem("This offer can no longer be withdrawn.", 409);
          const taskRef = db.collection("tasks").doc(String(bid.taskId));
          const taskSnap = await transaction.get(taskRef);
          transaction.update(bidRef, { status: "withdrawn", updatedAt: FieldValue.serverTimestamp() });
          if (taskSnap.exists) transaction.update(taskRef, { bidsCount: Math.max(0, Number(taskSnap.data()?.bidsCount || 0) - 1), updatedAt: FieldValue.serverTimestamp() });
        });
        return NextResponse.json({ ok: true });
      }

      case "select_bid": {
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const bidId = cleanString(body.bidId, 300, "Offer", 1);
        const taskRef = db.collection("tasks").doc(taskId);
        let selected: Record<string, any> = {};
        await db.runTransaction(async (transaction) => {
          const [taskSnap, bidSnap] = await Promise.all([transaction.get(taskRef), transaction.get(db.collection("bids").doc(bidId))]);
          if (!taskSnap.exists || !bidSnap.exists) throw new ApiProblem("Task or offer not found.", 404);
          const task = taskSnap.data() || {};
          const bid = bidSnap.data() || {};
          const staffOverride = actor.owner || actor.permissions.includes("managePayments");
          if (task.posterId !== actor.uid && !staffOverride) throw new ApiProblem("Only the client can hire for this task.", 403);
          if (task.status !== "open") throw new ApiProblem("This task is no longer open for hiring.", 409);
          if (bid.taskId !== taskId || bid.status !== "pending") throw new ApiProblem("This offer is no longer available.", 409);
          const amount = finiteNumber(bid.amount, "Offer amount", MIN_OFFER);
          const posterRef = db.collection("users").doc(String(task.posterId));
          const posterSnap = await transaction.get(posterRef);
          if (!posterSnap.exists) throw new ApiProblem("Client account not found.", 409);
          const wallet = Number(posterSnap.data()?.wallet || 0);
          if (wallet < amount) throw new ApiProblem(`This account needs PKR ${Math.ceil(amount - wallet).toLocaleString()} more in its internal Workly balance before hiring.`, 409);
          const pendingOffers = await transaction.get(db.collection("bids").where("taskId", "==", taskId).where("status", "==", "pending"));
          transaction.update(posterRef, { wallet: wallet - amount });
          transaction.update(taskRef, {
            status: "assigned", assignedTo: bid.bidderId, assignedName: bid.bidderName,
            assignedAt: FieldValue.serverTimestamp(), heldAmount: amount, heldAt: FieldValue.serverTimestamp(),
            paymentRequested: false, paymentReleased: false, updatedAt: FieldValue.serverTimestamp(),
          });
          pendingOffers.docs.forEach((offer) => transaction.update(offer.ref, { status: offer.id === bidId ? "selected" : "rejected", updatedAt: FieldValue.serverTimestamp() }));
          transaction.set(db.collection("wallet_txs").doc(`hold_${taskId}`), {
            userId: task.posterId, amount, type: "hold", note: `Internal hold for \"${task.title}\"`, taskId,
            createdAt: FieldValue.serverTimestamp(), source: "server",
          });
          auditInTransaction(transaction, actor, "contract.hire", taskId, `Selected ${bidId} for ${amount}`);
          selected = { task, bid, amount, rejected: pendingOffers.docs.filter((offer) => offer.id !== bidId).map((offer) => offer.data()) };
        });
        await safeNotify(selected.bid?.bidderId, "selected", "You have been hired", `Your offer was accepted for \"${selected.task?.title || "a task"}\".`, `/tasks/${taskId}`);
        await Promise.all((selected.rejected || []).map((bid: any) => safeNotify(bid.bidderId, "bid_rejected", "Another freelancer was hired", `A different offer was selected for \"${selected.task?.title || "a task"}\".`, "/tasks")));
        return NextResponse.json({ ok: true });
      }

      case "start_work": {
        requireMember(actor, "tasker");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const ref = db.collection("tasks").doc(taskId);
        let posterId = ""; let title = "";
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (task.assignedTo !== actor.uid) throw new ApiProblem("Only the hired freelancer can start this work.", 403);
          if (task.status !== "assigned") throw new ApiProblem("This task cannot be started from its current state.", 409);
          transaction.update(ref, { status: "in_progress", startedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
          posterId = task.posterId; title = task.title;
        });
        await safeNotify(posterId, "work_started", "Work has started", `${actor.name} started \"${title}\".`, `/tasks/${taskId}`);
        return NextResponse.json({ ok: true });
      }

      case "submit_work": {
        requireMember(actor, "tasker");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const summary = cleanString(body.summary, 5000, "Delivery note", 20);
        const ref = db.collection("tasks").doc(taskId);
        let posterId = ""; let title = "";
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (task.assignedTo !== actor.uid) throw new ApiProblem("Only the hired freelancer can submit work.", 403);
          if (!["in_progress", "changes_requested"].includes(task.status)) throw new ApiProblem("This task is not ready for delivery.", 409);
          transaction.update(ref, { status: "submitted", workSubmission: summary, workSubmittedAt: FieldValue.serverTimestamp(), paymentRequested: true, updatedAt: FieldValue.serverTimestamp() });
          posterId = task.posterId; title = task.title;
        });
        await safeNotify(posterId, "work_submitted", "Delivery ready for review", `${actor.name} submitted work for \"${title}\".`, `/tasks/${taskId}`);
        return NextResponse.json({ ok: true });
      }

      case "request_changes": {
        requireMember(actor, "customer");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const note = cleanString(body.note, 3000, "Revision note", 10);
        const ref = db.collection("tasks").doc(taskId);
        let worker = "";
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (task.posterId !== actor.uid) throw new ApiProblem("Only the client can request changes.", 403);
          if (task.status !== "submitted") throw new ApiProblem("Changes can only be requested after a delivery.", 409);
          transaction.update(ref, { status: "changes_requested", revisionNote: note, revisionCount: FieldValue.increment(1), paymentRequested: false, updatedAt: FieldValue.serverTimestamp() });
          worker = task.assignedTo;
        });
        await safeNotify(worker, "changes_requested", "Changes requested", note.slice(0, 120), `/tasks/${taskId}`);
        return NextResponse.json({ ok: true });
      }

      case "approve_delivery": {
        requireMember(actor, "customer");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const ref = db.collection("tasks").doc(taskId);
        let worker = ""; let title = ""; let net = 0;
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (task.posterId !== actor.uid) throw new ApiProblem("Only the client can approve this delivery.", 403);
          if (task.paymentReleased === true) return;
          if (task.status !== "submitted") throw new ApiProblem("Only a submitted delivery can be approved.", 409);
          const amount = finiteNumber(task.heldAmount, "Held amount", 1);
          worker = String(task.assignedTo || "");
          if (!worker) throw new ApiProblem("The assigned freelancer is missing.", 409);
          net = amount - Math.round(amount * PLATFORM_FEE);
          const workerRef = db.collection("users").doc(worker);
          const workerSnap = await transaction.get(workerRef);
          if (!workerSnap.exists) throw new ApiProblem("Freelancer account not found.", 409);
          transaction.update(workerRef, { wallet: Number(workerSnap.data()?.wallet || 0) + net });
          transaction.update(ref, { status: "completed", paymentReleased: true, paidAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
          transaction.set(db.collection("wallet_txs").doc(`release_${taskId}`), { userId: worker, amount: net, type: "release", note: `Internal release for \"${task.title}\"`, taskId, createdAt: FieldValue.serverTimestamp(), source: "server" });
          transaction.set(db.collection("wallet_txs").doc(`payment_${taskId}`), { userId: task.posterId, amount, type: "payment", note: `Internal payment record for \"${task.title}\"`, taskId, createdAt: FieldValue.serverTimestamp(), source: "server" });
          auditInTransaction(transaction, actor, "contract.approve_delivery", taskId, `Released internal amount ${amount}; freelancer net ${net}`);
          title = task.title;
        });
        await safeNotify(worker, "payment_released", "Delivery approved", `Your delivery for \"${title}\" was approved. Internal ledger credit: PKR ${Math.round(net).toLocaleString()}.`, "/wallet");
        return NextResponse.json({ ok: true });
      }

      case "cancel_task": {
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const reason = cleanString(body.reason, 1500, "Cancellation reason", 10);
        const ref = db.collection("tasks").doc(taskId);
        let otherParty = ""; let title = "";
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          const participant = task.posterId === actor.uid || task.assignedTo === actor.uid;
          if (!participant && !actor.permissions.includes("managePayments") && !actor.owner) throw new ApiProblem("You are not part of this contract.", 403);
          if (task.paymentReleased === true || ["completed", "cancelled", "disputed"].includes(task.status)) throw new ApiProblem("This task cannot be cancelled from its current state.", 409);
          if (task.status === "submitted") throw new ApiProblem("A submitted delivery must be approved, revised, or disputed instead.", 409);
          if (task.status === "open" && task.posterId !== actor.uid && !actor.owner) throw new ApiProblem("Only the client can cancel an open task.", 403);
          const held = Number(task.heldAmount || 0);
          if (held > 0) {
            const posterRef = db.collection("users").doc(String(task.posterId));
            const posterSnap = await transaction.get(posterRef);
            if (!posterSnap.exists) throw new ApiProblem("Client account not found.", 409);
            transaction.update(posterRef, { wallet: Number(posterSnap.data()?.wallet || 0) + held });
            transaction.set(db.collection("wallet_txs").doc(`refund_${taskId}`), { userId: task.posterId, amount: held, type: "refund", note: `Internal refund after cancelling \"${task.title}\"`, taskId, createdAt: FieldValue.serverTimestamp(), source: "server" });
          }
          transaction.update(ref, { status: "cancelled", cancelReason: reason, cancelledBy: actor.uid, cancelledAt: FieldValue.serverTimestamp(), heldAmount: 0, paymentRequested: false, updatedAt: FieldValue.serverTimestamp() });
          if (actor.staff) auditInTransaction(transaction, actor, "contract.cancel", taskId, reason);
          otherParty = actor.uid === task.posterId ? String(task.assignedTo || "") : String(task.posterId || "");
          title = task.title;
        });
        await safeNotify(otherParty, "cancelled", "Task cancelled", `\"${title}\" was cancelled: ${reason.slice(0, 100)}`, `/tasks/${taskId}`);
        return NextResponse.json({ ok: true });
      }

      case "open_dispute": {
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const reason = cleanString(body.reason, 4000, "Dispute reason", 20);
        const taskRef = db.collection("tasks").doc(taskId);
        const disputeRef = db.collection("disputes").doc(taskId);
        let respondent = "";
        await db.runTransaction(async (transaction) => {
          const [taskSnap, disputeSnap] = await Promise.all([transaction.get(taskRef), transaction.get(disputeRef)]);
          if (!taskSnap.exists) throw new ApiProblem("Task not found.", 404);
          const task = taskSnap.data() || {};
          if (task.posterId !== actor.uid && task.assignedTo !== actor.uid) throw new ApiProblem("Only contract participants can open a dispute.", 403);
          if (!["submitted", "changes_requested", "completed"].includes(task.status)) throw new ApiProblem("A dispute cannot be opened from this task state.", 409);
          if (disputeSnap.exists && disputeSnap.data()?.status !== "resolved") throw new ApiProblem("This contract already has an active dispute.", 409);
          respondent = actor.uid === task.posterId ? String(task.assignedTo || "") : String(task.posterId || "");
          if (!respondent) throw new ApiProblem("The other contract party could not be identified.", 409);
          transaction.set(disputeRef, { taskId, openedBy: actor.uid, openedByName: actor.name, respondentId: respondent, reason, status: "open", previousTaskStatus: task.status, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
          transaction.update(taskRef, { status: "disputed", updatedAt: FieldValue.serverTimestamp() });
          auditInTransaction(transaction, actor, "contract.dispute", taskId, reason.slice(0, 500));
        });
        await safeNotify(respondent, "dispute", "A dispute was opened", "Workly support will review the on-platform contract record.", `/tasks/${taskId}`);
        return NextResponse.json({ ok: true });
      }

      case "approve_task": {
        requirePermission(actor, "approveTasks");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const visibility = body.visibility === "private" ? "private" : "public";
        const token = visibility === "private" ? randomBytes(24).toString("hex") : "";
        const ref = db.collection("tasks").doc(taskId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (!["pending", "rejected"].includes(task.status)) throw new ApiProblem("Only reviewed tasks can be approved.", 409);
          transaction.update(ref, { status: "open", visibility, approvalMode: "manual", approvedAt: FieldValue.serverTimestamp(), approvedBy: actor.email || actor.uid, approvalNote: visibility === "public" ? "Approved for public marketplace" : "Approved for private invitation", updatedAt: FieldValue.serverTimestamp(), ...(token ? { shareToken: token } : {}) });
          auditInTransaction(transaction, actor, visibility === "public" ? "task.publish" : "task.private_link", taskId, String(task.title || ""));
        });
        const snap = await ref.get();
        await safeNotify(snap.data()?.posterId, "task_approved", visibility === "public" ? "Your task is live" : "Your task is approved privately", visibility === "public" ? "Freelancers can now send offers." : "Use the private invitation link to invite one freelancer.", `/tasks/${taskId}`);
        return NextResponse.json({ token: token || null });
      }

      case "reject_task": {
        requirePermission(actor, "approveTasks");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const reason = cleanString(body.reason, 1500, "Rejection reason", 10);
        const ref = db.collection("tasks").doc(taskId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          const task = snap.data() || {};
          if (!["pending", "open"].includes(task.status)) throw new ApiProblem("This task cannot be rejected from its current state.", 409);
          transaction.update(ref, { status: "rejected", rejectionReason: reason, approvedBy: actor.email || actor.uid, updatedAt: FieldValue.serverTimestamp() });
          auditInTransaction(transaction, actor, "task.reject", taskId, reason);
        });
        const snap = await ref.get();
        await safeNotify(snap.data()?.posterId, "task_rejected", "Your task needs changes", reason, `/tasks/${taskId}`);
        return NextResponse.json({ ok: true });
      }

      case "set_task_status": {
        requirePermission(actor, "approveTasks");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const status = String(body.status || "");
        if (!["pending", "open", "rejected"].includes(status)) throw new ApiProblem("That status change is not available through moderation.");
        const ref = db.collection("tasks").doc(taskId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new ApiProblem("Task not found.", 404);
          transaction.update(ref, { status, updatedAt: FieldValue.serverTimestamp() });
          auditInTransaction(transaction, actor, "task.status", taskId, status);
        });
        return NextResponse.json({ ok: true });
      }

      case "claim_private_task": {
        requireMember(actor, "tasker");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const token = cleanString(body.token, 200, "Invitation token", 32);
        const taskRef = db.collection("tasks").doc(taskId);
        const inviteRef = db.collection("task_invites").doc(taskId);
        await db.runTransaction(async (transaction) => {
          const [taskSnap, inviteSnap] = await Promise.all([transaction.get(taskRef), transaction.get(inviteRef)]);
          if (!taskSnap.exists) throw new ApiProblem("Task not found.", 404);
          const task = taskSnap.data() || {};
          if (task.visibility !== "private" || task.status !== "open") throw new ApiProblem("This private invitation is no longer active.", 409);
          if (!secureTokenEquals(token, String(task.shareToken || ""))) throw new ApiProblem("This private invitation link is invalid.", 403);
          if (inviteSnap.exists && inviteSnap.data()?.userId !== actor.uid) throw new ApiProblem("This invitation has already been claimed.", 409);
          transaction.set(inviteRef, { taskId, userId: actor.uid, claimedAt: FieldValue.serverTimestamp() });
        });
        return NextResponse.json({ ok: true });
      }

      case "approve_private_task": {
        requirePermission(actor, "approveTasks");
        requirePermission(actor, "managePayments");
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const providerId = cleanString(body.providerId, 200, "Provider", 1);
        const taskRef = db.collection("tasks").doc(taskId);
        const providerRef = db.collection("users").doc(providerId);
        let providerName = ""; let clientId = ""; let title = "";
        await db.runTransaction(async (transaction) => {
          const [taskSnap, providerSnap] = await Promise.all([transaction.get(taskRef), transaction.get(providerRef)]);
          if (!taskSnap.exists || !providerSnap.exists) throw new ApiProblem("Task or provider not found.", 404);
          const task = taskSnap.data() || {}; const provider = providerSnap.data() || {};
          if (task.status !== "pending") throw new ApiProblem("Only tasks in review can use managed private fulfilment.", 409);
          if (provider.role !== "tasker" || provider.isPrivate !== true || provider.suspended === true) throw new ApiProblem("Choose an active private freelancer account.", 409);
          const posterRef = db.collection("users").doc(String(task.posterId));
          const posterSnap = await transaction.get(posterRef);
          if (!posterSnap.exists) throw new ApiProblem("Client account not found.", 409);
          const amount = finiteNumber(task.budget, "Task budget", MIN_BUDGET);
          const wallet = Number(posterSnap.data()?.wallet || 0);
          if (wallet < amount) throw new ApiProblem(`The client needs PKR ${Math.ceil(amount - wallet).toLocaleString()} more in its internal Workly balance.`, 409);
          providerName = String(provider.name || "Private provider"); clientId = String(task.posterId); title = String(task.title || "Task");
          const bidRef = db.collection("bids").doc(`${taskId}_${providerId}`);
          transaction.update(posterRef, { wallet: wallet - amount });
          transaction.set(bidRef, { taskId, taskTitle: title, bidderId: providerId, bidderName: providerName, amount, message: "Managed private fulfilment assigned by Workly operations.", deliveryDays: 0, status: "selected", isManaged: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
          transaction.update(taskRef, { status: "assigned", visibility: "private", approvalMode: "manual", assignedTo: providerId, assignedName: providerName, assignedAt: FieldValue.serverTimestamp(), bidsCount: 1, heldAmount: amount, heldAt: FieldValue.serverTimestamp(), paymentRequested: false, paymentReleased: false, approvedAt: FieldValue.serverTimestamp(), approvedBy: actor.email || actor.uid, approvalNote: "Managed private assignment", updatedAt: FieldValue.serverTimestamp() });
          transaction.set(db.collection("wallet_txs").doc(`hold_${taskId}`), { userId: clientId, amount, type: "hold", note: `Internal hold for \"${title}\"`, taskId, createdAt: FieldValue.serverTimestamp(), source: "server" });
          auditInTransaction(transaction, actor, "contract.private_assign", taskId, providerId);
        });
        await Promise.all([
          safeNotify(clientId, "private_assignment", "A managed provider has been assigned", `${providerName} will handle \"${title}\" privately.`, `/tasks/${taskId}`),
          safeNotify(providerId, "private_assignment", "New private assignment", `You have been assigned: ${title}`, `/tasks/${taskId}`),
        ]);
        return NextResponse.json({ ok: true });
      }

      case "add_review": {
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const rating = integer(body.rating, "Rating", 1, 5);
        const comment = optionalString(body.comment, 2000);
        const taskRef = db.collection("tasks").doc(taskId);
        const reviewRef = db.collection("reviews").doc(`${taskId}_${actor.uid}`);
        let toId = "";
        await db.runTransaction(async (transaction) => {
          const [taskSnap, existingReview] = await Promise.all([transaction.get(taskRef), transaction.get(reviewRef)]);
          if (!taskSnap.exists) throw new ApiProblem("Task not found.", 404);
          const task = taskSnap.data() || {};
          if (task.status !== "completed" || task.paymentReleased !== true) throw new ApiProblem("Reviews are available only after a completed contract.", 409);
          const isClient = task.posterId === actor.uid; const isFreelancer = task.assignedTo === actor.uid;
          if (!isClient && !isFreelancer) throw new ApiProblem("Only contract participants can leave a review.", 403);
          if (existingReview.exists) throw new ApiProblem("You already reviewed this contract.", 409);
          toId = isClient ? String(task.assignedTo || "") : String(task.posterId || "");
          if (!toId) throw new ApiProblem("Review recipient could not be identified.", 409);
          transaction.set(reviewRef, { taskId, taskTitle: task.title || "Task", fromId: actor.uid, fromName: actor.name, fromRole: isClient ? "client" : "freelancer", toId, rating, comment, createdAt: FieldValue.serverTimestamp() });
          transaction.update(taskRef, isClient ? { clientReviewed: true } : { freelancerReviewed: true });
        });
        await safeNotify(toId, "review", "You received a review", `${actor.name} left a ${rating}-star review.`, `/u/${toId}`);
        return NextResponse.json({ ok: true });
      }

      case "create_conversation": {
        const taskId = cleanString(body.taskId, 200, "Task", 1);
        const taskSnap = await db.collection("tasks").doc(taskId).get();
        if (!taskSnap.exists) throw new ApiProblem("Task not found.", 404);
        const task = taskSnap.data() || {};
        if (!["assigned", "in_progress", "submitted", "changes_requested", "completed", "disputed"].includes(task.status)) throw new ApiProblem("Private chat opens after a freelancer is hired.", 409);
        const participants = [String(task.posterId || ""), String(task.assignedTo || "")].filter(Boolean);
        if (!participants.includes(actor.uid)) throw new ApiProblem("Only contract participants can open this conversation.", 403);
        if (participants.length !== 2 || participants[0] === participants[1]) throw new ApiProblem("Conversation participants are invalid.", 409);
        const ref = db.collection("conversations").doc(taskId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) transaction.set(ref, { taskId, participants, posterId: task.posterId, taskerId: task.assignedTo, lastMessage: "", updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() });
          else {
            const current = snap.data() || {};
            if (current.taskId !== taskId || JSON.stringify([...(current.participants || [])].sort()) !== JSON.stringify([...participants].sort())) throw new ApiProblem("Conversation participant data is inconsistent.", 409);
          }
        });
        return NextResponse.json({ conversationId: taskId });
      }

      case "send_message": {
        const convId = cleanString(body.convId, 200, "Conversation", 1);
        const text = cleanString(body.text, 5000, "Message", 1);
        const convRef = db.collection("conversations").doc(convId);
        const convSnap = await convRef.get();
        if (!convSnap.exists) throw new ApiProblem("Conversation not found.", 404);
        const conv = convSnap.data() || {};
        const participants = Array.isArray(conv.participants) ? conv.participants.map(String) : [];
        if (!participants.includes(actor.uid)) throw new ApiProblem("You are not part of this conversation.", 403);
        const taskSnap = await db.collection("tasks").doc(String(conv.taskId || convId)).get();
        if (!taskSnap.exists) throw new ApiProblem("Contract not found.", 404);
        const task = taskSnap.data() || {};
        const expected = [String(task.posterId || ""), String(task.assignedTo || "")].filter(Boolean).sort();
        if (JSON.stringify([...participants].sort()) !== JSON.stringify(expected)) throw new ApiProblem("Conversation participants do not match the contract.", 409);
        const scan = scanMessage(text);
        const messageRef = convRef.collection("messages").doc();
        const batch = db.batch();
        batch.set(messageRef, { convId, fromId: actor.uid, fromName: actor.name, text, flagged: scan.flagged, flaggedReasons: scan.reasons, createdAt: FieldValue.serverTimestamp() });
        batch.update(convRef, { lastMessage: text.slice(0, 500), updatedAt: FieldValue.serverTimestamp() });
        await batch.commit();
        const other = participants.find((uid: string) => uid !== actor.uid);
        await safeNotify(other, scan.flagged ? "security" : "message", scan.flagged ? "Message held for safety review" : "New message", scan.flagged ? "A message contained off-platform contact or payment details." : `${actor.name}: ${text.slice(0, 60)}`, `/messages/${convId}`);
        return NextResponse.json({ messageId: messageRef.id, flagged: scan.flagged });
      }

      default:
        throw new ApiProblem("Unknown marketplace action.", 400);
    }
  } catch (error) {
    if ((error as Error)?.message === "AUTH_REQUIRED") return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    if (error instanceof ApiProblem) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("marketplace api error", error);
    return NextResponse.json({ error: "The marketplace service could not complete that action." }, { status: 500 });
  }
}
