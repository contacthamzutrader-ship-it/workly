"use client";

import { useEffect, useSyncExternalStore } from "react";

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

interface PrefsState {
  filters: DashboardFilters;
  sort: DashboardSort;
  priceRange: PriceRange | null;
  remoteMode: RemoteMode;
}

let current: PrefsState = {
  filters: DEFAULT_FILTERS,
  sort: "recommended",
  priceRange: null,
  remoteMode: "all",
};

const listeners = new Set<() => void>();

function setCurrent(next: PrefsState) {
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PrefsState {
  return current;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage unavailable; prefs stay in memory for this visit.
  }
}

function setFilters(filters: DashboardFilters) {
  setCurrent({ ...current, filters });
  persist();
}

function setSort(sort: DashboardSort) {
  setCurrent({ ...current, sort });
  persist();
}

function setPriceRange(priceRange: PriceRange | null) {
  setCurrent({ ...current, priceRange });
  persist();
}

function setRemoteMode(remoteMode: RemoteMode) {
  setCurrent({ ...current, remoteMode });
  persist();
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!isObj(parsed)) return;
    const next: PrefsState = { ...current };
    if (isObj(parsed.filters)) next.filters = { ...DEFAULT_FILTERS, ...parsed.filters };
    if (SORT_KEYS.includes(parsed.sort as DashboardSort)) next.sort = parsed.sort as DashboardSort;
    if (REMOTE_KEYS.includes(parsed.remoteMode as RemoteMode)) next.remoteMode = parsed.remoteMode as RemoteMode;
    const pr = parsed.priceRange;
    if (isObj(pr) && typeof pr.min === "number" && typeof pr.max === "number" && pr.min >= 0 && pr.max > pr.min) {
      next.priceRange = { min: pr.min, max: pr.max };
    }
    setCurrent(next);
  } catch {
    // Malformed or missing prefs; defaults are used.
  }
}

export function DashboardPrefsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    loadPersisted();
  }, []);

  return <>{children}</>;
}

export interface DashboardPrefsValue {
  filters: DashboardFilters;
  sort: DashboardSort;
  priceRange: PriceRange | null;
  remoteMode: RemoteMode;
  setFilters: (filters: DashboardFilters) => void;
  setSort: (sort: DashboardSort) => void;
  setPriceRange: (range: PriceRange | null) => void;
  setRemoteMode: (mode: RemoteMode) => void;
}

export function useDashboardPrefs(): DashboardPrefsValue {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    filters: state.filters,
    sort: state.sort,
    priceRange: state.priceRange,
    remoteMode: state.remoteMode,
    setFilters,
    setSort,
    setPriceRange,
    setRemoteMode,
  };
}