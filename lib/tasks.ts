import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  limit,
  runTransaction,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { recalcTrust } from "./trust";
import { notify } from "./notifications";

export const PLATFORM_FEE = 0.15; // 15% commission like Airtasker
export const MIN_BID = 1000; // minimum proposal amount (PKR)

export const CATEGORIES = [
  "Cleaning",
  "Handyman",
  "Delivery",
  "Gardening",
  "IT & Web",
  "Design",
  "Moving",
  "Pet Care",
  "Tutoring",
  "Business & Admin",
  "Photography",
  "Cooking",
  "Furniture Assembly",
  "Painting",
  "Marketing & Design",
  "Other",
];

export type TaskStatus =
  | "pending"
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type Visibility = "public" | "private";
export type ApprovalMode = "auto" | "manual";

export interface Task {
  id?: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  deadline?: string;
  posterId: string;
  posterName: string;
  status: TaskStatus;
  visibility: Visibility;
  approvalMode: ApprovalMode;
  assignedTo?: string;
  assignedName?: string;
  bidsCount: number;
  createdAt: any;
  heldAmount?: number;
  heldAt?: any;
  paymentRequested?: boolean;
  paymentReleased?: boolean;
  paidAt?: any;
  approvedAt?: any;
  approvedBy?: string;
  approvalNote?: string;
  moderation?: "approved" | "review";
  shareToken?: string;
}

export interface Bid {
  id?: string;
  taskId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  message: string;
  status: "pending" | "selected" | "withdrawn" | "rejected";
  createdAt: any;
  moderated?: boolean;
  moderationReason?: string;
}

const SENSITIVE_PATTERNS = [
  { re: /https?:\/\/[^\s]+/gi, label: "link" },
  { re: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi, label: "email address" },
  { re: /\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, label: "phone number" },
  { re: /\b(wa\.me|t\.me|telegram|whatsapp|instagram|facebook|linkedin|twitter|x\.com)\b/gi, label: "social media link" },
  { re: /@\w+/g, label: "social handle" },
];

export function detectSensitiveContent(text: string): string[] {
  const reasons: string[] = [];
  for (const { re, label } of SENSITIVE_PATTERNS) {
    if (re.test(text)) reasons.push(label);
    re.lastIndex = 0;
  }
  return [...new Set(reasons)];
}

export interface Review {
  id?: string;
  taskId: string;
  fromId: string;
  fromName: string;
  toId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

function needDb() {
  if (!db) throw new Error("Firebase not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local");
  return db;
}

function byNewest<T extends { createdAt?: any }>(a: T, b: T) {
  const ta = a.createdAt?.seconds ?? 0;
  const tb = b.createdAt?.seconds ?? 0;
  return tb - ta;
}

export async function createTask(
  input: Omit<Task, "id" | "bidsCount" | "createdAt" | "assignedTo" | "assignedName">
): Promise<string> {
  const database = needDb();
  const ref = await addDoc(collection(database, "tasks"), {
    ...input,
    bidsCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTask(id: string): Promise<Task | null> {
  const database = needDb();
  const snap = await getDoc(doc(database, "tasks", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Task;
}

export function subscribeTask(id: string, callback: (task: Task | null) => void) {
  const database = needDb();
  return onSnapshot(doc(database, "tasks", id), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Task) : null);
  });
}

export async function listPublicTasks(
  category?: string,
  search?: string
): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(
    collection(database, "tasks"),
    where("visibility", "==", "public"),
    where("status", "in", ["open", "assigned", "in_progress"]),
    limit(100)
  ));
  let tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
  tasks = tasks.filter((t) =>
    t.visibility === "public" && ["open", "assigned", "in_progress"].includes(t.status)
  );
  if (category && category !== "all") tasks = tasks.filter((t) => t.category === category);
  if (search) {
    const s = search.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.location.toLowerCase().includes(s)
    );
  }
  return tasks.sort(byNewest);
}

