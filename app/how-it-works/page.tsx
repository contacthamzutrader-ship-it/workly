"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  Gavel,
  HardHat,
  MessageSquare,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { PLATFORM_FEE } from "@/lib/tasks";

const CLIENT_STEPS = [
  { icon: BriefcaseBusiness, title: "Post your task", body: "Describe the outcome, set a budget, and choose your timing. Posting is always free." },
  { icon: ShieldCheck, title: "Parwaz reviews it", body: "Smart checks or a human moderator confirm the task is genuine before freelancers see it." },
  { icon: Gavel, title: "Compare real offers", body: "Each offer shows a price, a plan, a delivery time and the freelancer's verified track record." },
  { icon: Wallet, title: "Hire and fund", body: "Choose an offer. The agreed amount is held against the contract so both sides are protected." },
  { icon: MessageSquare, title: "Track the work", body: "A private chat opens with your freelancer. Everything stays on the record." },
  { icon: CheckCircle2, title: "Approve and pay", body: "Review the delivery. Approve to release payment, or request changes first." },
];

const FREELANCER_STEPS = [
  { icon: HardHat, title: "Build your profile", body: "Add your skills, rate and real examples. Complete profiles rank far higher in matching." },
  { icon: Sparkles, title: "Get verified", body: "Take the short Parwaz skills interview. A human reviewer approves your badge." },
  { icon: Send, title: "Send sharp offers", body: "Explain your approach and timeline. You always see your exact take-home before sending." },
  { icon: CheckCircle2, title: "Get hired", body: "When a client accepts, funds are already held. You can start with confidence." },
  { icon: Send, title: "Deliver the work", body: "Submit your delivery note. The client reviews it and either approves or asks for changes." },
  { icon: Banknote, title: "Get paid", body: `Payment is released to your balance minus the ${Math.round(PLATFORM_FEE * 100)}% service fee.` },
];

const FAQS = [
  {
    question: "What does it cost?",
    answer: `Posting a task is free. Parwaz takes a ${Math.round(PLATFORM_FEE * 100)}% service fee from the freelancer's payment on completed work. The fee is shown before an offer is sent and fixed at the moment of hire.`,
  },
  {
    question: "Can I be both a client and a freelancer?",
    answer: "Yes. One account covers both. Switch modes from your account menu at any time — your history, reviews and messages stay in one place.",
  },
  {
    question: "When is money released?",
    answer: "The agreed amount is held when you hire. It is released only when you approve the delivery. If you cancel before approval, held funds return to your Parwaz balance.",
  },
  {
    question: "What if something goes wrong?",
    answer: "Start with the private task chat — most issues are solved there. If not, either side can raise a dispute and a Parwaz reviewer looks at the full on-platform record before deciding.",
  },
  {
    question: "Why must I keep everything on Parwaz?",
    answer: "Off-platform payments and contact sharing remove every protection you have: no held funds, no evidence trail, no dispute process. Our systems flag attempts to move work off the platform.",
  },
  {
    question: "How does verification work?",
    answer: "Freelancers answer four structured, role-specific questions and show real evidence. AI prepares a summary, and a human reviewer makes the final badge decision. AI never decides on its own.",
  },
];

export default function HowItWorksPage() {
  const [audience, setAudience] = useState<"client" | "freelancer">("client");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const steps = audience === "client" ? CLIENT_STEPS : FREELANCER_STEPS;

  return (
    <div className="bg-canvas">
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-70" />
        <div className="page-shell relative py-16 text-center sm:py-20">
          <span className="eyebrow mx-auto">
            <Sparkles className="h-3.5 w-3.5" /> How Parwaz works
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.03] tracking-[-0.05em] text-ink sm:text-6xl">
            Simple to use. Serious about protection.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-ink-500">
            From posting to payment, every step is on the record — so both sides know exactly where they stand.
          </p>

          <div className="mx-auto mt-9 inline-flex rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card">
            {(
              [
                ["client", "I want to hire"],
                ["freelancer", "I want to work"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAudience(value)}
                className={`rounded-xl px-5 py-3 text-sm font-black transition ${
                  audience === value ? "bg-brand text-white shadow-glow" : "text-ink-500 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-14 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="surface p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-3xl font-black tracking-tighter text-ink-100">{index + 1}</span>
              </div>
              <h2 className="mt-5 text-lg font-black tracking-[-0.02em] text-ink">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="payments" className="scroll-mt-24 bg-ink py-16 text-white sm:py-20">
        <div className="page-shell">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-brand-300">
                <Wallet className="h-3.5 w-3.5" /> Payments
              </span>
              <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Money moves only when the work is approved.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/60">
                When a client hires, the agreed amount is held against the contract. The freelancer delivers, the client
                reviews, and payment is released on approval. No guesswork, no chasing.
              </p>

              <dl className="mt-8 space-y-4">
                {[
                  ["Client pays", "The accepted offer amount, held at hire."],
                  [`Service fee (${Math.round(PLATFORM_FEE * 100)}%)`, "Deducted from the freelancer's payment, disclosed up front."],
                  ["Freelancer receives", "The offer amount minus the service fee, on approval."],
                  ["Cancelled before approval", "Held funds return to the client's Parwaz balance."],
                ].map(([term, description]) => (
                  <div key={term} className="border-l-2 border-brand pl-4">
                    <dt className="text-sm font-black">{term}</dt>
                    <dd className="mt-0.5 text-sm text-white/55">{description}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-brand-light" />
                <p className="text-sm font-black">Honest status of live payments</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Parwaz currently records contract balances internally. Before real customer money moves, we must complete
                marketplace and held-funds approval with a State Bank of Pakistan-regulated payment provider, with signed
                server-side webhooks and a proper double-entry ledger.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/60">
                We would rather tell you this plainly than call an internal number &ldquo;escrow&rdquo;.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="scroll-mt-24 page-shell py-16 sm:py-20">
        <div className="text-center">
          <span className="eyebrow mx-auto">
            <ShieldCheck className="h-3.5 w-3.5" /> Trust & safety
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
            What actually keeps both sides safe.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Reviewed tasks", body: "Public tasks pass smart checks or human moderation before anyone can bid." },
            { icon: Star, title: "Human-reviewed badges", body: "Verified freelancers showed real evidence to a real reviewer." },
            { icon: MessageSquare, title: "On-record chat", body: "Every message is part of the task trail if a dispute ever happens." },
            { icon: Scale, title: "Neutral disputes", body: "A Parwaz reviewer looks at the evidence. AI summarises; humans decide." },
          ].map((item) => (
            <div key={item.title} className="surface p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-black text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">Common questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq, index) => (
              <div key={faq.question} className="surface overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-base font-black text-ink">{faq.question}</span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-50 text-ink-500 transition ${
                      openFaq === index ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === index && (
                  <p className="animate-slide-up border-t border-ink-100 p-5 text-sm leading-7 text-ink-600">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="overflow-hidden rounded-[32px] bg-brand p-8 text-white shadow-glow sm:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Ready to start?</h2>
              <p className="mt-3 text-base leading-7 text-white/80">
                Create one free account. Hire when you need help, earn when you have time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button className="bg-white text-ink shadow-none hover:bg-brand-50">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="ghost" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                  Browse open tasks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
