"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("umut@genuadigital.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Hoş geldin — panel hazır");
    router.push("/dashboard");
  };

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
          <p className="font-mono text-[10px] text-center text-text-secondary">
            Demo mod — herhangi bir şifre ile gir
          </p>
        </form>
      </div>
    </div>
  );
}
