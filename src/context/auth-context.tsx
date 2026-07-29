"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { Profile } from "@/lib/types";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  firebaseUser: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureProfile(user: User): Promise<Profile> {
  const db = getClientDb();
  const ref = doc(db, COLLECTIONS.profiles, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { id: snap.id, ...(snap.data() as Omit<Profile, "id">) };
  }

  const profile: Omit<Profile, "id"> = {
    full_name: user.displayName || user.email?.split("@")[0] || "Kullanıcı",
    email: user.email ?? "",
    role: "admin",
  };
  await setDoc(ref, profile);
  return { id: user.uid, ...profile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const p = await ensureProfile(user);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getClientAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await ensureProfile(cred.user);
    setProfile(p);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getClientAuth());
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      loading,
      firebaseUser,
      profile,
      signIn,
      signOut,
    }),
    [configured, loading, firebaseUser, profile, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
