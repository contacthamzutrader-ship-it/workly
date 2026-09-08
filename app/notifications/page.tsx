"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { subscribeNotifications, type AppNotification } from "@/lib/notifications";
import DashboardShell from "@/components/DashboardShell";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/notifications"); }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    try { return subscribeNotifications(user.uid, (next) => { setItems(next); setBusy(false); }); }
    catch { setBusy(false); }
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="page-eyebrow">Notifications</p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">Updates</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-500">Approvals, offers, assignments and payment updates in one place.</p>
      </div>

      {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
        items.length === 0 ? (
          <div className="card mt-6 py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Bell className="h-6 w-6" /></span>
            <p className="mt-4 text-lg font-semibold text-ink">All clear</p>
            <p className="mt-1 text-sm leading-6 text-ink-500">You&apos;ll see task, offer and payment updates here.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {items.map(n => (
              <Link key={n.id} href={n.link || "#"} className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-canvas">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Bell className="h-5 w-5" /></div>
                  <div className="min-w-0"><p className="truncate font-semibold text-ink">{n.title}</p><p className="mt-0.5 truncate text-sm text-ink-500">{n.body}</p></div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}