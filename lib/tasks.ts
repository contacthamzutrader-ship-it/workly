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
import { formatPKR } from "./format";

/** Freelancer service fee. Disclosed before an offer is sent and fixed on hire. */
export const PLATFORM_FEE = 0.15;
export const MIN_BUDGET = 500;
export const MIN_OFFER = 500;

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
  "Writing & Translation",
  "Video & Audio",
  "Other",
];

export const CATEGORY_GROUPS: { label: string; items: string[] }[] = [
  { label: "Around the home", items: ["Cleaning", "Handyman", "Gardening", "Furniture Assembly", "Painting", "Moving", "Pet Care"] },
  { label: "Digital & creative", items: ["IT & Web", "Design", "Marketing & Design", "Writing & Translation", "Video & Audio", "Photography"] },
  { label: "Business & personal", items: ["Business & Admin", "Tutoring", "Delivery", "Cooking", "Other"] },
];

/**
 * Task lifecycle.
 *
 * draft → pending → open → assigned → in_progress → submitted
 *   → (changes_requested → submitted)* → completed → paid
 *
 * Exits: rejected, cancelled, disputed.
 */
export type TaskStatus =
  | "draft"
  | "pending"
  | "rejected"
  | "open"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "changes_requested"
  | "completed"
  | "cancelled"
  | "disputed";

export type Visibility = "public" | "private";
export type ApprovalMode = "auto" | "manual";
export type Urgency = "flexible" | "this_week" | "urgent";

export const ACTIVE_STATUSES: TaskStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "submitted",
  "changes_requested",
];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: string; hint: string }> = {
  draft: { label: "Draft", tone: "bg-ink-50 text-ink-500 border-ink-200", hint: "Not submitted yet." },
  pending: { label: "In review", tone: "bg-amber-50 text-amber-700 border-amber-200", hint: "Workly is checking this task before it goes live." },
  rejected: { label: "Rejected", tone: "bg-rose-50 text-rose-700 border-rose-200", hint: "This task did not pass review." },
  open: { label: "Open for offers", tone: "bg-brand-50 text-brand-dark border-brand-200", hint: "Freelancers can send offers." },
  assigned: { label: "Hired", tone: "bg-blue-50 text-blue-700 border-blue-200", hint: "A freelancer has been selected." },
  in_progress: { label: "In progress", tone: "bg-indigo-50 text-indigo-700 border-indigo-200", hint: "Work has started." },
  submitted: { label: "Delivered", tone: "bg-violet-50 text-violet-700 border-violet-200", hint: "Waiting for the client to review the delivery." },
  changes_requested: { label: "Changes requested", tone: "bg-orange-50 text-orange-700 border-orange-200", hint: "The client asked for revisions." },
  completed: { label: "Completed", tone: "bg-emerald-50 text-emerald-700 border-emerald-200", hint: "Approved and closed." },
  cancelled: { label: "Cancelled", tone: "bg-ink-100 text-ink-600 border-ink-200", hint: "This task was cancelled." },
  disputed: { label: "In dispute", tone: "bg-rose-50 text-rose-700 border-rose-200", hint: "Workly support is reviewing this contract." },
};

/** Ordered milestones shown on the task tracker. */
export const TASK_STAGES: { key: TaskStatus; label: string }[] = [
  { key: "open", label: "Offers" },
  { key: "assigned", label: "Hired" },
  { key: "in_progress", label: "In progress" },
  { key: "submitted", label: "Delivered" },
  { key: "completed", label: "Approved" },
];

export function stageIndex(status: TaskStatus): number {
  if (status === "changes_requested") return 2;
  if (status === "pending" || status === "draft") return -1;
  const index = TASK_STAGES.findIndex((stage) => stage.key === status);
  return index;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  category: string;
  skills?: string[];
  budget: number;
  location: string;
  remote?: boolean;
  urgency?: Urgency;
  deadline?: string;
  posterId: string;
  posterName: string;
  status: TaskStatus;
  visibility: Visibility;
  approvalMode: ApprovalMode;
  assignedTo?: string;
  assignedName?: string;
  assignedAt?: unknown;
  bidsCount: number;
  createdAt: unknown;
  updatedAt?: unknown;
  heldAmount?: number;
  heldAt?: unknown;
  paymentRequested?: boolean;
  paymentReleased?: boolean;
  paidAt?: unknown;
  approvedAt?: unknown;
  approvedBy?: string;
  approvalNote?: string;
  rejectionReason?: string;
  moderation?: "approved" | "review";
  shareToken?: string;
  workSubmission?: string;
  workSubmittedAt?: unknown;
  revisionNote?: string;
  revisionCount?: number;
  startedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  cancelReason?: string;
  cancelledBy?: string;
  clientReviewed?: boolean;
  freelancerReviewed?: boolean;
}

