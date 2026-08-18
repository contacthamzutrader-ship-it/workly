# Workly

Workly is a Next.js + Firebase marketplace for posting tasks, comparing freelancers, managing delivery, messaging, reviews and internal contract records. Members use one account in two modes: **Client** for hiring and **Freelancer** for providing services. Staff access is invitation-only and permission-scoped.

## Production architecture

- **App:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Identity:** Firebase Authentication
- **Private account data:** Cloud Firestore `users/{uid}`
- **Public profile data:** server-authored `public_profiles/{uid}` projection
- **Marketplace reads:** Firestore realtime subscriptions where appropriate
- **Marketplace writes:** authenticated `/api/marketplace` server route using Firebase Admin SDK
- **Privileged operations:** authenticated `/api/admin` server route with granular permissions and audit entries
- **AI:** authenticated Hugging Face-backed helpers with bounded requests and rate limiting on the task-analysis endpoint
- **Storage:** Firebase Storage with owner/contract-participant rules
- **Hosting:** Vercel for the web app; Firebase CLI for Firestore/Storage rules and indexes

Sensitive state transitions are not trusted to browser writes. Hiring, offer mutation, delivery approval, cancellation, disputes, reviews, chat writes, notifications and internal ledger records are authorized on the server against current Firestore state.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

### Required environment variables

Use `.env.example` as the source of truth. Browser-safe Firebase config uses the `NEXT_PUBLIC_` prefix. Server credentials and provider keys must never use that prefix.

Client Firebase configuration:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Server authentication/API configuration:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# or
FIREBASE_SERVICE_ACCOUNT_JSON=

HUGGINGFACE_API_KEY=
HUGGINGFACE_CHAT_MODEL=
```

## Commands

```bash
npm test          # security/product regression tests
npm run lint      # TypeScript check: tsc --noEmit
npm run build     # regression tests + production Next.js build on release branches
npm run start     # serve a production build locally
```

The production build command is intentionally test-gated. Do not remove the test step to make a failing deployment appear green.

## Firebase deployment

The repository includes:

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `.firebaserc` (project `workly-c7458`)

Deploy rules, indexes and storage rules together after merging security changes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The current index file includes task, offer, review, ledger, notification, conversation and sanitized `public_profiles` directory queries.

### Public profile migration

Private `users/{uid}` documents contain account/operational fields and are not public-readable. Public discovery uses sanitized `public_profiles/{uid}` documents written by trusted server code.

Signed-in members automatically refresh their own projection. An owner or staff account with `manageUsers` can run the `sync_public_profiles` admin server action to backfill existing users after this release. Run the backfill before expecting legacy freelancers to appear in `/talent`.

Do not temporarily reopen public reads on `users` to populate the talent directory.

## Vercel deployment order

1. Add/verify the Firebase server credentials in Vercel.
2. Deploy Firestore rules/indexes and Storage rules.
3. Deploy the application preview.
4. Confirm the automated regression suite and Next.js build are green.
5. Backfill sanitized public profiles if legacy users exist.
6. Run the smoke checklist below.
7. Only then promote/merge to the production branch.

## Security smoke checklist

### Account lifecycle

- Email signup → required onboarding → dashboard.
- Google login does not silently become signup.
- Interrupted onboarding returns to onboarding on next login.
- Client/Freelancer role switching recalculates profile readiness.
- Suspended/incomplete accounts cannot perform marketplace actions.

### Marketplace

- Client can post a valid task, but direct browser writes to `tasks` fail.
- Freelancer can send/edit/withdraw one offer per task through the server action path.
- Hiring derives freelancer identity and amount from the selected offer document.
- Competing offers close when one is selected.
- Start work → submit → request changes → resubmit → approve follows valid states only.
- Duplicate delivery approval does not create duplicate ledger records.
- Cancellation/refund and dispute transitions reject stale/invalid states.

### Privacy and communication

- Public profile/talent pages do not expose user email or wallet fields.
- Managed/private freelancers are not discoverable publicly.
- Conversation participants are the actual contract parties.
- Direct Firestore message and notification creation is denied.
- Task attachments are limited to contract participants and permitted file types/sizes.

### Staff

- Editor, Moderator and Admin permissions are different at the rules/API layer, not just hidden in UI.
- Staff/user/settings mutations create audit records server-side.
- No public signup can grant staff or owner access.

## Payments: launch boundary

Workly currently maintains **internal contract records for application testing and workflow development**. These records are not a bank balance and are not regulated escrow.

Do not accept or market real customer money until Workly has all of the following:

- written approval from an appropriate State Bank of Pakistan-regulated payment provider for the intended marketplace/held-funds model;
- provider-issued merchant/marketplace credentials;
- signed webhook verification and reconciliation;
- provider-approved refund, chargeback and payout flows;
- provider-hosted or otherwise legally reviewed KYC/payout onboarding;
- reviewed legal Terms, Privacy, prohibited-services, cancellation/refund and tax/withholding policies.

The server-owned internal ledger in this repository is a safer application boundary, but it is **not a substitute for a regulated PSP ledger or legal escrow approval**.

Detailed role behaviour is documented in [`ROLES_AND_ACCESS.md`](./ROLES_AND_ACCESS.md). Product/launch boundaries are tracked in [`MARKETPLACE_AUDIT.md`](./MARKETPLACE_AUDIT.md).
