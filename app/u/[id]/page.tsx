"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Globe,
  Languages,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { listReviewsForUser, type Review } from "@/lib/tasks";
import { normalizeRole, MEMBER_ROLE_LABELS } from "@/lib/roles";
import { formatPKR, timeAgo } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Badge, Stat } from "@/components/ui/Badge";
import { EmptyState, PageLoader } from "@/components/ui/Feedback";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isStaff } = useAuth();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!id || !db) return;
    (async () => {
      try {
        const snapshot = await getDoc(doc(db!, "users", id));
        if (!snapshot.exists()) {
          setHidden(true);
          return;
        }
        const record = snapshot.data();
        if (record.isPrivate && !isStaff) {
          setHidden(true);
          return;
        }
        setData(record);
        setReviews(await listReviewsForUser(id).catch(() => []));
      } catch {
        setHidden(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isStaff]);

  if (loading) return <PageLoader label="Loading profile" />;

  if (hidden || !data) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface">
          <EmptyState
            icon={UserRound}
            title="Profile not available"
            description="This member may have left Parwaz, or their profile is private."
            action={
              <Link href="/talent">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4" /> Browse talent
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const role = normalizeRole(data.role);
  const isFreelancer = role === "freelancer";
  const average = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const isSelf = user?.uid === id;

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <Link href="/talent" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <section className="surface overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-brand to-brand-light" />
          <div className="px-6 pb-7 sm:px-8 sm:pb-8">
            <div className="-mt-14 flex flex-wrap items-end gap-5">
              <Avatar name={data.name} src={data.avatarUrl} size="xl" className="ring-4 ring-white" />
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-[-0.035em] text-ink sm:text-3xl">
                    {data.name || "Parwaz member"}
                  </h1>
                  {data.interviewStatus === "verified" && (
                    <BadgeCheck className="h-6 w-6 text-$success-600" aria-label="Parwaz interviewed" />
                  )}
                </div>
                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {data.professionalTitle || data.organization || MEMBER_ROLE_LABELS[role]}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Badge tone="bg-brand-50 text-brand-dark border-brand-200">{MEMBER_ROLE_LABELS[role]}</Badge>
                  {data.verified && (
                    <Badge tone="bg-$success-50 text-$success-700 border-$success-200">
                      <ShieldCheck className="h-3 w-3" /> ID verified
                    </Badge>
                  )}
                  {data.isPrivate && <Badge tone="bg-ink text-white border-ink">Managed provider</Badge>}
                  {data.availability && isFreelancer && <Badge>{data.availability}</Badge>}
                </div>
              </div>
              {isSelf && (
                <Link href="/profile" className="pb-1">
                  <Button variant="ghost" size="sm">
                    Edit your profile
                  </Button>
                </Link>
              )}
            </div>

            {data.bio && <p className="mt-6 max-w-2xl text-[15px] leading-7 text-ink-600">{data.bio}</p>}

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-ink-500">
              {data.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand" /> {data.city}
                </span>
              )}
              {data.hourlyRate > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-brand" /> {formatPKR(data.hourlyRate)} / hour
                </span>
              )}
              {data.experienceYears > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-brand" /> {data.experienceYears} years experience
                </span>
              )}
              {Array.isArray(data.languages) && data.languages.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-brand" /> {data.languages.join(" · ")}
                </span>
              )}
              {data.portfolioUrl && (
                <a
                  href={data.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 text-brand-dark hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Star} label={`${reviews.length} reviews`} value={average} tone="bg-$warning-50 text-$warning-600" />
          <Stat
            icon={CheckCircle2}
            label="Tasks completed"
            value={data.tasksCompleted ?? "—"}
            tone="bg-$success-50 text-$success-600"
          />
          <Stat icon={TrendingUp} label="Trust score" value={data.trustScore ?? 70} tone="bg-brand-50 text-brand" />
          <Stat
            icon={ShieldCheck}
            label="Interview"
            value={data.interviewStatus === "verified" ? "Verified" : "Pending"}
            tone="bg-$info-50 text-$info-600"
          />
        </div>

        {isFreelancer && Array.isArray(data.skills) && data.skills.length > 0 && (
          <section className="surface mt-5 p-6">
            <h2 className="text-lg font-black text-ink">Services offered</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.skills.map((skill: string) => (
                <span key={skill} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-dark">
                  {skill}
                </span>
              ))}
            </div>
            {Array.isArray(data.certifications) && data.certifications.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-black text-ink">Certifications</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.certifications.map((item: string) => (
                    <span key={item} className="rounded-xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-600">
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {!isFreelancer && data.hiringNeeds && (
          <section className="surface mt-5 p-6">
            <h2 className="text-lg font-black text-ink">What they hire for</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">{data.hiringNeeds}</p>
          </section>
        )}

        <section className="surface mt-5 overflow-hidden">
          <div className="border-b border-ink-100 p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">Reputation</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </h2>
          </div>
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews yet"
              description="Reviews appear here once completed tasks are approved and rated."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {reviews.map((review) => (
                <li key={review.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`h-3.5 w-3.5 ${value <= review.rating ? "fill-sun text-sun" : "text-ink-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-black text-ink">{review.fromName}</span>
                    {review.taskTitle && (
                      <span className="text-xs font-semibold text-ink-400">· {review.taskTitle}</span>
                    )}
                    <span className="ml-auto text-xs text-ink-400">{timeAgo(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="mt-2.5 text-sm leading-6 text-ink-600">{review.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