export async function listTasksByPoster(posterId: string): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), where("posterId", "==", posterId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .filter((t) => t.posterId === posterId)
    .sort(byNewest);
}

export async function listTasksAssignedTo(taskerId: string): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), where("assignedTo", "==", taskerId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .filter((t) => t.assignedTo === taskerId)
    .sort(byNewest);
}

export async function listTasksWithUserBids(bidderId: string): Promise<Task[]> {
  const database = needDb();
  const bids = await listBidsByUser(bidderId);
  const seen = new Set<string>();
  const result: Task[] = [];
  for (const bid of bids) {
    if (seen.has(bid.taskId)) continue;
    seen.add(bid.taskId);
    try {
      const task = await getTask(bid.taskId);
      if (task) result.push(task);
    } catch {
      // Task may not be readable to the tasker (respect existing access rules).
    }
  }
  return result.sort(byNewest);
}

export interface RehireCandidate {
  taskerId: string;
  taskerName: string;
  lastTaskId: string;
  lastTaskTitle: string;
  completedAt: any;
}

export async function listRehireCandidates(posterId: string): Promise<RehireCandidate[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), where("posterId", "==", posterId), limit(300)));
  const latest = new Map<string, RehireCandidate>();
  snap.docs.forEach((d) => {
    const task = d.data() as Task;
    if (task.assignedTo && task.assignedName && task.status === "completed" && task.paymentReleased) {
      const completedAt = task.paidAt ?? task.approvedAt ?? task.heldAt;
      const existing = latest.get(task.assignedTo);
      if (!existing || (completedAt?.seconds ?? 0) > (existing.completedAt?.seconds ?? 0)) {
        latest.set(task.assignedTo, {
          taskerId: task.assignedTo,
          taskerName: task.assignedName,
          lastTaskId: d.id,
          lastTaskTitle: task.title,
          completedAt,
        });
      }
    }
  });
  return Array.from(latest.values()).sort(
    (a, b) => (b.completedAt?.seconds ?? 0) - (a.completedAt?.seconds ?? 0)
  );
}

export async function rehireFreelancer(
  taskId: string,
  taskerId: string,
  taskerName: string,
  amount: number
): Promise<void> {
  const database = needDb();
  if (!Number.isFinite(amount) || amount < MIN_BID) {
    throw new Error(`Your offer must be at least ${MIN_BID.toLocaleString("en-PK")}.`);
  }
  await runTransaction(database, async (transaction) => {
    const taskRef = doc(database, "tasks", taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) throw new Error("Task not found.");
    const task = taskSnap.data() as Task;
    if (task.status !== "open") throw new Error("This task is no longer accepting offers.");
    if (task.assignedTo) throw new Error("This task is already assigned.");

    const posterRef = doc(database, "users", task.posterId);
    const posterSnap = await transaction.get(posterRef);
    const posterWallet = posterSnap.data()?.wallet ?? 0;
    if (posterWallet < amount) {
      throw new Error(`Add ${formatCurrency(amount - posterWallet)} to your wallet before assigning this offer.`);
    }

    transaction.update(posterRef, { wallet: posterWallet - amount });
    transaction.update(taskRef, {
      status: "assigned",
      assignedTo: taskerId,
      assignedName: taskerName,
      heldAmount: amount,
      heldAt: serverTimestamp(),
      paymentRequested: false,
      paymentReleased: false,
    });
    transaction.set(doc(collection(database, "wallet_txs")), {
      userId: task.posterId,
      amount,
      type: "hold",
      note: `Funds held for ${task.title} (rehired offer)`,
      createdAt: new Date().toISOString(),
      taskId,
    });
  });

  await notify({
    userId: taskerId,
    type: "selected",
    title: "A previous client made you a new offer",
    body: `You have been offered a new task. It is separate from your previous completed work.`,
    link: `/tasks/${taskId}`,
  });
}

