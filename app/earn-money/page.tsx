"use client";

import Link from "next/link";
import { ArrowRight, Coins, FileSearch, HandCoins, Handshake, LineChart, Palette, Rocket, Wrench } from "lucide-react";

const WAYS = [
  {
    icon: Wrench,
    title: "Handyman & home services",
    desc: "Cleaning, furniture assembly, painting and repairs - the everyday tasks clients post most.",
  },
  {
    icon: FileSearch,
    title: "IT, web & design",
    desc: "Websites, Shopify stores, graphics, and marketing tasks that reward specialist skills.",
  },
  {
    icon: Palette,
    title: "Creative & lifestyle",
    desc: "Photography, cooking, pet care, tutoring and gardening - almost any skill can be offered.",
  },
  {
    icon: LineChart,
    title: "Business & admin",
    desc: "Virtual assistance, data entry, listing management and admin support for busy clients.",
  },
];

export default function EarnMoneyPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Coins className="h-7 w-7" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">FOR FREELANCERS</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Earn money on Parwaz</h1>
                <p className="mt-1 text-sm text-white/55">Turn your skills into income with real, local tasks.</p>
              </div>
            </div>
            <Link href="/tasks" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Browse available tasks <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-[-0.03em] text-ink">What you can get paid for</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">The most in-demand categories on the marketplace today. How much you earn depends on the task budget and the strength of your offer.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WAYS.map((way) => (
              <div key={way.title} className="rounded-2xl border border-ink-100 p-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand"><way.icon className="h-4 w-4" /></span><h3 className="text-sm font-black text-ink">{way.title}</h3></div>
                <p className="mt-2 text-xs leading-5 text-ink-500">{way.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface mt-5 p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-[-0.03em] text-ink">How the money flows</h2>
          <div className="mt-5 space-y-4">
            {[
              { icon: FileSearch, step: "1. Place a strong offer", text: "Review the task, check the budget and send an offer. Proposals start at PKR 1,000." },
              { icon: Handshake, step: "2. Get selected", text: "When the client picks you, the budget is held securely so you are protected." },
              { icon: Rocket, step: "3. Deliver the work", text: "Complete the task on time and the client approves what you delivered." },
              { icon: HandCoins, step: "4. Get paid", text: "The held amount is released to your wallet. A flat 15% platform fee is applied on each payment." },
            ].map((row) => (
              <div key={row.step} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><row.icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-black text-ink">{row.step}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-500">{row.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand"><Rocket className="h-6 w-6" /></div>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em]">Your next step</h2>
              <p className="mt-0.5 text-sm text-white/55">Point clients to a finished profile, then go find your first task.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Finish my profile</Link>
            <Link href="/how-it-works" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/20">How it works</Link>
          </div>
        </div>
      </div>
    </div>
  );
}