export interface Bid {
  id?: string;
  taskId: string;
  taskTitle?: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  message: string;
  deliveryDays?: number;
  status: "pending" | "selected" | "withdrawn" | "rejected";
  isManaged?: boolean;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id?: string;
  taskId: string;
  taskTitle?: string;
  fromId: string;
  fromName: string;
  fromRole?: "client" | "freelancer";
  toId: string;
  rating: number;
  comment: string;
  createdAt: unknown;
}

function needDb() {
  if (!db) throw new Error("Workly is not connected to Firebase yet.");
  return db;
}

function byNewest<T extends { createdAt?: any }>(a: T, b: T) {
  const first = a.createdAt?.seconds ?? 0;
  const second = b.createdAt?.seconds ?? 0;
  return second - first;
}

// ---------------------------------------------------------------------------
// Creating and reading tasks
// ---------------------------------------------------------------------------

export async function createTask(
  input: Omit<Task, "id" | "bidsCount" | "createdAt" | "assignedTo" | "assignedName">
): Promise<string> {
  const database = needDb();
  if (!input.title.trim()) throw new Error("Give your task a clear title.");
  if (input.budget < MIN_BUDGET) throw new Error(`The minimum task budget is ${formatPKR(MIN_BUDGET)}.`);
  const reference = await addDoc(collection(database, "tasks"), {
    ...input,
    bidsCount: 0,
    revisionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateTaskDetails(
  taskId: string,
  changes: Partial<Pick<Task, "title" | "description" | "category" | "budget" | "location" | "deadline" | "urgency" | "remote" | "skills">>
): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), { ...changes, updatedAt: serverTimestamp() });
}

export async function getTask(id: string): Promise<Task | null> {
  const database = needDb();
  const snapshot = await getDoc(doc(database, "tasks", id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Task;
}

export function subscribeTask(id: string, callback: (task: Task | null) => void) {
  const database = needDb();
  return onSnapshot(doc(database, "tasks", id), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Task) : null);
  });
}

export interface TaskFilters {
  category?: string;
  search?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  remoteOnly?: boolean;
  sort?: "newest" | "budget_high" | "budget_low" | "fewest_offers";
}

export function filterAndSortTasks(tasks: Task[], filters: TaskFilters = {}): Task[] {
  let result = tasks.slice();
  if (filters.category && filters.category !== "all") {
    result = result.filter((task) => task.category === filters.category);
  }
  if (filters.remoteOnly) result = result.filter((task) => task.remote === true);
  if (typeof filters.minBudget === "number") result = result.filter((task) => task.budget >= filters.minBudget!);
  if (typeof filters.maxBudget === "number" && filters.maxBudget > 0) {
    result = result.filter((task) => task.budget <= filters.maxBudget!);
  }
  if (filters.location?.trim()) {
    const needle = filters.location.trim().toLowerCase();
    result = result.filter((task) => (task.location || "").toLowerCase().includes(needle));
  }
  if (filters.search?.trim()) {
    const needle = filters.search.trim().toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(needle) ||
        task.description.toLowerCase().includes(needle) ||
        (task.location || "").toLowerCase().includes(needle) ||
        (task.skills || []).some((skill) => skill.toLowerCase().includes(needle))
    );
  }

  switch (filters.sort) {
    case "budget_high":
      return result.sort((a, b) => b.budget - a.budget);
    case "budget_low":
      return result.sort((a, b) => a.budget - b.budget);
    case "fewest_offers":
      return result.sort((a, b) => (a.bidsCount || 0) - (b.bidsCount || 0));
    default:
      return result.sort(byNewest);
  }
}

