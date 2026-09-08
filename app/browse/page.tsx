"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe, List, Map as MapIcon, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import TaskerPage from "@/components/TaskerPage";
import TaskCard from "@/components/TaskCard";
import { useAuth } from "@/lib/auth-context";
import { useDashboardPrefs } from "@/components/DashboardPrefs";
import { listPublicTasks, CATEGORIES, type Task } from "@/lib/tasks";
import { computeBidMatch } from "@/lib/matching";
import { formatDate, formatPKR } from "@/lib/format";

const sortOptions = [
  { key: "recommended", label: "Recommended" },
  { key: "recent", label: "Most recent posted" },
  { key: "due_soon", label: "Due soon" },
  { key: "lowest_price", label: "Lowest price" },
  { key: "highest_price", label: "Highest price" },
] as const;

type ViewMode = "list" | "map";

export default function BrowsePage() {
  const { user } = useAuth();
  const { filters, sort, setFilters, setSort } = useDashboardPrefs();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [profile, setProfile] = useState({ trust: 70, success: 80, skills: [] as string[] });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<ViewMode>("list");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<{ availableOnly: boolean; noOffersOnly: boolean }>(filters);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramCategory = params.get("category") || "";
    if (CATEGORIES.includes(paramCategory)) setCategory(paramCategory);
    const q = params.get("q");
    if (q) setSearch(q);
    if (params.get("view") === "map") setView("map");
  }, []);

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
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!filterPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setFilterPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterPanelOpen]);

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
    else list.sort((a, b) => computeBidMatch(b, profile).percent - computeBidMatch(a, profile).percent || (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filters, sort, search, category]);

  const REMOTE_KEY = "__remote__";

  const isRemoteLocation = (loc?: string) => {
    const s = (loc || "").trim().toLowerCase();
    if (!s) return true;
    return ["remote", "online", "anywhere", "virtual", "work from home", "wfh", "from home", "hybrid"].some((k) => s.includes(k));
  };

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

  const openFilterPanel = () => {
    setDraftFilters({ ...filters });
    setFilterPanelOpen(true);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setFilterPanelOpen(false);
  };

  const hasActiveFilters = filters.availableOnly || filters.noOffersOnly || search.trim() !== "" || category !== "all";

  const clearAll = () => {
    setFilters({ availableOnly: false, noOffersOnly: false });
    setSearch("");
    setCategory("all");
  };

  const toggleClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition ${
      active ? "bg-brand-50 text-brand" : "text-ink-500 hover:bg-ink-50 hover:text-ink"
    }`;

  return (
    <TaskerPage>
      <div className="font-ui space-y-6">
        {/* Page header */}
        <div>
          <p className="page-eyebrow">Browse Tasks</p>
          <h1 className="page-title">Find work worth doing.</h1>
          <p className="page-sub">Explore available tasks that match your skills and availability.</p>
        </div>

        {/* Search + controls */}
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
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => (filterPanelOpen ? setFilterPanelOpen(false) : openFilterPanel())}
                className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                  filterPanelOpen
                    ? "border-brand-300 bg-brand-50 text-brand"
                    : "border-ink-100 bg-white text-ink-600 hover:border-brand-200 hover:text-ink"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Other Filters
              </button>

              {filterPanelOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-4 shadow-elevated">
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={draftFilters.availableOnly}
                        onChange={(e) => setDraftFilters({ ...draftFilters, availableOnly: e.target.checked })}
                        className="h-4 w-4 rounded border-ink-200 accent-[#228B22]"
                      />
                      <span className="text-sm font-medium text-ink-700">Available tasks only</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={draftFilters.noOffersOnly}
                        onChange={(e) => setDraftFilters({ ...draftFilters, noOffersOnly: e.target.checked })}
                        className="h-4 w-4 rounded border-ink-200 accent-[#228B22]"
                      />
                      <span className="text-sm font-medium text-ink-700">Tasks with no offers only</span>
                    </label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setFilterPanelOpen(false)}
                      className="flex-1 rounded-xl border border-ink-100 bg-white px-4 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-400">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-brand-300 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-1 rounded-xl border border-ink-100 bg-white p-1">
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
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand transition hover:bg-brand-100"
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
                className="min-h-12 w-full rounded-xl border border-ink-100 bg-white px-3 text-sm font-semibold text-ink focus:border-brand-300 focus:outline-none"
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
                      className="card group flex items-start gap-4 p-4 transition hover:border-brand-200 hover:shadow-card-hover"
                    >
                      <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand">
                        {isRemoteLocation(t.location) ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 text-[17px] font-bold text-ink transition group-hover:text-brand-dark">{t.title}</h3>
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
                      <ArrowRight className="mt-1 h-4 w-4 flex-none text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Location panel */}
            <aside className="card sticky top-24 hidden p-4 lg:block">
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-brand" />
                <p className="page-eyebrow">Browse by location</p>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => setMapLocation(null)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    mapLocation === null ? "bg-brand-50 text-brand" : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  All locations
                  <span className="float-right text-xs font-bold text-ink-400">{sorted.length}</span>
                </button>
                {locationGroups.physical.map(([loc, items]) => (
                  <button
                    key={loc}
                    onClick={() => setMapLocation(loc)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      mapLocation === loc ? "bg-brand-50 text-brand" : "text-ink-600 hover:bg-ink-50"
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
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    mapLocation === REMOTE_KEY ? "bg-brand-50 text-brand" : "text-ink-600 hover:bg-ink-50"
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
    </TaskerPage>
  );
}