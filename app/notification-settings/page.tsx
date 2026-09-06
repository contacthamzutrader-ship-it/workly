"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, BriefcaseBusiness, Check, Coins, Handshake, Mail, Megaphone, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type PrefKey = "newTask" | "offer" | "project" | "payment" | "message" | "system";
type Prefs = Record<PrefKey, boolean>;

const DEFAULT_PREFS: Prefs = { newTask: true, offer: true, project: true, payment: true, message: true, system: true };

const OPTIONS: { key: PrefKey; label: string; desc: string; icon: any }[] = [
  { key: "newTask", label: "New Task Notifications", desc: "New tasks that match your skills and category.", icon: Megaphone },
  { key: "offer", label: "Offer Notifications", desc: "When a client accepts your offer or replies to a bid.", icon: Handshake },
  { key: "project", label: "Project Notifications", desc: "Assignments, milestones and task updates.", icon: BriefcaseBusiness },
  { key: "payment", label: "Payment Notifications", desc: "Payouts, held payments and refunds hitting your wallet.", icon: Coins },
  { key: "message", label: "Message Notifications", desc: "New messages from clients and support.", icon: Mail },
  { key: "system", label: "System Notifications", desc: "Security, policy and platform announcements.", icon: BellRing },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-ink-200"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/notification-settings"); }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().notificationPrefs) {
          setPrefs({ ...DEFAULT_PREFS, ...snap.data().notificationPrefs });
        }
      } catch { /* Preferences fall back to defaults. */ }
      setLoaded(true);
    })();
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const toggle = (key: PrefKey) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setStatus("");
    setSaved(false);
  };

  const save = async () => {
    if (!db) return;
    setError("");
    setStatus("");
    try {
      await updateDoc(doc(db, "users", user.uid), { notificationPrefs: prefs });
      setSaved(true);
      setStatus("Notification preferences saved.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not save your preferences.");
    }
  };

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-3xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Bell className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Account centre</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Notification Settings</h1>
              <p className="mt-1 text-sm text-white/55">Choose what you want to be notified about.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <div className="space-y-2">
            {OPTIONS.map((opt) => (
              <div key={opt.key} className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><opt.icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">{opt.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-400">{opt.desc}</p>
                  </div>
                </div>
                <Toggle on={prefs[opt.key]} onClick={() => toggle(opt.key)} />
              </div>
            ))}
          </div>

          {!loaded && <p className="mt-4 text-sm font-medium text-ink-400">Loading your preferences...</p>}
          {saved && <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600"><Check className="h-4 w-4" /> {status}</div>}
          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save preferences</button>
            <span className="text-xs font-medium text-ink-400">Stored securely on your account.</span>
          </div>
        </div>
      </div>
    </div>
  );
}