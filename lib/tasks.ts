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
} from "firebase/firestore";
import { db } from "./firebase";
import { recalcTrust } from "./trust";
import { notify } from "./notifications";

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
}

export interface Bid {
  id?: string;
  taskId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  message: string;
  status: "pending" | "selected";
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

export async function listPublicTasks(
  category?: string,
  search?: string
): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), limit(100)));
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
  const snap = await getDocs(query(collection(database, "tasks"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .filter((t) => t.posterId === posterId)
    .sort(byNewest);
}

export async function listPendingTasks(): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .filter((t) => t.status === "pending")
    .sort(byNewest);
}

export async function listPrivateTasks(): Promise<Task[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "tasks"), limit(200)));
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
  await addDoc(collection(database, "bids"), {
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "tasks", input.taskId), {
    bidsCount: increment(1),
  });
  const t = await getDoc(doc(database, "tasks", input.taskId));
  if (t.exists()) {
    const posterId = t.data().posterId;
    if (posterId && posterId !== input.bidderId) {
      await notify({
        userId: posterId,
        type: "bid",
        title: "New bid on your task",
        body: `${input.bidderName} bid $${input.amount}`,
        link: `/tasks/${input.taskId}`,
      });
    }
  }
}

export async function listBidsForTask(taskId: string): Promise<Bid[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "bids"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Bid)
    .filter((b) => b.taskId === taskId)
    .sort(byNewest);
}

export async function listBidsByUser(bidderId: string): Promise<Bid[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "bids"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Bid)
    .filter((b) => b.bidderId === bidderId)
    .sort(byNewest);
}

export async function selectBid(
  taskId: string,
  bidId: string,
  bidderId: string,
  bidderName: string
): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), {
    status: "assigned",
    assignedTo: bidderId,
    assignedName: bidderName,
  });
  await updateDoc(doc(database, "bids", bidId), { status: "selected" });
  await notify({
    userId: bidderId,
    type: "selected",
    title: "Bid selected",
    body: `Your bid was selected — task assigned to you.`,
    link: `/tasks/${taskId}`,
  });
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), { status });
}

export async function approveTask(
  taskId: string,
  visibility: Visibility
): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "tasks", taskId), {
    status: "open",
    visibility,
  });
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
  await recalcTrust(input.toId);
}

export async function listReviewsForUser(toId: string): Promise<Review[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "reviews"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Review)
    .filter((r) => r.toId === toId)
    .sort(byNewest);
}
