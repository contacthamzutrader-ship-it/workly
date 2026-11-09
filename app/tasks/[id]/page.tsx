"use client";

import { useEffect, useState, useRef } from "react";
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
  type BidAttachment,
} from "@/lib/tasks";
import { getOrCreateConversation } from "@/lib/chat";
import { computeBidMatch, isFreshTalent, type BidMatch } from "@/lib/matching";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DashboardShell from "@/components/DashboardShell";
import {
  MapPin,
  Calendar,
  User,
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  Gavel,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowLeft,
  Send,
  Banknote,
  Tag,
  Wallet,
  AlertTriangle,
  BriefcaseBusiness,
  XCircle,
  Globe,
  Paperclip,
  FileText,
  Trash2,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { formatDate, formatPKR } from "@/lib/format";
import { scanTextForContacts, scanFileForContacts } from "@/lib/contactShield";
import { detectFileType, formatFileSize, readFileAsDataUrl } from "@/lib/fileHelper";

type BidView = Bid & { match?: BidMatch; fresh?: boolean };

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "bg-amber-50 text-amber-700 border-amber-200" },
  open: { label: "Available", color: "bg-brand-50 text-brand-dark border-brand-200" },
  assigned: { label: "Already Assigned", color: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", color: "bg-brand-50 text-brand-700 border-brand-200" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
};

const isRemoteTask = (loc?: string) => {
  const s = (loc || "").trim().toLowerCase();
  if (!s) return true;
  return ["remote", "online", "anywhere", "virtual", "work from home", "wfh", "from home", "hybrid"].some((k) =>
    s.includes(k)
  );
};