export async function listPendingTasks(): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), where("status", "==", "pending"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .filter((t) => t.status === "pending")
    .sort(byNewest);
}

export async function listPrivateTasks(): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), where("visibility", "==", "private"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .filter((t) => t.visibility === "private")
    .sort(byNewest);
}

export async function placeBid(input: {
  taskId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  message: string;
}): Promise<void> {
  const database = needDb();
  if (!Number.isFinite(input.amount) || input.amount < MIN_BID) {
    throw new Error(`Your offer must be at least ${MIN_BID.toLocaleString("en-PK")}.`);
  }
  const moderateReasons = detectSensitiveContent(input.message);
  const isModerated = moderateReasons.length > 0;
  await runTransaction(database, async (transaction) => {
    const taskRef = doc(database, "tasks", input.taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) throw new Error("This task is no longer available.");
    const task = taskSnap.data() as Task;
    if (task.status !== "open") throw new Error("This task is not accepting offers.");
    if (task.posterId === input.bidderId) throw new Error("You cannot bid on your own task.");
    const bidRef = doc(database, "bids", `${input.taskId}_${input.bidderId}`);
    const existing = await transaction.get(bidRef);
    if (existing.exists()) throw new Error("You have already submitted an offer for this task.");
    transaction.set(bidRef, {
      ...input,
      status: "pending",
      createdAt: serverTimestamp(),
      ...(isModerated && { moderated: true, moderationReason: moderateReasons.join(", ") }),
    });
    transaction.update(taskRef, {
      bidsCount: increment(1),
    });
  });

  try {
    const taskAfter = await getDoc(doc(database, "tasks", input.taskId));
    const posterId = taskAfter.exists() ? taskAfter.data().posterId : "";
    if (posterId && posterId !== input.bidderId) {
      await notify({
        userId: posterId,
        type: "bid",
        title: "New bid on your task",
        body: `${input.bidderName} offered PKR ${input.amount.toLocaleString("en-PK")}`,
        link: `/tasks/${input.taskId}`,
      });
    }
  } catch {
    // Notification failure should not fail the bid itself.
  }
}

export async function listBidsForTask(taskId: string): Promise<Bid[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "bids"), where("taskId", "==", taskId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Bid)
    .filter((b) => b.taskId === taskId)
    .sort(byNewest);
}

export async function listBidsByUser(bidderId: string): Promise<Bid[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "bids"), where("bidderId", "==", bidderId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Bid)
    .filter((b) => b.bidderId === bidderId)
    .sort(byNewest);
}

export async function selectBid(
  taskId: string,
  bidId: string,
  bidderId: string,
  bidderName: string,
  amount?: number
): Promise<void> {
  const database = needDb();
  const bidAmount = amount || 0;

  await runTransaction(database, async (transaction) => {
    const taskRef = doc(database, "tasks", taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) throw new Error("Task not found.");
    const task = taskSnap.data() as Task;
    if (task.status !== "open") throw new Error("This task is no longer open.");
    if (task.visibility !== "public") throw new Error("Private tasks are assigned by the Parwaz team.");

    const posterRef = doc(database, "users", task.posterId);
    const posterSnap = await transaction.get(posterRef);
    const posterWallet = posterSnap.data()?.wallet ?? 0;
    if (posterWallet < bidAmount) {
      throw new Error(`Add ${formatCurrency(bidAmount - posterWallet)} to your wallet before selecting this offer.`);
    }

    transaction.update(posterRef, { wallet: posterWallet - bidAmount });
    transaction.update(taskRef, {
      status: "assigned",
      assignedTo: bidderId,
      assignedName: bidderName,
      heldAmount: bidAmount,
      heldAt: serverTimestamp(),
      paymentRequested: false,
      paymentReleased: false,
    });
    transaction.update(doc(database, "bids", bidId), { status: "selected" });
    transaction.set(doc(collection(database, "wallet_txs")), {
      userId: task.posterId,
      amount: bidAmount,
      type: "hold",
      note: `Funds held for ${task.title}`,
      createdAt: new Date().toISOString(),
      taskId,
    });
  });

  await notify({
    userId: bidderId,
    type: "selected",
    title: "Bid selected",
    body: "Your bid was selected - task assigned to you.",
    link: `/tasks/${taskId}`,
  });
}

