"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Check, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { listPublicTasks, CATEGORIES, type Task } from "@/lib/tasks";
import TaskCard from "@/components/TaskCard";
import Button from "@/components/ui/Button";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const load = async (cat?: string, q?: string) => {
    setLoading(true);
    try {
      setTasks(await listPublicTasks(cat ?? category, q ?? search));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("category") || "all";
    setCategory(CATEGORIES.includes(initialCategory) ? initialCategory : "all");
    load(CATEGORIES.includes(initialCategory) ? initialCategory : "all", "");
  }, []);

  const clear = () => {
    setCategory("all");
    setSearch("");
    load("all", "");
  };

  return (
    <div className="bg-canvas py-10 sm:py-14">
      <div className="page-shell">
        <div className="relative overflow-hidden rounded-[32px] bg-ink p-7 text-white shadow-elevated sm:p-10">
          <div className="absolute inset-0 noise opacity-50" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-300"><Sparkles className="h-3.5 w-3.5" /> Opportunity feed</span>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Find work worth doing.</h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/60">Explore approved tasks, send your best offer, and build a reputation that keeps paying back.</p>
            </div>
            <Link href="/post"><Button className="gap-2 bg-white text-ink shadow-none hover:bg-brand-100 hover:text-ink"><Plus className="h-4 w-4" /> Post your own task</Button></Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
            <input
              placeholder="Search by skill, task or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="min-h-12 w-full rounded-xl bg-ink-50 py-3 pl-11 pr-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); load(e.target.value, search); }}
            className="min-h-12 rounded-xl border border-ink-100 bg-white px-4 text-sm font-bold text-ink focus:border-brand focus:outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={() => load()} className="gap-2 shadow-none"><SlidersHorizontal className="h-4 w-4" /> Search</Button>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="surface hidden p-4 lg:block">
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Categories</p>
            <div className="mt-3 space-y-1">
              <button onClick={() => { setCategory("all"); load("all", search); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${category === "all" ? "bg-ink text-white" : "text-ink-500 hover:bg-ink-50"}`}>All work {category === "all" && <Check className="h-3.5 w-3.5" />}</button>
              {CATEGORIES.slice(0, 10).map((item) => (
                <button key={item} onClick={() => { setCategory(item); load(item, search); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${category === item ? "bg-brand-50 text-brand-dark" : "text-ink-500 hover:bg-ink-50"}`}>{item}{category === item && <Check className="h-3.5 w-3.5" />}</button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-brand-50 p-4">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <p className="mt-3 text-sm font-black text-ink">Approved work only</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">Public tasks pass smart or team review before appearing here.</p>
            </div>
          </aside>

          <main>
            <div className="mb-4 flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">Marketplace</p><h2 className="mt-1 text-xl font-black text-ink">{loading ? "Finding opportunities..." : `${tasks.length} open ${tasks.length === 1 ? "task" : "tasks"}`}</h2></div>
              {(category !== "all" || search) && <button onClick={clear} className="flex items-center gap-1.5 text-xs font-extrabold text-ink-400 hover:text-ink"><X className="h-3.5 w-3.5" /> Clear filters</button>}
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 animate-pulse rounded-3xl border border-ink-100 bg-white" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="surface py-20 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><BriefcaseBusiness className="h-6 w-6" /></span>
                <h3 className="mt-5 text-xl font-black text-ink">No matching tasks yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">Try a broader search or another category. New approved tasks appear here continuously.</p>
                <button onClick={clear} className="mt-5 text-sm font-extrabold text-brand-dark">Show all work</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{tasks.map(t => <TaskCard key={t.id} task={t} />)}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
