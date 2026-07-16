import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Role } from "./auth-context";

// The platform OWNER. This email is ALWAYS super_admin, regardless of
// Firestore state. This makes admin access deterministic and never flaky.
export const OWNER_EMAIL = "contact.hamzutrader@gmail.com";

export type Permission =
  | "approveTasks"
  | "manageUsers"
  | "manageAdmins"
  | "managePayments"
  | "manageContent"
  | "viewAnalytics";

export const ALL_PERMISSIONS: Permission[] = [
  "approveTasks",
  "manageUsers",
  "manageAdmins",
  "managePayments",
  "manageContent",
  "viewAnalytics",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  approveTasks: "Approve / reject tasks",
  manageUsers: "Manage users",
  manageAdmins: "Add / remove admins",
  managePayments: "Manage payments & disputes",
  manageContent: "Manage content & categories",
  viewAnalytics: "View analytics",
};

export interface AdminDoc {
  uid: string;
  email: string;
  name: string;
  addedBy: string;
  permissions: Permission[];
  createdAt: any;
}

export interface AdminSession {
  role: Role;
  isOwner: boolean;
  permissions: Permission[];
}

// Owner always has every permission.
export function ownerSession(): AdminSession {
  return { role: "super_admin", isOwner: true, permissions: [...ALL_PERMISSIONS] };
}

export function hasPermission(session: AdminSession | null, perm: Permission): boolean {
  if (!session) return false;
  if (session.isOwner) return true;
  return session.permissions.includes(perm);
}

export async function getAdminDoc(uid: string): Promise<AdminDoc | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists() ? (snap.data() as AdminDoc) : null;
}

export async function listAdmins(): Promise<AdminDoc[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "admins"), limit(100)));
  return snap.docs.map((d) => d.data() as AdminDoc);
}

export async function addAdmin(input: {
  uid: string;
  email: string;
  name: string;
  addedBy: string;
  permissions: Permission[];
}): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, "admins", input.uid), {
    uid: input.uid,
    email: input.email,
    name: input.name,
    addedBy: input.addedBy,
    permissions: input.permissions,
    createdAt: new Date().toISOString(),
  });
}

export async function updateAdminPermissions(uid: string, permissions: Permission[]): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, "admins", uid), { permissions });
}

export async function removeAdmin(uid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "admins", uid));
}

// Global platform setting: when true, new tasks are auto-approved (public)
// instead of waiting in the manual queue. Admin-controlled only.
export async function getAutoApprove(): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, "settings", "platform"));
  return snap.exists() ? !!snap.data().autoApprove : false;
}

export async function setAutoApprove(value: boolean): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, "settings", "platform"), { autoApprove: value }, { merge: true });
}
