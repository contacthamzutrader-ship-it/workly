"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  FileCheck2,
  Handshake,
  Laptop2,
  LineChart,
  Lock,
  MapPin,
  MessageSquareText,
  Paintbrush,
  Rocket,
  Search,
  SearchCheck,
  Send,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Star,
  Target,
  Terminal,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { formatPKR } from "@/lib/format";

const stats = [
  { value: "PKR 48M+", label: "Safepay Escrow Secured", subtitle: "Institutional-grade milestone protection" },
  { value: "99.4%", label: "On-Time Milestone Delivery", subtitle: "Benchmarked through verified reviews" },
  { value: "10-Factor", label: "AI Technical Vetting", subtitle: "Zero resume fluff, real skill rubrics" },
  { value: "< 15 Mins", label: "Average Match Speed", subtitle: "Instant recommendation engine" },
];

const trendingSkills = [
  { label: "⚡ Next.js & React", query: "Next.js" },
  { label: "🎨 UI/UX Design Systems", query: "UI/UX" },
  { label: "🛍️ Shopify Plus", query: "Shopify" },
  { label: "🤖 Python & AI Agents", query: "Python" },
  { label: "📈 Technical SEO", query: "SEO" },
  { label: "📱 Flutter Mobile", query: "Flutter" },
];

const platformPillars = [
  {
    icon: BrainCircuit,
    title: "10-Factor Adaptive AI Vetting",
    description: "Every pro passes an interactive technical assessment evaluating real syntax, system architecture, and domain problem solving.",
    badge: "Anti-Cheating Verified",
  },
  {
    icon: Lock,
    title: "Safepay Encrypted Escrow Vault",
    description: "Milestone funds remain locked in escrow before project kickoff and release strictly upon client inspection and approval.",
    badge: "100% Guaranteed Payout",
  },
  {
    icon: ShieldX,
    title: "Dual-Language Fraud Sentinel",
    description: "Active NLP surveillance monitors chats in English and Roman Urdu to block scams, duplicate identities, and off-platform solicitation.",
    badge: "Zero-Trust Security",
  },
  {
    icon: Star,
    title: "Double-Blind Reputation Matrix",
    description: "Ratings and reviews are simultaneously revealed only after both parties submit, preventing rating blackmail or retaliatory scores.",
    badge: "100% Authentic Ratings",
  },
];

const clientSteps = [
  {
    step: "01",
    title: "Define Your Project Scope",
    body: "Post your requirements in 60 seconds or let Workly AI structure deliverables, tech stack requirements, and estimated milestone budgets in PKR.",
    tag: "Automated Scoping",
  },
  {
    step: "02",
    title: "Instant AI Talent Match",
    body: "Our multi-factor matching engine analyzes verified skill scores, track records, and availability to recommend the top 1% matching freelancers.",
    tag: "99.4% Precision",
  },
  {
    step: "03",
    title: "Fund Safepay Escrow Vault",
    body: "Deposit milestone funds safely into an encrypted escrow vault. Your developer or designer works with peace of mind knowing payment is secure.",
    tag: "0% Financial Risk",
  },
  {
    step: "04",
    title: "Inspect, Approve & Release",
    body: "Review delivered code or assets against milestones. Approve releases instantly to their verified bank, Raast, or JazzCash account.",
    tag: "Instant Payout",
  },
];

const freelancerJourney = [
  { icon: UserPlus, label: "Register Profile", desc: "Identity & portfolio verification" },
  { icon: BrainCircuit, label: "Pass AI Rubric", desc: "10-question technical benchmark" },
  { icon: SearchCheck, label: "Rank In Matches", desc: "Top visibility for qualified gigs" },
  { icon: Send, label: "Receive Proposals", desc: "Direct client invitations" },
  { icon: Lock, label: "Escrow Locked", desc: "Guaranteed funds before start" },
  { icon: CheckCircle2, label: "Deliver & Approve", desc: "Milestone completion sign-off" },
  { icon: Wallet, label: "Instant Bank Payout", desc: "JazzCash, Raast & 1-day Bank" },
];

