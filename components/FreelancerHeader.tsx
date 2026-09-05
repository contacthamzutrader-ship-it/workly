"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Bell,
  BellRing,
  BriefcaseBusiness,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  FileText,
  Gift,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  ImagePlus,
  Images,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Newspaper,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Umbrella,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadProfileImage } from "@/lib/profile-image";

export type TaskerView = "all" | "task_assign" | "offers_pending" | "task_completed" | "tasks_cancelled";
export type SortOption = "recommended" | "recent" | "due_soon" | "lowest_price" | "highest_price";

export interface FilterState {
  availableOnly: boolean;
  noOffersOnly: boolean;
}

const browseItems: { key: TaskerView; label: string; icon: any }[] = [
  { key: "task_assign", label: "Task Assign", icon: BriefcaseBusiness },
  { key: "offers_pending", label: "Offers Pending", icon: Clock3 },
  { key: "task_completed", label: "Task Completed", icon: CheckCircle2 },
  { key: "tasks_cancelled", label: "Tasks Cancelled", icon: XCircle },
];

const sortItems: { key: SortOption; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "recent", label: "Most Recent Posted" },
  { key: "due_soon", label: "Due Soon" },
  { key: "lowest_price", label: "Lowest Price" },
  { key: "highest_price", label: "Highest Price" },
];

const settingsItems = [
  { label: "Mobile", href: "/profile", icon: Smartphone },
  { label: "Email", href: "/profile", icon: Mail },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Verify Account", href: "/profile", icon: ShieldCheck },
  { label: "Change Password", href: "/profile", icon: KeyRound },
  { label: "Notification Settings", href: "/notifications", icon: Bell },
  { label: "Tasker Alert", href: "/notifications", icon: BellRing },
  { label: "Skills", href: "/profile", icon: Award },
  { label: "Badges", href: "/profile", icon: Sparkles },
  { label: "Portfolio", href: "/profile", icon: ImageIcon },
];

const discoverItems = [
  { label: "Insurance", href: "/#trust", icon: Umbrella },
  { label: "How It Works", href: "/#how-it-works", icon: GraduationCap },
  { label: "Gift Cards", href: "/", icon: Gift },
  { label: "Earn Money", href: "/tasks", icon: Coins },
  { label: "Help", href: "/#learn", icon: HelpCircle },
];

const helpTopicItems = [
  { label: "Help", href: "/#learn", icon: HelpCircle },
  { label: "Community Guidelines", href: "/#trust", icon: ShieldCheck },
  { label: "Cancellation Policy", href: "/#trust", icon: FileText },
  { label: "Terms and Conditions", href: "/#trust", icon: FileText },
  { label: "Blog", href: "/", icon: Newspaper },
  { label: "About Us", href: "/#why", icon: Building2 },
];

const menuButtonClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-4 text-sm font-bold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-ink active:scale-[0.98]";

function DropdownShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-2 shadow-elevated">
      {children}
    </div>
  );
}

