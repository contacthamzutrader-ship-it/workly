"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import TaskerPage from "@/components/TaskerPage";
import TaskCard from "@/components/TaskCard";
import { useAuth } from "@/lib/auth-context";
import { useDashboardPrefs } from "@/components/DashboardPrefs";
import { listPublicTasks, CATEGORIES, type Task } from "@/lib/tasks";
import { computeBidMatch } from "@/lib/matching";

const sortOptions = [
  { key: "recommended", label: "Recommended" },
  { key: "recent", label: "Most recent" },
  { key: "due_soon", label: "Due soon" },
  { key: "lowest_price", label: "Lowest price" },
  { key: "highest_price", label: "Highest price" },
] as const;

export default function BrowsePage() {
  const { user } = useAuth();
  const { filters, sort, setFilters, setSort } = useDashboardPrefs();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [profile, setProfile] = useState({ trust: 70, success: 80, skills: [] as string[] });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listPublicTasks();
        if (!cancelled) setTasks(list.filter((t) => t.status === "open"));
      } catch {
        if (!cancelled) setTasks([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const sorted = useMemo(() => {
    if (!tasks) return [];
    let list = [...tasks];
    if (filters.availableOnly) list = list.filter((t) => t.status === "open");
    if (filters.noOffersOnly) list = list.filter((t) => t.bidsCount === 0);
    if (category !== "all") list = list.filter((t) => t.category === category);
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
    else list.sort((a, b) => (computeBidMatch(b, profile).percent) - (computeBidMatch(a, profile).percent) || (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filters, sort, search, category]);

  const activeSwitches = Number(filters.availableOnly) + Number(filters.noOffersOnly);

  return (
    <TaskerPage>
      <div className="font-ui space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="page-eyebrow">Browse Tasks</p>
            <h1 className="page-title">Available tasks</h1>
            <p className="page-sub">
              {sorted === null ? "Loading the latest opportunities..." : `${sorted.length} ${sorted.length === 1 ? "task" : "tasks"} you can send an offer on`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                placeholder="Search by skill, task or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-ink-100 bg-white py-3 pl-11 pr-4 text-sm font-medium text-ink placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-12 rounded-xl border border-ink-100 bg-white px-4 text-sm font-semibold text-ink focus:border-brand-300 focus:outline-none"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <button
              onClick={() => setFilters({ ...filters, availableOnly: !filters.availableOnly })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${filters.availableOnly ? "border-brand-300 bg-brand-50 text-brand-dark" : "border-ink-100 bg-white text-ink-500 hover:border-ink-200"}`}
            >
              Available only
            </button>
            <button
              onClick={() => setFilters({ ...filters, noOffersOnly: !filters.noOffersOnly })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${filters.noOffersOnly ? "border-brand-300 bg-brand-50 text-brand-dark" : "border-ink-100 bg-white text-ink-500 hover:border-ink-200"}`}
            >
              No offers yet
            </button>
            {(activeSwitches > 0 || search || category !== "all") && (
              <button
                onClick={() => { setFilters({ availableOnly: false, noOffersOnly: false }); setSearch(""); setCategory("all"); }}
                className="text-xs font-semibold text-ink-400 underline-offset-2 transition hover:text-ink"
              >
                Clear all
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-medium text-ink-400">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-brand-300 focus:outline-none"
              >
                {sortOptions.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-2">
          {sorted === null ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl border border-ink-100 bg-white" />)}</div>
          ) : sorted.length === 0 ? (
            <div className="card py-20 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Search className="h-6 w-6" /></span>
              <h3 className="mt-5 text-lg font-bold text-ink">No matching tasks right now</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">Try adjusting your filters or search, or check back soon for new opportunities.</p>
              <Link href="/dashboard" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">Back to dashboard <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{sorted.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          )}
        </div>
      </div>
    </TaskerPage>
  );
}