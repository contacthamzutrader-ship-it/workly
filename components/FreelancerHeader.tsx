"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Images,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  Settings,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadProfileImage } from "@/lib/profile-image";
import { useDashboardPrefs } from "@/components/DashboardPrefs";

export type SortOption = "recommended" | "recent" | "due_soon" | "lowest_price" | "highest_price";

const sortOptions: { key: SortOption; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "recent", label: "Most Recent Posted" },
  { key: "due_soon", label: "Due Soon" },
  { key: "lowest_price", label: "Lowest Price" },
  { key: "highest_price", label: "Highest Price" },
];

const menuButtonClass =
  "inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-ink-100 bg-white px-3.5 text-sm font-bold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-ink active:scale-[0.98] lg:px-4";

function DropdownShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-ink-100 bg-white p-2 shadow-elevated">
      {children}
    </div>
  );
}

export default function FreelancerHeader() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const { filters, sort, setFilters, setSort } = useDashboardPrefs();
  const [open, setOpen] = useState<"filters" | "sort" | "profile" | null>(null);
  const [draftFilters, setDraftFilters] = useState<{ availableOnly: boolean; noOffersOnly: boolean }>(filters);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [photoStage, setPhotoStage] = useState<"idle" | "actions" | "source" | "preview" | "success">("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const pendingPhoto = useRef<File | null>(null);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters, open]);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setAvatarUrl(snap.data().avatarUrl || "");
      } catch {
        // Avatar is optional; the initials badge is used as a fallback.
      }
    })();
  }, [user]);

  const resetPhoto = () => {
    if (photoStage === "success") return;
    setPhotoStage("idle");
    setPhotoPreview(null);
    setPhotoError("");
    pendingPhoto.current = null;
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      setPhotoError("Please select a valid image file.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file. Only JPG, PNG or WebP are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("The image is too large. Please choose an image under 5 MB.");
      return;
    }
    pendingPhoto.current = file;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError("");
    setPhotoStage("preview");
  };

  const savePhoto = async () => {
    if (!user || !pendingPhoto.current) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const url = await uploadProfileImage(user.uid, pendingPhoto.current);
      if (db) await updateDoc(doc(db, "users", user.uid), { avatarUrl: url });
      setAvatarUrl(url);
      setPhotoPreview(null);
      pendingPhoto.current = null;
      setPhotoStage("success");
    } catch (err: any) {
      setPhotoError(err?.message || "Could not save your profile picture. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const toggle = (key: "filters" | "sort" | "profile") => {
    setOpen((prev) => (prev === key ? null : key));
  };

  const close = () => {
    setOpen(null);
    setConfirmLogout(false);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    close();
  };

  const cancelFilters = () => {
    setDraftFilters(filters);
    close();
  };

  const navigateAndClose = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white shadow-soft">
      <div className="page-shell flex items-center gap-3 py-2.5 sm:py-3">
        <BrandLogo size="lg" />

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {/* Browse Task */}
          <button onClick={() => navigateAndClose("/browse")} className={menuButtonClass}>
            <BriefcaseBusiness className="h-4 w-4 text-brand" /> Browse Task
          </button>

          {/* Other Filters */}
          <div className="relative">
            <button onClick={() => toggle("filters")} className={`${menuButtonClass} ${filters.availableOnly || filters.noOffersOnly ? "border-brand-200 bg-brand-50 text-ink" : ""} ${open === "filters" ? "border-brand-200 bg-brand-50" : ""}`}>
              <Settings className="h-4 w-4 text-brand" /> Other Filters {(filters.availableOnly || filters.noOffersOnly) && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] font-black text-white">{Number(filters.availableOnly) + Number(filters.noOffersOnly)}</span>}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {open === "filters" && (
              <DropdownShell>
                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Other Filters</p>
                <div className="space-y-1 p-1">
                  {[
                    { key: "availableOnly", label: "Available Task Only", desc: "Show tasks still open for offers" },
                    { key: "noOffersOnly", label: "Task With No Offers Only", desc: "Show tasks that have no offers yet" },
                  ].map((f) => (
                    <label key={f.key} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-ink-50">
                      <input
                        type="checkbox"
                        checked={draftFilters[f.key as "availableOnly" | "noOffersOnly"]}
                        onChange={(e) => setDraftFilters((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-ink-200 text-brand focus:ring-brand/30"
                      />
                      <span><span className="block text-sm font-bold text-ink">{f.label}</span><span className="block text-[11px] font-medium text-ink-400">{f.desc}</span></span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex gap-2 border-t border-ink-100 p-2 pt-3">
                  <button onClick={cancelFilters} className="flex-1 rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50 active:scale-[0.98]">Cancel</button>
                  <button onClick={applyFilters} className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]">Apply</button>
                </div>
              </DropdownShell>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button onClick={() => toggle("sort")} className={`${menuButtonClass} ${sort !== "recommended" ? "border-brand-200 bg-brand-50 text-ink" : ""} ${open === "sort" ? "border-brand-200 bg-brand-50" : ""}`}>
              <List className="h-4 w-4 text-brand" /> <span className="hidden sm:inline">{sort === "recommended" ? "Sort" : sortLabels[sort]}</span><span className="sm:hidden">Sort</span> <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {open === "sort" && (
              <DropdownShell>
                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Sort by</p>
                <div className="space-y-0.5">
                  {sortOptions.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => { setSort(item.key); close(); }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${sort === item.key ? "bg-brand-50 text-brand" : "text-ink-600 hover:bg-ink-50"}`}
                    >
                      {item.label}
                      {sort === item.key && <CheckCircle2 className="h-3.5 w-3.5 text-brand" />}
                    </button>
                  ))}
                </div>
              </DropdownShell>
            )}
          </div>

          {/* Profile avatar */}
          <div className="relative">
            <button
              onClick={() => toggle("profile")}
              className={`flex h-10 items-center gap-1.5 rounded-xl border bg-white px-1.5 transition hover:bg-brand-50 ${open === "profile" ? "border-brand-200 bg-brand-50" : "border-ink-100"}`}
              aria-label="Open profile menu"
            >
              <span className={avatarUrl ? "h-8 w-8 overflow-hidden rounded-lg" : "grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-black text-white"}>
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.displayName || user?.email || "U")[0].toUpperCase()}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-300" />
            </button>

            {open === "profile" && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-3 shadow-elevated">
                <input ref={photoFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickPhoto} />
                {photoStage !== "idle" ? (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {photoStage === "success" ? (
                      <div className="text-center">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Profile picture</p>
                          <button onClick={() => setPhotoStage("idle")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-ink-50">Done</button>
                        </div>
                        <div className="relative mx-auto mt-3 h-24 w-24 overflow-hidden rounded-2xl shadow-card">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center bg-brand text-2xl font-black text-white">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-black text-ink">Profile picture updated successfully</p>
                        <p className="mt-1 text-[11px] font-medium leading-5 text-ink-400">Your new photo is now shown across your dashboard and profile.</p>
                      </div>
                    ) : photoStage === "actions" ? (
                      <div className="text-center">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Profile picture</p>
                          <button onClick={resetPhoto} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-ink-50"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                        </div>
                        <div className="relative mx-auto mt-3 h-24 w-24 overflow-hidden rounded-2xl shadow-card">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center bg-brand text-2xl font-black text-white">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</span>
                          )}
                          <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-lg bg-deep text-white"><Camera className="h-3 w-3" /></span>
                        </div>
                        <p className="mt-3 text-sm font-black text-ink">{user?.displayName || "Freelancer"}</p>
                        <p className="text-xs font-semibold text-ink-400">{role === "tasker" ? "Freelancer" : "Member"}</p>
                        <p className="mt-2 text-[11px] font-medium leading-5 text-ink-400">Choose the photo clients see next to your name and offers. JPG, PNG or WebP, under 5 MB.</p>
                        <div className="mt-3 space-y-1.5 text-left">
                          <button onClick={() => { setPhotoError(""); setPhotoStage("source"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Camera className="h-4 w-4 text-brand" /> Edit Profile Picture</button>
                          <button onClick={() => { setPhotoError(""); setPhotoStage("source"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><ImagePlus className="h-4 w-4 text-brand" /> Change Photo</button>
                          <button onClick={resetPhoto} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-400 transition hover:bg-ink-50">Cancel</button>
                        </div>
                      </div>
                    ) : photoStage === "source" ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Change photo</p>
                          <button onClick={() => setPhotoStage("actions")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-ink-50"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                        </div>
                        <p className="mt-2 text-[11px] font-medium leading-5 text-ink-400">Pick where to take the new photo from. Only JPG, PNG and WebP images are accepted.</p>
                        <div className="mt-3 space-y-1.5">
                          <button onClick={() => photoFileRef.current?.click()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Images className="h-4 w-4 text-brand" /> Gallery / Choose from Device</button>
                          <button onClick={() => setPhotoStage("actions")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-400 transition hover:bg-ink-50">Cancel</button>
                        </div>
                      </div>
                    ) : photoStage === "preview" && photoPreview ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Preview photo</p>
                          <button onClick={() => { setPhotoStage("actions"); setPhotoPreview(null); pendingPhoto.current = null; setPhotoError(""); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-ink-50"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                        </div>
                        <img src={photoPreview} alt="Profile preview" className="mx-auto mt-3 h-40 w-40 rounded-2xl object-cover shadow-card" />
                        <p className="mt-3 text-center text-[11px] font-medium leading-5 text-ink-400">This is how your profile picture will look next to your name and offers.</p>
                        {photoError && <div className="mt-2 rounded-lg bg-red-50 p-2.5 text-center text-xs font-semibold text-red-600">{photoError}</div>}
                        <div className="mt-3 space-y-1.5">
                          <button onClick={savePhoto} disabled={photoBusy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60">
                            {photoBusy ? "Saving..." : "Save photo"}
                          </button>
                          <button onClick={() => { setPhotoStage("actions"); setPhotoPreview(null); pendingPhoto.current = null; setPhotoError(""); }} className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-bold text-ink-400 transition hover:bg-ink-50">Cancel</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setPhotoError(""); setPhotoStage("actions"); }}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-ink-50 p-3 text-left transition hover:bg-ink-100/70"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center bg-brand text-sm font-black text-white">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</span>
                        )}
                        <span className="absolute inset-0 grid place-items-center bg-ink/30 text-white opacity-0 transition group-hover:opacity-100"><Camera className="h-4 w-4" /></span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-ink">{user?.displayName || "Freelancer"}</span>
                        <span className="block truncate text-xs font-semibold text-ink-400">{role === "tasker" ? "Freelancer" : "Member"}</span>
                      </span>
                      <Camera className="h-4 w-4 shrink-0 text-ink-300" />
                    </button>

                    <p className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Profile Section</p>
                    <div className="space-y-0.5">
                      <button onClick={() => navigateAndClose("/dashboard")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-bold text-ink-600 transition hover:bg-brand-50"><LayoutDashboard className="h-4 w-4 text-brand" /> Dashboard</button>
                      <button onClick={() => navigateAndClose("/profile")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-bold text-ink-600 transition hover:bg-brand-50"><UserRound className="h-4 w-4 text-brand" /> Profile</button>
                    </div>

                    <div className="mt-2 space-y-0.5 border-t border-ink-100 pt-2">
                      {confirmLogout ? (
                        <div className="mt-1 rounded-xl bg-red-50 p-3">
                          <p className="text-sm font-black text-ink">Log out of Parwaz?</p>
                          <p className="mt-0.5 text-xs font-medium leading-5 text-ink-500">Your session will be ended securely and you will be sent to the login page.</p>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => setConfirmLogout(false)} className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50 active:scale-[0.98]">Cancel</button>
                            <button onClick={async () => { close(); await signOut(); router.replace("/login"); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white shadow-forest transition hover:bg-red-700 active:scale-[0.98]"><LogOut className="h-4 w-4" /> Log out</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Link href="/contact" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Mail className="h-4 w-4 text-ink-400" /> Contact Us</Link>
                          <button onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"><LogOut className="h-4 w-4" /> Log Out</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const sortLabels: Record<SortOption, string> = {
  recommended: "Recommended",
  recent: "Recent",
  due_soon: "Due soon",
  lowest_price: "Lowest",
  highest_price: "Highest",
};