const categories = [
  {
    icon: Laptop2,
    name: "Web & Fullstack Engineering",
    desc: "Next.js, React, Node.js, Python, Tailwind, REST & GraphQL APIs",
    count: "1,420+ Verified Pros",
    rate: "From PKR 3,500/hr",
  },
  {
    icon: Paintbrush,
    name: "UI/UX & Product Design",
    desc: "Figma design systems, mobile apps, SaaS dashboards, brand identity",
    count: "890+ Verified Pros",
    rate: "From PKR 3,000/hr",
  },
  {
    icon: BriefcaseBusiness,
    name: "Shopify & E-Commerce",
    desc: "Custom Shopify themes, Liquid, store setup, speed 90+, conversion optimization",
    count: "650+ Verified Pros",
    rate: "From PKR 2,800/hr",
  },
  {
    icon: Terminal,
    name: "AI & Automation Engineering",
    desc: "Gemini / OpenAI API integrations, Python scraping, automated workflows",
    count: "410+ Verified Pros",
    rate: "From PKR 4,000/hr",
  },
  {
    icon: MessageSquareText,
    name: "Technical Writing & SEO",
    desc: "Technical documentation, SEO topical maps, conversion copywriting",
    count: "520+ Verified Pros",
    rate: "From PKR 2,500/hr",
  },
  {
    icon: Wrench,
    name: "Operations & Virtual Support",
    desc: "Executive assistant, data research, CRM management, customer ops",
    count: "380+ Verified Pros",
    rate: "From PKR 2,000/hr",
  },
];

