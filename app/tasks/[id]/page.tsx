"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  claimPrivateTask,
  getTask,
  listBidsForTask,
  placeBid,
  selectBid,
  setTaskStatus,
  addReview,
  listReviewsForUser,
  requestPayment,
  releasePayment,
  subscribeTask,
  listRehireCandidates,
  rehireFreelancer,
  PLATFORM_FEE,
  MIN_BID,
  type Task,
  type Bid,
  type Review,
  type RehireCandidate,
} from "@/lib/tasks";
import { getOrCreateConversation } from "@/lib/chat";
import { computeBidMatch, isFreshTalent, type BidMatch } from "@/lib/matching";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MapPin, Calendar, User, MessageSquare, CheckCircle2, Clock, Star, Gavel, ShieldCheck, Zap, ArrowLeft, Send, Banknote, Tag, Wallet, AlertTriangle, BriefcaseBusiness, XCircle } from "lucide-react";
import { formatDate, formatPKR } from "@/lib/format";

type BidView = Bid & { match?: BidMatch; fresh?: boolean };

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "bg-amber-50 text-amber-700 border-amber-200" },
  open: { label: "Available", color: "bg-brand-50 text-brand-dark border-brand-200" },
  assigned: { label: "Already Assigned", color: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const { user, role, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<BidView[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rehireCandidates, setRehireCandidates] = useState<RehireCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [inviteReady, setInviteReady] = useState(!inviteToken);
  const [warning, setWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rehireAmounts, setRehireAmounts] = useState<Record<string, string>>({});
  const [rehireBusy, setRehireBusy] = useState<string | null>(null);
  const [rehireError, setRehireError] = useState("");

  const isAdmin = role === "company_admin" || role === "super_admin";

  const load = async () => {
    setLoading(true);
    try {
      const t = await getTask(id);
      if (!t) { setNotFound(true); return; }
      setTask(t);
      if (user && t.posterId === user.uid) setRehireCandidates(await listRehireCandidates(t.posterId));
      const canReadBids = !!user && (user.uid === t.posterId || isAdmin);
      const rawBids = canReadBids ? await listBidsForTask(id) : [];
      const withMatch = await Promise.all(rawBids.map(async (b) => {
        let match: BidMatch | undefined; let fresh = false;
        if (db) {
          const s = await getDoc(doc(db, "users", b.bidderId));
          if (s.exists()) {
            const d = s.data();
            match = computeBidMatch(t, { trust: d.trustScore ?? 70, success: d.successRate ?? 80, skills: d.skills ?? [] });
            fresh = isFreshTalent(d.createdAt);
          }
        }
        return { ...b, match, fresh };
      }));
      withMatch.sort((a, b) => (b.match?.percent ?? 0) - (a.match?.percent ?? 0));
      setBids(withMatch);
      if (t.assignedTo) setReviews(await listReviewsForUser(t.assignedTo));
    } catch (err: any) {
      setError(err?.message || "This task is not available to this account.");
      setNotFound(true);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!id || authLoading) return;
    let cancelled = false;
    (async () => {
      if (inviteToken) {
        if (!user) {
          router.replace(`/login?redirect=${encodeURIComponent(`/tasks/${id}?invite=${inviteToken}`)}`);
          return;
        }
        if (role !== "tasker" && !isAdmin) {
          setError("This private invitation can only be claimed by a freelancer account.");
          setLoading(false);
          return;
        }
        if (role === "tasker") {
          try {
            await claimPrivateTask(id, inviteToken, user.uid);
          } catch (err: any) {
            setError(err?.message || "This private invitation has already been claimed or is invalid.");
            setLoading(false);
            return;
          }
        }
      }
      if (!cancelled) {
        setInviteReady(true);
        await load();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, inviteToken, authLoading, user?.uid, role]);

  useEffect(() => {
    if (!id || !inviteReady) return;
    return subscribeTask(id, (liveTask) => {
      if (!liveTask) setNotFound(true);
      else setTask(liveTask);
    });
  }, [id, inviteReady]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (notFound || !task) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-500"><p>{error || "Task not found."}</p> <Link href="/tasks" className="font-semibold text-brand">Back to tasks</Link></div>;

  const isPoster = user?.uid === task.posterId;
  const isAssigned = user?.uid === task.assignedTo;
  const canBid = !!user && role === "tasker" && task.status === "open"
    && (task.visibility === "public" || (task.visibility === "private" && inviteReady))
    && !isPoster;
  const canSelect = (isPoster || isAdmin) && task.status === "open";
  const canManage = (isAssigned || isAdmin) && (task.status === "assigned" || task.status === "in_progress");
  const canRequestPayment = isAssigned && task.status === "completed" && !task.paymentRequested && !task.paymentReleased;
  const canReleasePayment = isPoster && task.status === "completed" && task.paymentRequested && !task.paymentReleased;
  const paymentDone = task.paymentReleased;
  const fee = task.heldAmount ? Math.round(task.heldAmount * PLATFORM_FEE) : 0;
  const statusInfo = STATUS_TAGS[task.status] || STATUS_TAGS.pending;
  const offerPrice = Number(amount) || 0;
  const offerFee = Math.round(offerPrice * PLATFORM_FEE);
  const youReceive = offerPrice - offerFee;
  const isLockedFromMessaging = !isPoster && !isAssigned;

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning(false);
    if (!Number.isFinite(offerPrice) || offerPrice < MIN_BID) {
      setError(`Your offer must be at least ${MIN_BID.toLocaleString("en-PK")}.`);
      return;
    }
    if (offerPrice > task.budget) {
      setWarning(true);
      return;
    }
    setSubmitting(true);
    try {
      if (!user) return;
      await placeBid({ taskId: id, bidderId: user.uid, bidderName: user.displayName || user.email || "Freelancer", amount: offerPrice, message: message.trim() });
      setAmount(""); setMessage(""); load();
    } catch (err: any) { setError(err?.message || "Could not place your offer"); }
    finally { setSubmitting(false); }
  };

  const confirmHighOffer = async () => {
    setSubmitting(true);
    try {
      if (!user) return;
      await placeBid({ taskId: id, bidderId: user.uid, bidderName: user.displayName || user.email || "Freelancer", amount: offerPrice, message: message.trim() });
      setAmount(""); setMessage(""); setWarning(false); load();
    } catch (err: any) { setError(err?.message || "Could not place your offer"); }
    finally { setSubmitting(false); }
  };

  const chooseBid = async (bid: Bid) => {
    if (!bid.id) return;
    setError("");
    try {
      await selectBid(id, bid.id, bid.bidderId, bid.bidderName, bid.amount);
      load();
    } catch (err: any) {
      setError(err?.message || "Could not select this offer.");
    }
  };
  const updateStatus = async (status: "in_progress" | "completed") => { await setTaskStatus(id, status); load(); };
  const reqPayment = async () => { try { await requestPayment(id); load(); } catch (err: any) { setError(err?.message || "Could not request payment"); } };
  const relPayment = async () => { try { await releasePayment(id); load(); } catch (err: any) { setError(err?.message || "Could not release payment"); } };
  const submitReview = async (e: React.FormEvent) => { e.preventDefault(); setError(""); try { if (!user || !task.assignedTo) return; await addReview({ taskId: id, fromId: user.uid, fromName: user.displayName || user.email || "User", toId: task.assignedTo, rating, comment }); setComment(""); load(); } catch (err: any) { setError(err?.message || "Could not submit review"); } };

  const rehire = async (candidate: RehireCandidate) => {
    setRehireError("");
    const offerAmount = Number(rehireAmounts[candidate.taskerId] || "");
    if (!Number.isFinite(offerAmount) || offerAmount < MIN_BID) {
      setRehireError(`Your offer must be at least ${MIN_BID.toLocaleString("en-PK")}.`);
      return;
    }
    setRehireBusy(candidate.taskerId);
    try {
      await rehireFreelancer(id, candidate.taskerId, candidate.taskerName, offerAmount);
      setRehireAmounts({});
      load();
    } catch (err: any) {
      setRehireError(err?.message || "Could not make this offer.");
    } finally {
      setRehireBusy(null);
    }
  };

  const startChat = async () => {
    if (!user || !task.assignedTo || !task.id) return;
    await getOrCreateConversation(task.id, task.posterId, task.assignedTo);
    router.push(`/messages/${task.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/tasks" className="mb-6 flex items-center gap-1 text-sm text-ink-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to tasks</Link>

      {task.status === "cancelled" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-black">This task has been cancelled</p><p className="mt-1 text-sm">No offers can be submitted or selected for this task anymore.</p></div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============ LEFT COLUMN ============ */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-sm font-medium text-ink-600"><Tag className="h-3.5 w-3.5" /> {task.category}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}{task.visibility === "private" ? " - Private" : ""}</span>
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-ink sm:text-4xl">{task.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-ink-600 leading-relaxed">{task.description}</p>

            {/* Client information */}
            <div className="mt-6 grid gap-3 rounded-2xl border border-ink-100 bg-canvas p-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><User className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">Client Name</p><p className="truncate text-sm font-extrabold text-ink">{task.posterName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><MapPin className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">Task Location</p><p className="truncate text-sm font-extrabold text-ink">{task.location}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Clock className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">To Be Done On</p><p className="truncate text-sm font-extrabold text-ink">{task.deadline ? formatDate(task.deadline) : "Flexible (Anytime)"}</p></div>
              </div>
            </div>

            {/* Lifecycle Progress Bar */}
            <div className="mt-6 flex items-center gap-2">
              {["open", "assigned", "in_progress", "completed"].map((stage, i) => {
                const stageIdx = ["open", "assigned", "in_progress", "completed"].indexOf(task.status);
                const isActive = i <= stageIdx;
                const isCurrent = i === stageIdx;
                const labels = ["Open", "Assigned", "In Progress", "Done"];
                return (
                  <div key={stage} className="flex-1 flex items-center">
                    <div className={`flex-1 text-center`}>
                      <div className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${isActive ? "bg-brand text-white" : "bg-ink-100 text-ink-400"}`}>
                        {isActive && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <p className={`mt-1 text-[10px] font-semibold ${isActive ? "text-brand" : "text-ink-400"}`}>{labels[i]}</p>
                    </div>
                    {i < 3 && <div className={`h-0.5 flex-1 ${isActive && stageIdx > i ? "bg-brand" : "bg-ink-100"}`} />}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <span className="rounded-lg bg-brand-50 px-3 py-2 font-black text-brand-dark">{formatPKR(task.budget)}</span>
              <span className="flex items-center gap-1.5 text-ink-500"><Calendar className="h-4 w-4" />{formatDate(task.createdAt)}</span>
              {task.deadline && <span className="flex items-center gap-1.5 text-ink-500"><Clock className="h-4 w-4" />Due: {formatDate(task.deadline)}</span>}
              {!task.deadline && <span className="flex items-center gap-1.5 text-ink-500"><Clock className="h-4 w-4" />Due: Flexible (Anytime)</span>}
              {task.heldAmount && <span className="flex items-center gap-1.5 text-ink-500"><Banknote className="h-4 w-4" />{formatPKR(task.heldAmount)} held</span>}
              {paymentDone && <span className="flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle2 className="h-4 w-4" />Paid</span>}
            </div>

            {task.assignedName && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Assigned freelancer: <Link href={`/u/${task.assignedTo}`} className="font-extrabold text-ink hover:text-brand">{task.assignedName}</Link></span>
                {task.visibility === "private" && <span className="ml-auto rounded-full bg-[#00501F] px-2.5 py-1 text-[10px] font-black uppercase text-white">Managed private</span>}
              </div>
            )}

            {/* Messaging permission */}
            {isPoster || isAssigned ? (
              task.assignedTo && (
                <button onClick={startChat} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                  <MessageSquare className="h-4 w-4" /> Open chat
                </button>
              )
            ) : (
              <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-3.5 text-sm leading-6 text-ink-500">
                {task.assignedTo
                  ? <><MessageSquare className="mr-1.5 inline h-4 w-4 text-ink-300" /> Messaging with this client is only available to the freelancer assigned to this task ({task.assignedName}).</>
                  : <><MessageSquare className="mr-1.5 inline h-4 w-4 text-ink-300" /> Messaging with this client will become available once your offer is selected and you are assigned this task.</>}
              </div>
            )}
          </div>

          {!canBid && error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {/* Bids Section - Poster/Admin */}
          {canSelect && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Gavel className="h-5 w-5 text-brand" /> Offers ({bids.length})</h2>
              {bids.length === 0 ? <p className="mt-2 text-sm text-ink-500">No offers yet. Waiting for freelancers.</p> :
                <div className="mt-4 space-y-3">
                  {bids.map(b => (
                    <div key={b.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-4 transition hover:border-brand/30">
                      <div>
                        <div className="flex items-center gap-2"><p className="font-bold text-ink">{b.bidderName}</p><span className="text-lg font-extrabold text-brand">{formatPKR(b.amount)}</span></div>
                        <p className="mt-0.5 text-sm text-ink-500">{b.message}</p>
                        <div className="mt-1.5 flex gap-2 flex-wrap">
                          {b.match && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-dark">Match {b.match.percent}%</span>}
                          {b.fresh && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"><Zap className="mr-1 inline-block h-3 w-3" /> Fresh</span>}
                        </div>
                      </div>
                      <Button onClick={() => chooseBid(b)} className="shrink-0">Select & hold funds</Button>
                    </div>
                  ))}
                </div>}
            </div>
          )}

          {/* Rehire a previous freelancer - Poster */}
          {isPoster && task.status === "open" && rehireCandidates.length > 0 && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><BriefcaseBusiness className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-bold text-ink">Rehire a previous freelancer</h2><p className="text-xs text-ink-500">Make them a direct offer on this new task.</p></div>
              </div>
              {rehireError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{rehireError}</div>}
              <div className="mt-4 space-y-3">
                {rehireCandidates.map(candidate => (
                  <div key={candidate.taskerId} className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{candidate.taskerName}</p>
                      <p className="mt-0.5 text-xs text-ink-500">Last completed: {candidate.lastTaskTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={MIN_BID} placeholder="Your offer (PKR)" value={rehireAmounts[candidate.taskerId] || ""} onChange={(e) => setRehireAmounts(prev => ({ ...prev, [candidate.taskerId]: e.target.value }))} className="min-h-10 w-36 text-sm" />
                      <Button onClick={() => rehire(candidate)} disabled={rehireBusy === candidate.taskerId} className="min-h-10 px-4 py-2 text-xs">{rehireBusy === candidate.taskerId ? "Sending..." : "Make an Offer"}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Tasker Progress Controls */}
          {canManage && (
            <div className="flex gap-3">
              {task.status === "assigned" && <Button onClick={() => updateStatus("in_progress")} className="rounded-xl">Start work</Button>}
              {task.status === "in_progress" && <Button onClick={() => updateStatus("completed")} className="rounded-xl">Mark completed</Button>}
            </div>
          )}

          {/* Request Payment - Tasker */}
          {canRequestPayment && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600"><Send className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-ink">Request Payment</h2>
                  <p className="text-sm text-ink-500">Ask the poster to release {formatPKR(task.heldAmount)}</p>
                  <p className="text-xs text-ink-400 mt-1">Platform fee: {PLATFORM_FEE * 100}% - you receive {formatPKR(task.heldAmount ? task.heldAmount - Math.round(task.heldAmount * PLATFORM_FEE) : 0)}</p>
                </div>
                <Button onClick={reqPayment} className="rounded-xl flex items-center gap-1.5"><Send className="h-4 w-4" /> Request Payment</Button>
              </div>
            </div>
          )}

          {/* Release Payment - Poster */}
          {canReleasePayment && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand"><Banknote className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-ink">Release Payment</h2>
                  <p className="text-sm text-ink-500">{task.assignedName} has requested {formatPKR(task.heldAmount)}</p>
                  <p className="text-xs text-ink-400 mt-1">Platform fee ({PLATFORM_FEE * 100}%): {formatPKR(fee)} - Tasker receives {formatPKR(task.heldAmount ? task.heldAmount - fee : 0)}</p>
                </div>
                <Button onClick={relPayment} className="rounded-xl flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Release {formatPKR(task.heldAmount)}</Button>
              </div>
            </div>
          )}

          {/* Payment Complete */}
          {paymentDone && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-green-700">Payment Released</h2>
                  <p className="text-sm text-green-600">{formatPKR(task.heldAmount)} has been released. Tasker received {formatPKR(task.heldAmount ? task.heldAmount - Math.round(task.heldAmount * PLATFORM_FEE) : 0)} ({PLATFORM_FEE * 100}% platform fee).</p>
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          {isPoster && task.paymentReleased && task.assignedTo && (
            <form onSubmit={submitReview} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Star className="h-5 w-5 text-brand" /> Rate the tasker</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-ink-500">Rating</span>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none">
                  {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} stars</option>)}
                </select>
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Leave a comment..." className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <Button type="submit" className="mt-3 rounded-xl">Submit review</Button>
            </form>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Star className="h-5 w-5 text-brand" /> Reviews</h2>
              <div className="mt-4 space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                      <span className="text-sm font-semibold text-ink">{r.fromName}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-ink-500">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          {canBid ? (
            <form onSubmit={submitBid} className="rounded-3xl border border-brand-200 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-black text-ink"><BriefcaseBusiness className="h-5 w-5 text-brand" /> Make an Offer</h2>
              <p className="mt-1 text-xs font-medium text-ink-400">{task.visibility === "private" ? "Private invitation" : "Open"} task · Client&apos;s listed price: <span className="font-extrabold text-ink">{formatPKR(task.budget)}</span></p>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-ink">Your proposed price (PKR)</label>
                <Input type="number" min={MIN_BID} step={100} placeholder={String(MIN_BID)} value={amount} onChange={(e) => { setAmount(e.target.value); setWarning(false); }} required />
              </div>
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-ink">Your proposal</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell the client why you are the right fit for this task and how you will deliver..." className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>

              {offerPrice > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl bg-canvas p-4 text-sm">
                  <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Total Price</span><span className="font-black text-ink">{formatPKR(offerPrice)}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1 font-semibold text-ink-500"><Wallet className="h-3.5 w-3.5" /> Account Deduction</span><span className="font-black text-ink">{PLATFORM_FEE * 100}%</span></div>
                  <div className="flex items-center justify-between border-t border-ink-100 pt-2"><span className="font-bold text-brand-dark">You Will Receive</span><span className="font-black text-brand-dark">{formatPKR(youReceive)}</span></div>
                </div>
              )}

              {warning && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Your offer ({formatPKR(offerPrice)}) is higher than the client&apos;s listed price ({formatPKR(task.budget)}). Are you sure you want to submit this offer?</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setWarning(false)} className="flex-1 rounded-xl border border-amber-300 px-3 py-2.5 text-sm font-bold transition hover:bg-amber-100">Cancel</button>
                    <button type="button" onClick={confirmHighOffer} disabled={submitting} className="flex-1 rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700">{submitting ? "Submitting..." : "Yes, continue"}</button>
                  </div>
                </div>
              )}

              {error && <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

              <Button type="submit" disabled={submitting || warning} className="mt-4 w-full gap-2">{submitting ? "Submitting offer..." : "Submit Offer"}</Button>
            </form>
          ) : isLockedFromMessaging && task.status === "open" && (
            <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="text-lg font-black text-ink">Task summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Client&apos;s price</span><span className="font-black text-ink">{formatPKR(task.budget)}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Offers</span><span className="font-black text-ink">{task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Location</span><span className="font-bold text-ink">{task.location}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">To Be Done On</span><span className="font-bold text-ink">{task.deadline ? formatDate(task.deadline) : "Flexible (Anytime)"}</span></div>
              </div>
              {!user && task.visibility === "public" && (
                <Link href={`/login?redirect=/tasks/${id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-extrabold text-white">Sign in to make an offer</Link>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">About this task</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Status</span><span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Offers received</span><span className="font-black text-ink">{task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Client price</span><span className="font-black text-ink">{formatPKR(task.budget)}</span></div>
              {task.deadline ? (
                <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">To Be Done On</span><span className="font-bold text-ink">{formatDate(task.deadline)}</span></div>
              ) : (
                <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">To Be Done On</span><span className="font-bold text-ink">Flexible (Anytime)</span></div>
              )}
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-canvas p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-xs leading-5 text-ink-500">Offers and payments are protected. You only pay a {PLATFORM_FEE * 100}% account deduction when a task is completed.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}