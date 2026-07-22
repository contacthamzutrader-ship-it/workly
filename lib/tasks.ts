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
  const taskSnap = await getDoc(doc(database, "tasks", input.taskId));
  if (!taskSnap.exists()) throw new Error("This task is no longer available.");
  const task = taskSnap.data() as Task;
  if (task.status !== "open") throw new Error("This task is not accepting offers.");
  if (task.visibility !== "public") throw new Error("Private tasks are assigned by the Workly team.");
  if (task.posterId === input.bidderId) throw new Error("You cannot bid on your own task.");
  const existing = await getDocs(query(
    collection(database, "bids"),
    where("taskId", "==", input.taskId),
    where("bidderId", "==", input.bidderId),
    limit(1)
  ));
  if (!existing.empty) {
    throw new Error("You have already submitted an offer for this task.");
  }
  await addDoc(collection(database, "bids"), {
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "tasks", input.taskId), {
    bidsCount: increment(1),
  });
  if (taskSnap.exists()) {
    const posterId = taskSnap.data().posterId;
    if (posterId && posterId !== input.bidderId) {
      await notify({
        userId: posterId,
        type: "bid",
        title: "New bid on your task",
        body: `${input.bidderName} offered PKR ${input.amount.toLocaleString("en-PK")}`,
        link: `/tasks/${input.taskId}`,
      });
    }
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

export function subscribeBidsForTask(taskId: string, callback: (bids: Bid[]) => void) {
  const database = needDb();
  const q = query(collection(database, "bids"), where("taskId", "==", taskId), limit(200));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Bid).sort(byNewest));
  });
}

export async function updateBid(bidId: string, amount: number, message: string): Promise<void> {
  const database = needDb();
  if (!Number.isFinite(amount) || amount < 500) throw new Error("Offer must be at least PKR 500.");
  await updateDoc(doc(database, "bids", bidId), { amount, message: message.trim(), updatedAt: serverTimestamp() });
}

export async function withdrawBid(bidId: string): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "bids", bidId), { status: "withdrawn", withdrawnAt: serverTimestamp() });
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
    if (task.visibility !== "public") throw new Error("Private tasks are assigned by the Workly team.");

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
  const amount = data.heldAmount || 0;
  const fee = Math.round(amount * PLATFORM_FEE);
  const taskerGets = amount - fee;

  await runTransaction(database, async (transaction) => {
    transaction.update(doc(database, "tasks", taskId), {
      paymentReleased: true,
      paidAt: serverTimestamp(),
      status: "completed",
    });
  });

  await Promise.all([
    addDoc(collection(database, "wallet_txs"), {
      userId: data.assignedTo,
      amount: taskerGets,
      type: "release",
      note: `Payment for task (${snap.data()?.title || taskId}) - ${fee} platform fee`,
      createdAt: new Date().toISOString(),
      taskId,
    }),
    addDoc(collection(database, "wallet_txs"), {
      userId: data.posterId,
      amount,
      type: "payment",
      note: `Payment released for ${snap.data()?.title || taskId}`,
      createdAt: new Date().toISOString(),
      taskId,
    }),
  ]);

  await notify({
    userId: data.assignedTo,
    type: "payment_released",
    title: "Payment released",
    body: `PKR ${taskerGets.toLocaleString("en-PK")} has been added to your wallet.`,
    link: `/wallet`,
  });
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), { status });
}

export async function approveTask(
  taskId: string,
  visibility: Visibility,
  approvedBy?: string
): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), {
    status: "open",
    visibility,
    approvalMode: "manual",
    approvedAt: serverTimestamp(),
    approvedBy: approvedBy || "Workly team",
    approvalNote: visibility === "public" ? "Approved for the public marketplace" : "Approved for managed fulfilment",
  });
  const snap = await getDoc(doc(database, "tasks", taskId));
  if (snap.exists()) {
    await notify({
      userId: snap.data().posterId,
      type: "task_approved",
      title: visibility === "public" ? "Your task is live" : "Your task is approved",
      body: visibility === "public" ? "Professionals can now send offers." : "Workly is assigning a managed provider.",
      link: `/tasks/${taskId}`,
    });
  }
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
      bidsCount: 1,
      heldAmount: taskData.budget,
      heldAt: serverTimestamp(),
      paymentRequested: false,
      paymentReleased: false,
      approvedAt: serverTimestamp(),
      approvedBy: input.approvedBy,
      approvalNote: "Privately approved and assigned to a Workly managed provider",
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
  await addDoc(collection(database, "reviews"), {
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
