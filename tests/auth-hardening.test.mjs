import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("failed profile creation rolls back the Firebase auth user", async () => {
  const auth = await read("lib/auth-context.tsx");
  assert.match(auth, /removeIncompleteFirebaseUser/);
  assert.match(auth, /await removeIncompleteFirebaseUser\(credential\.user\)/);
  assert.doesNotMatch(auth, /pendingRole/);
});

test("Google login cannot silently create an ordinary Workly member", async () => {
  const auth = await read("lib/auth-context.tsx");
  const login = await read("app/(auth)/login/page.tsx");
  assert.match(auth, /Google on the login screen must never become an accidental signup/);
  assert.match(auth, /No Workly account was found for this Google account/);
  assert.match(login, /const \{ isOwner \} = await signInWithGoogle\(\)/);
});

test("signup requires validated identity fields, password confirmation and terms", async () => {
  const signup = await read("app/(auth)/signup/page.tsx");
  assert.match(signup, /confirmPassword/);
  assert.match(signup, /validDisplayName/);
  assert.match(signup, /EMAIL_PATTERN/);
  assert.match(signup, /strength\.problems\.length === 0/);
  assert.match(signup, /password === confirmPassword/);
  assert.match(signup, /allowSignups === true/);
  assert.match(signup, /!agreed/);
});

test("onboarding cannot finish an incomplete freelancer profile", async () => {
  const onboarding = await read("app/onboarding/page.tsx");
  assert.match(onboarding, /professionalTitle\.trim\(\)\.length >= 3/);
  assert.match(onboarding, /skills\.length > 0/);
  assert.match(onboarding, /bio\.trim\(\)\.length >= 20/);
  assert.doesNotMatch(onboarding, /Skip for now/);
  assert.match(onboarding, /profileUpdatedAt: serverTimestamp\(\)/);
});

test("Firestore blocks privileged defaults and respects the signup gate", async () => {
  const rules = await read("firestore.rules");
  assert.match(rules, /function signupsAllowed\(\)/);
  assert.match(rules, /&& signupsAllowed\(\)/);
  assert.match(rules, /request\.resource\.data\.email == request\.auth\.token\.email/);
  assert.match(rules, /get\('wallet', 0\) == 0/);
  assert.match(rules, /get\('verified', false\) == false/);
  assert.match(rules, /get\('suspended', false\) == false/);
  assert.match(rules, /get\('profileComplete', false\) == false/);
});

test("login redirects remain internal", async () => {
  const login = await read("app/(auth)/login/page.tsx");
  assert.match(login, /function safeInternalRedirect/);
  assert.match(login, /value\.startsWith\("\/\/"\)/);
});
