"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  Check,
  Globe2,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { CATEGORIES, listPublicTasks, subscribePublicTasks, type Task, type TaskFilters } from "@/lib/tasks";
import { useAuth } from "@/lib/auth-context";
import { formatPKR } from "@/lib/format";
import TaskCard from "@/components/TaskCard";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";

const SORTS: { value: NonNullable<TaskFilters["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "budget_high", label: "Highest budget" },
  { value: "budget_low", label: "Lowest budget" },
  { value: "fewest_offers", label: "Fewest offers" },
];

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <BrowseTasks />
    </Suspense>
  );
}

function BrowseTasks() {
  const { user, role, capabilities } = useAuth();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sort, setSort] = useState<NonNullable<TaskFilters["sort"]>>("newest");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [live, setLive] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TaskFilters>({ sort: "newest" });

  const load = useCallback(async (filters: TaskFilters) => {
    setLoading(true);
    try {
      setTasks(await listPublicTasks(filters));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the marketplace truly live: subscribe to public tasks and re-apply filters locally on every change.
  useEffect(() => {
    setLoading(true);
    setLive(false);
    let unsub: (() => void) | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    try {
      unsub = subscribePublicTasks(
        appliedFilters,
        (liveTasks) => {
          setTasks(liveTasks);
          setLoading(false);
          setLive(true);
        },
        () => {
          // Realtime failed (offline / rules) — fall back to one-off fetch.
          load(appliedFilters);
          setLive(false);
        }
      );
      // If snapshot never fires (e.g. Firestore not configured), fall back after 3s.
      fallback = setTimeout(() => {
        if (live === false) setLoading((prev) => prev);
      }, 3000);
    } catch {
      load(appliedFilters);
    }
    return () => {
      unsub?.();
      if (fallback) clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, load]);

  useEffect(() => {
    const initialCategory = searchParams.get("category") || "all";
    const initialSearch = searchParams.get("q") || "";
    const resolved = CATEGORIES.includes(initialCategory) ? initialCategory : "all";
    setCategory(resolved);
    setSearch(initialSearch);
    setAppliedFilters({ category: resolved, search: initialSearch, sort: "newest" });
  }, [searchParams]);

  const currentFilters = useMemo<TaskFilters>(
    () => ({
      category,
      search,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
      location,
      remoteOnly,
      sort,
    }),
    [category, search, minBudget, maxBudget, location, remoteOnly, sort]
  );

  const apply = () => setAppliedFilters(currentFilters);

  const clear = () => {
    setSearch("");
    setCategory("all");
    setMinBudget("");
    setMaxBudget("");
    setLocation("");
    setRemoteOnly(false);
    setSort("newest");
    setAppliedFilters({ category: "all", sort: "newest" });
  };

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (search ? 1 : 0) +
    (minBudget ? 1 : 0) +
    (maxBudget ? 1 : 0) +
    (location ? 1 : 0) +
    (remoteOnly ? 1 : 0);

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Category</p>
        <div className="space-y-1">
          <FilterButton active={category === "all"} onClick={() => setCategory("all")}>
            All work
          </FilterButton>
          {CATEGORIES.map((item) => (
            <FilterButton key={item} active={category === item} onClick={() => setCategory(item)}>
              {item}
            </FilterButton>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Budget (PKR)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minBudget}
            onChange={(event) => setMinBudget(event.target.value)}
            className="min-h-11 text-sm"
          />
          <span className="text-ink-300">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxBudget}
            onChange={(event) => setMaxBudget(event.target.value)}
            className="min-h-11 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Location</p>
        <Input
          placeholder="e.g. Lahore"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="min-h-11 text-sm"
        />
        <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) => setRemoteOnly(event.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand"
          />
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink-600">
            <Globe2 className="h-3.5 w-3.5 text-brand" /> Remote work only
          </span>
        </label>
      </div>

      <div className="flex gap-2">
        <Button onClick={apply} size="sm" fullWidth>
          Apply filters
        </Button>
        {activeFilterCount > 0 && (
          <Button onClick={clear} variant="ghost" size="sm">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="rounded-2xl bg-brand-50 p-4">
        <ShieldCheck className="h-5 w-5 text-brand" />
        <p className="mt-3 text-sm font-black text-ink">Approved work only</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">
          Every public task passes smart checks or a human moderator before it appears here.
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-canvas py-8 sm:py-12">
      <div className="page-shell">
        <section className="relative overflow-hidden rounded-[32px] bg-ink p-7 text-white shadow-elevated sm:p-10">
          <div className="absolute inset-0 noise opacity-50" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-brand-300">
                <Sparkles className="h-3.5 w-3.5" /> Opportunity feed
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                {role === "client" && user ? "See what the market is doing." : "Find work worth doing."}
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/60">
                Explore approved tasks, send a sharp offer, and build a reputation that keeps paying back.
              </p>
            </div>
            {capabilities.canPostTask && (
              <Link href="/post">
                <Button className="bg-white text-ink shadow-none hover:bg-brand-100 hover:text-ink">
                  <Plus className="h-4 w-4" /> Post your own task
                </Button>
              </Link>
            )}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
            <input
              placeholder="Search by skill, task or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && apply()}
              className="min-h-12 w-full rounded-xl bg-ink-50 py-3 pl-11 pr-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-400 transition focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <Select
            value={sort}
            onChange={(event) => {
              const next = event.target.value as NonNullable<TaskFilters["sort"]>;
              setSort(next);
              setAppliedFilters({ ...currentFilters, sort: next });
            }}
            className="min-h-12 lg:w-52"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button onClick={apply} className="shadow-none">
            <SlidersHorizontal className="h-4 w-4" /> Search
          </Button>
          <Button variant="ghost" onClick={() => setMobileFilters((open) => !open)} className="lg:hidden">
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>

        {mobileFilters && <div className="surface mt-4 p-5 lg:hidden">{filterPanel}</div>}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="surface hidden max-h-[calc(100vh-120px)] overflow-y-auto p-5 lg:block lg:sticky lg:top-[90px]">
            {filterPanel}
          </aside>

          <main>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">
                  Marketplace {live && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">● Live</span>}
                </p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">
                  {loading ? "Finding opportunities…" : `${tasks.length} open ${tasks.length === 1 ? "task" : "tasks"}`}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {live && <span className="hidden text-xs font-bold text-emerald-600 sm:inline">Realtime</span>}
                {activeFilterCount > 0 && (
                  <button onClick={clear} className="flex items-center gap-1.5 text-xs font-black text-ink-400 hover:text-ink">
                    <X className="h-3.5 w-3.5" /> Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <Skeleton key={index} className="h-72" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="surface">
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="No matching tasks yet"
                  description="Try a broader search or a different category. New approved tasks appear here continuously."
                  action={
                    <Button variant="ghost" onClick={clear}>
                      Show all work
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}

            {!loading && tasks.length > 0 && (
              <p className="mt-6 text-center text-xs font-semibold text-ink-400">
                Showing {tasks.length} approved {tasks.length === 1 ? "task" : "tasks"} · budgets from{" "}
                {formatPKR(Math.min(...tasks.map((task) => task.budget)))} to{" "}
                {formatPKR(Math.max(...tasks.map((task) => task.budget)))}
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
        active ? "bg-brand-50 text-brand-dark" : "text-ink-500 hover:bg-ink-50"
      }`}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
