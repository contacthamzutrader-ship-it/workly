import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// Accounts and roles
// ---------------------------------------------------------------------------

test("public signup offers only the two member roles", async () => {
  const roles = await read("lib/roles.ts");
  const signup = await read("app/(auth)/signup/page.tsx");
  assert.match(roles, /export type MemberRole = "client" \| "freelancer"/);
  assert.match(signup, /Hire for tasks/);
  assert.match(signup, /Work and earn/);
  // No staff role may be selectable from the public signup screen.
  assert.doesNotMatch(signup, /super_admin|company_admin|"moderator"|"admin"/);
  assert.match(signup, /Staff and admin access is never granted at signup/);
});

test("legacy customer/tasker documents still resolve to a member role", async () => {
  const roles = await read("lib/roles.ts");
  assert.match(roles, /raw === "freelancer" \|\| raw === "tasker"/);
  assert.match(roles, /export function toStoredRole/);
});

test("members can switch between client and freelancer on one account", async () => {
  const auth = await read("lib/auth-context.tsx");
  const navbar = await read("components/Navbar.tsx");
  const settings = await read("app/settings/page.tsx");
  assert.match(auth, /switchRole: \(role: MemberRole\) => Promise<void>/);
  assert.match(navbar, /Using Workly as/);
  assert.match(settings, /How you use Workly/);
});

test("new accounts are routed through onboarding", async () => {
  const signup = await read("app/(auth)/signup/page.tsx");
  const login = await read("app/(auth)/login/page.tsx");
  const onboarding = await read("app/onboarding/page.tsx");
  assert.match(signup, /router\.push\("\/onboarding"\)/);
  assert.match(login, /isNewUser \? "\/onboarding"/);
  assert.match(onboarding, /onboarded: true/);
});

test("password reset and email verification are reachable", async () => {
  const auth = await read("lib/auth-context.tsx");
  const login = await read("app/(auth)/login/page.tsx");
  const forgot = await read("app/(auth)/forgot-password/page.tsx");
  assert.match(auth, /sendPasswordResetEmail/);
  assert.match(auth, /sendEmailVerification/);
  assert.match(login, /\/forgot-password/);
  assert.match(forgot, /Send reset link/);
});

// ---------------------------------------------------------------------------
// Owner and staff
// ---------------------------------------------------------------------------

test("the platform owner is fixed and always has every permission", async () => {
  const roles = await read("lib/roles.ts");
  const rules = await read("firestore.rules");
  assert.match(roles, /export const OWNER_EMAIL = "contact\.hamzutrader@gmail\.com"/);
  assert.match(roles, /if \(session\.isOwner \|\| session\.role === "super_admin"\) return true/);
  assert.match(rules, /request\.auth\.token\.email == 'contact\.hamzutrader@gmail\.com'/);
});

test("owner can appoint editors, moderators and admins with granular permissions", async () => {
  const roles = await read("lib/roles.ts");
  const admin = await read("app/admin/page.tsx");
  assert.match(roles, /STAFF_ROLE_PERMISSIONS/);
  assert.match(roles, /editor: \["manageContent", "viewAnalytics"\]/);
  assert.match(roles, /moderator: \["approveTasks", "manageContent", "viewAnalytics"\]/);
  assert.match(admin, /ASSIGNABLE_STAFF_ROLES/);
  assert.match(admin, /Fine-tune permissions/);
  assert.match(admin, /Invite staff/);
});

test("a second owner cannot be created and staff need an existing account", async () => {
  const adminLib = await read("lib/admin.ts");
  assert.match(adminLib, /There can only be one owner account/);
  assert.match(adminLib, /The platform owner already has full access/);
});

test("privileged actions are written to an append-only audit log", async () => {
  const adminLib = await read("lib/admin.ts");
  const admin = await read("app/admin/page.tsx");
  const rules = await read("firestore.rules");
  assert.match(adminLib, /export async function recordAudit/);
  assert.match(admin, /action: "staff\.add"/);
  assert.match(admin, /action: "user\.suspend"/);
  assert.match(rules, /match \/audit_logs\/\{entryId\}/);
  assert.match(rules, /allow update, delete: if false/);
});

