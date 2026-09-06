"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Gift, Info } from "lucide-react";

export default function GiftCardsPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Gift className="h-7 w-7" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Parwaz marketplace</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Gift Cards</h1>
                <p className="mt-1 text-sm text-white/55">How gifting works on Parwaz.</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/15 px-3.5 py-1.5 text-xs font-extrabold text-amber-300"><Clock3 className="h-3.5 w-3.5" /> Coming soon</span>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Info className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em] text-ink">Gift cards are not available yet</h2>
              <p className="text-xs font-medium text-ink-400">We are being honest: this feature is not live.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-600">Parwaz does not currently sell gift cards or store gift-card balances. You cannot buy, redeem or top up a gift card on the platform today, and no existing balance can be converted into one.</p>
          <p className="mt-3 text-sm leading-6 text-ink-600">A gift-card programme - letting you buy a card for a friend and let them spend its value on tasks with vetted freelancers - is being planned. When it launches, this page will explain exactly how to buy, check a balance and redeem a card. Until then, no part of this page sells gift cards.</p>
        </div>

        <div className="mt-5 rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand"><Gift className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em]">A better gift: help someone finish a task</h2>
                <p className="mt-0.5 text-sm text-white/55">While gift cards are on the way, you can post a task and let a trusted freelancer handle it for the people you care about.</p>
              </div>
            </div>
            <Link href="/post" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Post a task <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {["Buy and redeem in official flows only", "No hidden fees ever added on this page", "Launch announced on the news feed"].map((item) => (
              <p key={item} className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-xs leading-5 text-white/70"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-light" /> {item}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}