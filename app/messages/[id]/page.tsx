"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ExternalLink, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { sendMessage, subscribeMessages, type Message } from "@/lib/chat";
import { formatPKR } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Alert, EmptyState, PageLoader } from "@/components/ui/Feedback";
import type { TaskStatus } from "@/lib/tasks";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [other, setOther] = useState<{ id: string; name: string; avatarUrl?: string } | null>(null);
  const [task, setTask] = useState<{ title: string; status: TaskStatus; budget: number; heldAmount?: number } | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?redirect=/messages/${id}`);
  }, [loading, user, router, id]);

  useEffect(() => {
    if (!user || !id || !db) return;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const snapshot = await getDoc(doc(db!, "conversations", id));
        if (!snapshot.exists() || !snapshot.data().participants?.includes(user.uid)) {
          setAllowed(false);
          return;
        }
        setAllowed(true);

        const otherId = (snapshot.data().participants as string[]).find((participant) => participant !== user.uid);
        if (otherId) {
          const personSnapshot = await getDoc(doc(db!, "users", otherId));
          setOther({
            id: otherId,
            name: personSnapshot.exists() ? personSnapshot.data().name || "Workly member" : "Workly member",
            avatarUrl: personSnapshot.exists() ? personSnapshot.data().avatarUrl || "" : "",
          });
        }

        const taskSnapshot = await getDoc(doc(db!, "tasks", snapshot.data().taskId));
        if (taskSnapshot.exists()) {
          const data = taskSnapshot.data();
          setTask({
            title: data.title,
            status: data.status,
            budget: data.budget,
            heldAmount: data.heldAmount,
          });
        }

        unsubscribe = subscribeMessages(id, setMessages);
      } catch {
        setAllowed(false);
      }
    })();
    return () => unsubscribe?.();
  }, [user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading || !user) return <PageLoader />;

  if (allowed === false) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface">
          <EmptyState
            icon={AlertTriangle}
            title="This conversation is private"
            description="Only the client and the hired freelancer on a task can read it."
            action={
              <Link href="/messages">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4" /> Back to inbox
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !user || !id) return;
    setSending(true);
    setError("");
    const draft = text.trim();
    setText("");
    try {
      await sendMessage(id, user.uid, profile?.name || user.displayName || user.email || "Member", draft);
    } catch (caught) {
      setError((caught as Error)?.message || "Your message could not be sent.");
      setText(draft);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-canvas py-4 sm:py-6">
      <div className="page-shell max-w-4xl">
        <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-card">
          <header className="flex shrink-0 items-center gap-3 border-b border-ink-100 bg-ink px-4 py-3.5 text-white sm:px-5">
            <Link
              href="/messages"
              aria-label="Back to inbox"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Avatar name={other?.name} src={other?.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{other?.name || "Task conversation"}</p>
              {task && <p className="truncate text-[11px] font-semibold text-white/50">{task.title}</p>}
            </div>
            {other && (
              <Link
                href={`/u/${other.id}`}
                className="hidden items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-[11px] font-black text-white/75 transition hover:bg-white/10 sm:inline-flex"
              >
                Profile <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </header>

          {task && (
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-ink-100 bg-ink-50/60 px-4 py-3 sm:px-5">
              <StatusBadge status={task.status} />
              <span className="text-xs font-black text-ink">
                {formatPKR(task.heldAmount || task.budget)} {task.heldAmount ? "held" : "budget"}
              </span>
              <Link href={`/tasks/${id}`} className="ml-auto text-xs font-black text-brand-dark hover:text-brand">
                Open task →
              </Link>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/40 p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto h-10 w-10 text-ink-300" />
                  <p className="mt-4 text-lg font-black text-ink">No messages yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-500">
                    Start with scope, timing, files or delivery questions so the task trail stays clear.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => {
              const mine = message.fromId === user.uid;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[78%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-ink shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <p className={`mt-1 text-[10px] font-bold ${mine ? "text-right text-ink-400" : "text-ink-400"}`}>
                      {mine ? "You" : message.fromName}
                    </p>
                    {message.flagged && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-black text-$warning-700">
                        <AlertTriangle className="h-3 w-3" /> Flagged for review — keep payments on Workly
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-ink-100 bg-white p-3 sm:p-4">
            {error && (
              <Alert tone="error" className="mb-2">
                {error}
              </Alert>
            )}
            <form onSubmit={send} className="flex gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type a message..."
                className="min-h-12 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink placeholder:text-ink-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                aria-label="Send message"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink-400">
              <ShieldCheck className="h-3 w-3 text-brand" /> Sharing phone numbers or off-platform payment details is
              flagged automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
