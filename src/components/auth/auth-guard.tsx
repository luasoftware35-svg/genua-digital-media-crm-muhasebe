"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { configured, loading, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!configured) return;
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [configured, loading, firebaseUser, router]);

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-xl border border-[#262626] bg-surface p-6 text-center space-y-3">
          <p className="font-display text-xl text-accent">Firebase gerekli</p>
          <p className="font-mono text-xs text-text-secondary leading-relaxed">
            .env.local dosyasına Firebase ayarlarını ekleyin. Örnek için
            .env.local.example dosyasına bakın.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !firebaseUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
