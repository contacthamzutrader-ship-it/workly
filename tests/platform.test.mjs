import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function block(text, start, next) {
  const from = text.indexOf(start);
  assert.notEqual(from, -1, `Missing block: ${start}`);
  const to = next ? text.indexOf(next, from + start.length) : -1;
  return text.slice(from, to === -1 ? undefined : to);
}

// ---------------------------------------------------------------------------
// Account model
// ---------------------------------------------------------------------------

test("public account model exposes member roles without public staff signup", async () => {
  const roles = await read("lib/roles.ts");
  const signup = await read("app/(auth)/signup/page.tsx");
  assert.match(roles, /MemberRole\s*=\s*"client"\s*\|\s*"freelancer"/);
  assert.match(signup, /value:\s*"client"/);
  assert.match(signup, /value:\s*"freelancer"/);
  assert.match(signup, /Staff and admin access is never granted at signup/);
  assert.doesNotMatch(signup, /value:\s*"(?:editor|moderator|admin|super_admin)"/);
});

test("incomplete accounts remain gated from marketplace actions", async () => {
  const auth = await read("lib/auth-context.tsx");
  assert.match(auth, /function profileReadyForRole/);
  assert.match(auth, /profile\.onboarded\s*&&\s*profileReadyForRole/);
  assert.match(auth, /canPostTask:\s*base\.canPostTask\s*&&\s*ready/);
  assert.match(auth, /canSendOffer:\s*base\.canSendOffer\s*&&\s*ready/);
});

// ---------------------------------------------------------------------------
// Trusted marketplace boundary
// ---------------------------------------------------------------------------

test("sensitive marketplace mutations cross an authenticated server boundary", async () => {
  const client = await read("lib/marketplace-api.ts");
  const route = await read("app/api/marketplace/route.ts");
  const tasks = await read("lib/tasks.ts");
  const chat = await read("lib/chat.ts");

  assert.match(client, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /db\.runTransaction/);

  for (const action of ["create_task", "place_bid", "select_bid", "approve_delivery", "cancel_task", "open_dispute", "add_review"]) {
    assert.ok(tasks.includes(`"${action}"`), `tasks client should route ${action} through server actions`);
  }
  assert.ok(chat.includes('"create_conversation"'));
  assert.ok(chat.includes('"send_message"'));
  assert.doesNotMatch(tasks, /runTransaction|wallet_txs/);
  assert.doesNotMatch(chat, /\b(?:addDoc|setDoc|updateDoc)\b/);
});

test("server derives offer identity amount and contract parties from stored records", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /bidderId:\s*actor\.uid/);
  assert.match(route, /bidderName:\s*actor\.name/);
  assert.match(route, /finiteNumber\(bid\.amount/);
  assert.match(route, /bid\.taskId\s*!==\s*taskId/);
  assert.match(route, /participants\s*=\s*\[String\(task\.posterId/);
  assert.match(route, /fromId:\s*actor\.uid/);
  assert.match(route, /fromName:\s*actor\.name/);
});

test("offers and financial transitions are deterministic and idempotent", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /`\$\{taskId\}_\$\{actor\.uid\}`/);
  assert.match(route, /hold_\$\{taskId\}/);
  assert.match(route, /release_\$\{taskId\}/);
  assert.match(route, /payment_\$\{taskId\}/);
  assert.match(route, /refund_\$\{taskId\}/);
  assert.match(route, /paymentReleased\s*===\s*true/);
  assert.match(route, /status:\s*"completed"[\s\S]*paymentReleased:\s*true/);
});

test("hire closes competing pending offers in the same transaction", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /collection\("bids"\)\.where\("taskId",\s*"==",\s*taskId\)\.where\("status",\s*"==",\s*"pending"\)/);
  assert.match(route, /offer\.id\s*===\s*bidId\s*\?\s*"selected"\s*:\s*"rejected"/);
});

