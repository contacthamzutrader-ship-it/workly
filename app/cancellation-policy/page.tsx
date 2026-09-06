import Link from "next/link";
import { ArrowRight, Banknote, FileX2, History, MoveLeft, ShieldCheck, ShieldQuestion } from "lucide-react";

export default function CancellationPolicyPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><FileX2 className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">PARWAZ POLICIES</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Cancellation Policy</h1>
              <p className="mt-1 text-sm text-white/55">What happens when a task or project is cancelled. Last updated September 2026.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <p className="text-sm leading-6 text-ink-600">This page describes how cancellation currently works on Parwaz, based on how tasks and payments are actually handled in the app. A cancelled task is one that has been moved to the <span className="font-bold text-ink">cancelled</span> status and closed for work.</p>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-4 rounded-2xl border border-ink-100 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><ShieldQuestion className="h-5 w-5" /></span>
              <div>
                <h2 className="text-sm font-black text-ink">When a task can be cancelled</h2>
                <p className="mt-1.5 text-xs leading-5 text-ink-500">A client can cancel a task they posted, usually because the job is no longer needed, terms were not met, or the task was a mistake. The platform may also take a task down - for example when it violates the community guidelines. Either way the task is closed to new offers.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-ink-100 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Banknote className="h-5 w-5" /></span>
              <div>
                <h2 className="text-sm font-black text-ink">What happens to a held budget</h2>
                <p className="mt-1.5 text-xs leading-5 text-ink-500">If a task had its budget held for payment, cancellation means that held amount is <span className="font-bold text-ink">not released to the freelancer</span> and no payment is taken from the client. In your payment history a cancelled task appears with the status <span className="font-bold text-red-600">Cancelled</span> and a net received amount of PKR 0. The payment history never invents a payout or store credit - what you see is exactly what the system recorded.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-ink-100 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><MoveLeft className="h-5 w-5" /></span>
              <div>
                <h2 className="text-sm font-black text-ink">Offers and the task goes closed</h2>
                <p className="mt-1.5 text-xs leading-5 text-ink-500">Once a task is cancelled, no more offers can be submitted or selected for it. Any freelancer who had an offer open simply no longer competes for that work, and the task disappears from the active marketplace.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-ink-100 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><History className="h-5 w-5" /></span>
              <div>
                <h2 className="text-sm font-black text-ink">Effect on stats and reputation</h2>
                <p className="mt-1.5 text-xs leading-5 text-ink-500">Cancelled tasks are tracked separately from completed work. They show up under the &ldquo;Cancelled&rdquo; view in your dashboard and are included in the completion-rate calculation, so frequent cancellations can slowly affect the metrics clients see on your profile.</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-ink-600">Cancellation disputes are resolved through our support team using the evidence recorded on the task - messages, status history and payment records. There is currently no automated refund-to-wallet flow beyond the held-amount handling described above; if a payment needs reversing for a genuine reason, our team will see it through manually and you will be informed before anything changes.</p>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand"><ShieldCheck className="h-6 w-6" /></span>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em]">Need to dispute a cancellation?</h2>
              <p className="mt-0.5 text-sm text-white/55">Message our support team and we will investigate the task records.</p>
            </div>
          </div>
          <Link href="/messages" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Contact support <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}