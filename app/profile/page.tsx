"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listReviewsForUser, type Review } from "@/lib/tasks";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isTasker, setIsTasker] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [trust, setTrust] = useState<number | null>(null);
  const [skills, setSkills] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!db) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name ?? "");
        setBio(d.bio ?? "");
        setIsTasker(d.isTasker ?? true);
        setIsPrivate(d.isPrivate ?? false);
        setTrust(typeof d.trustScore === "number" ? d.trustScore : null);
        setSkills((d.skills || []).join(", "));
      }
      setReviews(await listReviewsForUser(user.uid));
    })();
  }, [user]);

  if (!user) return <div className="mx-auto max-w-2xl px-4 py-20 text-ink/60">Loading...</div>;

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      if (!db) throw new Error("Firebase not configured");
      const data: any = { name, bio, isTasker };
      data.skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (isAdmin) data.isPrivate = isPrivate;
      await updateDoc(doc(db, "users", user.uid), data);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Could not save");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink"><User className="h-6 w-6 text-brand" /> My Profile</h1>
      <p className="mt-1 text-sm text-ink/60">Rating: {avg} ★ ({reviews.length} reviews)</p>
      {trust !== null && (
        <p className="text-sm text-ink/60">Trust score: <span className="font-semibold text-brand">{trust}/100</span></p>
      )}

      <form onSubmit={save} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell others about yourself..."
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isTasker} onChange={(e) => setIsTasker(e.target.checked)} />
          I want to do tasks (show me bidding)
        </label>

        {isTasker && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Skills (comma separated)</label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Cleaning, Gardening, Delivery" />
          </div>
        )}

        {isAdmin && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Make this a <span className="font-semibold">private</span> profile (team only)
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-brand">Saved.</p>}
        <Button type="submit">Save profile</Button>
      </form>
    </div>
  );
}
