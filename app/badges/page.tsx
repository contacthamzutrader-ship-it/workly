"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BadgeCheck, BriefcaseBusiness, CheckCircle2, GraduationCap, Medal, ShieldCheck, Sparkles, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listTasksAssignedTo } from "@/lib/tasks";
import { formatDate } from "@/lib/format";

interface Badge {
  key: string;
  name: string;
  desc: string;
  icon: any;
  earned: boolean;
  detail: string;
  date?: string;
}

export default function BadgesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [assignedCount, setAssignedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/badges"); }, [loading, user, router]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile(snap.data());
      } catch { /* Profile is optional. */ }
      try {
        const assigned = await listTasksAssignedTo(user.uid);
        setAssignedCount(assigned.length);
        setCompletedCount(assigned.filter((t) => t.status === "completed").length);
      } catch { /* Stats are secondary. */ }
    })();
  }, [user]);

  if (loading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;

  const skillsCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
  const trustScore = typeof profile?.trustScore === "number" ? profile.trustScore : 0;
  const interviewPassed = Boolean(profile?.interviewPassed);
  const profileComplete = Boolean(profile?.profileComplete);
  const profileUpdatedAt = profile?.profileUpdatedAt || "";

  const badges: Badge[] = [
    { key: "email", name: "Email verified", desc: "Your email address is confirmed on your account.", icon: BadgeCheck, earned: user.emailVerified, detail: user.emailVerified ? "Earned" : "Verify your email to unlock.", date: undefined },
    { key: "complete", name: "Profile complete", desc: "Your name, bio and city are all filled in.", icon: User, earned: profileComplete, detail: profileComplete ? "Earned" : "Fill in name, bio and city.", date: profileUpdatedAt ? formatDate(profileUpdatedAt) : undefined },
    { key: "skills", name: "Skills listed", desc: "You added skills so clients can find you.", icon: Award, earned: skillsCount > 0, detail: skillsCount > 0 ? "Earned" : "Add a skill to unlock." },
    { key: "first", name: "First assignment", desc: "A client selected you for a task.", icon: BriefcaseBusiness, earned: assignedCount > 0, detail: assignedCount > 0 ? `Earned on ${assignedCount} assignment${assignedCount !== 1 ? "s" : ""}` : "Get selected for your first task." },
    { key: "pro", name: "Task Pro", desc: "You completed a task end to end.", icon: CheckCircle2, earned: completedCount > 0, detail: completedCount > 0 ? `Earned on ${completedCount} task${completedCount !== 1 ? "s" : ""}` : "Complete a task to unlock." },
    { key: "trusted", name: "Trusted talent", desc: "You reached a trust score of 80 or higher.", icon: ShieldCheck, earned: trustScore >= 80, detail: trustScore >= 80 ? `Earned at ${trustScore}` : `Score ${trustScore}/100 - keep delivering quality work.` },
    { key: "verified", name: "Verified talent", desc: "You passed the AI skill check and completed work.", icon: GraduationCap, earned: interviewPassed && completedCount > 0, detail: interviewPassed ? "Skill check passed - complete work to finalise." : "Pass the AI skill check to unlock." },
  ];

  const earned = badges.filter((b) => b.earned);

  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Medal className="h-7 w-7" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">Account centre</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Badges</h1>
                <p className="mt-1 text-sm text-white/55">Milestones that build client trust. Every badge is earned - never awarded manually.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/65"><Medal className="h-4 w-4 text-brand-300" /> {earned.length}/{badges.length} earned</div>
          </div>
        </div>

        {earned.length === 0 ? (
          <div className="surface mt-6 p-8 text-center">
            <Medal className="mx-auto h-10 w-10 text-ink-300" />
            <h2 className="mt-3 text-lg font-black text-ink">No badges earned yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-400">Badges unlock as you complete real actions on the platform - verifying your email, completing your profile, getting assigned and delivering work. Keep going and your first badge will appear here.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <div className="rounded-full border border-ink-100 bg-ink-50 px-4 py-2 text-xs font-extrabold text-ink-600">Verify your email</div>
              <div className="rounded-full border border-ink-100 bg-ink-50 px-4 py-2 text-xs font-extrabold text-ink-600">Complete your profile</div>
              <div className="rounded-full border border-ink-100 bg-ink-50 px-4 py-2 text-xs font-extrabold text-ink-600">Apply for tasks</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <div key={b.key} className={`rounded-3xl border p-5 shadow-card transition ${b.earned ? "border-green-200 bg-white" : "border-ink-100 bg-ink-50/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${b.earned ? "bg-green-600 text-white" : "bg-ink-100 text-ink-300"}`}><b.icon className="h-6 w-6" /></span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${b.earned ? "bg-green-50 text-green-700" : "bg-ink-100 text-ink-400"}`}>{b.earned ? "Earned" : "Locked"}</span>
                </div>
                <div className="mt-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-black text-ink">{b.name}{b.earned && <Sparkles className="h-3.5 w-3.5 text-green-600" />}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink-400">{b.desc}</p>
                </div>
                <p className="mt-3 text-[11px] font-bold text-ink-500">{b.detail}</p>
                {b.earned && b.date && <p className="mt-1 text-[11px] font-medium text-ink-300">Awarded {b.date}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}