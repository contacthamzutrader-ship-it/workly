import Link from "next/link";
import { ShieldCheck, Lock, Eye, Database, Cookie, UserCheck, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    icon: Database,
    title: "1. Information We Collect",
    body: [
      "When you create an account, post a task, or submit an offer on Parwaz, we collect information necessary to operate a trusted marketplace: your name, verified email address, phone number for authentication, location (city/work area), and profile photo.",
      "For freelancers participating in the AI Skill Check or seeking Verified Talent status, we process assessment transcripts, verified skill scores, portfolio attachments, and identity verification records (CNIC/Government ID where required for financial compliance).",
      "We record transaction details, including task budgets, escrow holds, platform deduction records, wallet transactions, and withdrawal account titles (Easypaisa, JazzCash, or bank IBAN numbers).",
    ],
  },
  {
    icon: Eye,
    title: "2. How We Use Your Information",
    body: [
      "To connect clients with qualified freelancers, calculate matching scores, and showcase verified skills and badges on your public profile.",
      "To facilitate secure payments and escrow protection: holding client funds during active tasks and releasing payouts upon verified delivery.",
      "To protect the platform against fraud, phishing, and circumvention: our automated AI Contact Shield scans message text, proposals, and uploaded attachments (PDFs and images) in real-time to detect unauthorized sharing of personal contact information or off-platform payment solicitations.",
      "To communicate important service notifications, task status updates, payment releases, and support ticket resolutions.",
    ],
  },
  {
    icon: Lock,
    title: "3. AI Contact Shield & Message Moderation",
    body: [
      "To safeguard our community and prevent payment fraud, Parwaz employs automated safety filters and an AI Contact Shield. Messages, proposals, and attached files are scanned for phone numbers, WhatsApp links, personal emails, and off-platform dealing attempts.",
      "Communications that violate these safety rules are blocked or flagged for moderation before they reach the other party. We do not sell your message logs to advertisers or third parties.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "4. Information Sharing & Third Parties",
    body: [
      "We do not sell, rent, or trade your personal data. We only share information with trusted third-party service providers essential to running Parwaz:",
      "Payment partners and licensed payment gateways in Pakistan (such as Safepay, Raast, local banking switches, Easypaisa, and JazzCash) for payment processing and withdrawal disbursement.",
      "Cloud infrastructure providers (Google Cloud Platform and Firebase) for encrypted database hosting, authentication, and secure file storage.",
      "Law enforcement or regulatory authorities only when required by applicable laws of Pakistan or court orders.",
    ],
  },
  {
    icon: Cookie,
    title: "5. Cookies & Local Storage",
    body: [
      "We use cookies and browser local storage to keep you logged in securely, remember your marketplace filter preferences, save draft proposals, and track read receipts for your conversations.",
      "You can manage cookie settings in your browser, although disabling necessary cookies may prevent authentication and messaging from functioning correctly.",
    ],
  },
  {
    icon: UserCheck,
    title: "6. Your Rights & Data Retention",
    body: [
      "You have the right to access the personal information stored in your account, update your profile details and skills, and request a copy of your task and payment records at any time from your account settings.",
      "You may request account deactivation or deletion by submitting a support ticket. Financial transaction logs are retained for the duration required by Pakistani financial reporting regulations.",
    ],
  },
  {
    icon: Lock,
    title: "7. Security Measures",
    body: [
      "We employ industry-standard encryption (HTTPS/TLS) for data in transit and secure database rules with role-based access control. Sensitive payment credentials are never stored as plain text on our servers.",
      "While we implement rigorous security measures, no web transmission is 100% impenetrable. We urge you to keep your password confidential and notify our support team immediately if you suspect unauthorized access.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "8. Changes to This Policy",
    body: [
      "We may update this Privacy Policy periodically to reflect technological improvements or regulatory updates. We will notify members of material updates on the platform or by email. Continued use of Parwaz after changes become effective signifies your acceptance.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        {/* Hero Header */}
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">PARWAZ POLICIES</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Privacy Policy</h1>
              <p className="mt-1 text-sm text-white/60">
                How we protect, collect, and handle your data on Parwaz. Last updated October 2026.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="surface mt-6 p-6 sm:p-8">
          <p className="text-sm leading-6 text-ink-600">
            At Parwaz (&ldquo;Workly&rdquo;), we take your privacy and financial security seriously. This policy explains what information we collect when you use our marketplace, how it is safeguarded, and how you can manage your preferences.
          </p>

          <div className="mt-6 divide-y divide-ink-100">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.title} className="py-6 first:pt-2 last:pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-base font-black text-ink">{section.title}</h2>
                  </div>
                  <div className="mt-3 space-y-2 pl-10">
                    {section.body.map((p, i) => (
                      <p key={i} className="text-sm leading-6 text-ink-600">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-brand-50/50 p-4 text-xs leading-5 text-ink-600 border border-brand-100">
            Questions regarding your privacy or data protection? Submit a ticket through our{" "}
            <Link href="/help" className="font-bold text-brand hover:underline">
              Help &amp; Support Centre
            </Link>{" "}
            or review our{" "}
            <Link href="/community-guidelines" className="font-bold text-brand hover:underline">
              Community Guidelines
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="font-bold text-brand hover:underline">
              Terms &amp; Conditions
            </Link>
            .
          </div>
        </div>

        {/* Support CTA */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand">
              <ShieldCheck className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em]">Have questions about your data?</h2>
              <p className="mt-0.5 text-sm text-white/60">Our data protection and support team is here to assist.</p>
            </div>
          </div>
          <Link
            href="/help"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700"
          >
            Visit Support Centre <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
