"use client";

import { useEffect, useState } from "react";
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
  HardHat,
  Laptop2,
  MapPin,
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
import { useAuth } from "@/lib/auth-context";
import { subscribePublicTasks, PLATFORM_FEE, type Task } from "@/lib/tasks";
import { formatPKR } from "@/lib/format";
import Button from "@/components/ui/Button";
import TaskCard from "@/components/TaskCard";

const CATEGORY_TILES = [
  { icon: Wrench, name: "Handyman", blurb: "Plumbing, electrical & repairs", tone: "bg-$warning-50 text-$warning-600" },
  { icon: Laptop2, name: "IT & Web", blurb: "Apps, sites & support", tone: "bg-$info-50 text-$info-600" },
  { icon: Paintbrush, name: "Design", blurb: "Branding & creative", tone: "bg-$danger-50 text-$danger-600" },
  { icon: Truck, name: "Moving", blurb: "Delivery & relocation", tone: "bg-$info-50 text-$info-600" },
  { icon: BriefcaseBusiness, name: "Business & Admin", blurb: "Admin & marketing", tone: "bg-$warning-50 text-$warning-700" },
  { icon: Hammer, name: "Furniture Assembly", blurb: "Assembly & maintenance", tone: "bg-$success-50 text-$success-700" },
];

const SAMPLE_FEED = [
  { title: "Shopify store speed optimisation", place: "Remote", bids: 8, price: 45000, match: 96 },
  { title: "Move office furniture in DHA", place: "Lahore", bids: 5, price: 18000, match: 91 },
  { title: "Brand identity for a chai cafe", place: "Karachi", bids: 12, price: 60000, match: 88 },
];

