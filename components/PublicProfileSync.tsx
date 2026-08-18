"use client";

import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { syncPublicProfile } from "@/lib/public-profile";

export default function PublicProfileSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user || !db) return;
    let timer: number | undefined;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (!snapshot.exists()) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        syncPublicProfile().catch(() => undefined);
      }, 350);
    });
    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [loading, user]);

  return null;
}
