"use client";

import Link from "next/link";
import {
  Building2,
  Receipt,
  Kanban,
  Target,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  {
    href: "/firmalar",
    icon: Building2,
    title: "Firma ekle",
    desc: "İlk müşterini kaydet",
  },
  {
    href: "/odemeler",
    icon: Receipt,
    title: "Alacak ekle",
    desc: "Yapılan iş veya beklenen ödeme",
  },
  {
    href: "/projeler",
    icon: Kanban,
    title: "Proje aç",
    desc: "İşleri board'a taşı",
  },
  {
    href: "/teklifler",
    icon: Target,
    title: "Teklif gönder",
    desc: "Pipeline'ı doldur",
  },
  {
    href: "/giderler",
    icon: Wallet,
    title: "Gider yaz",
    desc: "Kârı net gör",
  },
  {
    href: "/takvim",
    icon: CalendarDays,
    title: "İçerik planla",
    desc: "Takvimi doldur",
  },
];

export function OnboardingCard() {
  return (
    <Card className="border-accent/20 bg-accent/[0.03]">
      <CardHeader>
        <CardTitle className="text-base">Başlamak için</CardTitle>
        <p className="text-sm text-text-secondary">
          Panel boş — sırayla ekle, grafikler kendiliğinden dolacak.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Button
                key={s.href}
                asChild
                variant="secondary"
                className="h-auto justify-start gap-3 px-3 py-3"
              >
                <Link href={s.href}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-medium text-text-primary">
                      {s.title}
                    </span>
                    <span className="block text-xs text-text-secondary font-normal">
                      {s.desc}
                    </span>
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
