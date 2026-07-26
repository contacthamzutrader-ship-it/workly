# Workly — accounts, roles and access

This is the single source of truth for who can do what on Workly.

## 1. Two things a person can choose for themselves

Every public signup creates one account with **one member role**:

| Role | Chooses at signup | Can do |
|---|---|---|
| **Client** | "Hire for tasks" | Post tasks, compare offers, hire, fund, approve, release payment, review |
| **Freelancer** | "Work and earn" | Browse work, send/edit/withdraw offers, deliver, request payment, review |

**One account covers both.** A member switches mode from the account menu or
`/settings` at any time. Nothing is deleted — tasks, offers, messages, reviews
and reputation all stay on the same account.

Legacy documents that stored `customer` / `tasker` keep working: everything
reads through `normalizeRole()` in `lib/roles.ts`, and writes use
`toStoredRole()` so existing Firestore rules stay valid. No migration needed.

## 2. Staff is invitation-only

Staff status can **never** be selected at signup and can **never** be set by
the account itself. It is granted only by the owner (or an admin holding
`manageAdmins`) through the control centre, and it is written to the
`admins/{uid}` collection which normal members cannot write to.

| Staff role | Default permissions | Intended for |
|---|---|---|
| **Editor** | `manageContent`, `viewAnalytics` | Content, categories, platform copy. No money, no account powers. |
| **Moderator** | `approveTasks`, `manageContent`, `viewAnalytics` | Task review queue, reported content. |
| **Admin** | `approveTasks`, `manageUsers`, `managePayments`, `manageContent`, `viewAnalytics` | Operations lead. |
| **Owner** | *all six, permanently* | `contact.hamzutrader@gmail.com` |

Permissions can be fine-tuned per person on top of the role default, so an
editor can be given analytics only, or a moderator can be given payments.

### The owner

`contact.hamzutrader@gmail.com` is hard-coded as the platform owner in
`lib/roles.ts` **and** in `firestore.rules`. This account:

- always resolves to `super_admin` with all six permissions, regardless of
  Firestore state — it can never be locked out;
- is the only account that can exist as owner (`addAdmin` rejects
  `super_admin` and rejects the owner email);
- cannot be edited, suspended or removed from the interface;
- can appoint and revoke editors, moderators and admins.

## 3. Permissions

| Permission | Unlocks |
|---|---|
| `approveTasks` | Publish, privately assign, or reject tasks in the review queue |
| `manageUsers` | Change member modes, suspend/restore, verify, manage private providers, review interviews |
| `manageAdmins` | Add/remove staff, change permissions, read the audit log |
| `managePayments` | Ledger, disputes, refunds |
| `manageContent` | Platform settings, fees, categories, approval mode |
| `viewAnalytics` | Overview dashboard and task reports |

The admin control centre builds its tab list from these permissions, so an
editor literally cannot see the payments or staff tabs.

## 4. Accountability

Every privileged action writes an entry to `audit_logs` with the actor, the
action, the target and a timestamp. The Firestore rule is append-only:
`allow update, delete: if false`. The owner and any `manageAdmins` holder can
read the full log at **Control centre → Audit log**.

## 5. What a member can never do to themselves

Enforced in `firestore.rules`, not just the UI:

- set their own `role` to anything outside `customer` / `tasker`
- flip their own `verified` flag
- lift their own `suspended` flag
- edit their own `trustScore`, `wallet`, `isPrivate` or any interview field
- write to `admins/`, or edit/delete anything in `audit_logs`

## 6. What each role sees after signing in

| Surface | Client | Freelancer | Staff |
|---|---|---|---|
| Primary nav | My tasks · Browse talent · Messages | Find work · Dashboard · Messages | + Control centre |
| Main CTA | Post a task | Find work | Control centre |
| Dashboard | Posted tasks, offers received, deliveries to review, spend | Active jobs, offers sent, earnings, recommended work | Operations metrics |
| Task detail | Offer list + hire, approve/request changes, release payment | Send/edit/withdraw offer, start, deliver, request payment | Full visibility on every offer |
| Profile fields | Organisation, hiring needs | Title, skills, rate, experience, languages, availability, portfolio, certifications | + private provider toggle |

New accounts land on `/onboarding`, a three-step flow that confirms the role,
captures name/city/bio, and then role-specific details before dropping the
member at `/post` (client) or `/tasks` (freelancer).
