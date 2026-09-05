"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, Clock3, Home, LayoutDashboard, MessageSquare, Search, ShieldCheck, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  listPublicTasks,
  listTasksAssignedTo,
  listTasksWithUserBids,
  listBidsByUser,
  type Task,
} from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAiResult, computeAiScore } from "@/lib/ai-score";
import { computeBidMatch } from "@/lib/matching";
import TaskCard from "@/components/TaskCard";
import FreelancerHeader, { type FilterState, type SortOption, type TaskerView } from "@/components/FreelancerHeader";

const VIEW_TITLES: Record<TaskerView, { overline: string; title: string; subtitle: string }> = {
  all: { overline: "Opportunity feed", title: "Available tasks for you", subtitle: "Approved tasks you can send an offer on." },
  task_assign: { overline: "Task Assign", title: "Assigned to me", subtitle: "Tasks where you have already been assigned." },
  offers_pending: { overline: "Offers Pending", title: "My pending offers", subtitle: "Tasks where your offer is still waiting for the client." },
  task_completed: { overline: "Task Completed", title: "Completed tasks", subtitle: "Tasks you finished and got paid for." },
  tasks_cancelled: { overline: "Tasks Cancelled", title: "Cancelled tasks", subtitle: "Tasks tied to you that were cancelled." },
};

const SORT_LABEL: Record<SortOption, string> = {
  recommended: "Recommended",
  recent: "Most Recent Posted",
  due_soon: "Due Soon",
  lowest_price: "Lowest Price",
  highest_price: "Highest Price",
};

function byNewest(a: Task, b: Task) {
  return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
}

type SidebarItem =
  | { kind: "view"; label: string; viewKey: TaskerView; icon: any }
  | { kind: "link"; label: string; href: string; icon: any };

