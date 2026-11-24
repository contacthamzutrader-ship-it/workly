"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Search,
  SearchCheck,
  Send,
  ShieldCheck,
  ShieldX,
  Star,
  Target,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import AventriqMark from "@/components/AventriqMark";
import { formatPKR } from "@/lib/format";

const stats = [
  { value: "10K+", label: "Verified Freelancers" },
  { value: "5K+", label: "Projects Completed" },
  { value: "50+", label: "Skill Categories" },
  { value: "3-Tier", label: "Verified Talent" },
];

const trustCards = [
  { icon: BadgeCheck, title: "Verified Skills", body: "Practical skill verification" },
  { icon: BrainCircuit, title: "Smart Matching", body: "Relevant freelancer recommendations" },
  { icon: Star, title: "Trust Scores", body: "Performance-based reputation" },
  { icon: Lock, title: "Secure Payments", body: "Protected project payments" },
];

const whyCards = [
  { icon: FileCheck2, title: "Skill Verification", body: "Freelancers can demonstrate their skills through practical assessments." },
  { icon: Users, title: "Fair Talent Discovery", body: "New and experienced freelancers get opportunities based on verified capabilities and performance." },
  { icon: Radar, title: "Smart Recommendations", body: "Clients are connected with relevant freelancers based on project requirements." },
  { icon: ShieldX, title: "Fraud Protection", body: "Intelligent systems identify suspicious accounts, proposals, reviews, and activities." },
  { icon: Rocket, title: "Fresh Talent Boost", body: "Verified beginners can receive additional visibility to help them build their first reputation." },
  { icon: Wallet, title: "Secure Transactions", body: "Protected payment workflows help create confidence between clients and freelancers." },
];

const clientSteps = [
  { icon: ClipboardList, step: "01", title: "Post a Job", body: "Describe your project and requirements." },
  { icon: BrainCircuit, step: "02", title: "Find Talent", body: "Review relevant freelancers for your project." },
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
  { icon: Mic, title: "Skill Interview", body: "Showcase your technical skills through practical assessments." },
  { icon: LineChart, title: "Merit Ranking", body: "Get ranked based on skills, performance, trust, and client satisfaction." },
  { icon: Radar, title: "Smart Recommendations", body: "Discover projects and talent relevant to your requirements." },
  { icon: ShieldX, title: "Fraud Detection", body: "Identify suspicious activity and protect the marketplace." },
  { icon: Lightbulb, title: "Career Insights", body: "Help freelancers understand their strengths and growth opportunities." },
];

const categories = [
  { icon: Laptop2, name: "Web & App Development", count: "React, Node, Next.js, Python" },
  { icon: Paintbrush, name: "UI/UX & Product Design", count: "Figma, Design Systems" },
  { icon: BrainCircuit, name: "AI, Automation & Data", count: "LLMs, Workflows, Scraping" },
  { icon: Paintbrush, name: "Graphic Design & Branding", count: "Brand Identity, Social Assets" },
  { icon: MessageSquareText, name: "Technical Writing & Content", count: "Docs, Copy, Blogs" },
  { icon: BriefcaseBusiness, name: "Virtual Assistance & Operations", count: "Admin, CRM, Support" },
];

const topFreelancers = [
  { name: "Ayesha R.", title: "UI/UX & Product Designer", city: "Lahore", jobs: 12, rating: 4.9, avatar: "https://i.pravatar.cc/150?img=5", tag: "First job in 3 weeks" },
  { name: "Tariq M.", title: "Cloud & Backend Engineer", city: "Islamabad", jobs: 11, rating: 4.9, avatar: "https://i.pravatar.cc/150?img=11", tag: "First job in 2 weeks" },
  { name: "Mahnoor S.", title: "Virtual Assistant & Operations", city: "Karachi", jobs: 15, rating: 5.0, avatar: "https://i.pravatar.cc/150?img=9", tag: "First job in 1 week" },
  { name: "Usman T.", title: "AI & Python Developer", city: "Faisalabad", jobs: 8, rating: 4.7, avatar: "https://i.pravatar.cc/150?img=12", tag: "First job in 4 weeks" },
];

