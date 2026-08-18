import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

function needDb() {
  if (!db) throw new Error("Firebase not configured");
  return db;
}

export function subscribeTalent(
  callback: (users: Record<string, unknown>[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(needDb(), "public_profiles"),
    where("role", "==", "tasker"),
    where("discoverable", "==", true),
    limit(200)
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => onError?.(error as Error)
  );
}
