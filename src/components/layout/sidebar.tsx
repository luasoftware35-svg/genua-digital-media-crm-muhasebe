"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Kanban,
  Target,
  Wallet,
  BarChart3,
  CalendarDays,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/context/data-context";
import { SidebarQuote } from "./sidebar-quote";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/firmalar", label: "Firmalar", icon: Building2 },
  { href: "/odemeler", label: "Alacaklar", icon: Receipt, badge: true },
  { href: "/projeler", label: "Projeler", icon: Kanban },
  { href: "/teklifler", label: "Teklifler", icon: Target },
  { href: "/giderler", label: "Giderler", icon: Wallet },
  { href: "/takvim", label: "İçerik Takvimi", icon: CalendarDays },
  { href: "/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { overdueCount } = useData();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-[min(280px,85vw)] flex-col border-r border-[#262626] bg-background transition-transform duration-300 lg:w-[240px] lg:translate-x-0 lg:z-30 safe-pt",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-5 border-b border-[#262626] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <span className="font-display text-xl tracking-tight text-accent">
              GENUA
            </span>
            <span className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">
              Panel
            </span>
          </Link>
          <button
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto overscroll-contain">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const showBadge = item.badge && overdueCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                  active
                    ? "bg-accent/5 text-accent"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 font-mono text-[10px] text-white">
                    {overdueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="safe-pb shrink-0">
          <SidebarQuote />
        </div>
      </aside>
    </>
  );
}
