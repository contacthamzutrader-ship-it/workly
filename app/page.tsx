"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Gavel,
  Hammer,
  Laptop2,
  MapPin,
  MessageSquareText,
  Paintbrush,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserRoundCheck,
  WandSparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { formatPKR } from "@/lib/format";

const categories = [
  { icon: Wrench, name: "Handyman", count: "Plumbing, electric & more", tone: "bg-orange-50 text-orange-600" },
  { icon: Laptop2, name: "IT & Web", count: "Apps, sites & support", tone: "bg-indigo-50 text-indigo-600" },
  { icon: Paintbrush, name: "Design", count: "Branding & creative", tone: "bg-pink-50 text-pink-600" },
  { icon: Truck, name: "Moving", count: "Delivery & relocation", tone: "bg-sky-50 text-sky-600" },
  { icon: BriefcaseBusiness, name: "Business & Admin", count: "Admin & marketing", tone: "bg-amber-50 text-amber-700" },
  { icon: Hammer, name: "Furniture Assembly", count: "Assembly & maintenance", tone: "bg-emerald-50 text-emerald-700" },
];

const liveTasks = [
  { title: "Shopify store speed optimisation", place: "Remote", bids: 8, price: 45000, match: 96 },
  { title: "Move office furniture in DHA", place: "Lahore", bids: 5, price: 18000, match: 91 },
  { title: "Brand identity for a chai cafe", place: "Karachi", bids: 12, price: 60000, match: 88 },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-white">
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-70" />
        <div className="pointer-events-none absolute -left-40 top-36 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="page-shell relative grid min-h-[720px] items-center gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <div className="animate-fade-up">
            <div className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Built for Pakistan&apos;s next economy</div>
            <h1 className="mt-7 max-w-3xl text-balance text-[44px] font-black leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[76px]">
              The right person for <span className="relative whitespace-nowrap text-brand">every task.<span className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-sun/55" /></span>
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-ink-500">
              Post local or digital work, compare verified professionals, and pay only when the job is done right.
            </p>

            <div className="mt-9 flex max-w-xl flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-2.5 shadow-elevated sm:flex-row">
              <Link href="/tasks" className="flex min-h-14 flex-1 items-center gap-3 rounded-xl bg-ink-50 px-4 text-sm font-semibold text-ink-400 transition hover:bg-ink-100">
                <Search className="h-5 w-5 text-brand" /> What do you need help with?
              </Link>
              <Link href="/post" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-extrabold text-white shadow-glow transition hover:bg-brand-dark">
                Post a task <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-extrabold text-ink-500">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> Free to post</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> Protected payments</span>
              <span className="flex items-center gap-1.5"><UserRoundCheck className="h-4 w-4 text-brand" /> Verified talent</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sun/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-ink p-4 shadow-elevated sm:p-6">
              <div className="absolute inset-0 noise opacity-50" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">Work feed</p>
                  <p className="mt-1 text-xl font-black text-white">Matched for you</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-extrabold text-white"><Zap className="h-3.5 w-3.5" /> Live</span>
              </div>
              <div className="relative mt-6 space-y-3">
                {liveTasks.map((task, index) => (
                  <div key={task.title} className={`rounded-2xl border p-4 transition ${index === 0 ? "border-brand-300 bg-white" : "border-white/10 bg-white/[0.06] text-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${index === 0 ? "text-brand-dark" : "text-brand-300"}`}>{task.match}% skill match</span>
                        <h3 className={`mt-1 text-sm font-extrabold ${index === 0 ? "text-ink" : "text-white"}`}>{task.title}</h3>
                      </div>
                      <span className={`shrink-0 text-sm font-black ${index === 0 ? "text-ink" : "text-white"}`}>{formatPKR(task.price, true)}</span>
                    </div>
                    <div className={`mt-3 flex items-center gap-4 text-xs font-bold ${index === 0 ? "text-ink-400" : "text-white/45"}`}>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.place}</span>
                      <span className="flex items-center gap-1"><Gavel className="h-3 w-3" />{task.bids} offers</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-brand px-4 py-3 text-white">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><WandSparkles className="h-4 w-4" /></span><div><p className="text-xs font-black">AI ranked</p><p className="text-[10px] text-white/70">By skills, trust & success</p></div></div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 pr-5 shadow-elevated sm:-left-10">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand"><BadgeCheck className="h-5 w-5" /></div>
              <div><div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-sun text-sun" />)}</div><p className="mt-1 text-xs font-extrabold text-ink">Trust-first hiring</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-canvas py-7">
        <div className="page-shell grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["15%", "clear platform fee"],
            ["4 layers", "of trust & safety"],
            ["PKR", "local-first pricing"],
            ["24/7", "task discovery"],
          ].map(([value, label]) => (
            <div key={label} className="text-center sm:text-left"><p className="text-2xl font-black tracking-[-0.04em] text-ink">{value}</p><p className="mt-1 text-xs font-bold text-ink-400">{label}</p></div>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="eyebrow">Explore work</span><h2 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">Whatever needs doing, start here.</h2></div>
            <Link href="/tasks" className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-dark">Browse all categories <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.name} href={`/tasks?category=${encodeURIComponent(category.name)}`} className="group flex items-center gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${category.tone}`}><category.icon className="h-6 w-6" /></span>
                <div className="flex-1"><h3 className="font-black text-ink">{category.name}</h3><p className="mt-1 text-xs font-semibold text-ink-400">{category.count}</p></div>
                <ChevronRight className="h-5 w-5 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="protect" className="bg-canvas py-24">
        <div className="page-shell grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="eyebrow"><ShieldCheck className="h-3.5 w-3.5" /> Workly Protect</span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">Confidence from post to payment.</h2>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-ink-500">Every part of the marketplace is designed to reduce uncertainty before, during and after the work.</p>
            <div className="mt-8 space-y-5">
              {[
                [UserRoundCheck, "Trust scores that mean something", "Reviews, completion history and platform behaviour contribute to every profile."],
                [Sparkles, "Smarter shortlists", "Offers are ranked using skill fit, reliability and successful delivery, not who clicks first."],
                [Banknote, "Protected money flow", "Funds stay held until the agreed work is completed and approved."],
              ].map(([Icon, title, body]: any) => (
                <div key={title} className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-card"><Icon className="h-5 w-5" /></span><div><h3 className="font-black text-ink">{title}</h3><p className="mt-1 text-sm leading-6 text-ink-500">{body}</p></div></div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] bg-ink p-7 text-white shadow-elevated sm:p-9">
            <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">Top match</p><h3 className="mt-2 text-2xl font-black">Adeel Khan</h3></div><span className="rounded-full bg-brand px-3 py-1.5 text-xs font-black">96% match</span></div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {[["92","Trust"],["98%","Success"],["4.9","Rating"]].map(([value,label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p></div>)}
            </div>
            <div className="mt-4 rounded-2xl bg-white p-5 text-ink">
              <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-brand" /><p className="font-black">Identity & skills verified</p></div>
              <p className="mt-3 text-sm leading-6 text-ink-500">Strong fit for web performance, Shopify and ecommerce projects. 18 similar tasks completed.</p>
              <div className="mt-4 flex flex-wrap gap-2">{["Shopify","Performance","JavaScript"].map(skill => <span key={skill} className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-600">{skill}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="managed" className="bg-white py-24">
        <div className="page-shell">
          <div className="overflow-hidden rounded-[36px] bg-brand p-7 text-white shadow-glow sm:p-12 lg:p-16">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em]"><ShieldCheck className="h-3.5 w-3.5" /> Managed fulfilment</span>
                <h2 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Some tasks need a little more control.</h2>
                <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/75">Workly can privately route sensitive or priority work to an internal verified provider without exposing it to the public marketplace.</p>
              </div>
              <div className="grid gap-3">
                {[
                  [ShieldCheck, "Manual review", "Your team chooses the right route"],
                  [UserRoundCheck, "Private provider", "One approved internal professional"],
                  [MessageSquareText, "Controlled delivery", "A focused, traceable workflow"],
                ].map(([Icon,title,body]: any, i) => <div key={title} className="flex items-center gap-4 rounded-2xl bg-white p-4 text-ink"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span><div className="flex-1"><p className="font-black">{title}</p><p className="mt-0.5 text-xs font-semibold text-ink-400">{body}</p></div><span className="text-xs font-black text-brand">0{i+1}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="page-shell text-center">
          <span className="eyebrow">Ready when you are</span>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-black tracking-[-0.045em] text-ink sm:text-6xl">Turn your to-do list into <span className="text-brand">done.</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium text-ink-500">Post in minutes. Compare confidently. Pay securely.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/post" className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-glow transition hover:bg-brand-dark">Post your first task <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/tasks" className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-ink-200 bg-white px-7 text-sm font-extrabold text-ink transition hover:bg-ink-50">Browse work <Search className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