export async function listPublicTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "tasks"), where("visibility", "==", "public"), limit(200))
  );
  const tasks = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as Task)
    .filter((task) => task.visibility === "public" && ACTIVE_STATUSES.includes(task.status));
  return filterAndSortTasks(tasks, filters);
}

/** Realtime variant of listPublicTasks — keeps the marketplace live without refresh. */
export function subscribePublicTasks(
  filters: TaskFilters,
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
) {
  const database = needDb();
  const q = query(collection(database, "tasks"), where("visibility", "==", "public"), limit(200));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Task)
        .filter((task) => task.visibility === "public" && ACTIVE_STATUSES.includes(task.status));
      callback(filterAndSortTasks(tasks, filters));
    },
    (error) => onError?.(error as Error)
  );
}

export async function listTasksByPoster(posterId: string): Promise<Task[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "tasks"), where("posterId", "==", posterId), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribeTasksByPoster(posterId: string, callback: (tasks: Task[]) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "tasks"), where("posterId", "==", posterId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest))
  );
}

export async function listTasksForFreelancer(userId: string): Promise<Task[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "tasks"), where("assignedTo", "==", userId), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribeTasksForFreelancer(userId: string, callback: (tasks: Task[]) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "tasks"), where("assignedTo", "==", userId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest))
  );
}

export async function listPendingTasks(): Promise<Task[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "tasks"), where("status", "==", "pending"), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribePendingTasks(callback: (tasks: Task[]) => void, onError?: (e: Error) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "tasks"), where("status", "==", "pending"), limit(200)),
    (snap) => callback(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)),
    (err) => onError?.(err as Error)
  );
}

export async function listPrivateTasks(): Promise<Task[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "tasks"), where("visibility", "==", "private"), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribePrivateTasks(callback: (tasks: Task[]) => void, onError?: (e: Error) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "tasks"), where("visibility", "==", "private"), limit(200)),
    (snap) => callback(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)),
    (err) => onError?.(err as Error)
  );
}

export function subscribeAllTasks(callback: (tasks: Task[]) => void, onError?: (e: Error) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "tasks"), limit(500)),
    (snap) => callback(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)),
    (err) => onError?.(err as Error)
  );
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export async function placeBid(input: {
  taskId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  message: string;
  deliveryDays?: number;
}): Promise<void> {
  const database = needDb();
  if (!Number.isFinite(input.amount) || input.amount < MIN_OFFER) {
    throw new Error(`Your offer must be at least ${formatPKR(MIN_OFFER)}.`);
  }
  const taskSnapshot = await getDoc(doc(database, "tasks", input.taskId));
  if (!taskSnapshot.exists()) throw new Error("This task is no longer available.");
  const task = taskSnapshot.data() as Task;
  if (task.status !== "open") throw new Error("This task is not accepting offers right now.");
  if (task.posterId === input.bidderId) throw new Error("You cannot send an offer on your own task.");

  const existing = await getDocs(
    query(
      collection(database, "bids"),
      where("taskId", "==", input.taskId),
      where("bidderId", "==", input.bidderId),
      limit(1)
    )
  );
  if (!existing.empty) {
    throw new Error("You already have an offer on this task. Edit it instead of sending a new one.");
  }

  await addDoc(collection(database, "bids"), {
    ...input,
    taskTitle: task.title,
    deliveryDays: input.deliveryDays || 0,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "tasks", input.taskId), { bidsCount: increment(1) });

  await notify({
    userId: task.posterId,
    type: "bid",
    title: "New offer on your task",
    body: `${input.bidderName} offered ${formatPKR(input.amount)} for "${task.title}".`,
    link: `/tasks/${input.taskId}`,
  });
}

export async function listBidsForTask(taskId: string): Promise<Bid[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "bids"), where("taskId", "==", taskId), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest);
}

export function subscribeBidsForTask(taskId: string, callback: (bids: Bid[]) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "bids"), where("taskId", "==", taskId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest))
  );
}

export async function updateBid(bidId: string, amount: number, message: string, deliveryDays?: number): Promise<void> {
  const database = needDb();
  if (!Number.isFinite(amount) || amount < MIN_OFFER) throw new Error(`Your offer must be at least ${formatPKR(MIN_OFFER)}.`);
  await updateDoc(doc(database, "bids", bidId), {
    amount,
    message: message.trim(),
    ...(typeof deliveryDays === "number" ? { deliveryDays } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function withdrawBid(bidId: string): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "bids", bidId), { status: "withdrawn", updatedAt: serverTimestamp() });
}

export async function listBidsByUser(bidderId: string): Promise<Bid[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "bids"), where("bidderId", "==", bidderId), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest);
}