const showcaseTalents = [
  {
    id: "dev-1",
    name: "Ayesha R.",
    role: "Full Stack & Next.js Engineer",
    city: "Lahore",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 4,500/hr",
    score: "98% Score",
    domain: "Web & Software",
    skills: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    browseCategory: "Web & Software Development",
  },
  {
    id: "des-1",
    name: "Hamza M.",
    role: "Product & UI/UX Systems Designer",
    city: "Karachi",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 3,800/hr",
    score: "96% Score",
    domain: "UI/UX Design",
    skills: ["Figma Systems", "Design Tokens", "Mobile UX", "Prototypes"],
    browseCategory: "Design & Creative",
  },
  {
    id: "ai-1",
    name: "Zainab K.",
    role: "AI Workflow & Python Architect",
    city: "Islamabad",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    tier: "Professional Tier",
    rate: "PKR 5,000/hr",
    score: "95% Score",
    domain: "AI & Data",
    skills: ["Python", "LangChain", "FastAPI", "Agentic Workflows"],
    browseCategory: "AI & Machine Learning",
  },
  {
    id: "mob-1",
    name: "Usman T.",
    role: "Mobile App Engineer (Flutter & iOS)",
    city: "Faisalabad",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 4,200/hr",
    score: "97% Score",
    domain: "Web & Software",
    skills: ["Flutter", "Dart", "Firebase", "State Management"],
    browseCategory: "Web & Software Development",
  },
];

