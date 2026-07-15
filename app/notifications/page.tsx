"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listNotifications, type AppNotification } from "@/lib/notifications";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/notifications"); }, [loading, user, router]);

  useEffect(() => { if (!user) return; (async () => { try { setItems(await listNotifications(user.uid)); } catch {} finally { setBusy(false); } })(); }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
      <p className="mt-1 text-ink-500">Stay updated on your tasks</p>

      {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
        items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
            <Bell className="mx-auto h-10 w-10 text-ink-300" /><p className="mt-4 text-lg font-semibold text-ink">No notifications</p><p className="mt-1 text-sm text-ink-500">You&apos;ll see updates about your tasks here</p>
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
  );
}
