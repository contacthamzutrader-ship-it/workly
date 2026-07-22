# Workly marketplace product and launch audit

Updated: 22 July 2026

## Product decision

Workly is a Pakistan-first, fixed-price task and freelance marketplace. It combines Airtasker's simple local-task offer flow with Upwork's stronger contract, milestone, identity, and payment controls. It must not describe an internal Firestore balance as escrow. Customer money can go live only after a regulated payment provider approves Workly's marketplace/held-funds model and signed server-side webhooks are deployed.

## Research findings

### Airtasker patterns to preserve

- A task is published, providers send a priced offer and explanation, and the customer assigns one provider.
- Private chat opens after assignment. Before assignment, questions belong in a public, moderated task Q&A so contact details cannot be exchanged.
- Assignment and successful payment authorization happen together. Funds are held until the provider requests payment and the customer releases it.
- Offers can be updated or withdrawn before selection.
- The completion path is provider requests payment, customer releases, payout enters processing.
- Cancellation has a reason, responsibility attribution, counterparty response window, refund path, completion-rate effect, and possible fee.
- A dispute starts with direct resolution, then escalates with the on-platform evidence trail.
- Reviews are double-blind until both submit or the review window expires. Both sides may review; provider quality dimensions can be recorded separately.
- Provider readiness includes profile photo, date of birth/age, mobile verification, billing address, payout account, and identity verification.

Primary references:

- https://support.airtasker.com/hc/en-gb/articles/204835424-I-posted-my-task-what-s-next
- https://support.airtasker.com/hc/en-us/articles/360020896011-Everything-Taskers-should-know-about-making-an-offer
- https://support.airtasker.com/hc/en-au/articles/360024521771-How-do-I-get-paid-after-completing-a-Task
- https://support.airtasker.com/hc/en-gb/articles/200955870-How-do-I-cancel-a-task
- https://support.airtasker.com/hc/en-gb/articles/227072627-How-do-reviews-work
- https://support.airtasker.com/hc/en-au/articles/360019985872-Is-Airtasker-available-in-my-country

### Upwork patterns to preserve

- Client and freelancer accounts expose different navigation, dashboards, profile fields, and actions.
- A proposal includes price, cover letter, answers/attachments, fee visibility, and editable/withdrawable status until hire.
- Fixed-price work uses one or more funded milestones. Work is submitted against a milestone; the client approves, requests changes, or disputes.
- Messaging, files, contract terms, submissions, approvals, and disputes form one auditable contract record.
- Identity verification, payment-method verification, payout method, tax status, fraud controls, and account restrictions are launch-critical.
- Platform fees are shown before proposal/contract acceptance and recorded as immutable ledger lines.
- A real payment ledger separates pending, held, available, withdrawn, refunded, reversed, fee, and tax entries.

Primary references:

- https://support.upwork.com/hc/en-us/articles/17931377993107--Decide-between-hourly-and-fixed-price-contract
- https://support.upwork.com/hc/en-us/articles/211062568-How-Upwork-protects-your-payments
- https://support.upwork.com/hc/en-us/articles/24492534968211-How-to-sign-up-as-a-freelancer-on-Upwork
- https://support.upwork.com/hc/en-us/articles/211062538-Learn-about-the-Freelancer-Service-Fee
- https://support.upwork.com/hc/en-us/articles/211060918-Manage-How-You-Get-Paid

### Pakistan launch boundary

- Airtasker's supported-country list does not include Pakistan.
- Stripe's direct global availability list does not include Pakistan.
- Pakistan-facing checkout candidates include SBP-regulated/approved providers such as Safepay and PayFast, plus Easypaisa/JazzCash merchant gateways. Ordinary ecommerce checkout does not automatically provide legal escrow, marketplace sub-merchant onboarding, split settlement, or provider payouts.
- Workly must obtain written provider approval for: marketplace activity, delayed settlement/held funds, refunds, chargebacks, split payouts or bulk disbursement, provider KYC, webhook signing, and reconciliation exports.

Primary references:

- https://stripe.com/global
- https://safepay.com.pk/pricing
- https://gopayfast.com/products/
- https://gopayfast.com/security/
- https://easypaisa.com.pk/online-payment-gateway/

## Authoritative role matrix

| Capability | Customer | Freelancer | Moderator | Admin | Super admin |
|---|---:|---:|---:|---:|---:|
| Public browse | Yes | Yes | Yes | Yes | Yes |
| Post and edit own task | Yes | No | No | By permission | Yes |
| Send/edit/withdraw own offer | No | Yes | No | Managed-only | Yes |
| View all offers on a task | Own task only | Own offer only | Flagged only | By permission | Yes |
| Select offer and fund contract | Own task only | No | No | Managed-only | Yes |
| Private delivery chat | Contract participant | Contract participant | Reported only | By permission | Yes |
| Submit work/request payment | No | Assigned contract | No | Managed-only | Yes |
| Approve/release payment | Own funded contract | No | No | Disputes/ops permission | Yes |
| Moderate task/message/profile | No | No | Yes | By permission | Yes |
| Verify deposits/refunds/disputes | No | No | No | Payments permission | Yes |
| Add admins/change permissions | No | No | No | manageAdmins only | Yes |
| Create private managed provider | No | No | No | manageUsers permission | Yes |

