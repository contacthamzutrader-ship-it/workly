"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Check, Handshake, Save, BriefcaseBusiness, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES } from "@/lib/tasks";

interface TaskAlerts {
  enabled: boolean;
  categories: string[];
  notifyOffer: boolean;
  notifyAssignment: boolean;
  notifyPayout: boolean;
}

const DEFAULTS: TaskAlerts = { enabled: true, categories: [], notifyOffer: true, notifyAssignment: true, notifyPayout: true };

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

export default function TaskerAlertPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [prefs, setPrefs] = useState<TaskAlerts>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/tasker-alert"); }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().taskAlerts) {
          const stored = snap.data().taskAlerts;
          setPrefs({
            ...DEFAULTS,
            enabled: typeof stored.enabled === "boolean" ? stored.enabled : true,
            categories: Array.isArray(stored.categories) ? stored.categories : [],
            notifyOffer: typeof stored.notifyOffer === "boolean" ? stored.notifyOffer : true,
            notifyAssignment: typeof stored.notifyAssignment === "boolean" ? stored.notifyAssignment : true,
            notifyPayout: typeof stored.notifyPayout === "boolean" ? stored.notifyPayout : true,
          });
        }
      } catch { /* Falls back to defaults. */ }
      setLoaded(true);
    })();
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const toggleCategory = (category: string) => {
    setSaved(false);
    setStatus("");
    setPrefs((p) => ({
      ...p,
      categories: p.categories.includes(category) ? p.categories.filter((c) => c !== category) : [...p.categories, category],
    }));
  };

  const save = async () => {
    if (!db) return;
    setError("");
    setStatus("");
    try {
      await updateDoc(doc(db, "users", user.uid), { taskAlerts: prefs });
      setSaved(true);
      setStatus("Tasker alerts saved.");
      setTimeout(() => setStatus(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Could not save your alerts.");
    }
  };

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-3xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><BellRing className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Account centre</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Tasker Alert</h1>
              <p className="mt-1 text-sm text-white/55">Control the tasks and alerts you receive as a freelancer.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><BellRing className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">Task alerts</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-400">{prefs.enabled ? "You will be alerted about new tasks that match your preferences." : "Alerts are paused - you will not receive task alerts."}</p>
              </div>
            </div>
            <Toggle on={prefs.enabled} onClick={() => { setSaved(false); setStatus(""); setPrefs((p) => ({ ...p, enabled: !p.enabled })); }} />
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Preferred task categories</p>
            <p className="mt-1 text-xs leading-5 text-ink-400">Select the categories that interest you. Empty means all categories on the platform. Categories come from the live task catalogue.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const selected = prefs.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                      selected ? "border-brand bg-brand text-white shadow-forest" : "border-ink-200 bg-white text-ink-600 hover:border-brand/40"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Relevant task notifications</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Handshake className="h-5 w-5" /></span>
                  <div className="min-w-0"><p className="text-sm font-black text-ink">Offer responses</p><p className="mt-0.5 text-xs leading-5 text-ink-400">When a client accepts or comments on your offer.</p></div>
                </div>
                <Toggle on={prefs.notifyOffer} onClick={() => { setSaved(false); setStatus(""); setPrefs((p) => ({ ...p, notifyOffer: !p.notifyOffer })); }} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-5 w-5" /></span>
                  <div className="min-w-0"><p className="text-sm font-black text-ink">New assignments</p><p className="mt-0.5 text-xs leading-5 text-ink-400">Private assignments and tasks you get selected for.</p></div>
                </div>
                <Toggle on={prefs.notifyAssignment} onClick={() => { setSaved(false); setStatus(""); setPrefs((p) => ({ ...p, notifyAssignment: !p.notifyAssignment })); }} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600"><Coins className="h-5 w-5" /></span>
                  <div className="min-w-0"><p className="text-sm font-black text-ink">Payment alerts</p><p className="mt-0.5 text-xs leading-5 text-ink-400">When held payments are released to your wallet.</p></div>
                </div>
                <Toggle on={prefs.notifyPayout} onClick={() => { setSaved(false); setStatus(""); setPrefs((p) => ({ ...p, notifyPayout: !p.notifyPayout })); }} />
              </div>
            </div>
          </div>

          {!loaded && <p className="mt-4 text-sm font-medium text-ink-400">Loading your alerts...</p>}
          {saved && <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600"><Check className="h-4 w-4" /> {status}</div>}
          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"><Save className="h-4 w-4" /> Save alerts</button>
            <span className="text-xs font-medium text-ink-400">Your alert preferences apply across the platform.</span>
          </div>
        </div>
      </div>
    </div>
  );
}