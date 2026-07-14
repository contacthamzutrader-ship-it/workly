"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getTask,
  listBidsForTask,
  placeBid,
  selectBid,
  setTaskStatus,
  addReview,
  listReviewsForUser,
  type Task,
  type Bid,
  type Review,
} from "@/lib/tasks";
import { getOrCreateConversation } from "@/lib/chat";
import { computeBidMatch, isFreshTalent, type BidMatch } from "@/lib/matching";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type BidView = Bid & { match?: BidMatch; fresh?: boolean };

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
      if (!t) {
        setNotFound(true);
        return;
      }
      setTask(t);
      const rawBids = await listBidsForTask(id);
      const withMatch = await Promise.all(
        rawBids.map(async (b) => {
          let match: BidMatch | undefined;
          let fresh = false;
          if (db) {
            const s = await getDoc(doc(db, "users", b.bidderId));
            if (s.exists()) {
              const d = s.data();
              match = computeBidMatch(t, {
                trust: d.trustScore ?? 70,
                success: d.successRate ?? 80,
                skills: d.skills ?? [],
              });
              fresh = isFreshTalent(d.createdAt);
            }
          }
          return { ...b, match, fresh };
        })
      );
      withMatch.sort((a, b) => (b.match?.percent ?? 0) - (a.match?.percent ?? 0));
      setBids(withMatch);
      if (t.assignedTo) setReviews(await listReviewsForUser(t.assignedTo));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-20 text-ink/60">Loading...</div>;
  if (notFound || !task)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-ink/60">
        Task not found or you don&apos;t have access.{" "}
        <Link href="/tasks" className="font-semibold text-brand">Back to tasks</Link>
      </div>
    );

  const isPoster = user?.uid === task.posterId;
  const isAssigned = user?.uid === task.assignedTo;
  const canBid =
    task.status === "open" &&
    ((task.visibility === "public" && !isPoster) || (task.visibility === "private" && isAdmin));
  const canSelect = (isPoster || isAdmin) && task.status === "open";
  const canManage = (isAssigned || isAdmin) && (task.status === "assigned" || task.status === "in_progress");

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (!user) return;
      await placeBid({
        taskId: id,
        bidderId: user.uid,
        bidderName: user.displayName || user.email || "Tasker",
        amount: Number(amount),
        message,
      });
      setAmount("");
      setMessage("");
      load();
    } catch (err: any) {
      setError(err?.message || "Could not place bid");
    }
  };

  const chooseBid = async (bid: Bid) => {
    if (!bid.id) return;
    await selectBid(id, bid.id, bid.bidderId, bid.bidderName);
    load();
  };

  const updateStatus = async (status: "in_progress" | "completed") => {
    await setTaskStatus(id, status);
    load();
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (!user || !task.assignedTo) return;
      await addReview({
        taskId: id,
        fromId: user.uid,
        fromName: user.displayName || user.email || "User",
        toId: task.assignedTo,
        rating,
        comment,
      });
      setComment("");
      load();
    } catch (err: any) {
      setError(err?.message || "Could not submit review");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/tasks" className="text-sm text-ink/60 hover:text-ink">← Back to tasks</Link>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70">{task.category}</span>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
            {task.status.replace("_", " ")}{task.visibility === "private" ? " · private" : ""}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink">{task.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{task.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="font-semibold text-brand">${task.budget}</span>
          <span className="text-ink/50">{task.location}</span>
          <span className="text-ink/50">Posted by {task.posterName}</span>
        </div>
        {task.assignedName && (
          <p className="mt-2 text-sm text-ink/60">Assigned to <span className="font-semibold">{task.assignedName}</span></p>
        )}
        {task.assignedTo && (isPoster || isAssigned) && (
          <button
            onClick={async () => {
              if (!user || !task.assignedTo || !task.id) return;
              await getOrCreateConversation(task.id, task.posterId, task.assignedTo);
              router.push(`/messages/${task.id}`);
            }}
            className="mt-2 text-sm font-semibold text-brand hover:underline"
          >
            Message tasker →
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Poster / Admin controls */}
      {canSelect && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="text-lg font-bold text-ink">Bids ({bids.length})</h2>
          {bids.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">No bids yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {bids.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl border border-ink/10 p-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{b.bidderName} — ${b.amount}</p>
                    <p className="text-sm text-ink/60">{b.message}</p>
                    <div className="mt-1 flex gap-2">
                      {b.match && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                          Match {b.match.percent}%
                        </span>
                      )}
                      {b.fresh && (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/70">
                          Fresh talent
                        </span>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => chooseBid(b)}>Select</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tasker bid form */}
      {canBid && (
        <form onSubmit={submitBid} className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="text-lg font-bold text-ink">Place a bid</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input type="number" min={1} placeholder="Your price ($)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input placeholder="Short message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button type="submit" className="mt-3">Submit bid</Button>
        </form>
      )}

      {/* Assigned tasker progress */}
      {canManage && (
        <div className="mt-6 flex gap-3">
          {task.status === "assigned" && (
            <Button onClick={() => updateStatus("in_progress")}>Start work</Button>
          )}
          {task.status === "in_progress" && (
            <Button onClick={() => updateStatus("completed")}>Mark completed</Button>
          )}
        </div>
      )}

      {/* Poster review */}
      {isPoster && task.status === "completed" && task.assignedTo && (
        <form onSubmit={submitReview} className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="text-lg font-bold text-ink">Rate the tasker</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-ink/60">Rating</span>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} ★</option>
              ))}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Leave a comment..."
            className="mt-3 w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
          <Button type="submit" className="mt-3">Submit review</Button>
        </form>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="text-lg font-bold text-ink">Reviews</h2>
          <ul className="mt-3 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-ink/10 p-3">
                <p className="text-sm font-semibold text-ink">{r.rating} ★ — {r.fromName}</p>
                <p className="text-sm text-ink/60">{r.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
