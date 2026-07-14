"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPublicTasks, CATEGORIES, type Task } from "@/lib/tasks";
import TaskCard from "@/components/TaskCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const load = async (cat?: string, q?: string) => {
    setLoading(true);
    try {
      const data = await listPublicTasks(cat ?? category, q ?? search);
      setTasks(data);
    } catch (err) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Browse Tasks</h1>
          <p className="mt-1 text-sm text-ink/60">Find tasks near you and place your bid.</p>
        </div>
        <Link href="/post"><Button>Post a Task</Button></Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="flex-1"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            load(e.target.value, search);
          }}
          className="rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button variant="ghost" onClick={() => load()}>Search</Button>
      </div>

      {loading ? (
        <p className="mt-10 text-ink/60">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white p-12 text-center text-ink/60">
          No tasks found. Be the first to <Link href="/post" className="font-semibold text-brand">post one</Link>.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