test("disputes and reviews are contract-bound rather than caller-defined", async () => {
  const route = await read("app/api/marketplace/route.ts");
  assert.match(route, /collection\("disputes"\)\.doc\(taskId\)/);
  assert.match(route, /already has an active dispute/);
  assert.match(route, /respondent\s*=\s*actor\.uid\s*===\s*task\.posterId/);
  assert.match(route, /task\.status\s*!==\s*"completed"\s*\|\|\s*task\.paymentReleased\s*!==\s*true/);
  assert.match(route, /collection\("reviews"\)\.doc\(`\$\{taskId\}_\$\{actor\.uid\}`\)/);
  assert.match(route, /integer\(body\.rating,\s*"Rating",\s*1,\s*5\)/);
});

// ---------------------------------------------------------------------------
// Privacy and reputation
// ---------------------------------------------------------------------------

test("public discovery reads sanitized projections instead of private user records", async () => {
  const publicPage = await read("app/u/[id]/page.tsx");
  const talent = await read("lib/talent.ts");
  const sync = await read("app/api/profile/sync/route.ts");

  assert.match(publicPage, /"public_profiles"/);
  assert.doesNotMatch(publicPage, /"users"\s*,\s*id/);
  assert.match(talent, /"public_profiles"/);
  assert.match(talent, /where\("discoverable",\s*"==",\s*true\)/);

  const projection = block(sync, "function publicProfile", "export async function POST");
  assert.doesNotMatch(projection, /\bemail\s*:/);
  assert.doesNotMatch(projection, /\bwallet\s*:/);
  assert.doesNotMatch(projection, /\bsuspendedReason\s*:/);
  assert.match(projection, /discoverable:/);
});

test("unknown reputation is not replaced by fabricated trust defaults", async () => {
  const talent = await read("app/talent/page.tsx");
  const profile = await read("app/u/[id]/page.tsx");
  assert.doesNotMatch(talent, /trustScore\s*\?\?\s*70/);
  assert.doesNotMatch(profile, /trustScore\s*\?\?\s*70/);
  assert.match(talent, /typeof person\.trustScore === "number"/);
  assert.match(profile, /typeof data\.trustScore === "number"/);
});

test("review reputation is recalculated by trusted server code", async () => {
  const route = await read("app/api/trust/recalculate/route.ts");
  const client = await read("lib/marketplace-api.ts");
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /where\("toId",\s*"==",\s*targetUid\)/);
  assert.match(route, /trustScore/);
  assert.match(route, /public_profiles/);
  assert.match(client, /\/api\/trust\/recalculate/);
});

// ---------------------------------------------------------------------------
// Firestore RBAC
// ---------------------------------------------------------------------------

