"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { OWNER_EMAIL, getAdminDoc, ownerSession, type AdminSession, type Permission } from "./admin";

export type Role = "customer" | "tasker" | "moderator" | "company_admin" | "super_admin";

type AuthContextType = {
  user: User | null;
  role: Role | null;
  loading: boolean;
  onboardingCompleted: boolean;
  interviewPassed: boolean;
  adminSession: AdminSession | null;
  permissions: Permission[];
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role: "customer" | "tasker") => Promise<void>;
  signInWithGoogle: (role?: "customer" | "tasker") => Promise<void>;
  setAccountType: (role: "customer" | "tasker") => Promise<void>;
  signOut: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
  setInterviewPassed: (passed: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function assertConfig() {
  if (!auth || !db) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local"
    );
  }
}

let pendingSignupRole: "customer" | "tasker" | null = null;

function newUserProfile(u: User, name: string, selectedRole: "customer" | "tasker") {
  return {
    uid: u.uid,
    name: name || u.displayName || "",
    email: u.email,
    role: selectedRole,
    isTasker: selectedRole === "tasker",
    isPrivate: false,
    wallet: 0,
    profileComplete: false,
    onboardingCompleted: false,
    interviewPassed: false,
    createdAt: serverTimestamp(),
  };
}

async function ensureUserDoc(
  u: User,
  name: string,
  selectedRole: "customer" | "tasker" = "customer",
  forcePublicRole = false
) {
  if (!db) return;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, newUserProfile(u, name, selectedRole));
  } else if (forcePublicRole) {
    await setDoc(ref, {
      role: selectedRole,
      isTasker: selectedRole === "tasker",
      ...(name ? { name } : {}),
    }, { merge: true });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [interviewPassed, setInterviewPassed] = useState<boolean>(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      try {
        if (u && db) {
        // 1) OWNER is always super_admin â€” deterministic, never flaky.
        if (u.email && u.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          setRole("super_admin");
          setAdminSession(ownerSession());
          setOnboardingCompleted(true);
          setInterviewPassed(true);
          if (db) {
            const ref = doc(db, "users", u.uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                uid: u.uid,
                name: u.displayName || "Owner",
                email: u.email,
                role: "super_admin",
                isTasker: true,
                isPrivate: false,
                wallet: 0,
                onboardingCompleted: true,
                interviewPassed: true,
                createdAt: serverTimestamp(),
              });
            }
          }
          return;
        }

        // 2) Regular user doc (for profile / wallet / trust).
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setRole((d.role as Role) || "customer");
          setOnboardingCompleted(Boolean(d.onboardingCompleted));
          setInterviewPassed(Boolean(d.interviewPassed));
        } else {
          const selectedRole = pendingSignupRole || "customer";
          await setDoc(ref, newUserProfile(u, u.displayName || u.email || "", selectedRole));
          setRole(selectedRole);
          setOnboardingCompleted(false);
          setInterviewPassed(false);
        }

        // 3) Check admins collection for permission-based admin.
        const admin = await getAdminDoc(u.uid);
        if (admin) {
          setRole("company_admin");
          setAdminSession({ role: "company_admin", isOwner: false, permissions: admin.permissions });
        } else {
          setAdminSession(null);
        }
        } else {
          setRole(null);
          setAdminSession(null);
          setOnboardingCompleted(false);
          setInterviewPassed(false);
        }
      } catch (error) {
        console.error("Could not load the signed-in Parwaz profile", error);
        setRole(null);
        setAdminSession(null);
        setOnboardingCompleted(false);
        setInterviewPassed(false);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    assertConfig();
    await signInWithEmailAndPassword(auth!, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string, selectedRole: "customer" | "tasker") => {
    assertConfig();
    pendingSignupRole = selectedRole;
    try {
      const cred = await createUserWithEmailAndPassword(auth!, email, password);
      await ensureUserDoc(cred.user, name, selectedRole, true);
      setRole(selectedRole);
      setOnboardingCompleted(false);
      setInterviewPassed(false);
    } finally {
      pendingSignupRole = null;
    }
  };

  const signInWithGoogle = async (selectedRole: "customer" | "tasker" = "customer") => {
    assertConfig();
    pendingSignupRole = selectedRole;
    try {
      const cred = await signInWithPopup(auth!, new GoogleAuthProvider());
      const isNewUser = getAdditionalUserInfo(cred)?.isNewUser === true;
      await ensureUserDoc(cred.user, "", selectedRole, isNewUser);
      if (isNewUser) {
        setRole(selectedRole);
        setOnboardingCompleted(false);
        setInterviewPassed(false);
      }
    } finally {
      pendingSignupRole = null;
    }
  };

  const setAccountType = async (selectedRole: "customer" | "tasker") => {
    assertConfig();
    const currentUser = auth!.currentUser;
    if (!currentUser) throw new Error("Sign in before changing your account type.");
    await setDoc(doc(db!, "users", currentUser.uid), {
      role: selectedRole,
      isTasker: selectedRole === "tasker",
    }, { merge: true });
    setRole(selectedRole);
  };

  const signOut = async () => {
    if (!auth) return;
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        onboardingCompleted,
        interviewPassed,
        adminSession,
        permissions: adminSession?.permissions ?? [],
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        setAccountType,
        signOut,
        setOnboardingCompleted,
        setInterviewPassed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
