"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus, MapPin } from "lucide-react";
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
    try { setTasks(await listPublicTasks(cat ?? category, q ?? search)); } catch { setTasks([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-extrabold text-ink">Browse Tasks</h1><p className="mt-1 text-ink-500">Find tasks near you and start earning</p></div>
        <Link href="/post"><Button className="flex items-center gap-2 rounded-xl px-5 py-2.5"><Plus className="h-4 w-4" /> Post a Task</Button></Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="flex gap-3">
          <select value={category} onChange={(e) => { setCategory(e.target.value); load(e.target.value, search); }}
            className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button variant="ghost" onClick={() => load()} className="flex items-center gap-2 rounded-xl">Search</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>
      ) : tasks.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-4 text-lg font-semibold text-ink">No tasks found</p>
          <p className="mt-1 text-sm text-ink-500">Be the first to <Link href="/post" className="font-semibold text-brand">post a task</Link></p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-ink-500">Showing <span className="font-semibold text-ink">{tasks.length}</span> tasks</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{tasks.map(t => <TaskCard key={t.id} task={t} />)}</div>
        </>
      )}
    </div>
  );
}
