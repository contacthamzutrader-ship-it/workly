"use client";

import Link from "next/link";
import { ArrowRight, FileText, HelpCircle, Mail, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

const FAQS: { q: string; a: string; href?: string; cta?: string }[] = [
  {
    q: "How do I find my first task?",
    a: "Complete your profile, then browse the marketplace, filter by category or location, and send an offer on tasks that match your skills.",
    href: "/tasks",
    cta: "Browse tasks",
  },
  {
    q: "What is the AI skill check?",
    a: "A short assessment that scores your skills and improves how often your offers are recommended. Passing it also unlocks the Verified Talent badge.",
    href: "/interview",
    cta: "Take the skill check",
  },
  {
    q: "When and how do I get paid?",
    a: "After a client approves a task, the held budget is released to your wallet. A 15% platform fee applies per payment. Track everything in your payment history.",
    href: "/payment-history",
    cta: "View payment history",
  },
  {
    q: "How is an offer priced?",
    a: "Proposals start at PKR 1,000. Clear, realistic pricing for the task scope gives the client a reason to select you.",
    href: "/how-it-works",
    cta: "See the full journey",
  },
  {
    q: "What happens if a task gets cancelled?",
    a: "Cancellations follow the platform&#39;s cancellation policy - the held budget is not released to the freelancer and the task is closed to new offers.",
    href: "/cancellation-policy",
    cta: "Read the cancellation policy",
  },
  {
    q: "How do I build my reputation?",
    a: "Every completed task grows your trust score and badges. Badges are always earned from real actions - never awarded manually.",
    href: "/badges",
    cta: "See your badges",
  },
];

export default function HelpPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><HelpCircle className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">SUPPORT CENTRE</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Help &amp; Support</h1>
              <p className="mt-1 text-sm text-white/55">Find answers about Parwaz, or talk to a real person.</p>
            </div>
          </div>
        </div>

<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: Sparkles, title: "How it works", desc: "The full freelancer journey, step by step.", href: "/how-it-works" },
              { icon: MessageCircle, title: "Contact us", desc: "Open the contact form and tell us the issue.", href: "/contact" },
              { icon: ShieldCheck, title: "Trust & safety", desc: "Guidelines, insurance and cancellation policies.", href: "/insurance" },
              { icon: Mail, title: "Learn more", desc: "Guides and articles on getting started.", href: "/how-it-works" },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="group surface flex items-center gap-4 p-5 transition hover:border-brand/30">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><card.icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-ink">{card.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-400">{card.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>

          <div className="surface mt-5 p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><FileText className="h-5 w-5" /></span>
              <h2 className="text-base font-black tracking-[-0.03em] text-ink">Help topics</h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { title: "Help & support", desc: "Answers and contact channels.", href: "/help" },
                { title: "Community Guidelines", desc: "Platform rules and behaviour.", href: "/community-guidelines" },
                { title: "Cancellation Policy", desc: "What happens when a task is cancelled.", href: "/cancellation-policy" },
                { title: "Terms and Conditions", desc: "The agreement that applies to all users.", href: "/terms" },
                { title: "Blog", desc: "Guides and updates from the team.", href: "/blog" },
                { title: "About Us", desc: "The story and mission behind Parwaz.", href: "/about" },
              ].map((topic) => (
                <Link key={topic.title} href={topic.href} className="group flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3 transition hover:border-brand/30 hover:bg-brand-50">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">{topic.title}</p>
                    <p className="mt-0.5 text-xs leading-4 text-ink-400">{topic.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              ))}
            </div>
          </div>

        <div className="surface mt-5 p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-[-0.03em] text-ink">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-ink-100">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-ink [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink-100 text-ink-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-ink-500">{faq.a}</p>
                {faq.href && (
                  <Link href={faq.href} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-extrabold text-white transition hover:bg-brand-700">{faq.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
                )}
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand"><MessageCircle className="h-6 w-6" /></div>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em]">Still stuck?</h2>
              <p className="mt-0.5 text-sm text-white/55">Our support team replies to every message.</p>
            </div>
          </div>
          <Link href="/messages" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Contact us <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}