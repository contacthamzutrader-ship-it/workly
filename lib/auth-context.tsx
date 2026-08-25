"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getAdminDoc } from "./admin";
import {
  capabilitiesFor,
  isOwnerEmail,
  normalizeRole,
  ownerSession,
  staffRoleFromPermissions,
  toStoredRole,
  type Capabilities,
  type MemberRole,
  type Permission,
  type StaffSession,
} from "./roles";

/** The public profile document backing every signed-in session. */
export interface WorklyProfile {
  uid: string;
  name: string;
  email: string;
  role: MemberRole;
  isPrivate: boolean;
  suspended: boolean;
  verified: boolean;
  avatarUrl: string;
  city: string;
  bio: string;
  professionalTitle: string;
  skills: string[];
  hourlyRate: number;
  organization: string;
  hiringNeeds: string;
  profileComplete: boolean;
  interviewStatus: string;
  wallet: number;
  onboarded: boolean;
  createdAt?: unknown;
}

interface SignInResult {
  isOwner: boolean;
  onboarded: boolean;
}

interface GoogleSignInResult extends SignInResult {
  isNewUser: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: WorklyProfile | null;
  /** The member role currently in effect: "client" or "freelancer". */
  role: MemberRole;
  staff: StaffSession | null;
  permissions: Permission[];
  capabilities: Capabilities;
  isOwner: boolean;
  isStaff: boolean;
  loading: boolean;
  /** True while Firebase is known but the profile document has not arrived. */
  profileLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<SignInResult>;
  signUpWithEmail: (input: { email: string; password: string; name: string; role: MemberRole }) => Promise<void>;
  signInWithGoogle: (role?: MemberRole) => Promise<GoogleSignInResult>;
  switchRole: (role: MemberRole) => Promise<void>;
  markOnboarded: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const EMPTY_CAPABILITIES = capabilitiesFor("client", null);

function requireAuth() {
  if (!auth || !db) {
    throw new Error("Parwaz is not connected to Firebase yet. Add your NEXT_PUBLIC_FIREBASE_* keys.");
  }
  return auth;
}

function profileReadyForRole(profile: WorklyProfile, role: MemberRole) {
  const baseReady =
    profile.name.trim().length >= 2 && profile.city.trim().length >= 2 && profile.bio.trim().length >= 20;
  if (!baseReady) return false;
  if (role === "client") return true;
  return profile.professionalTitle.trim().length >= 3 && profile.skills.length > 0;
}

function capabilitiesForProfile(role: MemberRole, staff: StaffSession | null, profile: WorklyProfile) {
  const base = capabilitiesFor(role, staff);
  const ready = profile.onboarded && profileReadyForRole(profile, role);
  return {
    ...base,
    canPostTask: base.canPostTask && ready,
    canSendOffer: base.canSendOffer && ready,
  };
}

function profileFromSnapshot(uid: string, email: string, data: Record<string, any>, user?: User | null): WorklyProfile {
  return {
    uid,
    name: data.name || "",
    email: data.email || email,
    role: normalizeRole(data.role),
    isPrivate: data.isPrivate === true,
    suspended: data.suspended === true,
    verified: data.verified === true,
    avatarUrl: data.avatarUrl || user?.photoURL || "",
    city: data.city || "",
    bio: data.bio || "",
    professionalTitle: data.professionalTitle || "",
    skills: Array.isArray(data.skills) ? data.skills.filter((item: unknown) => typeof item === "string") : [],
    hourlyRate: Math.max(0, Number(data.hourlyRate || 0)),
    organization: data.organization || "",
    hiringNeeds: data.hiringNeeds || "",
    profileComplete: data.profileComplete === true,
    interviewStatus: data.interviewStatus || "not_started",
    wallet: Number(data.wallet || 0),
    onboarded: data.onboarded === true,
    createdAt: data.createdAt,
  };
}

function newProfileDoc(user: User, name: string, role: MemberRole) {
  return {
    uid: user.uid,
    name: name || user.displayName || "",
    email: (user.email || "").toLowerCase(),
    role: toStoredRole(role),
    avatarUrl: user.photoURL || "",
    isTasker: role === "freelancer",
    isPrivate: false,
    suspended: false,
    verified: false,
    wallet: 0,
    onboarded: false,
    profileComplete: false,
    interviewStatus: "not_started",
    createdAt: serverTimestamp(),
  };
}

async function removeIncompleteFirebaseUser(current: User) {
  try {
    await deleteUser(current);
  } catch {
    if (auth?.currentUser?.uid === current.uid) {
      await firebaseSignOut(auth).catch(() => undefined);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<WorklyProfile | null>(null);
  const [staff, setStaff] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileUnsub = useRef<null | (() => void)>(null);

  const loadStaff = useCallback(async (current: User | null) => {
    if (!current) {
      setStaff(null);
      return;
    }
    if (isOwnerEmail(current.email)) {
      setStaff(ownerSession());
      return;
    }
    const record = await getAdminDoc(current.uid);
    if (record) {
      setStaff({
        role: record.staffRole || staffRoleFromPermissions(record.permissions),
        isOwner: false,
        permissions: record.permissions || [],
      });
    } else {
      setStaff(null);
    }
  }, []);

  const requireExistingProfile = useCallback(async (current: User): Promise<Record<string, any>> => {
    if (!db) throw new Error("Parwaz profile storage is not configured.");
    const reference = doc(db, "users", current.uid);
    const existing = await getDoc(reference);
    if (existing.exists()) return existing.data();

    // The fixed owner identity may bootstrap its own privileged profile shell.
    // Ordinary accounts are never silently recreated because doing so can
    // resurrect a deleted/corrupt account or bypass the controlled signup flow.
    if (isOwnerEmail(current.email)) {
      const ownerProfile = {
        ...newProfileDoc(current, current.displayName || "Owner", "client"),
        role: "super_admin",
        onboarded: true,
        profileComplete: true,
      };
      await setDoc(reference, ownerProfile);
      return ownerProfile;
    }

    throw new Error(
      "Your sign-in exists, but its Parwaz member profile is missing. Please contact Parwaz support instead of creating another account."
    );
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      profileUnsub.current?.();
      profileUnsub.current = null;
      setUser(current);

      if (!current || !db) {
        setProfile(null);
        setStaff(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setProfileLoading(true);
      const reference = doc(db, "users", current.uid);
      const email = (current.email || "").toLowerCase();

      // Important: auth-state changes never create ordinary profile records.
      // Profiles are created only by an explicit, validated signup action.
      profileUnsub.current = onSnapshot(
        reference,
        (snapshot) => {
          setProfile(snapshot.exists() ? profileFromSnapshot(current.uid, email, snapshot.data(), current) : null);
          setProfileLoading(false);
          setLoading(false);
        },
        () => {
          setProfile(null);
          setProfileLoading(false);
          setLoading(false);
        }
      );

      try {
        await loadStaff(current);
      } catch {
        setStaff(null);
      }
      setLoading(false);
    });

    return () => {
      profileUnsub.current?.();
      unsubscribe();
    };
  }, [loadStaff]);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const instance = requireAuth();
      const credential = await signInWithEmailAndPassword(instance, email.trim().toLowerCase(), password);
      try {
        const stored = await requireExistingProfile(credential.user);
        return {
          isOwner: isOwnerEmail(credential.user.email),
          onboarded: stored.onboarded === true,
        };
      } catch (error) {
        await firebaseSignOut(instance).catch(() => undefined);
        throw error;
      }
    },
    [requireExistingProfile]
  );

  const signUpWithEmail = useCallback(
    async ({ email, password, name, role }: { email: string; password: string; name: string; role: MemberRole }) => {
      const instance = requireAuth();
      if (!db) throw new Error("Parwaz profile storage is not configured.");

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim().replace(/\s+/g, " ");
      const credential = await createUserWithEmailAndPassword(instance, normalizedEmail, password);

      try {
        if (normalizedName) {
          await updateProfile(credential.user, { displayName: normalizedName }).catch(() => undefined);
        }

        const profileData = newProfileDoc(credential.user, normalizedName, role);
        await setDoc(doc(db, "users", credential.user.uid), profileData);
        setProfile(profileFromSnapshot(credential.user.uid, normalizedEmail, profileData, credential.user));

        await sendEmailVerification(credential.user, {
          url: `${window.location.origin}/dashboard`,
          handleCodeInApp: false,
        }).catch(() => undefined);
      } catch (error) {
        // Never leave an Auth-only account behind when its required Parwaz
        // profile could not be created.
        await removeIncompleteFirebaseUser(credential.user);
        throw error;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (role?: MemberRole): Promise<GoogleSignInResult> => {
      const instance = requireAuth();
      if (!db) throw new Error("Parwaz profile storage is not configured.");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(instance, provider);
      const isNewUser = getAdditionalUserInfo(credential)?.isNewUser === true;
      const owner = isOwnerEmail(credential.user.email);
      let onboarded = false;

      if (isNewUser) {
        if (owner) {
          const stored = await requireExistingProfile(credential.user);
          return { isNewUser: true, isOwner: true, onboarded: stored.onboarded === true };
        }

        // Google on the login screen must never become an accidental signup.
        // A role is supplied only by the dedicated signup flow after the user
        // has chosen account type and accepted the signup terms.
        if (!role) {
          await removeIncompleteFirebaseUser(credential.user);
          throw new Error("No Parwaz account was found for this Google account. Use Create account to join first.");
        }

        try {
          const profileData = newProfileDoc(
            credential.user,
            credential.user.displayName?.trim().replace(/\s+/g, " ") || "",
            role
          );
          await setDoc(doc(db, "users", credential.user.uid), profileData);
          setProfile(
            profileFromSnapshot(
              credential.user.uid,
              (credential.user.email || "").toLowerCase(),
              profileData,
              credential.user
            )
          );
          onboarded = false;
        } catch (error) {
          await removeIncompleteFirebaseUser(credential.user);
          throw error;
        }
      } else {
        try {
          const stored = await requireExistingProfile(credential.user);
          onboarded = stored.onboarded === true;
        } catch (error) {
          await firebaseSignOut(instance).catch(() => undefined);
          throw error;
        }
      }

      return { isNewUser, isOwner: owner, onboarded };
    },
    [requireExistingProfile]
  );

  const switchRole = useCallback(
    async (role: MemberRole) => {
      const instance = requireAuth();
      const current = instance.currentUser;
      if (!current || !db) throw new Error("Sign in before changing how you use Parwaz.");
      const nextProfileComplete = profile ? profileReadyForRole(profile, role) : false;
      await setDoc(
        doc(db, "users", current.uid),
        {
          role: toStoredRole(role),
          isTasker: role === "freelancer",
          profileComplete: nextProfileComplete,
          roleUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfile((previous) =>
        previous ? { ...previous, role, profileComplete: profileReadyForRole(previous, role) } : previous
      );
    },
    [profile]
  );

  const markOnboarded = useCallback(async () => {
    const instance = requireAuth();
    const current = instance.currentUser;
    if (!current || !db) return;
    await setDoc(doc(db, "users", current.uid), { onboarded: true }, { merge: true });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const instance = requireAuth();
    await sendPasswordResetEmail(instance, email.trim().toLowerCase());
  }, []);

  const resendVerification = useCallback(async () => {
    const instance = requireAuth();
    if (!instance.currentUser) throw new Error("Sign in first.");
    await sendEmailVerification(instance.currentUser, {
      url: `${window.location.origin}/dashboard`,
      handleCodeInApp: false,
    });
  }, []);

  const refreshStaff = useCallback(async () => {
    await loadStaff(auth?.currentUser ?? null);
  }, [loadStaff]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    profileUnsub.current?.();
    profileUnsub.current = null;
    setProfile(null);
    setStaff(null);
    await firebaseSignOut(auth);
  }, []);

  const role: MemberRole = profile?.role ?? "client";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      staff,
      permissions: staff?.permissions ?? [],
      capabilities: user && profile ? capabilitiesForProfile(role, staff, profile) : EMPTY_CAPABILITIES,
      isOwner: staff?.isOwner === true || isOwnerEmail(user?.email),
      isStaff: !!staff,
      loading,
      profileLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      switchRole,
      markOnboarded,
      resetPassword,
      resendVerification,
      refreshStaff,
      signOut,
    }),
    [
      user,
      profile,
      role,
      staff,
      loading,
      profileLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      switchRole,
      markOnboarded,
      resetPassword,
      resendVerification,
      refreshStaff,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

export type { MemberRole, Permission, StaffSession };
