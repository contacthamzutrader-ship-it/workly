"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Star, Shield, Save, Key, CheckCircle2, Percent } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
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
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [tasksDone, setTasksDone] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/profile"); }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!db) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name ?? ""); setBio(d.bio ?? ""); setIsTasker(d.isTasker ?? true); setIsPrivate(d.isPrivate ?? false);
        setTrust(typeof d.trustScore === "number" ? d.trustScore : null); setSkills((d.skills || []).join(", "));
      }
      setReviews(await listReviewsForUser(user.uid));

      const taskSnap = await getDocs(query(collection(db, "tasks"), where("assignedTo", "==", user.uid)));
      const assigned = taskSnap.docs.map(d => d.data());
      const completed = assigned.filter(t => t.status === "completed" && t.paymentReleased);
      const total = assigned.filter(t => t.status === "completed" || t.status === "cancelled" || t.status === "in_progress");
      if (assigned.length > 0) {
        setTasksDone(completed.length);
        const rate = assigned.filter(t => t.status === "completed" || t.paymentReleased).length / assigned.length;
        setCompletionRate(Math.round(rate * 100));
      }
    })();
  }, [user]);

  if (!user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "\u2014";

  const save = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setSaved(false);
    try { if (!db) throw new Error("Firebase not configured"); const data: any = { name, bio, isTasker }; data.skills = skills.split(",").map(s => s.trim()).filter(Boolean); if (isAdmin) data.isPrivate = isPrivate; await updateDoc(doc(db, "users", user.uid), data); setSaved(true); } catch (err: any) { setError(err?.message || "Could not save"); } };

  const changePassword = async () => {
    if (!user?.email || !auth) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setError("");
      setSaved(true);
      alert("Password reset link sent to your email!");
    } catch (err: any) {
      setError(err?.message || "Could not send reset email");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-ink">My Profile</h1>
      <p className="mt-1 text-ink-500">Manage your public appearance</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-50 text-yellow-500"><Star className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{avg}</p><p className="text-xs text-ink-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p></div></div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Shield className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{trust !== null ? trust : "—"}</p><p className="text-xs text-ink-500">Trust Score</p></div></div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-600"><Percent className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{completionRate !== null ? `${completionRate}%` : "—"}</p><p className="text-xs text-ink-500">Completion Rate</p></div></div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-2xl font-extrabold text-ink">{tasksDone}</p><p className="text-xs text-ink-500">Tasks Done</p></div></div>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about yourself..." className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /></div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={isTasker} onChange={(e) => setIsTasker(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand" /> I want to <span className="font-semibold">do tasks</span> (bidding)</label>
        {isTasker && <div><label className="mb-1.5 block text-sm font-medium text-ink">Skills (comma separated)</label><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Cleaning, Gardening, Delivery" /></div>}
        {isAdmin && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand focus:ring-brand" /> <span className="font-semibold">Private</span> profile (team only)</label>}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">Profile saved successfully!</div>}
        <Button type="submit" className="flex items-center gap-2 rounded-xl"><Save className="h-4 w-4" /> Save profile</Button>

        <div className="border-t border-ink-100 pt-5">
          <p className="text-sm font-medium text-ink mb-2">Change Password</p>
          <p className="text-xs text-ink-500 mb-3">A reset link will be sent to {user.email}</p>
          <button type="button" onClick={changePassword} className="flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink-50">
            <Key className="h-4 w-4" /> Send reset link
          </button>
        </div>
      </form>

      {reviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink">Reviews</h2>
          <div className="mt-4 space-y-3">{reviews.map(r => (
            <div key={r.id} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2"><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div><span className="text-sm font-semibold text-ink">{r.fromName}</span></div>
              {r.comment && <p className="mt-2 text-sm text-ink-500">{r.comment}</p>}
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
