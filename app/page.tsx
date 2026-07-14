"use client";

import Link from "next/link";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Shield,
  MessageSquare,
  Star,
  Zap,
  MapPin,
  DollarSign,
  Wrench,
  Paintbrush,
  Truck,
  Leaf,
  Code2,
  Camera,
  Braces,
  Briefcase,
  BookOpen,
  ChevronRight,
} from "lucide-react";

const categories = [
  { icon: Wrench, name: "Handyman", desc: "Plumbing, electrical, repairs" },
  { icon: Paintbrush, name: "Design", desc: "Logo, branding, graphics" },
  { icon: Code2, name: "IT & Web", desc: "Websites, apps, bugs" },
  { icon: Truck, name: "Delivery", desc: "Courier, pickups, parcels" },
  { icon: Leaf, name: "Gardening", desc: "Lawn, pruning, cleanup" },
  { icon: Briefcase, name: "Moving", desc: "Furniture, relocation" },
  { icon: Camera, name: "Photography", desc: "Events, portrait, product" },
  { icon: BookOpen, name: "Tutoring", desc: "Math, English, exam prep" },
];

const steps = [
  { step: "01", title: "Describe your task", desc: "Tell us what you need done, where and when." },
  { step: "02", title: "Receive bids", desc: "Taskers nearby will send you offers within minutes." },
  { step: "03", title: "Hire & pay safely", desc: "Choose the right person, money held securely." },
  { step: "04", title: "Get it done", desc: "Task completed, you pay, leave a review." },
];

const stats = [
  { value: "5,200+", label: "Tasks completed", icon: CheckCircle2 },
  { value: "1,400+", label: "Verified taskers", icon: Shield },
  { value: "4.8 / 5", label: "Average rating", icon: Star },
  { value: "12 min", label: "Avg. first bid", icon: Zap },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ====== HERO ====== */}
      <section className="relative bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-green-50 opacity-60 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:flex lg:items-center lg:gap-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-dark">
              <Zap className="h-4 w-4 fill-brand" /> Pakistan&apos;s Task Marketplace
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Get anything<br />
              <span className="bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
                done. Fast.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-500">
              Post your task, compare bids from skilled taskers nearby, and get it done with confidence. Money held securely until you&apos;re happy.
            </p>

            {/* Hero Search */}
            <div className="mt-8 flex flex-col rounded-2xl border border-ink-200 bg-white p-2 shadow-elevated sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-xl bg-ink-50 px-4 py-3.5">
                <Search className="h-5 w-5 shrink-0 text-ink-400" />
                <Link href="/tasks" className="flex-1 text-sm text-ink-400 outline-none">What do you need done? Click here to browse...</Link>
                <Link href="/tasks" className="flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
                  Find <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand" /> Free to post
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-brand" /> Secure payment
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-brand" /> Live chat
              </span>
            </div>
          </div>

          {/* Hero visual cards */}
          <div className="mt-12 lg:mt-0 lg:flex-1">
            <div className="relative rounded-3xl border border-ink-100 bg-white p-6 shadow-elevated">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-ink-500">Recent tasks</p>
                <Link href="/tasks" className="text-xs font-semibold text-brand flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Fix leaking kitchen tap", cat: "Handyman", budget: 80, bids: 5 },
                  { title: "Logo design for my cafe", cat: "Design", budget: 150, bids: 9 },
                  { title: "Deliver couch from store", cat: "Moving", budget: 200, bids: 3 },
                  { title: "Tutor my son in math", cat: "Tutoring", budget: 100, bids: 6 },
                ].map((t, i) => (
                  <Link
                    key={i}
                    href="/tasks"
                    className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-brand-50/50"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand">
                      {(() => {
                        const Icon = categories.find(c => c.name === t.cat)?.icon || Briefcase;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
                      <p className="text-xs text-ink-400">{t.cat}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand">${t.budget}</p>
                      <p className="text-xs text-ink-400">{t.bids} bids</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="border-y border-ink-100 bg-white py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand mb-3">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-extrabold text-ink">{s.value}</p>
              <p className="mt-1 text-sm text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-dark">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              From post to done in 4 steps
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-sm font-extrabold text-brand-400">{s.step}</div>
                <h3 className="mt-3 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.desc}</p>
                {i < 3 && (
                  <ChevronRight className="absolute -right-4 top-10 hidden h-6 w-6 text-ink-200 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CATEGORIES ====== */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-dark">
              Services
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              What do you need done?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-500">
              From home repairs to creative work — find help for anything
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/tasks?category=${encodeURIComponent(c.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-ink-100 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-card-hover"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <c.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{c.name}</h3>
                <p className="mt-1 text-xs text-ink-400">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
                Join thousands of Pakistanis getting things done on Workly. Post your first task in under a minute.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/post"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-glow transition hover:bg-brand-dark hover:shadow-lg"
                >
                  Post a Task — Free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/20"
                >
                  Become a Tasker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
