"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatPKR, formatDate } from "@/lib/format";
import { listPublicTasks, type Task } from "@/lib/tasks";

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<Task[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const tasks = await listPublicTasks();
        setAvailable(tasks.filter((t) => t.status === "open").slice(0, 5));
      } catch {
        setAvailable([]);
      }
      setBusy(false);
    })();
  }, [user]);

  if (busy) {
    return (
      <div className="font-ui space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-ink-50" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-50" />
          ))}
        </div>
      </div>
    );
  }

  const firstName = (user?.displayName || "there").split(" ")[0];

  return (
    <div className="font-ui space-y-8">
      {/* Welcome band */}
      <section>
        <p className="page-eyebrow">Freelancer workspace</p>
        <h1 className="page-title">Welcome back, {firstName}.</h1>
        <p className="page-sub">Find your next opportunity and manage your projects.</p>
      </section>

      {/* Recommended tasks */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div>
            <p className="page-eyebrow">Recommended</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Recommended Tasks</h2>
          </div>
          <Link href="/browse" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700">
            View all tasks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {available.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-ink">No open tasks right now</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">
              New tasks appear here as soon as clients post them. Check the marketplace for everything available.
            </p>
            <Link href="/browse" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              Browse all tasks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {available.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-canvas sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold text-ink transition group-hover:text-brand-dark">{t.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-500">{t.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold tracking-[-0.02em] text-ink">{formatPKR(t.budget)}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-ink-400">{t.bidsCount} {t.bidsCount === 1 ? "offer" : "offers"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-ink-400" /> {t.location}
                  </span>
                  {t.deadline && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-ink-400" /> Due {formatDate(t.deadline)}
                    </span>
                  )}
                  <span className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-50 px-3 text-[13px] font-bold text-brand transition group-hover:bg-brand group-hover:text-white">
                    View Task <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}