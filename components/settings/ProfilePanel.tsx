"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteUser, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { uploadProfileImage, withTimeout } from "@/lib/profile-image";
import { AlertTriangle, Camera, CheckCircle2, Save, ShieldCheck, Trash2, X } from "lucide-react";
import EducationPanel from "@/components/settings/EducationPanel";

const inputClass = "min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function ProfilePanel({ user, onSaved }: { user: FirebaseUser; onSaved?: (updates: any) => void }) {
  const router = useRouter();
  const { signOut } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [about, setAbout] = useState("");
  const [verified, setVerified] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setAvatarUrl(d.avatarUrl || "");
          setAbout(d.bio || "");
          setVerified(d.idVerification?.status === "verified");
        }
      } catch { /* best effort */ }
    })();
  }, [user]);

  const pickPhoto = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoRemoved(false);
    setError("");
  };

  const cancelPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) { setError("Profile saving is unavailable right now. Please try again later."); return; }
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      let nextAvatar = avatarUrl;
      if (photoRemoved) nextAvatar = "";
      else if (photoFile) nextAvatar = await uploadProfileImage(user.uid, photoFile);

      const data: Record<string, any> = {
        bio: about.trim(),
        profileUpdatedAt: new Date().toISOString(),
      };
      if (photoFile || photoRemoved) data.avatarUrl = nextAvatar;

      await withTimeout(
        updateDoc(doc(db, "users", user.uid), data),
        25000,
        "Saving took too long. Check your connection and try again."
      );

      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setAvatarUrl(nextAvatar);
      setPhotoFile(null);
      setPhotoPreview("");
      setPhotoRemoved(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onSaved) onSaved(data);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err?.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!db) { setDeleteError("Account deletion is unavailable right now. Please try again later."); return; }
    setDeleting(true);
    setDeleteError("");
    try {
      try {
        const portfolio = await getDocs(collection(db, "users", user.uid, "portfolio"));
        await Promise.all(portfolio.docs.map((d) => deleteDoc(d.ref)));
        const authored = await getDocs(query(collection(db, "reviews"), where("fromId", "==", user.uid)));
        await Promise.all(authored.docs.map((d) => deleteDoc(d.ref)));
      } catch { /* data cleanup is best effort */ }
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      await signOut();
      router.replace("/login");
    } catch (err: any) {
      setDeleteError(err?.message || "Account deletion failed. Please try again.");
      setDeleting(false);
    }
  };

  const initials = (user.displayName || user.email || "U")[0].toUpperCase();

  return (
    <div className="space-y-7">
      <form onSubmit={save} className="space-y-7">
        <div className="rounded-2xl border border-ink-100 bg-canvas p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="New profile photo preview" className="h-24 w-24 rounded-2xl object-cover shadow-card" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-24 w-24 rounded-2xl object-cover shadow-card" />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-2xl bg-brand text-3xl font-black text-white shadow-card">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-sm font-black text-ink">Profile photo</p>
              <p className="text-xs leading-5 text-ink-400">This photo appears on your public profile and in the header on every page.</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 text-xs font-extrabold text-white shadow-forest transition hover:bg-brand-700">
                  <Camera className="h-4 w-4" /> Change Profile Photo
                  <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                </label>
                {avatarUrl && !photoPreview && (
                  <button type="button" onClick={() => { setPhotoRemoved(true); setPhotoPreview(""); setPhotoFile(null); setError(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-xs font-extrabold text-ink-600 transition hover:bg-ink-50">
                    <Trash2 className="h-4 w-4" /> Remove photo
                  </button>
                )}
              </div>
              {photoPreview && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={cancelPhoto} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-xs font-extrabold text-ink-600 transition hover:bg-ink-50">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              )}
              {photoPreview && <p className="text-xs font-semibold text-brand">New photo ready to save - save your profile below.</p>}
              {photoRemoved && <p className="text-xs font-semibold text-ink-500">Current photo will be removed when you save.</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-extrabold text-ink">About</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={5}
            placeholder="Tell clients about yourself, your experience, skills and the services you provide."
            className={inputClass}
          />
          <p className="mt-1.5 text-xs font-medium text-ink-400">This is shown in the About section of your public profile.</p>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}

        <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <EducationPanel user={user} />

      {verified && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold leading-6 text-amber-700">
            As you have an identification badge, you&apos;re unable to update these details without contacting support.{" "}
            <Link href="/contact" className="font-black underline underline-offset-2">Contact Support</Link>.
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-red-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600"><AlertTriangle className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-black text-ink">Danger Zone</h3>
            <p className="text-xs font-medium text-ink-400">Actions here are permanent and cannot be undone.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-ink-600">Delete my account</p>
          <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-extrabold text-red-600 transition hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        </div>
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
              <h3 className="text-lg font-black tracking-[-0.02em] text-ink">Delete your account?</h3>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-ink-500">Are you sure you want to permanently delete your account? This action cannot be undone.</p>
            {deleteError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{deleteError}</div>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setConfirmDelete(false); setDeleteError(""); }} disabled={deleting} className="flex-1 min-h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm font-bold text-ink-600 transition hover:bg-ink-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex flex-1 min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-60">
                <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}