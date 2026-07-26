"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Bell,
  CheckCircle2,
  Gavel,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { subscribeNotifications, type AppNotification } from "@/lib/notifications";
import { timeAgo } from "@/lib/format";
import Button from "@/components/ui/Button";
import { EmptyState, PageLoader, Skeleton } from "@/components/ui/Feedback";

const ICONS: Record<string, { icon: typeof Bell; tone: string }> = {
  bid: { icon: Gavel, tone: "bg-brand-50 text-brand" },
  bid_rejected: { icon: XCircle, tone: "bg-ink-50 text-ink-500" },
  selected: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  task_approved: { icon: ShieldCheck, tone: "bg-brand-50 text-brand" },
  task_rejected: { icon: XCircle, tone: "bg-rose-50 text-rose-600" },
  work_started: { icon: CheckCircle2, tone: "bg-indigo-50 text-indigo-600" },
  work_submitted: { icon: CheckCircle2, tone: "bg-violet-50 text-violet-600" },
  changes_requested: { icon: ShieldAlert, tone: "bg-amber-50 text-amber-700" },
  payment_released: { icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
  payment_request: { icon: Banknote, tone: "bg-indigo-50 text-indigo-600" },
  private_assignment: { icon: ShieldCheck, tone: "bg-ink text-white" },
  message: { icon: MessageSquare, tone: "bg-sky-50 text-sky-600" },
  security: { icon: ShieldAlert, tone: "bg-rose-50 text-rose-600" },
  cancelled: { icon: XCircle, tone: "bg-ink-50 text-ink-500" },
  dispute: { icon: ShieldAlert, tone: "bg-rose-50 text-rose-600" },
  review: { icon: Star, tone: "bg-amber-50 text-amber-600" },
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/notifications");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    try {
      return subscribeNotifications(user.uid, (data) => {
        setItems(data);
        setBusy(false);
      });
    } catch {
      setBusy(false);
    }
  }, [user]);

  const unread = useMemo(() => items.filter((item) => !item.read), [items]);
  const shown = filter === "unread" ? unread : items;

  const markAllRead = async () => {
    if (!db) return;
    await Promise.all(
      unread.map((item) => updateDoc(doc(db!, "notifications", item.id!), { read: true }).catch(() => undefined))
    );
  };

  const markRead = async (item: AppNotification) => {
    if (!db || item.read || !item.id) return;
    await updateDoc(doc(db, "notifications", item.id), { read: true }).catch(() => undefined);
  };

  if (loading || !user) return <PageLoader />;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-3xl">
        <section className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand">
                <Bell className="h-7 w-7" />
                {unread.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-black">
                    {unread.length > 9 ? "9+" : unread.length}
                  </span>
                )}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Activity centre</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Notifications</h1>
                <p className="mt-1 text-sm text-white/55">
                  {unread.length > 0 ? `${unread.length} unread` : "You are all caught up"}
                </p>
              </div>
            </div>
            {unread.length > 0 && (
              <Button className="bg-white text-ink shadow-none hover:bg-brand-100" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        </section>

        {items.length > 0 && (
          <div className="mt-5 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
            {(
              [
                ["all", `All (${items.length})`],
                ["unread", `Unread (${unread.length})`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                  filter === value ? "bg-ink text-white" : "text-ink-400 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {busy ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="surface mt-5">
            <EmptyState
              icon={CheckCircle2}
              title={filter === "unread" ? "Nothing unread" : "All clear"}
              description="Task approvals, offers, deliveries and payment updates all land here."
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {shown.map((item) => {
              const style = ICONS[item.type] || { icon: Bell, tone: "bg-brand-50 text-brand" };
              return (
                <li key={item.id}>
                  <Link
                    href={item.link || "#"}
                    onClick={() => markRead(item)}
                    className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover ${
                      item.read ? "border-ink-100 bg-white" : "border-brand-200 bg-brand-50/40"
                    }`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${style.tone}`}>
                      <style.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate font-black text-ink">{item.title}</p>
                        <span className="shrink-0 text-[11px] font-bold text-ink-400">{timeAgo(item.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-ink-500">{item.body}</p>
                    </div>
                    {!item.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand sm:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
