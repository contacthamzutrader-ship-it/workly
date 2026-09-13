"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { CheckCircle2, Clock3, Fingerprint, ScanLine, ShieldCheck, Upload, XCircle } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { withTimeout } from "@/lib/profile-image";
import { formatDate } from "@/lib/format";

interface IdVerification {
  status?: "submitted" | "verified" | "rejected";
  type?: string;
  idNumber?: string;
  documentUrl?: string;
  submittedAt?: string;
  note?: string;
}

const ID_TYPES = [
  { value: "cnic", label: "CNIC" },
  { value: "smart-cnic", label: "Smart CNIC" },
  { value: "passport", label: "Passport" },
];

export default function IdVerificationPanel({ user }: { user: User }) {
  const [verification, setVerification] = useState<IdVerification | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [idType, setIdType] = useState("cnic");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !db) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().idVerification) {
          setVerification(snap.data().idVerification);
        }
      } catch { /* Load is best-effort. */ }
      setLoaded(true);
    })();
  }, [user]);

  const submit = async () => {
    if (!user || !db) return;
    setError("");
    setStatus("");
    if (!idFile) {
      setError("Attach a clear photo of your ID document (front side).");
      return;
    }
    if (!/^image\//.test(idFile.type) || idFile.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    const number = idNumber.trim();
    if (!number) {
      setError("Enter your ID number.");
      return;
    }
    setBusy(true);
    try {
      if (!storage) throw new Error("Document storage is unavailable right now.");
      const idRef = ref(storage, `id-documents/${user.uid}/id`);
      await withTimeout(uploadBytes(idRef, idFile, { contentType: idFile.type }), 20000, "Upload took too long. Check your connection and try again.");
      const documentUrl = await withTimeout(getDownloadURL(idRef), 20000, "Upload took too long. Check your connection and try again.");
      const payload: IdVerification = {
        status: "submitted",
        type: idType,
        idNumber: number,
        documentUrl,
        submittedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, "users", user.uid), { idVerification: payload });
      setVerification(payload);
      setIdType("cnic");
      setIdNumber("");
      setIdFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("Your ID verification has been submitted for review.");
      setTimeout(() => setStatus(""), 5000);
    } catch (err: any) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("permission") || message.includes("denied") || message.includes("authorization")) {
        setError("You don't have permission to upload a document. Sign in and try again.");
      } else {
        setError(err?.message || "Could not submit your ID verification.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return <p className="text-sm font-medium text-ink-400">Loading verification status...</p>;
  }

  const statusBanner = () => {
    if (verification?.status === "verified") {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-600 text-white"><Fingerprint className="h-5 w-5" /></span>
          <div><p className="text-sm font-black text-green-700">Identity verified</p><p className="mt-0.5 text-xs leading-5 text-green-600">Your identity has been confirmed. The verified badge stays active on your account.</p></div>
        </div>
      );
    }
    if (verification?.status === "submitted") {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white"><Clock3 className="h-5 w-5" /></span>
          <div><p className="text-sm font-black text-amber-700">Verification in review</p><p className="mt-0.5 text-xs leading-5 text-amber-600">Submitted {verification.submittedAt ? formatDate(verification.submittedAt) : "recently"}. We usually review ID documents within 48 hours.</p></div>
        </div>
      );
    }
    if (verification?.status === "rejected") {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white"><XCircle className="h-5 w-5" /></span>
          <div><p className="text-sm font-black text-red-700">Verification rejected</p><p className="mt-0.5 text-xs leading-5 text-red-600">{verification.note || "Your document could not be verified. Submit a clearer document to try again."}</p></div>
        </div>
      );
    }
    return null;
  };

  const needsForm = !verification || verification.status === "rejected";

  return (
    <div>
      {statusBanner()}

      {needsForm ? (
        <div className="mt-4 rounded-2xl border border-ink-100 bg-canvas p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><ScanLine className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-ink">Verify your identity</p>
              <p className="mt-0.5 text-xs leading-5 text-ink-400">Upload a clear photo of your CNIC or passport. Your document is stored securely and only used to confirm your identity.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">ID type</label>
              <div className="grid grid-cols-3 gap-2">
                {ID_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setIdType(t.value)} className={`rounded-xl border p-3 text-xs font-extrabold transition ${idType === t.value ? "border-brand bg-brand-50 text-brand-dark" : "border-ink-100 text-ink-500 hover:border-brand/40"}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">ID number</label>
              <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={idType === "passport" ? "e.g. AY1234567" : "e.g. 35202-1234567-8"} className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Document image (front side)</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-200 p-4 text-sm font-semibold text-ink-500 transition hover:border-brand">
                <ScanLine className="h-5 w-5 text-brand" />
                <span className="min-w-0">{idFile ? <span className="truncate">{idFile.name}</span> : "Attach a photo - JPG, PNG or WebP, max 5 MB"}</span>
                <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
          {status && <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-600"><ShieldCheck className="h-4 w-4" /> {status}</div>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={submit} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700 disabled:opacity-60"><Upload className="h-4 w-4" /> {busy ? "Submitting..." : "Submit for verification"}</button>
            <span className="text-xs font-medium text-ink-400">Reviewed by our moderation team, usually within 48 hours.</span>
          </div>
        </div>
      ) : (
        verification.documentUrl && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-400">Submitted document</p>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-ink-100 p-4">
              <img src={verification.documentUrl} alt="Submitted ID document" className="h-20 w-32 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">{ID_TYPES.find((t) => t.value === verification.type)?.label || "ID document"}</p>
                <p className="truncate text-xs text-ink-500">{verification.idNumber}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Status: {verification.status}</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}