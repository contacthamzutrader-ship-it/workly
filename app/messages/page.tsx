"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
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

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-ink">Messages</h1>
      <p className="mt-1 text-ink-500">Your conversations</p>

      {busy ? <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> :
        convs.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 text-lg font-semibold text-ink">No conversations</p>
            <p className="mt-1 text-sm text-ink-500">Accept or get assigned to a task to start chatting</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {convs.map(c => {
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
  );
}
