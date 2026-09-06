import Link from "next/link";
import { ArrowRight, Ban, FileText, HandHeart, ShieldCheck, Sparkles, Wallet } from "lucide-react";

const RULES: { icon: any; title: string; text: string }[] = [
  { icon: HandHeart, title: "Be respectful", text: "Treat every client and freelancer with respect. Harassment, hate speech, threats or discrimination in any form are not allowed on the platform." },
  { icon: Sparkles, title: "Be honest", text: "Use your real details, deliver what you promised, and represent your skills accurately. Misleading profiles or offers undermine trust for everyone." },
  { icon: Wallet, title: "Keep payments on the platform", text: "All task payments flow through Parwaz. Paying off-platform to avoid fees or to bypass protection is a violation of the terms and endangers both sides." },
  { icon: ShieldCheck, title: "Stay safe & legal", text: "Only post and accept tasks that are legal. Never trade prohibited goods or services, and never ask another user to do anything unlawful." },
  { icon: Ban, title: "No spam or abuse", text: "Do not spam offers, bulk-message users for unrelated marketing, self-promote outside your profile, or try to manipulate reviews and ratings." },
  { icon: FileText, title: "Protect private information", text: "Keep other users' personal details private. Never request, store or share sensitive information such as passwords, IDs or financial data." },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><ShieldCheck className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">PARWAZ COMMUNITY</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Community Guidelines</h1>
              <p className="mt-1 text-sm text-white/55">The ground rules that keep Parwaz fair, safe and useful for everyone. Last updated September 2026.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <p className="text-sm leading-6 text-ink-600">Parwaz is a local, trusted marketplace where clients post tasks and freelancers complete them. These guidelines explain what we expect of every member. By using the platform you agree to follow them, and to our <Link href="/terms" className="font-bold text-brand underline decoration-brand/30 underline-offset-2">Terms and Conditions</Link>.</p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RULES.map((rule) => (
              <div key={rule.title} className="rounded-2xl border border-ink-100 p-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand"><rule.icon className="h-4 w-4" /></span><h2 className="text-sm font-black text-ink">{rule.title}</h2></div>
                <p className="mt-2 text-xs leading-5 text-ink-500">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface mt-5 p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-[-0.03em] text-ink">Enforcement</h2>
          <div className="mt-3 space-y-3">
            {[
              "We review reported users and take action proportionate to the issue - from a warning to removal from the platform.",
              "Accounts that repeatedly break the guidelines, or engage in fraud, unsafe behaviour or abuse, may be suspended immediately.",
              "You can report a problem from any conversation or task, or by messaging our support team through the app.",
              "Disputes around payments follow the Cancellation Policy, and all activity on Parwaz is subject to the Terms and Conditions.",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2.5 text-sm leading-6 text-ink-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {item}</p>
            ))}
          </div>
          <Link href="/help" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Report or ask for help <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}