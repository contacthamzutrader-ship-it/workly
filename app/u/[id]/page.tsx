"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listReviewsForUser, type Review } from "@/lib/tasks";
import { User, Star, Shield, MapPin, Briefcase, ArrowLeft, Sparkles, BadgeCheck, MessageSquareText, FolderOpen, Target, ArrowRight } from "lucide-react";
import { computeAiScore } from "@/lib/ai-score";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => { if (!id) return;
    (async () => { if (!db) return;
      const snap = await getDoc(doc(db, "users", id));
      if (!snap.exists()) { setHidden(true); setLoading(false); return; }
      const d = snap.data();
      if (d.isPrivate && !isAdmin) { setHidden(true); setLoading(false); return; }
      setData(d); setReviews(await listReviewsForUser(id)); setLoading(false);
    })();
  }, [id, isAdmin]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-mint border-t-transparent" /></div>;
  if (hidden || !data) return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-500"><User className="mx-auto h-12 w-12 text-ink-300" /><h2 className="mt-4 text-lg font-semibold text-ink">Profile not available</h2><Link href="/" className="mt-2 inline-block text-sm font-semibold text-mint-700">Go home</Link></div>;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "\u2014";
  const isFreelancer = data.role === "tasker" || data.isTasker;

  const ai = computeAiScore(data);
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const certs = Array.isArray(data.certifications) ? data.certifications : [];
  const languages = Array.isArray(data.languages) ? data.languages : [];
  const trustScore = typeof data.trustScore === "number" ? data.trustScore : 55;
  const communicationScore = Math.max(50, Math.min(95, 55 + Math.min((data.bio || "").length / 15, 20) + languages.length * 6 + (data.availability ? 8 : 0)));
  const portfolioQuality = Math.max(40, Math.min(95, (data.portfolioUrl ? 35 : 10) + certs.length * 12 + Math.min(skills.length, 6) * 6 + (data.experienceYears > 0 ? 15 : 0)));
  const riskLevel = trustScore >= 80 && reviews.length >= 3 ? "Low risk" : trustScore >= 65 ? "Medium risk" : "Beginner — guided";

  const hiringRows = [
    { icon: Sparkles, label: "AI Skill Score", value: ai.skillScore, tone: "text-mint-700 bg-mint-50" },
    { icon: Shield, label: "Trust Score", value: trustScore, tone: "text-deep bg-deep-50" },
    { icon: MessageSquareText, label: "Communication", value: communicationScore, tone: "text-blue-600 bg-blue-50" },
    { icon: FolderOpen, label: "Portfolio Quality", value: portfolioQuality, tone: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/tasks" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink mb-6"><ArrowLeft className="h-4 w-4" /> Back</Link>

      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-12">
        {data.avatarUrl ? <img src={data.avatarUrl} alt={`${data.name || "User"} profile`} className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-card" /> : <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-deep text-3xl font-black text-white shadow-card">{(data.name || "U")[0].toUpperCase()}</div>}
        <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-ink">{data.name || "User"}</h1>
        {data.professionalTitle && <p className="mt-1 text-sm font-extrabold text-mint-700">{data.professionalTitle}</p>}
        {data.organization && <p className="mt-1 text-sm font-extrabold text-mint-700">{data.organization}</p>}
        <p className="mt-2 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700">
            {data.isPrivate ? "Private - Team" : data.role || "Member"}
          </span>
        </p>
        {data.bio && <p className="mt-4 max-w-md mx-auto text-ink-600 leading-relaxed">{data.bio}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-semibold text-ink-500">
          {data.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-mint-700" />{data.city}</span>}
          {data.hourlyRate > 0 && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-mint-700" />PKR {Number(data.hourlyRate).toLocaleString("en-PK")}/hour</span>}
          {data.experienceYears > 0 && <span>{data.experienceYears} years experience</span>}
          {data.availability && isFreelancer && <span>{data.availability}</span>}
          {languages.length > 0 && <span>{languages.join(" · ")}</span>}
        </div>

        <div className="mt-6 flex justify-center gap-6">
          <div className="text-center"><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /><span className="font-bold">{avg}</span></div><p className="text-xs text-ink-500">{reviews.length} reviews</p></div>
          {typeof data.trustScore === "number" && <div className="text-center"><div className="flex items-center gap-1"><Shield className="h-4 w-4 text-mint-700" /><span className="font-bold">{data.trustScore}</span></div><p className="text-xs text-ink-500">Trust score</p></div>}
        </div>

        {skills.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {skills.map((s: string) => <span key={s} className="rounded-full bg-mint-50 px-3 py-1 text-xs font-medium text-mint-700">{s}</span>)}
          </div>
        )}
        {certs.length > 0 && <div className="mt-6"><p className="text-xs font-black uppercase tracking-wider text-ink-400">Certifications</p><p className="mt-2 text-sm font-semibold text-ink-600">{certs.join(" · ")}</p></div>}
        {data.portfolioUrl && <a href={data.portfolioUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl bg-deep px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-deep-700">View portfolio</a>}
        {data.hiringNeeds && <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-canvas p-5 text-left"><p className="text-xs font-black uppercase tracking-wider text-ink-400">Usually hiring for</p><p className="mt-2 text-sm leading-6 text-ink-600">{data.hiringNeeds}</p></div>}
      </div>

      {isFreelancer && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-mint-200 bg-white shadow-card">
          <div className="flex items-center gap-3 bg-deep p-6 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black">AI Hiring Summary</h2>
              <p className="text-xs font-medium text-white/60">Helping you hire a beginner with confidence</p>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {hiringRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-canvas px-5 py-4">
                <span className="flex items-center gap-2.5 text-sm font-bold text-ink-500"><span className={`grid h-9 w-9 place-items-center rounded-lg ${row.tone}`}><row.icon className="h-4 w-4" /></span>{row.label}</span>
                <span className="text-lg font-black text-ink">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><Target className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-black text-ink">Recommended job types</p>
                  <p className="mt-1 text-xs font-semibold text-ink-500">{ai.categories.join(" · ")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-mint-50 text-mint-700"><BadgeCheck className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-black text-ink">Risk level</p>
                  <p className="mt-1 text-xs font-semibold text-ink-500">{riskLevel}</p>
                </div>
              </div>
            </div>
            <Link href="/messages" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-mint px-6 text-sm font-extrabold text-white shadow-glow transition hover:bg-mint-dark sm:w-auto">
              Send a message <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink">Reviews</h2>
          <div className="mt-4 space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-ink-100 p-4">
                <div className="flex items-center gap-2"><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div><span className="text-sm font-semibold text-ink">{r.fromName}</span></div>
                {r.comment && <p className="mt-2 text-sm text-ink-500">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