Admin status is never selectable during public signup. It is granted by the owner/admin permission system.

## Required state machines

### Task and contract

`draft → pending_review → open → offer_selected/payment_pending → funded → assigned → in_progress → submitted → changes_requested | approved → payout_pending → paid → closed`

Exceptional states: `rejected`, `expired`, `cancellation_requested`, `cancelled`, `disputed`, `refunded`, `chargeback`.

State transitions must be server-authorized, idempotent, audit logged, and coupled to payment webhook state where money is involved.

### Offer

`draft → submitted → updated | withdrawn | rejected | selected → contract_created`

### Payment

`checkout_created → authorization_pending → funded/held → release_requested → released → payout_pending → paid`

Exceptional states: `failed`, `expired`, `refund_pending`, `refunded`, `chargeback`, `disputed`, `reversed`.

## Data ownership and storage

- Firebase Authentication: login identity.
- `users/{uid}`: immutable role/admin-controlled fields plus owner-editable public profile metadata.
- Firebase Storage `profile-images/{uid}/avatar`: profile photo; Firestore stores the download URL and metadata.
- `tasks`, `bids`, `conversations/{id}/messages`, `notifications`, `reviews`: marketplace records.
- Future `contracts`, `milestones`, `submissions`, `disputes`, `payment_intents`, `ledger_entries`, `payout_accounts`, `audit_logs`: server-owned financial and compliance records.
- KYC documents and bank details must not be stored as public profile fields. Prefer provider-hosted onboarding/tokenization; store only provider IDs and redacted status.

## Payment calculation proposal

The final commercial rates require owner approval and tax advice. A safe configurable starting model is:

- Customer task price: accepted offer.
- Customer service fee: separately disclosed at checkout.
- Freelancer service fee: disclosed before offer submission and fixed on contract creation.
- Provider processing fee: recorded separately, never hidden inside freelancer earnings.
- Taxes/withholding: calculated only after Pakistani legal/tax review and stored as separate ledger entries.

For an accepted offer `A`, customer fee rate `C`, freelancer fee rate `F`, and provider cost `P`:

- Customer charge = `A + round(A × C)`.
- Freelancer gross = `A`.
- Freelancer fee = `round(A × F)`.
- Freelancer payout = `A − freelancer fee − applicable withholding`.
- Workly gross revenue = customer fee + freelancer fee.
- Workly net before tax = gross revenue − provider cost − refunds/chargebacks.

Never calculate wallet balance by summing arbitrary client-created documents. Use an append-only, server-written double-entry ledger and provider reconciliation.

## AI placement

- Task authoring: scope checklist, description improvement, category/tags, budget range explanation.
- Safety moderation: spam, prohibited services, contact/payment bypass, toxicity, duplicate tasks. AI flags; policy and human review decide enforcement.
- Matching: skill/location/availability/trust fit with an explanation. Do not use protected traits.
- Proposal help: clarity and completeness suggestions, never fabricated credentials.
- Contract support: summarize agreed scope, milestones, due dates, and change requests.
- Disputes: evidence timeline and neutral summary for a human agent; AI must not make final money decisions.
- Fraud/risk: signals feed review queues. Do not automatically deduct trust or suspend solely from a regex/model hit.

## Current implementation status

Implemented in this pass:

- Public signup explicitly chooses Customer or Freelancer.
- Role-specific primary navigation, dashboard mode, posting, and bidding controls.
- Admin access remains invitation/permission based.
- Firebase Storage profile-photo upload code and file type/size controls. The Firebase project bucket must still be initialized in the console before this can accept uploads.
- Expanded freelancer profile fields.
- Live Firestore subscriptions for task state, chat messages, conversation lists, and notifications.
- Fake browser-side wallet top-up removed.
- Firestore rules syntax repaired and authorization tightened for roles, private profiles, bids, conversations, reviews, wallet records, disputes, admins, and settings.
- Storage rules added.

Still requires external business credentials or a backend deployment:

- Approved PSP marketplace/held-funds contract and merchant credentials.
- Server-side payment intents, signed webhooks, ledger, refunds, payouts, reconciliation, and chargebacks.
- Provider-hosted KYC/payout onboarding.
- Server-enforced contract/milestone/dispute transitions and audit logs.
- Legal terms, privacy policy, prohibited-services policy, cancellation/refund rules, tax/withholding decision, support SLAs, and incident response.
- Firebase rules emulator integration tests against authenticated role fixtures.
