"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, subscribeTalent } from "@/lib/tasks";
import { formatPKR } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";

type TalentRecord = {
  id: string;
  name?: string;
  avatarUrl?: string;
  professionalTitle?: string;
  bio?: string;
  city?: string;
  skills?: string[];
  hourlyRate?: number;
  experienceYears?: number;
  trustScore?: number;
  interviewStatus?: string;
  availability?: string;
  verified?: boolean;
};

export default function TalentPage() {
  const { capabilities } = useAuth();
  const [talent, setTalent] = useState<TalentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("all");
  const [sort, setSort] = useState<"trust" | "rate_low" | "rate_high" | "experience">("trust");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Realtime talent directory — respects private-profile rules correctly (isPrivate==false).
    try {
      return subscribeTalent(
        (users) => {
          setTalent(users as TalentRecord[]);
          setLoading(false);
          setLive(true);
        },
        () => setLoading(false)
      );
    } catch {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    let list = talent.slice();
    if (skill !== "all") list = list.filter((item) => (item.skills || []).includes(skill));
    if (verifiedOnly) list = list.filter((item) => item.interviewStatus === "verified");
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(needle) ||
          (item.professionalTitle || "").toLowerCase().includes(needle) ||
          (item.city || "").toLowerCase().includes(needle) ||
          (item.skills || []).some((entry) => entry.toLowerCase().includes(needle))
      );
    }
    switch (sort) {
      case "rate_low":
        return list.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
      case "rate_high":
        return list.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
      case "experience":
        return list.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
      default:
        return list.sort((a, b) => (b.trustScore || 70) - (a.trustScore || 70));
    }
  }, [talent, skill, verifiedOnly, search, sort]);

  return (
    <div className="bg-canvas py-8 sm:py-12">
      <div className="page-shell">
        <section className="relative overflow-hidden rounded-[32px] bg-ink p-7 text-white shadow-elevated sm:p-10">
          <div className="absolute inset-0 noise opacity-50" />
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-brand-300">
                <Sparkles className="h-3.5 w-3.5" /> Talent directory
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Find people who deliver.</h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/60">
                Browse freelancers by skill, city and verification. Post a task and invite the ones you like to bid.
              </p>
            </div>
            {capabilities.canPostTask && (
              <Link href="/post">
                <Button className="bg-white text-ink shadow-none hover:bg-brand-100 hover:text-ink">
                  Post a task <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
            <input
              placeholder="Search by name, skill or city..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-12 w-full rounded-xl bg-ink-50 py-3 pl-11 pr-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <Select value={skill} onChange={(event) => setSkill(event.target.value)} className="min-h-12 lg:w-48">
            <option value="all">All skills</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="min-h-12 lg:w-48"
          >
            <option value="trust">Highest trust</option>
            <option value="experience">Most experienced</option>
            <option value="rate_low">Lowest rate</option>
            <option value="rate_high">Highest rate</option>
          </Select>
          <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl bg-ink-50 px-4">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) => setVerifiedOnly(event.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
            />
            <span className="whitespace-nowrap text-xs font-black text-ink-600">Verified only</span>
          </label>
        </div>

        <div className="mb-4 mt-6 flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">
              Talent {live && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">● Live</span>}
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">
              {loading ? "Finding talent…" : `${filtered.length} ${filtered.length === 1 ? "freelancer" : "freelancers"}`}
            </h2>
          </div>
          {live && <span className="hidden text-xs font-bold text-emerald-600 sm:inline">Realtime</span>}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <Skeleton key={index} className="h-56" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface">
            <EmptyState
              icon={Users}
              title="No matching freelancers"
              description="Try a broader search, or post your task and let the right people come to you."
              action={
                capabilities.canPostTask ? (
                  <Link href="/post">
                    <Button>Post a task</Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((person) => (
              <Link
                key={person.id}
                href={`/u/${person.id}`}
                className="group flex flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar name={person.name} src={person.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-black text-ink transition group-hover:text-brand-dark">
                        {person.name || "Workly freelancer"}
                      </p>
                      {person.interviewStatus === "verified" && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-bold text-brand-dark">
                      {person.professionalTitle || "Freelancer"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-ink-400">
                      {person.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {person.city}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-sun" /> Trust {person.trustScore ?? 70}
                      </span>
                    </div>
                  </div>
                </div>

                {person.bio && <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink-500">{person.bio}</p>}

                {person.skills && person.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {person.skills.slice(0, 3).map((item) => (
                      <span key={item} className="rounded-lg bg-ink-50 px-2 py-1 text-[10px] font-black text-ink-600">
                        {item}
                      </span>
                    ))}
                    {person.skills.length > 3 && (
                      <span className="rounded-lg bg-ink-50 px-2 py-1 text-[10px] font-black text-ink-400">
                        +{person.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between border-t border-ink-100 pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">Rate</p>
                    <p className="mt-0.5 text-base font-black text-ink">
                      {person.hourlyRate ? `${formatPKR(person.hourlyRate)}/hr` : "On request"}
                    </p>
                  </div>
                  {person.availability && <Badge>{person.availability}</Badge>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-3xl bg-ink p-7 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <ShieldCheck className="h-6 w-6 text-brand-light" />
              <h2 className="mt-4 text-2xl font-black tracking-[-0.035em]">Hire with confidence</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Every verified badge means a human reviewer checked real evidence of the freelancer&apos;s work — not just
                a self-written profile.
              </p>
            </div>
            <Link href="/how-it-works#safety">
              <Button className="bg-white text-ink shadow-none hover:bg-brand-100 hover:text-ink">
                How verification works <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
