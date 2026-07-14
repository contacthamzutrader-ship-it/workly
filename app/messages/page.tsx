"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await listConversations(user.uid);
        setConvs(data);
        const nameMap: Record<string, string> = {};
        await Promise.all(
          data.map(async (c) => {
            const other = c.participants.find((p) => p !== user.uid);
            if (other && !nameMap[other] && db) {
              const s = await getDoc(doc(db, "users", other));
              nameMap[other] = s.exists() ? (s.data().name || "User") : "User";
            }
          })
        );
        setNames(nameMap);
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
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink"><MessageSquare className="h-6 w-6 text-brand" /> Messages</h1>
      {busy ? (
        <p className="mt-6 text-ink/60">Loading...</p>
      ) : convs.length === 0 ? (
        <p className="mt-6 text-ink/60">No conversations yet. Accept a task to start chatting.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {convs.map((c) => {
            const other = c.participants.find((p) => p !== user.uid) || "";
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="block rounded-xl border border-ink/10 p-4 hover:border-brand/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{names[other] || "User"}</span>
                    <span className="text-xs text-ink/40">task #{c.taskId.slice(0, 6)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink/60">{c.lastMessage || "No messages yet"}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
