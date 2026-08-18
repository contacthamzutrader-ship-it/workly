import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// Accounts and roles
// ---------------------------------------------------------------------------

test("public signup exposes member roles only", async () => {
  const roles = await read("lib/roles.ts");
  const signup = await read("app/(auth)/signup/page.tsx");
  assert.match(roles, /export type MemberRole = "client" \| "freelancer"/);
  assert.match(signup, /Hire for tasks/);
  assert.match(signup, /Work and earn/);
  assert.doesNotMatch(signup, /company_admin|"moderator"|"admin"/);
  assert.match(signup, /Staff and admin access is never granted at signup/);
});

test("new and incomplete accounts are routed through onboarding", async () => {
  const signup = await read("app/(auth)/signup/page.tsx");
  const login = await read("app/(auth)/login/page.tsx");
  const onboarding = await read("app/onboarding/page.tsx");
  assert.match(signup, /router\.push\("\/onboarding"\)/);
  assert.match(login, /onboarded \? redirect : "\/onboarding"/);
  assert.match(onboarding, /onboarded: true/);
  assert.doesNotMatch(onboarding, /Skip for now/);
});

test("member capabilities require a ready profile", async () => {
  const auth = await read("lib/auth-context.tsx");
  assert.match(auth, /function profileReadyForRole/);
  assert.match(auth, /canPostTask: base\.canPostTask && ready/);
  assert.match(auth, /canSendOffer: base\.canSendOffer && ready/);
});

// ---------------------------------------------------------------------------
// Server-authorized marketplace
// ---------------------------------------------------------------------------

test("marketplace writes use an authenticated server boundary", async () => {
  const client = await read("lib/marketplace-api.ts");
  const route = await read("app/api/marketplace/route.ts");
  const tasks = await read("lib/tasks.ts");
  assert.match(client, /Authorization: `Bearer \$\{token\}`/);
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /db\.runTransaction/);
  assert.match(tasks, /marketplaceAction\("create_task"/);
  assert.match(tasks, /marketplaceAction\("select_bid"/);
  assert.match(tasks, /marketplaceAction\("approve_delivery"/);
  assert.doesNotMatch(tasks, /runTransaction/);
  assert.doesNotMatch(tasks, /increment\(/);
});

test("server derives offer identity and selected amount from authoritative records", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /bidderId: actor\.uid/);
  assert.match(route, /bidderName: actor\.name/);
  assert.match(route, /const amount = finiteNumber\(bid\.amount/);
  assert.match(route, /if \(bid\.taskId !== taskId \|\| bid\.status !== "pending"\)/);
});

test("one deterministic offer exists per task and freelancer", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /doc\(`\$\{taskId\}_\$\{actor\.uid\}`\)/);
  assert.match(route, /existingBid\.exists/);
});

test("hiring closes competing offers transactionally", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /where\("taskId", "==", taskId\)\.where\("status", "==", "pending"\)/);
  assert.match(route, /offer\.id === bidId \? "selected" : "rejected"/);
  assert.match(route, /hold_\$\{taskId\}/);
});

test("delivery approval is idempotent and server-ledgered", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /if \(task\.paymentReleased === true\) return/);
  assert.match(route, /release_\$\{taskId\}/);
  assert.match(route, /payment_\$\{taskId\}/);
  assert.match(route, /status: "completed", paymentReleased: true/);
});

test("cancellation reads live state inside its transaction and writes deterministic refund", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /case "cancel_task"/);
  assert.match(route, /const snap = await transaction\.get\(ref\)/);
  assert.match(route, /refund_\$\{taskId\}/);
  assert.match(route, /task\.paymentReleased === true/);
});

test("disputes are one-per-contract and identify the counterparty on the server", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /const disputeRef = db\.collection\("disputes"\)\.doc\(taskId\)/);
  assert.match(route, /already has an active dispute/);
  assert.match(route, /respondent = actor\.uid === task\.posterId/);
});

// ---------------------------------------------------------------------------
// Chat, notifications and reviews
// ---------------------------------------------------------------------------

