"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Award,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileCheck2,
  Handshake,
  Laptop2,
  Lightbulb,
  LineChart,
  Lock,
  MapPin,
  MessageSquareText,
  Mic,
  Paintbrush,
  Radar,
  Rocket,
  SearchCheck,
  Send,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Star,
  Target,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { formatPKR } from "@/lib/format";

const stats = [
  { value: "10K+", label: "Verified Freelancers" },
  { value: "5K+", label: "Projects Completed" },
  { value: "50+", label: "Skill Categories" },
  { value: "AI", label: "Powered Matching" },
];

const trustCards = [
  { icon: BadgeCheck, title: "Verified Skills", body: "AI-powered skill verification" },
  { icon: BrainCircuit, title: "AI Matching", body: "Smart freelancer recommendations" },
  { icon: Star, title: "Trust Scores", body: "Performance-based reputation" },
  { icon: Lock, title: "Secure Payments", body: "Protected project payments" },
];

const whyCards = [
  { icon: FileCheck2, title: "AI Skill Verification", body: "Freelancers can demonstrate their skills through AI-powered assessments." },
  { icon: Users, title: "Fair Talent Discovery", body: "New and experienced freelancers get opportunities based on verified capabilities and performance." },
  { icon: Radar, title: "Smart Recommendations", body: "AI matches clients with relevant freelancers based on project requirements." },
  { icon: ShieldX, title: "Fraud Protection", body: "Intelligent systems identify suspicious accounts, proposals, reviews, and activities." },
  { icon: Rocket, title: "Fresh Talent Boost", body: "Verified beginners can receive additional visibility to help them build their first reputation." },
  { icon: Wallet, title: "Secure Transactions", body: "Protected payment workflows help create confidence between clients and freelancers." },
];

const clientSteps = [
  { icon: ClipboardList, step: "01", title: "Post a Job", body: "Describe your project and requirements." },
  { icon: BrainCircuit, step: "02", title: "AI Finds Talent", body: "Parwaz recommends relevant freelancers." },
  { icon: Handshake, step: "03", title: "Hire & Fund", body: "Select a freelancer and secure the payment." },
  { icon: CheckCircle2, step: "04", title: "Get Work Done", body: "Review the project and release payment." },
];

const journey = [
  { icon: UserPlus, label: "Create Profile" },
  { icon: FileCheck2, label: "Verify Skills" },
  { icon: SearchCheck, label: "Discover Jobs" },
  { icon: Send, label: "Submit Proposals" },
  { icon: CheckCircle2, label: "Complete Projects" },
  { icon: Star, label: "Build Reputation" },
  { icon: Wallet, label: "Earn" },
];

const aiCards = [
  { icon: Mic, title: "AI Interview", body: "Showcase your technical skills through intelligent assessments." },
  { icon: LineChart, title: "AI Ranking", body: "Get ranked based on skills, performance, trust, and client satisfaction." },
  { icon: Radar, title: "AI Recommendations", body: "Discover projects and talent relevant to your requirements." },
  { icon: ShieldX, title: "AI Fraud Detection", body: "Identify suspicious activity and protect the marketplace." },
  { icon: Lightbulb, title: "AI Career Insights", body: "Help freelancers understand their strengths and growth opportunities." },
];

const categories = [
  { icon: Laptop2, name: "Web & App", count: "Build sites, apps & support" },
  { icon: Paintbrush, name: "Design", count: "Logos, branding & creative" },
  { icon: Wrench, name: "Handyman", count: "Fixing, assembly & maintenance" },
  { icon: BriefcaseBusiness, name: "Virtual Assistant", count: "Admin & online support" },
  { icon: Truck, name: "Delivery & Moving", count: "Errands, delivery & relocation" },
  { icon: MessageSquareText, name: "Content & Writing", count: "Copy, blogs & translations" },
];

const topFreelancers = [
  { name: "Ayesha R.", title: "Social Media Designer", city: "Lahore", trust: 94, jobs: 12, rating: 4.9, avatar: "A", tag: "First job in 3 weeks" },
  { name: "Bilal K.", title: "Web Developer", city: "Islamabad", trust: 92, jobs: 9, rating: 4.8, avatar: "B", tag: "First job in 2 weeks" },
  { name: "Mahnoor S.", title: "Virtual Assistant", city: "Karachi", trust: 96, jobs: 15, rating: 5.0, avatar: "M", tag: "First job in 1 week" },
  { name: "Usman T.", title: "Content Writer", city: "Faisalabad", trust: 90, jobs: 8, rating: 4.7, avatar: "U", tag: "First job in 4 weeks" },
];

