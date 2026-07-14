"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listReviewsForUser, type Review } from "@/lib/tasks";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => {
    if (!id) return;
    (async () => {
      if (!db) return;
      const snap = await getDoc(doc(db, "users", id));
      if (!snap.exists()) {
        setHidden(true);
        setLoading(false);
        return;
      }
      const d = snap.data();
      if (d.isPrivate && !isAdmin) {
        setHidden(true);
        setLoading(false);
        return;
      }
      setData(d);
      setReviews(await listReviewsForUser(id));
      setLoading(false);
    })();
  }, [id, isAdmin]);

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-20 text-ink/60">Loading...</div>;
  if (hidden || !data)
    return <div className="mx-auto max-w-2xl px-4 py-20 text-ink/60">Profile not available.</div>;

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-ink/10 bg-white p-6">
        <h1 className="text-2xl font-bold text-ink">{data.name || "User"}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {data.isPrivate ? "Private profile · team" : data.role} · ⭐ {avg} ({reviews.length})
        </p>
        {data.bio && <p className="mt-3 whitespace-pre-wrap text-sm text-ink/70">{data.bio}</p>}
      </div>

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