interface AttachedFileView extends BidAttachment {
  isScanning?: boolean;
  violations?: string[];
}

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
  const [attachments, setAttachments] = useState<AttachedFileView[]>([]);
  const [fileScanning, setFileScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (!t) {
        setNotFound(true);
        return;
      }
      setTask(t);
      if (user && t.posterId === user.uid) setRehireCandidates(await listRehireCandidates(t.posterId));
      const canReadBids = !!user && (user.uid === t.posterId || isAdmin);
      const rawBids = canReadBids ? await listBidsForTask(id) : [];
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
    } catch (err: any) {
      setError(err?.message || "This task is not available to this account.");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, inviteToken, authLoading, user?.uid, role]);

  useEffect(() => {
    if (!id || !inviteReady) return;
    return subscribeTask(id, (liveTask) => {
      if (!liveTask) setNotFound(true);
      else setTask(liveTask);
    });
  }, [id, inviteReady]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  if (notFound || !task)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-500">
        <p>{error || "Task not found."}</p>{" "}
        <Link href={backToList()} className="font-semibold text-brand">
          Back to tasks
        </Link>
      </div>
    );

  const isPoster = user?.uid === task.posterId;
  const isAssigned = user?.uid === task.assignedTo;
  const canBid =
    !!user &&
    role === "tasker" &&
    task.status === "open" &&
    (task.visibility === "public" || (task.visibility === "private" && inviteReady)) &&
    !isPoster;
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

  // Real-time Contact Shield Guardrail checks
  const textShieldScan = scanTextForContacts(message);
  const fileViolations = attachments.flatMap((a) => a.violations || []);
  const allViolations = [
    ...textShieldScan.violations.map((v) => v.label),
    ...fileViolations,
  ];
  const isBlockedByShield = allViolations.length > 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileScanning(true);
    const newItems: AttachedFileView[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await readFileAsDataUrl(file);
        const scan = await scanFileForContacts(file);
        const fileType = detectFileType(file);

        newItems.push({
          name: file.name,
          url,
          type: fileType,
          size: file.size,
          violations: scan.isBlocked ? scan.violations.map((v) => `${v.label} in ${file.name}`) : [],
        });
      } catch {
        // File reading failed
      }
    }

    setAttachments((prev) => [...prev, ...newItems]);
    setFileScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning(false);

    if (!Number.isFinite(offerPrice) || offerPrice < MIN_BID) {
      setError(`Your offer must be at least ${formatPKR(MIN_BID)}.`);
      return;
    }

    if (offerPrice > task.budget) {
      setWarning(true);
      return;
    }

    // STRICT GUARDRAIL ENFORCEMENT: Never send if off-platform details exist!
    if (isBlockedByShield) {
      setError(
        "Proposal blocked: Your proposal or attached files contain personal contact details (phone, WhatsApp, email, or off-platform payment attempts). Remove them to submit your offer."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (!user) return;
      await placeBid({
        taskId: id,
        bidderId: user.uid,
        bidderName: user.displayName || user.email || "Freelancer",
        amount: offerPrice,
        message: message.trim(),
        attachments: attachments.map(({ name, url, type, size }) => ({ name, url, type, size })),
      });
      setAmount("");
      setMessage("");
      setAttachments([]);
      load();
    } catch (err: any) {
      setError(err?.message || "Could not place your offer");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmHighOffer = async () => {
    if (isBlockedByShield) {
      setError("Proposal blocked: Remove personal contact details before submitting.");
      setWarning(false);
      return;
    }

    setSubmitting(true);
    try {
      if (!user) return;
      await placeBid({
        taskId: id,
        bidderId: user.uid,
        bidderName: user.displayName || user.email || "Freelancer",
        amount: offerPrice,
        message: message.trim(),
        attachments: attachments.map(({ name, url, type, size }) => ({ name, url, type, size })),
      });
      setAmount("");
      setMessage("");
      setAttachments([]);
      setWarning(false);
      load();
    } catch (err: any) {
      setError(err?.message || "Could not place your offer");
    } finally {
      setSubmitting(false);
    }
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

  const updateStatus = async (status: "in_progress" | "completed") => {
    await setTaskStatus(id, status);
    load();
  };

  const reqPayment = async () => {
    try {
      await requestPayment(id);
      load();
    } catch (err: any) {
      setError(err?.message || "Could not request payment");
    }
  };

  const relPayment = async () => {
    try {
      await releasePayment(id);
      load();
    } catch (err: any) {
      setError(err?.message || "Could not release payment");
    }
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

  const rehire = async (candidate: RehireCandidate) => {
    setRehireError("");
    const rOffer = Number(rehireAmounts[candidate.taskerId] || "");
    if (!Number.isFinite(rOffer) || rOffer < MIN_BID) {
      setRehireError(`Your offer must be at least ${MIN_BID.toLocaleString("en-PK")}.`);
      return;
    }
    setRehireBusy(candidate.taskerId);
    try {
      await rehireFreelancer(id, candidate.taskerId, candidate.taskerName, rOffer);
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

  // Reusable Task Details Card (Requested on the RIGHT side)
  const taskDetailsCard = (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-sm font-medium text-ink-600">
          <Tag className="h-3.5 w-3.5" /> {task.category}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.color}`}>
          {statusInfo.label}
          {task.visibility === "private" ? " - Private" : ""}
        </span>
      </div>
      <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink sm:text-3xl">{task.title}</h1>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-600">{task.description}</p>

      {/* Key details */}
      <dl className="mt-6 grid gap-x-6 gap-y-4 rounded-2xl border border-ink-100 bg-canvas p-5 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Client</dt>
            <dd className="truncate text-sm font-bold text-ink">{task.posterName}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Location</dt>
            <dd className="truncate text-sm font-bold text-ink">{task.location || "Remote"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <Globe className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Work Mode</dt>
            <dd className="text-sm font-bold text-ink">{isRemoteTask(task.location) ? "Remote" : "Onsite"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <Clock className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Deadline / To be done on</dt>
            <dd className="text-sm font-bold text-ink">{task.deadline ? formatDate(task.deadline) : "Flexible (Anytime)"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <Banknote className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Budget</dt>
            <dd className="text-sm font-bold text-ink">{formatPKR(task.budget)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <Gavel className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">Offers</dt>
            <dd className="text-sm font-bold text-ink">
              {task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}
            </dd>
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
              <div className="flex-1 text-center">
                <div
                  className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    isActive ? "bg-brand text-white" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {isActive && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <p className={`mt-1 text-[11px] font-semibold ${isActive ? "text-brand" : "text-ink-400"}`}>{labels[i]}</p>
              </div>
              {i < 3 && <div className={`h-0.5 flex-1 ${isActive && stageIdx > i ? "bg-brand" : "bg-ink-100"}`} />}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
        <span className="rounded-lg bg-brand-50 px-3 py-2 font-black text-brand-dark">
          {formatPKR(task.heldAmount ?? task.budget)}
        </span>
        <span className="flex items-center gap-1.5 text-ink-500">
          <Calendar className="h-4 w-4" /> Posted {formatDate(task.createdAt)}
        </span>
        {task.deadline ? (
          <span className="flex items-center gap-1.5 text-ink-500">
            <Clock className="h-4 w-4" /> Due: {formatDate(task.deadline)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-ink-500">
            <Clock className="h-4 w-4" /> Due: Flexible (Anytime)
          </span>
        )}
        {task.heldAmount && (
          <span className="flex items-center gap-1.5 text-ink-500">
            <Banknote className="h-4 w-4" /> {formatPKR(task.heldAmount)} held
          </span>
        )}
        {paymentDone && (
          <span className="flex items-center gap-1.5 font-semibold text-brand-600">
            <CheckCircle2 className="h-4 w-4" /> Paid
          </span>
        )}
      </div>

      {task.assignedName && (
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            Assigned freelancer:{" "}
            <Link href={`/u/${task.assignedTo}`} className="font-extrabold text-ink hover:text-brand">
              {task.assignedName}
            </Link>
          </span>
          {task.visibility === "private" && (
            <span className="ml-auto rounded-full bg-forest px-2.5 py-1 text-[11px] font-black uppercase text-white">
              Managed private
            </span>
          )}
        </div>
      )}

      {/* Messaging permission */}
      {isPoster || isAssigned ? (
        task.assignedTo && (
          <button onClick={startChat} className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            <MessageSquare className="h-4 w-4" /> Open chat
          </button>
        )
      ) : (
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-3.5 text-sm leading-6 text-ink-500">
          {task.assignedTo ? (
            <>
              <MessageSquare className="mr-1.5 inline h-4 w-4 text-ink-300" /> Messaging with this client is only available to the freelancer assigned to this task ({task.assignedName}).
            </>
          ) : (
            <>
              <MessageSquare className="mr-1.5 inline h-4 w-4 text-ink-300" /> Messaging with this client will become available once your offer is selected and you are assigned this task.
            </>
          )}
        </div>
      )}
    </div>
  );

  // About this task card
  const aboutThisTaskCard = (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">About this task</p>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-500">Status</span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-500">Offers received</span>
          <span className="font-black text-ink">
            {task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-500">Client price</span>
          <span className="font-black text-ink">{formatPKR(task.budget)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-500">To Be Done On</span>
          <span className="font-bold text-ink">{task.deadline ? formatDate(task.deadline) : "Flexible (Anytime)"}</span>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-canvas p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-xs leading-5 text-ink-500">
          Offers and payments are protected. You only pay a {PLATFORM_FEE * 100}% account deduction when a task is completed.
        </p>
      </div>
    </div>
  );

  const page = (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href={backToList()} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Tasks
      </Link>

      {task.status === "cancelled" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">This task has been cancelled</p>
            <p className="mt-1 text-sm">No offers can be submitted or selected for this task anymore.</p>
          </div>
        </div>
      )}

      {/* SWAPPED LAYOUT: Large Proposal & Form on the LEFT; Task details on the RIGHT */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_420px]">
        {/* ============ LEFT COLUMN (SPACIOUS OFFER WORKSPACE) ============ */}
        <div className="min-w-0 space-y-6">
          {canBid ? (
            <form onSubmit={submitBid} className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-5">
                <div>
                  <h2 className="flex items-center gap-2.5 text-xl font-black text-ink">
                    <BriefcaseBusiness className="h-6 w-6 text-brand" /> Make an Offer &amp; Proposal
                  </h2>
                  <p className="mt-1 text-xs font-medium text-ink-400">
                    {task.visibility === "private" ? "Private invitation" : "Open"} task · Client&apos;s listed price:{" "}
                    <span className="font-extrabold text-ink">{formatPKR(task.budget)}</span>
                  </p>
                </div>
                {/* AI Shield Real-Time Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    isBlockedByShield
                      ? "border border-red-300 bg-red-50 text-red-700 animate-pulse"
                      : "border border-brand-200 bg-brand-50 text-brand-700"
                  }`}
                >
                  {isBlockedByShield ? (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> AI Shield: Contacts Detected (Blocked)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> AI Contact Shield: Active &amp; Guarding
                    </>
                  )}
                </div>
              </div>

              {/* Offer Amount Section */}
              <div className="mt-6">
                <label htmlFor="offer-amount" className="mb-2 block text-sm font-bold text-ink">
                  Your Offer Amount
                </label>
                <div className="relative max-w-sm">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-ink-400">
                    PKR
                  </span>
                  <Input
                    id="offer-amount"
                    type="number"
                    min={MIN_BID}
                    step={100}
                    placeholder={String(MIN_BID)}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setWarning(false);
                    }}
                    required
                    className={`pl-16 text-base font-bold ${
                      offerTooLow ? "border-red-300 focus:border-red-400 focus:ring-red-400/15" : ""
                    }`}
                  />
                </div>
                {offerTooLow && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Your offer must be at least {formatPKR(MIN_BID)}.
                  </p>
                )}
                {!offerTooLow && offerAboveBudget && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Your offer is higher than the client&apos;s listed budget.
                  </p>
                )}
              </div>

              {/* Payout Calculation Card */}
              {offerPrice > 0 && (
                <div className="mt-5 grid gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4 sm:grid-cols-3 sm:text-center">
                  <div className="rounded-xl bg-white p-3 shadow-soft">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Your Offer</span>
                    <p className="mt-0.5 text-base font-black text-ink">{formatPKR(offerPrice)}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-soft">
                    <span className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                      <Wallet className="h-3 w-3" /> Platform Fee ({PLATFORM_FEE * 100}%)
                    </span>
                    <p className="mt-0.5 text-base font-bold text-ink-500">-{formatPKR(offerFee)}</p>
                  </div>
                  <div className="rounded-xl bg-brand p-3 text-white shadow-soft">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">You Receive</span>
                    <p className="mt-0.5 text-base font-black text-white">{formatPKR(youReceive)}</p>
                  </div>
                </div>
              )}

              {/* Spacious Proposal Area with AI Guardrail */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="offer-proposal" className="block text-sm font-bold text-ink">
                    Proposal Details <span className="font-normal text-ink-400">(Expanded Workspace)</span>
                  </label>
                  <span className="text-xs text-ink-400">Write why you are the best fit, your approach &amp; timeline</span>
                </div>
                <textarea
                  id="offer-proposal"
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the client why you are the right fit for this task and how you will deliver...&#10;• Previous relevant experience&#10;• Scope breakdown and step-by-step milestones&#10;• Expected timeline and delivery date"
                  className={`w-full rounded-2xl border bg-white p-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-400 transition focus:outline-none focus:ring-4 ${
                    isBlockedByShield
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                      : "border-ink-200 focus:border-brand focus:ring-brand/10"
                  }`}
                />
              </div>

              {/* STRICT SECURITY GUARDRAIL ALERT (When personal contacts detected) */}
              {isBlockedByShield && (
                <div className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-red-900 shadow-soft">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-red-600" />
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-red-900 uppercase tracking-wide">
                        ⚠️ Security Alert: Off-Platform Contact Detected
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-red-800">
                        Sharing personal contact information (Phone numbers, WhatsApp, email, or off-platform payment arrangements) is strictly prohibited. Your offer cannot be sent until these details are completely removed.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allViolations.map((v, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-black text-red-700 shadow-xs"
                          >
                            <AlertTriangle className="h-3 w-3 text-red-500" /> {v}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] font-semibold text-red-700">
                        🔒 All communication must stay within AventriqTalent chat to keep your payments Escrow-protected.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments Section (Photos, PDFs, Documents with AI scan) */}
              <div className="mt-6 rounded-2xl border border-ink-100 bg-canvas p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <Paperclip className="h-4 w-4 text-brand" /> Work Samples &amp; Attachments
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Upload portfolio images, sketches, or PDF project proposals. Files are automatically scanned for off-platform contacts.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="bid-attachment-input"
                    />
                    <label
                      htmlFor="bid-attachment-input"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand bg-white px-3.5 py-2 text-xs font-bold text-brand shadow-soft transition hover:bg-brand-50"
                    >
                      <Paperclip className="h-3.5 w-3.5" /> Attach Files (PDF, Images)
                    </label>
                  </div>
                </div>

                {fileScanning && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    AI Contact Shield is reading and scanning files for off-platform contacts...
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {attachments.map((file, idx) => {
                      const hasViolation = file.violations && file.violations.length > 0;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                            hasViolation ? "border-red-300 bg-red-50/70" : "border-ink-100 bg-white"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-600">
                              {file.type === "image" ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-ink">{file.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-ink-400">
                                <span>{formatFileSize(file.size)}</span>
                                {hasViolation ? (
                                  <span className="font-bold text-red-600">⚠️ Blocked (Contains Contact)</span>
                                ) : (
                                  <span className="flex items-center gap-0.5 font-bold text-brand-700">
                                    <Check className="h-2.5 w-2.5" /> Safe
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="rounded-lg p-1 text-ink-400 transition hover:bg-ink-100 hover:text-red-600"
                            title="Remove file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {warning && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Your offer ({formatPKR(offerPrice)}) is higher than the client&apos;s listed price (
                      {formatPKR(task.budget)}). Are you sure you want to submit this offer?
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWarning(false)}
                      className="flex-1 rounded-xl border border-amber-300 px-3 py-2.5 text-sm font-bold transition hover:bg-amber-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmHighOffer}
                      disabled={submitting || isBlockedByShield}
                      className="flex-1 rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
                    >
                      {submitting ? "Submitting..." : "Yes, continue"}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {/* Submit Offer Button - Completely disabled when blocked by AI Shield */}
              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={submitting || warning || isBlockedByShield || offerTooLow || fileScanning}
                  className={`min-h-12 w-full gap-2 text-base font-bold transition-all ${
                    isBlockedByShield
                      ? "cursor-not-allowed bg-red-200 text-red-800 hover:bg-red-200"
                      : "bg-mint text-white shadow-glow hover:bg-mint-dark"
                  }`}
                >
                  {submitting
                    ? "Submitting offer..."
                    : isBlockedByShield
                    ? "Submission Blocked (Remove Personal Contacts)"
                    : "Submit Offer"}
                </Button>
                {isBlockedByShield && (
                  <p className="mt-2 text-center text-xs font-semibold text-red-600">
                    * The submit button will activate as soon as personal contact details are cleared.
                  </p>
                )}
              </div>
            </form>
          ) : isLockedFromMessaging && task.status === "open" && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="text-lg font-black text-ink">Task summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-500">Client&apos;s price</span>
                  <span className="font-black text-ink">{formatPKR(task.budget)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-500">Offers</span>
                  <span className="font-black text-ink">
                    {task.bidsCount} {task.bidsCount === 1 ? "offer" : "offers"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-500">Location</span>
                  <span className="font-bold text-ink">{task.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-500">To Be Done On</span>
                  <span className="font-bold text-ink">
                    {task.deadline ? formatDate(task.deadline) : "Flexible (Anytime)"}
                  </span>
                </div>
              </div>
              {!user && task.visibility === "public" && (
                <Link
                  href={`/login?redirect=/tasks/${id}`}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-extrabold text-white"
                >
                  Sign in to make an offer
                </Link>
              )}
            </div>
          )}

          {/* About this task card placed on the LEFT column with the form */}
          {aboutThisTaskCard}

          {/* Bids Section for Poster/Admin */}
          {canSelect && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Gavel className="h-5 w-5 text-brand" /> Offers ({bids.length})
              </h2>
              {bids.length === 0 ? (
                <p className="mt-3 text-sm text-ink-500">No offers yet. Waiting for freelancers.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {bids.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-ink-100 p-4 transition hover:border-brand/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-ink">{b.bidderName}</p>
                            <span className="text-lg font-extrabold text-brand">{formatPKR(b.amount)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{b.message}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {b.fresh && (
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                                <Zap className="mr-1 inline-block h-3 w-3" /> Fresh
                              </span>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => chooseBid(b)} className="shrink-0">
                          Select &amp; hold funds
                        </Button>
                      </div>

                      {/* Display proposal attachments if any */}
                      {b.attachments && b.attachments.length > 0 && (
                        <div className="mt-3 border-t border-ink-100 pt-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Attachments</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {b.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-brand-50 hover:text-brand"
                              >
                                {att.type === "image" ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                <span className="max-w-[120px] truncate">{att.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rehire candidates */}
          {isPoster && task.status === "open" && rehireCandidates.length > 0 && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-ink">Rehire a previous freelancer</h2>
                  <p className="text-xs text-ink-500">Make them a direct offer on this new task.</p>
                </div>
              </div>
              {rehireError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{rehireError}</div>}
              <div className="mt-4 space-y-3">
                {rehireCandidates.map((candidate) => (
                  <div key={candidate.taskerId} className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{candidate.taskerName}</p>
                      <p className="mt-0.5 text-xs text-ink-500">Last completed: {candidate.lastTaskTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={MIN_BID}
                        placeholder="Your offer (PKR)"
                        value={rehireAmounts[candidate.taskerId] || ""}
                        onChange={(e) =>
                          setRehireAmounts((prev) => ({ ...prev, [candidate.taskerId]: e.target.value }))
                        }
                        className="min-h-10 w-36 text-sm"
                      />
                      <Button
                        onClick={() => rehire(candidate)}
                        disabled={rehireBusy === candidate.taskerId}
                        className="min-h-10 px-4 text-sm"
                      >
                        {rehireBusy === candidate.taskerId ? "Sending..." : "Make an Offer"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Tasker Progress Controls */}
          {canManage && (
            <div className="flex gap-3">
              {task.status === "assigned" && (
                <Button onClick={() => updateStatus("in_progress")} className="rounded-xl">
                  Start work
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button onClick={() => updateStatus("completed")} className="rounded-xl">
                  Mark completed
                </Button>
              )}
            </div>
          )}

          {/* Request Payment */}
          {canRequestPayment && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
                  <Send className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-ink">Request Payment</h2>
                  <p className="text-sm text-ink-500">Ask the poster to release {formatPKR(task.heldAmount)}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    Platform fee: {PLATFORM_FEE * 100}% - you receive{" "}
                    {formatPKR(
                      task.heldAmount ? task.heldAmount - Math.round(task.heldAmount * PLATFORM_FEE) : 0
                    )}
                  </p>
                </div>
                <Button onClick={reqPayment} className="flex items-center gap-1.5 rounded-xl">
                  <Send className="h-4 w-4" /> Request Payment
                </Button>
              </div>
            </div>
          )}

          {/* Release Payment */}
          {canReleasePayment && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-ink">Release Payment</h2>
                  <p className="text-sm text-ink-500">{task.assignedName} has requested {formatPKR(task.heldAmount)}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    Platform fee ({PLATFORM_FEE * 100}%): {formatPKR(fee)} - Tasker receives{" "}
                    {formatPKR(task.heldAmount ? task.heldAmount - fee : 0)}
                  </p>
                </div>
                <Button onClick={relPayment} className="flex items-center gap-1.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" /> Release {formatPKR(task.heldAmount)}
                </Button>
              </div>
            </div>
          )}

          {/* Payment Complete */}
          {paymentDone && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-700">Payment Released</h2>
                  <p className="text-sm text-brand-600">
                    {formatPKR(task.heldAmount)} has been released. Tasker received{" "}
                    {formatPKR(
                      task.heldAmount ? task.heldAmount - Math.round(task.heldAmount * PLATFORM_FEE) : 0
                    )}{" "}
                    ({PLATFORM_FEE * 100}% platform fee).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          {isPoster && task.paymentReleased && task.assignedTo && (
            <form onSubmit={submitReview} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Star className="h-5 w-5 text-brand" /> Rate the tasker
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-ink-500">Rating</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} stars
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Leave a comment..."
                className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <Button type="submit" className="mt-3 rounded-xl">
                Submit review
              </Button>
            </form>
          )}

          {/* Reviews list */}
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Star className="h-5 w-5 text-brand" /> Reviews
              </h2>
              <div className="mt-4 space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-ink">{r.fromName}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-ink-500">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============ RIGHT COLUMN (TASK DETAILS & OVERVIEW) ============ */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          {taskDetailsCard}
        </aside>
      </div>
    </div>
  );

  return role === "tasker" ? <DashboardShell>{page}</DashboardShell> : page;
}