test("chat creation and messages are server-authored from contract participants", async () => {
  const chat = await read("lib/chat.ts");
  const route = await read("app/api/marketplace/route.ts");
  assert.match(chat, /marketplaceAction<\{ conversationId: string \}>\("create_conversation"/);
  assert.match(chat, /marketplaceAction\("send_message"/);
  assert.doesNotMatch(chat, /addDoc|updateDoc|setDoc/);
  assert.match(route, /participants = \[String\(task\.posterId/);
  assert.match(route, /fromId: actor\.uid, fromName: actor\.name/);
  assert.match(route, /scanMessage\(text\)/);
});

test("reviews require a completed paid contract and use deterministic IDs", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /task\.status !== "completed" \|\| task\.paymentReleased !== true/);
  assert.match(route, /doc\(`\$\{taskId\}_\$\{actor\.uid\}`\)/);
  assert.match(route, /toId = isClient \? String\(task\.assignedTo/);
  assert.match(route, /integer\(body\.rating, "Rating", 1, 5\)/);
});

test("reputation recalculation uses trusted reviews instead of client-written score", async () => {
  const trust = await read("app/api/trust/recalculate/route.ts");
  const client = await read("lib/marketplace-api.ts");
  assert.match(trust, /collection\("reviews"\)\.where\("toId", "==", targetUid\)/);
  assert.match(trust, /Math\.round\(\(ratings\.reduce/);
  assert.match(trust, /public_profiles/);
  assert.match(client, /action === "add_review"/);
  assert.match(client, /\/api\/trust\/recalculate/);
});

// ---------------------------------------------------------------------------
// Privacy and public profiles
// ---------------------------------------------------------------------------

test("private account records are separated from public profile projection", async () => {
  const rules = await read("firestore.rules");
  const publicPage = await read("app/u/[id]/page.tsx");
  const talent = await read("lib/talent.ts");
  assert.match(rules, /match \/public_profiles\/\{uid\}/);
  assert.match(rules, /allow read: if signedIn\(\) && \(request\.auth\.uid == uid/);
  assert.match(publicPage, /"public_profiles"/);
  assert.doesNotMatch(publicPage, /doc\(db!, "users", id\)/);
  assert.match(talent, /collection\(needDb\(\), "public_profiles"\)/);
  assert.match(talent, /where\("discoverable", "==", true\)/);
});

test("public profile projection omits email wallet and suspension metadata", async () => {
  const sync = await read("app/api/profile/sync/route.ts");
  const projectionBody = sync.slice(sync.indexOf("return {"), sync.indexOf("updatedAt: FieldValue.serverTimestamp()"));
  assert.doesNotMatch(projectionBody, /email:/);
  assert.doesNotMatch(projectionBody, /wallet:/);
  assert.doesNotMatch(projectionBody, /suspendedReason:/);
  assert.match(projectionBody, /discoverable:/);
});

test("unknown trust is shown honestly instead of fabricated defaults", async () => {
  const talentPage = await read("app/talent/page.tsx");
  const publicPage = await read("app/u/[id]/page.tsx");
  assert.doesNotMatch(talentPage, /trustScore \?\? 70/);
  assert.doesNotMatch(publicPage, /trustScore \?\? 70/);
  assert.match(talentPage, /Trust \{typeof person\.trustScore === "number" \? person\.trustScore : "—"\}/);
});

// ---------------------------------------------------------------------------
// Granular RBAC and Firestore rules
// ---------------------------------------------------------------------------

test("staff records no longer imply blanket admin authority", async () => {
  const rules = await read("firestore.rules");
  assert.doesNotMatch(rules, /function isAdmin\(\)/);
  assert.match(rules, /function hasPermission\(permission\)/);
  assert.match(rules, /permission in adminRecord\(\)\.get\('permissions', \[\]\)/);
  assert.match(rules, /hasPermission\('managePayments'\)/);
  assert.match(rules, /hasPermission\('manageUsers'\)/);
});

test("sensitive marketplace collections are client-write denied", async () => {
  const rules = await read("firestore.rules");
  for (const collectionName of ["tasks", "bids", "reviews", "wallet_txs"]) {
    assert.match(rules, new RegExp(`match \\/${collectionName}\\/\\{`));
  }
  assert.match(rules, /match \/tasks\/\{taskId\}[\s\S]*?allow create, update, delete: if false/);
  assert.match(rules, /match \/bids\/\{bidId\}[\s\S]*?allow create, update, delete: if false/);
  assert.match(rules, /match \/reviews\/\{reviewId\}[\s\S]*?allow create, update, delete: if false/);
  assert.match(rules, /match \/wallet_txs\/\{transactionId\}[\s\S]*?allow create, update, delete: if false/);
});

test("users cannot write protected money and moderation fields", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /selfUserUpdateAllowed\(\)/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\[/);
  const selfBlock = rules.slice(rules.indexOf("function selfUserUpdateAllowed"), rules.indexOf("function managedUserUpdateAllowed"));
  assert.doesNotMatch(selfBlock, /'wallet'/);
  assert.doesNotMatch(selfBlock, /'verified'/);
  assert.doesNotMatch(selfBlock, /'suspended'/);
  assert.doesNotMatch(selfBlock, /'trustScore'/);
});

test("notifications cannot be spoofed by signed-in clients", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /match \/notifications\/\{notificationId\}/);
  assert.match(rules, /allow create: if false/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['read'\]\)/);
});

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

test("profile storage allows one bounded avatar object", async () => {
  const profile = await read("app/profile/page.tsx");
  const rules = await read("storage.rules");
  assert.match(profile, /profile-images\/\$\{user\.uid\}\/avatar/);
  assert.match(rules, /fileName == 'avatar'/);
  assert.match(rules, /request\.resource\.size <= 5 \* 1024 \* 1024/);
  assert.match(rules, /image\/\(jpeg\|png\|webp\)/);
});

test("task files require actual contract participation and bounded MIME types", async () => {
  const rules = await read("storage.rules");
  assert.match(rules, /function contractParticipant\(taskId\)/);
  assert.match(rules, /taskData\(taskId\)\.posterId == request\.auth\.uid/);
  assert.match(rules, /taskData\(taskId\)\.assignedTo == request\.auth\.uid/);
  assert.match(rules, /10 \* 1024 \* 1024/);
  assert.match(rules, /application\/pdf\|text\/plain/);
});

// ---------------------------------------------------------------------------
// AI endpoint
// ---------------------------------------------------------------------------

test("AI analysis is authenticated rate-limited and request-bounded", async () => {
  const route = await read("app/api/hf/analyze/route.ts");
  const client = await read("lib/hf.ts");
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /enforceRateLimit\(decoded\.uid\)/);
  assert.match(route, /count >= 20/);
  assert.match(route, /raw\.length > 10_000/);
  assert.match(route, /AbortSignal\.timeout\(10_000\)/);
  assert.match(client, /Authorization: `Bearer \$\{token\}`/);
});

test("heuristic AI mode does not fabricate confidence percentages", async () => {
  const route = await read("app/api/hf/analyze/route.ts");
  assert.match(route, /confidence: null/);
  assert.match(route, /analysisMode: "heuristic"/);
  assert.doesNotMatch(route, /confidence: needsReview \? 0\.42/);
});

// ---------------------------------------------------------------------------
// Admin operations and audit
// ---------------------------------------------------------------------------

test("privileged admin mutations use server API with transaction-bound audits", async () => {
  const lib = await read("lib/admin.ts");
  const route = await read("app/api/admin/route.ts");
  assert.match(lib, /adminAction\("add_admin"/);
  assert.match(lib, /adminAction\("set_user_suspended"/);
  assert.match(lib, /adminAction\("save_settings"/);
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /audit\(transaction, actor/);
  assert.match(route, /requirePermission\(actor, "manageAdmins"\)/);
  assert.match(route, /requirePermission\(actor, "manageUsers"\)/);
});

test("commercial settings require payment permission in addition to content permission", async () => {
  const route = await read("app/api/admin/route.ts");
  assert.match(route, /requirePermission\(actor, "manageContent"\)/);
  assert.match(route, /\["clientFeePercent", "freelancerFeePercent", "minTaskBudget"\]/);
  assert.match(route, /requirePermission\(actor, "managePayments"\)/);
});

// ---------------------------------------------------------------------------
// Money honesty and build gate
// ---------------------------------------------------------------------------

test("UI states that internal records are not live regulated escrow", async () => {
  const wallet = await read("app/wallet/page.tsx");
  const audit = await read("MARKETPLACE_AUDIT.md");
  assert.match(wallet, /Live payment onboarding is still in progress/);
  assert.match(wallet, /not a bank balance or regulated escrow/);
  assert.match(audit, /must not describe an internal Firestore balance as escrow/);
});

test("production build is blocked when regression tests fail", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.build, "npm test && next build");
});

// ---------------------------------------------------------------------------
// Existing UX coverage
// ---------------------------------------------------------------------------

test("real-time marketplace listeners remain present", async () => {
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

test("every primary route still exists", async () => {
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
