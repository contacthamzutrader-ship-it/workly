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
  assert.match(wallet, /Safepay/);
  assert.match(wallet, /Protected Escrow Wallet/);
});

test("profiles use durable image storage with upload restrictions", async () => {
  const profile = await read("app/profile/page.tsx");
  const storageRules = await read("storage.rules");
  assert.match(profile, /profile-images\/\$\{user\.uid\}\/avatar/);
  assert.match(profile, /5 \* 1024 \* 1024/);
  assert.match(profile, /compactProfileImage/);
  assert.match(profile, /canvas\.toDataURL\("image\/jpeg"/);
  assert.match(storageRules, /request\.auth\.uid == uid/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
});

test("security rules protect privileged collections", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /function publicRole\(role\)/);
  assert.match(rules, /return role in \['customer', 'tasker'\]/);
  assert.match(rules, /match \/admins\/\{uid\}/);
  assert.match(rules, /hasPermission\('manageAdmins'\)/);
  assert.match(rules, /match \/wallet_txs\/\{transactionId\}/);
  assert.match(rules, /match \/disputes\/\{disputeId\}/);
});

test("signup preserves the selected role without an auth-listener race", async () => {
  const auth = await read("lib/auth-context.tsx");
  assert.match(auth, /pendingSignupRole = selectedRole/);
  assert.match(auth, /ensureUserDoc\(cred\.user, name, selectedRole, true\)/);
  assert.match(auth, /isTasker: selectedRole === "tasker"/);
  assert.match(auth, /wallet: 0/);
});

test("freelancers see opportunities but cannot post tasks", async () => {
  const dashboard = await read("app/dashboard/page.tsx");
  const taskerDashboard = await read("components/TaskerDashboard.tsx");
  assert.match(taskerDashboard, /listPublicTasks\(\)/);
  assert.match(taskerDashboard, /Recommended jobs for you/);
  assert.match(dashboard, /canPost/);
});

test("private task links are token claimed by exactly one freelancer", async () => {
  const tasks = await read("lib/tasks.ts");
  const admin = await read("app/admin/page.tsx");
  const rules = await read("firestore.rules");
  assert.match(tasks, /export async function claimPrivateTask/);
  assert.match(admin, /\/tasks\/\$\{task\.id\}\?invite=\$\{token\}/);
  assert.match(rules, /match \/task_invites\/\{taskId\}/);
  assert.match(rules, /request\.resource\.data\.token == task\(taskId\)\.shareToken/);
  assert.match(rules, /allow update: if false/);
});

test("owner account is locked to the complete admin command centre", async () => {
  const shell = await read("components/AppShell.tsx");
  const admin = await read("app/admin/page.tsx");
  const config = await read("lib/admin.ts");
  assert.match(config, /contact\.hamzutrader@gmail\.com/);
  assert.match(shell, /ownerMode && pathname !== "\/admin"/);
  assert.match(shell, /router\.replace\("\/admin"\)/);
  assert.match(admin, /All tasks/);
  assert.match(admin, /Finance & disputes/);
  assert.match(admin, /Every platform task/);
});

test("premium brand mark replaces the old tagline", async () => {
  const layout = await read("app/layout.tsx");
  const navbar = await read("components/Navbar.tsx");
  const footer = await read("components/Footer.tsx");
  const brand = await read("components/BrandLogo.tsx");
  assert.match(layout, /workly-mark\.png/);
  assert.match(brand, /src="\/workly-mark\.png"/);
  assert.doesNotMatch(`${navbar}\n${footer}`, /Kaam\. Kamal/i);
});

test("AI interview keeps exactly 10 questions per candidate", async () => {
  const nicheTests = await read("lib/nicheTests.ts");
  assert.match(nicheTests, /slice\(0, 10\)/);
  assert.match(nicheTests, /aiInterviewQuestions: shuffledAI/);
});

test("Safepay checkout and webhook verification are implemented", async () => {
  const safepay = await read("lib/safepay.ts");
  const checkoutRoute = await read("app/api/payments/create-checkout/route.ts");
  const webhookRoute = await read("app/api/payments/webhook/route.ts");
  assert.match(safepay, /createSafepayTracker/);
  assert.match(safepay, /verifySafepayWebhookSignature/);
  assert.match(checkoutRoute, /createSafepayTracker/);
  assert.match(webhookRoute, /verifySafepayWebhookSignature/);
  assert.match(webhookRoute, /payment\.completed/);
});

test("double-blind reviews and secure withdrawal endpoints are configured", async () => {
  const tasks = await read("lib/tasks.ts");
  const withdrawRoute = await read("app/api/wallet/withdraw/route.ts");
  assert.match(tasks, /revealed: isBothSubmitted/);
  assert.match(tasks, /r\.revealed !== false/);
  assert.match(withdrawRoute, /MIN_WITHDRAWAL/);
  assert.match(withdrawRoute, /payoutMethod/);
});

test("brand unification to Workly is strictly enforced across public surfaces", async () => {
  const pkg = await read("package.json");
  const layout = await read("app/layout.tsx");
  const admin = await read("app/admin/page.tsx");
  const insurance = await read("app/insurance/page.tsx");
  const signup = await read("app/(auth)/signup/page.tsx");
  const authLayout = await read("app/(auth)/layout.tsx");
  const dashboard = await read("app/dashboard/page.tsx");
  
  assert.match(pkg, /"name":\s*"workly"/);
  assert.match(layout, /Workly/);
  assert.match(admin, /Workly Control/);
  assert.match(insurance, /WORKLY SAFEGUARD/);
  assert.match(signup, /Choose how you use Workly/);
  assert.match(authLayout, /Workly membership/);
  assert.match(dashboard, /Every applicant on Workly/);
  assert.doesNotMatch(`${signup}\n${insurance}\n${admin}\n${dashboard}`, /Parwaz/i);
});

test("contract cancellation and formal dispute resolution workflows exist", async () => {
  const tasks = await read("lib/tasks.ts");
  const taskDetail = await read("app/tasks/[id]/page.tsx");
  const admin = await read("app/admin/page.tsx");

  assert.match(tasks, /cancelTask/);
  assert.match(tasks, /raiseDispute/);
  assert.match(tasks, /type:\s*"refund"/);
  assert.match(taskDetail, /cancelModalOpen/);
  assert.match(taskDetail, /disputeModalOpen/);
  assert.match(admin, /resolveDisputeRefund/);
  assert.match(admin, /resolveDisputeRelease/);
});

