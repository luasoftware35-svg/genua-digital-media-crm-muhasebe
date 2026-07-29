import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | undefined;

function getAppInstance(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase yapılandırması eksik. .env.local dosyasını kontrol edin.");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getClientAuth(): Auth {
  return getAuth(getAppInstance());
}

export function getClientDb(): Firestore {
  return getFirestore(getAppInstance());
}

export function getClientStorage(): FirebaseStorage {
  return getStorage(getAppInstance());
}
