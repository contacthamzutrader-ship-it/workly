"use client";

import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, CheckCircle2, FileSearch, GraduationCap, HandCoins, Handshake, Rocket, Star, Target, UserPlus } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Profile Creation",
    desc: "Set up your freelancer profile - photo, professional title, bio, location, skills, experience, education and portfolio so clients know who you are.",
    href: "/profile",
    cta: "Complete your profile",
  },
  {
    icon: GraduationCap,
    title: "Skill Verification",
    desc: "Take the AI skill check to get a verified skill score. Passing it strengthens your options and unlocks the Verified Talent badge.",
    href: "/interview",
    cta: "Take the skill check",
  },
  {
    icon: FileSearch,
    title: "Find Tasks",
    desc: "Browse the task marketplace, filter by category and location, and shortlist tasks that match what you do best.",
    href: "/tasks",
    cta: "Browse tasks",
  },
  {
    icon: Target,
    title: "Submit Offer",
    desc: "Send a clear, priced offer for a task. Minimum offers start at PKR 1,000 and the client chooses the proposal that fits best.",
    href: "/tasks",
    cta: "Place an offer",
  },
  {
    icon: Handshake,
    title: "Get Assigned",
    desc: "When the client selects you, the task budget is held securely and the work officially belongs to you.",
    href: "/dashboard",
    cta: "Open your dashboard",
  },
  {
    icon: CheckCircle2,
    title: "Complete Task",
    desc: "Deliver the work and mark the task complete so the client can confirm it and release payment.",
    href: "/dashboard",
    cta: "View my projects",
  },
  {
    icon: HandCoins,
    title: "Receive Payment",
    desc: "Payment is released to your wallet after approval. A 15% platform fee is applied and you can track every transaction.",
    href: "/payment-history",
    cta: "View payment history",
  },
  {
    icon: Star,
    title: "Build Reputation",
    desc: "Every completed task grows your trust score, ratings and badges - which makes the next client choose you faster.",
    href: "/badges",
    cta: "See your badges",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Rocket className="h-7 w-7" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">YOUR JOURNEY ON PARWAZ</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">How it works</h1>
                <p className="mt-1 text-sm text-white/55">The freelancer journey, end to end - from your first profile to a proven reputation.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65"><Award className="h-4 w-4 text-brand-300" /> {STEPS.length} steps to earnings</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {STEPS.map((step, i) => (
            <div key={step.title} className="surface relative flex flex-col p-6">
              <span className="absolute right-5 top-5 text-4xl font-black leading-none text-ink-50">{i + 1}</span>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><step.icon className="h-5 w-5" /></span>
                <h2 className="text-lg font-black tracking-[-0.03em] text-ink">{step.title}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-500">{step.desc}</p>
              <div className="mt-auto pt-4">
                <Link href={step.href} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 text-xs font-extrabold text-brand transition hover:bg-brand-50">{step.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand"><BadgeCheck className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em]">Ready to start earning?</h2>
                <p className="mt-0.5 text-sm text-white/55">Complete your profile and skill check first - your offers will thank you later.</p>
              </div>
            </div>
            <Link href="/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Set up my profile <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}