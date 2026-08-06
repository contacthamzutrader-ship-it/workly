"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { DEFAULT_SETTINGS, subscribePlatformSettings, type PlatformSettings } from "@/lib/admin";
import { useAuth } from "@/lib/auth-context";

export default function MaintenanceBanner() {
  const { isStaff } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    return subscribePlatformSettings(setSettings, () => setSettings(null));
  }, []);

  if (!settings) return null;
  const showMaintenance = settings.maintenanceMode;
  const gateSignups = !settings.allowNewSignups;

  if (!showMaintenance && !gateSignups) return null;

  // Staff still sees a distinct maintenance warning so they know why the site looks gated.
  if (showMaintenance) {
    return (
      <div className="relative z-40 border-b border-amber-300 bg-amber-500 px-4 py-3 text-sm font-black text-white">
        <div className="page-shell flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Workly is in maintenance mode — only staff and ongoing tasks are fully accessible.
          </span>
          {isStaff && <span className="rounded-full bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-amber-700">Staff view</span>}
        </div>
      </div>
    );
  }

  if (gateSignups) {
    return (
      <div className="relative z-40 border-b border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-800">
        <div className="page-shell flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" /> New signups are temporarily paused by the Workly team. Existing members are not affected.
        </div>
      </div>
    );
  }

  return null;
}
