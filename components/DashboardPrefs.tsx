"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface DashboardFilters {
  availableOnly: boolean;
  noOffersOnly: boolean;
  remoteOnly: boolean;
}

export type DashboardSort = "recommended" | "recent" | "due_soon" | "lowest_price" | "highest_price";

const STORAGE_KEY = "parwaz.dashboard.prefs.v1";

const DEFAULT_FILTERS: DashboardFilters = { availableOnly: false, noOffersOnly: false, remoteOnly: false };

interface DashboardPrefsValue {
  filters: DashboardFilters;
  sort: DashboardSort;
  setFilters: (filters: DashboardFilters) => void;
  setSort: (sort: DashboardSort) => void;
}

const DashboardPrefsContext = createContext<DashboardPrefsValue | undefined>(undefined);

export function DashboardPrefsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [sort, setSortState] = useState<DashboardSort>("recommended");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (parsed.filters) setFiltersState({ ...DEFAULT_FILTERS, ...parsed.filters });
          if (parsed.sort) setSortState(parsed.sort);
        }
      }
    } catch {
      // Corrupt or missing prefs; fall back to defaults.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, sort }));
    } catch {
      // Storage unavailable; prefs just stay in memory for this visit.
    }
  }, [filters, sort]);

  const setFilters = (next: DashboardFilters) => setFiltersState(next);
  const setSort = (next: DashboardSort) => setSortState(next);

  return (
    <DashboardPrefsContext.Provider value={{ filters, sort, setFilters, setSort }}>
      {children}
    </DashboardPrefsContext.Provider>
  );
}

export function useDashboardPrefs(): DashboardPrefsValue {
  const ctx = useContext(DashboardPrefsContext);
  if (!ctx) throw new Error("useDashboardPrefs must be used within <DashboardPrefsProvider>");
  return ctx;
}