"use client";

import { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { Award, BadgeCheck, BriefcaseBusiness, CheckCircle2, GraduationCap, Medal, ShieldCheck, Sparkles, User } from "lucide-react";
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

export default function BadgesPanel({ user }: { user: FirebaseUser }) {
  const [profile, setProfile] = useState<any>(null);
  const [assignedCount, setAssignedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

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
    <>
      {earned.length === 0 ? (
        <div className="text-center py-4">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    </>
  );
}