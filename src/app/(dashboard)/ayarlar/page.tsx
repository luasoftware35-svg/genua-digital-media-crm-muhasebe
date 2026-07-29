"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { SERVICE_TYPES } from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const roleLabel = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
} as const;

export default function AyarlarPage() {
  const { user, profiles, updateProfile } = useData();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [vat, setVat] = useState("20");
  const [currency, setCurrency] = useState("TRY");
  const [services, setServices] = useState([...SERVICE_TYPES]);
  const [newService, setNewService] = useState("");

  useEffect(() => {
    setName(user.full_name);
    setEmail(user.email);
  }, [user.full_name, user.email]);

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateProfile({ avatar_url: reader.result });
        toast.success("Avatar güncellendi");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast.error("Ad soyad zorunlu");
      return;
    }
    updateProfile({
      full_name: name.trim(),
      email: email.trim(),
    });
    toast.success("Profil kaydedildi");
  };

  const handleSaveDefaults = () => {
    toast.success("Varsayılanlar kaydedildi");
  };

  return (
    <PageMotion className="mx-auto max-w-3xl space-y-6 lg:mx-0">
      <MotionItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative shrink-0"
                aria-label="Avatar değiştir"
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-16 w-16 rounded-full border border-[#262626] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#262626] bg-accent/10 font-display text-lg text-accent">
                    {initials}
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div>
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="font-mono text-[10px] text-text-secondary">
                  {user.email}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileRef.current?.click()}
                >
                  Fotoğraf yükle
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ad Soyad</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile}>Kaydet</Button>
          </CardContent>
        </Card>
      </MotionItem>

      <MotionItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ekip</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {profiles.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border border-[#262626] px-4 py-3",
                    p.id === user.id && "border-accent/20 bg-accent/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full border border-[#262626] object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-display text-xs text-accent">
                        {p.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="font-mono text-[10px] text-text-secondary">
                        {p.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      p.role === "admin"
                        ? "default"
                        : p.role === "editor"
                          ? "info"
                          : "muted"
                    }
                  >
                    {roleLabel[p.role]}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </MotionItem>

      <MotionItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hizmet Tipleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setServices((prev) => prev.filter((x) => x !== s));
                    toast.message(`${s} kaldırıldı`);
                  }}
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:border-danger/40"
                  >
                    {s} ×
                  </Badge>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Yeni hizmet..."
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newService.trim()) {
                    setServices((prev) => [...prev, newService.trim()]);
                    setNewService("");
                    toast.success("Hizmet eklendi");
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!newService.trim()) return;
                  setServices((prev) => [...prev, newService.trim()]);
                  setNewService("");
                  toast.success("Hizmet eklendi");
                }}
              >
                Ekle
              </Button>
            </div>
          </CardContent>
        </Card>
      </MotionItem>

      <MotionItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Varsayılanlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>KDV oranı (%)</Label>
                <Input value={vat} onChange={(e) => setVat(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Para birimi</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSaveDefaults}>Kaydet</Button>
          </CardContent>
        </Card>
      </MotionItem>
    </PageMotion>
  );
}
