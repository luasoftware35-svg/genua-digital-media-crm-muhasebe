"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./dashboard-shell";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/firmalar": "Firmalar",
  "/odemeler": "Ödemeler",
  "/projeler": "Projeler",
  "/teklifler": "Teklifler",
  "/giderler": "Giderler",
  "/takvim": "İçerik Takvimi",
  "/raporlar": "Raporlar",
  "/ayarlar": "Ayarlar",
};

function resolveTitle(pathname: string): string {
  if (pathname.startsWith("/firmalar/")) return "Firma Detayı";
  return titles[pathname] ?? "Genua Panel";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[240px] min-w-0">
        <Header
          title={resolveTitle(pathname)}
          onMenuClick={() => setOpen(true)}
        />
        <main className="p-3 sm:p-4 lg:p-6 safe-pb min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
