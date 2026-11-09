"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Paperclip,
  X,
  CreditCard,
  Briefcase,
  FileX,
  Award,
  Layers,
  Inbox,
  User,
  Bot,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import FreelancerHeader from "@/components/FreelancerHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  createSupportTicket,
  subscribeUserTickets,
  type SupportTicket,
} from "@/lib/supportTickets";
import { readFileAsDataUrl, formatFileSize } from "@/lib/fileHelper";

const CATEGORIES = [
  {
    id: "payment",
    label: "Payment & Escrow",
    desc: "Held funds, payouts, wallet or platform fees",
    icon: CreditCard,
  },
  {
    id: "dispute",
    label: "Client / Tasker Dispute",
    desc: "Unmet deliverables, timeline delay or scope disagreement",
    icon: Briefcase,
  },
  {
    id: "cancellation",
    label: "Cancellation & Refund",
    desc: "Cancel task, return held budget, or reverse order",
    icon: FileX,
  },
  {
    id: "verification",
    label: "Verification & Badges",
    desc: "Skill interview score, CNIC verification or talent status",
    icon: Award,
  },
  {
    id: "technical",
    label: "App & Technical Bug",
    desc: "Errors, chat connection, or login difficulty",
    icon: Layers,
  },
  {
    id: "general",
    label: "General Question",
    desc: "Marketplace rules, terms of service or advice",
    icon: HelpCircle,
  },
];

const FAQS = [
  {
    q: "How do I find my first task as a freelancer?",
    a: "Complete your profile, pass the AI Skill Check, then browse the marketplace, filter by category or location, and send an offer on tasks that match your skills.",
    href: "/tasks",
    cta: "Browse tasks",
  },
  {
    q: "How does Escrow payment protection work?",
    a: "When a client selects a freelancer's offer, the agreed task budget is secured in AventriqTalent Escrow. The funds are held safely and only released to the freelancer once the client approves the completed work.",
    href: "/how-it-works",
    cta: "See how it works",
  },
  {
    q: "When and how do I get paid?",
    a: "After a client approves a task, the held budget is released to your wallet. A 15% platform fee applies per payment. You can withdraw to your Easypaisa, JazzCash, or bank account anytime.",
    href: "/payment-history",
    cta: "View payment history",
  },
  {
    q: "What is the skill check and verified badge?",
    a: "An AI-powered assessment that scores your actual domain skills and problem-solving ability. Passing it awards the Verified Talent badge and ranks your proposals higher in client searches.",
    href: "/interview",
    cta: "Take the skill check",
  },
  {
    q: "What happens if a task gets cancelled or disputed?",
    a: "Cancellations follow the platform's cancellation policy: the held budget is not released to the freelancer and our support team investigates any disputes based on task chat records and milestones.",
    href: "/cancellation-policy",
    cta: "Read cancellation policy",
  },
  {
    q: "How are personal contacts and off-platform dealing regulated?",
    a: "Sharing personal contact details (phone, WhatsApp, email) or attempting to transact outside the platform is strictly blocked by our AI Contact Shield to prevent fraud and ensure Escrow protection for both parties.",
    href: "/community-guidelines",
    cta: "Community guidelines",
  },
];