export default function Home() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState("All");

  const filteredTalents =
    activeDomain === "All"
      ? showcaseTalents
      : showcaseTalents.filter((t) => t.domain === activeDomain);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroQuery.trim()) {
      router.push("/browse");
      return;
    }
    router.push(`/browse?q=${encodeURIComponent(heroQuery.trim())}`);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-canvas text-ink">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-25" />

        <div className="page-shell relative pb-20 pt-8 lg:pb-28 lg:pt-14">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Zero Reviews? Zero Problem.
              </span>
              <p className="mt-5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-700">
                <AventriqMark className="h-5 w-5" />
                <span>Pakistan&apos;s Smarter Freelancing Marketplace, Powered by AI.</span>
              </p>
              <h1 className="mt-3 max-w-2xl text-balance text-[2rem] font-black leading-[1.12] tracking-[-0.03em] text-slate-900 sm:text-[2.6rem] lg:text-[3rem]">
                Hire Pakistan&apos;s Top 5%{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-brand to-forest bg-clip-text text-transparent">
                  Verified Talent
                </span>
                . Skip the Review Trap.
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-slate-600">
                New to freelancing or looking to hire proven specialists? Connect with pre-vetted professionals evaluated on real code and practical tests — zero fake reviews, 100% escrow payment protected.
              </p>

              {/* Interactive Live Hero Search Bar */}
              <form onSubmit={handleHeroSearch} className="mt-8 max-w-xl">
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                  <Search className="ml-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Search: 'Next.js', 'Python AI', 'Figma', 'Flutter'..."
                    aria-label="Search talent or skills"
                    className="w-full bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"
                  >
                    <span>Search</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Popular:</span>
                  {[
                    { label: "Next.js & React", q: "React" },
                    { label: "Python & AI", q: "Python" },
                    { label: "UI/UX Figma", q: "UI/UX" },
                    { label: "Node APIs", q: "Node" },
                    { label: "Flutter Mobile", q: "Mobile" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setHeroQuery(chip.q);
                        router.push(`/browse?q=${encodeURIComponent(chip.q)}`);
                      }}
                      className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-xs transition hover:border-brand hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </form>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/browse"
                  className="inline-flex min-h-12 sm:min-h-14 items-center justify-center gap-2 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-forest transition hover:-translate-y-0.5 hover:bg-brand-700 active:scale-[0.98]"
                >
                  <span>Hire Verified Talent</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/ai-interview"
                  className="inline-flex min-h-12 sm:min-h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold text-slate-800 shadow-xs transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                >
                  <span>Take 15-Min Skill Test</span>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Zero Review Bias
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Proctored Code &amp; Skill Audit
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 100% Escrow Protected
                </span>
              </div>
            </div>

            {/* Right Column: Live Verified Talent Showcase */}
            <div className="relative mx-auto w-full max-w-xl">
              {/* Subtle ambient backglow */}
              <div className="pointer-events-none absolute -right-6 -top-6 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />

              {/* Main Talent Showcase Container */}
              <div className="relative rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xl sm:p-6">
                {/* Showcase Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Verified Talent
                    </span>
                    <h2 className="text-base font-bold text-slate-900">Active Professionals in Pakistan</h2>
                  </div>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    <span>Browse All Talent</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Domain Filter Pills */}
                <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {["All", "Web & Software", "UI/UX Design", "AI & Data"].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setActiveDomain(domain)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${activeDomain === domain
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                        }`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>

                {/* Talent Cards Stack */}
                <div className="mt-4 space-y-3">
                  {filteredTalents.slice(0, 3).map((talent) => (
                    <div
                      key={talent.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 transition duration-200 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={talent.avatar}
                            alt={talent.name}
                            className="h-12 w-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
                          />
                          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
                            <BadgeCheck className="h-3 w-3" />
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                              {talent.name}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200/60">
                              {talent.tier}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {talent.role} · {talent.city}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {talent.skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/60"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t border-slate-200/60 pt-2 sm:border-0 sm:pt-0 shrink-0">
                        <p className="text-xs font-black text-slate-900">{talent.rate}</p>
                        <Link
                          href={`/browse?category=${encodeURIComponent(talent.browseCategory)}`}
                          className="mt-1 inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                        >
                          <span>Hire</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Micro-Bar */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    100% Escrow Safepay Protected
                  </span>
                  <Link
                    href="/ai-interview"
                    className="font-bold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    Take Test to Join Pool →
                  </Link>
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
            <p className="mt-6 text-center text-[10px] text-ink-300">Target figures at launch — live statistics update automatically once AventriqTalent goes live.</p>
          </div>
        </div>
      </section>

      {/* 3-Tier Talent Engine */}
      <section className="bg-canvas py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Right Talent for Every Budget. Powered by Merit, Not Ratings.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">Entry Level</span>
              <h3 className="mt-4 text-xl font-black text-ink">Rising Talent (Fresh Graduates & High-Potential)</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">Quick turnaround, clean fundamentals, entry-level budgets.</p>
              <p className="mt-4 text-sm font-semibold text-ink-600">Best For: MVPs, bug fixes, basic UI implementations.</p>
              <span className="mt-4 inline-flex items-center rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-600">Affordable Rates • High Energy</span>
            </div>
            <div className="rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
              <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">Professional Level</span>
              <h3 className="mt-4 text-xl font-black text-ink">Professional Tier (Proven Practitioners)</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">Production-grade execution, minimal supervision.</p>
              <p className="mt-4 text-sm font-semibold text-ink-600">Best For: Full features, database optimizations, commercial projects.</p>
              <span className="mt-4 inline-flex items-center rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-600">Market Competitive • Fast Delivery</span>
            </div>
            <div className="rounded-2xl border-2 border-forest bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">Elite Level</span>
                <span className="inline-flex items-center rounded-full bg-brand px-2 py-1 text-[10px] font-extrabold text-white">Top 5%</span>
              </div>
              <h3 className="mt-4 text-xl font-black text-ink">Elite Tier (Architects & Seniors)</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">Mission-critical apps, complex architecture, enterprise solutions.</p>
              <p className="mt-4 text-sm font-semibold text-ink-600">Best For: Complex systems, tech leadership.</p>
              <span className="mt-4 inline-flex items-center rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-600">Premium Rates • Guaranteed Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Verification bar */}
      <section id="trust" className="scroll-mt-24 border-b border-ink-100 bg-canvas py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><ShieldCheck className="h-3.5 w-3.5" /> Trust &amp; safety</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Built for Trust. Designed for Talent.</h2>
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

      {/* Platform features */}
      <section id="ai" className="relative scroll-mt-24 bg-canvas py-24 text-ink">
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-40" />
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />
        <div className="page-shell relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><Target className="h-3.5 w-3.5" /> Platform features</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Smart Tools That Work for You.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">Smart tools are built into every part of AventriqTalent — from the first assessment to the final payment.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {aiCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><card.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-bold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{card.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Every project is backed by verified skills, fair ranking, and secure payments.</p>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="scroll-mt-24 bg-white py-20">
        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="eyebrow"><Laptop2 className="h-3.5 w-3.5" /> Explore marketplaces</span><h2 className="mt-5 max-w-xl text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Categories for every kind of work.</h2></div>
            <Link href="/tasks" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink">Browse all jobs <ArrowRight className="h-4 w-4" /></Link>
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

      {/* Why AventriqTalent */}
      <section id="why" className="scroll-mt-24 bg-canvas py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><BrainCircuit className="h-3.5 w-3.5" /> Why AventriqTalent?</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Freelancing, Reimagined for Pakistan.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">Not another marketplace clone. AventriqTalent is built to fix what breaks trust online — verification, discovery, and safety.</p>
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
      <section id="how-it-works" className="scroll-mt-24 bg-canvas py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><Compass className="h-3.5 w-3.5" /> How it works</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Post a job. Get matched. Get it done.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">For clients — four simple steps, with smart matching doing the heavy lifting.</p>
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
            <Link href="/#talent" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-300 bg-white px-6 text-sm font-extrabold text-ink transition hover:bg-brand-50"><SearchCheck className="h-4 w-4" /> Find freelancers</Link>
          </div>
        </div>
      </section>

      {/* Freelancer Journey */}
      <section id="journey" className="scroll-mt-24 bg-white py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow"><Target className="h-3.5 w-3.5" /> Freelancer journey</span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">How It Works: From Zero to Hired in 3 Steps</h2>
            <p className="mt-4 text-base font-medium leading-7 text-ink-500">No portfolio or old reviews required. Your work speaks for itself.</p>
          </div>
          <div className="mt-14">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="relative rounded-2xl border border-ink-100 bg-canvas p-7 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Step 01</span>
                <h3 className="mt-4 text-lg font-black text-ink">Pick Domain & Run the Assessment</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">Choose your domain (Web, UI/UX, Python, etc.) and solve a real practical test instead of boring multiple-choice questions.</p>
              </div>
              <div className="relative rounded-2xl border border-ink-100 bg-canvas p-7 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Step 02</span>
                <h3 className="mt-4 text-lg font-black text-ink">Get Your Instant Benchmark & Tier</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">It analyses code quality, logic, and speed to instantly assign your verified score and tier.</p>
                <div className="absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                  <svg width="60" height="2" className="stroke-brand-300" strokeDasharray="6 6">
                    <line x1="0" y1="1" x2="60" y2="1" />
                  </svg>
                </div>
              </div>
              <div className="relative rounded-2xl border border-ink-100 bg-canvas p-7 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Step 03</span>
                <h3 className="mt-4 text-lg font-black text-ink">Direct Client Visibility</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">Clients contact you directly based on your test score and tier. No more bid wars or review begging.</p>
                <div className="absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                  <svg width="60" height="2" className="stroke-brand-300" strokeDasharray="6 6">
                    <line x1="0" y1="1" x2="60" y2="1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/signup" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Start freelancing <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top talent */}
      <section id="talent" className="scroll-mt-24 bg-canvas py-20">
        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="eyebrow"><Award className="h-3.5 w-3.5" /> Top talent</span><h2 className="mt-5 max-w-xl text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">Verified freelancers, ready to start.</h2></div>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink">Hire talent <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topFreelancers.map((person) => (
              <div key={person.name} className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
                <div className="relative mx-auto h-16 w-16">
                  <img src={person.avatar} alt={person.name} className="h-16 w-16 rounded-2xl object-cover" />
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
          <div className="relative overflow-hidden rounded-3xl bg-forest p-10 text-center text-white shadow-elevated sm:p-16">
            <div className="pointer-events-none absolute inset-0 soft-grid opacity-40" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Your next project starts here.</h2>
              <p className="mx-auto mt-5 max-w-xl text-base font-medium text-white/75">Join free, verify your skills, and connect with work you&apos;re great at — from both sides of the table.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/signup" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-7 text-sm font-extrabold text-white shadow-forest transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"><UserPlus className="h-4 w-4" /> Start Freelancing</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
