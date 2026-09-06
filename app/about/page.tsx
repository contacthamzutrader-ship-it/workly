import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake, HeartHandshake, Landmark } from "lucide-react";

const VALUES: { icon: any; title: string; text: string }[] = [
  { icon: Handshake, title: "Local trust", text: "Parwaz is built for Pakistani clients and freelancers, with payments in PKR, on-time settlement and real people behind every task." },
  { icon: BadgeCheck, title: "Verified skills", text: "Freelancers prove their skill through real assessments before they can advertise themselves, so clients know who they are hiring." },
  { icon: Landmark, title: "Held payments", text: "Task budgets are held securely and only released to the freelancer when the client is satisfied with the completed work." },
  { icon: HeartHandshake, title: "Fair to everyone", text: "A single transparent 15% platform fee, no hidden charges, and honest policies that match how the product actually behaves." },
];

export default function AboutPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><HeartHandshake className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">ABOUT PARWAZ</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">About Us</h1>
              <p className="mt-1 text-sm text-white/55">The story, mission and values behind the platform.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-[-0.03em] text-ink">Who we are</h2>
          <p className="mt-3 text-sm leading-6 text-ink-600">Parwaz (meaning &ldquo;flight&rdquo;) is a local freelance marketplace that helps you get real tasks done and earn from the skills you already have. Whether you need a logo, a website, home services or an expert&apos;s opinion, Parwaz connects you directly with verified people who can deliver - with payment protection on both sides.</p>
          <h2 className="mt-8 text-lg font-black tracking-[-0.03em] text-ink">Why we exist</h2>
          <p className="mt-3 text-sm leading-6 text-ink-600">Freelancers lose money to platforms that never pay, and clients lose time to people who never deliver. We&apos;re building the alternative: a marketplace where every payment runs on the platform, every skill is actually verified through an interview, and every rule is written down in plain language. If a feature does not exist yet, we say so - because trust starts with honesty.</p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl border border-ink-100 p-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand"><value.icon className="h-4 w-4" /></span><h3 className="text-sm font-black text-ink">{value.title}</h3></div>
                <p className="mt-2 text-xs leading-5 text-ink-500">{value.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-ink-50 p-4 text-sm leading-6 text-ink-600">
            <p className="font-black text-ink">Get started today</p>
            <p className="mt-1">Clients post a task and get offers in minutes. Freelancers complete a free skill check and start earning.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/tasker" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Start as a freelancer <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/post-task" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">Post a task</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}