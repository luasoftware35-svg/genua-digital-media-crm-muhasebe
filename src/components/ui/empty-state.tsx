import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  className?: string;
}

export function EmptyState({ icon: Icon, message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-surface-hover p-4 border border-[#262626]">
        <Icon className="h-6 w-6 text-text-secondary" />
      </div>
      <p className="font-mono text-sm text-text-secondary max-w-xs">{message}</p>
    </div>
  );
}
