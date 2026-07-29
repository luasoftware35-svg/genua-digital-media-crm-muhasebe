"use client";

import { Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./global-search";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useData();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-[#262626] bg-background/90 backdrop-blur-md px-3 sm:px-4 lg:px-6 safe-pt">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 h-10 w-10"
        onClick={onMenuClick}
        aria-label="Menü"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="font-display text-base sm:text-lg md:text-xl tracking-tight truncate min-w-0">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
        <GlobalSearch />
        <div className="flex items-center gap-2">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover border border-[#262626]"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent font-display text-xs">
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="font-mono text-[10px] text-text-secondary mt-0.5">
              {user.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Çıkış"
            onClick={() => router.push("/login")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
