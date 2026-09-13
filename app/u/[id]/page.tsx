"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listReviewsForUser, CATEGORIES, type Review } from "@/lib/tasks";
import { formatPKR, formatDate } from "@/lib/format";
import FreelancerHeader from "@/components/FreelancerHeader";
import {
  User,
  Star,
  Shield,
  ShieldCheck,
  MapPin,
  BriefcaseBusiness,
  ArrowLeft,
  Sparkles,
  BadgeCheck,
  MessageSquareText,
  FolderOpen,
  GraduationCap,
  Award,
  Clock,
  CheckCircle2,
  Link2,
  ArrowUpRight,
  Image as ImageIcon,
} from "lucide-react";

interface PortfolioItem {
  id?: string;
  title: string;
  description?: string;
  skills?: string[];
  imageUrl?: string;
  link?: string;
}

interface ReviewView extends Review {
  fromAvatar?: string;
  taskTitle?: string;
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-[-0.02em] text-ink">{title}</h2>
            {subtitle && <p className="text-xs font-medium text-ink-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5 text-sm font-medium text-ink-400">
      <Icon className="h-5 w-5 shrink-0 text-ink-300" />
      {text}
    </div>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<{ completed: number; active: number; cancelled: number; total: number; rate: number | null }>({ completed: 0, active: 0, cancelled: 0, total: 0, rate: null });
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);
  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      if (!db) return;
      const database = db;
      try {
        const snap = await getDoc(doc(database, "users", id));
        if (!snap.exists()) { setHidden(true); return; }
        const d = snap.data();
        if (d.isPrivate && !isAdmin) { setHidden(true); return; }
        if (cancelled) return;
        setData(d);

        const [revs, portfolioSnap, taskSnap] = await Promise.all([
          listReviewsForUser(id).catch(() => [] as Review[]),
          getDocs(query(collection(database, "users", id, "portfolio"), orderBy("createdAt", "desc"))).catch(() => null),
          getDocs(query(collection(database, "tasks"), where("assignedTo", "==", id))).catch(() => null),
        ]);

        const enriched: ReviewView[] = await Promise.all(revs.map(async (r) => {
          let fromAvatar = "";
          let taskTitle = "";
          try {
            const u = await getDoc(doc(database, "users", r.fromId));
            if (u.exists()) fromAvatar = u.data().avatarUrl || "";
          } catch { /* avatar is optional */ }
          if (r.taskId) {
            try {
              const t = await getDoc(doc(database, "tasks", r.taskId));
              if (t.exists()) taskTitle = t.data().title || "";
            } catch { /* task title is optional */ }
          }
          return { ...r, fromAvatar, taskTitle };
        }));
        if (cancelled) return;
        setReviews(enriched);

        if (portfolioSnap) setPortfolio(portfolioSnap.docs.map((p) => ({ id: p.id, ...p.data() }) as PortfolioItem));

        if (taskSnap) {
          const tasks = taskSnap.docs.map((t) => t.data());
          const completed = tasks.filter((t) => t.status === "completed").length;
          const active = tasks.filter((t) => t.status === "assigned" || t.status === "in_progress").length;
          const cancelledCount = tasks.filter((t) => t.status === "cancelled").length;
          const decided = completed + cancelledCount + active;
          setStats({ completed, active, cancelled: cancelledCount, total: tasks.length, rate: decided > 0 ? Math.round((completed / decided) * 100) : null });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isAdmin]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center bg-canvas"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (hidden || !data) {
    return (
      <div className="min-h-screen bg-canvas">
        {user && <FreelancerHeader />}
        <div className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-500">
          <User className="mx-auto h-12 w-12 text-ink-300" />
          <h2 className="mt-4 text-lg font-semibold text-ink">Profile not available</h2>
          <Link href="/" className="mt-2 inline-block text-sm font-semibold text-brand">Go home</Link>
        </div>
      </div>
    );
  }

  const skills: string[] = Array.isArray(data.skills) ? data.skills.filter(Boolean) : [];
  const languages: string[] = Array.isArray(data.languages) ? data.languages : [];
  const certs: string[] = Array.isArray(data.certifications) ? data.certifications : [];
  const isFreelancer = data.role === "tasker" || data.isTasker;
  const rating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const online = data.availability === "Available now";
  const verification = data.idVerification || null;
  const trustScore = typeof data.trustScore === "number" ? data.trustScore : null;

