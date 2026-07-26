"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Inbox, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { subscribeConversations, type Conversation } from "@/lib/chat";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { EmptyState, PageLoader, Skeleton } from "@/components/ui/Feedback";

export default function MessagesPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [names, setNames] = useState<Record<string, { name: string; avatarUrl?: string }>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/messages");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    try {
      return subscribeConversations(user.uid, async (items) => {
        setConversations(items);
        setBusy(false);
        if (!db) return;

        const nameMap: Record<string, { name: string; avatarUrl?: string }> = {};
        const titleMap: Record<string, string> = {};
        await Promise.all(
          items.map(async (conversation) => {
            const other = conversation.participants.find((participant) => participant !== user.uid);
            if (other) {
              try {
                const snapshot = await getDoc(doc(db!, "users", other));
                if (snapshot.exists()) {
                  nameMap[other] = {
                    name: snapshot.data().name || "Workly member",
                    avatarUrl: snapshot.data().avatarUrl || "",
                  };
                }
              } catch {
                nameMap[other] = { name: "Workly member" };
              }
            }
            try {
              const taskSnapshot = await getDoc(doc(db!, "tasks", conversation.taskId));
              if (taskSnapshot.exists()) titleMap[conversation.taskId] = taskSnapshot.data().title || "";
            } catch {
              // Title is decorative.
            }
          })
        );
        setNames(nameMap);
        setTitles(titleMap);
      });
    } catch {
      setBusy(false);
    }
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const needle = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const other = conversation.participants.find((participant) => participant !== user?.uid) || "";
      return (
        (names[other]?.name || "").toLowerCase().includes(needle) ||
        (titles[conversation.taskId] || "").toLowerCase().includes(needle) ||
        (conversation.lastMessage || "").toLowerCase().includes(needle)
      );
    });
  }, [conversations, search, names, titles, user?.uid]);

  if (loading || !user) return <PageLoader />;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <section className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand">
                <MessageSquare className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Inbox</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Messages</h1>
                <p className="mt-1 text-sm text-white/55">Private chats open once a freelancer is hired.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65">
              <ShieldCheck className="h-4 w-4 text-brand-300" /> {conversations.length} conversation
              {conversations.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {conversations.length > 0 && (
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              className="min-h-12 w-full rounded-2xl border border-ink-100 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-ink shadow-card placeholder:font-normal placeholder:text-ink-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
        )}

        <section className="surface mt-5 overflow-hidden">
          {busy ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={conversations.length === 0 ? "No conversations yet" : "Nothing matches that search"}
              description={
                conversations.length === 0
                  ? "A private chat opens automatically as soon as a freelancer is hired on a task."
                  : "Try a different name, task or keyword."
              }
              action={
                conversations.length === 0 ? (
                  <Link href={role === "freelancer" ? "/tasks" : "/post"}>
                    <Button>{role === "freelancer" ? "Find work" : "Post a task"}</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {filtered.map((conversation) => {
                const other = conversation.participants.find((participant) => participant !== user.uid) || "";
                const person = names[other];
                return (
                  <li key={conversation.id || conversation.taskId}>
                    <Link
                      href={`/messages/${conversation.taskId}`}
                      className="group flex items-center gap-4 p-5 transition hover:bg-ink-50/70"
                    >
                      <Avatar name={person?.name} src={person?.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate font-black text-ink transition group-hover:text-brand-dark">
                            {person?.name || "Workly member"}
                          </p>
                          <span className="shrink-0 text-[11px] font-bold text-ink-400">
                            {timeAgo(conversation.updatedAt)}
                          </span>
                        </div>
                        {titles[conversation.taskId] && (
                          <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-wide text-brand-dark">
                            {titles[conversation.taskId]}
                          </p>
                        )}
                        <p className="mt-1 truncate text-sm text-ink-500">
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand sm:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Keep every conversation on Workly — it is your evidence if a
          dispute happens.
        </p>
      </div>
    </div>
  );
}
