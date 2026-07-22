import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public signup creates only customer or tasker accounts", async () => {
  const auth = await read("lib/auth-context.tsx");
  const signup = await read("app/(auth)/signup/page.tsx");
  assert.match(auth, /selectedRole: "customer" \| "tasker"/);
  assert.match(signup, /I want to hire/);
  assert.match(signup, /I want to work/);
  assert.doesNotMatch(signup, /super_admin|company_admin|moderator/);
});

test("posting and bidding controls are role-gated", async () => {
  const post = await read("app/post/page.tsx");
  const detail = await read("app/tasks/[id]/page.tsx");
  const nav = await read("components/Navbar.tsx");
  assert.match(post, /\["customer", "company_admin", "super_admin"\]/);
  assert.match(detail, /role === "tasker".*task\.status === "open"/s);
  assert.match(nav, /const canPost = role === "customer"/);
  assert.match(nav, /const canFindWork = !user \|\| role === "tasker"/);
});

test("real-time marketplace listeners are present", async () => {
  const tasks = await read("lib/tasks.ts");
  const chat = await read("lib/chat.ts");
  const notifications = await read("lib/notifications.ts");
  assert.match(tasks, /export function subscribeTask/);
  assert.match(chat, /export function subscribeMessages/);
  assert.match(chat, /export function subscribeConversations/);
  assert.match(notifications, /export function subscribeNotifications/);
});

test("fake wallet top-ups are not exposed", async () => {
  const wallet = await read("app/wallet/page.tsx");
  assert.doesNotMatch(wallet, /Use this demo wallet|function addFunds|const addFunds/);
  assert.match(wallet, /Live payment onboarding required/);
  assert.match(wallet, /balances must never be editable in the browser/);
});

test("profiles use durable image storage with upload restrictions", async () => {
  const profile = await read("app/profile/page.tsx");
  const storageRules = await read("storage.rules");
  assert.match(profile, /profile-images\/\$\{user\.uid\}\/avatar/);
  assert.match(profile, /5 \* 1024 \* 1024/);
  assert.match(storageRules, /request\.auth\.uid == uid/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
});

test("security rules protect privileged collections", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /request\.resource\.data\.role in \['customer', 'tasker'\]/);
  assert.match(rules, /match \/admins\/\{uid\}/);
  assert.match(rules, /hasPermission\('manageAdmins'\)/);
  assert.match(rules, /match \/wallet_txs\/\{transactionId\}/);
  assert.match(rules, /match \/disputes\/\{disputeId\}/);
});
