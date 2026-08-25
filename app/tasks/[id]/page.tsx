"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Gavel,
  Globe2,
  MapPin,
  MessageSquare,
  Pencil,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  approveAndPay,
  cancelTask,
  claimPrivateTask,
  hasReviewed,
  addReview,
  listReviewsForUser,
  openDispute,
  placeBid,
  requestChanges,
  selectBid,
  startWork,
  submitWork,
  subscribeBidsForTask,
  subscribeTask,
  updateBid,
  withdrawBid,
  PLATFORM_FEE,
  MIN_OFFER,
  TASK_STAGES,
  TASK_STATUS_META,
  stageIndex,
  type Bid,
  type Review,
  type Task,
} from "@/lib/tasks";
import { getPlatformSettings } from "@/lib/admin";
import { getOrCreateConversation } from "@/lib/chat";
import { computeBidMatch, isFreshTalent, type BidMatch } from "@/lib/matching";
import { formatDate, formatPKR, timeAgo } from "@/lib/format";
import Button from "@/components/ui/Button";
import Input, { Field, Textarea } from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Alert, EmptyState, PageLoader } from "@/components/ui/Feedback";

type BidView = Bid & { match?: BidMatch; fresh?: boolean; interviewed?: boolean; avatarUrl?: string; trust?: number };

export default function TaskDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TaskDetail />
    </Suspense>
  );
}

