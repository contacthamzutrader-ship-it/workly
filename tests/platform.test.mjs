import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function section(text, start, next) {
  const a = text.indexOf(start);
  assert.notEqual(a, -1, `missing ${start}`);
  const b = next ? text.indexOf(next, a + start.length) : -1;
  return text.slice(a, b === -1 ? undefined : b);
}

test("member roles remain client and freelancer only", async () => {
  const roles = await read("lib/roles.ts");
  const signup = await read("app/(auth)/signup/page.tsx");
  assert.ok(roles.includes('export type MemberRole = "client" | "freelancer"'));
  assert.ok(signup.includes('value: "client"'));
  assert.ok(signup.includes('value: "freelancer"'));
  assert.ok(signup.includes("Staff and admin access is never granted at signup"));
});

test("marketplace mutations use authenticated server actions", async () => {
  const client = await read("lib/marketplace-api.ts");
  const route = await read("app/api/marketplace/route.ts");
  const tasks = await read("lib/tasks.ts");
  assert.ok(client.includes('Authorization: `Bearer ${token}`'));
  assert.ok(route.includes("requireFirebaseUser(request)"));
  assert.ok(route.includes("db.runTransaction"));
  for (const action of ["create_task", "place_bid", "select_bid", "approve_delivery", "cancel_task", "open_dispute", "add_review"]) {
    assert.ok(tasks.includes(`"${action}"`), `missing server action ${action}`);
  }
  assert.doesNotMatch(tasks, /\brunTransaction\b|\baddDoc\b|\bupdateDoc\b/);
});

test("authoritative server state prevents caller-forged hire and duplicate money events", async () => {
  const route = await read("app/api/marketplace/route.ts");
  for (const required of [
    "bidderId: actor.uid",
    "bidderName: actor.name",
    "finiteNumber(bid.amount",
    "hold_${taskId}",
    "release_${taskId}",
    "payment_${taskId}",
    "refund_${taskId}",
    "task.paymentReleased === true",
  ]) assert.ok(route.includes(required), `missing invariant: ${required}`);
  assert.ok(route.includes('db.collection("disputes").doc(taskId)'));
  assert.ok(route.includes('db.collection("reviews").doc(`${taskId}_${actor.uid}`)'));
});

test("chat and notifications are not browser-authored", async () => {
  const chat = await read("lib/chat.ts");
  const route = await read("app/api/marketplace/route.ts");
  const rules = await read("firestore.rules");
  assert.ok(chat.includes('"create_conversation"'));
  assert.ok(chat.includes('"send_message"'));
  assert.doesNotMatch(chat, /\baddDoc\b|\bsetDoc\b|\bupdateDoc\b/);
  assert.ok(route.includes("fromId: actor.uid"));
  assert.ok(route.includes("scanMessage(text)"));
  const n = section(rules, "match /notifications/{notificationId}", "match /wallet_txs/{transactionId}");
  assert.ok(n.includes("allow create: if false"));
  assert.ok(n.includes("hasOnly(['read'])"));
});

test("public profiles are sanitized projections and private users stay private", async () => {
  const publicPage = await read("app/u/[id]/page.tsx");
  const talent = await read("lib/talent.ts");
  const sync = await read("app/api/profile/sync/route.ts");
  const rules = await read("firestore.rules");
  assert.ok(publicPage.includes('"public_profiles"'));
  assert.ok(talent.includes('"public_profiles"'));
  assert.ok(talent.includes('where("discoverable", "==", true)'));
  const projection = section(sync, "function publicProfile", "export async function POST");
  assert.doesNotMatch(projection, /\bemail\s*:|\bwallet\s*:|\bsuspendedReason\s*:/);
  const users = section(rules, "match /users/{uid}", "match /public_profiles/{uid}");
  assert.ok(users.includes("allow read: if signedIn()"));
  const publicProfiles = section(rules, "match /public_profiles/{uid}", "match /tasks/{taskId}");
  assert.ok(publicProfiles.includes("discoverable"));
  assert.ok(publicProfiles.includes("allow write: if false"));
});

test("Firestore denies direct writes to marketplace financial and reputation records", async () => {
  const rules = await read("firestore.rules");
  const ranges = [
    ["match /tasks/{taskId}", "match /bids/{bidId}"],
    ["match /bids/{bidId}", "match /reviews/{reviewId}"],
    ["match /reviews/{reviewId}", "match /conversations/{convId}"],
    ["match /wallet_txs/{transactionId}", "match /disputes/{disputeId}"],
  ];
  for (const [start, next] of ranges) {
    assert.ok(section(rules, start, next).includes("allow create, update, delete: if false"), `${start} must deny browser writes`);
  }
});