test("admin surface is permission-gated tab by tab", async () => {
  const admin = await read("app/admin/page.tsx");
  assert.match(admin, /permission: "manageAdmins"/);
  assert.match(admin, /permission: "managePayments"/);
  assert.match(admin, /\.filter\(\(item\) => item\.permission === null \|\| can\(item\.permission\)\)/);
});

// ---------------------------------------------------------------------------
// Marketplace workflow
// ---------------------------------------------------------------------------

test("the task lifecycle covers delivery, revisions and disputes", async () => {
  const tasks = await read("lib/tasks.ts");
  assert.match(tasks, /"submitted"/);
  assert.match(tasks, /"changes_requested"/);
  assert.match(tasks, /"disputed"/);
  assert.match(tasks, /export async function submitWork/);
  assert.match(tasks, /export async function requestChanges/);
  assert.match(tasks, /export async function approveAndPay/);
  assert.match(tasks, /export async function cancelTask/);
  assert.match(tasks, /export async function openDispute/);
});

test("cancelling a funded task returns the held amount to the client", async () => {
  const tasks = await read("lib/tasks.ts");
  assert.match(tasks, /type: "refund"/);
  assert.match(tasks, /A paid task cannot be cancelled\. Open a dispute instead\./);
});

test("hiring one freelancer closes every other offer", async () => {
  const tasks = await read("lib/tasks.ts");
  assert.match(tasks, /status: "rejected", updatedAt: serverTimestamp\(\)/);
  assert.match(tasks, /Another freelancer was hired/);
});

test("both sides of a contract can review each other", async () => {
  const tasks = await read("lib/tasks.ts");
  const detail = await read("app/tasks/[id]/page.tsx");
  assert.match(tasks, /fromRole\?: "client" \| "freelancer"/);
  assert.match(tasks, /export async function hasReviewed/);
  assert.match(detail, /canLeaveReview/);
  assert.match(detail, /isPoster \? task\.assignedTo : task\.posterId/);
});

test("posting and bidding stay role-gated", async () => {
  const post = await read("app/post/page.tsx");
  const detail = await read("app/tasks/[id]/page.tsx");
  const roles = await read("lib/roles.ts");
  assert.match(post, /capabilities\.canPostTask/);
  assert.match(detail, /role === "freelancer" && task\.status === "open"/);
  assert.match(roles, /canPostTask: role === "client" \|\| !!staff/);
  assert.match(roles, /canSendOffer: role === "freelancer"/);
});

test("freelancers see their exact take-home before sending an offer", async () => {
  const detail = await read("app/tasks/[id]/page.tsx");
  assert.match(detail, /Workly service fee/);
  assert.match(detail, /You receive/);
});

test("real-time marketplace listeners are present", async () => {
  const tasks = await read("lib/tasks.ts");
  const chat = await read("lib/chat.ts");
  const notifications = await read("lib/notifications.ts");
  assert.match(tasks, /export function subscribeTask/);
  assert.match(tasks, /export function subscribeTasksByPoster/);
  assert.match(tasks, /export function subscribeTasksForFreelancer/);
  assert.match(tasks, /export function subscribeBidsByUser/);
  assert.match(chat, /export function subscribeMessages/);
  assert.match(chat, /export function subscribeConversations/);
  assert.match(notifications, /export function subscribeNotifications/);
});

test("browse pages support real filtering and sorting", async () => {
  const tasksLib = await read("lib/tasks.ts");
  const browse = await read("app/tasks/page.tsx");
  const talent = await read("app/talent/page.tsx");
  assert.match(tasksLib, /export interface TaskFilters/);
  assert.match(tasksLib, /case "budget_high"/);
  assert.match(browse, /remoteOnly/);
  assert.match(talent, /Verified only/);
});

// ---------------------------------------------------------------------------
// Money honesty
// ---------------------------------------------------------------------------

test("no fake wallet top-ups exist and the payment status is stated plainly", async () => {
  const wallet = await read("app/wallet/page.tsx");
  assert.doesNotMatch(wallet, /function addFunds|const addFunds|demo wallet/i);
  assert.match(wallet, /Live payment onboarding is still in progress/);
  assert.match(wallet, /Balances are never editable in the\s+browser/);
  assert.match(wallet, /State Bank of\s+Pakistan-regulated provider/);
});

test("the public explainer does not overclaim escrow", async () => {
  const howItWorks = await read("app/how-it-works/page.tsx");
  assert.match(howItWorks, /Honest status of live payments/);
  assert.match(howItWorks, /rather tell you this plainly/);
});

