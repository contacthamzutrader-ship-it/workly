import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAysDw4A8bwBBrR-EI6MhB0-up87vXqRXA",
  authDomain: "workly-c7458.firebaseapp.com",
  projectId: "workly-c7458",
  storageBucket: "workly-c7458.firebasestorage.app",
  messagingSenderId: "230299369193",
  appId: "1:230299369193:web:1d641125c997f20e49ba78",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch {
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
}

export { app, auth, db, storage };
export default app;