const heroJobs = [
  { title: "Shopify store speed optimisation", place: "Remote", bids: 8, price: 45000, match: 96 },
  { title: "Social media kit for a new chai cafe", place: "Karachi", bids: 12, price: 22000, match: 91 },
];

const networkNodes = [
  { x: 45, y: 70, r: 9, pulse: true },
  { x: 120, y: 35, r: 11, pulse: false },
  { x: 215, y: 30, r: 9, pulse: true },
  { x: 305, y: 45, r: 12, pulse: false },
  { x: 355, y: 90, r: 8, pulse: true },
  { x: 355, y: 155, r: 10, pulse: false },
  { x: 285, y: 185, r: 11, pulse: true },
  { x: 205, y: 178, r: 8, pulse: false },
  { x: 120, y: 185, r: 10, pulse: true },
  { x: 55, y: 145, r: 11, pulse: false },
];

const networkEdges = [
  [120, 35, 215, 30],
  [305, 45, 355, 90],
  [355, 155, 285, 185],
  [285, 185, 205, 178],
  [205, 178, 120, 185],
  [120, 185, 55, 145],
  [55, 145, 45, 70],
  [45, 70, 120, 35],
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-white text-ink">
        <div className="relative bg-brand">
          <div className="page-shell flex items-center justify-center gap-2 py-2.5">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-white sm:text-xs">Pakistan&apos;s AI-powered freelancing marketplace</p>
          </div>
        </div>
        <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-24 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />

        <div className="page-shell relative pb-16 pt-6 lg:pb-24 lg:pt-8">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-up">
              <h1 className="max-w-3xl text-balance text-[1.75rem] font-bold leading-[1.2] tracking-[-0.02em] text-deep sm:text-[2.125rem] lg:text-[2.375rem]">
                Pakistan&apos;s Smarter Freelancing Marketplace,{" "}
                <span className="whitespace-nowrap text-brand-600">Powered by AI.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base font-medium leading-7 text-ink-500">
                Connect with verified talent, discover the right opportunities, and build your freelance career with intelligent AI-powered matching.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/#talent" className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-forest transition hover:-translate-y-0.5 hover:bg-brand-700">
                  Find Freelancers <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/signup" className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-deep px-7 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-deep-800">
                  <UserPlus className="h-4 w-4" /> Start Freelancing
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-extrabold text-ink-500">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-600" /> Verified talent</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand-600" /> Escrow-protected payments</span>
                <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-brand-600" /> AI-powered matching</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-200 blur-3xl" />
              <div className="relative rounded-[28px] border border-ink-100 bg-white p-5 shadow-elevated backdrop-blur sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-400">Parwaz matching</p>
                    <p className="mt-1 text-xl font-black text-ink">Matched for you</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-extrabold text-white"><Zap className="h-3.5 w-3.5" /> Live</span>
                </div>

                <div className="relative mt-5 overflow-hidden rounded-2xl border border-ink-100 bg-canvas">
                  <svg viewBox="0 0 400 200" className="h-auto w-full">
                    <defs>
                      <linearGradient id="hubGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#57B057" />
                        <stop offset="100%" stopColor="#228B22" />
                      </linearGradient>
                    </defs>
                    <circle cx="200" cy="100" r="46" fill="none" stroke="#228B22" strokeOpacity="0.4" className="animate-pulse-soft" />
                    {networkEdges.map(([x1, y1, x2, y2]) => (
                      <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#228B22" strokeOpacity="0.35" strokeWidth="1.5" />
                    ))}
                    {networkNodes.map((node) => (
                      <line key={`hub-${node.x}-${node.y}`} x1="200" y1="100" x2={node.x} y2={node.y} stroke="#228B22" strokeOpacity="0.35" strokeWidth="1.5" />
                    ))}
                    <circle cx="200" cy="100" r="30" fill="url(#hubGradient)" />
                    {networkNodes.map((node) => (
                      <circle key={`node-${node.x}-${node.y}`} cx={node.x} cy={node.y} r={node.r} fill={node.pulse ? "#228B22" : "#ffffff"} stroke="#228B22" strokeWidth="2" className={node.pulse ? "animate-pulse" : ""} />
                    ))}
                  </svg>
                  <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-brand shadow-forest">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {heroJobs.map((job, index) => (
                    <div key={job.title} className={`flex items-center gap-3 rounded-2xl border p-3 ${index === 0 ? "border-brand-200 bg-white shadow-card" : "border-ink-100 bg-canvas/60"}`}>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><BriefcaseBusiness className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-ink">{job.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-ink-400"><MapPin className="h-2.5 w-2.5" />{job.place} · {job.bids} offers · {job.match}% match</p>
                      </div>
                      <span className="shrink-0 text-xs font-black text-deep">{formatPKR(job.price, true)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -right-3 -top-6 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-forest animate-pulse-soft">
                <Sparkles className="h-3.5 w-3.5" /> AI matched · 96%
              </div>

              <div className="absolute -left-3 top-24 hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink shadow-card sm:inline-flex">
                <BadgeCheck className="h-4 w-4 text-brand-600" /> Verified talent
              </div>

              <div className="absolute -bottom-10 -left-3 w-[17rem] rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:-left-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-deep text-sm font-black text-white">AR</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink">Ayesha R.</p>
                    <p className="truncate text-[11px] font-bold text-ink-400">Social Media Designer</p>
                  </div>
                  <span className="ml-auto rounded-full bg-brand-50 px-2 py-1 text-[10px] font-black text-brand-700">96%</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold text-ink-400">
                    <BadgeCheck className="h-3 w-3 text-brand-600" /> Trust score <span className="ml-auto">94</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full w-[94%] rounded-full bg-brand" /></div>
                  <div className="flex items-center gap-2 text-[10px] font-extrabold text-ink-400">
                    <Award className="h-3 w-3 text-ink-500" /> Skill score <span className="ml-auto">91</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full w-[91%] rounded-full bg-deep" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-24 border-t border-ink-100 pt-10">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-black tracking-[-0.02em] text-brand-700 sm:text-4xl">{stat.value}</p>
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-400">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[11px] font-semibold text-ink-300">Target figures at launch — live statistics update automatically once Parwaz goes live.</p>
          </div>
        </div>
      </section>

      {/* Trust / Verification bar */}
      <section id="trust" className="border-b border-ink-100 bg-canvas py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><ShieldCheck className="h-3.5 w-3.5" /> Trust &amp; safety</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">Built for Trust. Designed for Talent.</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><card.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-black text-ink">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Parwaz */}
      <section id="why" className="bg-white py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><BrainCircuit className="h-3.5 w-3.5" /> Why Parwaz?</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">Freelancing, Reimagined for Pakistan.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">Not another marketplace clone. Parwaz is built to fix what breaks trust online — verification, discovery, and safety.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-ink-100 bg-canvas/60 p-7 transition hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><card.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-black text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — For Clients */}
      <section id="how-it-works" className="bg-canvas py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><Compass className="h-3.5 w-3.5" /> How it works</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">Post a job. Get matched. Get it done.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">For clients — four simple steps, with AI doing the heavy lifting.</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-4">
            {clientSteps.map((step, index) => (
              <Fragment key={step.title}>
                <div className="relative rounded-2xl border border-ink-100 bg-white p-7 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                  {index < clientSteps.length - 1 && (
                    <span className="absolute -right-[14px] top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow-forest lg:grid"><ArrowRight className="h-3.5 w-3.5" /></span>
                  )}
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">{step.step}</span>
                  <span className="mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><step.icon className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-xl font-black text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{step.body}</p>
                </div>
                {index < clientSteps.length - 1 && (
                  <div className="flex justify-center lg:hidden"><ArrowDown className="my-1 h-5 w-5 text-brand-700" /></div>
                )}
              </Fragment>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link href="/post" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Post a job <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/#talent" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-300 bg-white px-6 text-sm font-extrabold text-deep transition hover:bg-brand-50"><SearchCheck className="h-4 w-4" /> Find freelancers</Link>
          </div>
        </div>
      </section>

      {/* Freelancer Journey */}
      <section id="journey" className="bg-white py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><Target className="h-3.5 w-3.5" /> Freelancer journey</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">Turn Your Skills Into Opportunities.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">Seven steps from profile to paycheck — no portfolio or experience needed to start.</p>
          </div>
          <div className="mt-14 rounded-[28px] border border-ink-100 bg-canvas p-8 shadow-card sm:p-12">
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[940px] items-center">
                {journey.map((step, index) => (
                  <Fragment key={step.label}>
                    <div className="flex w-28 shrink-0 flex-col items-center text-center">
                      <div className="relative">
                        <span className={`grid h-14 w-14 place-items-center rounded-full border-2 shadow-card ${index === 0 ? "border-brand bg-brand text-white" : "border-brand-200 bg-white text-deep"}`}>
                          <step.icon className="h-6 w-6" />
                        </span>
                        {index === 0 && <span className="absolute -inset-1.5 -z-10 animate-pulse-soft rounded-full bg-brand-200" />}
                      </div>
                      <p className="mt-3 text-xs font-extrabold text-ink-600"><span className="text-brand-700">{index + 1}.</span> {step.label}</p>
                    </div>
                    {index < journey.length - 1 && (
                      <div className="mx-1 h-0.5 min-w-0 flex-1 rounded-full bg-gradient-to-r from-brand to-brand-200" />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center gap-4 border-t border-ink-100 pt-8 sm:flex-row sm:justify-between">
              <p className="max-w-md text-center text-sm font-medium leading-6 text-ink-500 sm:text-left">Every completed project improves your trust score, ranking, and earning power.</p>
              <Link href="/signup" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Start freelancing <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="relative bg-white py-24 text-ink">
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-40" />
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />
        <div className="page-shell relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Parwaz features</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">AI That Works for You.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">Parwaz is built into every part of Parwaz — from the first assessment to the final payment.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {aiCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><card.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-bold text-deep">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{card.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Every match, ranking, and review runs through Parwaz.</p>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-white py-20">
        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="eyebrow"><Laptop2 className="h-3.5 w-3.5" /> Explore marketplaces</span><h2 className="mt-5 max-w-xl text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">Categories for every kind of work.</h2></div>
            <Link href="/tasks" className="inline-flex items-center gap-2 text-sm font-extrabold text-deep">Browse all jobs <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.name} href={`/tasks?category=${encodeURIComponent(category.name)}`} className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><category.icon className="h-6 w-6" /></span>
                <div className="flex-1"><h3 className="font-black text-ink">{category.name}</h3><p className="mt-1 text-xs font-semibold text-ink-400">{category.count}</p></div>
                <ArrowRight className="h-5 w-5 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top talent */}
      <section id="talent" className="bg-canvas py-20">
        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="eyebrow"><Award className="h-3.5 w-3.5" /> Top talent</span><h2 className="mt-5 max-w-xl text-2xl font-bold tracking-[-0.02em] text-deep sm:text-3xl">Verified freelancers, ready to start.</h2></div>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-extrabold text-deep">Hire talent <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topFreelancers.map((person) => (
              <div key={person.name} className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                <div className="relative mx-auto h-16 w-16">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-deep text-xl font-black text-white">{person.avatar}</span>
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-brand text-[10px] font-black text-white ring-2 ring-white">{person.trust}</span>
                </div>
                <h3 className="mt-4 font-black text-ink">{person.name}</h3>
                <p className="mt-1 text-xs font-bold text-ink-400">{person.title} · {person.city}</p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-ink-500">
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{person.rating}</span>
                  <span>·</span>
                  <span>{person.jobs} jobs done</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-extrabold text-brand-700"><BadgeCheck className="h-3 w-3 text-brand-700" /> {person.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white pb-24">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-[28px] bg-deep p-10 text-center text-white shadow-elevated sm:p-16">
            <div className="pointer-events-none absolute inset-0 soft-grid opacity-40" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-deep"><Sparkles className="h-3.5 w-3.5" /> Ready when you are</span>
              <h2 className="mx-auto mt-6 max-w-2xl text-balance text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Your next project is <span className="text-brand-300">AI-matched.</span></h2>
              <p className="mx-auto mt-5 max-w-xl text-base font-medium text-deep">Join free, verify your skills with Parwaz, and get matched with work you&apos;re great at — from both sides of the table.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/#talent" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Find Freelancers <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/signup" className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-7 text-sm font-extrabold text-deep transition hover:bg-white/10"><UserPlus className="h-4 w-4" /> Start Freelancing</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
