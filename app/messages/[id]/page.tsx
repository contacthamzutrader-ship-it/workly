"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, MessageSquare, ShieldCheck } from "lucide-react";
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
    <div className="bg-canvas py-4 sm:py-6">
      <div className="page-shell max-w-4xl">
      <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-card">
        <div className="flex shrink-0 items-center justify-between border-b border-ink-100 bg-ink px-4 py-4 text-white sm:px-5">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15" aria-label="Back to messages"><ArrowLeft className="h-4 w-4" /></Link>
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Task chat</p><h1 className="text-base font-black">Delivery conversation</h1></div>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 sm:inline-flex"><ShieldCheck className="h-4 w-4 text-brand-300" /> Private to task parties</div>
        </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/45 p-4 sm:p-5">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <MessageSquare className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-4 text-lg font-black text-ink">No messages yet</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-ink-500">Start with scope, timing, files, or delivery questions so the task trail stays clear.</p>
            </div>
          </div>
        )}
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

      <div className="shrink-0 border-t border-ink-100 bg-white p-3 sm:p-4">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={send} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1" />
        <button type="submit" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark" aria-label="Send message"><Send className="h-4 w-4" /></button>
      </form>
      </div>
      </div>
      </div>
    </div>
  );
}