export function subscribeBidsByUser(bidderId: string, callback: (bids: Bid[]) => void) {
  const database = needDb();
  return onSnapshot(
    query(collection(database, "bids"), where("bidderId", "==", bidderId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest))
  );
}

// ---------------------------------------------------------------------------
// Hiring and delivery
// ---------------------------------------------------------------------------

export async function selectBid(
  taskId: string,
  bidId: string,
  bidderId: string,
  bidderName: string,
  amount = 0
): Promise<void> {
  const database = needDb();

  await runTransaction(database, async (transaction) => {
    const taskRef = doc(database, "tasks", taskId);
    const taskSnapshot = await transaction.get(taskRef);
    if (!taskSnapshot.exists()) throw new Error("Task not found.");
    const task = taskSnapshot.data() as Task;
    if (task.status !== "open") throw new Error("This task is no longer open for hiring.");

    const posterRef = doc(database, "users", task.posterId);
    const posterSnapshot = await transaction.get(posterRef);
    const walletBalance = posterSnapshot.data()?.wallet ?? 0;
    if (walletBalance < amount) {
      throw new Error(`Add ${formatPKR(amount - walletBalance)} to your Workly balance before hiring for this offer.`);
    }

    transaction.update(posterRef, { wallet: walletBalance - amount });
    transaction.update(taskRef, {
      status: "assigned",
      assignedTo: bidderId,
      assignedName: bidderName,
      assignedAt: serverTimestamp(),
      heldAmount: amount,
      heldAt: serverTimestamp(),
      paymentRequested: false,
      paymentReleased: false,
      updatedAt: serverTimestamp(),
    });
    transaction.update(doc(database, "bids", bidId), { status: "selected", updatedAt: serverTimestamp() });
    transaction.set(doc(collection(database, "wallet_txs")), {
      userId: task.posterId,
      amount,
      type: "hold",
      note: `Funds held for "${task.title}"`,
      createdAt: new Date().toISOString(),
      taskId,
    });
  });

  // Every other offer on this task is now closed.
  const others = await listBidsForTask(taskId);
  await Promise.all(
    others
      .filter((bid) => bid.id !== bidId && bid.status === "pending")
      .map(async (bid) => {
        await updateDoc(doc(database, "bids", bid.id!), { status: "rejected", updatedAt: serverTimestamp() });
        await notify({
          userId: bid.bidderId,
          type: "bid_rejected",
          title: "Another freelancer was hired",
          body: `The client selected a different offer for "${bid.taskTitle || "a task"}".`,
          link: "/tasks",
        });
      })
  );

  await notify({
    userId: bidderId,
    type: "selected",
    title: "You have been hired",
    body: `Your offer of ${formatPKR(amount)} was accepted. Open the task to start work.`,
    link: `/tasks/${taskId}`,
  });
}

