"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { subscribeNotifications, type AppNotification } from "@/lib/notifications";

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
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
      <div className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Bell className="h-7 w-7" /></span>
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Activity centre</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Notifications</h1><p className="mt-1 text-sm text-white/55">Approvals, offers, assignments and payment updates in one place.</p></div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65"><ShieldCheck className="h-4 w-4 text-brand-300" /> {items.length} total updates</div>
        </div>
      </div>

      {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
        items.length === 0 ? (
          <div className="surface mt-6 py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand" /><p className="mt-4 text-lg font-semibold text-ink">All clear</p><p className="mt-1 text-sm text-ink-500">You&apos;ll see task, offer and payment updates here.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map(n => (
              <Link key={n.id} href={n.link || "#"} className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card-hover">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Bell className="h-5 w-5" /></div>
                  <div><p className="font-semibold text-ink">{n.title}</p><p className="mt-0.5 text-sm text-ink-500">{n.body}</p></div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
