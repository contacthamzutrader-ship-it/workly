"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, Gavel, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  listTasksByPoster,
  listBidsByUser,
  getTask,
  type Task,
  type Bid,
} from "@/lib/tasks";
import Button from "@/components/ui/Button";

type BidWithTask = Bid & { task?: Task | null };

export default function DashboardPage() {
  const { user, role, loading, signOut } = useAuth();
  const [posted, setPosted] = useState<Task[]>([]);
  const [myBids, setMyBids] = useState<BidWithTask[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading || !user) {
      if (!loading && !user) window.location.href = "/login";
      return;
    }
    (async () => {
      const p = await listTasksByPoster(user.uid);
      const b = await listBidsByUser(user.uid);
      const withTasks = await Promise.all(
        b.map(async (bid) => ({ ...bid, task: await getTask(bid.taskId) }))
      );
      setPosted(p);
      setMyBids(withTasks);
      setBusy(false);
    })();
  }, [loading, user]);

  if (loading || !user) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-ink/60">Loading...</div>;
  }

  const isAdmin = role === "company_admin" || role === "super_admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Welcome, {user.displayName || user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/post"><Button className="flex items-center gap-1.5"><Plus className="h-4 w-4" /> Post a Task</Button></Link>
          <button onClick={signOut} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/5">Logout</button>
        </div>
      </div>

      {isAdmin && (
          <Link href="/admin" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
          <ShieldCheck className="h-4 w-4" /> Admin · Approval Panel
        </Link>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Briefcase className="h-5 w-5 text-brand" /> My Posted Tasks ({posted.length})</h2>
          <div className="mt-3 space-y-3">
            {posted.length === 0 && <p className="text-sm text-ink/60">You haven&apos;t posted any tasks yet.</p>}
            {posted.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="block rounded-xl border border-ink/10 p-4 hover:border-brand/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{t.title}</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{t.status}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60">${t.budget} · {t.bidsCount} bids</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Gavel className="h-5 w-5 text-brand" /> My Bids ({myBids.length})</h2>
          <div className="mt-3 space-y-3">
            {myBids.length === 0 && <p className="text-sm text-ink/60">You haven&apos;t placed any bids yet.</p>}
            {myBids.map((b) => (
              <Link key={b.id} href={`/tasks/${b.taskId}`} className="block rounded-xl border border-ink/10 p-4 hover:border-brand/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{b.task?.title ?? "Task"}</span>
                  <span className="text-sm font-semibold text-brand">${b.amount}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60">Status: {b.status}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
