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
  submitWork,
  requestChanges,
  releasePayment,
  cancelTask,
  raiseDispute,
  subscribeTask,
  listRehireCandidates,
  rehireFreelancer,
  PLATFORM_FEE,
  MIN_BID,
  detectSensitiveContent,
  type Task,
  type Bid,
  type Review,
  type RehireCandidate,
} from "@/lib/tasks";
import { getOrCreateConversation } from "@/lib/chat";
import { computeBidMatch, isFreshTalent, type BidMatch } from "@/lib/matching";
import { getDoc, doc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DashboardShell from "@/components/DashboardShell";
import { MapPin, Calendar, User, MessageSquare, CheckCircle2, Clock, Star, Gavel, ShieldCheck, Zap, ArrowLeft, Send, Banknote, Tag, Wallet, AlertTriangle, BriefcaseBusiness, XCircle, Globe, CreditCard, Landmark, X, Lock } from "lucide-react";
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

const isRemoteTask = (loc?: string) => {
  const s = (loc || "").trim().toLowerCase();
  if (!s) return true;
  return ["remote", "online", "anywhere", "virtual", "work from home", "wfh", "from home", "hybrid"].some((k) => s.includes(k));
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const { user, role, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<BidView[]>([]);
  const [myBid, setMyBid] = useState<Bid | null>(null);
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
  const [moderateWarning, setModerateWarning] = useState(false);
  const [moderateReasons, setModerateReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rehireAmounts, setRehireAmounts] = useState<Record<string, string>>({});
  const [rehireBusy, setRehireBusy] = useState<string | null>(null);
  const [rehireError, setRehireError] = useState("");
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [checkoutBid, setCheckoutBid] = useState<BidView | null>(null);
  const [clientWalletBalance, setClientWalletBalance] = useState(0);
  const [fundingBusy, setFundingBusy] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingBusy, setCancellingBusy] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);

  const isAdmin = role === "company_admin" || role === "super_admin";

  const backToList = () => {
    const params = new URLSearchParams();
    const cat = searchParams.get("category");
    const q = searchParams.get("q");
    const view = searchParams.get("view");
    if (cat) params.set("category", cat);
    if (q) params.set("q", q);
    if (view) params.set("view", view);
    const qs = params.toString();
    return `/browse${qs ? `?${qs}` : ""}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const t = await getTask(id);
      if (!t) { setNotFound(true); return; }
      setTask(t);
      if (user && t.posterId === user.uid) {
        try {
          setRehireCandidates(await listRehireCandidates(t.posterId));
          if (db) {
            const uSnap = await getDoc(doc(db, "users", user.uid));
            if (uSnap.exists()) setClientWalletBalance(uSnap.data().wallet ?? 0);
          }
        } catch (rhErr) {
          console.warn("Could not load rehire candidates:", rhErr);
        }
      }
      if (user && role === "tasker" && db) {
        try {
          const myBidSnap = await getDocs(query(
            collection(db, "bids"),
            where("taskId", "==", id),
            where("bidderId", "==", user.uid),
            limit(1)
          ));
          if (!myBidSnap.empty) {
            setMyBid({ id: myBidSnap.docs[0].id, ...myBidSnap.docs[0].data() } as Bid);
          } else {
            setMyBid(null);
          }
        } catch (mbErr) {
          console.warn("Could not check user's existing bid:", mbErr);
        }
      }
      const canReadBids = !!user && (user.uid === t.posterId || isAdmin);
      const rawBids = canReadBids ? await listBidsForTask(id) : [];
      const withMatch = await Promise.all(rawBids.map(async (b) => {
        let match: BidMatch | undefined; let fresh = false;
        if (db) {
          try {
            const s = await getDoc(doc(db, "users", b.bidderId));
            if (s.exists()) {
              const d = s.data();
              match = computeBidMatch(t, { trust: d.trustScore ?? 70, success: d.successRate ?? 80, skills: d.skills ?? [] });
              fresh = isFreshTalent(d.createdAt);
            }
          } catch (userErr) {
            console.warn("Could not read bidder profile details:", userErr);
          }
        }
        return { ...b, match, fresh };
      }));
      withMatch.sort((a, b) => (b.match?.percent ?? 0) - (a.match?.percent ?? 0));
      setBids(withMatch);
      if (t.assignedTo) {
        try {
          setReviews(await listReviewsForUser(t.assignedTo));
        } catch (revErr) {
          console.warn("Could not load reviews:", revErr);
        }
      }
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
    return subscribeTask(
      id,
      (liveTask) => {
        if (!liveTask) setNotFound(true);
        else setTask(liveTask);
      },
      (err) => {
        console.warn("Realtime task subscription error:", err);
      }
    );
  }, [id, inviteReady]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (notFound || !task) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-500"><p>{error || "Task not found."}</p> <Link href={backToList()} className="font-semibold text-brand">Back to tasks</Link></div>;

  const isPoster = user?.uid === task.posterId;
  const isAssigned = user?.uid === task.assignedTo;
  const canBid = !!user && role === "tasker" && task.status === "open"
    && (task.visibility === "public" || (task.visibility === "private" && inviteReady))
    && !isPoster
    && !myBid;
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
  const offerTooLow = offerPrice > 0 && offerPrice < MIN_BID;
  const offerAboveBudget = offerPrice > 0 && offerPrice > task.budget;
  const isLockedFromMessaging = !isPoster && !isAssigned;

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning(false);
    setModerateWarning(false);
    if (!Number.isFinite(offerPrice) || offerPrice < MIN_BID) {
      setError(`Your offer must be at least ${formatPKR(MIN_BID)}.`);
      return;
    }
    if (offerPrice > task.budget) {
      setWarning(true);
      return;
    }
    const reasons = detectSensitiveContent(message);
    if (reasons.length > 0) {
      setModerateReasons(reasons);
      setModerateWarning(true);
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

  const confirmModeratedSubmit = async () => {
    setModerateWarning(false);
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
      const reasons = detectSensitiveContent(message);
      if (reasons.length > 0) { setModerateReasons(reasons); setModerateWarning(true); setWarning(false); setSubmitting(false); return; }
      await placeBid({ taskId: id, bidderId: user.uid, bidderName: user.displayName || user.email || "Freelancer", amount: offerPrice, message: message.trim() });
      setAmount(""); setMessage(""); setWarning(false); load();
    } catch (err: any) { setError(err?.message || "Could not place your offer"); }
    finally { setSubmitting(false); }
  };

  const chooseBid = (bid: BidView) => {
    setError("");
    setCheckoutBid(bid);
  };

  const handleSafepayFund = async (isSandboxDirect: boolean = false) => {
    if (!checkoutBid || !checkoutBid.id || !user) return;
    setFundingBusy(true);
    setError("");
    try {
      if (isSandboxDirect) {
        const res = await fetch("/api/payments/simulate-sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: id,
            bidId: checkoutBid.id,
            bidderId: checkoutBid.bidderId,
            bidderName: checkoutBid.bidderName,
            amount: checkoutBid.amount,
            posterId: user.uid,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error || "Payment simulation failed.");
        }
        setCheckoutBid(null);
        load();
      } else {
        const res = await fetch("/api/payments/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: id,
            bidId: checkoutBid.id,
            bidderId: checkoutBid.bidderId,
            bidderName: checkoutBid.bidderName,
            amount: checkoutBid.amount,
            clientEmail: user.email,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to initialize Safepay checkout.");
        }
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fund contract escrow.");
    } finally {
      setFundingBusy(false);
    }
  };

  const handleWalletFund = async () => {
    if (!checkoutBid || !checkoutBid.id) return;
    setFundingBusy(true);
    setError("");
    try {
      await selectBid(id, checkoutBid.id, checkoutBid.bidderId, checkoutBid.bidderName, checkoutBid.amount);
      setCheckoutBid(null);
      load();
    } catch (err: any) {
      setError(err?.message || "Could not fund contract via wallet balance.");
    } finally {
      setFundingBusy(false);
    }
  };

  const updateStatus = async (status: "in_progress" | "completed") => { await setTaskStatus(id, status); load(); };
  const relPayment = async () => { try { await releasePayment(id); load(); } catch (err: any) { setError(err?.message || "Could not release payment"); } };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionNotes.trim()) return;
    setSubmittingWork(true);
    setError("");
    try {
      await submitWork(id, submissionNotes, deliverableUrl);
      setSubmissionOpen(false);
      setSubmissionNotes("");
      setDeliverableUrl("");
      load();
    } catch (err: any) {
      setError(err?.message || "Could not submit work");
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;
    setSubmittingRevision(true);
    setError("");
    try {
      await requestChanges(id, revisionNotes);
      setRevisionOpen(false);
      setRevisionNotes("");
      load();
    } catch (err: any) {
      setError(err?.message || "Could not request revisions");
    } finally {
      setSubmittingRevision(false);
    }
  };
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

  const handleCancelTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancellingBusy(true);
    setError("");
    try {
      await cancelTask(id, cancelReason || "Cancelled by client", user?.uid);
      setCancelModalOpen(false);
      setCancelReason("");
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to cancel task");
    } finally {
      setCancellingBusy(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim() || !disputeDescription.trim() || !user) return;
    setDisputeBusy(true);
    setError("");
    try {
      await raiseDispute({
        taskId: id,
        raisedBy: user.uid,
        raisedByName: user.displayName || user.email || "User",
        reason: disputeReason.trim(),
        description: disputeDescription.trim(),
      });
      setDisputeModalOpen(false);
      setDisputeReason("");
      setDisputeDescription("");
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to submit dispute");
    } finally {
      setDisputeBusy(false);
    }
  };

  const page = (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href={backToList()} className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 transition hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to Tasks</Link>

      {task.status === "cancelled" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">This task has been cancelled</p>
            <p className="mt-1 text-sm">
              {task.cancelReason ? `Reason: ${task.cancelReason}` : "No offers can be submitted or selected for this task anymore."}
            </p>
          </div>
        </div>
      )}

      {task.hasDispute && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-black">Dispute Resolution Active</p>
            <p className="mt-1 text-sm">
              A formal dispute has been raised on this contract. Workly Support is currently investigating the project records to ensure fair resolution.
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============ LEFT COLUMN ============ */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-sm font-medium text-ink-600"><Tag className="h-3.5 w-3.5" /> {task.category}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}{task.visibility === "private" ? " - Private" : ""}</span>
              </div>
              {((isPoster || isAdmin) && task.status === "open") && (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="rounded-xl border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  Cancel Task
                </button>
              )}
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink sm:text-3xl">{task.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-600">{task.description}</p>

            {/* Key details */}
            <dl className="mt-6 grid gap-x-6 gap-y-4 rounded-2xl border border-ink-100 bg-canvas p-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><User className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Client</dt>
                  <dd className="truncate text-sm font-bold text-ink">{task.posterName}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><MapPin className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Location</dt>
                  <dd className="truncate text-sm font-bold text-ink">{task.location || "Remote"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Globe className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Work Mode</dt>
                  <dd className="text-sm font-bold text-ink">{isRemoteTask(task.location) ? "Remote" : "Onsite"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Clock className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Deadline / To be done on</dt>
                  <dd className="text-sm font-bold text-ink">{task.deadline ? formatDate(task.deadline) : "Flexible (Anytime)"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Banknote className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Budget</dt>
                  <dd className="text-sm font-bold text-ink">{formatPKR(task.budget)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Gavel className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Offers</dt>
                  <dd className="text-sm font-bold text-ink">{task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}</dd>
                </div>
              </div>
            </dl>

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
                      <p className={`mt-1 text-[11px] font-semibold ${isActive ? "text-brand" : "text-ink-400"}`}>{labels[i]}</p>
                    </div>
                    {i < 3 && <div className={`h-0.5 flex-1 ${isActive && stageIdx > i ? "bg-brand" : "bg-ink-100"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Platform Safety Guarantee Banner */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 text-xs">
              <ShieldCheck className="h-5 w-5 shrink-0 text-brand" />
              <div className="text-ink-600">
                <p className="font-extrabold text-ink">Workly Safepay Escrow &amp; Buyer Protection</p>
                <p className="mt-0.5 leading-relaxed">
                  Project payments are held securely in protected digital escrow upon hire and only disbursed when you approve the finished work. Keeping messaging on-platform guarantees full mediation &amp; fraud protection.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <span className="rounded-lg bg-brand-50 px-3 py-2 font-black text-brand-dark">{formatPKR(task.heldAmount ?? task.budget)}</span>
              <span className="flex items-center gap-1.5 text-ink-500"><Calendar className="h-4 w-4" />Posted {formatDate(task.createdAt)}</span>
              {task.deadline && <span className="flex items-center gap-1.5 text-ink-500"><Clock className="h-4 w-4" />Due: {formatDate(task.deadline)}</span>}
              {!task.deadline && <span className="flex items-center gap-1.5 text-ink-500"><Clock className="h-4 w-4" />Due: Flexible (Anytime)</span>}
              {task.heldAmount && <span className="flex items-center gap-1.5 text-ink-500"><Banknote className="h-4 w-4" />{formatPKR(task.heldAmount)} held</span>}
              {paymentDone && <span className="flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle2 className="h-4 w-4" />Paid</span>}
            </div>

            {task.assignedName && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Assigned freelancer: <Link href={`/u/${task.assignedTo}`} className="font-extrabold text-ink hover:text-brand">{task.assignedName}</Link></span>
                {task.visibility === "private" && <span className="ml-auto rounded-full bg-[#00501F] px-2.5 py-1 text-[11px] font-black uppercase text-white">Managed private</span>}
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
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-4 transition hover:border-brand/30">
                    <div className="min-w-0 flex-1">
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
              <div className="flex flex-wrap items-center gap-3">
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
                      <Button onClick={() => rehire(candidate)} disabled={rehireBusy === candidate.taskerId} className="min-h-10 px-4 text-sm">{rehireBusy === candidate.taskerId ? "Sending..." : "Make an Offer"}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Requested Revisions Banner (Shown to Freelancer) */}
          {isAssigned && task.status === "in_progress" && task.revisionNotes && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-900">Client Requested Revisions</h3>
                  <p className="mt-1 text-sm text-amber-800 whitespace-pre-wrap">{task.revisionNotes}</p>
                  <p className="mt-2 text-xs text-amber-600">Please make the requested updates and re-submit your deliverables.</p>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Freelancer Progress Controls */}
          {canManage && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card space-y-4">
              <h3 className="text-base font-bold text-ink">Contract Milestone Controls</h3>
              <div className="flex flex-wrap gap-3">
                {task.status === "assigned" && (
                  <Button onClick={() => updateStatus("in_progress")} className="rounded-xl flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Start Working
                  </Button>
                )}
                {(task.status === "in_progress" || (task.status === "completed" && !task.paymentRequested)) && !submissionOpen && (
                  <Button onClick={() => setSubmissionOpen(true)} className="rounded-xl flex items-center gap-1.5 bg-brand text-white hover:bg-brand-700">
                    <CheckCircle2 className="h-4 w-4" /> Submit Work Deliverables
                  </Button>
                )}
              </div>

              {/* Work Submission Form */}
              {submissionOpen && (
                <form onSubmit={handleWorkSubmit} className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 p-5 space-y-3">
                  <h4 className="text-sm font-bold text-brand-dark">Submit Deliverables & Request Payment</h4>
                  <p className="text-xs text-ink-500">Provide an overview of the work completed and any links to files, documents, or deliverables.</p>
                  
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Deliverables & Summary Notes *</label>
                    <textarea
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      rows={3}
                      placeholder="Describe what was completed, instructions, or notes for the client..."
                      className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Deliverable Link (Google Drive, Figma, GitHub, etc.)</label>
                    <Input
                      type="url"
                      value={deliverableUrl}
                      onChange={(e) => setDeliverableUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://..."
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button type="submit" disabled={submittingWork} className="rounded-xl bg-brand text-white">
                      {submittingWork ? "Submitting..." : `Submit & Request ${formatPKR(task.heldAmount || 0)}`}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setSubmissionOpen(false)}
                      className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Deliverables Review Box (Shown when work is submitted) */}
          {task.workSubmission && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 shadow-card space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold">Submitted Deliverables</h3>
              </div>
              <div className="rounded-xl bg-white border border-blue-100 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Freelancer Notes</p>
                <p className="text-sm text-ink-700 whitespace-pre-wrap">{task.workSubmission.notes}</p>
                {task.workSubmission.url && (
                  <div className="pt-2">
                    <a
                      href={task.workSubmission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                    >
                      🔗 Open Deliverables Link
                    </a>
                  </div>
                )}
                {task.workSubmission.submittedAt && (
                  <p className="text-[11px] text-ink-400 pt-1">
                    Submitted on: {new Date(task.workSubmission.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Release Payment / Request Revisions - Poster */}
          {canReleasePayment && (
            <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-ink">Client Review & Payment Decision</h2>
                  <p className="text-sm text-ink-500">
                    {task.assignedName} has submitted deliverables for {formatPKR(task.heldAmount)}
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Platform fee ({PLATFORM_FEE * 100}%): {formatPKR(fee)} · Freelancer receives {formatPKR(task.heldAmount ? task.heldAmount - fee : 0)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={relPayment} className="rounded-xl flex items-center gap-1.5 bg-brand text-white hover:bg-brand-700">
                  <CheckCircle2 className="h-4 w-4" /> Approve & Release {formatPKR(task.heldAmount)}
                </Button>
                {!revisionOpen && (
                  <button
                    type="button"
                    onClick={() => setRevisionOpen(true)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                  >
                    Request Changes / Revisions
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(true)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  Raise Dispute
                </button>
              </div>

              {revisionOpen && (
                <form onSubmit={handleRequestRevision} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900">What changes do you need from the freelancer?</h4>
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={3}
                    placeholder="Specify clearly what needs to be changed or corrected..."
                    className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={submittingRevision} className="rounded-xl bg-amber-600 text-white hover:bg-amber-700">
                      {submittingRevision ? "Sending..." : "Send Revision Request"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setRevisionOpen(false)}
                      className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Safety & Contract Resolution Actions */}
          {(isPoster || isAssigned || isAdmin) && ["assigned", "in_progress"].includes(task.status) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card text-xs">
              <div className="flex items-center gap-2.5 text-ink-600">
                <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
                <span>
                  <strong>Escrow Protected:</strong> {formatPKR(task.heldAmount || 0)} is held safely until deliverables are approved.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {(isPoster || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    Cancel & Refund Escrow
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(true)}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-1.5 font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  Raise Dispute
                </button>
              </div>
            </div>
          )}

          {/* Payment Complete */}
          {paymentDone && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
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
          {myBid && (
            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-card">
              <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span>Offer Submitted</span>
              </div>
              <p className="mt-2 text-3xl font-black text-ink">{formatPKR(myBid.amount)}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-800 capitalize">
                Status: {myBid.status || "pending"}
              </div>
              {myBid.message && (
                <div className="mt-4 rounded-xl border border-ink-100 bg-canvas p-3.5 text-sm text-ink-700">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400 mb-1">Your Proposal</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{myBid.message}</p>
                </div>
              )}
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-xs leading-5 text-ink-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>You have submitted an offer for this task. You will receive a notification when the client reviews your proposal.</span>
              </div>
            </div>
          )}

          {canBid ? (
            <form onSubmit={submitBid} className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-black text-ink"><BriefcaseBusiness className="h-5 w-5 text-brand" /> Make an Offer</h2>
              <p className="mt-1 text-xs font-medium text-ink-400">{task.visibility === "private" ? "Private invitation" : "Open"} task · Client&apos;s listed price: <span className="font-extrabold text-ink">{formatPKR(task.budget)}</span></p>

              <div className="mt-4">
                <label htmlFor="offer-amount" className="mb-1.5 block text-sm font-semibold text-ink">Your Offer</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">PKR</span>
                  <Input
                    id="offer-amount"
                    type="number"
                    min={MIN_BID}
                    step={100}
                    placeholder={String(MIN_BID)}
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setWarning(false); }}
                    required
                    className={`pl-14 ${offerTooLow ? "border-red-300 focus:border-red-400 focus:ring-red-400/15" : ""}`}
                  />
                </div>
                {offerTooLow && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Your offer must be at least {formatPKR(MIN_BID)}.
                  </p>
                )}
                {!offerTooLow && offerAboveBudget && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Your offer is higher than the client&apos;s listed budget.
                  </p>
                )}
              </div>
              <div className="mt-3">
                <label htmlFor="offer-proposal" className="mb-1.5 block text-sm font-semibold text-ink">Proposal</label>
                <textarea id="offer-proposal" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell the client why you are the right fit for this task and how you will deliver..." className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>

              {offerPrice > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-sm">
                  <div className="flex items-center justify-between"><span className="font-semibold text-ink-500">Your Offer</span><span className="font-black text-ink">{formatPKR(offerPrice)}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1 font-semibold text-ink-500"><Wallet className="h-3.5 w-3.5" /> Platform Deduction</span><span className="font-black text-ink">{formatPKR(offerFee)} ({PLATFORM_FEE * 100}%)</span></div>
                  <div className="flex items-center justify-between border-t border-brand-100 pt-2"><span className="font-bold text-brand-dark">You Will Receive</span><span className="font-black text-brand-dark">{formatPKR(youReceive)}</span></div>
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

              {moderateWarning && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Your proposal contains sensitive content (<span className="font-bold">{moderateReasons.join(", ")}</span>) and will be <span className="font-bold">flagged for moderation</span>. Please remove any personal contact details, links or external references before submitting.</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setModerateWarning(false)} className="flex-1 rounded-xl border border-red-300 px-3 py-2.5 text-sm font-bold transition hover:bg-red-100">Edit proposal</button>
                    <button type="button" onClick={confirmModeratedSubmit} disabled={submitting} className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">{submitting ? "Submitting..." : "Submit anyway"}</button>
                  </div>
                </div>
              )}

              {error && <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

              <Button type="submit" disabled={submitting || warning} className="mt-4 w-full gap-2">{submitting ? "Submitting offer..." : "Submit Offer"}</Button>
            </form>
          ) : isLockedFromMessaging && task.status === "open" && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
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

          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">About this task</p>
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

      {/* Safepay Escrow Funding Modal */}
      {checkoutBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-ink">Fund Contract Escrow</h3>
                  <p className="text-xs text-ink-500">Regulated Escrow via Safepay</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutBid(null)}
                className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-ink-100 bg-canvas p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-500">Selected Freelancer</span>
                  <span className="font-bold text-ink">{checkoutBid.bidderName}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-500">Contract Total</span>
                  <span className="text-xl font-black text-brand">{formatPKR(checkoutBid.amount)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-xs leading-5 text-brand-dark">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                  <p>
                    <strong>100% Escrow Protection:</strong> Funds are safely secured in Workly Escrow. They are only released to {checkoutBid.bidderName} once you inspect and approve their completed deliverables.
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => handleSafepayFund(false)}
                  disabled={fundingBusy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-forest hover:bg-brand-700"
                >
                  <CreditCard className="h-4 w-4" />
                  {fundingBusy ? "Connecting to Safepay..." : `Pay ${formatPKR(checkoutBid.amount)} via Safepay (Cards / Wallets)`}
                </Button>

                {clientWalletBalance >= checkoutBid.amount && (
                  <button
                    onClick={handleWalletFund}
                    disabled={fundingBusy}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white py-3 text-sm font-bold text-brand-dark hover:bg-brand-50 transition"
                  >
                    <Wallet className="h-4 w-4 text-brand" />
                    Pay from Workly Wallet ({formatPKR(clientWalletBalance)} available)
                  </button>
                )}

                <div className="border-t border-ink-100 pt-3">
                  <button
                    onClick={() => handleSafepayFund(true)}
                    disabled={fundingBusy}
                    className="w-full text-center text-xs font-bold text-brand/80 hover:text-brand hover:underline"
                  >
                    ⚡ Fast Sandbox Test: Simulate Instant Escrow Hold
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task / Contract Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-ink">
                    {task.status === "open" ? "Cancel Task" : "Cancel Contract & Refund"}
                  </h3>
                  <p className="text-xs text-ink-500">Contract lifecycle action</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCancelTask} className="mt-5 space-y-4">
              {task.heldAmount && task.heldAmount > 0 && !task.paymentReleased ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-xs leading-5 text-green-800">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-700 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Automatic Escrow Refund:</strong>
                      {formatPKR(task.heldAmount)} currently held in escrow will be immediately credited back to the client&apos;s Workly Wallet.
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-600">
                  Are you sure you want to cancel this task? It will be closed and removed from active marketplace listings.
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., Job no longer needed, scope changed, unresponsive freelancer..."
                  className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={cancellingBusy}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {cancellingBusy ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-600 hover:bg-ink-50"
                >
                  Keep Active
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-ink">Raise a Formal Dispute</h3>
                  <p className="text-xs text-ink-500">Escalate to Workly Resolution Support</p>
                </div>
              </div>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseDispute} className="mt-5 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-5 text-amber-800">
                <p>
                  Workly mediates disputes fairly. Escrow funds remain securely frozen while our support team reviews conversation logs, deliverables, and revision requests.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Primary Issue / Reason *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-amber-500 focus:outline-none"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Deliverables do not match agreement">Deliverables do not match agreement</option>
                  <option value="Freelancer unresponsive / Missed deadline">Freelancer unresponsive / Missed deadline</option>
                  <option value="Client unresponsive / Unreasonable demands">Client unresponsive / Unreasonable demands</option>
                  <option value="Quality below professional standards">Quality below professional standards</option>
                  <option value="Payment / Amount disagreement">Payment / Amount disagreement</option>
                  <option value="Other">Other conflict</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Explain What Happened in Detail *
                </label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide detailed facts and context to help support arbitrate..."
                  className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={disputeBusy}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {disputeBusy ? "Filing Dispute..." : "Submit Dispute to Support"}
                </Button>
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return role === "tasker" ? <DashboardShell>{page}</DashboardShell> : page;
}