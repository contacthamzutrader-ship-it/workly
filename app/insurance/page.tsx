"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, CheckCircle2, Clock3, FileText, Info, Shield, ShieldCheck, Umbrella, Lock } from "lucide-react";

export default function InsurancePage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><ShieldCheck className="h-7 w-7 text-white" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">WORKLY SAFEGUARD</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Platform Protection &amp; Escrow</h1>
                <p className="mt-1 text-sm text-white/55">How buyer &amp; freelancer protection works on Workly.</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-light/20 px-3.5 py-1.5 text-xs font-extrabold text-brand-light"><Shield className="h-3.5 w-3.5" /> 100% Protected</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Lock className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-ink">Safepay Escrow Protection</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">Client budgets are securely locked in SBP-regulated Safepay escrow before work begins. Freelancers work with 100% payment certainty.</p>
          </div>
          <div className="surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><FileText className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-ink">Milestone &amp; Revision Terms</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">Deliverables are inspected and approved by the client before funds are released. Built-in revision cycles prevent disputes.</p>
          </div>
          <div className="surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Building2 className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-ink">Trust &amp; Reputation</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">AI-verified skill badges, double-blind reviews, and dynamic fraud scoring eliminate non-delivery and scammers.</p>
          </div>
        </div>

        <div className="surface mt-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em] text-ink">The Workly SafeGuard Promise</h2>
              <p className="text-xs font-medium text-ink-400">Built-in financial security for every milestone.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-600">On Workly, you never have to worry about unpaid invoices or disappearing clients. When a contract starts, the client funds the project into a secure digital escrow vault. Freelancers submit proof of work directly on the platform, and funds are automatically transferred to their Workly Wallet upon client satisfaction.</p>
          <p className="mt-3 text-sm leading-6 text-ink-600">In the rare event of a disagreement, our dedicated 24/7 Dispute Resolution Team steps in to review chat transcripts, submitted artifacts, and change logs to ensure an unbiased, mathematically fair outcome.</p>
          <div className="mt-5 rounded-2xl bg-ink-50 p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-ink"><CalendarClock className="h-4 w-4 text-brand" /> Upcoming: Comprehensive Liability Insurance</p>
            <ul className="mt-2 space-y-1.5">
              {["Partnering with leading Pakistani insurance underwriters for physical task liability cover", "Automated accidental damage and property protection for in-person assignments", "Transparent one-click policy opt-in during checkout"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-5 text-ink-500"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" /> {item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/how-it-works" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">See how Workly works <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/cancellation-policy" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-sm font-extrabold text-ink transition hover:bg-ink-50">Cancellation &amp; Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}