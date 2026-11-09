import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

export interface SupportTicket {
  id?: string;
  ticketCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "client" | "tasker" | "visitor";
  category: string;
  taskId?: string;
  subject: string;
  description: string;
  priority: "normal" | "urgent";
  status: "open" | "investigating" | "resolved";
  adminResponse?: string;
  attachments?: { name: string; url: string }[];
  createdAt: any;
}

export async function createSupportTicket(
  ticket: Omit<SupportTicket, "id" | "ticketCode" | "status" | "createdAt">
): Promise<string> {
  const code = `PRW-${Math.floor(100000 + Math.random() * 900000)}`;

  if (db) {
    try {
      const docRef = await addDoc(collection(db, "support_tickets"), {
        ...ticket,
        ticketCode: code,
        status: "open",
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Fallback if permission or offline
    }
  }

  // Local storage persistence fallback
  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem("aventriq_support_tickets") || "[]");
    existing.unshift({
      ...ticket,
      id: code,
      ticketCode: code,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("aventriq_support_tickets", JSON.stringify(existing));
  }

  return code;
}

export function subscribeUserTickets(
  userId: string,
  cb: (tickets: SupportTicket[]) => void
): () => void {
  if (db) {
    try {
      const q = query(
        collection(db, "support_tickets"),
        where("userId", "==", userId)
      );
      return onSnapshot(
        q,
        (snap) => {
          const list: SupportTicket[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          cb(list);
        },
        () => {
          // If firestore permission error, fallback to localStorage
          cb(getLocalTickets(userId));
        }
      );
    } catch {
      // Fallback
    }
  }

  cb(getLocalTickets(userId));
  return () => {};
}

function getLocalTickets(userId: string): SupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem("aventriq_support_tickets") || "[]");
    return raw.filter((t: any) => t.userId === userId || !t.userId);
  } catch {
    return [];
  }
}
