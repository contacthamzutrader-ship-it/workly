"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, CheckCircle2, Clock3, FileText, Info, Shield, Umbrella } from "lucide-react";

export default function InsurancePage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Umbrella className="h-7 w-7" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Parwaz protection</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Insurance</h1>
                <p className="mt-1 text-sm text-white/55">How protection works on the Parwaz platform.</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/15 px-3.5 py-1.5 text-xs font-extrabold text-amber-300"><Clock3 className="h-3.5 w-3.5" /> Coming soon</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Shield className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-ink">Task payment protection</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">Client budgets are held securely while a task is in progress, so freelancers get paid only for delivered work.</p>
          </div>
          <div className="surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><FileText className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-ink">Clear terms of protection</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">Every assignment runs under the platform&apos;s community guidelines, cancellation policy and terms and conditions.</p>
          </div>
          <div className="surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Building2 className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-ink">Trust &amp; reputation</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">Trust scores, verified identities and reviews build a safer marketplace for everyone.</p>
          </div>
        </div>

        <div className="surface mt-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Info className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em] text-ink">Dedicated insurance cover is on its way</h2>
              <p className="text-xs font-medium text-ink-400">We are being honest: this feature is not live yet.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-600">At this stage the platform does not operate a real insurance service. There are no active policies, premiums or claims to buy or manage here - the existing protections described above are built into how tasks and payments are handled.</p>
          <p className="mt-3 text-sm leading-6 text-ink-600">A formal insurance offering - covering things like on-site damage or liability while completing a task - is planned. When it becomes available it will be clearly announced, and you will only ever enrol through an official flow with full policy details. Until then no part of this page sells or imitates insurance.</p>
          <div className="mt-5 rounded-2xl bg-ink-50 p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-ink"><CalendarClock className="h-4 w-4 text-brand" /> What we are doing now</p>
            <ul className="mt-2 space-y-1.5">
              {["Reviewing coverage models for common tasker and client risks", "Working with insurance partners on policy design and compliance", "Publishing full policy terms and a claim process before launch"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-5 text-ink-500"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" /> {item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/how-it-works" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">See how Parwaz works <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/#trust" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-sm font-extrabold text-ink transition hover:bg-ink-50">Read the trust &amp; safety page</Link>
          </div>
        </div>
      </div>
    </div>
  );
}