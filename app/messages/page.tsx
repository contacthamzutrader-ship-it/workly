"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight, Inbox, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listConversations, type Conversation } from "@/lib/chat";
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
    (async () => {
      try {
        const data = await listConversations(user.uid);
        setConvs(data);
        const nameMap: Record<string, string> = {};
        await Promise.all(data.map(async c => {
          const other = c.participants.find(p => p !== user.uid);
          if (other && !nameMap[other] && db) { const s = await getDoc(doc(db, "users", other)); nameMap[other] = s.exists() ? (s.data().name || "User") : "User"; }
        }));
        setNames(nameMap);
      } catch {} finally { setBusy(false); }
    })();
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const filtered = convs.filter((c) => {
    const other = c.participants.find(p => p !== user.uid) || "";
    const label = `${names[other] || "User"} ${c.lastMessage || ""} ${c.taskId || ""}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
      <div className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><MessageSquare className="h-7 w-7" /></span>
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Task conversations</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Messages</h1><p className="mt-1 text-sm text-white/55">Chat stays tied to assigned tasks for a cleaner delivery trail.</p></div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65"><ShieldCheck className="h-4 w-4 text-brand-300" /> On-platform communication</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="min-h-12 w-full rounded-xl bg-ink-50 py-3 pl-11 pr-4 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10" />
        </div>
      </div>

      {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
        filtered.length === 0 ? (
          <div className="surface mt-6 py-16 text-center">
            <Inbox className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 text-lg font-semibold text-ink">No conversations</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-500">Accept a bid or get assigned to a task to start a focused delivery chat.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map(c => {
              const other = c.participants.find(p => p !== user.uid) || "";
              return (
                <Link key={c.id} href={`/messages/${c.id}`} className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card-hover">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">{(names[other] || "U")[0].toUpperCase()}</div>
                    <div className="min-w-0"><p className="font-semibold text-ink">{names[other] || "User"}</p><p className="mt-0.5 truncate text-sm text-ink-500">{c.lastMessage || "No messages yet"}</p></div>
                  </div>
                  <div className="flex items-center gap-2"><span className="text-xs text-ink-400">#{c.taskId.slice(0, 6)}</span><ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" /></div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
