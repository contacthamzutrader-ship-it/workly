import { BadgeCheck, Gavel, ShieldCheck, Sparkles, Star, Wallet } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Gavel, title: "Compare real offers", body: "Every offer shows price, timeline and evidence of past work." },
  { icon: ShieldCheck, title: "Reviewed before it goes live", body: "Tasks pass smart checks or a human moderator." },
  { icon: Wallet, title: "Pay when you approve", body: "Funds are held against the contract until you sign off." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-74px)] bg-canvas lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 noise opacity-50" />
        <div className="absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-brand/25 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Workly membership
          </span>
          <h1 className="mt-8 max-w-lg text-[44px] font-black leading-[1.02] tracking-[-0.05em] xl:text-5xl">
            One account. Hire and get hired.
          </h1>
          <p className="mt-5 max-w-md text-base font-medium leading-7 text-white/55">
            Start as a client or a freelancer — you can switch modes any time without creating a second account.
          </p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-light">
                  <item.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </span>
                <div>
                  <p className="text-sm font-black">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-white/50">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((index) => (
                <Star key={index} className="h-4 w-4 fill-sun text-sun" />
              ))}
            </div>
            <p className="mt-4 text-lg font-black leading-7">
              &ldquo;Clear offers, protected payments, and no confusion about who is responsible for what.&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-sm font-black">AK</span>
              <div>
                <p className="text-sm font-black">Marketplace member</p>
                <p className="text-xs text-white/40">Verified on Workly</p>
              </div>
              <BadgeCheck className="ml-auto h-5 w-5 text-brand-light" />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">{children}</main>
    </div>
  );
}
