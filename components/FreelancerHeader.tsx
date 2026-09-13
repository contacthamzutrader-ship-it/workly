"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/BrandLogo";
import { uploadProfileImage, withTimeout } from "@/lib/profile-image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const NAV_ITEMS = [
  { label: "Browse Tasks", href: "/browse" },
  { label: "My Projects", href: "/projects" },
  { label: "Notifications", href: "/notifications" },
  { label: "Messages", href: "/messages" },
] as const;

export default function FreelancerHeader() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setConfirmLogout(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const resetPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoFile(null);
    setPhotoError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setPhotoError("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const savePhoto = async () => {
    if (!photoFile || !user) return;
    if (!db) {
      setPhotoError("Photo saving is unavailable right now. Please try again later.");
      return;
    }
    setPhotoUpdating(true);
    setPhotoError("");
    try {
      const url = await uploadProfileImage(user.uid, photoFile);
      await withTimeout(
        updateDoc(doc(db, "users", user.uid), { avatarUrl: url, profileUpdatedAt: new Date().toISOString() }),
        15000,
        "Saving took too long. Check your connection and try again."
      );
      setAvatarUrl(url);
      resetPhoto();
    } catch (err: any) {
      setPhotoError(err?.message || "Could not save your photo. Try a JPG, PNG or WebP under 5 MB.");
    } finally {
      setPhotoUpdating(false);
    }
  };

  const closeMenus = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setConfirmLogout(false);
    resetPhoto();
  };

  const navigate = (href: string) => {
    closeMenus();
    router.push(href);
  };

  const isAdmin = role === "moderator" || role === "company_admin" || role === "super_admin";

  const navLink = (href: string, label: string, mobile?: boolean) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        onClick={mobile ? closeMenus : undefined}
        className={`${mobile ? "block px-3 py-2.5 text-[15px]" : "px-3 py-1.5 text-[14px]"} rounded-lg font-semibold transition ${
          active
            ? mobile
              ? "bg-brand-50 text-brand"
              : "text-brand"
            : mobile
              ? "text-ink-600 hover:bg-ink-50"
              : "text-ink-600 hover:bg-ink-50 hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/80 bg-white/95 backdrop-blur-sm">
      <div className="page-shell flex items-center gap-4 py-4 sm:py-5">
        <BrandLogo size="lg" href="/dashboard" />

        <nav className="hidden flex-1 justify-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label }) => navLink(href, label))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-50 hover:text-ink"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                if (dropdownOpen) resetPhoto();
                setDropdownOpen(!dropdownOpen);
                setConfirmLogout(false);
              }}
              className={`flex items-center gap-1.5 rounded-lg border p-0.5 pr-1.5 transition hover:bg-ink-50 ${
                dropdownOpen ? "border-brand-200 bg-brand-50/50" : "border-transparent"
              }`}
              aria-label="Open profile menu"
            >
              <span
                className={
                  avatarUrl
                    ? "h-8 w-8 shrink-0 overflow-hidden rounded-lg"
                    : "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-xs font-black text-white"
                }
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user?.displayName || user?.email || "U")[0].toUpperCase()
                )}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-ink-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-elevated">
                <div className="rounded-xl bg-ink-50/60 p-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        avatarUrl || photoPreview
                          ? "h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
                          : "grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand text-xl font-black text-white"
                      }
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="New profile photo preview" className="h-full w-full object-cover" />
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (user?.displayName || user?.email || "U")[0].toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{user?.displayName || "Freelancer"}</p>
                      <p className="truncate text-[12px] font-medium text-ink-400">{photoPreview ? "New photo ready to save" : role === "tasker" ? "Freelancer" : "Member"}</p>
                    </div>
                  </div>

                  {photoPreview ? (
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={resetPhoto}
                        disabled={photoUpdating}
                        className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] font-bold text-ink-600 transition hover:bg-ink-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={savePhoto}
                        disabled={photoUpdating}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[12px] font-bold text-white transition hover:bg-brand-700"
                      >
                        <Camera className="h-3.5 w-3.5" /> {photoUpdating ? "Saving..." : "Save photo"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12px] font-bold text-brand ring-1 ring-ink-100 transition hover:bg-brand-50"
                      >
                        <Camera className="h-3.5 w-3.5" /> Change profile photo
                      </button>
                    </>
                  )}

                  {photoError && (
                    <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700">{photoError}</p>
                  )}
                </div>

                <div className="mt-1.5 space-y-0.5">
                  {isAdmin && (
                    <button onClick={() => navigate("/admin")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-ink-600 transition hover:bg-brand-50">
                      <Settings className="h-4 w-4 text-ink-400" /> Admin control
                    </button>
                  )}
                  <button onClick={() => navigate("/dashboard")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-ink-600 transition hover:bg-brand-50">
                    <LayoutDashboard className="h-4 w-4 text-ink-400" /> Dashboard
                  </button>
                  <button onClick={() => user && navigate(`/u/${user.uid}`)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-ink-600 transition hover:bg-brand-50">
                    <UserRound className="h-4 w-4 text-ink-400" /> Profile (Public View)
                  </button>
                </div>

                <div className="mt-1.5 space-y-0.5 border-t border-ink-100 pt-1.5">
                  {confirmLogout ? (
                    <div className="rounded-xl bg-red-50 p-3">
                      <p className="text-sm font-bold text-ink">Log out of Parwaz?</p>
                      <p className="mt-0.5 text-[12px] font-medium leading-5 text-ink-500">Your session will be ended securely.</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setConfirmLogout(false)} className="flex-1 min-h-10 rounded-xl border border-ink-200 bg-white px-3 text-[14px] font-semibold text-ink-600 transition hover:bg-ink-50">Cancel</button>
                        <button
                          onClick={async () => {
                            closeMenus();
                            await signOut();
                            router.replace("/login");
                          }}
                          className="flex flex-1 min-h-10 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 text-[14px] font-bold text-white transition hover:bg-red-700"
                        >
                          <LogOut className="h-4 w-4" /> Log out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-red-600 transition hover:bg-red-50">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            setDropdownOpen(false);
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-50 lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-ink-100/80 bg-white lg:hidden">
          <nav className="page-shell space-y-1 py-3">
            {NAV_ITEMS.map(({ href, label }) => navLink(href, label, true))}

            <div className="mt-1 space-y-0.5 border-t border-ink-100 pt-2">
              <button onClick={() => navigate("/dashboard")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-ink-600 transition hover:bg-ink-50">
                <LayoutDashboard className="h-4 w-4 text-ink-400" /> Dashboard
              </button>
              <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-ink-600 transition hover:bg-ink-50">
                <UserRound className="h-4 w-4 text-ink-400" /> Profile
              </button>
              <button onClick={() => navigate("/settings")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-ink-600 transition hover:bg-ink-50">
                <Settings className="h-4 w-4 text-ink-400" /> Settings
              </button>
              {isAdmin && (
                <button onClick={() => navigate("/admin")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-ink-600 transition hover:bg-ink-50">
                  <Settings className="h-4 w-4 text-ink-400" /> Admin control
                </button>
              )}
            </div>

            <div className="border-t border-ink-100 pt-2">
              {confirmLogout ? (
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-sm font-bold text-ink">Log out of Parwaz?</p>
                  <p className="mt-0.5 text-[12px] font-medium leading-5 text-ink-500">Your session will be ended securely.</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setConfirmLogout(false)} className="flex-1 min-h-10 rounded-xl border border-ink-200 bg-white px-3 text-[14px] font-semibold text-ink-600 transition hover:bg-ink-50">Cancel</button>
                    <button
                      onClick={async () => {
                        closeMenus();
                        await signOut();
                        router.replace("/login");
                      }}
                      className="flex flex-1 min-h-10 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 text-[14px] font-bold text-white transition hover:bg-red-700"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/contact" onClick={closeMenus} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-ink-600 transition hover:bg-ink-50">
                    <Mail className="h-4 w-4 text-ink-400" /> Contact Us
                  </Link>
                  <button onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-red-600 transition hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}