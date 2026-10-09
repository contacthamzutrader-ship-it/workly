"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  ExternalLink,
  FolderKanban,
  MapPin,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatPKR, formatDate } from "@/lib/format";
import {
  listPublicTasks,
  listBidsByUser,
  listTasksAssignedTo,
  type Task,
  type Bid,
} from "@/lib/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<Task[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [profileData, setProfileData] = useState<{
    wallet: number;
    trustScore: number;
    skills: string[];
    professionalTitle: string;
    interviewPassed: boolean;
  }>({
    wallet: 0,
    trustScore: 70,
    skills: [],
    professionalTitle: "Freelance Specialist",
    interviewPassed: false,
  });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [tasks, bids, assigned] = await Promise.all([
          listPublicTasks(),
          listBidsByUser(user.uid),
          listTasksAssignedTo(user.uid),
        ]);

        setAvailable(tasks.filter((t) => t.status === "open").slice(0, 6));
        setMyBids(bids);
        setAssignedTasks(assigned);

        if (db) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const d = userSnap.data();
            setProfileData({
              wallet: d.wallet || 0,
              trustScore: d.trustScore || 70,
              skills: d.skills || [],
              professionalTitle: d.professionalTitle || "Digital Freelancer",
              interviewPassed: Boolean(d.interviewPassed),
            });
          }
        }
      } catch (err) {
        console.error("Error loading tasker dashboard:", err);
      } finally {
        setBusy(false);
      }
    })();
  }, [user]);

  const firstName = (user?.displayName || user?.email || "there").split(" ")[0];
  const pendingBidsCount = myBids.filter((b) => b.status === "pending").length;
  const activeContractsCount = assignedTasks.filter(
    (t) => t.status === "assigned" || t.status === "in_progress"
  ).length;

  if (busy) {
    return (
      <div className="font-ui space-y-6">
        <div className="h-32 animate-pulse rounded-2xl bg-ink-50" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-50" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-ink-50" />
      </div>
    );
  }

  return (
    <div className="font-ui space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-deep via-[#003B16] to-[#00280F] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> Freelancer Workspace
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1.5 text-sm text-white/70 max-w-xl">
              {profileData.professionalTitle} · Browse open client requests, submit proposals, and build your freelance career.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/browse"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700"
            >
              Browse Projects <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <User className="h-4 w-4" /> My Profile
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metric Cards */}
      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Link
          href="/wallet"
          className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-ink-400 group-hover:text-brand">
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-ink">{formatPKR(profileData.wallet)}</p>
          <span className="mt-1 block text-xs font-medium text-ink-400 group-hover:text-brand">
            Manage wallet →
          </span>
        </Link>

        <Link
          href="/projects?tab=pending"
          className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-ink-400 group-hover:text-brand">
            <span className="text-xs font-bold uppercase tracking-wider">Active Proposals</span>
            <Send className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-ink">{pendingBidsCount}</p>
          <span className="mt-1 block text-xs font-medium text-ink-400 group-hover:text-brand">
            View submitted offers →
          </span>
        </Link>

        <Link
          href="/projects?tab=active"
          className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-ink-400 group-hover:text-brand">
            <span className="text-xs font-bold uppercase tracking-wider">Contracts Active</span>
            <FolderKanban className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-ink">{activeContractsCount}</p>
          <span className="mt-1 block text-xs font-medium text-ink-400 group-hover:text-brand">
            In-progress milestones →
          </span>
        </Link>

        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-xs font-bold uppercase tracking-wider">Trust Score</span>
            <Award className="h-5 w-5 text-brand" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-ink">{profileData.trustScore}/100</p>
            {profileData.interviewPassed && (
              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-bold text-green-700">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-ink-400">Based on client ratings & activity</p>
        </div>
      </section>

      {/* AI Skill Badge Callout (Promotional & inspiring) */}
      {!profileData.interviewPassed && (
        <section className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50/70 via-white to-brand-50/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Earn your official AI-Verified Skill Badge
                </h3>
                <p className="mt-1 text-sm text-ink-600 max-w-xl">
                  Stand out to high-budget clients! Taking our quick AI-powered skill check showcases your expertise and boosts your proposal ranking by up to +30%.
                </p>
              </div>
            </div>
            <Link
              href="/interview"
              className="inline-flex shrink-0 min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700"
            >
              Take Skill Assessment <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Recommended Jobs */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div>
            <p className="page-eyebrow">Matched For You</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Recommended jobs for you</h2>
          </div>
          <Link
            href="/browse"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-700"
          >
            Explore marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {available.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
              <BriefcaseBusiness className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-ink">No open tasks right now</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">
              New client requests appear here regularly. Check the browse page to see all marketplace categories.
            </p>
            <Link
              href="/browse"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              Browse all jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {available.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-canvas sm:px-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold text-ink transition group-hover:text-brand-dark">
                      {t.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-500">
                      {t.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold tracking-[-0.02em] text-ink">
                      {formatPKR(t.budget)}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium text-ink-400">
                      {t.bidsCount} {t.bidsCount === 1 ? "offer" : "offers"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-ink-400" /> {t.location}
                  </span>
                  {t.deadline && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-ink-400" /> Due {formatDate(t.deadline)}
                    </span>
                  )}
                  <span className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand-50 px-3.5 text-[13px] font-bold text-brand transition group-hover:bg-brand group-hover:text-white">
                    Submit Proposal <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}