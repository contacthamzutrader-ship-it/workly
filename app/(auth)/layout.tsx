import { BadgeCheck, ShieldCheck, Sparkles, Star } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 noise opacity-50" />
        <div className="absolute -left-32 bottom-10 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-300"><Sparkles className="h-3.5 w-3.5" /> Workly membership</span>
          <h1 className="mt-8 max-w-lg text-5xl font-black leading-[1.02] tracking-[-0.05em]">One account. Two ways to move forward.</h1>
          <p className="mt-5 max-w-lg text-base font-medium leading-7 text-white/55">Hire trusted professionals when you need help. Switch to earning mode when your skills can help someone else.</p>
        </div>
        <div className="relative">
          <div className="max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-sun text-sun" />)}</div>
            <p className="mt-4 text-lg font-black leading-7">&ldquo;Clear offers, secure payments and no confusion about who is responsible for what.&rdquo;</p>
            <div className="mt-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-sm font-black">AK</span><div><p className="text-sm font-black">Marketplace member</p><p className="text-xs text-white/40">Verified on Workly</p></div><BadgeCheck className="ml-auto h-5 w-5 text-brand-light" /></div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-white/45"><ShieldCheck className="h-4 w-4 text-brand-light" /> Your identity and payment activity stay protected.</div>
        </div>
      </aside>
      <main className="flex items-center justify-center bg-canvas px-4 py-12 sm:px-8">{children}</main>
    </div>
  );
}
