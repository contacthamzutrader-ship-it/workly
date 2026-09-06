import Link from "next/link";
import { FileText } from "lucide-react";

const SECTIONS: { title: string; body: string[] }[] = [
  { title: "1. Introduction", body: ["These Terms and Conditions govern your use of the Parwaz platform and its services. By creating an account, posting a task, submitting an offer, or otherwise using the platform, you agree to be bound by these terms, our Community Guidelines and our Cancellation Policy.", "The platform connects clients who need tasks done with freelancers who can complete them. Parwaz acts as the platform for this marketplace and handles payment processing and protection on the platform."] },
  { title: "2. Accounts and eligibility", body: ["You must be at least 18 years old to register and use the platform. You must provide accurate registration details - including a valid email address - and keep them up to date in your account settings.", "You are responsible for everything done under your account. Keep your login details secure and do not share them. Accounts may not be transferred without our consent, and one person may not operate multiple accounts."] },
  { title: "3. Using the marketplace", body: ["Clients post tasks with a clear description, category, location and budget. Freelancers submit offers on tasks they can complete. A task is assigned when a client selects an offer, after which the task budget is held securely for the duration of the work.", "You must only use the platform for its intended purpose. Posting illegal, misleading, unsafe or prohibited tasks, and circumventing the platform to arrange payments outside the platform, are breaches of these terms."] },
  { title: "4. Payments and fees", body: ["All task payments are made through the platform. When work is completed and approved, the held amount is released to the freelancer's payment records after a 15% platform fee is deducted on each payment.", "Freelancer offers start at a minimum amount of PKR 1,000. Payment records, including totals, platform deductions and net received amounts, are available to every user in their payment history."] },
  { title: "5. Rights of use", body: ["We grant you a limited, non-exclusive, revocable right to use the platform in line with these terms. You retain the rights to the content you submit - tasks, offers, messages and portfolio items - and you grant us a licence to store and display that content to operate the platform.", "You may not copy, scrape, reverse-engineer or resell any part of the platform, its data or its content without our written permission."] },
  { title: "6. Acceptable use", body: ["You agree not to harass, defame, threaten or deceive other users; to not attempt to access another user's account; to not distribute malware; and to not attempt to disrupt the platform or its services.", "Conduct that violates our Community Guidelines may result in warnings, restricted features or account suspension, at our discretion."] },
  { title: "7. Cancellations and disputes", body: ["Task cancellations are handled in line with the Cancellation Policy. When a task is cancelled, its held budget is not released to the freelancer and the task is closed to new offers. Cancelled work appears separately in your history and metrics.", "Disputes are reviewed by our support team using the records on the task. We aim to resolve disputes fairly and promptly, but we do not guarantee an outcome in any particular user's favour."] },
  { title: "8. Disclaimers and limitation of liability", body: ["The platform is provided 'as is' and, to the maximum extent permitted by law, we make no warranties about its availability, fitness for a particular purpose or the outcomes of any task. Freelancers are independent providers, not our employees.", "To the maximum extent permitted by law, Parwaz is not liable for indirect, incidental, special or consequential damages, or for loss of profits or data, arising out of your use of the platform. Our total liability arising from these terms is limited to the aggregate fees you have paid us in the preceding six months."] },
  { title: "9. Termination", body: ["You may close your account at any time from your account settings. We may suspend or terminate access for breaches of these terms or applicable law, or where required by regulators.", "On termination you remain responsible for obligations that have accrued - including completing or settling already-assigned tasks - and the relevant sections of these terms continue to apply."] },
  { title: "10. Changes to these terms", body: ["We may update these terms from time to time to reflect changes in the platform or the law. Where material changes are made we will notify you on the platform. Continuing to use the platform after changes take effect means you accept the updated terms."] },
  { title: "11. Governing law and contact", body: ["These terms are governed by the applicable laws of Pakistan. Questions, complaints or requests related to these terms can be sent through the Contact Us link in the app, and we will respond to your message."] },
];

export default function TermsPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><FileText className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">PARWAZ POLICIES</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Terms and Conditions</h1>
              <p className="mt-1 text-sm text-white/55">The agreement that applies when you use the Parwaz platform. Last updated September 2026.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <p className="text-sm leading-6 text-ink-600">Please read these terms carefully before using Parwaz. They form a legal agreement between you and the platform. If you do not agree with any part of them, you should not register or continue to use the platform.</p>
          <div className="mt-6 divide-y divide-ink-100">
            {SECTIONS.map((section) => (
              <section key={section.title} className="py-5 first:pt-0 last:pb-0">
                <h2 className="text-base font-black text-ink">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="mt-2 text-sm leading-6 text-ink-600">{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-ink-50 p-4 text-xs leading-5 text-ink-500">These terms work together with the <Link href="/community-guidelines" className="font-bold text-brand">Community Guidelines</Link> and the <Link href="/cancellation-policy" className="font-bold text-brand">Cancellation Policy</Link>, which you should also read.</div>
        </div>
      </div>
    </div>
  );
}