"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { GraduationCap, Image as ImageIcon, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadEducationImage } from "@/lib/portfolio";

export interface EducationEntry {
  id?: string;
  degree?: string;
  institution?: string;
  field?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
  imageUrl?: string;
}

const inputClass = "min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function EducationPanel({ user }: { user: User }) {
  const [entries, setEntries] = useState<EducationEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [degree, setDegree] = useState("");
  const [institution, setInstitution] = useState("");
  const [field, setField] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    if (!db || !user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const ed = snap.data().education;
        setEntries(Array.isArray(ed) ? (ed as EducationEntry[]) : []);
      }
    } catch { /* Load is best-effort. */ }
    setLoaded(true);
  };

  useEffect(() => {
    (async () => { await load(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDegree("");
    setInstitution("");
    setField("");
    setStartYear("");
    setEndYear("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setExistingImage("");
    setError("");
  };

  const startAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const startEdit = (entry: EducationEntry) => {
    resetForm();
    setEditingId(entry.id || null);
    setDegree(entry.degree || "");
    setInstitution(entry.institution || "");
    setField(entry.field || "");
    setStartYear(entry.startYear || "");
    setEndYear(entry.endYear || "");
    setDescription(entry.description || "");
    setExistingImage(entry.imageUrl || "");
    setFormOpen(true);
  };

  const write = async (next: EducationEntry[]) => {
    if (!db) return;
    await updateDoc(doc(db, "users", user.uid), { education: next });
    setEntries(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setError("");
    setStatus("");
    const trimmedDegree = degree.trim();
    if (!trimmedDegree) {
      setError("Give your education entry a degree or title.");
      return;
    }
    setBusy(true);
    try {
      let imageUrl = existingImage;
      if (imageFile) imageUrl = await uploadEducationImage(user.uid, imageFile);
      const entry: EducationEntry = {
        id: editingId || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
        degree: trimmedDegree,
        institution: institution.trim(),
        field: field.trim(),
        startYear: startYear.trim(),
        endYear: endYear.trim(),
        description: description.trim(),
        imageUrl,
      };
      const next = editingId
        ? entries.map((item) => (item.id === editingId ? entry : item))
        : [...entries, entry];
      await write(next);
      resetForm();
      setStatus(editingId ? "Education updated." : "Education added.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not save your education entry.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: EducationEntry) => {
    if (!db || !entry.id) return;
    if (!confirm(`Remove "${entry.degree || "this entry"}" from your education?`)) return;
    setError("");
    setStatus("");
    try {
      await write(entries.filter((item) => item.id !== entry.id));
      setStatus("Education entry removed.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not remove the entry.");
    }
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-canvas p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><GraduationCap className="h-4 w-4" /></span>
        <div>
          <h3 className="text-sm font-black text-ink">Education</h3>
          <p className="text-xs font-medium text-ink-400">Share your degrees and upload a document photo so clients can see your credentials.</p>
        </div>
      </div>

      {formOpen ? (
        <form onSubmit={save} className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-4">
            <div>
              <h4 className="text-base font-black tracking-[-0.03em] text-ink">{editingId ? "Edit education" : "Add education"}</h4>
              <p className="mt-0.5 text-xs font-medium text-ink-400">Saved to your profile and shown on your public profile.</p>
            </div>
            <button type="button" onClick={resetForm} className="grid h-9 w-9 place-items-center rounded-xl border border-ink-100 text-ink-400 transition hover:bg-ink-50"><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Degree / Title *</label>
              <input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. Bachelor of Information Technology" className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Institution</label>
                <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. University of the Punjab" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Field of study</label>
                <input value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. Computer Science" className={inputClass} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Start year</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="e.g. 2019" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">End year</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="e.g. 2023" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What you studied or achieved." className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Degree / document photo</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-200 p-4 text-sm font-semibold text-ink-500 transition hover:border-brand">
                <ImageIcon className="h-5 w-5 text-brand" />
                <span>{imageFile ? imageFile.name : "Upload a photo of your degree or certificate (JPG, PNG or WebP, max 5 MB)"}</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                }} />
              </label>
              <div className="mt-2 flex items-center gap-3">
                {(imagePreview || existingImage) && (
                  <img src={imagePreview || existingImage} alt="Degree document" className="h-20 w-28 rounded-lg object-cover" />
                )}
                {imagePreview && <p className="text-xs font-semibold text-brand">New document ready to save.</p>}
              </div>
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

          <div className="mt-5 flex items-center gap-2">
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"><Save className="h-4 w-4" /> {busy ? "Saving..." : "Save entry"}</button>
            <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">Cancel</button>
          </div>
        </form>
      ) : (
        <>
          {status && <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600">{status}</div>}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">{loaded ? `Your education (${entries.length})` : "Your education"}</p>
            <button onClick={startAdd} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-extrabold text-white shadow-forest transition hover:bg-brand-700"><Plus className="h-3.5 w-3.5" /> Add Education</button>
          </div>

          {loaded && entries.length === 0 && !formOpen ? (
            <div className="mt-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 py-7 text-center">
              <GraduationCap className="mx-auto h-7 w-7 text-ink-300" />
              <p className="mt-2 text-sm font-black text-ink">No education added yet</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-400">Add your degrees and upload a document photo so clients get a clear idea of your studies.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:flex-row sm:items-center">
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt={`${entry.degree || "Education"} document`} className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-16 w-24 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand/40"><GraduationCap className="h-6 w-6" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-ink">{entry.degree || "Education entry"}</p>
                    {[entry.institution, entry.field, [entry.startYear, entry.endYear].filter(Boolean).join(" \u2013 ")].filter(Boolean).length > 0 && (
                      <p className="mt-0.5 text-xs font-bold text-ink-500">{[entry.institution, entry.field, [entry.startYear, entry.endYear].filter(Boolean).join(" \u2013 ")].filter(Boolean).join(" \u00b7 ")}</p>
                    )}
                    {entry.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-400">{entry.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(entry)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-xs font-extrabold text-ink-600 transition hover:bg-brand-50 hover:text-brand-dark"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => remove(entry)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}