"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { subscribeMessages, sendMessage, type Message } from "@/lib/chat";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !id || !db) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const snap = await getDoc(doc(db, "conversations", id));
      if (!snap.exists() || !snap.data().participants.includes(user.uid)) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      unsub = subscribeMessages(id, setMessages);
    })();
    return () => {
      if (unsub) unsub();
    };
  }, [user, id]);

  if (loading || !user) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-ink/60">Loading...</div>;
  }
  if (allowed === false) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-ink/60">
        You don&apos;t have access to this conversation.{" "}
        <Link href="/messages" className="font-semibold text-brand">Back</Link>
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !id) return;
    setError("");
    try {
      await sendMessage(id, user.uid, user.displayName || user.email || "User", text.trim());
      setText("");
    } catch (err: any) {
      setError(err?.message || "Could not send");
    }
  };

  return (
    <div className="mx-auto flex h-[80vh] max-w-3xl flex-col px-4 py-8">
      <Link href="/messages" className="text-sm text-ink/60 hover:text-ink">← Back</Link>
      <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
        {messages.map((m) => {
          const mine = m.fromId === user.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-brand text-white" : "bg-ink/5 text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
