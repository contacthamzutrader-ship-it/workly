import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export type FirebaseAdminServices = {
  app: App;
  auth: Auth;
  db: Firestore;
};

let services: FirebaseAdminServices | null = null;

function serviceAccountCredential() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (encoded) {
    const raw = encoded.trim().startsWith("{")
      ? encoded
      : Buffer.from(encoded, "base64").toString("utf8");
    const account = JSON.parse(raw);
    return cert({
      projectId: account.project_id || account.projectId,
      clientEmail: account.client_email || account.clientEmail,
      privateKey: String(account.private_key || account.privateKey || "").replace(/\\n/g, "\n"),
    });
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  // Works automatically on Google-managed runtimes and with
  // GOOGLE_APPLICATION_CREDENTIALS during local development.
  return applicationDefault();
}

export function getFirebaseAdmin(): FirebaseAdminServices {
  if (services) return services;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "Parwaz-c7458";

  const app = getApps().length
    ? getApp()
    : initializeApp({ credential: serviceAccountCredential(), projectId });

  services = { app, auth: getAuth(app), db: getFirestore(app) };
  return services;
}

export async function requireFirebaseUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new Error("AUTH_REQUIRED");
  return getFirebaseAdmin().auth.verifyIdToken(token, true);
}
