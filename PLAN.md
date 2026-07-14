# Workly — Airtasker-style Task Marketplace (Full Plan)

> Company: **Workly** · Colors: Green `#16A34A` / White `#FFFFFF` / Black `#0A0A0A`
> Stack: Next.js (Vercel) · Firebase (Auth + Firestore) · Hugging Face (AI) · Tailwind CSS

## 1. Core Concept
Two user types:
- **Customer / Poster** — posts tasks (e.g. cleaning, web dev), receives bids, hires.
- **Tasker / Provider** — browses tasks, places bids, completes work, gets paid.

Lifecycle: `Draft → Pending Approval → Approved (Public/Private) → Open for Bids → Bid Selected → In Progress → Completed → Payment Released → Review`.

## 2. Tech Stack
| Layer | Tech |
|------|------|
| Frontend + Backend | Next.js (App Router) + TypeScript — deploy on Vercel |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Auth — Google + Email/Password |
| AI/ML | Hugging Face Inference API (auto-approve, matching, moderation) |
| Styling | Tailwind CSS (Green/White/Black theme) |
| Hosting | Vercel (UI + serverless API), Firebase (data/auth), HF (models) |

## 3. Color System (main colors only)
- Primary Green: `#16A34A` (dark `#15803D`, light `#22C55E`)
- White: `#FFFFFF` (backgrounds)
- Black/Ink: `#0A0A0A` (text, dark sections)
- Other colors used only for status (success/error) where necessary.

## 4. User Roles (Firebase Custom Claims + Firestore `users` doc)
- `customer` — post tasks
- `tasker` — place bids
- `company_admin` — our internal team: approve tasks, create private profiles
- `super_admin` — full control
- New signups default to `customer` + `isTasker: true`. Admin roles assigned manually (admin SDK / Firestore rule).

## 5. Auth Flow
- Sign up / Sign in with **Google** and **Email/Password** (Firebase Auth).
- On signup, a `users/{uid}` doc is created with default role.
- Role read on auth state change and exposed via `useAuth()` context.

## 6. Pages / Modules
Landing · Auth (login/signup) · Dashboard · Browse Tasks · Task Detail · Post Task · Bid · Profile (Public/Private) · Admin Approval Panel · Messages · Payments · Reviews · Settings.

## 7. 🔑 Approval System (special feature)
Global toggle + per-task setting: **Manual vs Auto**.

**A) AUTO MODE (on)**
- Hugging Face model checks task (legit? spam? correct category?).
- Auto-approve → task becomes **public**, everyone can bid.
- User can turn auto on and walk away.

**B) MANUAL MODE (off)** — admin panel:
- **Public Approval:** company_admin approves → task public → everyone sees & bids.
- **Private Approval:** company_admin approves → task marked **private** → only our company's private profiles bid → exactly **1 bid (ours)** → task auto-assigned to us; no external bidding allowed.

## 8. 🔒 Private Profiles
- Normal users see **only Public** profile option when creating a profile.
- **Private profile option shown ONLY to `company_admin`** (conditional UI + Firestore security rules).
- Private profiles are ours (internal) and are used for private-approved tasks we fulfill ourselves.
- Firestore rule: `isPrivate == true` docs writable only by admin; never by normal users.

## 9. Hugging Face Use Cases
- Task auto-approval classifier (legit/spam)
- Auto category + tag suggestions
- Task description writer/enhancer
- Bid ranking / smart match
- Toxic content moderation

## 10. Firebase Security Rules (control)
- Public tasks/profiles: read-all, write-owner
- Private docs: write-admin only, read-admin
- Bids/payments: owner + admin

## 11. Project Structure
```
/app            pages & routes (App Router)
/components     UI components
/lib            firebase, auth-context, hf helpers
/styles         theme
/features       tasks, bids, approval, profiles (later phases)
```

## 12. Build Roadmap
- **Phase 1:** Next.js + Vercel scaffold, Tailwind green/white/black theme, Firebase auth (Google + Email/Password), landing + auth pages. ✅ in progress
- **Phase 2:** Core — post task, browse, bid, select, complete, payments, reviews, chat.
- **Phase 3:** Approval system (auto/manual, public/private) + private profiles + admin panel.
- **Phase 4:** Hugging Face integration (auto-approve, matching, description help).
- **Phase 5:** Polish, security rules, responsive, testing, Vercel deploy.

## 13. Environment Variables (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
HUGGINGFACE_API_KEY=

## 14. Documentation-Driven Scope (from `/documentation files`)
The 8 team docs describe a full AI/ML freelance marketplace. Mapped to the build and
implemented on the **agreed stack** (Next.js + Firebase + Hugging Face + Vercel).
The docs propose FastAPI + PostgreSQL + pgvector + Gemini; we adapt the AI modules to
Hugging Face and use Firestore instead of PostgreSQL (schema mapped to collections).

### Modules status
| Doc module | Status | Where |
|---|---|---|
| Trust Engine (trust score) | ✅ Done | `lib/trust.ts`, wired into `addReview` |
| Fraud Detection (escrow-bypass scanner) | ✅ Done | `lib/fraud.ts`, wired into `sendMessage` (−20 trust) |
| AI Matching / Ranking (Match %, weighted formula) | ✅ Done | `lib/matching.ts`, shown on task bids |
| Fresh Talent Engine (boost <14d profiles) | ✅ Done | `isFreshTalent()` |
| Visibility Rotation (epsilon-greedy) | ✅ Done | `withRotation()` |
| Notifications | ✅ Done | `lib/notifications.ts` + `/notifications` + navbar bell |
| AI Recommendation (jobs→freelancer) | ⏳ Pending | dashboard suggestions |
| AI Interview (LLM vetting) | ⏳ Pending | chat-based screening |
| AI Analytics | ⏳ Pending | telemetry |
| Wallet / Escrow payments | ⏳ Pending | Stripe |
| Freelancer/Client/Admin dashboards (Insha) | 🔶 Partial | `/dashboard` exists; split views pending |
| DB schema (Raza) | ✅ Mapped | users, tasks, bids, reviews, wallet, notifications, trustScores |
| Backend APIs (Sohail) | ✅ Mapped | Next.js API routes + `lib/*` client |
| DevOps/Security (Raza&Aaqeel) | 🔶 Partial | Firebase Auth/Rules + HTTPS; Docker/CI pending |
| PM / Revenue / Pakistan launch (Tahira) | ⏳ Pending | business layer |

### Ranking formula (per docs)
`Rank Score = (Semantic Similarity × 0.5) + (Trust/100 × 0.3) + (Success/100 × 0.2)`
Trust base 70; +2 per 5★ review, −2 per ≤2★, −20 for off-platform contact sharing.
```
