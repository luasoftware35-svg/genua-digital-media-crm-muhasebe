"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  subtitle?: string;
}

export function KpiCard({ title, value, change, subtitle }: KpiCardProps) {
  const positive = change >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="mt-2 font-mono text-xl sm:text-2xl md:text-3xl font-medium tracking-tight break-all">
          {value}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-mono text-xs",
              positive ? "text-accent" : "text-danger"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {formatPercent(change)}
          </span>
          <span className="text-xs text-text-secondary">
            {subtitle ?? "geçen aya göre"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
