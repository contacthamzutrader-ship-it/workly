"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ArrowUpRight, FolderOpen, Image as ImageIcon, Link2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPortfolioImage, type PortfolioItem } from "@/lib/portfolio";

export default function PortfolioPanel({ user }: { user: User }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsDraft, setSkillsDraft] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "users", user.uid, "portfolio"), orderBy("createdAt", "desc")));
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioItem));
      } catch { /* Load is best-effort. */ }
      setLoaded(true);
    })();
  }, [user]);

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSkillsDraft("");
    setLink("");
    setImageFile(null);
    setError("");
  };

  const startAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const startEdit = (item: PortfolioItem) => {
    resetForm();
    setEditingId(item.id || null);
    setTitle(item.title);
    setDescription(item.description || "");
    setSkillsDraft((item.skills || []).join(", "));
    setLink(item.link || "");
    setFormOpen(true);
  };

  const reload = async () => {
    if (!db) return;
    const snap = await getDocs(query(collection(db, "users", user.uid, "portfolio"), orderBy("createdAt", "desc")));
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioItem));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setError("");
    setStatus("");
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give your project a title.");
      return;
    }
    const skills = skillsDraft.split(",").map((s) => s.trim()).filter(Boolean);
    if (skills.length > 30) {
      setError("Keep the skills list under 30 items.");
      return;
    }
    const trimmedLink = link.trim();
    if (trimmedLink && !/^https?:\/\//i.test(trimmedLink)) {
      setError("Project link must start with http:// or https://");
      return;
    }
    setBusy(true);
    try {
      let imageUrl = items.find((i) => i.id === editingId)?.imageUrl || "";
      if (imageFile) imageUrl = await uploadPortfolioImage(user.uid, imageFile);
      const data: any = {
        title: trimmedTitle,
        description: description.trim(),
        skills,
        link: trimmedLink,
        imageUrl,
      };
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "portfolio", editingId), data);
      } else {
        await addDoc(collection(db, "users", user.uid, "portfolio"), { ...data, createdAt: serverTimestamp() });
      }
      await reload();
      resetForm();
      setStatus(editingId ? "Project updated." : "Project added to your portfolio.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not save your project.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: PortfolioItem) => {
    if (!db || !item.id) return;
    if (!confirm(`Delete "${item.title}" from your portfolio?`)) return;
    setError("");
    setStatus("");
    try {
      await deleteDoc(doc(db, "users", user.uid, "portfolio", item.id));
      await reload();
      setStatus("Project deleted.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not delete the project.");
    }
  };

  const inputClass = "min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <>
      {formOpen && (
        <form onSubmit={save} className="rounded-2xl border border-ink-100 bg-canvas p-5">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-4">
            <div>
              <h2 className="text-base font-black tracking-[-0.03em] text-ink">{editingId ? "Edit project" : "New project"}</h2>
              <p className="mt-0.5 text-xs font-medium text-ink-400">Saved to your private portfolio on Parwaz.</p>
            </div>
            <button type="button" onClick={resetForm} className="grid h-9 w-9 place-items-center rounded-xl border border-ink-100 text-ink-400 transition hover:bg-ink-50"><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Project title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. E-commerce store redesign" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What you delivered, the goal and the outcome." className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Skills used (comma separated)</label>
              <input value={skillsDraft} onChange={(e) => setSkillsDraft(e.target.value)} placeholder="e.g. React, Figma, Shopify" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Project link</label>
              <input value={link} onChange={(e) => setLink(e.target.value)} type="url" placeholder="https://example.com" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Project image</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-200 p-4 text-sm font-semibold text-ink-500 transition hover:border-brand">
                <ImageIcon className="h-5 w-5 text-brand" />
                <span>{imageFile ? imageFile.name : "Upload a thumbnail (JPG, PNG or WebP, max 5 MB)"}</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
              {imageFile && <p className="mt-1.5 truncate text-xs text-brand">{imageFile.name}</p>}
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

          <div className="mt-5 flex items-center gap-2">
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"><Save className="h-4 w-4" /> {busy ? "Saving..." : "Save project"}</button>
            <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">Cancel</button>
          </div>
        </form>
      )}

      {!formOpen && (status || error) && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-semibold ${error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{error || status}</div>
      )}

      {!loaded ? (
        <div className="flex min-h-32 items-center justify-center text-sm font-medium text-ink-400">Loading your portfolio...</div>
      ) : items.length === 0 && !formOpen ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 py-8 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-ink-300" />
          <h3 className="mt-2 text-base font-black text-ink">Your portfolio is empty</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-400">Add your first project to give clients real examples of what you can deliver. Projects appear on your public profile.</p>
          <button onClick={startAdd} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700"><Plus className="h-4 w-4" /> Add your first project</button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Your projects ({items.length})</p>
            {!formOpen && (
              <button onClick={startAdd} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-extrabold text-white shadow-forest transition hover:bg-brand-700"><Plus className="h-3.5 w-3.5" /> Add Project</button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="grid h-36 w-full place-items-center bg-brand-50 text-brand/40"><ImageIcon className="h-8 w-8" /></div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-black text-ink">{item.title}</h3>
                  {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{item.description}</p>}
                  {(item.skills || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(item.skills || []).slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-dark">{skill}</span>)}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-xs font-extrabold text-ink-600 transition hover:bg-brand-50 hover:text-brand-dark"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => remove(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-extrabold text-brand"><Link2 className="h-3.5 w-3.5" /> Open <ArrowUpRight className="h-3.5 w-3.5" /></a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}