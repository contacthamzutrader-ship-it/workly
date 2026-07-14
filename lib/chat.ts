import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  setDoc,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { scanMessage } from "./fraud";
import { applyTrustPenalty } from "./trust";
import { notify } from "./notifications";

export interface Conversation {
  id?: string;
  taskId: string;
  participants: string[];
  posterId: string;
  taskerId: string;
  lastMessage: string;
  updatedAt: any;
  createdAt: any;
}

export interface Message {
  id?: string;
  convId: string;
  fromId: string;
  fromName: string;
  text: string;
  flagged?: boolean;
  flaggedReasons?: string[];
  createdAt: any;
}

function needDb() {
  if (!db) throw new Error("Firebase not configured");
  return db;
}

export async function getOrCreateConversation(
  taskId: string,
  posterId: string,
  taskerId: string
): Promise<string> {
  const database = needDb();
  const ref = doc(database, "conversations", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      taskId,
      participants: [posterId, taskerId],
      posterId,
      taskerId,
      lastMessage: "",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }
  return taskId;
}

export async function sendMessage(
  convId: string,
  fromId: string,
  fromName: string,
  text: string
): Promise<void> {
  const database = needDb();
  const scan = scanMessage(text);
  await addDoc(collection(database, "conversations", convId, "messages"), {
    convId,
    fromId,
    fromName,
    text,
    flagged: scan.flagged,
    flaggedReasons: scan.reasons,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(database, "conversations", convId), {
    lastMessage: text,
    updatedAt: serverTimestamp(),
  });

  // Fraud Detection: off-platform contact sharing lowers trust score.
  if (scan.flagged) {
    await applyTrustPenalty(fromId, -20);
  }

  // Notify the other participant.
  const conv = await getDoc(doc(database, "conversations", convId));
  if (conv.exists()) {
    const participants: string[] = conv.data().participants || [];
    const other = participants.find((p) => p !== fromId);
    if (other) {
      await notify({
        userId: other,
        type: scan.flagged ? "security" : "message",
        title: scan.flagged ? "Security alert" : "New message",
        body: scan.flagged
          ? "Off-platform contact sharing is not allowed."
          : `${fromName}: ${text.slice(0, 60)}`,
        link: `/messages/${convId}`,
      });
    }
  }
}

export function subscribeMessages(
  convId: string,
  cb: (msgs: Message[]) => void
) {
  const database = needDb();
  const q = query(
    collection(database, "conversations", convId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
  });
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const database = needDb();
  const snap = await getDocs(query(collection(database, "conversations"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Conversation)
    .filter((c) => c.participants.includes(userId))
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
}
