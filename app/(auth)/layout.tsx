import { Gavel, LockKeyhole, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Gavel,
    title: "Compare structured offers",
    body: "Review price, proposed timeline and the freelancer profile before you choose.",
  },
  {
    icon: ShieldCheck,
    title: "A moderated marketplace",
    body: "Tasks and account activity can be reviewed before they reach the wider marketplace.",
  },
  {
    icon: UserCheck,
    title: "One accountable identity",
    body: "Each member uses one account and can switch between client and freelancer modes.",
  },
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
            Start as a client or a freelancer and keep your profile, messages and marketplace history under one identity.
          </p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-light">
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-black">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-white/50">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/20 text-brand-light">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black">Account integrity comes first</p>
              <p className="mt-1 text-[13px] leading-5 text-white/50">
                Email accounts receive verification, Google login cannot silently create a membership, and staff access is invitation-only.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-12">{children}</main>
    </div>
  );
}
