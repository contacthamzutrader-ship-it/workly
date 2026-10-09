import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  uid?: string;
}

export async function submitContactMessage(input: ContactMessageInput): Promise<string> {
  if (!db) throw new Error("Database is not available right now.");
  const docRef = await addDoc(collection(db, "contact_messages"), {
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject,
    message: input.message.trim(),
    uid: input.uid || null,
    createdAt: serverTimestamp(),
    status: "new",
  });
  return docRef.id;
}