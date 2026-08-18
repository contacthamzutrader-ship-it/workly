import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  limit,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { adminAction } from "./admin-api";
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
// Audit log reads + supplemental client audit notes.
// Critical mutations also write an audit entry in their server transaction.
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
    // Critical server actions already include their transaction-bound audit.
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
  if (isOwnerEmail(input.email)) throw new Error("The platform owner already has full access.");
  if (input.staffRole === "super_admin") throw new Error("There can only be one owner account.");
  await adminAction("add_admin", {
    uid: input.uid,
    staffRole: input.staffRole,
    permissions: input.permissions,
  });
}

export async function updateAdmin(
  uid: string,
  changes: { staffRole?: StaffRole; permissions?: Permission[]; suspended?: boolean }
): Promise<void> {
  if (changes.staffRole === "super_admin") throw new Error("There can only be one owner account.");
  await adminAction("update_admin", { uid, changes });
}

export async function updateAdminPermissions(uid: string, permissions: Permission[]): Promise<void> {
  await updateAdmin(uid, { permissions });
}

export async function removeAdmin(uid: string): Promise<void> {
  await adminAction("remove_admin", { uid });
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
  await adminAction("save_settings", { changes });
}

export async function getAutoApprove(): Promise<boolean> {
  return (await getPlatformSettings()).autoApprove;
}

export async function setAutoApprove(value: boolean): Promise<void> {
  await savePlatformSettings({ autoApprove: value });
}

export function subscribePlatformSettings(
  callback: (settings: PlatformSettings) => void,
  onError?: (error: Error) => void
) {
  if (!db) {
    callback({ ...DEFAULT_SETTINGS });
    return () => {};
  }
  return onSnapshot(
    doc(db, "settings", "platform"),
    (snap) => {
      if (snap.exists()) callback({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<PlatformSettings>) });
      else callback({ ...DEFAULT_SETTINGS });
    },
    (err) => onError?.(err as Error)
  );
}

// ---------------------------------------------------------------------------
// Member administration
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<{ uid: string; name: string; email: string } | null> {
  if (!db) return null;
  const snap = await getDocs(query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()), limit(1)));
  if (snap.empty) return null;
  const found = snap.docs[0];
  const data = found.data();
  return { uid: found.id, name: data.name || "", email: data.email || email };
}

export async function setUserPrivateStatus(uid: string, isPrivate: boolean): Promise<void> {
  await adminAction("set_user_private", { uid, isPrivate });
}

export async function setUserRole(uid: string, role: MemberRole): Promise<void> {
  await adminAction("set_user_role", { uid, role });
}

/** Kept for older call sites that still pass the stored token. */
export async function setUserPublicRole(uid: string, role: "customer" | "tasker" | MemberRole): Promise<void> {
  await setUserRole(uid, normalizeRole(role));
}

export async function setUserSuspended(uid: string, suspended: boolean, reason = ""): Promise<void> {
  await adminAction("set_user_suspended", { uid, suspended, reason });
}

export async function setUserVerified(uid: string, verified: boolean): Promise<void> {
  await adminAction("set_user_verified", { uid, verified });
}

export async function resolveDispute(disputeId: string, note = ""): Promise<void> {
  await adminAction("resolve_dispute", { disputeId, note });
}

export async function reviewInterviewDecision(uid: string, decision: "verified" | "needs_improvement"): Promise<void> {
  await adminAction("review_interview", { uid, decision });
}

export async function syncAllPublicProfiles(): Promise<number> {
  const result = await adminAction<{ synced: number }>("sync_public_profiles");
  return result.synced;
}
