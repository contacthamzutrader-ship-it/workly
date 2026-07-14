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

export type Role = "customer" | "tasker" | "company_admin" | "super_admin";

type AuthContextType = {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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

async function ensureUserDoc(u: User, name: string) {
  if (!db) return;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      name: name || u.displayName || "",
      email: u.email,
      role: "customer",
      isTasker: true,
      isPrivate: false,
      createdAt: serverTimestamp(),
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && db) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role as Role);
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
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    assertConfig();
    await signInWithEmailAndPassword(auth!, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    assertConfig();
    const cred = await createUserWithEmailAndPassword(auth!, email, password);
    await ensureUserDoc(cred.user, name);
  };

  const signInWithGoogle = async () => {
    assertConfig();
    const cred = await signInWithPopup(auth!, new GoogleAuthProvider());
    await ensureUserDoc(cred.user, "");
  };

  const signOut = async () => {
    if (!auth) return;
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}
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
