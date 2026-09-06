"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { submitContactMessage } from "@/lib/contact";

const SUBJECTS = [
  "Technical issue",
  "Account and login",
  "Payment and wallet",
  "Task or offer issue",
  "Report a user",
  "Something else",
];

const inputClass =
  "min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink placeholder:text-ink-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export default function ContactPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Please enter a valid email address.";
    if (!subject) next.subject = "Please choose a subject.";
    if (message.trim().length < 20) next.message = "Please write a message of at least 20 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await submitContactMessage({ name, email, subject, message, uid: user?.uid });
      setSent(true);
    } catch {
      setErrors({ form: "We could not send the message right now. Please check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setSent(false);
    setMessage("");
    setSubject("");
    setUserPrefill();
  };

  const setUserPrefill = () => {
    setErrors({});
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  };

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><MessageCircle className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">SUPPORT CENTRE</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Contact Us</h1>
              <p className="mt-1 text-sm text-white/55">Send a message to the Parwaz support team and we will reply to your email.</p>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="surface mt-6 flex flex-col items-center p-10 text-center sm:p-14">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand"><CheckCircle2 className="h-8 w-8" /></span>
            <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-ink">Message sent</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">Thank you, {name.trim().split(" ")[0]}. Your message was saved in our support queue and we will get back to you at <span className="font-bold text-ink">{email}</span> as soon as possible.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <button onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Send another message <Send className="h-4 w-4" /></button>
              <Link href="/help" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">Back to help centre</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="surface mt-6 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-ink-500">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={`${inputClass} ${errors.name ? "border-red-300" : ""}`} />
                {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-ink-500">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={`${inputClass} ${errors.email ? "border-red-300" : ""}`} />
                {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-ink-500">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={`${inputClass} ${errors.subject ? "border-red-300" : ""}`}>
                <option value="">Choose a subject...</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.subject && <p className="mt-1 text-xs font-semibold text-red-600">{errors.subject}</p>}
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-ink-500">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe your question or issue - the more detail you give, the faster we can help." className={`${inputClass} resize-none ${errors.message ? "border-red-300" : ""}`} />
              <div className="mt-1 flex items-center justify-between">
                {errors.message ? <p className="text-xs font-semibold text-red-600">{errors.message}</p> : <span />}
                <span className="text-[11px] font-medium text-ink-300">{message.trim().length} characters</span>
              </div>
            </div>
            {errors.form && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{errors.form}</div>}
            <button type="submit" disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.99] disabled:opacity-60 sm:w-auto">
              {busy ? "Sending..." : "Submit"} <Send className="h-4 w-4" />
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-400"><Mail className="h-3.5 w-3.5" /> {loading ? "Loading your details..." : user ? "Your account email was filled in automatically." : "Signed in users get their details filled in automatically."}</p>
          </form>
        )}

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#00501F] p-6 text-white shadow-card sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand"><MessageCircle className="h-6 w-6" /></div>
            <div>
              <h2 className="text-lg font-black tracking-[-0.03em]">Prefer live chat?</h2>
              <p className="mt-0.5 text-sm text-white/55">Message support directly inside the app - replies land in your inbox.</p>
            </div>
          </div>
          <Link href="/messages" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Open live chat <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}