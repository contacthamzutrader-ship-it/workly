import {
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  limit,
  onSnapshot,
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

export function subscribeNotifications(userId: string, callback: (items: AppNotification[]) => void) {
  const database = needDb();
  const q = query(collection(database, "notifications"), where("userId", "==", userId), limit(200));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AppNotification);
    items.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    callback(items);
  });
}
