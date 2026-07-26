import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  query,
  limit,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  ALL_PERMISSIONS,
  MEMBER_ROLE_LABELS,
  OWNER_EMAIL,
  PERMISSION_HINTS,
  PERMISSION_LABELS,
  STAFF_ROLE_BLURB,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_PERMISSIONS,
  STAFF_ROLES,
  hasPermission,
  isOwnerEmail,
  normalizeRole,
  ownerSession,
  staffRoleFromPermissions,
  toStoredRole,
  type MemberRole,
  type Permission,
  type StaffRole,
  type StaffSession,
} from "./roles";

export {
  ALL_PERMISSIONS,
  MEMBER_ROLE_LABELS,
  OWNER_EMAIL,
  PERMISSION_HINTS,
  PERMISSION_LABELS,
  STAFF_ROLE_BLURB,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_PERMISSIONS,
  STAFF_ROLES,
  hasPermission,
  isOwnerEmail,
  ownerSession,
  staffRoleFromPermissions,
};
export type { Permission, StaffRole, StaffSession };

/** Kept for older imports. */
export type AdminSession = StaffSession;

export interface AdminDoc {
  uid: string;
  email: string;
  name: string;
  staffRole: StaffRole;
  addedBy: string;
  permissions: Permission[];
  suspended?: boolean;
  createdAt: unknown;
  updatedAt?: unknown;
}

function needDb() {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

// ---------------------------------------------------------------------------
// Audit log — every privileged action leaves a trail.
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id?: string;
  actorId: string;
  actorEmail: string;
  action: string;
  target: string;
  detail?: string;
  createdAt: unknown;
}

export async function recordAudit(input: {
  actorId: string;
  actorEmail: string;
  action: string;
  target: string;
  detail?: string;
}): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, "audit_logs"), {
      ...input,
      detail: input.detail || "",
      createdAt: serverTimestamp(),
    });
  } catch {
    // An audit write must never block the action the operator was performing.
  }
}

export async function listAudit(max = 100): Promise<AuditEntry[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(max)));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AuditEntry);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Staff records
// ---------------------------------------------------------------------------

export async function getAdminDoc(uid: string): Promise<AdminDoc | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (!snap.exists()) return null;
    const data = snap.data() as AdminDoc;
    if (data.suspended) return null;
    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    return {
      ...data,
      permissions,
      staffRole: (data.staffRole && STAFF_ROLES.includes(data.staffRole)
        ? data.staffRole
        : staffRoleFromPermissions(permissions)) as StaffRole,
    };
  } catch {
    return null;
  }
}

export async function listAdmins(): Promise<AdminDoc[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "admins"), limit(200)));
  return snap.docs.map((item) => {
    const data = item.data() as AdminDoc;
    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    return {
      ...data,
      uid: item.id,
      permissions,
      staffRole: (data.staffRole && STAFF_ROLES.includes(data.staffRole)
        ? data.staffRole
        : staffRoleFromPermissions(permissions)) as StaffRole,
    };
  });
}

export async function addAdmin(input: {
  uid: string;
  email: string;
  name: string;
  addedBy: string;
  staffRole: StaffRole;
  permissions?: Permission[];
}): Promise<void> {
  const database = needDb();
  if (isOwnerEmail(input.email)) {
    throw new Error("The platform owner already has full access.");
  }
  if (input.staffRole === "super_admin") {
    throw new Error("There can only be one owner account.");
  }
  const permissions = (input.permissions?.length ? input.permissions : STAFF_ROLE_PERMISSIONS[input.staffRole])
    .filter((permission) => ALL_PERMISSIONS.includes(permission));
  await setDoc(doc(database, "admins", input.uid), {
    uid: input.uid,
    email: input.email.toLowerCase(),
    name: input.name,
    staffRole: input.staffRole,
    addedBy: input.addedBy,
    permissions,
    suspended: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAdmin(
  uid: string,
  changes: { staffRole?: StaffRole; permissions?: Permission[]; suspended?: boolean }
): Promise<void> {
  const database = needDb();
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (changes.staffRole) {
    if (changes.staffRole === "super_admin") throw new Error("There can only be one owner account.");
    payload.staffRole = changes.staffRole;
    if (!changes.permissions) payload.permissions = STAFF_ROLE_PERMISSIONS[changes.staffRole];
  }
  if (changes.permissions) {
    payload.permissions = changes.permissions.filter((permission) => ALL_PERMISSIONS.includes(permission));
  }
  if (typeof changes.suspended === "boolean") payload.suspended = changes.suspended;
  await updateDoc(doc(database, "admins", uid), payload);
}

/** Kept for older call sites. */
export async function updateAdminPermissions(uid: string, permissions: Permission[]): Promise<void> {
  await updateAdmin(uid, { permissions });
}

export async function removeAdmin(uid: string): Promise<void> {
  const database = needDb();
  await deleteDoc(doc(database, "admins", uid));
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export interface PlatformSettings {
  autoApprove: boolean;
  clientFeePercent: number;
  freelancerFeePercent: number;
  minTaskBudget: number;
  maintenanceMode: boolean;
  allowNewSignups: boolean;
  requireInterviewToBid: boolean;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  autoApprove: false,
  clientFeePercent: 0,
  freelancerFeePercent: 15,
  minTaskBudget: 500,
  maintenanceMode: false,
  allowNewSignups: true,
  requireInterviewToBid: false,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!db) return { ...DEFAULT_SETTINGS };
  try {
    const snap = await getDoc(doc(db, "settings", "platform"));
    if (!snap.exists()) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<PlatformSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function savePlatformSettings(changes: Partial<PlatformSettings>): Promise<void> {
  const database = needDb();
  await setDoc(doc(database, "settings", "platform"), changes, { merge: true });
}

export async function getAutoApprove(): Promise<boolean> {
  return (await getPlatformSettings()).autoApprove;
}

export async function setAutoApprove(value: boolean): Promise<void> {
  await savePlatformSettings({ autoApprove: value });
}

// ---------------------------------------------------------------------------
// Member administration
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<{ uid: string; name: string; email: string } | null> {
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()), limit(1))
  );
  if (snap.empty) return null;
  const found = snap.docs[0];
  const data = found.data();
  return { uid: found.id, name: data.name || "", email: data.email || email };
}

export async function setUserPrivateStatus(uid: string, isPrivate: boolean): Promise<void> {
  const database = needDb();
  await updateDoc(
    doc(database, "users", uid),
    isPrivate ? { isPrivate: true, isTasker: true, role: "tasker" } : { isPrivate: false }
  );
}

export async function setUserRole(uid: string, role: MemberRole): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "users", uid), {
    role: toStoredRole(role),
    isTasker: role === "freelancer",
    roleUpdatedAt: serverTimestamp(),
  });
}

/** Kept for older call sites that still pass the stored token. */
export async function setUserPublicRole(uid: string, role: "customer" | "tasker" | MemberRole): Promise<void> {
  await setUserRole(uid, normalizeRole(role));
}

export async function setUserSuspended(uid: string, suspended: boolean, reason = ""): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "users", uid), {
    suspended,
    suspendedReason: suspended ? reason : "",
    suspendedAt: suspended ? serverTimestamp() : null,
  });
}

export async function setUserVerified(uid: string, verified: boolean): Promise<void> {
  const database = needDb();
  await updateDoc(doc(database, "users", uid), { verified });
}