export async function startWork(taskId: string): Promise<void> {
  const database = needDb();
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (!snapshot.exists()) throw new Error("Task not found.");
  await updateDoc(doc(database, "tasks", taskId), {
    status: "in_progress",
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await notify({
    userId: snapshot.data().posterId,
    type: "work_started",
    title: "Work has started",
    body: `${snapshot.data().assignedName || "Your freelancer"} started "${snapshot.data().title}".`,
    link: `/tasks/${taskId}`,
  });
}

export async function submitWork(taskId: string, summary: string): Promise<void> {
  const database = needDb();
  if (!summary.trim()) throw new Error("Describe what you delivered so the client can review it.");
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (!snapshot.exists()) throw new Error("Task not found.");
  await updateDoc(doc(database, "tasks", taskId), {
    status: "submitted",
    workSubmission: summary.trim(),
    workSubmittedAt: serverTimestamp(),
    paymentRequested: true,
    updatedAt: serverTimestamp(),
  });
  await notify({
    userId: snapshot.data().posterId,
    type: "work_submitted",
    title: "Delivery ready for review",
    body: `${snapshot.data().assignedName || "Your freelancer"} submitted work for "${snapshot.data().title}".`,
    link: `/tasks/${taskId}`,
  });
}

export async function requestChanges(taskId: string, note: string): Promise<void> {
  const database = needDb();
  if (!note.trim()) throw new Error("Explain what needs to change.");
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (!snapshot.exists()) throw new Error("Task not found.");
  await updateDoc(doc(database, "tasks", taskId), {
    status: "changes_requested",
    revisionNote: note.trim(),
    revisionCount: increment(1),
    paymentRequested: false,
    updatedAt: serverTimestamp(),
  });
  if (snapshot.data().assignedTo) {
    await notify({
      userId: snapshot.data().assignedTo,
      type: "changes_requested",
      title: "Changes requested",
      body: note.trim().slice(0, 120),
      link: `/tasks/${taskId}`,
    });
  }
}

/** Client approves the delivery: closes the contract and pays the freelancer. */
export async function approveAndPay(taskId: string): Promise<void> {
  const database = needDb();
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (!snapshot.exists()) throw new Error("Task not found.");
  const task = snapshot.data() as Task;
  if (task.paymentReleased) return;

  const amount = task.heldAmount || 0;
  const fee = Math.round(amount * PLATFORM_FEE);
  const freelancerReceives = amount - fee;

  await updateDoc(doc(database, "tasks", taskId), {
    status: "completed",
    paymentReleased: true,
    paidAt: serverTimestamp(),
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all([
    addDoc(collection(database, "wallet_txs"), {
      userId: task.assignedTo,
      amount: freelancerReceives,
      type: "release",
      note: `Payment for "${task.title}" (after ${Math.round(PLATFORM_FEE * 100)}% service fee)`,
      createdAt: new Date().toISOString(),
      taskId,
    }),
    addDoc(collection(database, "wallet_txs"), {
      userId: task.posterId,
      amount,
      type: "payment",
      note: `Released payment for "${task.title}"`,
      createdAt: new Date().toISOString(),
      taskId,
    }),
  ]);

  if (task.assignedTo) {
    await notify({
      userId: task.assignedTo,
      type: "payment_released",
      title: "Payment released",
      body: `${formatPKR(freelancerReceives)} is on the way for "${task.title}".`,
      link: "/wallet",
    });
  }
}

export async function cancelTask(taskId: string, reason: string, cancelledBy: string): Promise<void> {
  const database = needDb();
  if (!reason.trim()) throw new Error("Add a reason so the other party understands why.");
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (!snapshot.exists()) throw new Error("Task not found.");
  const task = snapshot.data() as Task;
  if (task.paymentReleased) throw new Error("A paid task cannot be cancelled. Open a dispute instead.");

  await runTransaction(database, async (transaction) => {
    const taskRef = doc(database, "tasks", taskId);
    const posterRef = doc(database, "users", task.posterId);
    const held = task.heldAmount || 0;
    if (held > 0) {
      const posterSnapshot = await transaction.get(posterRef);
      const balance = posterSnapshot.data()?.wallet ?? 0;
      transaction.update(posterRef, { wallet: balance + held });
      transaction.set(doc(collection(database, "wallet_txs")), {
        userId: task.posterId,
        amount: held,
        type: "refund",
        note: `Refund after cancelling "${task.title}"`,
        createdAt: new Date().toISOString(),
        taskId,
      });
    }
    transaction.update(taskRef, {
      status: "cancelled",
      cancelReason: reason.trim(),
      cancelledBy,
      cancelledAt: serverTimestamp(),
      heldAmount: 0,
      updatedAt: serverTimestamp(),
    });
  });

  const otherParty = cancelledBy === task.posterId ? task.assignedTo : task.posterId;
  if (otherParty) {
    await notify({
      userId: otherParty,
      type: "cancelled",
      title: "Task cancelled",
      body: `"${task.title}" was cancelled: ${reason.trim().slice(0, 100)}`,
      link: `/tasks/${taskId}`,
    });
  }
}

export async function openDispute(input: {
  taskId: string;
  openedBy: string;
  openedByName: string;
  respondentId: string;
  reason: string;
}): Promise<void> {
  const database = needDb();
  if (!input.reason.trim()) throw new Error("Describe the problem so support can help.");
  await addDoc(collection(database, "disputes"), {
    ...input,
    reason: input.reason.trim(),
    status: "open",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "tasks", input.taskId), { status: "disputed", updatedAt: serverTimestamp() });
  await notify({
    userId: input.respondentId,
    type: "dispute",
    title: "A dispute was opened",
    body: "Workly support will review the task history and get in touch.",
    link: `/tasks/${input.taskId}`,
  });
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), { status, updatedAt: serverTimestamp() });
}

/** Legacy aliases kept so nothing that still imports them breaks. */
export const requestPayment = (taskId: string) => submitWork(taskId, "Work completed and payment requested.");
export const releasePayment = approveAndPay;

// ---------------------------------------------------------------------------
// Moderation and private fulfilment
// ---------------------------------------------------------------------------

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
    approvedBy: approvedBy || "Workly team",
    approvalNote:
      visibility === "public" ? "Approved for the public marketplace" : "Approved for private invitation",
    updatedAt: serverTimestamp(),
    ...(shareToken ? { shareToken } : {}),
  });
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (snapshot.exists()) {
    await notify({
      userId: snapshot.data().posterId,
      type: "task_approved",
      title: visibility === "public" ? "Your task is live" : "Your task is approved privately",
      body:
        visibility === "public"
          ? "Freelancers can now send you offers."
          : "Only a freelancer with your private invitation can see and bid on it.",
      link: `/tasks/${taskId}`,
    });
  }
  return shareToken;
}

