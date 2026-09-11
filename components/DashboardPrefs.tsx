"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface DashboardFilters {
  availableOnly: boolean;
  noOffersOnly: boolean;
  hideAssigned: boolean;
  hideHasOffers: boolean;
}

export type DashboardSort = "recommended" | "recent" | "due_soon" | "lowest_price" | "highest_price";
export type RemoteMode = "all" | "remote" | "in_person";

export interface PriceRange {
  min: number;
  max: number;
}

const STORAGE_KEY = "parwaz.dashboard.prefs.v1";

const DEFAULT_FILTERS: DashboardFilters = { availableOnly: false, noOffersOnly: false, hideAssigned: false, hideHasOffers: false };

const SORT_KEYS: DashboardSort[] = ["recommended", "recent", "due_soon", "lowest_price", "highest_price"];
const REMOTE_KEYS: RemoteMode[] = ["all", "remote", "in_person"];

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

interface DashboardPrefsValue {
  filters: DashboardFilters;
  sort: DashboardSort;
  priceRange: PriceRange | null;
  remoteMode: RemoteMode;
  setFilters: (filters: DashboardFilters) => void;
  setSort: (sort: DashboardSort) => void;
  setPriceRange: (range: PriceRange | null) => void;
  setRemoteMode: (mode: RemoteMode) => void;
}

const DashboardPrefsContext = createContext<DashboardPrefsValue | undefined>(undefined);

export function DashboardPrefsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [sort, setSortState] = useState<DashboardSort>("recommended");
  const [priceRange, setPriceRangeState] = useState<PriceRange | null>(null);
  const [remoteMode, setRemoteModeState] = useState<RemoteMode>("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isObj(parsed)) {
          if (isObj(parsed.filters)) setFiltersState({ ...DEFAULT_FILTERS, ...parsed.filters });
          if (SORT_KEYS.includes(parsed.sort as DashboardSort)) setSortState(parsed.sort as DashboardSort);
          if (REMOTE_KEYS.includes(parsed.remoteMode as RemoteMode)) setRemoteModeState(parsed.remoteMode as RemoteMode);
          const pr = parsed.priceRange;
          if (isObj(pr) && typeof pr.min === "number" && typeof pr.max === "number" && pr.min >= 0 && pr.max > pr.min) {
            setPriceRangeState({ min: pr.min, max: pr.max });
          }
        }
      }
    } catch {
      // Corrupt or missing prefs; fall back to defaults.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, sort, priceRange, remoteMode }));
    } catch {
      // Storage unavailable; prefs just stay in memory for this visit.
    }
  }, [filters, sort, priceRange, remoteMode]);

  const setFilters = (next: DashboardFilters) => setFiltersState(next);
  const setSort = (next: DashboardSort) => setSortState(next);
  const setPriceRange = (next: PriceRange | null) => setPriceRangeState(next);
  const setRemoteMode = (next: RemoteMode) => setRemoteModeState(next);

  return (
    <DashboardPrefsContext.Provider value={{ filters, sort, priceRange, remoteMode, setFilters, setSort, setPriceRange, setRemoteMode }}>
      {children}
    </DashboardPrefsContext.Provider>
  );
}

export function useDashboardPrefs(): DashboardPrefsValue {
  const ctx = useContext(DashboardPrefsContext);
  if (!ctx) throw new Error("useDashboardPrefs must be used within <DashboardPrefsProvider>");
  return ctx;
}