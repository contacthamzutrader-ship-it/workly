"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { subscribeMessages, sendMessage, type Message } from "@/lib/chat";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Input from "@/components/ui/Input";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/messages/"+id); }, [loading, user, router, id]);

  useEffect(() => {
    if (!user || !id || !db) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const snap = await getDoc(doc(db, "conversations", id));
      if (!snap.exists() || !snap.data().participants.includes(user.uid)) { setAllowed(false); return; }
      setAllowed(true);
      unsub = subscribeMessages(id, setMessages);
    })();
    return () => { if (unsub) unsub(); };
  }, [user, id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (allowed === false) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-500">Access denied. <Link href="/messages" className="font-semibold text-brand">Back</Link></div>;

  const send = async (e: React.FormEvent) => { e.preventDefault(); if (!text.trim() || !user || !id) return; setError("");
    try { await sendMessage(id, user.uid, user.displayName || user.email || "User", text.trim()); setText(""); } catch (err: any) { setError(err?.message || "Could not send"); } };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col px-4 py-4 sm:px-6">
      <Link href="/messages" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink mb-3 shrink-0"><ArrowLeft className="h-4 w-4" /> Back</Link>

      <div className="flex-1 overflow-y-auto space-y-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card mb-3">
        {messages.map((m) => {
          const mine = m.fromId === user.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-brand text-white rounded-br-md" : "bg-ink-50 text-ink rounded-bl-md"}`}>
                <p>{m.text}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-white/60" : "text-ink-400"}`}>{m.fromName}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <form onSubmit={send} className="flex gap-2 shrink-0">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1" />
        <button type="submit" className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
