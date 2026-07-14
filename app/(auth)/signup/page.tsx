"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signUpWithEmail(email, password, name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink"><UserPlus className="h-6 w-6 text-brand" /> Create your account</h1>
      <p className="mt-1 text-sm text-ink/60">Join Workly to post or do tasks</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating..." : "Sign up"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-ink/10" /> OR{" "}
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <Button variant="secondary" onClick={google} disabled={busy} className="w-full">
        Continue with Google
      </Button>

      <p className="mt-4 text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Login
        </Link>
      </p>
    </div>
  );
}
