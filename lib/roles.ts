// Central role + capability model for Workly.
//
// There are exactly two things a member can choose for themselves:
//   - client      (posts work, hires, funds and releases)
//   - freelancer  (browses work, sends offers, delivers, gets paid)
//
// Everything above that is *staff* and can only ever be granted by the owner
// or by an admin who holds the `manageAdmins` permission. Staff status is
// never selectable during public signup and never settable from the browser
// by the account itself.

export const OWNER_EMAIL = "contact.hamzutrader@gmail.com";

/** Roles a member can hold and switch between on their own. */
export type MemberRole = "client" | "freelancer";

/** Staff roles, granted only through the admin permission system. */
export type StaffRole = "editor" | "moderator" | "admin" | "super_admin";

export type AnyRole = MemberRole | StaffRole;

export const MEMBER_ROLES: MemberRole[] = ["client", "freelancer"];
export const STAFF_ROLES: StaffRole[] = ["editor", "moderator", "admin", "super_admin"];

/**
 * Legacy documents used `customer` / `tasker`. Everything reads through this
 * so old accounts keep working without a migration script.
 */
export function normalizeRole(value: unknown): MemberRole {
  const raw = String(value || "").toLowerCase();
  if (raw === "freelancer" || raw === "tasker" || raw === "provider") return "freelancer";
  return "client";
}

/** Value written to Firestore. Kept as the legacy token for rule compatibility. */
export function toStoredRole(role: MemberRole): "customer" | "tasker" {
  return role === "freelancer" ? "tasker" : "customer";
}

export function isStaffRole(value: unknown): value is StaffRole {
  return STAFF_ROLES.includes(String(value) as StaffRole);
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  client: "Client",
  freelancer: "Freelancer",
};

export const MEMBER_ROLE_BLURB: Record<MemberRole, string> = {
  client: "Post work, compare offers, and pay only when you approve the result.",
  freelancer: "Find work that fits your skills, send offers, deliver, and get paid.",
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  editor: "Editor",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Owner",
};

export const STAFF_ROLE_BLURB: Record<StaffRole, string> = {
  editor: "Content, categories and marketplace copy. No money, no account powers.",
  moderator: "Reviews reported tasks, messages and profiles. Approves the task queue.",
  admin: "Operations lead: approvals, people, payments and disputes.",
  super_admin: "Full control of the platform, including who else gets access.",
};

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

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
  approveTasks: "Approve & reject tasks",
  manageUsers: "Manage member accounts",
  manageAdmins: "Add & remove staff",
  managePayments: "Payments, refunds & disputes",
  manageContent: "Content, categories & settings",
  viewAnalytics: "View analytics & reports",
};

export const PERMISSION_HINTS: Record<Permission, string> = {
  approveTasks: "Work the moderation queue and publish or reject posted tasks.",
  manageUsers: "Change member roles, suspend accounts and manage private providers.",
  manageAdmins: "Grant or revoke staff access. Give this only to people you trust fully.",
  managePayments: "See the money trail, resolve disputes and mark refunds.",
  manageContent: "Edit categories, platform settings and the approval mode.",
  viewAnalytics: "Read-only access to marketplace performance dashboards.",
};

/** Default permission bundle for each staff role. */
export const STAFF_ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  editor: ["manageContent", "viewAnalytics"],
  moderator: ["approveTasks", "manageContent", "viewAnalytics"],
  admin: ["approveTasks", "manageUsers", "managePayments", "manageContent", "viewAnalytics"],
  super_admin: [...ALL_PERMISSIONS],
};

export interface StaffSession {
  role: StaffRole;
  isOwner: boolean;
  permissions: Permission[];
}

export function ownerSession(): StaffSession {
  return { role: "super_admin", isOwner: true, permissions: [...ALL_PERMISSIONS] };
}

export function hasPermission(session: StaffSession | null | undefined, permission: Permission): boolean {
  if (!session) return false;
  if (session.isOwner || session.role === "super_admin") return true;
  return session.permissions.includes(permission);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === OWNER_EMAIL;
}

/**
 * Infer the closest staff role from a permission bundle, so an admin list can
 * show a readable title even for hand-tuned permission sets.
 */
export function staffRoleFromPermissions(permissions: Permission[]): StaffRole {
  if (permissions.includes("manageAdmins")) return "super_admin";
  if (permissions.includes("managePayments") || permissions.includes("manageUsers")) return "admin";
  if (permissions.includes("approveTasks")) return "moderator";
  return "editor";
}

// ---------------------------------------------------------------------------
// Member capabilities — what the UI is allowed to show
// ---------------------------------------------------------------------------

export interface Capabilities {
  canPostTask: boolean;
  canSendOffer: boolean;
  canBrowseTalent: boolean;
  canUseAdmin: boolean;
  canSwitchRole: boolean;
}

export function capabilitiesFor(role: MemberRole, staff: StaffSession | null): Capabilities {
  return {
    canPostTask: role === "client" || !!staff,
    canSendOffer: role === "freelancer",
    canBrowseTalent: true,
    canUseAdmin: !!staff,
    canSwitchRole: true,
  };
}
