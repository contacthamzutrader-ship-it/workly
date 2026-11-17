import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("category similarity performs smart token matching", async () => {
  const matching = await read("lib/matching.ts");
  assert.match(matching, /export function categorySimilarity/);
  assert.match(matching, /targetTokens/);
  assert.match(matching, /lowerSkills\.includes/);
});

test("fresh talent engine provides ranking bonus for accounts <= 14 days", async () => {
  const matching = await read("lib/matching.ts");
  const taskDetail = await read("app/tasks/[id]/page.tsx");
  assert.match(matching, /export function isFreshTalent/);
  assert.match(matching, /freshBoost/);
  assert.match(taskDetail, /createdAt: d\.createdAt/);
});

test("visibility rotation epsilon rotation works correctly", async () => {
  const matching = await read("lib/matching.ts");
  assert.match(matching, /export function withRotation/);
  assert.match(matching, /Math\.random\(\) < epsilon/);
});

test("fraud detection flags off-platform contact sharing", async () => {
  const fraud = await read("lib/fraud.ts");
  const chat = await read("lib/chat.ts");
  assert.match(fraud, /export function scanMessage/);
  assert.match(fraud, /whatsapp/i);
  assert.match(chat, /applyFraudPenalty\(fromId\)/);
});

test("storage rules cover portfolio, education, id documents, and task files", async () => {
  const rules = await read("storage.rules");
  assert.match(rules, /match \/portfolio-images\/\{uid\}\/\{fileName\}/);
  assert.match(rules, /match \/education-images\/\{uid\}\/\{fileName\}/);
  assert.match(rules, /match \/id-documents\/\{uid\}\/\{fileName\}/);
  assert.match(rules, /match \/task-files\/\{taskId\}\/\{uid\}\/\{fileName\}/);
});

test("firestore rules cover contact_messages, support_tickets, and webhook_logs", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /match \/contact_messages\/\{msgId\}/);
  assert.match(rules, /match \/support_tickets\/\{ticketId\}/);
  assert.match(rules, /match \/webhook_logs\/\{logId\}/);
});

test("firebase.ts initializes unconditionally for server-side api routes", async () => {
  const code = await read("lib/firebase.ts");
  assert.doesNotMatch(code, /if \(typeof window !== "undefined"\) \{/);
  assert.match(code, /export \{ app, auth, db, storage \};/);
});