export default function HomePage() {
  const { user, role } = useAuth();
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      return subscribePublicTasks({ sort: "newest" }, (tasks) =>
        setLiveTasks(tasks.filter((task) => task.status === "open").slice(0, 6))
      );
    } catch {
      setLiveTasks([]);
    }
  }, []);

  const primaryHref = user ? (role === "freelancer" ? "/tasks" : "/post") : "/signup";
  const primaryLabel = user ? (role === "freelancer" ? "Find work" : "Post a task") : "Get started free";

  return (
    <div className="overflow-hidden">
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative bg-white">
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-70" />
        <div className="pointer-events-none absolute -left-40 top-36 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="page-shell relative grid items-center gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div className="animate-fade-up">
            <div className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Built for Pakistan&apos;s next economy
            </div>
            <h1 className="mt-7 max-w-3xl text-balance text-[44px] font-black leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[74px]">
              The right person for{" "}
              <span className="relative whitespace-nowrap text-brand">
                every task.
                <span className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-sun/55" />
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-ink-500">
              Post local or digital work, compare evidence-backed professionals, and pay only when you approve the
              result.
            </p>

            <div className="mt-9 flex max-w-xl flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-2.5 shadow-elevated sm:flex-row">
              <Link
                href="/tasks"
                className="flex min-h-14 flex-1 items-center gap-3 rounded-xl bg-ink-50 px-4 text-sm font-semibold text-ink-400 transition hover:bg-ink-100"
              >
                <Search className="h-5 w-5 text-brand" /> What do you need help with?
              </Link>
              <Link
                href={primaryHref}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-black text-white shadow-glow transition hover:bg-brand-dark"
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-black text-ink-500">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand" /> Free to post
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand" /> Moderated marketplace
              </span>
              <span className="flex items-center gap-1.5">
                <UserRoundCheck className="h-4 w-4 text-brand" /> Human-reviewed talent
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sun/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-ink p-4 shadow-elevated sm:p-6">
              <div className="absolute inset-0 noise opacity-50" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Work feed</p>
                  <p className="mt-1 text-xl font-black text-white">Matched for you</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-black text-white">
                  <Zap className="h-3.5 w-3.5" /> Live
                </span>
              </div>
              <div className="relative mt-6 space-y-3">
                {SAMPLE_FEED.map((item, index) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl border p-4 transition ${
                      index === 0 ? "border-brand-300 bg-white" : "border-white/10 bg-white/[0.06] text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.14em] ${
                            index === 0 ? "text-brand-dark" : "text-brand-300"
                          }`}
                        >
                          {item.match}% skill match
                        </span>
                        <h3 className={`mt-1 text-sm font-black ${index === 0 ? "text-ink" : "text-white"}`}>
                          {item.title}
                        </h3>
                      </div>
                      <span className={`shrink-0 text-sm font-black ${index === 0 ? "text-ink" : "text-white"}`}>
                        {formatPKR(item.price, true)}
                      </span>
                    </div>
                    <div
                      className={`mt-3 flex items-center gap-4 text-xs font-bold ${
                        index === 0 ? "text-ink-400" : "text-white/45"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.place}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gavel className="h-3 w-3" /> {item.bids} offers
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-brand px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                    <WandSparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black">AI ranked</p>
                    <p className="text-[10px] text-white/70">By skills, trust & success</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 pr-5 shadow-elevated sm:-left-10">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <Star key={index} className="h-3 w-3 fill-sun text-sun" />
                  ))}
                </div>
                <p className="mt-1 text-xs font-black text-ink">Trust-first hiring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Value props */}
      <section className="border-y border-ink-100 bg-canvas py-8">
        <div className="page-shell grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["Free", "to post any task"],
            [`${Math.round(PLATFORM_FEE * 100)}%`, "flat service fee"],
            ["Held", "until you approve"],
            ["Human", "reviewed verification"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black tracking-[-0.04em] text-ink sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-bold text-ink-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Two paths */}
      <section className="page-shell py-16 sm:py-20">
        <div className="text-center">
          <span className="eyebrow mx-auto">
            <Sparkles className="h-3.5 w-3.5" /> One account, two ways
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
            Hire when you need help. Earn when you have time.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-ink-500">
            Switch between client and freelancer mode whenever you like — same account, same reputation.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {[
            {
              icon: BriefcaseBusiness,
              tag: "For clients",
              title: "Get it done properly",
              points: [
                "Post free and describe the outcome",
                "Compare priced offers with real evidence",
                "Funds held from hire until you approve",
                "One private chat with a full record",
              ],
              href: user ? "/post" : "/signup",
              cta: user ? "Post a task" : "Join as a client",
              dark: false,
            },
            {
              icon: HardHat,
              tag: "For freelancers",
              title: "Win work that fits",
              points: [
                "Browse approved, genuine tasks",
                "See your exact take-home before bidding",
                "Earn a human-reviewed verified badge",
                "Get paid on approval, tracked in your balance",
              ],
              href: user ? "/tasks" : "/signup?role=freelancer",
              cta: user ? "Find work" : "Join as a freelancer",
              dark: true,
            },
          ].map((card) => (
            <div
              key={card.tag}
              className={`overflow-hidden rounded-[32px] p-8 sm:p-10 ${
                card.dark ? "bg-ink text-white shadow-elevated" : "border border-ink-100 bg-white shadow-card"
              }`}
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  card.dark ? "bg-brand text-white" : "bg-brand-50 text-brand"
                }`}
              >
                <card.icon className="h-5 w-5" />
              </span>
              <p
                className={`mt-6 text-[11px] font-black uppercase tracking-[0.16em] ${
                  card.dark ? "text-brand-300" : "text-brand-dark"
                }`}
              >
                {card.tag}
              </p>
              <h3 className={`mt-2 text-3xl font-black tracking-[-0.04em] ${card.dark ? "text-white" : "text-ink"}`}>
                {card.title}
              </h3>
              <ul className="mt-6 space-y-3">
                {card.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${card.dark ? "text-brand-light" : "text-brand"}`} />
                    <span className={`text-sm leading-6 ${card.dark ? "text-white/70" : "text-ink-600"}`}>{point}</span>
                  </li>
                ))}
              </ul>
              <Link href={card.href} className="mt-8 inline-block">
                <Button
                  className={card.dark ? "bg-white text-ink shadow-none hover:bg-brand-100" : ""}
                  variant={card.dark ? "primary" : "primary"}
                >
                  {card.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Categories */}
      <section className="bg-canvas py-16 sm:py-20">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">
                <Search className="h-3.5 w-3.5" /> Popular categories
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">
                Whatever needs doing.
              </h2>
            </div>
            <Link href="/tasks" className="flex items-center gap-1.5 text-sm font-black text-brand-dark">
              See all work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_TILES.map((tile) => (
              <Link
                key={tile.name}
                href={`/tasks?category=${encodeURIComponent(tile.name)}`}
                className="group flex items-center gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tile.tone}`}>
                  <tile.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-ink transition group-hover:text-brand-dark">{tile.name}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-ink-400">{tile.blurb}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Live tasks */}
      {liveTasks.length > 0 && (
        <section className="page-shell py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">
                <Zap className="h-3.5 w-3.5" /> Live right now
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">Open tasks today.</h2>
            </div>
            <Link href="/tasks" className="flex items-center gap-1.5 text-sm font-black text-brand-dark">
              Browse everything <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Protection */}
      <section id="protect" className="scroll-mt-24 bg-ink py-16 text-white sm:py-24">
        <div className="page-shell grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Workly Protect
            </span>
            <h2 className="mt-6 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
              Protection that is built in, not bolted on.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
              From the moment you hire, the money, the messages and the delivery record all live in one place. If
              something goes wrong, there is real evidence to act on.
            </p>
            <Link href="/how-it-works#safety" className="mt-8 inline-block">
              <Button className="bg-white text-ink shadow-none hover:bg-brand-100">
                See how it works <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Banknote, title: "Funds held at hire", body: "Released only when you approve the delivery." },
              { icon: ShieldCheck, title: "Reviewed tasks", body: "Smart checks or a human moderator before anything goes live." },
              { icon: BadgeCheck, title: "Verified talent", body: "Badges come from real evidence and a human reviewer." },
              { icon: Gavel, title: "Neutral disputes", body: "A Workly reviewer reads the full on-platform record." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand">
                  <item.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </span>
                <p className="mt-4 text-sm font-black">{item.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-white/50">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ CTA */}
      <section className="page-shell py-16 sm:py-20">
        <div className="overflow-hidden rounded-[32px] bg-brand p-8 text-white shadow-glow sm:p-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
                Your next task starts here.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/80">
                Join free in under a minute. Hire, earn, or both — from the same account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={user ? "/dashboard" : "/signup"}>
                <Button className="bg-white text-ink shadow-none hover:bg-brand-50">
                  {user ? "Open your dashboard" : "Create free account"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                  How it works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
