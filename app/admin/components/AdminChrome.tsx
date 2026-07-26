"use client";

import Link from "next/link";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import type { Permission, StaffSession } from "@/lib/roles";
import { STAFF_ROLE_LABELS } from "@/lib/roles";

export type TabId =
  | "overview"
  | "approvals"
  | "tasks"
  | "interviews"
  | "finance"
  | "people"
  | "staff"
  | "settings"
  | "audit";

export interface TabDefinition {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission | null;
  count?: number;
}

export function AdminHeader({
  session,
  email,
  onSignOut,
}: {
  session: StaffSession;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-elevated sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-[-0.03em]">Workly Control</h1>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-brand-300">
                {session.isOwner ? "Owner" : STAFF_ROLE_LABELS[session.role]}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-white/50">
              {email} · {session.isOwner ? "full platform control" : `${session.permissions.length} permissions`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 lg:flex">
            <span className="h-2 w-2 rounded-full bg-brand-light" /> Systems operational
          </span>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-white/15 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Marketplace view <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={onSignOut}
            className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-4 text-sm font-bold text-ink transition hover:bg-brand-100"
          >
            Sign out <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabDefinition[];
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-ink-100 bg-white p-2 shadow-card">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${
            active === tab.id ? "bg-ink text-white shadow-sm" : "text-ink-500 hover:bg-ink-50 hover:text-ink"
          }`}
        >
          <tab.icon className="h-4 w-4" /> {tab.label}
          {typeof tab.count === "number" && tab.count > 0 && (
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${
                active === tab.id ? "bg-brand text-white" : "bg-amber-100 text-amber-700"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5 sm:p-6">
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-400">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
