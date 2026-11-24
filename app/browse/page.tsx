"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CheckCircle2, ChevronDown, Globe, List, Map as MapIcon, MapPin, Search, ShieldCheck, Sparkles, Star, Users, X } from "lucide-react";
import TaskerPage from "@/components/TaskerPage";
import TaskCard from "@/components/TaskCard";
import { useAuth } from "@/lib/auth-context";
import { useDashboardPrefs } from "@/components/DashboardPrefs";
import { listPublicTasks, CATEGORIES, type Task } from "@/lib/tasks";
import { computeBidMatch } from "@/lib/matching";
import { formatDate, formatPKR } from "@/lib/format";

type ViewMode = "list" | "map";

interface TalentMember {
  id: string;
  name: string;
  role: string;
  city: string;
  avatar: string;
  tier: string;
  rate: string;
  score: number;
  domain: string;
  skills: string[];
  jobsDone: number;
  rating: number;
  browseCategory: string;
}

const verifiedTalentPool: TalentMember[] = [
  {
    id: "dev-ayesha",
    name: "Ayesha R.",
    role: "Senior Full Stack & Next.js Engineer",
    city: "Lahore",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 4,500/hr",
    score: 98,
    domain: "Web & Software Development",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    jobsDone: 24,
    rating: 4.95,
    browseCategory: "Web & Software Development",
  },
  {
    id: "des-hamza",
    name: "Hamza M.",
    role: "Product & UI/UX Systems Designer",
    city: "Karachi",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 3,800/hr",
    score: 96,
    domain: "Design & Creative",
    skills: ["Figma", "Design Systems", "Mobile UX", "Prototypes", "Wireframes"],
    jobsDone: 19,
    rating: 4.9,
    browseCategory: "Design & Creative",
  },
  {
    id: "ai-zainab",
    name: "Zainab K.",
    role: "AI Workflow & Python Architect",
    city: "Islamabad",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 5,000/hr",
    score: 95,
    domain: "AI & Machine Learning",
    skills: ["Python", "LangChain", "FastAPI", "Prompt Engineering", "ETL"],
    jobsDone: 16,
    rating: 5.0,
    browseCategory: "AI & Machine Learning",
  },
  {
    id: "mob-usman",
    name: "Usman T.",
    role: "Mobile App Engineer (Flutter & iOS)",
    city: "Faisalabad",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    tier: "Professional Tier",
    rate: "PKR 4,200/hr",
    score: 94,
    domain: "Web & Software Development",
    skills: ["Flutter", "Dart", "Firebase", "State Management", "REST APIs"],
    jobsDone: 21,
    rating: 4.85,
    browseCategory: "Web & Software Development",
  },
  {
    id: "ops-mahnoor",
    name: "Mahnoor S.",
    role: "Virtual Operations & Project Lead",
    city: "Karachi",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    tier: "Professional Tier",
    rate: "PKR 2,800/hr",
    score: 93,
    domain: "Operations & Admin",
    skills: ["Project Management", "Notion", "CRM Operations", "Zapier"],
    jobsDone: 18,
    rating: 4.95,
    browseCategory: "Operations & Admin",
  },
  {
    id: "dev-tariq",
    name: "Tariq N.",
    role: "Backend & Cloud Systems Engineer",
    city: "Islamabad",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    tier: "Elite Tier • Top 5%",
    rate: "PKR 4,800/hr",
    score: 97,
    domain: "Web & Software Development",
    skills: ["Node.js", "Docker", "AWS", "PostgreSQL", "Redis", "Kafka"],
    jobsDone: 27,
    rating: 4.9,
    browseCategory: "Web & Software Development",
  },
];
export default function BrowsePage() {
  const { user } = useAuth();
  const { filters, sort, setFilters, priceRange, remoteMode, setPriceRange, setRemoteMode } = useDashboardPrefs();
  const [mode, setMode] = useState<"talent" | "tasks">("talent");
  const [talentDomain, setTalentDomain] = useState("all");
  const [talentTier, setTalentTier] = useState("all");
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [profile, setProfile] = useState({ trust: 70, success: 80, skills: [] as string[] });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<ViewMode>("list");
  const [catPanelOpen, setCatPanelOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<string | null>(null);
  const catPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    if (modeParam === "tasks") setMode("tasks");
    else if (modeParam === "talent") setMode("talent");

    const paramCategory = params.get("category") || "";
    if (CATEGORIES.includes(paramCategory)) {
      setCategory(paramCategory);
      setTalentDomain(paramCategory);
    }
    const q = params.get("q");
    if (q) {
      setSearch(q);
      setSearchInput(q);
    }
    if (params.get("view") === "map") setView("map");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listPublicTasks();
        if (!cancelled) setTasks(list.filter((t) => t.status === "open"));
      } catch {
        if (!cancelled) setTasks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTalents = useMemo(() => {
    let list = [...verifiedTalentPool];
    if (talentDomain !== "all") {
      list = list.filter(
        (t) =>
          t.domain.toLowerCase().includes(talentDomain.toLowerCase()) ||
          t.browseCategory.toLowerCase().includes(talentDomain.toLowerCase())
      );
    }
    if (talentTier !== "all") {
      list = list.filter((t) => t.tier.toLowerCase().includes(talentTier.toLowerCase()));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.name, t.role, t.city, t.domain, ...t.skills].join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [talentDomain, talentTier, search]);

  useEffect(() => {
    if (!catPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (catPanelRef.current && !catPanelRef.current.contains(e.target as Node)) setCatPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catPanelOpen]);

  const REMOTE_KEY = "__remote__";

  const isRemoteLocation = (loc?: string) => {
    const s = (loc || "").trim().toLowerCase();
    if (!s) return true;
    return ["remote", "online", "anywhere", "virtual", "work from home", "wfh", "from home", "hybrid"].some((k) => s.includes(k));
  };

  const sorted = useMemo(() => {
    if (!tasks) return [];
    let list = [...tasks];
    if (filters.availableOnly) list = list.filter((t) => t.status === "open");
    if (filters.hideAssigned) list = list.filter((t) => t.status !== "assigned");
    if (filters.noOffersOnly) list = list.filter((t) => t.bidsCount === 0);
    if (filters.hideHasOffers) list = list.filter((t) => t.bidsCount === 0);
    if (remoteMode === "remote") list = list.filter((t) => isRemoteLocation(t.location));
    if (remoteMode === "in_person") list = list.filter((t) => !isRemoteLocation(t.location));
    if (category !== "all") list = list.filter((t) => t.category === category);
    if (priceRange) {
      list = list.filter((t) => t.budget >= priceRange.min && t.budget <= priceRange.max);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.title, t.description, t.category, t.location, t.posterName].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    if (sort === "recent") list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    else if (sort === "due_soon") list.sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));
    else if (sort === "lowest_price") list.sort((a, b) => a.budget - b.budget);
    else if (sort === "highest_price") list.sort((a, b) => b.budget - a.budget);
    else {
      const matchMap = new Map<string, number>();
      for (const t of list) {
        matchMap.set(t.id!, computeBidMatch(t, profile).percent);
      }
      list.sort((a, b) => (matchMap.get(b.id!) ?? 0) - (matchMap.get(a.id!) ?? 0) || (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filters, sort, search, category, priceRange, remoteMode]);

  const locationGroups = useMemo(() => {
    const physical = new Map<string, Task[]>();
    const remote: Task[] = [];
    sorted.forEach((t) => {
      if (isRemoteLocation(t.location)) {
        remote.push(t);
        return;
      }
      const key = (t.location || "").trim() || "Unspecified";
      physical.set(key, [...(physical.get(key) || []), t]);
    });
    return { physical: Array.from(physical.entries()), remote, remoteCount: remote.length };
  }, [sorted]);

  const mapTasks = useMemo(() => {
    if (!mapLocation) return sorted;
    if (mapLocation === REMOTE_KEY) return locationGroups.remote;
    return locationGroups.physical.find(([loc]) => loc === mapLocation)?.[1] || [];
  }, [mapLocation, sorted, locationGroups]);

  const taskHref = (t: Task) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search.trim()) params.set("q", search.trim());
    if (view === "map") params.set("view", "map");
    const qs = params.toString();
    return `/tasks/${t.id}${qs ? `?${qs}` : ""}`;
  };

  const hasActiveFilters = filters.availableOnly || filters.hideAssigned || filters.noOffersOnly || filters.hideHasOffers || remoteMode !== "all" || priceRange !== null || search.trim() !== "" || category !== "all";

  const clearAll = () => {
    setFilters({ availableOnly: false, noOffersOnly: false, hideAssigned: false, hideHasOffers: false });
    setPriceRange(null);
    setRemoteMode("all");
    setSearch("");
    setSearchInput("");
    setCategory("all");
  };

  const commitSearch = () => setSearch(searchInput.trim());

  const toggleClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition ${active ? "bg-brand-50 text-brand" : "text-ink-500 hover:bg-ink-50 hover:text-ink"
    }`;

  return (
    <TaskerPage>
      <div className="font-ui space-y-6">
        {/* Dual Mode Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("talent")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition ${
                mode === "talent"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Verified Talent ({verifiedTalentPool.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("tasks")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition ${
                mode === "tasks"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4 text-emerald-600" />
              <span>Open Tasks ({sorted ? sorted.length : "..."})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {mode === "talent" ? (
              <Link
                href="/post"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Post a Job for Talent</span>
              </Link>
            ) : (
              <Link
                href="/ai-interview"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-95"
              >
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                <span>Take Skill Test</span>
              </Link>
            )}
          </div>
        </div>

        {mode === "talent" ? (
          /* =======================================
             MODE 1: VERIFIED TALENT DIRECTORY
             ======================================= */
          <div className="space-y-6">
            {/* Page Header */}
            <div>
              <p className="page-eyebrow">VERIFIED TALENT DIRECTORY</p>
              <h1 className="page-title">Hire Pakistan&apos;s Top Verified Freelancers.</h1>
              <p className="page-sub">
                Pre-vetted professionals evaluated with proctored technical tests and code audits. Zero review bias, 100% escrow payment protected.
              </p>
            </div>

            {/* Talent Search and Filters */}
            <div className="card p-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search talent by skill, name, role (e.g. Next.js, Figma, Python AI)..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitSearch();
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                      }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={commitSearch}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <Search className="h-4 w-4" /> Search
                </button>
              </div>

              {/* Domain & Tier Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">Domain:</span>
                  {[
                    { id: "all", label: "All Categories" },
                    { id: "Web & Software Development", label: "Web & Software" },
                    { id: "Design & Creative", label: "UI/UX & Design" },
                    { id: "AI & Machine Learning", label: "AI & Data" },
                    { id: "Operations & Admin", label: "Operations" },
                  ].map((dom) => (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => setTalentDomain(dom.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        talentDomain === dom.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      {dom.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">Tier:</span>
                  {[
                    { id: "all", label: "All Tiers" },
                    { id: "Elite", label: "Top 5% Elite" },
                    { id: "Professional", label: "Professional" },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setTalentTier(tier.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        talentTier === tier.id
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {filteredTalents.length} {filteredTalents.length === 1 ? "Verified Freelancer" : "Verified Freelancers"} Available
              </h2>
              {(talentDomain !== "all" || talentTier !== "all" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setTalentDomain("all");
                    setTalentTier("all");
                    setSearch("");
                    setSearchInput("");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <X className="h-3.5 w-3.5" /> Clear Filters
                </button>
              )}
            </div>

            {/* Talent Grid */}
            {filteredTalents.length === 0 ? (
              <div className="card px-6 py-16 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">No freelancers found</h3>
                <p className="mt-1 text-sm text-slate-500">Try loosening your search query or selecting All Categories.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTalentDomain("all");
                    setTalentTier("all");
                    setSearch("");
                    setSearchInput("");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Reset Talent Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTalents.map((t) => (
                  <div
                    key={t.id}
                    className="card group flex flex-col justify-between p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-hover"
                  >
                    <div>
                      {/* Top Row: Avatar & Status & Tier */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="relative">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                          />
                          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                            <BadgeCheck className="h-3 w-3" />
                          </span>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">
                          {t.tier}
                        </span>
                      </div>

                      {/* Name & Title */}
                      <h3 className="mt-3.5 text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                        {t.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        {t.role} · {t.city}
                      </p>

                      {/* Proctored Benchmark Badge */}
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600">Proctored Benchmark</span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {t.score}% Score
                        </span>
                      </div>

                      {/* Skills List */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {t.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-lg border border-slate-200/80 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row: Stats & Action */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
                        <span className="text-sm font-black text-slate-900">{t.rate}</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {t.rating} ({t.jobsDone} projects)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/u/${t.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/post?tasker=${t.id}`}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                        >
                          <span>Hire</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* =======================================
             MODE 2: OPEN TASKS DIRECTORY
             ======================================= */
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <p className="page-eyebrow">OPPORTUNITY FEED</p>
              <h1 className="page-title">Find work worth doing.</h1>
              <p className="page-sub">Explore approved tasks, find suitable opportunities, and build your freelance reputation.</p>
            </div>

            {/* Search + controls */}
            <div className="card p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    placeholder="Search by skill, task or location..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitSearch(); }}
                    className="min-h-11 w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-11 pr-10 text-sm font-medium text-ink placeholder:text-ink-400 transition-shadow focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(""); setSearch(""); }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={commitSearch}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <Search className="h-4 w-4" /> Search
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                <div className="relative" ref={catPanelRef}>
                  <button
                    onClick={() => setCatPanelOpen(!catPanelOpen)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${catPanelOpen
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-ink-200 bg-white text-ink-600 hover:border-emerald-200 hover:text-ink"
                      }`}
                  >
                    {category === "all" ? "All categories" : category}
                    <ChevronDown className={`h-4 w-4 transition-transform ${catPanelOpen ? "rotate-180" : ""}`} />
                  </button>

                  {catPanelOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-64 overflow-y-auto rounded-2xl border border-ink-100 bg-white p-1.5 shadow-elevated">
                      <button
                        onClick={() => { setCategory("all"); setCatPanelOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${category === "all" ? "bg-emerald-50 text-emerald-800" : "text-ink-600 hover:bg-ink-50"
                          }`}
                      >
                        All categories
                      </button>
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => { setCategory(c); setCatPanelOpen(false); }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${category === c ? "bg-emerald-50 text-emerald-800" : "text-ink-600 hover:bg-ink-50"
                            }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1">
                  <button onClick={() => { setView("list"); setMapLocation(null); }} className={toggleClass(view === "list")}>
                    <List className="h-4 w-4" /> List View
                  </button>
                  <button onClick={() => setView("map")} className={toggleClass(view === "map")}>
                    <MapIcon className="h-4 w-4" /> Map View
                  </button>
                </div>
              </div>
            </div>

            {/* Results heading */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">Available Tasks</h2>
                {sorted !== null && (
                  <p className="mt-0.5 text-sm font-medium text-ink-500">
                    {sorted.length} {sorted.length === 1 ? "task" : "tasks"} matching your search
                  </p>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-400 transition hover:text-ink"
                >
                  <X className="h-4 w-4" /> Clear filters
                </button>
              )}
            </div>

            {/* Results */}
            {sorted === null ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl border border-ink-100 bg-white" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="card px-6 py-16 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
                  <Search className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">No tasks found</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">Try changing your search or filters.</p>
                <button
                  onClick={clearAll}
                  className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Clear Filters
                </button>
              </div>
            ) : view === "map" ? (
              <div className="space-y-4">
                {/* Mobile location picker */}
                <div className="lg:hidden">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-400">Browse by location</label>
                  <select
                    value={mapLocation ?? "all"}
                    onChange={(e) => setMapLocation(e.target.value === "all" ? null : e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-ink-100 bg-white px-3 text-sm font-semibold text-ink focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All locations ({sorted.length})</option>
                    {locationGroups.physical.map(([loc, items]) => (
                      <option key={loc} value={loc}>
                        {loc} ({items.length})
                      </option>
                    ))}
                    <option value={REMOTE_KEY}>Remote / Online ({locationGroups.remoteCount})</option>
                  </select>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                  {/* Map task list */}
                  <div>
                    {mapTasks.length === 0 ? (
                      <div className="card px-6 py-14 text-center">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
                          <MapPin className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-ink">No tasks found nearby</h3>
                        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">Choose another location or clear your filters.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mapTasks.map((t) => (
                          <Link
                            key={t.id}
                            href={taskHref(t)}
                            className="card group flex items-start gap-4 p-4 transition hover:border-emerald-300 hover:shadow-card-hover"
                          >
                            <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                              {isRemoteLocation(t.location) ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="min-w-0 text-[17px] font-bold text-ink transition group-hover:text-emerald-700">{t.title}</h3>
                                <p className="shrink-0 text-sm font-extrabold text-ink">{formatPKR(t.budget)}</p>
                              </div>
                              <p className="mt-1 line-clamp-1 text-sm text-ink-500">{t.category} · {t.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-ink-500">
                                {isRemoteLocation(t.location) ? (
                                  <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-ink-400" /> {t.location || "Remote"}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {t.location}</span>
                                )}
                                {t.deadline && <span>Due {formatDate(t.deadline)}</span>}
                                <span>{t.bidsCount} {t.bidsCount === 1 ? "offer" : "offers"}</span>
                              </div>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 flex-none text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location panel */}
                  <aside className="card sticky top-24 hidden p-4 lg:block">
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-emerald-600" />
                      <p className="page-eyebrow">Browse by location</p>
                    </div>
                    <div className="mt-3 space-y-1">
                      <button
                        onClick={() => setMapLocation(null)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${mapLocation === null ? "bg-emerald-50 text-emerald-800" : "text-ink-600 hover:bg-ink-50"
                          }`}
                      >
                        All locations
                        <span className="float-right text-xs font-bold text-ink-400">{sorted.length}</span>
                      </button>
                      {locationGroups.physical.map(([loc, items]) => (
                        <button
                          key={loc}
                          onClick={() => setMapLocation(loc)}
                          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${mapLocation === loc ? "bg-emerald-50 text-emerald-800" : "text-ink-600 hover:bg-ink-50"
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-none text-ink-400" />
                            <span className="min-w-0 truncate">{loc}</span>
                          </span>
                          <span className="float-right text-xs font-bold text-ink-400">{items.length}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => setMapLocation(REMOTE_KEY)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${mapLocation === REMOTE_KEY ? "bg-emerald-50 text-emerald-800" : "text-ink-600 hover:bg-ink-50"
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4 flex-none text-ink-400" />
                          Remote / Online
                        </span>
                        <span className="float-right text-xs font-bold text-ink-400">{locationGroups.remoteCount}</span>
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {sorted.map((t) => (
                  <TaskCard key={t.id} task={t} href={taskHref(t)} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </TaskerPage>
  );
}