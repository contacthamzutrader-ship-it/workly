import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Inbox,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { subscribeConversations, subscribeMessages, sendMessage, type Conversation, type Message, type ChatAttachment } from "@/lib/chat";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FreelancerHeader from "@/components/FreelancerHeader";
import Input from "@/components/ui/Input";
import { isUnread, markRead } from "@/lib/read-receipts";
import ChatMediaViewer from "@/components/ChatMediaViewer";
import { detectFileType, formatFileSize, readFileAsDataUrl } from "@/lib/fileHelper";

type Tab = "all" | "unread";

function tsToMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
  return 0;
}

function shortTime(ts: any): string {
  const ms = tsToMs(ts);
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "2-digit" });
}

function ChatPane({ convId, myName, otherName, onBack }: { convId: string; myName: string; otherName: string; onBack: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!convId) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeMessages(convId, setMessages);
    } catch {
      // Conversation messages could not be subscribed.
    }
    return () => { if (unsub) unsub(); };
  }, [convId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, attachments]);

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
    if ((!text.trim() && attachments.length === 0) || !user || !convId) return;
    setError("");
    try {
      await sendMessage(
        convId,
        user.uid,
        user.displayName || user.email || "User",
        text.trim(),
        attachments
      );
      setText("");
      setAttachments([]);
      markRead(convId);
    } catch (err: any) {
      setError(err?.message || "Could not send message");
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between bg-forest px-3 py-3 text-white sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15 lg:hidden" aria-label="Back to conversations">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-black text-white">{otherName[0]?.toUpperCase() || "U"}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{otherName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-300">Task {convId.slice(0, 6)}</p>
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 md:inline-flex">
          <ShieldCheck className="h-4 w-4 text-brand-300" /> Private Escrow Chat
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/45 p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <MessageSquare className="mx-auto h-9 w-9 text-ink-300" />
              <p className="mt-3 text-base font-black text-ink">No messages yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-ink-500">Say hello and confirm the scope, timing, files, and project delivery.</p>
            </div>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.fromId === user?.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-brand text-white rounded-br-md" : "bg-white text-ink shadow-card rounded-bl-md"}`}>
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

      {/* Selected Attachments Preview Bar */}
      {attachments.length > 0 && (
        <div className="border-t border-ink-100 bg-canvas px-4 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">Attached Files ({attachments.length}):</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs shadow-soft">
                {att.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-brand" /> : att.type === "video" ? <Video className="h-3.5 w-3.5 text-purple-600" /> : <FileText className="h-3.5 w-3.5 text-blue-600" />}
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

      <div className="shrink-0 border-t border-ink-100 bg-white p-3">
        {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
        <form onSubmit={send} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
            id="chat-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-200 bg-canvas text-ink-600 transition hover:bg-brand-50 hover:text-brand"
            title="Attach images, videos, documents, or files"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message, ask questions, or share files..."
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
  );
}

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

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

  const searchable = (c: Conversation) => {
    const other = c.participants.find(p => p !== user.uid) || "";
    return `${names[other] || "User"} ${c.lastMessage || ""} ${c.taskId || ""}`.toLowerCase().includes(search.toLowerCase());
  };

  const list = convs.filter(searchable);
  const unread = list.filter((c) => isUnread(c.id || "", c.updatedAt || c.createdAt));
  const shown = tab === "unread" ? unread : list;

  const open = (c: Conversation) => {
    if (!c.id) return;
    setActiveId(c.id);
    markRead(c.id);
    setTick(t => t + 1);
  };

  const activeConv = convs.find((c) => c.id === activeId);

  return (
    <div className="min-h-screen bg-canvas">
      <FreelancerHeader />
      <div className="page-shell pb-16 pt-6 sm:pt-8">
        <div>
          <p className="page-eyebrow">Messages</p>
          <h1 className="page-title">Conversations</h1>
          <p className="page-sub">All your task chats in one place — pick a chat to open it on the side.</p>
        </div>

        <div className="mt-6 flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card lg:min-h-[520px] lg:flex-row">
          <div className={`${activeId ? "hidden" : "flex"} w-full flex-col border-b border-ink-100 lg:flex lg:w-[340px] lg:shrink-0 lg:border-b-0 lg:border-r`}>
            <div className="shrink-0 space-y-3 border-b border-ink-100 p-3">
              <div className="flex gap-1 rounded-xl bg-ink-50 p-1">
                <button onClick={() => setTab("all")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-[13px] font-bold transition ${tab === "all" ? "bg-white text-ink shadow-card" : "text-ink-500 hover:text-ink"}`}>
                  All Messages
                  <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-black text-ink-500">{list.length}</span>
                </button>
                <button onClick={() => setTab("unread")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-[13px] font-bold transition ${tab === "unread" ? "bg-white text-ink shadow-card" : "text-ink-500 hover:text-ink"}`}>
                  Unread Messages
                  {unread.length > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-black text-white">{unread.length}</span>}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="min-h-10 w-full rounded-xl border border-ink-100 bg-canvas py-2.5 pl-10 pr-3 text-sm font-medium text-ink placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand/10" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" key={tick}>
              {busy ? (
                <div className="flex h-full items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand border-t-transparent" /></div>
              ) : shown.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300"><Inbox className="h-5 w-5" /></span>
                  {tab === "unread" ? (
                    <>
                      <p className="mt-3 text-sm font-bold text-ink">No unread messages</p>
                      <p className="mt-1 text-xs leading-5 text-ink-500">Conversations with new replies will show up here.</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-bold text-ink">No conversations</p>
                      <p className="mt-1 text-xs leading-5 text-ink-500">Accept a bid or get assigned to a task to start a focused delivery chat.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {shown.map((c) => {
                    const other = c.participants.find(p => p !== user.uid) || "";
                    const unreadNow = isUnread(c.id || "", c.updatedAt || c.createdAt);
                    const active = c.id === activeId;
                    return (
                      <button key={c.id} onClick={() => open(c)} className={`flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition ${active ? "bg-brand-50" : "hover:bg-canvas"}`}>
                        <div className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black ${active ? "bg-brand text-white" : "bg-brand-50 text-brand-dark"}`}>
                          {(names[other] || "U")[0].toUpperCase()}
                          {unreadNow && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={`truncate text-sm ${unreadNow ? "font-black text-ink" : "font-semibold text-ink"}`}>{names[other] || "User"}</p>
                            <span className="shrink-0 text-[10px] font-semibold text-ink-400">{shortTime(c.updatedAt || c.createdAt)}</span>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <p className={`truncate text-xs ${unreadNow ? "font-semibold text-ink-600" : "text-ink-400"}`}>{c.lastMessage || "No messages yet"}</p>
                            <span className="shrink-0 rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-400">#{c.taskId.slice(0, 6)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={`${activeId ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}>
            {activeConv ? (
              <ChatPane
                convId={activeConv.id || ""}
                myName={user.displayName || user.email || "User"}
                otherName={activeConv.participants.find(p => p !== user.uid) ? names[activeConv.participants.find(p => p !== user.uid)!] || "User" : "User"}
                onBack={() => { setActiveId(null); setTick(t => t + 1); }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-ink-50/30 p-8 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-dark"><MessageSquare className="h-6 w-6" /></span>
                <p className="mt-4 text-lg font-black text-ink">Choose a chat</p>
                <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-ink-500">Select a conversation from the list to open it here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}