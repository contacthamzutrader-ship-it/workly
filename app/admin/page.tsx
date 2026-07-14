"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Clock, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  listPendingTasks,
  listPrivateTasks,
  approveTask,
  type Task,
} from "@/lib/tasks";
import Button from "@/components/ui/Button";

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<Task[]>([]);
  const [privateTasks, setPrivateTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(true);

  const isAdmin = role === "company_admin" || role === "super_admin";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  const load = async () => {
    setBusy(true);
    try {
      setPending(await listPendingTasks());
      setPrivateTasks(await listPrivateTasks());
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (loading || !user) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-ink/60">Loading...</div>;
  }
  if (!isAdmin) return null;

  const approve = async (taskId: string, visibility: "public" | "private") => {
    await approveTask(taskId, visibility);
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink"><ShieldCheck className="h-6 w-6 text-brand" /> Admin · Approval Panel</h1>
      <p className="mt-1 text-sm text-ink/60">Review manual tasks and manage private work.</p>

      {busy ? (
        <p className="mt-8 text-ink/60">Loading...</p>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Clock className="h-5 w-5 text-brand" /> Pending Approval ({pending.length})</h2>
            <div className="mt-3 space-y-3">
              {pending.length === 0 && <p className="text-sm text-ink/60">Nothing pending.</p>}
              {pending.map((t) => (
                <div key={t.id} className="rounded-xl border border-ink/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{t.title}</span>
                    <span className="text-sm text-ink/50">${t.budget}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">{t.description}</p>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => approve(t.id!, "public")}>Approve Public</Button>
                    <Button variant="secondary" onClick={() => approve(t.id!, "private")}>Approve Private</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Lock className="h-5 w-5 text-brand" /> Private Tasks ({privateTasks.length})</h2>
            <p className="mt-1 text-sm text-ink/60">
              Only our team sees these. Open one and place the single bid, then select it to assign to us.
            </p>
            <div className="mt-3 space-y-3">
              {privateTasks.length === 0 && <p className="text-sm text-ink/60">No private tasks.</p>}
              {privateTasks.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="block rounded-xl border border-ink/10 p-4 hover:border-brand/40">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{t.title}</span>
                    <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-white">{t.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">${t.budget} · {t.bidsCount} bids</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