test("staff authorization is permission-based and member self-updates exclude protected fields", async () => {
  const rules = await read("firestore.rules");
  assert.doesNotMatch(rules, /function\s+isAdmin\s*\(/);
  assert.ok(rules.includes("function hasPermission(permission)"));
  for (const permission of ["manageUsers", "managePayments", "manageAdmins", "approveTasks"]) {
    assert.ok(rules.includes(`hasPermission('${permission}')`));
  }
  const self = section(rules, "function selfUserUpdateAllowed", "function managedUserUpdateAllowed");
  for (const protectedField of ["wallet", "verified", "suspended", "trustScore", "trustPenalty", "isPrivate"]) {
    assert.ok(!self.includes(`'${protectedField}'`), `${protectedField} must not be self-writable`);
  }
});

test("storage limits avatars and task files to bounded authorized uploads", async () => {
  const rules = await read("storage.rules");
  for (const required of ["fileName == 'avatar'", "5 * 1024 * 1024", "contractParticipant(taskId)", "10 * 1024 * 1024", "application/pdf|text/plain"]) {
    assert.ok(rules.includes(required), `missing storage rule ${required}`);
  }
  assert.ok(rules.includes("taskData(taskId).posterId == request.auth.uid"));
  assert.ok(rules.includes("taskData(taskId).assignedTo == request.auth.uid"));
});

test("AI analysis requires auth rate limiting bounded input and honest heuristic confidence", async () => {
  const route = await read("app/api/hf/analyze/route.ts");
  const client = await read("lib/hf.ts");
  for (const required of ["requireFirebaseUser(request)", "enforceRateLimit(decoded.uid)", "count >= 20", "raw.length > 10_000", "AbortSignal.timeout(10_000)", "confidence: null", 'analysisMode: "heuristic"']) {
    assert.ok(route.includes(required), `missing AI protection ${required}`);
  }
  assert.ok(client.includes('Authorization: `Bearer ${token}`'));
});

test("admin mutations are authenticated permission-checked and transaction-audited", async () => {
  const lib = await read("lib/admin.ts");
  const route = await read("app/api/admin/route.ts");
  assert.ok(lib.includes("adminAction("));
  assert.ok(route.includes("requireFirebaseUser(request)"));
  assert.ok(route.includes("audit(transaction, actor"));
  for (const permission of ["manageAdmins", "manageUsers", "manageContent", "managePayments"]) {
    assert.ok(route.includes(`requirePermission(actor, "${permission}")`), `missing admin permission ${permission}`);
  }
});

test("reputation is recalculated on trusted server records without fake defaults", async () => {
  const trust = await read("app/api/trust/recalculate/route.ts");
  const talent = await read("app/talent/page.tsx");
  const profile = await read("app/u/[id]/page.tsx");
  assert.ok(trust.includes('where("toId", "==", targetUid)'));
  assert.ok(trust.includes("public_profiles"));
  assert.doesNotMatch(talent, /trustScore\s*\?\?\s*70/);
  assert.doesNotMatch(profile, /trustScore\s*\?\?\s*70/);
});

test("payment honesty and primary product routes remain intact", async () => {
  const wallet = await read("app/wallet/page.tsx");
  const audit = await read("MARKETPLACE_AUDIT.md");
  assert.ok(wallet.includes("not a bank balance or regulated escrow"));
  assert.ok(audit.includes("must not describe an internal Firestore balance as escrow"));
  const routes = [
    "app/page.tsx", "app/(auth)/login/page.tsx", "app/(auth)/signup/page.tsx", "app/onboarding/page.tsx",
    "app/dashboard/page.tsx", "app/tasks/page.tsx", "app/tasks/[id]/page.tsx", "app/talent/page.tsx",
    "app/post/page.tsx", "app/profile/page.tsx", "app/settings/page.tsx", "app/wallet/page.tsx",
    "app/messages/page.tsx", "app/messages/[id]/page.tsx", "app/admin/page.tsx", "app/u/[id]/page.tsx",
  ];
  for (const route of routes) assert.ok((await read(route)).length > 200, `${route} should remain a real page`);
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts.test, "node --test tests/*.test.mjs");
});