export async function requestPayment(taskId: string): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), { paymentRequested: true });
  const snap = await getDoc(doc(database, "tasks", taskId));
  if (snap.exists()) {
    await notify({
      userId: snap.data().posterId,
      type: "payment_request",
      title: "Payment requested",
      body: `${snap.data().assignedName} has requested payment for the task.`,
      link: `/tasks/${taskId}`,
    });
  }
}

export async function releasePayment(taskId: string): Promise<void> {
  const database = needDb();
  const snap = await getDoc(doc(database, "tasks", taskId));
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.paymentReleased) return;
  const amount = data.heldAmount || 0;
  const fee = Math.round(amount * PLATFORM_FEE);
  const taskerGets = amount - fee;

  const released = await runTransaction(database, async (transaction) => {
    const taskRef = doc(database, "tasks", taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) return false;
    if (taskSnap.data().paymentReleased) return false;
    transaction.update(taskRef, {
      paymentReleased: true,
      paidAt: serverTimestamp(),
      status: "completed",
    });
    return true;
  });
  if (!released) return;

  const posterId = data.posterId;
  if (!posterId) throw new Error("This task has no poster to settle.");
  if (taskerGets > 0) {
    if (!data.assignedTo) throw new Error("This task has no assigned freelancer to pay.");
    await addDoc(collection(database, "wallet_txs"), {
      userId: data.assignedTo,
      amount: taskerGets,
      type: "release",
      note: `Payment for task (${data.title || taskId}) - ${fee} platform fee`,
      createdAt: new Date().toISOString(),
      taskId,
    });
  }
  await addDoc(collection(database, "wallet_txs"), {
    userId: posterId,
    amount,
    type: "payment",
    note: `Payment released for ${data.title || taskId}`,
    createdAt: new Date().toISOString(),
    taskId,
  });

  if (data.assignedTo) {
    await notify({
      userId: data.assignedTo,
      type: "payment_released",
      title: "Payment released",
      body: `PKR ${taskerGets.toLocaleString("en-PK")} has been added to your wallet.`,
      link: `/wallet`,
    });
  }
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), { status });
}

export async function approveTask(
  taskId: string,
  visibility: Visibility,
  approvedBy?: string
): Promise<string | undefined> {
  const database = needDb();
  const shareToken = visibility === "private" ? createShareToken() : undefined;
  await updateDoc(doc(database, "tasks", taskId), {
    status: "open",
    visibility,
    approvalMode: "manual",
    approvedAt: serverTimestamp(),
    approvedBy: approvedBy || "Parwaz team",
    approvalNote: visibility === "public" ? "Approved for the public marketplace" : "Approved for private invitation",
    ...(shareToken ? { shareToken } : {}),
  });
  const snap = await getDoc(doc(database, "tasks", taskId));
  if (snap.exists()) {
    await notify({
      userId: snap.data().posterId,
      type: "task_approved",
      title: visibility === "public" ? "Your task is live" : "Your task is approved",
      body: visibility === "public" ? "Professionals can now send offers." : "Only a freelancer with the private invitation can view and bid.",
      link: `/tasks/${taskId}`,
    });
  }
  return shareToken;
}

