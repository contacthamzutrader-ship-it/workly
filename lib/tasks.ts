import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { marketplaceAction } from "./marketplace-api";
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

export const ACTIVE_STATUSES: TaskStatus[] = ["open", "assigned", "in_progress", "submitted", "changes_requested"];

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
  return TASK_STAGES.findIndex((stage) => stage.key === status);
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

function timestampSeconds(value: any) {
  if (typeof value?.seconds === "number") return value.seconds;
  if (typeof value?.toMillis === "function") return Math.floor(value.toMillis() / 1000);
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
}

function byNewest<T extends { createdAt?: any }>(a: T, b: T) {
  return timestampSeconds(b.createdAt) - timestampSeconds(a.createdAt);
}

// ---------------------------------------------------------------------------
// Task reads + trusted server writes
// ---------------------------------------------------------------------------

export async function createTask(
  input: Omit<Task, "id" | "bidsCount" | "createdAt" | "assignedTo" | "assignedName">
): Promise<string> {
  if (!input.title.trim()) throw new Error("Give your task a clear title.");
  if (input.budget < MIN_BUDGET) throw new Error(`The minimum task budget is ${formatPKR(MIN_BUDGET)}.`);
  const result = await marketplaceAction<{ taskId: string }>("create_task", {
    title: input.title,
    description: input.description,
    category: input.category,
    skills: input.skills || [],
    budget: input.budget,
    location: input.location,
    remote: input.remote === true,
    urgency: input.urgency,
    deadline: input.deadline,
  });
  return result.taskId;
}

export async function updateTaskDetails(
  taskId: string,
  changes: Partial<Pick<Task, "title" | "description" | "category" | "budget" | "location" | "deadline" | "urgency" | "remote" | "skills">>
): Promise<void> {
  await marketplaceAction("update_task", { taskId, changes });
}

export async function getTask(id: string): Promise<Task | null> {
  const snapshot = await getDoc(doc(needDb(), "tasks", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Task) : null;
}

export function subscribeTask(id: string, callback: (task: Task | null) => void) {
  return onSnapshot(doc(needDb(), "tasks", id), (snapshot) => {
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
  if (filters.category && filters.category !== "all") result = result.filter((task) => task.category === filters.category);
  if (filters.remoteOnly) result = result.filter((task) => task.remote === true);
  if (typeof filters.minBudget === "number") result = result.filter((task) => task.budget >= filters.minBudget!);
  if (typeof filters.maxBudget === "number" && filters.maxBudget > 0) result = result.filter((task) => task.budget <= filters.maxBudget!);
  if (filters.location?.trim()) {
    const needle = filters.location.trim().toLowerCase();
    result = result.filter((task) => (task.location || "").toLowerCase().includes(needle));
  }
  if (filters.search?.trim()) {
    const needle = filters.search.trim().toLowerCase();
    result = result.filter(
      (task) => task.title.toLowerCase().includes(needle)
        || task.description.toLowerCase().includes(needle)
        || (task.location || "").toLowerCase().includes(needle)
        || (task.skills || []).some((skill) => skill.toLowerCase().includes(needle))
    );
  }
  switch (filters.sort) {
    case "budget_high": return result.sort((a, b) => b.budget - a.budget);
    case "budget_low": return result.sort((a, b) => a.budget - b.budget);
    case "fewest_offers": return result.sort((a, b) => (a.bidsCount || 0) - (b.bidsCount || 0));
    default: return result.sort(byNewest);
  }
}

export async function listPublicTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const snapshot = await getDocs(query(collection(needDb(), "tasks"), where("visibility", "==", "public"), limit(200)));
  const tasks = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as Task)
    .filter((task) => task.visibility === "public" && ACTIVE_STATUSES.includes(task.status));
  return filterAndSortTasks(tasks, filters);
}

export function subscribePublicTasks(filters: TaskFilters, callback: (tasks: Task[]) => void, onError?: (error: Error) => void) {
  const q = query(collection(needDb(), "tasks"), where("visibility", "==", "public"), limit(200));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as Task)
      .filter((task) => task.visibility === "public" && ACTIVE_STATUSES.includes(task.status));
    callback(filterAndSortTasks(tasks, filters));
  }, (error) => onError?.(error as Error));
}