export async function rejectTask(taskId: string, reason: string, rejectedBy: string): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), {
    status: "rejected",
    rejectionReason: reason,
    approvedBy: rejectedBy,
    updatedAt: serverTimestamp(),
  });
  const snapshot = await getDoc(doc(database, "tasks", taskId));
  if (snapshot.exists()) {
    await notify({
      userId: snapshot.data().posterId,
      type: "task_rejected",
      title: "Your task needs changes",
      body: reason || "Please review the marketplace guidelines and post again.",
      link: `/tasks/${taskId}`,
    });
  }
}

function createShareToken() {
  const values = new Uint8Array(24);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function claimPrivateTask(taskId: string, token: string, userId: string): Promise<void> {
  if (!token || token.length < 32) throw new Error("This private invitation link is not valid.");
  const database = needDb();
  const inviteRef = doc(database, "task_invites", taskId);
  try {
    const existing = await getDoc(inviteRef);
    if (existing.exists() && existing.data().userId === userId) return;
  } catch {
    // An invitation claimed by somebody else is intentionally unreadable.
  }
  await setDoc(inviteRef, { taskId, userId, token, claimedAt: serverTimestamp() });
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
    const taskSnapshot = await transaction.get(taskRef);
    if (!taskSnapshot.exists()) throw new Error("Task not found.");
    const data = taskSnapshot.data() as Task;
    if (data.status !== "pending") throw new Error("Only tasks in review can use private fulfilment.");

    const posterRef = doc(database, "users", data.posterId);
    const posterSnapshot = await transaction.get(posterRef);
    const balance = posterSnapshot.data()?.wallet ?? 0;
    if (balance < data.budget) {
      throw new Error(`The client needs ${formatPKR(data.budget - balance)} more before a private assignment.`);
    }

    transaction.update(posterRef, { wallet: balance - data.budget });
    transaction.set(bidRef, {
      taskId: input.taskId,
      taskTitle: data.title,
      bidderId: input.providerId,
      bidderName: input.providerName,
      amount: data.budget,
      message: "Managed private fulfilment by a Workly verified provider.",
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
      assignedAt: serverTimestamp(),
      bidsCount: 1,
      heldAmount: data.budget,
      heldAt: serverTimestamp(),
      paymentRequested: false,
      paymentReleased: false,
      approvedAt: serverTimestamp(),
      approvedBy: input.approvedBy,
      approvalNote: "Privately approved and assigned to a Workly managed provider",
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(collection(database, "wallet_txs")), {
      userId: data.posterId,
      amount: data.budget,
      type: "hold",
      note: `Funds held for "${data.title}"`,
      createdAt: new Date().toISOString(),
      taskId: input.taskId,
    });
    return data;
  });

  await Promise.all([
    notify({
      userId: task.posterId,
      type: "private_assignment",
      title: "A managed provider has been assigned",
      body: `${input.providerName} will handle "${task.title}" privately.`,
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

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function addReview(input: {
  taskId: string;
  taskTitle?: string;
  fromId: string;
  fromName: string;
  fromRole?: "client" | "freelancer";
  toId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const database = needDb();
  if (input.rating < 1 || input.rating > 5) throw new Error("Choose a rating between 1 and 5 stars.");
  await addDoc(collection(database, "reviews"), { ...input, createdAt: serverTimestamp() });
  await updateDoc(doc(database, "tasks", input.taskId), {
    ...(input.fromRole === "freelancer" ? { freelancerReviewed: true } : { clientReviewed: true }),
  }).catch(() => undefined);
  try {
    await recalcTrust(input.toId);
  } catch {
    // Trust is recalculated by an authorised process when cross-user writes are blocked.
  }
  await notify({
    userId: input.toId,
    type: "review",
    title: "You received a review",
    body: `${input.fromName} rated your work ${input.rating} out of 5.`,
    link: `/u/${input.toId}`,
  });
}

export async function listReviewsForUser(toId: string): Promise<Review[]> {
  const database = needDb();
  const snapshot = await getDocs(
    query(collection(database, "reviews"), where("toId", "==", toId), limit(200))
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Review).sort(byNewest);
}

export async function hasReviewed(taskId: string, fromId: string): Promise<boolean> {
  const database = needDb();
  const snapshot = await getDocs(
    query(
      collection(database, "reviews"),
      where("taskId", "==", taskId),
      where("fromId", "==", fromId),
      limit(1)
    )
  );
  return !snapshot.empty;
}

// ---------------------------------------------------------------------------
// Saved tasks (freelancer shortlist)
// ---------------------------------------------------------------------------

export async function toggleSavedTask(userId: string, taskId: string, saved: boolean): Promise<void> {
  const database = needDb();
  const reference = doc(database, "users", userId, "saved_tasks", taskId);
  if (saved) {
    await setDoc(reference, { taskId, savedAt: serverTimestamp() });
  } else {
    await setDoc(reference, { taskId, savedAt: null, removed: true }, { merge: true });
  }
}

export async function listSavedTaskIds(userId: string): Promise<string[]> {
  const database = needDb();
  try {
    const snapshot = await getDocs(collection(database, "users", userId, "saved_tasks"));
    return snapshot.docs.filter((item) => item.data().removed !== true).map((item) => item.id);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Realtime helpers for wallet and talent (advanced marketplace polish)
// ---------------------------------------------------------------------------

export interface WalletTx {
  id?: string;
  amount: number;
  type: "deposit" | "withdraw" | "release" | "payment" | "hold" | "refund";
  note: string;
  createdAt: string;
  taskId?: string;
  userId: string;
}

export function subscribeWalletTxs(
  userId: string,
  callback: (entries: WalletTx[]) => void,
  onError?: (error: Error) => void
) {
  const database = needDb();
  // Prefer indexed, server-sorted query; fall back to client sort if the index is still building.
  try {
    const q = query(
      collection(database, "wallet_txs"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(80)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WalletTx));
      },
      () => {
        const fallback = query(collection(database, "wallet_txs"), where("userId", "==", userId), limit(200));
        return onSnapshot(
          fallback,
          (snapshot) => {
            const entries = snapshot.docs
              .map((item) => ({ id: item.id, ...item.data() }) as WalletTx)
              .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
            callback(entries);
          },
          (error) => onError?.(error as Error)
        );
      }
    );
  } catch {
    const fallback = query(collection(database, "wallet_txs"), where("userId", "==", userId), limit(200));
    return onSnapshot(
      fallback,
      (snapshot) => {
        const entries = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as WalletTx)
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        callback(entries);
      },
      (error) => onError?.(error as Error)
    );
  }
}

export function subscribeTalent(
  callback: (users: any[]) => void,
  onError?: (error: Error) => void
) {
  const database = needDb();
  // Public talent must be queryable without tripping private-profile rules, so
  // we filter to public, non-suspended taskers directly in the query.
  const q = query(
    collection(database, "users"),
    where("role", "==", "tasker"),
    where("isPrivate", "==", false),
    limit(200)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const talent = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item: any) => !item.suspended);
      callback(talent);
    },
    (error) => onError?.(error as Error)
  );
}