const topFreelancers = [
  {
    name: "Hamza R.",
    title: "Senior Fullstack Architect",
    skills: ["Next.js", "TypeScript", "FastAPI", "Tailwind"],
    city: "Lahore",
    trust: 98,
    jobs: 32,
    rating: 4.98,
    avatar: "HR",
    rate: "PKR 4,200/hr",
    status: "Available for new projects",
    verified: "Passed AI Code Challenge (98/100)",
  },
  {
    name: "Mahnoor S.",
    title: "Lead UI/UX & Design Systems",
    skills: ["Figma", "Design Tokens", "Mobile UX", "SaaS"],
    city: "Karachi",
    trust: 99,
    jobs: 41,
    rating: 5.0,
    avatar: "MS",
    rate: "PKR 3,800/hr",
    status: "Available now",
    verified: "Figma Design Token Audit Passed",
  },
  {
    name: "Bilal K.",
    title: "Shopify Plus & Frontend Engineer",
    skills: ["Shopify Plus", "Liquid", "PageSpeed 95+", "React"],
    city: "Islamabad",
    trust: 96,
    jobs: 27,
    rating: 4.94,
    avatar: "BK",
    rate: "PKR 3,500/hr",
    status: "Responding in < 15 mins",
    verified: "Passed E-Commerce Benchmark",
  },
  {
    name: "Zainab T.",
    title: "AI Integrations & Python Developer",
    skills: ["Python", "Gemini API", "FastAPI", "PostgreSQL"],
    city: "Rawalpindi",
    trust: 95,
    jobs: 19,
    rating: 4.91,
    avatar: "ZT",
    rate: "PKR 4,000/hr",
    status: "Top 1% Rated",
    verified: "Passed AI Architecture Assessment",
  },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"clients" | "freelancers">("clients");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/tasks?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/browse");
    }
  };

  const handlePillClick = (skill: string) => {
    router.push(`/tasks?q=${encodeURIComponent(skill)}`);
  };

  return (
    <div className="overflow-hidden bg-[#F8FAFC] text-ink selection:bg-brand selection:text-white">
      {/* Top Industrial Engine Status Beacon */}
      <section className="relative border-b border-ink-100 bg-white">
        <div className="page-shell flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span className="font-bold text-ink-600">
              Workly Enterprise Engine v2.4 Active · Safepay Escrow Vaults Online
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-ink-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Zero Upfront Risk
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> 10-Factor AI Skill Benchmarking
            </span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pb-16 pt-10 sm:pb-24 sm:pt-14 lg:pb-28">
        <div className="pointer-events-none absolute -left-48 top-0 h-[32rem] w-[32rem] rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-36 top-1/4 h-[30rem] w-[30rem] rounded-full bg-teal-100/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-30" />

        <div className="page-shell relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Left: Authoritative Headline & Interactive Search Console */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-800 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Pakistan&apos;s Elite AI Freelancing Network
              </div>

              <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-[-0.035em] text-deep sm:text-4xl lg:text-[2.85rem] lg:leading-[1.12]">
                Hire Vetted Tech &amp; Creative Talent.{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Matched in Minutes.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base font-normal leading-7 text-ink-600 sm:text-lg">
                Connect with the top 1% of Pakistani developers, designers, and specialists. 100% verified identities, AI skill assessments, and protected escrow vaults for every project.
              </p>

              {/* Interactive Search Console */}
              <form onSubmit={handleSearchSubmit} className="mt-8 rounded-2xl border border-ink-100 bg-white p-2 shadow-card-hover transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex flex-1 items-center pl-3">
                    <Search className="h-5 w-5 shrink-0 text-ink-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Next.js Developer, UI/UX Designer, Shopify Speed..."
                      className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="hidden rounded-xl border border-ink-100 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-ink-600 focus:outline-none sm:block"
                    >
                      <option value="all">All Specialties</option>
                      <option value="web">Engineering</option>
                      <option value="design">Design &amp; UI</option>
                      <option value="shopify">Shopify</option>
                      <option value="ai">AI &amp; Data</option>
                    </select>
                    <button
                      type="submit"
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-95"
                    >
                      Find Talent <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Trending Filter Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-ink-400">Trending:</span>
                {trendingSkills.map((skill) => (
                  <button
                    key={skill.query}
                    type="button"
                    onClick={() => handlePillClick(skill.query)}
                    className="rounded-lg border border-ink-100 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-ink-600 transition hover:border-brand-300 hover:bg-white hover:text-brand-700"
                  >
                    {skill.label}
                  </button>
                ))}
              </div>

              {/* Direct Action Funnel */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/post"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#00501F] px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-deep-800"
                >
                  <BriefcaseBusiness className="h-4 w-4" /> Post a Project in 60s
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-ink-200 bg-white px-6 text-sm font-extrabold text-ink transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700"
                >
                  <UserPlus className="h-4 w-4" /> Apply as a Freelancer
                </Link>
              </div>

              {/* Enterprise Assurance Pills */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 pt-6 text-xs font-bold text-ink-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Vetted Code &amp; Portfolios
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-600" /> Safepay Escrow Milestone Vaults
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Automated AI Matchmaker
                </span>
              </div>
            </div>

            {/* Right: Live Workly Intelligence Terminal Card */}
            <div className="relative mx-auto w-full max-w-xl">
              <div className="relative rounded-3xl border border-slate-200/90 bg-white p-5 shadow-elevated backdrop-blur-sm sm:p-6">
                {/* Console Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-deep text-white">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">
                        Workly Matching Engine
                      </p>
                      <p className="text-xs font-extrabold text-ink">
                        Active Job Match Simulator
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                  </span>
                </div>

                {/* Job Request Card */}
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 border border-slate-100">
                        Active Project
                      </span>
                      <h4 className="mt-1.5 text-xs font-bold text-ink">
                        Next.js 14 Enterprise Web App &amp; Safepay Escrow Checkout
                      </h4>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        Remote · 12 Proposals Submitted · Milestone 1 Locked
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-deep">{formatPKR(185000, true)}</p>
                      <p className="text-[10px] font-bold text-emerald-600">Escrow Funded 🛡️</p>
                    </div>
                  </div>
                </div>

                {/* Top Matched Candidate Card 1 */}
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-4 shadow-sm transition hover:border-emerald-300">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-deep text-sm font-black text-white">
                        HR
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-black text-ink">Hamza Raza</p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                            98% Match
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-semibold text-ink-500">
                          Senior Fullstack Architect · Lahore
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-extrabold text-ink-700">PKR 4,200/hr</span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white p-2.5 text-center text-[10px] border border-slate-100">
                      <div>
                        <p className="font-extrabold text-emerald-700">98/100</p>
                        <p className="text-[9px] font-semibold text-ink-400">AI Code Score</p>
                      </div>
                      <div className="border-x border-slate-100">
                        <p className="font-extrabold text-deep">★ 4.98</p>
                        <p className="text-[9px] font-semibold text-ink-400">32 Completed</p>
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-700">100%</p>
                        <p className="text-[9px] font-semibold text-ink-400">On-Time Escrow</p>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Card 2 */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-3.5 transition hover:border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-xs font-black text-white">
                        MS
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-black text-ink">Mahnoor S.</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">
                            95% Match
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-semibold text-ink-500">
                          Lead UI/UX &amp; Design Systems · Karachi
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-extrabold text-ink-700">PKR 3,800/hr</span>
                    </div>
                  </div>
                </div>

                {/* Floating Metrics Pill */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-white">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Average Match Latency: 7 Minutes</span>
                  </div>
                  <Link href="/browse" className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300">
                    Inspect Vetted Roster &rarr;
                  </Link>
                </div>
              </div>

              {/* Decorative Pill Badges */}
              <div className="absolute -left-4 -top-4 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-deep shadow-card sm:flex">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Verified Identity &amp; Bank
              </div>

              <div className="absolute -bottom-5 -right-3 hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-forest sm:flex">
                <Lock className="h-3.5 w-3.5" /> Escrow Milestone Secured
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industrial Metric Telemetry Bar */}
      <section className="border-y border-ink-100 bg-white py-12">
        <div className="page-shell">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-center transition hover:bg-white hover:shadow-card">
                <p className="text-2xl font-extrabold tracking-[-0.03em] text-brand sm:text-3xl lg:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-ink">
                  {stat.label}
                </p>
                <p className="mt-1 text-[11px] font-normal text-ink-400">
                  {stat.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety Pillars */}
      <section id="trust" className="py-20 sm:py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">
              <ShieldCheck className="h-3.5 w-3.5" /> Institutional Trust &amp; Safety
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-deep sm:text-3xl lg:text-4xl">
              Engineered for Zero Counterparty Risk.
            </h2>
            <p className="mt-3 text-base text-ink-500">
              The only Pakistani freelance platform where both client capital and freelancer labor are protected through cryptographic code, active AI surveillance, and guaranteed milestone escrow.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-brand group-hover:text-white">
                    <pillar.icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-ink-500">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-extrabold text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-ink-500">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Workflow: How Workly Works */}
      <section id="how-it-works" className="border-y border-ink-100 bg-white py-20 sm:py-24">
        <div className="page-shell">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">
                <Compass className="h-3.5 w-3.5" /> High-Velocity Execution
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-deep sm:text-3xl lg:text-4xl">
                How Workly Operates.
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                A streamlined milestone pipeline built for founders, technical teams, and skilled freelancers.
              </p>
            </div>
            {/* Perspective Switcher */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("clients")}
                className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${
                  activeTab === "clients" ? "bg-white text-deep shadow-sm" : "text-ink-400 hover:text-ink"
                }`}
              >
                For Employers &amp; Clients
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("freelancers")}
                className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${
                  activeTab === "freelancers" ? "bg-white text-deep shadow-sm" : "text-ink-400 hover:text-ink"
                }`}
              >
                For Freelancers &amp; Talent
              </button>
            </div>
          </div>

          {activeTab === "clients" ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {clientSteps.map((step) => (
                <div
                  key={step.step}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition hover:bg-white hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest text-brand">
                      PHASE {step.step}
                    </span>
                    <span className="rounded-md bg-emerald-100/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-ink-500">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {freelancerJourney.slice(0, 4).map((item, idx) => (
                  <div key={item.label} className="rounded-xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-deep text-white">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-ink">
                          {idx + 1}. {item.label}
                        </p>
                        <p className="text-[11px] text-ink-400">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6">
                <p className="text-xs font-semibold text-ink-500">
                  Ready to benchmark your skills? Take our 10-question AI interview and get ranked.
                </p>
                <Link
                  href="/interview"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-white shadow-forest hover:bg-brand-700"
                >
                  Take AI Skill Test <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* High-Demand Talent Categories */}
      <section id="categories" className="py-20 sm:py-24">
        <div className="page-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">
                <Laptop2 className="h-3.5 w-3.5" /> Vetted Skill Specializations
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-deep sm:text-3xl lg:text-4xl">
                Explore Talent by Domain.
              </h2>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-700 hover:text-brand-800"
            >
              Browse all open projects <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/tasks?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 text-brand-700 transition group-hover:bg-brand group-hover:text-white">
                      <cat.icon className="h-6 w-6" />
                    </span>
                    <span className="text-[11px] font-bold text-ink-400">
                      {cat.rate}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-ink group-hover:text-brand-700">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-ink-500">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-ink-400">
                  <span>{cat.count}</span>
                  <span className="inline-flex items-center gap-1 text-brand group-hover:translate-x-1 transition">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Verified Talent Spotlight */}
      <section id="talent" className="border-t border-ink-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="page-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">
                <Star className="h-3.5 w-3.5" /> Top 1% Verified Roster
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-deep sm:text-3xl lg:text-4xl">
                Ready to Deploy on Your Team.
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                Pre-vetted through AI technical interviews, background checks, and escrow delivery records.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-xs font-extrabold text-white shadow-forest hover:bg-brand-700"
            >
              Hire from Vetted Roster <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topFreelancers.map((person) => (
              <div
                key={person.name}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-deep text-base font-black text-white">
                        {person.avatar}
                      </span>
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 ring-2 ring-white text-[10px] text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 border border-emerald-200/60">
                      Trust {person.trust}/100
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-extrabold text-ink">{person.name}</h3>
                  <p className="text-xs font-semibold text-ink-500">{person.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{person.city} · {person.rate}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {person.skills.map((s) => (
                      <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-[11px] font-semibold text-emerald-800">
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {person.verified}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-ink-600">
                    <span className="flex items-center gap-1 text-amber-500">
                      ★ {person.rating}
                    </span>
                    <span>{person.jobs} contracts</span>
                    <span className="text-emerald-600">100% on-time</span>
                  </div>
                  <Link
                    href={`/tasks?q=${encodeURIComponent(person.name)}`}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-extrabold text-ink transition hover:border-brand hover:text-brand"
                  >
                    View Verified Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Dual Call to Action */}
      <section className="bg-white py-20">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-3xl bg-[#00501F] p-8 text-white shadow-elevated sm:p-14 lg:p-16">
            <div className="pointer-events-none absolute inset-0 soft-grid opacity-30" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

            <div className="relative mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" /> Workly Production Ready
              </span>
              <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Ready to Build With Verified Talent?
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/80 sm:text-base">
                Join hundreds of businesses locking project milestones in escrow and working with Pakistan&apos;s most skilled developers and creatives.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/post"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-extrabold text-deep shadow-md transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  <BriefcaseBusiness className="h-4 w-4 text-emerald-700" /> Post a Project Now
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-7 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <UserPlus className="h-4 w-4" /> Apply as Freelancer
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-white/70">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-300" /> Zero listing fee
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-300" /> Safepay Escrow protection
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-300" /> 10-Question AI test
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
