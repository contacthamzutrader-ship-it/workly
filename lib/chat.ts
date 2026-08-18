import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { marketplaceAction } from "./marketplace-api";

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
  _posterId?: string,
  _taskerId?: string
): Promise<string> {
  const result = await marketplaceAction<{ conversationId: string }>("create_conversation", { taskId });
  return result.conversationId;
}

export async function sendMessage(
  convId: string,
  _fromId: string,
  _fromName: string,
  text: string
): Promise<void> {
  await marketplaceAction("send_message", { convId, text });
}

export function subscribeMessages(convId: string, cb: (msgs: Message[]) => void) {
  const q = query(
    collection(needDb(), "conversations", convId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)));
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const snap = await getDocs(query(collection(needDb(), "conversations"), where("participants", "array-contains", userId), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Conversation)
    .filter((c) => c.participants.includes(userId))
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
}

export function subscribeConversations(userId: string, callback: (items: Conversation[]) => void) {
  const q = query(collection(needDb(), "conversations"), where("participants", "array-contains", userId), limit(200));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Conversation);
    items.sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
    callback(items);
  });
}
