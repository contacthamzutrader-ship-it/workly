"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listReviewsForUser, type Review } from "@/lib/tasks";
import { User, Star, Shield, MapPin, Briefcase, ArrowLeft } from "lucide-react";

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

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (hidden || !data) return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-500"><User className="mx-auto h-12 w-12 text-ink-300" /><h2 className="mt-4 text-lg font-semibold text-ink">Profile not available</h2><Link href="/" className="mt-2 inline-block text-sm font-semibold text-brand">Go home</Link></div>;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "\u2014";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/tasks" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink mb-6"><ArrowLeft className="h-4 w-4" /> Back</Link>

      <div className="rounded-[32px] border border-ink-100 bg-white p-8 text-center shadow-elevated sm:p-12">
        {data.avatarUrl ? <img src={data.avatarUrl} alt={`${data.name || "User"} profile`} className="mx-auto h-24 w-24 rounded-3xl object-cover shadow-card" /> : <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-ink text-3xl font-black text-white shadow-card">{(data.name || "U")[0].toUpperCase()}</div>}
        <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-ink">{data.name || "User"}</h1>
        <p className="mt-2 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-dark">
            {data.isPrivate ? "Private - Team" : data.role || "Member"}
          </span>
        </p>
        {data.bio && <p className="mt-4 max-w-md mx-auto text-ink-600 leading-relaxed">{data.bio}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-semibold text-ink-500">
          {data.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" />{data.city}</span>}
          {data.hourlyRate > 0 && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-brand" />PKR {Number(data.hourlyRate).toLocaleString("en-PK")}/hour</span>}
          {data.languages?.length > 0 && <span>{data.languages.join(" · ")}</span>}
        </div>

        <div className="mt-6 flex justify-center gap-6">
          <div className="text-center"><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span className="font-bold">{avg}</span></div><p className="text-xs text-ink-500">{reviews.length} reviews</p></div>
          {typeof data.trustScore === "number" && <div className="text-center"><div className="flex items-center gap-1"><Shield className="h-4 w-4 text-brand" /><span className="font-bold">{data.trustScore}</span></div><p className="text-xs text-ink-500">Trust score</p></div>}
        </div>

        {data.skills?.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {data.skills.map((s: string) => <span key={s} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">{s}</span>)}
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink">Reviews</h2>
          <div className="mt-4 space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-ink-100 p-4">
                <div className="flex items-center gap-2"><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div><span className="text-sm font-semibold text-ink">{r.fromName}</span></div>
                {r.comment && <p className="mt-2 text-sm text-ink-500">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
