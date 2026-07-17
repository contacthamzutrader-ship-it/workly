import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

export interface AppNotification {
  id?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: any;
}

function needDb() {
  if (!db) throw new Error("Firebase not configured");
  return db;
}

export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  const database = needDb();
  await addDoc(collection(database, "notifications"), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "notifications"), where("userId", "==", userId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as AppNotification)
    .filter((n) => n.userId === userId)
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}