export default function HelpPage() {
  const { user, role } = useAuth();
  const [tab, setTab] = useState<"submit" | "tickets" | "faq">("submit");

  // Ticket form state
  const [userRole, setUserRole] = useState<"client" | "tasker">("tasker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("payment");
  const [taskId, setTaskId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [attachments, setAttachments] = useState<{ name: string; url: string; size?: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User tickets list
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
      if (role === "tasker" || role === "customer") {
        setUserRole(role === "tasker" ? "tasker" : "client");
      }
      return subscribeUserTickets(user.uid, setTickets);
    }
  }, [user, role]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems: { name: string; url: string; size?: number }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await readFileAsDataUrl(file);
        newItems.push({ name: file.name, url, size: file.size });
      } catch {
        // Ignored
      }
    }
    setAttachments((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!subject.trim() || !description.trim()) {
      setError("Please fill in both the subject and problem description.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email so we can reply with updates.");
      return;
    }

    setSubmitting(true);
    try {
      const code = await createSupportTicket({
        userId: user?.uid || "guest",
        userName: name.trim() || "User",
        userEmail: email.trim(),
        userRole,
        category,
        taskId: taskId.trim() || undefined,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        attachments: attachments.map(({ name, url }) => ({ name, url })),
      });

      setSuccessCode(code);
      setSubject("");
      setDescription("");
      setTaskId("");
      setAttachments([]);
      // Refresh tickets list
      if (user) {
        subscribeUserTickets(user.uid, setTickets);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      {role === "tasker" && <FreelancerHeader />}

      <div className="bg-canvas py-8 sm:py-10">
        <div className="page-shell max-w-5xl">
          {/* Header Banner */}
          <div className="overflow-hidden rounded-[32px] bg-forest p-6 text-white shadow-elevated sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand">
                  <HelpCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">SUPPORT CENTRE</p>
                  <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl">Help &amp; Live Support</h1>
                  <p className="mt-1 text-sm text-white/70">
                    Real-time assistance for clients and freelancers. Report issues, disputes, or get quick help.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/90">
                <span className="h-2 w-2 rounded-full bg-mint animate-pulse" /> Live Support Available (24/7)
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2 border-b border-ink-100 pb-3">
            <button
              onClick={() => {
                setTab("submit");
                setSuccessCode(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === "submit"
                  ? "bg-brand text-white shadow-soft"
                  : "bg-white text-ink-600 hover:bg-brand-50 hover:text-brand"
              }`}
            >
              <Send className="h-4 w-4" /> Send Issue / Ticket
            </button>
            <button
              onClick={() => {
                setTab("tickets");
                setSuccessCode(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === "tickets"
                  ? "bg-brand text-white shadow-soft"
                  : "bg-white text-ink-600 hover:bg-brand-50 hover:text-brand"
              }`}
            >
              <Inbox className="h-4 w-4" /> My Issues &amp; Status
              {tickets.length > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-black text-white">
                  {tickets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setTab("faq");
                setSuccessCode(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === "faq"
                  ? "bg-brand text-white shadow-soft"
                  : "bg-white text-ink-600 hover:bg-brand-50 hover:text-brand"
              }`}
            >
              <FileText className="h-4 w-4" /> FAQ &amp; Policies
            </button>
          </div>

          {/* TAB 1: Real-time Ticket Submission */}
          {tab === "submit" && (
            <div className="mt-6 space-y-6">
              {successCode ? (
                <div className="rounded-3xl border-2 border-brand-200 bg-brand-50/60 p-8 text-center shadow-card">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-4 text-xl font-black text-ink">Your Issue Has Been Received in Real-Time!</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
                    We have logged your issue under ticket tracking reference:
                  </p>
                  <p className="mt-2 text-2xl font-black text-brand tracking-wider font-mono">{successCode}</p>
                  <p className="mt-3 text-xs text-ink-500">
                    Our platform support team has received your details and is investigating. A confirmation has been recorded, and updates will be posted to your account.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button onClick={() => setTab("tickets")} className="rounded-xl">
                      View My Tickets
                    </Button>
                    <button
                      type="button"
                      onClick={() => setSuccessCode(null)}
                      className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-ink-50"
                    >
                      Submit Another Issue
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
                  <div className="border-b border-ink-100 pb-5">
                    <h2 className="text-xl font-black text-ink">Submit an Issue or Problem</h2>
                    <p className="mt-1 text-xs text-ink-500">
                      Whether you are a client with a task issue or a freelancer facing payment or scope delays, tell us what happened and our team will resolve it.
                    </p>
                  </div>

                  {/* Role Selector */}
                  <div className="mt-6">
                    <label className="block text-xs font-black uppercase tracking-wider text-ink-400 mb-2">
                      I am contacting support as:
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        type="button"
                        onClick={() => setUserRole("client")}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
                          userRole === "client"
                            ? "border-brand bg-brand-50 text-brand-dark ring-2 ring-brand/20"
                            : "border-ink-200 bg-white text-ink hover:bg-ink-50"
                        }`}
                      >
                        <User className="h-4 w-4" /> Client (Task Poster)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRole("tasker")}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
                          userRole === "tasker"
                            ? "border-brand bg-brand-50 text-brand-dark ring-2 ring-brand/20"
                            : "border-ink-200 bg-white text-ink hover:bg-ink-50"
                        }`}
                      >
                        <Briefcase className="h-4 w-4" /> Freelancer (Talent)
                      </button>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="mt-6">
                    <label className="block text-xs font-black uppercase tracking-wider text-ink-400 mb-2">
                      Select Issue Category:
                    </label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                              isSelected
                                ? "border-brand bg-brand-50/50 shadow-soft ring-2 ring-brand/20"
                                : "border-ink-100 bg-white hover:border-brand/30 hover:bg-canvas"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                                  isSelected ? "bg-brand text-white" : "bg-ink-50 text-ink-600"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <h3 className="text-xs font-bold text-ink">{cat.label}</h3>
                            </div>
                            <p className="mt-1 text-[11px] leading-4 text-ink-500">{cat.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personal & Task Details */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="user-name" className="mb-1.5 block text-xs font-bold text-ink">
                        Your Name
                      </label>
                      <Input
                        id="user-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ali Khan"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="user-email" className="mb-1.5 block text-xs font-bold text-ink">
                        Email Address (for resolution updates)
                      </label>
                      <Input
                        id="user-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="task-id" className="mb-1.5 block text-xs font-bold text-ink">
                        Related Task ID <span className="font-normal text-ink-400">(Optional)</span>
                      </label>
                      <Input
                        id="task-id"
                        value={taskId}
                        onChange={(e) => setTaskId(e.target.value)}
                        placeholder="e.g. laptop repairing or Task ID"
                      />
                    </div>
                    <div>
                      <label htmlFor="priority-select" className="mb-1.5 block text-xs font-bold text-ink">
                        Urgency Level
                      </label>
                      <select
                        id="priority-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                      >
                        <option value="normal">Standard (Normal priority)</option>
                        <option value="urgent">Urgent (Payment stuck / immediate dispute)</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject & Description */}
                  <div className="mt-4">
                    <label htmlFor="issue-subject" className="mb-1.5 block text-xs font-bold text-ink">
                      Subject
                    </label>
                    <Input
                      id="issue-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of the problem"
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="issue-description" className="mb-1.5 block text-xs font-bold text-ink">
                      Detailed Problem Description
                    </label>
                    <textarea
                      id="issue-description"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain in full detail: what happened, what was agreed upon, and what resolution you require..."
                      className="w-full rounded-xl border border-ink-200 bg-white p-3.5 text-sm text-ink placeholder:text-ink-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      required
                    />
                  </div>

                  {/* Proof Attachment */}
                  <div className="mt-4 rounded-2xl border border-ink-100 bg-canvas p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-ink">Attach Proof or Screenshots</p>
                        <p className="text-[11px] text-ink-500">
                          Upload screenshots of chats, payment receipts, or deliverables.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="support-file-input"
                      />
                      <label
                        htmlFor="support-file-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink-50"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-brand" /> Add Files
                      </label>
                    </div>

                    {attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs"
                          >
                            <span className="max-w-[150px] truncate font-medium text-ink">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="text-ink-400 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-xs text-ink-400 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-brand" /> Logged securely to AventriqTalent Support Desk
                    </p>
                    <Button type="submit" disabled={submitting} className="rounded-xl px-6">
                      {submitting ? "Sending to support..." : "Send Problem to Support"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Real-time Ticket Status Tracker */}
          {tab === "tickets" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-ink">My Submitted Support Tickets</h2>
                    <p className="text-xs text-ink-500">Live real-time tracking of issues you reported to support.</p>
                  </div>
                  <Button onClick={() => setTab("submit")} className="rounded-xl text-xs">
                    + New Support Request
                  </Button>
                </div>

                {tickets.length === 0 ? (
                  <div className="py-12 text-center">
                    <Inbox className="mx-auto h-12 w-12 text-ink-300" />
                    <p className="mt-3 text-base font-bold text-ink">No support tickets found</p>
                    <p className="mt-1 text-xs text-ink-500">
                      When you submit a problem or dispute, its real-time investigation status will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {tickets.map((t) => (
                      <div key={t.id || t.ticketCode} className="rounded-2xl border border-ink-100 p-5 transition hover:border-brand/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-brand bg-brand-50 px-2 py-0.5 rounded">
                              {t.ticketCode}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
                              {t.category}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              t.status === "resolved"
                                ? "bg-brand-100 text-brand-800"
                                : t.status === "investigating"
                                ? "bg-blue-100 text-blue-800 animate-pulse"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status === "resolved"
                              ? "✓ Resolved"
                              : t.status === "investigating"
                              ? "Investigating"
                              : "Under Review"}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-black text-ink">{t.subject}</h3>
                        <p className="mt-1 text-sm text-ink-600 whitespace-pre-wrap">{t.description}</p>

                        {t.adminResponse && (
                          <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
                            <p className="text-xs font-black uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                              <Bot className="h-3.5 w-3.5" /> Support Response
                            </p>
                            <p className="mt-1 text-xs text-ink-700 leading-relaxed">{t.adminResponse}</p>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs text-ink-400 border-t border-ink-100 pt-3">
                          <span>Role: {t.userRole === "tasker" ? "Freelancer" : "Client"}</span>
                          <span>Priority: {t.priority.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FAQ & Legal Pages Directory */}
          {tab === "faq" && (
            <div className="mt-6 space-y-6">
              {/* Quick legal / policy cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <Link
                  href="/terms"
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand/40 hover:bg-brand-50"
                >
                  <FileText className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-ink">Terms and Conditions</p>
                    <p className="text-[11px] text-ink-400">Complete user and platform agreement</p>
                  </div>
                </Link>
                <Link
                  href="/privacy"
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand/40 hover:bg-brand-50"
                >
                  <ShieldCheck className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-ink">Privacy Policy</p>
                    <p className="text-[11px] text-ink-400">Data protection, escrow &amp; cookies</p>
                  </div>
                </Link>
                <Link
                  href="/community-guidelines"
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand/40 hover:bg-brand-50"
                >
                  <Briefcase className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-ink">Community Guidelines</p>
                    <p className="text-[11px] text-ink-400">Anti-circumvention &amp; conduct</p>
                  </div>
                </Link>
                <Link
                  href="/cancellation-policy"
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand/40 hover:bg-brand-50"
                >
                  <FileX className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-ink">Cancellation Policy</p>
                    <p className="text-[11px] text-ink-400">Refunds &amp; order cancellations</p>
                  </div>
                </Link>
                <Link
                  href="/insurance"
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand/40 hover:bg-brand-50"
                >
                  <ShieldCheck className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-ink">AventriqTalent Protect</p>
                    <p className="text-[11px] text-ink-400">Task guarantee &amp; escrow coverage</p>
                  </div>
                </Link>
                <Link
                  href="/contact"
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand/40 hover:bg-brand-50"
                >
                  <Mail className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-ink">Direct Contact</p>
                    <p className="text-[11px] text-ink-400">Email &amp; office contact details</p>
                  </div>
                </Link>
              </div>

              {/* FAQs Accordions */}
              <div className="surface p-6 sm:p-8">
                <h2 className="text-lg font-black tracking-[-0.03em] text-ink">Frequently asked questions</h2>
                <div className="mt-4 divide-y divide-ink-100">
                  {FAQS.map((faq, i) => (
                    <details key={i} className="group py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-ink [&::-webkit-details-marker]:hidden">
                        {faq.q}
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink-100 text-ink-400 transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-ink-600">{faq.a}</p>
                      {faq.href && faq.cta && (
                        <Link
                          href={faq.href}
                          className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-extrabold text-white transition hover:bg-brand-700"
                        >
                          {faq.cta} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Support Banner Footer */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl bg-forest p-6 text-white shadow-card sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em]">Need to talk right now?</h2>
                <p className="mt-0.5 text-sm text-white/70">
                  Our team responds promptly to all task disputes and escrow questions.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setTab("submit");
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700"
            >
              Open a Support Ticket <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}