test("Firestore uses granular permissions instead of a blanket staff-is-admin check", async () => {
  const rules = await read("firestore.rules");
  assert.doesNotMatch(rules, /function\s+isAdmin\s*\(/);
  assert.match(rules, /function\s+hasPermission\s*\(permission\)/);
  assert.match(rules, /adminRecord\(\)\.get\('permissions',\s*\[\]\)/);
  for (const permission of ["manageUsers", "managePayments", "manageAdmins", "approveTasks"]) {
    assert.ok(rules.includes(`hasPermission('${permission}')`), `missing ${permission} rule`);
  }
});

test("sensitive marketplace collections deny direct browser writes", async () => {
  const rules = await read("firestore.rules");
  const blocks = [
    ["match /tasks/{taskId}", "match /bids/{bidId}"],
    ["match /bids/{bidId}", "match /reviews/{reviewId}"],
    ["match /reviews/{reviewId}", "match /conversations/{convId}"],
    ["match /wallet_txs/{transactionId}", "match /disputes/{disputeId}"],
  ];
  for (const [start, next] of blocks) {
    assert.match(block(rules, start, next), /allow create, update, delete:\s*if false/);
  }
});

test("members cannot self-write wallet verification suspension or trust fields", async () => {
  const rules = await read("firestore.rules");
  const self = block(rules, "function selfUserUpdateAllowed", "function managedUserUpdateAllowed");
  assert.match(self, /affectedKeys\(\)\.hasOnly/);
  for (const protectedField of ["wallet", "verified", "suspended", "trustScore", "trustPenalty", "isPrivate"]) {
    assert.doesNotMatch(self, new RegExp(`'${protectedField}'`));
  }
});

test("notifications cannot be forged by signed-in clients", async () => {
  const rules = await read("firestore.rules");
  const notifications = block(rules, "match /notifications/{notificationId}", "match /wallet_txs/{transactionId}");
  assert.match(notifications, /allow create:\s*if false/);
  assert.match(notifications, /affectedKeys\(\)\.hasOnly\(\['read'\]\)/);
});

test("private user records are not anonymously public and managed freelancers are hidden", async () => {
  const rules = await read("firestore.rules");
  const users = block(rules, "match /users/{uid}", "match /public_profiles/{uid}");
  const publicProfiles = block(rules, "match /public_profiles/{uid}", "match /tasks/{taskId}");
  assert.match(users, /allow read:\s*if signedIn\(\)/);
  assert.match(publicProfiles, /resource\.data\.get\('discoverable',\s*false\)\s*==\s*true/);
  assert.match(publicProfiles, /request\.auth\.uid\s*==\s*uid/);
  assert.match(publicProfiles, /allow write:\s*if false/);
});

// ---------------------------------------------------------------------------
// Storage and API abuse controls
// ---------------------------------------------------------------------------

test("Storage limits avatars and contract files to authorized bounded uploads", async () => {
  const rules = await read("storage.rules");
  assert.match(rules, /fileName\s*==\s*'avatar'/);
  assert.match(rules, /5\s*\*\s*1024\s*\*\s*1024/);
  assert.match(rules, /function contractParticipant\(taskId\)/);
  assert.match(rules, /taskData\(taskId\)\.posterId\s*==\s*request\.auth\.uid/);
  assert.match(rules, /taskData\(taskId\)\.assignedTo\s*==\s*request\.auth\.uid/);
  assert.match(rules, /10\s*\*\s*1024\s*\*\s*1024/);
  assert.match(rules, /application\/pdf\|text\/plain/);
});

test("AI task analysis is authenticated rate-limited bounded and honest about heuristic confidence", async () => {
  const route = await read("app/api/hf/analyze/route.ts");
  const client = await read("lib/hf.ts");
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /enforceRateLimit\(decoded\.uid\)/);
  assert.match(route, /count\s*>=\s*20/);
  assert.match(route, /raw\.length\s*>\s*10_000/);
  assert.match(route, /AbortSignal\.timeout\(10_000\)/);
  assert.match(route, /confidence:\s*null/);
  assert.match(route, /analysisMode:\s*"heuristic"/);
  assert.match(client, /Authorization:\s*`Bearer \$\{token\}`/);
});

// ---------------------------------------------------------------------------
// Admin/audit and launch honesty
// ---------------------------------------------------------------------------

test("privileged admin mutations use authenticated permission-checked audited server actions", async () => {
  const lib = await read("lib/admin.ts");
  const route = await read("app/api/admin/route.ts");
  assert.match(lib, /adminAction\(/);
  assert.match(route, /requireFirebaseUser\(request\)/);
  assert.match(route, /audit\(transaction,\s*actor/);
  for (const permission of ["manageAdmins", "manageUsers", "manageContent", "managePayments"]) {
    assert.ok(route.includes(`requirePermission(actor, "${permission}")`), `admin route must enforce ${permission}`);
  }
});

test("commercial settings require payment permission as well as content permission", async () => {
  const route = await read("app/api/admin/route.ts");
  assert.match(route, /\["clientFeePercent",\s*"freelancerFeePercent",\s*"minTaskBudget"\]/);
  assert.match(route, /requirePermission\(actor,\s*"managePayments"\)/);
});

test("wallet and product audit explicitly state internal records are not regulated escrow", async () => {
  const wallet = await read("app/wallet/page.tsx");
  const audit = await read("MARKETPLACE_AUDIT.md");
  assert.match(wallet, /not a bank balance or regulated escrow/);
  assert.match(audit, /must not describe an internal Firestore balance as escrow/);
});

test("test command runs every regression file", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts.test, "node --test tests/*.test.mjs");
});

// ---------------------------------------------------------------------------
// Primary route smoke coverage
// ---------------------------------------------------------------------------

test("all primary product routes remain real pages", async () => {
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
    assert.ok((await read(route)).length > 200, `${route} should remain a real page`);
  }
});
