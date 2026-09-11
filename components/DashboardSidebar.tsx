"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, HelpCircle, Home, LayoutDashboard, MapPin, Menu, Settings, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useDashboardPrefs, type DashboardFilters, type DashboardSort, type RemoteMode } from "@/components/DashboardPrefs";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const REMOTE_MODES: { key: RemoteMode; label: string }[] = [
  { key: "all", label: "All" },
  { key: "remote", label: "Remote" },
  { key: "in_person", label: "In Person" },
];

const SORT_OPTIONS: { key: DashboardSort; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "recent", label: "Most recently posted" },
  { key: "due_soon", label: "Due soon" },
  { key: "lowest_price", label: "Lowest price" },
  { key: "highest_price", label: "Highest price" },
];

const FILTER_OPTS: { key: keyof DashboardFilters; label: string }[] = [
  { key: "availableOnly", label: "Available tasks only" },
  { key: "hideAssigned", label: "Hide tasks that are already assigned" },
  { key: "noOffersOnly", label: "Tasks with no offers only" },
  { key: "hideHasOffers", label: "Hide tasks that have offers" },
];

const PRICE_MIN = 0;
const PRICE_MAX = 200000;

type PanelKey = "remote" | "price" | "filter" | "sort" | null;

function Pkr({ value }: { value: number }) {
  return <>{value.toLocaleString("en-PK")}</>;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { filters, sort, priceRange, remoteMode, setFilters, setSort, setPriceRange, setRemoteMode } = useDashboardPrefs();

  const [openPanel, setOpenPanel] = useState<PanelKey>(null);
  const [filterDraft, setFilterDraft] = useState<DashboardFilters>(filters);
  const [priceDraft, setPriceDraft] = useState<{ min: number; max: number }>(priceRange || { min: PRICE_MIN, max: PRICE_MAX });
  const [remoteDraft, setRemoteDraft] = useState<RemoteMode>(remoteMode);
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setCity(snap.data().city || "");
      } catch {
        // City is optional and only shown as context in the sidebar.
      }
    })();
  }, [user]);

  const openPanelWith = (key: NonNullable<PanelKey>) => {
    if (openPanel === key) {
      setOpenPanel(null);
      return;
    }
    if (key === "filter") setFilterDraft(filters);
    if (key === "price") setPriceDraft(priceRange || { min: PRICE_MIN, max: PRICE_MAX });
    if (key === "remote") setRemoteDraft(remoteMode);
    setOpenPanel(key);
  };

  const applyRemote = () => { setRemoteMode(remoteDraft); setOpenPanel(null); onNavigate?.(); };
  const applyPrice = () => { setPriceRange(priceDraft); setOpenPanel(null); onNavigate?.(); };
  const applyFilter = () => { setFilters(filterDraft); setOpenPanel(null); onNavigate?.(); };
  const cancelPanel = () => setOpenPanel(null);
  const pickSort = (key: DashboardSort) => { setSort(key); setOpenPanel(null); onNavigate?.(); };

  const isActive = (href: string) => pathname === href;

  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
      active ? "bg-white/15 font-semibold text-white" : "font-medium text-white/85 hover:bg-white/10 hover:text-white"
    }`;

  const triggerClass = (open: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
      open ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;

  const panelShell = (
    <div className="mt-1.5 rounded-xl bg-white p-3 text-ink shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-400">
          {openPanel === "remote" ? "Task type" : openPanel === "price" ? "Budget range" : openPanel === "filter" ? "Task filters" : "Sort by"}
        </p>
        <button onClick={cancelPanel} aria-label="Close panel" className="grid h-6 w-6 place-items-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink"><X className="h-3.5 w-3.5" /></button>
      </div>

      {openPanel === "remote" && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {REMOTE_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setRemoteDraft(m.key)}
                className={`rounded-lg px-2 py-2 text-xs font-bold transition ${remoteDraft === m.key ? "bg-brand text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Your area</p>
              <p className="truncate text-sm font-bold text-ink">{city || "Not set — add in Profile"}</p>
            </div>
          </div>
        </>
      )}

      {openPanel === "price" && (
        <>
          <div className="flex items-center justify-between text-sm font-bold text-ink">
            <span>PKR <Pkr value={priceDraft.min} /></span>
            <span className="text-ink-400">–</span>
            <span>PKR <Pkr value={priceDraft.max} /></span>
          </div>
          <div className="relative mt-4 h-5">
            <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink-100" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand"
              style={{ left: `${(priceDraft.min / PRICE_MAX) * 100}%`, right: `${100 - (priceDraft.max / PRICE_MAX) * 100}%` }}
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={100}
              value={priceDraft.min}
              aria-label="Minimum price"
              onChange={(e) => {
                const v = Number(e.target.value);
                setPriceDraft({ ...priceDraft, min: Math.min(v, priceDraft.max) });
              }}
              className="pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={100}
              value={priceDraft.max}
              aria-label="Maximum price"
              onChange={(e) => {
                const v = Number(e.target.value);
                setPriceDraft({ ...priceDraft, max: Math.max(v, priceDraft.min) });
              }}
              className="pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow"
            />
          </div>
        </>
      )}

      {openPanel === "filter" && (
        <div className="space-y-2">
          {FILTER_OPTS.map((opt) => (
            <label key={opt.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm font-medium text-ink-700 transition hover:bg-ink-50">
              <input
                type="checkbox"
                checked={filterDraft[opt.key]}
                onChange={(e) => setFilterDraft({ ...filterDraft, [opt.key]: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300 accent-[#228B22]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {openPanel === "sort" && (
        <div className="space-y-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => pickSort(opt.key)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${sort === opt.key ? "bg-brand-50 text-brand" : "text-ink-600 hover:bg-ink-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {openPanel !== "sort" && (
        <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
          <button
            onClick={cancelPanel}
            className="flex-1 min-h-9 rounded-lg border border-ink-200 bg-white text-xs font-bold text-ink-600 transition hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            onClick={openPanel === "remote" ? applyRemote : openPanel === "price" ? applyPrice : applyFilter}
            className="flex-1 min-h-9 rounded-lg bg-brand px-3 text-xs font-bold text-white transition hover:bg-brand-700"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );

  const FILTER_ITEMS = useMemo(
    () => [
      {
        key: "remote" as const,
        label: "Remote Task Only",
        badge:
          remoteMode !== "all"
            ? REMOTE_MODES.find((m) => m.key === remoteMode)?.label
            : undefined,
      },
      {
        key: "price" as const,
        label: "Any Price",
        badge:
          priceRange && typeof priceRange.min === "number" && typeof priceRange.max === "number"
            ? `PKR ${priceRange.min.toLocaleString("en-PK")} – ${priceRange.max.toLocaleString("en-PK")}`
            : undefined,
      },
      { key: "filter" as const, label: "Other Filter", badge: undefined },
      { key: "sort" as const, label: "Sort", badge: SORT_OPTIONS.find((s) => s.key === sort)?.label },
    ],
    [remoteMode, priceRange, sort]
  );

  const go = () => setOpenPanel(null);

  return (
    <nav className="space-y-4">
      <div>
        <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Home</p>
        <div className="mt-1.5 space-y-1">
          <Link href="/browse" onClick={onNavigate} className={itemClass(isActive("/browse"))}>
            <Home className="h-[18px] w-[18px] shrink-0 text-white/80" /> Home
          </Link>
          <Link href="/dashboard" onClick={onNavigate} className={itemClass(isActive("/dashboard"))}>
            <LayoutDashboard className="h-[18px] w-[18px] shrink-0 text-white/80" /> Dashboard
          </Link>
        </div>
      </div>

      <div>
        <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Discover</p>
        <div className="mt-1.5 space-y-1">
          {FILTER_ITEMS.map((item) => (
            <div key={item.key}>
              <button onClick={() => openPanelWith(item.key)} className={triggerClass(openPanel === item.key)}>
                <ChevronDown className={`h-[15px] w-[15px] shrink-0 text-white/70 transition-transform ${openPanel === item.key ? "rotate-180" : ""}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && <span className="max-w-[70px] truncate rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>}
              </button>
              {openPanel === item.key && panelShell}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Support</p>
        <div className="mt-1.5 space-y-1">
          <Link href="/settings" onClick={go} className={itemClass(false)}>
            <Settings className="h-[18px] w-[18px] shrink-0 text-white/80" /> Settings
          </Link>
          <Link href="/help" onClick={go} className={itemClass(false)}>
            <HelpCircle className="h-[18px] w-[18px] shrink-0 text-white/80" /> Help
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function DashboardSidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile: trigger button (opens drawer) */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-10 w-full max-w-[200px] items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </div>

      {/* Desktop green sidebar */}
      <aside className="hidden rounded-2xl bg-brand p-3 text-white shadow-card lg:sticky lg:top-[76px] lg:block lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Sidebar menu">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[290px] max-w-[85vw] overflow-y-auto bg-brand p-4 text-white shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Parwaz menu</p>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}