export async function listTasksByPoster(posterId: string): Promise<Task[]> {
  const snapshot = await getDocs(query(collection(needDb(), "tasks"), where("posterId", "==", posterId), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribeTasksByPoster(posterId: string, callback: (tasks: Task[]) => void) {
  return onSnapshot(query(collection(needDb(), "tasks"), where("posterId", "==", posterId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)));
}

export async function listTasksForFreelancer(userId: string): Promise<Task[]> {
  const snapshot = await getDocs(query(collection(needDb(), "tasks"), where("assignedTo", "==", userId), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribeTasksForFreelancer(userId: string, callback: (tasks: Task[]) => void) {
  return onSnapshot(query(collection(needDb(), "tasks"), where("assignedTo", "==", userId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)));
}

export async function listPendingTasks(): Promise<Task[]> {
  const snapshot = await getDocs(query(collection(needDb(), "tasks"), where("status", "==", "pending"), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribePendingTasks(callback: (tasks: Task[]) => void, onError?: (error: Error) => void) {
  return onSnapshot(query(collection(needDb(), "tasks"), where("status", "==", "pending"), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)),
    (error) => onError?.(error as Error));
}

export async function listPrivateTasks(): Promise<Task[]> {
  const snapshot = await getDocs(query(collection(needDb(), "tasks"), where("visibility", "==", "private"), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest);
}

export function subscribePrivateTasks(callback: (tasks: Task[]) => void, onError?: (error: Error) => void) {
  return onSnapshot(query(collection(needDb(), "tasks"), where("visibility", "==", "private"), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)),
    (error) => onError?.(error as Error));
}

export function subscribeAllTasks(callback: (tasks: Task[]) => void, onError?: (error: Error) => void) {
  return onSnapshot(query(collection(needDb(), "tasks"), limit(500)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task).sort(byNewest)),
    (error) => onError?.(error as Error));
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
  if (!Number.isFinite(input.amount) || input.amount < MIN_OFFER) throw new Error(`Your offer must be at least ${formatPKR(MIN_OFFER)}.`);
  await marketplaceAction("place_bid", {
    taskId: input.taskId,
    amount: input.amount,
    message: input.message,
    deliveryDays: input.deliveryDays,
  });
}

export async function listBidsForTask(taskId: string): Promise<Bid[]> {
  const snapshot = await getDocs(query(collection(needDb(), "bids"), where("taskId", "==", taskId), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest);
}

export function subscribeBidsForTask(taskId: string, callback: (bids: Bid[]) => void) {
  return onSnapshot(query(collection(needDb(), "bids"), where("taskId", "==", taskId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest)));
}

export async function updateBid(bidId: string, amount: number, message: string, deliveryDays?: number): Promise<void> {
  if (!Number.isFinite(amount) || amount < MIN_OFFER) throw new Error(`Your offer must be at least ${formatPKR(MIN_OFFER)}.`);
  await marketplaceAction("update_bid", { bidId, amount, message, deliveryDays });
}

export async function withdrawBid(bidId: string): Promise<void> {
  await marketplaceAction("withdraw_bid", { bidId });
}

export async function listBidsByUser(bidderId: string): Promise<Bid[]> {
  const snapshot = await getDocs(query(collection(needDb(), "bids"), where("bidderId", "==", bidderId), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest);
}

export function subscribeBidsByUser(bidderId: string, callback: (bids: Bid[]) => void) {
  return onSnapshot(query(collection(needDb(), "bids"), where("bidderId", "==", bidderId), limit(200)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest)));
}

// ---------------------------------------------------------------------------
// Contract actions — all server-authorized and transactional
// ---------------------------------------------------------------------------

export async function selectBid(taskId: string, bidId: string, _bidderId?: string, _bidderName?: string, _amount?: number): Promise<void> {
  await marketplaceAction("select_bid", { taskId, bidId });
}

export async function startWork(taskId: string): Promise<void> {
  await marketplaceAction("start_work", { taskId });
}

export async function submitWork(taskId: string, summary: string): Promise<void> {
  await marketplaceAction("submit_work", { taskId, summary });
}

export async function requestChanges(taskId: string, note: string): Promise<void> {
  await marketplaceAction("request_changes", { taskId, note });
}

export async function approveAndPay(taskId: string): Promise<void> {
  await marketplaceAction("approve_delivery", { taskId });
}

export async function cancelTask(taskId: string, reason: string, _cancelledBy?: string): Promise<void> {
  await marketplaceAction("cancel_task", { taskId, reason });
}

export async function openDispute(input: {
  taskId: string;
  openedBy: string;
  openedByName: string;
  respondentId: string;
  reason: string;
}): Promise<void> {
  await marketplaceAction("open_dispute", { taskId: input.taskId, reason: input.reason });
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await marketplaceAction("set_task_status", { taskId, status });
}

export const requestPayment = (taskId: string) => submitWork(taskId, "Work completed and payment requested.");
export const releasePayment = approveAndPay;

// ---------------------------------------------------------------------------
// Moderation and private fulfilment
// ---------------------------------------------------------------------------

export async function approveTask(taskId: string, visibility: Visibility, _approvedBy?: string): Promise<string | undefined> {
  const result = await marketplaceAction<{ token: string | null }>("approve_task", { taskId, visibility });
  return result.token || undefined;
}

export async function rejectTask(taskId: string, reason: string, _rejectedBy?: string): Promise<void> {
  await marketplaceAction("reject_task", { taskId, reason });
}

export async function claimPrivateTask(taskId: string, token: string, _userId?: string): Promise<void> {
  await marketplaceAction("claim_private_task", { taskId, token });
}

export async function approvePrivateTask(input: {
  taskId: string;
  providerId: string;
  providerName: string;
  approvedBy: string;
}): Promise<void> {
  await marketplaceAction("approve_private_task", { taskId: input.taskId, providerId: input.providerId });
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
  if (input.rating < 1 || input.rating > 5) throw new Error("Choose a rating between 1 and 5 stars.");
  await marketplaceAction("add_review", { taskId: input.taskId, rating: input.rating, comment: input.comment });
}

export async function listReviewsForUser(toId: string): Promise<Review[]> {
  const snapshot = await getDocs(query(collection(needDb(), "reviews"), where("toId", "==", toId), limit(200)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Review).sort(byNewest);
}

export async function hasReviewed(taskId: string, fromId: string): Promise<boolean> {
  const deterministic = await getDoc(doc(needDb(), "reviews", `${taskId}_${fromId}`)).catch(() => null);
  if (deterministic?.exists()) return true;
  const snapshot = await getDocs(query(collection(needDb(), "reviews"), where("taskId", "==", taskId), where("fromId", "==", fromId), limit(1)));
  return !snapshot.empty;
}

// ---------------------------------------------------------------------------
// Saved tasks
// ---------------------------------------------------------------------------

export async function toggleSavedTask(userId: string, taskId: string, saved: boolean): Promise<void> {
  const reference = doc(needDb(), "users", userId, "saved_tasks", taskId);
  if (saved) await setDoc(reference, { taskId, savedAt: serverTimestamp(), removed: false });
  else await setDoc(reference, { taskId, savedAt: null, removed: true }, { merge: true });
}

export async function listSavedTaskIds(userId: string): Promise<string[]> {
  try {
    const snapshot = await getDocs(collection(needDb(), "users", userId, "saved_tasks"));
    return snapshot.docs.filter((item) => item.data().removed !== true).map((item) => item.id);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Wallet/talent reads
// ---------------------------------------------------------------------------

export interface WalletTx {
  id?: string;
  amount: number;
  type: "deposit" | "withdraw" | "release" | "payment" | "hold" | "refund";
  note: string;
  createdAt: unknown;
  taskId?: string;
  userId: string;
}

export function subscribeWalletTxs(userId: string, callback: (entries: WalletTx[]) => void, onError?: (error: Error) => void) {
  const database = needDb();
  try {
    const q = query(collection(database, "wallet_txs"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(80));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WalletTx)), () => {
      const fallback = query(collection(database, "wallet_txs"), where("userId", "==", userId), limit(200));
      return onSnapshot(fallback, (snapshot) => {
        const entries = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WalletTx)
          .sort((a, b) => timestampSeconds(b.createdAt) - timestampSeconds(a.createdAt));
        callback(entries);
      }, (error) => onError?.(error as Error));
    });
  } catch {
    const fallback = query(collection(database, "wallet_txs"), where("userId", "==", userId), limit(200));
    return onSnapshot(fallback, (snapshot) => {
      const entries = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WalletTx)
        .sort((a, b) => timestampSeconds(b.createdAt) - timestampSeconds(a.createdAt));
      callback(entries);
    }, (error) => onError?.(error as Error));
  }
}

export function subscribeTalent(callback: (users: any[]) => void, onError?: (error: Error) => void) {
  const q = query(collection(needDb(), "users"), where("role", "==", "tasker"), where("isPrivate", "==", false), limit(200));
  return onSnapshot(q, (snapshot) => {
    const talent = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item: any) => !item.suspended);
    callback(talent);
  }, (error) => onError?.(error as Error));
}
