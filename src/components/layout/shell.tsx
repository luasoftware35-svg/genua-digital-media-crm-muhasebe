"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useData } from "@/context/data-context";
import { Sidebar } from "./sidebar";
import { Header } from "./dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/firmalar": "Firmalar",
  "/odemeler": "Alacaklar",
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
  const { loading } = useData();

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[240px] min-w-0">
        <Header
          title={resolveTitle(pathname)}
          onMenuClick={() => setOpen(true)}
        />
        <main className="p-3 sm:p-4 lg:p-6 safe-pb min-w-0 overflow-x-hidden">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
