"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { subscribeMessages, sendMessage, type Message, type ChatAttachment } from "@/lib/chat";
import { markRead } from "@/lib/read-receipts";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Input from "@/components/ui/Input";
import ChatMediaViewer from "@/components/ChatMediaViewer";
import { detectFileType, formatFileSize, readFileAsDataUrl } from "@/lib/fileHelper";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/messages/" + id);
  }, [loading, user, router, id]);

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
      markRead(id);
      unsub = subscribeMessages(id, setMessages);
    })();
    return () => {
      if (unsub) unsub();
    };
  }, [user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, attachments]);

  if (loading || !user)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );

  if (allowed === false)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mt-5 text-lg font-black text-ink">Messaging not available</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
          This conversation is private to the client and the freelancer assigned to the task. You can only message the client once you are assigned this task.
        </p>
        <Link href="/messages" className="mt-5 inline-block font-semibold text-brand hover:underline">
          Back to messages
        </Link>
      </div>
    );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setError("");
    const newItems: ChatAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await readFileAsDataUrl(file);
        const type = detectFileType(file);
        newItems.push({
          name: file.name,
          url,
          type,
          mimeType: file.type,
          size: file.size,
        });
      } catch {
        setError(`Failed to read file ${file.name}`);
      }
    }

    setAttachments((prev) => [...prev, ...newItems]);
    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || !user || !id) return;
    setError("");
    try {
      await sendMessage(
        id,
        user.uid,
        user.displayName || user.email || "User",
        text.trim(),
        attachments
      );
      markRead(id);
      setText("");
      setAttachments([]);
    } catch (err: any) {
      setError(err?.message || "Could not send");
    }
  };

  return (
    <div className="bg-canvas py-4 sm:py-6">
      <div className="page-shell max-w-4xl">
        <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-card">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-forest px-4 py-4 text-white sm:px-5">
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
                aria-label="Back to messages"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Task chat</p>
                <h1 className="text-base font-black">Delivery conversation</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 sm:inline-flex">
              <ShieldCheck className="h-4 w-4 text-brand-300" /> Private Escrow Chat
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/45 p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto h-10 w-10 text-ink-300" />
                  <p className="mt-4 text-lg font-black text-ink">No messages yet</p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-ink-500">
                    Start with scope, timing, files, photos, videos, or delivery questions so the task trail stays clear.
                  </p>
                </div>
              </div>
            )}
            {messages.map((m) => {
              const mine = m.fromId === user.uid;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine ? "bg-brand text-white rounded-br-md" : "bg-white text-ink shadow-card rounded-bl-md"
                    }`}
                  >
                    {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                    {m.attachments && m.attachments.length > 0 && (
                      <ChatMediaViewer attachments={m.attachments} isMine={mine} />
                    )}
                    <div className={`mt-1 flex items-center justify-between gap-2 text-[10px] ${mine ? "text-white/70" : "text-ink-400"}`}>
                      <span>{m.fromName}</span>
                      {m.flagged && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1 text-[9px] font-bold bg-amber-400/20 text-amber-200">
                          <AlertTriangle className="h-2.5 w-2.5" /> Flagged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Attached Files Preview Bar */}
          {attachments.length > 0 && (
            <div className="border-t border-ink-100 bg-canvas px-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">
                Attached Files ({attachments.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs shadow-soft"
                  >
                    {att.type === "image" ? (
                      <ImageIcon className="h-3.5 w-3.5 text-brand" />
                    ) : att.type === "video" ? (
                      <Video className="h-3.5 w-3.5 text-purple-600" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    <span className="max-w-[130px] truncate font-medium text-ink">{att.name}</span>
                    <span className="text-[10px] text-ink-400">({formatFileSize(att.size)})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="ml-1 rounded p-0.5 text-ink-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isProcessingFiles && (
            <div className="bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              Processing attached media...
            </div>
          )}

          <div className="shrink-0 border-t border-ink-100 bg-white p-3 sm:p-4">
            {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
            <form onSubmit={send} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
                id="task-chat-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-200 bg-canvas text-ink-600 transition hover:bg-brand-50 hover:text-brand"
                title="Attach photos, videos, documents, or files"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message, discuss delivery, or share files..."
                className="flex-1"
              />
              <button
                type="submit"
                disabled={!text.trim() && attachments.length === 0}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
