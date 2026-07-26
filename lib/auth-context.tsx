"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  profileComplete: boolean;
  interviewStatus: string;
  wallet: number;
  onboarded: boolean;
  createdAt?: unknown;
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: { email: string; password: string; name: string; role: MemberRole }) => Promise<void>;
  signInWithGoogle: (role?: MemberRole) => Promise<{ isNewUser: boolean }>;
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
    throw new Error("Workly is not connected to Firebase yet. Add your NEXT_PUBLIC_FIREBASE_* keys.");
  }
  return auth;
}

function profileFromSnapshot(uid: string, email: string, data: Record<string, any>): WorklyProfile {
  return {
    uid,
    name: data.name || "",
    email: data.email || email,
    role: normalizeRole(data.role),
    isPrivate: data.isPrivate === true,
    suspended: data.suspended === true,
    verified: data.verified === true,
    avatarUrl: data.avatarUrl || "",
    city: data.city || "",
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

/**
 * Role chosen on the signup screen. Google sign-in bounces through a popup,
 * so the choice is stashed here for the auth-state listener that follows.
 */
let pendingRole: MemberRole | null = null;

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

      // Make sure a profile document exists before subscribing, so a fresh
      // Google account never lands in the app without a role.
      try {
        const existing = await getDoc(reference);
        if (!existing.exists()) {
          await setDoc(
            reference,
            isOwnerEmail(email)
              ? { ...newProfileDoc(current, current.displayName || "Owner", "client"), onboarded: true }
              : newProfileDoc(current, current.displayName || "", pendingRole || "client")
          );
        }
      } catch {
        // Rules may block the read for a suspended account; the listener below
        // still reports whatever the account is allowed to see.
      }

      profileUnsub.current = onSnapshot(
        reference,
        (snapshot) => {
          setProfile(snapshot.exists() ? profileFromSnapshot(current.uid, email, snapshot.data()) : null);
          setProfileLoading(false);
          setLoading(false);
        },
        () => {
          setProfile(null);
          setProfileLoading(false);
          setLoading(false);
        }
      );

      await loadStaff(current);
      setLoading(false);
    });

    return () => {
      profileUnsub.current?.();
      unsubscribe();
    };
  }, [loadStaff]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const instance = requireAuth();
    await signInWithEmailAndPassword(instance, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async ({ email, password, name, role }: { email: string; password: string; name: string; role: MemberRole }) => {
      const instance = requireAuth();
      pendingRole = role;
      try {
        const credential = await createUserWithEmailAndPassword(instance, email.trim(), password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() }).catch(() => undefined);
        }
        if (db) {
          await setDoc(doc(db, "users", credential.user.uid), newProfileDoc(credential.user, name.trim(), role), {
            merge: true,
          });
        }
        sendEmailVerification(credential.user).catch(() => undefined);
      } finally {
        pendingRole = null;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (role: MemberRole = "client") => {
    const instance = requireAuth();
    pendingRole = role;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(instance, provider);
      const isNewUser = getAdditionalUserInfo(credential)?.isNewUser === true;
      if (isNewUser && db) {
        await setDoc(
          doc(db, "users", credential.user.uid),
          newProfileDoc(credential.user, credential.user.displayName || "", role),
          { merge: true }
        );
      }
      return { isNewUser };
    } finally {
      pendingRole = null;
    }
  }, []);

  const switchRole = useCallback(async (role: MemberRole) => {
    const instance = requireAuth();
    const current = instance.currentUser;
    if (!current || !db) throw new Error("Sign in before changing how you use Workly.");
    await setDoc(
      doc(db, "users", current.uid),
      { role: toStoredRole(role), isTasker: role === "freelancer", roleUpdatedAt: serverTimestamp() },
      { merge: true }
    );
    setProfile((previous) => (previous ? { ...previous, role } : previous));
  }, []);

  const markOnboarded = useCallback(async () => {
    const instance = requireAuth();
    const current = instance.currentUser;
    if (!current || !db) return;
    await setDoc(doc(db, "users", current.uid), { onboarded: true }, { merge: true });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const instance = requireAuth();
    await sendPasswordResetEmail(instance, email.trim());
  }, []);

  const resendVerification = useCallback(async () => {
    const instance = requireAuth();
    if (!instance.currentUser) throw new Error("Sign in first.");
    await sendEmailVerification(instance.currentUser);
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
      capabilities: user ? capabilitiesFor(role, staff) : EMPTY_CAPABILITIES,
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
