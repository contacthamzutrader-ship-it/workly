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
        if (parsed && typeof parsed === "object") {
          if (parsed.filters) setFiltersState({ ...DEFAULT_FILTERS, ...parsed.filters });
          if (parsed.sort) setSortState(parsed.sort);
          if (parsed.priceRange) setPriceRangeState(parsed.priceRange);
          if (parsed.remoteMode) setRemoteModeState(parsed.remoteMode);
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