const dashboardSidebarSections: { label: string; items: SidebarItem[] }[] = [
  {
    label: "Home",
    items: [{ kind: "link", label: "Home", href: "/", icon: Home }],
  },
  {
    label: "Workspace",
    items: [
      { kind: "view", label: "Dashboard", viewKey: "all", icon: LayoutDashboard },
      { kind: "view", label: "Projects", viewKey: "task_assign", icon: BriefcaseBusiness },
      { kind: "view", label: "Complete Project", viewKey: "task_completed", icon: CheckCircle2 },
      { kind: "view", label: "Pending Project", viewKey: "offers_pending", icon: Clock3 },
      { kind: "view", label: "Cancel Project", viewKey: "tasks_cancelled", icon: XCircle },
      { kind: "link", label: "Notifications", href: "/notifications", icon: Bell },
      { kind: "link", label: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
];

function FreelancerDashboardSidebar({ view, onViewChange }: { view: TaskerView; onViewChange: (v: TaskerView) => void }) {
  const allItems = dashboardSidebarSections.flatMap((s) => s.items);

  const itemClasses = (item: SidebarItem) => {
    const active = item.kind === "view" && item.viewKey === view;
    const base = "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-bold transition lg:flex";
    if (active) return `${base} bg-brand text-white shadow-forest lg:bg-mint`;
    return `${base} text-ink-600 hover:bg-brand-50 lg:text-white/80 lg:hover:bg-white/10 lg:hover:text-white`;
  };

  const renderItem = (item: SidebarItem) =>
    item.kind === "link" ? (
      <Link key={item.label} href={item.href} className={itemClasses(item)}>
        <item.icon className="h-4 w-4" /> {item.label}
      </Link>
    ) : (
      <button key={item.label} onClick={() => onViewChange(item.viewKey)} className={itemClasses(item)}>
        <item.icon className="h-4 w-4" /> {item.label}
      </button>
    );

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start lg:rounded-2xl lg:bg-deep lg:p-3 lg:shadow-card">
      <div className="flex gap-1.5 overflow-x-auto lg:hidden">{allItems.map(renderItem)}</div>
      <div className="hidden lg:block">
        {dashboardSidebarSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">{section.label}</p>
            <div className="space-y-0.5">{section.items.map(renderItem)}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function FreelancerDashboard() {
  const { user, role } = useAuth();
  const [view, setView] = useState<TaskerView>("all");
  const [filters, setFilters] = useState<FilterState>({ availableOnly: false, noOffersOnly: false });
  const [sort, setSort] = useState<SortOption>("recommended");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(true);
  const profileRef = useRef<{ trust: number; success: number; skills: string[] }>({ trust: 70, success: 80, skills: [] });

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          profileRef.current = {
            trust: typeof d.trustScore === "number" ? d.trustScore : 70,
            success: typeof d.successRate === "number" ? d.successRate : 80,
            skills: Array.isArray(d.skills) ? d.skills : [],
          };
        }
      } catch {
        // Profile is optional for browsing; fall back to default profile.
      }
    })();
  }, [user]);

  const load = async (targetView: TaskerView, currentFilters: FilterState, currentSort: SortOption) => {
    if (!user) return;
    setBusy(true);
    try {
      let list: Task[] = [];
      if (targetView === "all") {
        list = await listPublicTasks();
      } else if (targetView === "task_assign" || targetView === "task_completed") {
        list = await listTasksAssignedTo(user.uid);
        if (targetView === "task_completed") list = list.filter((t) => t.status === "completed");
      } else if (targetView === "offers_pending") {
        const bids = await listBidsByUser(user.uid);
        const pendingTaskIds = new Set(bids.filter((b) => b.status === "pending").map((b) => b.taskId));
        list = (await listTasksWithUserBids(user.uid)).filter((t) => t.id && pendingTaskIds.has(t.id));
      } else {
        const assigned = await listTasksAssignedTo(user.uid);
        const bidTasks = await listTasksWithUserBids(user.uid);
        const associated = new Map<string, Task>();
        [...assigned, ...bidTasks].forEach((t) => { if (t.id) associated.set(t.id, t); });
        list = Array.from(associated.values()).filter((t) => t.status === "cancelled");
      }

      if (currentFilters.availableOnly) list = list.filter((t) => t.status === "open");
      if (currentFilters.noOffersOnly) list = list.filter((t) => t.bidsCount === 0);

      setTasks(sortTasks(list, currentSort, profileRef.current));
    } catch {
      setTasks([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load(view, filters, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view, filters, sort]);

  const ai = useMemo(() => {
    const stored = getAiResult();
    if (stored) return stored;
    return computeAiScore({ trustScore: profileRef.current.trust, bio: "", skills: profileRef.current.skills, professionalTitle: "" });
  }, []);

  const heading = VIEW_TITLES[view];

  return (
    <div className="page-shell space-y-5 py-6 sm:py-8">
      <FreelancerHeader
        view={view}
        onViewChange={setView}
        filters={filters}
        onApplyFilters={setFilters}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <FreelancerDashboardSidebar view={view} onViewChange={setView} />

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">{heading.overline}</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink">{heading.title}</h2>
              <p className="mt-1 text-sm font-medium text-ink-500">{heading.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {(filters.availableOnly || filters.noOffersOnly) && (
                <button
                  onClick={() => setFilters({ availableOnly: false, noOffersOnly: false })}
                  className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs font-bold text-ink-500 transition hover:bg-ink-50"
                >
                  Clear filters
                </button>
              )}
              <span className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs font-bold text-ink-500">
                Sorted: {SORT_LABEL[sort]}
              </span>
            </div>
          </div>

          {busy ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl border border-ink-100 bg-white" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="surface py-20 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Search className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-black text-ink">No tasks here right now</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">Try another Browse Task view, adjust your filters, or check back soon for new offers.</p>
              <button onClick={() => { setView("all"); setFilters({ availableOnly: false, noOffersOnly: false }); }} className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-dark">Show available tasks <ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          )}

          <div className="rounded-2xl bg-deep p-5 text-white shadow-card sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint"><ShieldCheck className="h-5 w-5" /></span>
                <div>
                  <p className="font-black">Your AI skill score: {Math.max(0, Math.min(99, ai.skillScore))}</p>
                  <p className="mt-1 text-sm text-white/55">A stronger score improves how often your offers are recommended first.</p>
                </div>
              </div>
              <Link href="/interview" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-mint px-5 text-sm font-extrabold text-white transition hover:bg-mint-dark">
                <BriefcaseBusiness className="h-4 w-4" /> Improve skill check
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sortTasks(list: Task[], sort: SortOption, profile: { trust: number; success: number; skills: string[] }): Task[] {
  const copy = [...list];
  if (sort === "recent") return copy.sort(byNewest);
  if (sort === "due_soon") {
    return copy.sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    });
  }
  if (sort === "lowest_price") return copy.sort((a, b) => a.budget - b.budget || byNewest(a, b));
  if (sort === "highest_price") return copy.sort((a, b) => b.budget - a.budget || byNewest(a, b));
  // recommended
  return copy.sort((a, b) => {
    const ma = computeBidMatch(a, profile).percent;
    const mb = computeBidMatch(b, profile).percent;
    return mb - ma || byNewest(a, b);
  });
}