function createShareToken() {
  const values = new Uint8Array(24);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function claimPrivateTask(taskId: string, token: string, userId: string): Promise<void> {
  if (!token || token.length < 32) throw new Error("This private invitation link is invalid.");
  const database = needDb();
  const inviteRef = doc(database, "task_invites", taskId);
  try {
    const existing = await getDoc(inviteRef);
    if (existing.exists() && existing.data().userId === userId) return;
  } catch {
    // An invitation claimed by somebody else is intentionally unreadable.
  }
  await setDoc(inviteRef, {
    taskId,
    userId,
    token,
    claimedAt: serverTimestamp(),
  });
}

export async function approvePrivateTask(input: {
  taskId: string;
  providerId: string;
  providerName: string;
  approvedBy: string;
}): Promise<void> {
  const database = needDb();
  const taskRef = doc(database, "tasks", input.taskId);
  const bidRef = doc(collection(database, "bids"));

  const task = await runTransaction(database, async (transaction) => {
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) throw new Error("Task not found.");
    const taskData = taskSnap.data() as Task;
    if (taskData.status !== "pending") throw new Error("Only pending tasks can use private fulfilment.");

    const posterRef = doc(database, "users", taskData.posterId);
    const posterSnap = await transaction.get(posterRef);
    const posterWallet = posterSnap.data()?.wallet ?? 0;
    if (posterWallet < taskData.budget) {
      throw new Error(`Client needs ${formatCurrency(taskData.budget - posterWallet)} more in wallet before private assignment.`);
    }

    transaction.update(posterRef, { wallet: posterWallet - taskData.budget });
    transaction.set(bidRef, {
      taskId: input.taskId,
      bidderId: input.providerId,
      bidderName: input.providerName,
      amount: taskData.budget,
      message: "Managed private fulfilment by a Parwaz verified provider.",
      status: "selected",
      isManaged: true,
      createdAt: serverTimestamp(),
    });
    transaction.update(taskRef, {
      status: "assigned",
      visibility: "private",
      approvalMode: "manual",
      assignedTo: input.providerId,
      assignedName: input.providerName,
      bidsCount: 1,
      heldAmount: taskData.budget,
      heldAt: serverTimestamp(),
      paymentRequested: false,
      paymentReleased: false,
      approvedAt: serverTimestamp(),
      approvedBy: input.approvedBy,
      approvalNote: "Privately approved and assigned to a Parwaz managed provider",
    });
    transaction.set(doc(collection(database, "wallet_txs")), {
      userId: taskData.posterId,
      amount: taskData.budget,
      type: "hold",
      note: `Funds held for ${taskData.title}`,
      createdAt: new Date().toISOString(),
      taskId: input.taskId,
    });
    return taskData;
  });

  await Promise.all([
    notify({
      userId: task.posterId,
      type: "private_assignment",
      title: "A managed provider has been assigned",
      body: `${input.providerName} is ready to handle your task privately.`,
      link: `/tasks/${input.taskId}`,
    }),
    notify({
      userId: input.providerId,
      type: "private_assignment",
      title: "New private assignment",
      body: `You have been assigned: ${task.title}`,
      link: `/tasks/${input.taskId}`,
    }),
  ]);
}

function formatCurrency(amount: number) {
  return `PKR ${Math.max(0, amount).toLocaleString("en-PK")}`;
}

export async function addReview(input: {
  taskId: string;
  fromId: string;
  fromName: string;
  toId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const database = needDb();
  if (!input.taskId || !input.fromId || !input.toId) throw new Error("Task and reviewers are required.");
  if (input.fromId === input.toId) throw new Error("You cannot review yourself.");
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }
  await setDoc(doc(collection(database, "reviews"), `${input.taskId}_${input.fromId}`), {
    ...input,
    createdAt: serverTimestamp(),
  });
  try {
    await recalcTrust(input.toId);
  } catch {
    // The review is the source of truth. Trust can be recalculated by an
    // authorised admin process when cross-user profile writes are restricted.
  }
}

export async function listReviewsForUser(toId: string): Promise<Review[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "reviews"), where("toId", "==", toId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Review)
    .filter((r) => r.toId === toId)
    .sort(byNewest);
}
