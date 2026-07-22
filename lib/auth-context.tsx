"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  adminSession: AdminSession | null;
  permissions: Permission[];
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role: "customer" | "tasker") => Promise<void>;
  signInWithGoogle: (role?: "customer" | "tasker") => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function assertConfig() {
  if (!auth || !db) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local"
    );
  }
}

async function ensureUserDoc(u: User, name: string, selectedRole: "customer" | "tasker" = "customer") {
  if (!db) return;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      name: name || u.displayName || "",
      email: u.email,
      role: selectedRole,
      isTasker: selectedRole === "tasker",
      isPrivate: false,
      createdAt: serverTimestamp(),
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && db) {
        // 1) OWNER is always super_admin — deterministic, never flaky.
        if (u.email && u.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          setRole("super_admin");
          setAdminSession(ownerSession());
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
                createdAt: serverTimestamp(),
              });
            }
          }
          setLoading(false);
          return;
        }

        // 2) Regular user doc (for profile / wallet / trust).
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole((snap.data().role as Role) || "customer");
        } else {
          await setDoc(ref, {
            uid: u.uid,
            name: u.displayName || u.email || "",
            email: u.email,
            role: "customer",
            isTasker: true,
            isPrivate: false,
            createdAt: serverTimestamp(),
          });
          setRole("customer");
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
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    assertConfig();
    await signInWithEmailAndPassword(auth!, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string, selectedRole: "customer" | "tasker") => {
    assertConfig();
    const cred = await createUserWithEmailAndPassword(auth!, email, password);
    await ensureUserDoc(cred.user, name, selectedRole);
  };

  const signInWithGoogle = async (selectedRole: "customer" | "tasker" = "customer") => {
    assertConfig();
    const cred = await signInWithPopup(auth!, new GoogleAuthProvider());
    await ensureUserDoc(cred.user, "", selectedRole);
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
        adminSession,
        permissions: adminSession?.permissions ?? [],
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
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
