"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, MessageSquare, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { subscribeConversations, type Conversation } from "@/lib/chat";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/messages"); }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    try {
      return subscribeConversations(user.uid, (data) => {
        setConvs(data);
        const nameMap: Record<string, string> = {};
        Promise.all(data.map(async c => {
          const other = c.participants.find(p => p !== user.uid);
          if (other && !nameMap[other] && db) { const s = await getDoc(doc(db, "users", other)); nameMap[other] = s.exists() ? (s.data().name || "User") : "User"; }
        })).then(() => setNames(nameMap));
        setBusy(false);
      });
    } catch { setBusy(false); }
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const filtered = convs.filter((c) => {
    const other = c.participants.find(p => p !== user.uid) || "";
    const label = `${names[other] || "User"} ${c.lastMessage || ""} ${c.taskId || ""}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="page-eyebrow">Messages</p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">Conversations</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-500">Chat stays tied to assigned tasks for a cleaner delivery trail.</p>
      </div>

      <div className="mt-6 card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="min-h-12 w-full rounded-xl border border-ink-100 bg-white py-3 pl-11 pr-4 text-sm font-medium text-ink placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand/10" />
        </div>
      </div>

      {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
        filtered.length === 0 ? (
          <div className="card mt-6 py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Inbox className="h-6 w-6" /></span>
            <p className="mt-4 text-lg font-semibold text-ink">No conversations</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-500">Accept a bid or get assigned to a task to start a focused delivery chat.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {filtered.map(c => {
              const other = c.participants.find(p => p !== user.uid) || "";
              return (
                <Link key={c.id} href={`/messages/${c.id}`} className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-canvas">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">{(names[other] || "U")[0].toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate font-semibold text-ink">{names[other] || "User"}</p><p className="mt-0.5 truncate text-sm text-ink-500">{c.lastMessage || "No messages yet"}</p></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2"><span className="text-xs text-ink-400">#{c.taskId.slice(0, 6)}</span><ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" /></div>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}