"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-posta veya şifre hatalı";
      case "auth/too-many-requests":
        return "Çok fazla deneme. Lütfen biraz bekleyin.";
      case "auth/invalid-email":
        return "Geçersiz e-posta adresi";
      default:
        return "Giriş yapılamadı. Bilgilerinizi kontrol edin.";
    }
  }
  return "Giriş yapılamadı";
}

export default function LoginPage() {
  const router = useRouter();
  const { configured, loading, firebaseUser, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Firebase yapılandırması eksik");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Hoş geldin");
      router.push("/dashboard");
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error("Önce e-posta adresinizi girin");
      return;
    }
    setResetting(true);
    try {
      await resetPassword(email.trim());
      toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi");
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setResetting(false);
    }
  };

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-[#262626] bg-surface p-6 text-center space-y-3">
          <h1 className="font-display text-2xl text-accent">GENUA</h1>
          <p className="font-mono text-xs text-text-secondary leading-relaxed">
            Firebase ayarları bulunamadı. Proje kökünde{" "}
            <code className="text-accent">.env.local</code> oluşturup Firebase
            bilgilerini ekleyin. Detaylar için README.md dosyasına bakın.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-8 overflow-hidden safe-pb safe-pt">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(219,255,43,0.12), transparent)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-tight text-accent">
            GENUA
          </h1>
          <p className="mt-2 font-mono text-xs text-text-secondary uppercase tracking-widest">
            Digital — Ajans Paneli
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#262626] bg-surface p-6 space-y-4 shadow-glow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetting}
            className="w-full font-mono text-[11px] text-text-secondary hover:text-accent transition-colors"
          >
            {resetting ? "Gönderiliyor..." : "Şifremi unuttum"}
          </button>
          <p className="font-mono text-[10px] text-center text-text-secondary">
            Firebase Authentication ile giriş
          </p>
        </form>
      </div>
    </div>
  );
}