export default function FreelancerHeader({
  view,
  onViewChange,
  filters,
  onApplyFilters,
  sort,
  onSortChange,
}: {
  view: TaskerView;
  onViewChange: (view: TaskerView) => void;
  filters: FilterState;
  onApplyFilters: (f: FilterState) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
}) {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState<"browse" | "filters" | "sort" | "profile" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [photoStage, setPhotoStage] = useState<"idle" | "actions" | "source" | "preview">("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoFileRef = useRef<HTMLInputElement>(null);
  const pendingPhoto = useRef<File | null>(null);

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
    setPhotoStage("idle");
    setPhotoPreview(null);
    setPhotoError("");
    pendingPhoto.current = null;
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("The image must be under 5 MB.");
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
      resetPhoto();
    } catch (err: any) {
      setPhotoError(err?.message || "Could not save your profile picture.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const toggle = (key: "browse" | "filters" | "sort" | "profile") => {
    setOpen((prev) => (prev === key ? null : key));
    setSettingsOpen(false);
    if (key !== "profile") resetPhoto();
  };

  const close = () => {
    setOpen(null);
    setSettingsOpen(false);
    resetPhoto();
  };

  const applyFilters = () => {
    onApplyFilters(draftFilters);
    close();
  };

  const cancelFilters = () => {
    setDraftFilters(filters);
    close();
  };

  const activeActive = filters.availableOnly || filters.noOffersOnly;

  return (
    <header className="border-b border-ink-100 bg-white shadow-soft">
      <div className="page-shell flex flex-wrap items-center gap-2 py-3">
        <BrandLogo compact />
<div className="flex flex-1 flex-wrap items-center gap-2">

          {/* Browse Tasks */}
          <div className="relative">
            <button
              onClick={() => toggle("browse")}
              className={`${menuButtonClass} ${view !== "all" ? "border-brand-200 bg-brand-50 text-ink" : ""} ${open === "browse" ? "border-brand-200 bg-brand-50" : ""}`}
            >
              <BriefcaseBusiness className="h-4 w-4 text-brand" /> Browse Task <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {open === "browse" && (
              <DropdownShell>
                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Browse Task</p>
                <div className="space-y-0.5">
                  {browseItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => { onViewChange(item.key); close(); }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${view === item.key ? "bg-brand-50 text-brand-dark" : "text-ink-600 hover:bg-ink-50"}`}
                    >
                      {item.icon} {item.label}
                      {view === item.key && <Check className="ml-auto h-3.5 w-3.5 text-brand" />}
                    </button>
                  ))}
                </div>
              </DropdownShell>
            )}
          </div>

          {/* Other Filters */}
          <div className="relative">
            <button
              onClick={() => toggle("filters")}
              className={`${menuButtonClass} ${activeActive ? "border-brand-200 bg-brand-50 text-ink" : ""} ${open === "filters" ? "border-brand-200 bg-brand-50" : ""}`}
            >
              <Settings className="h-4 w-4 text-brand" /> Other Filters {activeActive && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] font-black text-white">{(Number(filters.availableOnly) + Number(filters.noOffersOnly))}</span>}
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
                        checked={draftFilters[f.key as keyof FilterState]}
                        onChange={(e) => setDraftFilters((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-ink-200 text-brand focus:ring-brand/30"
                      />
                      <span><span className="block text-sm font-bold text-ink">{f.label}</span><span className="block text-[11px] font-medium text-ink-400">{f.desc}</span></span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex gap-2 border-t border-ink-100 p-2 pt-3">
                  <button
                    onClick={cancelFilters}
                    className="flex-1 rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-forest transition hover:bg-brand-700 active:scale-[0.98]"
                  >
                    Apply
                  </button>
                </div>
              </DropdownShell>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => toggle("sort")}
              className={`${menuButtonClass} ${sort !== "recommended" ? "border-brand-200 bg-brand-50 text-ink" : ""} ${open === "sort" ? "border-brand-200 bg-brand-50" : ""}`}
            >
              <Sparkles className="h-4 w-4 text-brand" /> Sort <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {open === "sort" && (
              <DropdownShell>
                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Sort by</p>
                <div className="space-y-0.5">
                  {sortItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => { onSortChange(item.key); close(); }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${sort === item.key ? "bg-brand-50 text-brand-dark" : "text-ink-600 hover:bg-ink-50"}`}
                    >
                      {item.label}
                      {sort === item.key && <Check className="h-3.5 w-3.5 text-brand" />}
                    </button>
                  ))}
                </div>
              </DropdownShell>
            )}
          </div>
        </div>

        {/* Profile dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => toggle("profile")}
            className={`flex h-11 items-center gap-2 rounded-xl border ${open === "profile" ? "border-brand-200 bg-brand-50" : "border-ink-100"} bg-white px-2 pr-3 text-left transition hover:bg-brand-50`}
          >
            <span className={avatarUrl ? "h-8 w-8 overflow-hidden rounded-lg" : "grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-black text-white"}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.displayName || user?.email || "U")[0].toUpperCase()}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-300" />
          </button>

          {open === "profile" && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-ink-100 bg-white p-3 shadow-elevated">
              <input ref={photoFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickPhoto} />
              {settingsOpen ? (
                <>
                  <div className="flex items-center justify-between px-2 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Settings</p>
                    <button onClick={() => setSettingsOpen(false)} className="rounded-lg px-2 py-1 text-xs font-bold text-ink-500 hover:bg-ink-50">&#8592; Back</button>
                  </div>
                  <div className="grid max-h-[46vh] grid-cols-1 gap-0.5 overflow-y-auto">
                    {settingsItems.map((item) => (
                      <Link key={item.label} href={item.href} onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50 hover:text-ink">
                        <item.icon className="h-4 w-4 text-brand" /> {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : photoStage !== "idle" ? (
                <div className="max-h-[70vh] overflow-y-auto">
                  {photoStage === "actions" && (
                    <div className="text-center">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Profile picture</p>
                        <button onClick={() => setPhotoStage("idle")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-ink-50">
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
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
                      <p className="mt-2 text-[11px] font-medium leading-5 text-ink-400">Choose the photo clients see next to your name and offers. JPG or PNG, under 5 MB.</p>
                      <div className="mt-3 space-y-1.5 text-left">
                        <button onClick={() => { setPhotoError(""); setPhotoStage("source"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Camera className="h-4 w-4 text-brand" /> Edit Profile Picture</button>
                        <button onClick={() => { setPhotoError(""); setPhotoStage("source"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><ImagePlus className="h-4 w-4 text-brand" /> Change Photo</button>
                        <button onClick={() => setPhotoStage("idle")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-400 transition hover:bg-ink-50">Cancel</button>
                      </div>
                    </div>
                  )}

                  {photoStage === "source" && (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Change photo</p>
                        <button onClick={() => setPhotoStage("actions")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-ink-50">
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] font-medium leading-5 text-ink-400">Pick where to take the new photo from. Only JPG, PNG and WebP images are accepted.</p>
                      <div className="mt-3 space-y-1.5">
                        <button onClick={() => photoFileRef.current?.click()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Images className="h-4 w-4 text-brand" /> Gallery / Choose from Device</button>
                        <button onClick={() => setPhotoStage("actions")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-400 transition hover:bg-ink-50">Cancel</button>
                      </div>
                    </div>
                  )}

                  {photoStage === "preview" && photoPreview && (
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
                  )}
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
                        <span className="grid h-full w-full place-items-center bg-brand text-sm font-black text-white">
                          {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                        </span>
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
                    <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><LayoutDashboard className="h-4 w-4 text-brand" /> My Tasker Dashboard</Link>
                    <Link href="/payment-history" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Wallet className="h-4 w-4 text-brand" /> Payment History</Link>
                    <button onClick={() => setSettingsOpen(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-bold text-ink-600 transition hover:bg-brand-50">
                      <Settings className="h-4 w-4 text-brand" /> Settings <span className="ml-auto text-ink-300">&#8250;</span>
                    </button>
                  </div>

                  <p className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Discover</p>
                  <div className="space-y-0.5">
                    {discoverItems.map((item) => (
                      <Link key={item.label} href={item.href} onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><item.icon className="h-4 w-4 text-brand" /> {item.label}</Link>
                    ))}
                  </div>

                  <p className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Help Topic</p>
                  <div className="space-y-0.5">
                    {helpTopicItems.map((item) => (
                      <Link key={item.label} href={item.href} onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><item.icon className="h-4 w-4 text-ink-400" /> {item.label}</Link>
                    ))}
                  </div>

                  <div className="mt-2 space-y-0.5 border-t border-ink-100 pt-2">
                    <Link href="/messages" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-600 transition hover:bg-brand-50"><Mail className="h-4 w-4 text-ink-400" /> Contact Us</Link>
                    <button
                      onClick={async () => { close(); await signOut(); router.push("/"); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}