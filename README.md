# Workly

Workly is a Next.js + Firebase marketplace for posting tasks, comparing freelancers, managing delivery, messaging, reviews and internal contract balances. The current build uses a two-mode member account model: **Client** for hiring and **Freelancer** for earning. Staff roles are invitation-only and controlled from the admin centre.

## Stack

- **App:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Auth/Data/Storage:** Firebase Auth, Cloud Firestore, Firebase Storage
- **AI:** Hugging Face-backed interview and matching helpers
- **Hosting:** Vercel for the web app, Firebase CLI for rules/index deployment

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

### Required environment variables

Use `.env.example` as the source of truth. Browser-safe Firebase config must use the `NEXT_PUBLIC_` prefix. Server-only secrets must **not** use that prefix.

Minimum for the client app:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Required for authenticated AI interview/API routes:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# or
FIREBASE_SERVICE_ACCOUNT_JSON=

HUGGINGFACE_API_KEY=
HUGGINGFACE_CHAT_MODEL=
```

## Useful commands

```bash
npm test          # Node-based platform checks
npm run lint      # TypeScript check: tsc --noEmit
npm run build     # Production Next.js build
npm run start     # Serve a production build locally
```

## Firebase deployment

The repository includes Firebase rules and composite indexes:

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `.firebaserc` defaults to project `workly-c7458`

Deploy rules and indexes together so production queries do not hit missing-index errors:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

If you only changed indexes:

```bash
firebase deploy --only firestore:indexes
```

### Index coverage

`firestore.indexes.json` covers the marketplace queries that combine identity/status filters with uniqueness checks or newest-first ledgers:

- public/private/pending task views and member task dashboards
- duplicate offer prevention on `bids(taskId, bidderId)`
- offer lists by task or freelancer
- review dedupe on `reviews(taskId, fromId)` and public profile review history
- wallet ledger by `userId + createdAt`
- notification and conversation feeds

## Vercel deployment

1. Add the same environment variables in the Vercel project settings.
2. Keep server-only values out of `NEXT_PUBLIC_` variables.
3. Deploy from the GitHub branch or let the GitHub integration create a preview.
4. After a production deploy, run the smoke checklist below against the deployed URL.

## Smoke checklist

- Sign up with email/password and Google.
- Confirm signup offers only **Client** and **Freelancer**.
- Switch mode from the account menu or `/settings`.
- As a client: post a task, review offers, hire, request changes and approve.
- As a freelancer: browse tasks, send/edit/withdraw an offer, start work and submit delivery.
- Confirm messages, notifications, reviews and wallet ledger entries render.
- Confirm the owner account `contact.hamzutrader@gmail.com` can access the control centre.

## Roles and payment honesty

Detailed role behaviour is documented in [`ROLES_AND_ACCESS.md`](./ROLES_AND_ACCESS.md). Marketplace audit notes live in [`MARKETPLACE_AUDIT.md`](./MARKETPLACE_AUDIT.md).

Workly currently records internal contract balances. Do not describe those records as regulated escrow until live payments are connected through an approved State Bank of Pakistan-regulated provider with signed server-side webhooks and a proper ledger.
