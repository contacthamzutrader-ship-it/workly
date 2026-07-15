"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function SetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/login?redirect=/setup"); }, [loading, user, router]);

  const doSetup = async () => {
    if (!user || !db) return;
    setStatus("working");
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await setDoc(ref, { role: "super_admin" }, { merge: true });
      } else {
        await setDoc(ref, {
          uid: user.uid,
          name: user.displayName || user.email || "",
          email: user.email,
          role: "super_admin",
          isTasker: true,
          isPrivate: false,
          createdAt: serverTimestamp(),
        });
      }
      setStatus("done");
      setMsg("Role set to super_admin! Now go to /admin");
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message || "Something went wrong");
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 shadow-card text-center">
        <h1 className="text-2xl font-extrabold text-ink">Admin Setup</h1>
        <p className="mt-2 text-ink-500">Click below to set your role to super_admin</p>
        <p className="mt-1 text-sm text-ink-400">Logged in as: {user.email}</p>

        {status === "done" ? (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-700">
            <p className="font-semibold">{msg}</p>
            <button onClick={() => { window.location.href = "/admin"; }} className="mt-3 inline-block rounded-lg bg-brand px-6 py-2 text-white font-semibold">Go to Admin</button>
          </div>
        ) : status === "error" ? (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            <p>{msg}</p>
            <Button className="mt-3" onClick={doSetup}>Retry</Button>
          </div>
        ) : (
          <Button className="mt-6 w-full" onClick={doSetup} disabled={status === "working"}>
            {status === "working" ? "Setting up..." : "Set me as Super Admin"}
          </Button>
        )}
      </div>
    </div>
  );
}
