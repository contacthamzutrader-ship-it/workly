"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import Link from "next/link";
import { Award, Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAiResult, computeAiScore } from "@/lib/ai-score";

export default function SkillsPanel({ user }: { user: User }) {
  const [skills, setSkills] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [profile, setProfile] = useState<any>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfile(d);
          setSkills(Array.isArray(d.skills) ? d.skills.map((s: string) => s.trim()).filter(Boolean) : []);
        }
      } catch { /* Profile is optional. */ }
    })();
  }, [user]);

  const ai = useMemo(() => {
    const stored = getAiResult();
    if (stored) return stored;
    return computeAiScore({
      trustScore: typeof profile.trustScore === "number" ? profile.trustScore : 0,
      bio: profile.bio || "",
      skills,
      professionalTitle: profile.professionalTitle || "",
      certifications: profile.certifications || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills, profile.trustScore, profile.bio, profile.professionalTitle, profile.certifications]);

  const addSkill = async () => {
    setError("");
    setStatus("");
    const value = draft.trim().replace(/\s+/g, " ");
    if (!value) {
      setError("Type a skill to add.");
      return;
    }
    if (value.length > 40) {
      setError("Keep each skill under 40 characters.");
      return;
    }
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setError("You already have that skill.");
      return;
    }
    if (skills.length >= 30) {
      setError("Maximum of 30 skills reached. Remove one first.");
      return;
    }
    const next = [...skills, value];
    setSkills(next);
    setDraft("");
    await persist(next);
  };

  const removeSkill = async (index: number) => {
    const next = skills.filter((_, i) => i !== index);
    if (editingIndex === index) setEditingIndex(null);
    setSkills(next);
    await persist(next);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(skills[index]);
    setError("");
    setStatus("");
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    const value = editingValue.trim().replace(/\s+/g, " ");
    if (!value || value.length > 40) {
      setError("Skill must be between 1 and 40 characters.");
      return;
    }
    if (skills.some((s, i) => i !== editingIndex && s.toLowerCase() === value.toLowerCase())) {
      setError("You already have that skill.");
      return;
    }
    const next = skills.map((s, i) => (i === editingIndex ? value : s));
    setSkills(next);
    setEditingIndex(null);
    setEditingValue("");
    await persist(next);
  };

  const persist = async (next: string[]) => {
    if (!db) return;
    setSaved(false);
    setStatus("");
    try {
      await updateDoc(doc(db, "users", user.uid), { skills: next });
      setSaved(true);
      setStatus("Skills saved.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not save your skills.");
    }
  };

  return (
    <>
      <div className="flex gap-2 sm:flex-row flex-col">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">Add a skill</label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="e.g. React, WordPress, Graphic Design"
            className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button onClick={addSkill} className="inline-flex self-end min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Plus className="h-4 w-4" /> Add Skill</button>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Your skills ({skills.length}/30)</p>
        {skills.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 py-8 text-center">
            <Award className="mx-auto h-6 w-6 text-ink-300" />
            <p className="mt-2 text-sm font-bold text-ink">No skills yet</p>
            <p className="mt-1 text-xs text-ink-400">Add your first skill above to get found by clients.</p>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill, index) =>
              editingIndex === index ? (
                <div key={skill} className="flex items-center gap-1.5 rounded-full border border-brand bg-brand-50 py-1 pl-3 pr-1">
                  <input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingIndex(null); }}
                    autoFocus
                    className="w-32 bg-transparent text-xs font-extrabold text-brand-dark outline-none"
                  />
                  <button onClick={saveEdit} className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-700"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditingIndex(null)} className="grid h-6 w-6 place-items-center rounded-full text-ink-400 transition hover:bg-ink-100"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <span key={skill} className="group inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-1">
                  <span className="text-xs font-extrabold text-brand-dark">{skill}</span>
                  <button onClick={() => startEdit(index)} aria-label={`Edit ${skill}`} className="grid h-6 w-6 place-items-center rounded-full text-ink-400 transition hover:bg-brand-100 hover:text-brand-dark"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeSkill(index)} aria-label={`Remove ${skill}`} className="grid h-6 w-6 place-items-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              )
            )}
          </div>
        )}
      </div>

      {(error || status) && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-semibold ${error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {error || status}
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-[#00501F] p-5 text-white shadow-card">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-light" /><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">AI skill assessment</p></div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-black tracking-[-0.04em]">{ai.skillScore}</p>
            <p className="mt-1 text-xs font-medium text-white/55">Skill score from the app's AI assessment</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white/65">Confidence {ai.confidence}</p>
            {ai.takenAt && <p className="mt-0.5 text-xs text-white/40">Assessed {new Date(ai.takenAt).toLocaleDateString()}</p>}
          </div>
        </div>
        {ai.categories.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Best matching categories</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{ai.categories.map((c) => <span key={c} className="rounded-full bg-brand px-3 py-1 text-xs font-extrabold text-white">{c}</span>)}</div>
          </div>
        )}
        {ai.learning?.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {ai.learning.map((tip, i) => <li key={i} className="flex items-start gap-2 text-xs leading-5 text-white/55"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-light" /> {tip}</li>)}
          </ul>
        )}
        <Link href="/interview" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700"><Sparkles className="h-4 w-4" /> Take the skill check</Link>
      </div>
    </>
  );
}