function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const { user, profile, role, staff, isStaff, loading: authLoading } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<BidView[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(!inviteToken);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [action, setAction] = useState("");

  // Offer form
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerDays, setOfferDays] = useState("");
  const [editingOffer, setEditingOffer] = useState(false);

  // Delivery + review forms
  const [deliveryNote, setDeliveryNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [requireVerified, setRequireVerified] = useState(false);

  // Claim a private invitation before anything else.
  useEffect(() => {
    if (!id || authLoading) return;
    let cancelled = false;
    (async () => {
      if (inviteToken) {
        if (!user) {
          router.replace(`/login?redirect=${encodeURIComponent(`/tasks/${id}?invite=${inviteToken}`)}`);
          return;
        }
        if (role !== "freelancer" && !isStaff) {
          setError("This private invitation can only be claimed by a freelancer account.");
          setLoading(false);
          return;
        }
        if (role === "freelancer") {
          try {
            await claimPrivateTask(id, inviteToken, user.uid);
          } catch (caught) {
            setError((caught as Error)?.message || "This invitation has already been claimed or is invalid.");
            setLoading(false);
            return;
          }
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, inviteToken, authLoading, user, role, isStaff, router]);

  // Live task document.
  useEffect(() => {
    if (!id || !ready) return;
    try {
      return subscribeTask(id, (live) => {
        if (!live) setNotFound(true);
        else setTask(live);
        setLoading(false);
      });
    } catch {
      setNotFound(true);
      setLoading(false);
    }
  }, [id, ready]);

  const canSeeBids = !!user && !!task && (user.uid === task.posterId || isStaff);

  // Live offers, enriched with match data.
  useEffect(() => {
    if (!id || !ready || !task) return;
    if (!canSeeBids && role !== "freelancer") return;
    try {
      return subscribeBidsForTask(id, async (raw) => {
        const visible = canSeeBids ? raw : raw.filter((bid) => bid.bidderId === user?.uid);
        const enriched = await Promise.all(
          visible.map(async (bid) => {
            if (!db) return bid as BidView;
            try {
              const snapshot = await getDoc(doc(db, "users", bid.bidderId));
              if (!snapshot.exists()) return bid as BidView;
              const data = snapshot.data();
              return {
                ...bid,
                match: computeBidMatch(task, {
                  trust: data.trustScore ?? 70,
                  success: data.successRate ?? 80,
                  skills: data.skills ?? [],
                }),
                fresh: isFreshTalent(data.createdAt),
                interviewed: data.interviewStatus === "verified",
                avatarUrl: data.avatarUrl || "",
                trust: data.trustScore ?? 70,
              } as BidView;
            } catch {
              return bid as BidView;
            }
          })
        );
        enriched.sort((a, b) => (b.match?.percent ?? 0) - (a.match?.percent ?? 0));
        setBids(enriched);
      });
    } catch {
      setBids([]);
    }
  }, [id, ready, task, canSeeBids, role, user?.uid]);

  useEffect(() => {
    if (task?.assignedTo) listReviewsForUser(task.assignedTo).then(setReviews).catch(() => setReviews([]));
  }, [task?.assignedTo]);

  useEffect(() => {
    if (!user || !id) return;
    hasReviewed(id, user.uid).then(setAlreadyReviewed).catch(() => setAlreadyReviewed(false));
  }, [user, id, task?.status]);

  // Platform gate: interview verification required to bid when the team turns it on.
  useEffect(() => {
    getPlatformSettings()
      .then((settings) => setRequireVerified(!!settings.requireInterviewToBid))
      .catch(() => setRequireVerified(false));
  }, []);

  const myOffer = useMemo(() => bids.find((bid) => bid.bidderId === user?.uid), [bids, user?.uid]);

  useEffect(() => {
    if (myOffer && !editingOffer) {
      setOfferAmount(String(myOffer.amount));
      setOfferMessage(myOffer.message || "");
      setOfferDays(myOffer.deliveryDays ? String(myOffer.deliveryDays) : "");
    }
  }, [myOffer, editingOffer]);

  if (loading || authLoading) return <PageLoader label="Opening task" />;

  if (notFound || !task) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface">
          <EmptyState
            icon={AlertTriangle}
            title="Task not available"
            description={error || "This task may have been removed, or it is private and not shared with your account."}
            action={
              <Link href="/tasks">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4" /> Back to marketplace
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const isPoster = user?.uid === task.posterId;
  const isWorker = user?.uid === task.assignedTo;
  const meta = TASK_STATUS_META[task.status];
  const currentStage = stageIndex(task.status);
  const feeAmount = Math.round((task.heldAmount || task.budget) * PLATFORM_FEE);
  const takeHome = (task.heldAmount || task.budget) - feeAmount;

  const canSendOffer = !!user && !isStaff && role === "freelancer" && task.status === "open" && !isPoster && !myOffer && !profile?.suspended && (!requireVerified || profile?.interviewStatus === "verified");
  const canEditOffer = !!myOffer && myOffer.status === "pending" && task.status === "open" && !isStaff;
  const canHire = (isPoster || isStaff) && task.status === "open" && bids.length > 0;
  const canStart = isWorker && task.status === "assigned";
  const canDeliver = isWorker && (task.status === "in_progress" || task.status === "changes_requested");
  const canReviewDelivery = isPoster && task.status === "submitted";
  const canCancel =
    (isPoster || isWorker || isStaff) &&
    ["open", "assigned", "in_progress", "changes_requested"].includes(task.status);
  const canDispute = (isPoster || isWorker) && ["submitted", "changes_requested", "completed"].includes(task.status) && task.status !== "disputed";
  const canLeaveReview = task.status === "completed" && (isPoster || isWorker) && !alreadyReviewed;

  const run = async (key: string, work: () => Promise<void>, success?: string) => {
    setAction(key);
    setError("");
    setNotice("");
    try {
      await work();
      if (success) setNotice(success);
    } catch (caught) {
      setError((caught as Error)?.message || "That action could not be completed.");
    } finally {
      setAction("");
    }
  };

  const openChat = async () => {
    if (!user || !task.assignedTo || !task.id) return;
    await getOrCreateConversation(task.id, task.posterId, task.assignedTo);
    router.push(`/messages/${task.id}`);
  };

  return (
    <div className="bg-canvas py-6 sm:py-10">
      <div className="page-shell max-w-6xl">
        <Link href="/tasks" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>

        {error && <Alert tone="error" className="mb-4">{error}</Alert>}
        {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {/* -------------------------------------------------- Task header */}
            <section className="surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="bg-ink-50 text-ink-600 border-ink-200">{task.category}</Badge>
                <StatusBadge status={task.status} />
                {task.visibility === "private" && (
                  <Badge tone="bg-ink text-white border-ink">Private</Badge>
                )}
                {task.urgency === "urgent" && (
                  <Badge tone="bg-$danger-50 text-$danger-700 border-$danger-200">
                    <Zap className="h-3 w-3" /> Urgent
                  </Badge>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-ink sm:text-4xl">
                {task.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  {task.remote ? <Globe2 className="h-4 w-4 text-brand" /> : <MapPin className="h-4 w-4 text-brand" />}
                  {task.remote ? "Remote" : task.location || "Flexible"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-4 w-4 text-brand" /> {task.posterName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-brand" /> Posted {timeAgo(task.createdAt)}
                </span>
                {task.deadline && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-brand" /> Due {formatDate(task.deadline)}
                  </span>
                )}
              </div>

              <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-ink-600">{task.description}</p>

              {task.skills && task.skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {task.skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs font-bold text-ink-600">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Lifecycle tracker */}
              {currentStage >= 0 && (
                <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/50 p-5">
                  <div className="flex items-start">
                    {TASK_STAGES.map((stage, index) => {
                      const done = index < currentStage;
                      const active = index === currentStage;
                      return (
                        <div key={stage.key} className="flex flex-1 items-start">
                          <div className="flex flex-1 flex-col items-center text-center">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black transition ${
                                done
                                  ? "bg-brand text-white"
                                  : active
                                    ? "bg-brand text-white ring-4 ring-brand/20"
                                    : "bg-white text-ink-300 ring-1 ring-ink-200"
                              }`}
                            >
                              {done ? <Check className="h-4 w-4" /> : index + 1}
                            </span>
                            <span
                              className={`mt-2 text-[10px] font-black uppercase tracking-wide ${
                                done || active ? "text-brand-dark" : "text-ink-300"
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                          {index < TASK_STAGES.length - 1 && (
                            <span className={`mt-4 h-0.5 flex-1 ${done ? "bg-brand" : "bg-ink-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-center text-xs font-semibold text-ink-500">{meta.hint}</p>
                </div>
              )}

              {task.status === "rejected" && task.rejectionReason && (
                <Alert tone="error" title="This task was not approved" className="mt-6">
                  {task.rejectionReason}
                </Alert>
              )}
              {task.status === "cancelled" && task.cancelReason && (
                <Alert tone="warning" title="Task cancelled" className="mt-6">
                  {task.cancelReason}
                </Alert>
              )}

              {task.assignedName && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
                  <Avatar name={task.assignedName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wide text-ink-400">Hired freelancer</p>
                    <Link href={`/u/${task.assignedTo}`} className="text-sm font-black text-ink hover:text-brand">
                      {task.assignedName}
                    </Link>
                  </div>
                  {(isPoster || isWorker) && (
                    <Button size="sm" variant="ghost" onClick={openChat} className="ml-auto">
                      <MessageSquare className="h-4 w-4" /> Open chat
                    </Button>
                  )}
                </div>
              )}
            </section>

            {/* -------------------------------------------------- Delivery record */}
            {task.workSubmission && (
              <section className="surface p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                  <Send className="h-5 w-5 text-brand" /> Delivery note
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">{task.workSubmission}</p>
                <p className="mt-3 text-xs font-semibold text-ink-400">Submitted {timeAgo(task.workSubmittedAt)}</p>
                {task.revisionNote && task.status === "changes_requested" && (
                  <Alert tone="warning" title="Changes requested by the client" className="mt-4">
                    {task.revisionNote}
                  </Alert>
                )}
              </section>
            )}

            {/* -------------------------------------------------- Offers */}
            {canSeeBids && (
              <section className="surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-ink-100 p-5 sm:p-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Offers received</p>
                    <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">
                      {bids.length} {bids.length === 1 ? "offer" : "offers"}
                    </h2>
                  </div>
                  {bids.length > 1 && (
                    <span className="hidden rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-dark sm:inline">
                      Ranked by fit
                    </span>
                  )}
                </div>

                {bids.length === 0 ? (
                  <EmptyState
                    icon={Gavel}
                    title="No offers yet"
                    description="Well-scoped tasks usually get their first offer within a few hours."
                  />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {bids.map((bid) => (
                      <li key={bid.id} className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-start gap-4">
                          <Avatar name={bid.bidderName} src={bid.avatarUrl} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`/u/${bid.bidderId}`} className="text-sm font-black text-ink hover:text-brand">
                                {bid.bidderName}
                              </Link>
                              {bid.interviewed && (
                                <Badge tone="bg-$success-50 text-$success-700 border-$success-200">
                                  <ShieldCheck className="h-3 w-3" /> Verified
                                </Badge>
                              )}
                              {bid.fresh && (
                                <Badge tone="bg-$info-50 text-$info-700 border-$info-200">
                                  <Sparkles className="h-3 w-3" /> New talent
                                </Badge>
                              )}
                              {bid.status === "selected" && (
                                <Badge tone="bg-brand text-white border-brand">Hired</Badge>
                              )}
                              {bid.status === "withdrawn" && <Badge>Withdrawn</Badge>}
                            </div>
                            {bid.message && <p className="mt-2 text-sm leading-6 text-ink-600">{bid.message}</p>}
                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] font-bold text-ink-400">
                              {typeof bid.match?.percent === "number" && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-brand-dark">
                                  <Zap className="h-3 w-3" /> {bid.match.percent}% fit
                                </span>
                              )}
                              {typeof bid.trust === "number" && <span>Trust score {bid.trust}</span>}
                              {bid.deliveryDays ? <span>Delivers in {bid.deliveryDays} days</span> : null}
                              <span>{timeAgo(bid.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black tracking-[-0.03em] text-ink">{formatPKR(bid.amount)}</p>
                            {canHire && bid.status === "pending" && (
                              <Button
                                size="sm"
                                className="mt-2"
                                loading={action === `hire-${bid.id}`}
                                onClick={() =>
                                  run(
                                    `hire-${bid.id}`,
                                    () => selectBid(task.id!, bid.id!, bid.bidderId, bid.bidderName, bid.amount),
                                    `${bid.bidderName} has been hired.`
                                  )
                                }
                              >
                                Hire · hold {formatPKR(bid.amount)}
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* -------------------------------------------------- Freelancer: send / edit offer */}
            {(canSendOffer || canEditOffer) && (
              <section className="surface p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                  <Gavel className="h-5 w-5 text-brand" /> {myOffer ? "Your offer" : "Send your offer"}
                </h2>
                <p className="mt-1.5 text-sm text-ink-500">
                  Be specific about scope and timing. Clients hire the offer they understand best.
                </p>

                <form
                  className="mt-5 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const amount = Number(offerAmount);
                    if (myOffer) {
                      run(
                        "offer",
                        () => updateBid(myOffer.id!, amount, offerMessage, Number(offerDays) || undefined),
                        "Your offer has been updated."
                      ).then(() => setEditingOffer(false));
                    } else {
                      run(
                        "offer",
                        () =>
                          placeBid({
                            taskId: task.id!,
                            bidderId: user!.uid,
                            bidderName: profile?.name || user!.displayName || user!.email || "Freelancer",
                            amount,
                            message: offerMessage.trim(),
                            deliveryDays: Number(offerDays) || undefined,
                          }),
                        "Your offer has been sent to the client."
                      );
                    }
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your price (PKR)" hint={`Minimum ${formatPKR(MIN_OFFER)}`} required>
                      <Input
                        type="number"
                        min={MIN_OFFER}
                        step={100}
                        value={offerAmount}
                        onChange={(event) => setOfferAmount(event.target.value)}
                        placeholder={String(task.budget)}
                        required
                      />
                    </Field>
                    <Field label="Delivery time (days)" hint="Optional">
                      <Input
                        type="number"
                        min={1}
                        value={offerDays}
                        onChange={(event) => setOfferDays(event.target.value)}
                        placeholder="5"
                      />
                    </Field>
                  </div>

                  <Field label="Why you are the right fit" required>
                    <Textarea
                      rows={4}
                      value={offerMessage}
                      onChange={(event) => setOfferMessage(event.target.value)}
                      placeholder="Explain your approach, similar work you have delivered, and what the client gets."
                      required
                    />
                  </Field>

                  {Number(offerAmount) > 0 && (
                    <div className="rounded-2xl bg-ink-50 p-4 text-sm">
                      <div className="flex justify-between font-semibold text-ink-600">
                        <span>Your offer</span>
                        <span>{formatPKR(Number(offerAmount))}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between font-semibold text-ink-500">
                        <span>Parwaz service fee ({Math.round(PLATFORM_FEE * 100)}%)</span>
                        <span>−{formatPKR(Math.round(Number(offerAmount) * PLATFORM_FEE))}</span>
                      </div>
                      <div className="mt-2.5 flex justify-between border-t border-ink-200 pt-2.5 text-base font-black text-ink">
                        <span>You receive</span>
                        <span>{formatPKR(Number(offerAmount) - Math.round(Number(offerAmount) * PLATFORM_FEE))}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" loading={action === "offer"}>
                      {myOffer ? (
                        <>
                          <Pencil className="h-4 w-4" /> Update offer
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Send offer
                        </>
                      )}
                    </Button>
                    {myOffer && (
                      <Button
                        type="button"
                        variant="ghost"
                        loading={action === "withdraw"}
                        onClick={() => run("withdraw", () => withdrawBid(myOffer.id!), "Your offer was withdrawn.")}
                      >
                        <Trash2 className="h-4 w-4" /> Withdraw
                      </Button>
                    )}
                  </div>
                </form>
              </section>
            )}

            {/* -------------------------------------------------- Freelancer delivery actions */}
            {(canStart || canDeliver) && (
              <section className="surface p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                  <CheckCircle2 className="h-5 w-5 text-brand" /> Your next step
                </h2>
                {canStart && (
                  <>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Confirm you have started so the client can follow progress. {formatPKR(task.heldAmount || 0)} is
                      already held against this contract.
                    </p>
                    <Button
                      className="mt-4"
                      loading={action === "start"}
                      onClick={() => run("start", () => startWork(task.id!), "Work marked as started.")}
                    >
                      Start work
                    </Button>
                  </>
                )}
                {canDeliver && (
                  <form
                    className="mt-4 space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      run("deliver", () => submitWork(task.id!, deliveryNote), "Delivery sent for client review.").then(
                        () => setDeliveryNote("")
                      );
                    }}
                  >
                    <Field label="What did you deliver?" hint="The client sees this when approving payment" required>
                      <Textarea
                        rows={4}
                        value={deliveryNote}
                        onChange={(event) => setDeliveryNote(event.target.value)}
                        placeholder="Summarise the completed work, where the files or results are, and anything the client should check."
                        required
                      />
                    </Field>
                    <Button type="submit" loading={action === "deliver"}>
                      <Send className="h-4 w-4" /> Submit delivery & request payment
                    </Button>
                  </form>
                )}
              </section>
            )}

            {/* -------------------------------------------------- Client review of delivery */}
            {canReviewDelivery && (
              <section className="surface border-brand-200 p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                  <Banknote className="h-5 w-5 text-brand" /> Review the delivery
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Approve to release {formatPKR(task.heldAmount || 0)} ({formatPKR(takeHome)} to the freelancer after the{" "}
                  {Math.round(PLATFORM_FEE * 100)}% service fee), or ask for changes.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="success"
                    loading={action === "approve"}
                    onClick={() => run("approve", () => approveAndPay(task.id!), "Payment released. Thank you!")}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve & release payment
                  </Button>
                </div>

                <form
                  className="mt-5 space-y-3 border-t border-ink-100 pt-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run("changes", () => requestChanges(task.id!, revisionNote), "Change request sent.").then(() =>
                      setRevisionNote("")
                    );
                  }}
                >
                  <Field label="Or request changes" hint="Be specific about what is missing">
                    <Textarea
                      rows={3}
                      value={revisionNote}
                      onChange={(event) => setRevisionNote(event.target.value)}
                      placeholder="The homepage looks great, but the contact form still needs to submit to our email."
                    />
                  </Field>
                  <Button type="submit" variant="ghost" loading={action === "changes"} disabled={!revisionNote.trim()}>
                    Request changes
                  </Button>
                </form>
              </section>
            )}

            {/* -------------------------------------------------- Review */}
            {canLeaveReview && (
              <section className="surface p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                  <Star className="h-5 w-5 text-brand" /> Leave a review
                </h2>
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const toId = isPoster ? task.assignedTo : task.posterId;
                    if (!toId || !user) return;
                    run(
                      "review",
                      () =>
                        addReview({
                          taskId: task.id!,
                          taskTitle: task.title,
                          fromId: user.uid,
                          fromName: profile?.name || user.displayName || "Member",
                          fromRole: isPoster ? "client" : "freelancer",
                          toId,
                          rating,
                          comment: comment.trim(),
                        }),
                      "Thanks — your review has been posted."
                    ).then(() => {
                      setComment("");
                      setAlreadyReviewed(true);
                    });
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value} star${value === 1 ? "" : "s"}`}
                        className="p-1"
                      >
                        <Star
                          className={`h-7 w-7 transition ${
                            value <= rating ? "fill-sun text-sun" : "text-ink-200 hover:text-ink-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-black text-ink">{rating}.0</span>
                  </div>
                  <Field label="Your comment" hint="Optional but very helpful">
                    <Textarea
                      rows={3}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="What went well, and what could be better?"
                    />
                  </Field>
                  <Button type="submit" loading={action === "review"}>
                    Post review
                  </Button>
                </form>
              </section>
            )}

            {reviews.length > 0 && (
              <section className="surface p-6">
                <h2 className="text-lg font-black text-ink">Reviews for {task.assignedName}</h2>
                <ul className="mt-4 space-y-3">
                  {reviews.slice(0, 5).map((review) => (
                    <li key={review.id} className="rounded-2xl border border-ink-100 p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <Star key={index} className="h-3.5 w-3.5 fill-sun text-sun" />
                          ))}
                        </div>
                        <span className="text-sm font-black text-ink">{review.fromName}</span>
                        <span className="ml-auto text-xs text-ink-400">{timeAgo(review.createdAt)}</span>
                      </div>
                      {review.comment && <p className="mt-2 text-sm leading-6 text-ink-500">{review.comment}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* -------------------------------------------------- Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-[90px]">
            <div className="surface p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">
                {task.heldAmount ? "Agreed price" : "Client budget"}
              </p>
              <p className="mt-1.5 text-4xl font-black tracking-[-0.04em] text-ink">
                {formatPKR(task.heldAmount || task.budget)}
              </p>

              {task.heldAmount ? (
                <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
                  <Row label="Held against contract" value={formatPKR(task.heldAmount)} />
                  <Row label={`Service fee (${Math.round(PLATFORM_FEE * 100)}%)`} value={`−${formatPKR(feeAmount)}`} />
                  <Row label="Freelancer receives" value={formatPKR(takeHome)} strong />
                  {task.paymentReleased && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-$success-50 p-3 text-xs font-black text-$success-700">
                      <CheckCircle2 className="h-4 w-4" /> Payment released {timeAgo(task.paidAt)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-ink-500">
                  Funds are held against the contract when the client hires, and released only on approval.
                </p>
              )}

              {!user && task.status === "open" && (
                <div className="mt-5 border-t border-ink-100 pt-5">
                  <p className="text-sm font-bold text-ink">Want to send an offer?</p>
                  <Link href={`/signup?role=freelancer&redirect=/tasks/${task.id}`} className="mt-3 block">
                    <Button fullWidth>Join as a freelancer</Button>
                  </Link>
                  <Link
                    href={`/login?redirect=/tasks/${task.id}`}
                    className="mt-2 block text-center text-xs font-bold text-ink-400 hover:text-ink"
                  >
                    Already a member? Log in
                  </Link>
                </div>
              )}

              {user && role === "client" && !isPoster && task.status === "open" && (
                <Alert tone="info" className="mt-5">
                  You are in client mode. Switch to freelancer in your account menu to send an offer.
                </Alert>
              )}
              {user && requireVerified && role === "freelancer" && profile?.interviewStatus !== "verified" && task.status === "open" && !myOffer && !isPoster && (
                <Alert tone="warning" className="mt-5" title="Interview verification required">
                  This marketplace currently requires a verified Parwaz interview before freelancers can bid.{" "}
                  <Link href="/profile/interview" className="font-black text-brand-dark underline">
                    Take the interview
                  </Link>{" "}
                  — a human reviewer will approve your badge shortly.
                </Alert>
              )}
              {user && isStaff && task.status === "open" && (
                <Alert tone="info" className="mt-5">
                  Staff accounts view offers but do not send them. Offers are for verified freelancers only.
                </Alert>
              )}
            </div>

            <div className="surface p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Task details</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <Row label="Category" value={task.category} />
                <Row label="Location" value={task.remote ? "Remote" : task.location || "Flexible"} />
                <Row label="Offers" value={String(task.bidsCount || 0)} />
                <Row label="Posted" value={formatDate(task.createdAt)} />
                {task.deadline && <Row label="Deadline" value={formatDate(task.deadline)} />}
                {task.revisionCount ? <Row label="Revisions" value={String(task.revisionCount)} /> : null}
              </dl>
            </div>

            {(canCancel || canDispute) && (
              <div className="surface p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Need help?</p>

                {canCancel && (
                  <>
                    {showCancel ? (
                      <form
                        className="mt-3 space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          run(
                            "cancel",
                            () => cancelTask(task.id!, cancelReason, user!.uid),
                            "This task has been cancelled and any held funds returned."
                          ).then(() => setShowCancel(false));
                        }}
                      >
                        <Textarea
                          rows={3}
                          value={cancelReason}
                          onChange={(event) => setCancelReason(event.target.value)}
                          placeholder="Why are you cancelling?"
                          className="text-sm"
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" variant="danger" size="sm" loading={action === "cancel"}>
                            Confirm cancel
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
                            Keep task
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowCancel(true)}
                        className="mt-3 block w-full rounded-xl border border-ink-200 px-3 py-2.5 text-xs font-black text-ink-500 transition hover:border-$danger-200 hover:text-$danger-600"
                      >
                        Cancel this task
                      </button>
                    )}
                  </>
                )}

                {canDispute && (
                  <>
                    {showDispute ? (
                      <form
                        className="mt-3 space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const respondentId = isPoster ? task.assignedTo! : task.posterId;
                          run(
                            "dispute",
                            () =>
                              openDispute({
                                taskId: task.id!,
                                openedBy: user!.uid,
                                openedByName: profile?.name || user!.email || "Member",
                                respondentId,
                                reason: disputeReason,
                              }),
                            "A Parwaz reviewer will look at this contract."
                          ).then(() => setShowDispute(false));
                        }}
                      >
                        <Textarea
                          rows={3}
                          value={disputeReason}
                          onChange={(event) => setDisputeReason(event.target.value)}
                          placeholder="Describe the problem and what outcome you want."
                          className="text-sm"
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" variant="danger" size="sm" loading={action === "dispute"}>
                            Open dispute
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowDispute(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowDispute(true)}
                        className="mt-2 block w-full rounded-xl border border-ink-200 px-3 py-2.5 text-xs font-black text-ink-500 transition hover:border-$warning-200 hover:text-$warning-700"
                      >
                        Raise a dispute
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {isStaff && (
              <div className="rounded-3xl bg-ink p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-300">Staff view</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  You are seeing this task with {staff?.isOwner ? "owner" : "staff"} visibility, including every offer.
                </p>
                <Link href="/admin" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-brand-300">
                  Open control centre
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className={`text-right ${strong ? "text-sm font-black text-ink" : "text-xs font-bold text-ink-600"}`}>{value}</dd>
    </div>
  );
}