// ---------------------------------------------------------------------------
// Security rules
// ---------------------------------------------------------------------------

test("security rules protect privileged collections and self-escalation", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /function publicRole\(role\)/);
  assert.match(rules, /return role in \['customer', 'tasker'\]/);
  assert.match(rules, /match \/admins\/\{uid\}/);
  assert.match(rules, /hasPermission\('manageAdmins'\)/);
  assert.match(rules, /match \/wallet_txs\/\{transactionId\}/);
  // A member may not verify themselves, lift their own suspension or edit trust.
  assert.match(rules, /get\('verified', false\) == resource\.data\.get\('verified', false\)/);
  assert.match(rules, /get\('suspended', false\) == resource\.data\.get\('suspended', false\)/);
  assert.match(rules, /get\('trustScore', -1\) == resource\.data\.get\('trustScore', -1\)/);
});

test("private task invitations remain single-claim", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /match \/task_invites\/\{taskId\}/);
  assert.match(rules, /request\.resource\.data\.token == task\(taskId\)\.shareToken/);
  assert.match(rules, /allow update: if false/);
});

test("profiles use durable image storage with upload restrictions", async () => {
  const profile = await read("app/profile/page.tsx");
  const storageRules = await read("storage.rules");
  assert.match(profile, /profile-images\/\$\{user\.uid\}\/avatar/);
  assert.match(profile, /5 \* 1024 \* 1024/);
  assert.match(profile, /compactProfileImage/);
  assert.match(storageRules, /request\.auth\.uid == uid/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
});

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

test("freelancer interviews are authenticated, private, and human-reviewed", async () => {
  const route = await read("app/api/interview/route.ts");
  const engine = await read("lib/interview-engine.ts");
  const rules = await read("firestore.rules");
  const admin = await read("app/admin/page.tsx");
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /update\.status = "awaiting_review"/);
  assert.match(engine, /Never infer emotion or personality/);
  assert.match(rules, /match \/interviews\/\{uid\}/);
  assert.match(admin, /Approve badge/);
  assert.match(admin, /status !== "awaiting_review"/);
  assert.match(admin, /reviewInterview\(record, "verified"/);
});

// ---------------------------------------------------------------------------
// UI system
// ---------------------------------------------------------------------------

test("a shared design system backs the redesigned pages", async () => {
  const button = await read("components/ui/Button.tsx");
  const feedback = await read("components/ui/Feedback.tsx");
  const badge = await read("components/ui/Badge.tsx");
  assert.match(button, /loading\?: boolean/);
  assert.match(feedback, /export function EmptyState/);
  assert.match(feedback, /export function PageLoader/);
  assert.match(badge, /export function StatusBadge/);
});

test("navigation adapts to the signed-in role", async () => {
  const navbar = await read("components/Navbar.tsx");
  assert.match(navbar, /role === "freelancer"/);
  assert.match(navbar, /Find work/);
  assert.match(navbar, /Browse talent/);
  assert.match(navbar, /capabilities\.canPostTask/);
});

test("brand mark is used consistently", async () => {
  const layout = await read("app/layout.tsx");
  const brand = await read("components/BrandLogo.tsx");
  assert.match(layout, /workly-mark\.png/);
  assert.match(brand, /src="\/workly-mark\.png"/);
});

test("every primary route exists", async () => {
  const routes = [
    "app/page.tsx",
    "app/(auth)/login/page.tsx",
    "app/(auth)/signup/page.tsx",
    "app/(auth)/forgot-password/page.tsx",
    "app/onboarding/page.tsx",
    "app/dashboard/page.tsx",
    "app/tasks/page.tsx",
    "app/tasks/[id]/page.tsx",
    "app/talent/page.tsx",
    "app/post/page.tsx",
    "app/profile/page.tsx",
    "app/settings/page.tsx",
    "app/wallet/page.tsx",
    "app/messages/page.tsx",
    "app/messages/[id]/page.tsx",
    "app/notifications/page.tsx",
    "app/how-it-works/page.tsx",
    "app/support/page.tsx",
    "app/admin/page.tsx",
    "app/u/[id]/page.tsx",
  ];
  for (const route of routes) {
    const contents = await read(route);
    assert.ok(contents.length > 200, `${route} should be a real page`);
  }
});
