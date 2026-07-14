"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listNotifications, type AppNotification } from "@/lib/notifications";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setItems(await listNotifications(user.uid));
      } catch {
        /* ignore */
      } finally {
        setBusy(false);
      }
    })();
  }, [user]);

  if (loading || !user) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-ink/60">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
        <Bell className="h-6 w-6 text-brand" /> Notifications
      </h1>
      {busy ? (
        <p className="mt-6 text-ink/60">Loading...</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-ink/60">No notifications yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.link || "#"}
                className="block rounded-xl border border-ink/10 p-4 hover:border-brand/40"
              >
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-1 text-sm text-ink/60">{n.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
