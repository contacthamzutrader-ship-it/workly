"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getTask, listBidsForTask, placeBid, selectBid, setTaskStatus, addReview, listReviewsForUser, requestPayment, releasePayment, PLATFORM_FEE, type Task, type Bid, type Review } from "@/lib/tasks";
import { getOrCreateConversation } from "@/lib/chat";
import { computeBidMatch, isFreshTalent, type BidMatch } from "@/lib/matching";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MapPin, DollarSign, Calendar, User, MessageSquare, CheckCircle2, Clock, Star, Gavel, ShieldCheck, Zap, ArrowLeft, Send, Banknote, Percent } from "lucide-react";

type BidView = Bid & { match?: BidMatch; fresh?: boolean };

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "bg-amber-50 text-amber-700 border-amber-200" },
  open: { label: "Open for Bids", color: "bg-brand-50 text-brand-dark border-brand-200" },
  assigned: { label: "Assigned", color: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<BidView[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const isAdmin = role === "company_admin" || role === "super_admin";

  const load = async () => {
    setLoading(true);
    try {
      const t = await getTask(id);
      if (!t) { setNotFound(true); return; }
      setTask(t);
      const rawBids = await listBidsForTask(id);
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
    } catch { setNotFound(true); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (notFound || !task) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-500">Task not found. <Link href="/tasks" className="font-semibold text-brand">Back to tasks</Link></div>;

  const isPoster = user?.uid === task.posterId;
  const isAssigned = user?.uid === task.assignedTo;
  const canBid = task.status === "open" && ((task.visibility === "public" && !isPoster) || (task.visibility === "private" && isAdmin));
  const canSelect = (isPoster || isAdmin) && task.status === "open";
  const canManage = (isAssigned || isAdmin) && (task.status === "assigned" || task.status === "in_progress");
  const canRequestPayment = isAssigned && task.status === "completed" && !task.paymentRequested && !task.paymentReleased;
  const canReleasePayment = isPoster && task.status === "completed" && task.paymentRequested && !task.paymentReleased;
  const paymentDone = task.paymentReleased;
  const fee = task.heldAmount ? Math.round(task.heldAmount * PLATFORM_FEE) : 0;
  const statusInfo = STATUS_TAGS[task.status] || STATUS_TAGS.pending;

  const submitBid = async (e: React.FormEvent) => { e.preventDefault(); setError(""); try { if (!user) return; await placeBid({ taskId: id, bidderId: user.uid, bidderName: user.displayName || user.email || "Tasker", amount: Number(amount), message }); setAmount(""); setMessage(""); load(); } catch (err: any) { setError(err?.message || "Could not place bid"); } };
  const chooseBid = async (bid: Bid) => { if (!bid.id) return; await selectBid(id, bid.id, bid.bidderId, bid.bidderName, bid.amount); load(); };
  const updateStatus = async (status: "in_progress" | "completed") => { await setTaskStatus(id, status); load(); };
  const reqPayment = async () => { try { await requestPayment(id); load(); } catch (err: any) { setError(err?.message || "Could not request payment"); } };
  const relPayment = async () => { try { await releasePayment(id); load(); } catch (err: any) { setError(err?.message || "Could not release payment"); } };
  const submitReview = async (e: React.FormEvent) => { e.preventDefault(); setError(""); try { if (!user || !task.assignedTo) return; await addReview({ taskId: id, fromId: user.uid, fromName: user.displayName || user.email || "User", toId: task.assignedTo, rating, comment }); setComment(""); load(); } catch (err: any) { setError(err?.message || "Could not submit review"); } };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/tasks" className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink mb-6"><ArrowLeft className="h-4 w-4" /> Back to tasks</Link>

      {/* Task Header */}
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-sm font-medium text-ink-600"><Tag /> {task.category}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}{task.visibility === "private" ? " · Private" : ""}</span>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">{task.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-ink-600 leading-relaxed">{task.description}</p>

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
          <span className="flex items-center gap-1.5 font-bold text-brand"><DollarSign className="h-4 w-4" />${task.budget}</span>
          <span className="flex items-center gap-1.5 text-ink-500"><MapPin className="h-4 w-4" />{task.location}</span>
          <span className="flex items-center gap-1.5 text-ink-500"><User className="h-4 w-4" />{task.posterName}</span>
          <span className="flex items-center gap-1.5 text-ink-500"><Calendar className="h-4 w-4" />{new Date(task.createdAt || Date.now()).toLocaleDateString()}</span>
          {task.deadline && <span className="flex items-center gap-1.5 text-ink-500"><Clock className="h-4 w-4" />Due: {new Date(task.deadline).toLocaleDateString()}</span>}
          {task.heldAmount && <span className="flex items-center gap-1.5 text-ink-500"><Banknote className="h-4 w-4" />${task.heldAmount} held</span>}
          {paymentDone && <span className="flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle2 className="h-4 w-4" />Paid</span>}
        </div>
        {task.assignedName && <p className="mt-3 text-sm text-ink-500">Assigned to: <Link href={`/u/${task.assignedTo}`} className="font-semibold text-ink hover:text-brand">{task.assignedName}</Link></p>}

        {/* Chat button */}
        {task.assignedTo && (isPoster || isAssigned) && (
          <button onClick={async () => { if (!user || !task.assignedTo || !task.id) return; await getOrCreateConversation(task.id, task.posterId, task.assignedTo); router.push(`/messages/${task.id}`); }}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><MessageSquare className="h-4 w-4" /> Open chat</button>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Bids Section - Poster/Admin */}
      {canSelect && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Gavel className="h-5 w-5 text-brand" /> Bids ({bids.length})</h2>
          {bids.length === 0 ? <p className="mt-2 text-sm text-ink-500">No bids yet. Waiting for taskers.</p> :
            <div className="mt-4 space-y-3">
              {bids.map(b => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-4 transition hover:border-brand/30">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-bold text-ink">{b.bidderName}</p><span className="text-lg font-extrabold text-brand">${b.amount}</span></div>
                    <p className="mt-0.5 text-sm text-ink-500">{b.message}</p>
                    <div className="mt-1.5 flex gap-2 flex-wrap">
                      {b.match && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-dark">Match {b.match.percent}%</span>}
                      {b.fresh && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"><Zap className="mr-1 inline-block h-3 w-3" /> Fresh</span>}
                    </div>
                  </div>
                  <Button onClick={() => chooseBid(b)} className="shrink-0">Select</Button>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* Bid Form */}
      {canBid && (
        <form onSubmit={submitBid} className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink">Place a bid</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input type="number" min={1} placeholder="Your price ($)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input placeholder="Why should you be hired?" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button type="submit" className="mt-3 rounded-xl">Submit bid</Button>
        </form>
      )}

      {/* Assigned Tasker Progress Controls */}
      {canManage && (
        <div className="mt-6 flex gap-3">
          {task.status === "assigned" && <Button onClick={() => updateStatus("in_progress")} className="rounded-xl">Start work</Button>}
          {task.status === "in_progress" && <Button onClick={() => updateStatus("completed")} className="rounded-xl">Mark completed</Button>}
        </div>
      )}

      {/* Request Payment — Tasker */}
      {canRequestPayment && (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600"><Send className="h-5 w-5" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink">Request Payment</h2>
              <p className="text-sm text-ink-500">Ask the poster to release payment (${task.heldAmount}) </p>
              <p className="text-xs text-ink-400 mt-1">Platform fee: {PLATFORM_FEE * 100}% — you receive ${task.heldAmount ? task.heldAmount - Math.round(task.heldAmount * PLATFORM_FEE) : 0}</p>
            </div>
            <Button onClick={reqPayment} className="rounded-xl flex items-center gap-1.5"><Send className="h-4 w-4" /> Request Payment</Button>
          </div>
        </div>
      )}

      {/* Release Payment — Poster */}
      {canReleasePayment && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand"><Banknote className="h-5 w-5" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink">Release Payment</h2>
              <p className="text-sm text-ink-500">{task.assignedName} has requested payment of ${task.heldAmount}</p>
              <p className="text-xs text-ink-400 mt-1">Platform fee ({PLATFORM_FEE * 100}%): ${fee} · Tasker receives ${task.heldAmount ? task.heldAmount - fee : 0}</p>
            </div>
            <Button onClick={relPayment} className="rounded-xl flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Release ${task.heldAmount}</Button>
          </div>
        </div>
      )}

      {/* Payment Complete */}
      {paymentDone && (
        <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-green-700">Payment Released</h2>
              <p className="text-sm text-green-600">${task.heldAmount} has been released. Tasker received ${task.heldAmount ? task.heldAmount - Math.round(task.heldAmount * PLATFORM_FEE) : 0} (${PLATFORM_FEE * 100}% platform fee).</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {isPoster && task.paymentReleased && task.assignedTo && (
        <form onSubmit={submitReview} className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Star className="h-5 w-5 text-brand" /> Rate the tasker</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-ink-500">Rating</span>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none">
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
            </select>
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Leave a comment..." className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
          <Button type="submit" className="mt-3 rounded-xl">Submit review</Button>
        </form>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
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
  );
}

function Tag() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
