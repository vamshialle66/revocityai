import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initPromise: Promise<void> | null = null;

async function fetchFirebaseConfig(): Promise<FirebaseWebConfig> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${baseUrl}/functions/v1/get-firebase-config`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let message = "Failed to load Firebase config";
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as FirebaseWebConfig;
}

export async function initFirebase() {
  if (app) return;
  if (!initPromise) {
    initPromise = (async () => {
      const firebaseConfig = await fetchFirebaseConfig();
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    })();
  }
  await initPromise;
}

export async function getAuthAsync(): Promise<Auth> {
  await initFirebase();
  if (!auth) throw new Error("Firebase Auth not initialized");
  return auth;
}

export async function getDbAsync(): Promise<Firestore> {
  await initFirebase();
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