  const specialities = CATEGORIES.filter((c) =>
    skills.some((s) => s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase()))
  );
  const specialityList = specialities.length > 0 ? specialities : skills.slice(0, 6);

  const visiblePortfolio = showAllPortfolio ? portfolio : portfolio.slice(0, 6);

  return (
    <div className="min-h-screen bg-canvas">
      {user && <FreelancerHeader />}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/browse" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <section className="card overflow-hidden">
          <div className="h-24 bg-brand" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt={`${data.name || "Freelancer"} profile photo`} className="h-24 w-24 rounded-2xl object-cover shadow-card ring-4 ring-white" />
                ) : (
                  <span className="grid h-24 w-24 place-items-center rounded-2xl bg-brand text-3xl font-black text-white ring-4 ring-white">{(data.name || "U")[0].toUpperCase()}</span>
                )}
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-[-0.03em] text-ink sm:text-3xl">{data.name || "Freelancer"}</h1>
                    {verification?.status === "verified" && <BadgeCheck className="h-6 w-6 text-brand" />}
                  </div>
                  {(data.professionalTitle || data.organization) && (
                    <p className="mt-0.5 text-sm font-extrabold text-brand-dark">{data.professionalTitle || data.organization}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green-500" : "bg-ink-300"}`} />
                <span className={online ? "text-green-600" : "text-ink-400"}>{online ? "Online" : "Offline"}</span>
              </span>
              {data.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" />{data.city}</span>}
              {data.availability && isFreelancer && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand" />{data.availability}</span>}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-black text-ink">{rating ?? "\u2014"}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-ink-400">{reviews.length ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : "No reviews yet"}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-ink">{stats.rate !== null ? `${stats.rate}%` : "\u2014"}</p>
                <p className="mt-1 text-xs font-semibold text-ink-400">Completion rate</p>
              </div>
              <div>
                <p className="text-2xl font-black text-ink">{stats.completed}</p>
                <p className="mt-1 text-xs font-semibold text-ink-400">Completed{stats.total > 0 ? ` of ${stats.total}` : ""} tasks</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  {verification?.status === "verified" ? <ShieldCheck className="h-5 w-5 text-brand" /> : <Shield className="h-5 w-5 text-ink-300" />}
                  <span className="text-sm font-black text-ink">{verification?.status === "verified" ? "ID Verified" : verification?.status === "submitted" ? "In review" : "Pending"}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-ink-400">Verification</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="card p-6">
              <h2 className="text-base font-black tracking-[-0.02em] text-ink">Verified Information</h2>
              <div className="mt-4 space-y-3">
                {verification?.status === "verified" ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div><p className="text-sm font-black text-green-700">ID Verified</p><p className="mt-0.5 text-xs leading-5 text-green-600">Identity confirmed by the Parwaz team.</p></div>
                  </div>
                ) : verification?.status === "submitted" ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div><p className="text-sm font-black text-amber-700">Verification in review</p><p className="mt-0.5 text-xs leading-5 text-amber-600">Submitted {verification.submittedAt ? formatDate(verification.submittedAt) : "recently"}.</p></div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl bg-ink-50 p-4">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
                    <div><p className="text-sm font-black text-ink">ID Verification Pending</p><p className="mt-0.5 text-xs leading-5 text-ink-400">No identity document has been verified yet.</p></div>
                  </div>
                )}

                {trustScore !== null && (
                  <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5">
                    <span className="flex items-center gap-2 text-sm font-bold text-ink-500"><Shield className="h-4 w-4 text-brand" /> Trust Score</span>
                    <span className="text-lg font-black text-ink">{trustScore}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink-500"><CheckCircle2 className="h-4 w-4 text-brand" /> Member since</span>
                  <span className="text-sm font-black text-ink">{data.createdAt ? formatDate(data.createdAt) : "Parwaz"}</span>
                </div>
              </div>
            </section>

            {(data.hourlyRate > 0 || languages.length > 0 || certs.length > 0) && (
              <section className="card p-6">
                <h2 className="text-base font-black tracking-[-0.02em] text-ink">Quick facts</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {data.hourlyRate > 0 && (
                    <div className="flex items-center justify-between"><dt className="flex items-center gap-2 font-bold text-ink-500"><BriefcaseBusiness className="h-4 w-4 text-brand" /> Hourly rate</dt><dd className="font-black text-ink">{formatPKR(Number(data.hourlyRate))}/hr</dd></div>
                  )}
                  {languages.length > 0 && (
                    <div><dt className="font-bold text-ink-500">Languages</dt><dd className="mt-1 font-semibold text-ink-600">{languages.join(" · ")}</dd></div>
                  )}
                  {certs.length > 0 && (
                    <div><dt className="font-bold text-ink-500">Certifications</dt><dd className="mt-1 font-semibold text-ink-600">{certs.join(" · ")}</dd></div>
                  )}
                </dl>
              </section>
            )}
          </aside>

          <div className="space-y-6">
            <SectionCard icon={FolderOpen} title="Portfolio" subtitle={portfolio.length > 0 ? `${portfolio.length} project${portfolio.length !== 1 ? "s" : ""}` : undefined}
              action={portfolio.length > 6 ? (
                <button onClick={() => setShowAllPortfolio((v) => !v)} className="inline-flex min-h-9 items-center rounded-xl border border-ink-200 bg-white px-3.5 text-xs font-extrabold text-ink-600 transition hover:bg-brand-50 hover:text-brand-dark">
                  {showAllPortfolio ? "Show less" : `View all (${portfolio.length})`}
                </button>
              ) : undefined}
            >
              {portfolio.length === 0 ? (
                <EmptyState icon={FolderOpen} text="No portfolio projects added yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {visiblePortfolio.map((item) => (
                    <article key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="grid h-40 w-full place-items-center bg-brand-50 text-brand/40"><ImageIcon className="h-8 w-8" /></div>
                      )}
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-sm font-black text-ink">{item.title}</h3>
                        {item.description && <p className="mt-1 text-xs leading-5 text-ink-500">{item.description}</p>}
                        {(item.skills || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(item.skills || []).slice(0, 5).map((skill) => <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-dark">{skill}</span>)}
                          </div>
                        )}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-brand">
                            <Link2 className="h-3.5 w-3.5" /> View project <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={User} title="About">
              {data.bio ? (
                <p className="text-sm leading-7 text-ink-600"><span className="font-black text-ink">Hi, I'm {data.name || "a freelancer"}.</span> {data.bio}</p>
              ) : (
                <EmptyState icon={User} text="No introduction added yet." />
              )}
            </SectionCard>

            <SectionCard icon={Sparkles} title="Specialities" subtitle="Based on the skills they offer">
              {specialityList.length === 0 ? (
                <EmptyState icon={Sparkles} text="No specialities added yet." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {specialityList.map((s) => (
                    <span key={s} className="rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-sm font-extrabold text-brand-dark">{s}</span>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Award} title="Skills" subtitle={skills.length > 0 ? `${skills.length} skill${skills.length !== 1 ? "s" : ""}` : undefined}>
              {skills.length === 0 ? (
                <EmptyState icon={Award} text="No skills added yet." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-extrabold text-ink-600">{skill}</span>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={MessageSquareText} title="Client Reviews" subtitle={reviews.length > 0 ? `${rating} average from ${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : undefined}>
              {reviews.length === 0 ? (
                <EmptyState icon={MessageSquareText} text="No reviews yet." />
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-ink-100 p-4">
                      <div className="flex items-start gap-3">
                        {r.fromAvatar ? (
                          <img src={r.fromAvatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-black text-white">{(r.fromName || "C")[0].toUpperCase()}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-ink">{r.fromName || "Client"}</p>
                            <span className="text-xs font-medium text-ink-400">{formatDate(r.createdAt)}</span>
                          </div>
                          <div className="mt-1 flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-ink-200"}`} />
                            ))}
                          </div>
                          {r.taskTitle && <p className="mt-1 text-[11px] font-bold text-ink-400">Project: {r.taskTitle}</p>}
                          {r.comment && <p className="mt-2 text-sm leading-6 text-ink-600">{r.comment}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard icon={GraduationCap} title="Education">
              {Array.isArray(data.education) ? (
                data.education.length === 0 ? (
                  <EmptyState icon={GraduationCap} text="No education details added yet." />
                ) : (
                  <ul className="space-y-3">
                    {data.education.map((entry: any, i: number) => (
                      <li key={i} className="flex gap-3.5 rounded-2xl border border-ink-100 p-4">
                        {entry.imageUrl && <img src={entry.imageUrl} alt={`${entry.degree || "Education"} document`} className="h-16 w-24 shrink-0 rounded-lg object-cover" />}
                        <div className="min-w-0">
                          <p className="text-sm font-black text-ink">{entry.degree || entry.title || entry}</p>
                          {(entry.institution || entry.field || entry.startYear || entry.endYear) && (
                            <p className="mt-1 text-xs font-semibold text-ink-500">{[entry.institution, entry.field, [entry.startYear, entry.endYear].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</p>
                          )}
                          {entry.description && <p className="mt-1.5 text-xs leading-5 text-ink-400">{entry.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : data.education ? (
                <div className="rounded-2xl border border-ink-100 p-4"><p className="text-sm font-black text-ink">{data.education}</p></div>
              ) : (
                <EmptyState icon={GraduationCap} text="No education details added yet." />
              )}
            </SectionCard>

            <SectionCard icon={Clock} title="Work Experience">
              {Array.isArray(data.workExperience) && data.workExperience.length > 0 ? (
                <ul className="space-y-3">
                  {data.workExperience.map((entry: any, i: number) => (
                    <li key={i} className="rounded-2xl border border-ink-100 p-4">
                      <p className="text-sm font-black text-ink">{entry.title || entry.jobTitle || "Role"}</p>
                      <p className="mt-0.5 text-xs font-bold text-ink-500">{[entry.company, entry.type || entry.employmentType, [entry.startDate, entry.endDate].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</p>
                      {entry.description && <p className="mt-2 text-sm leading-6 text-ink-600">{entry.description}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Clock} text="No work experience added yet." />
              )}
            </SectionCard>

            <SectionCard icon={MapPin} title="Transportation">
              {data.transportation ? (
                <div className="rounded-2xl border border-ink-100 p-4"><p className="text-sm font-black text-ink">{data.transportation}</p></div>
              ) : (
                <EmptyState icon={MapPin} text="No transportation preference added yet." />
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
