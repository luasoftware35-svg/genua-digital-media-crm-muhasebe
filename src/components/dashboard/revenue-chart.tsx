"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface Props {
  data: { month: string; gelir: number }[];
}

export function RevenueChart({ data }: Props) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Son 12 Ay Gelir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="limeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DBFF2B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#DBFF2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                stroke="#8A8A8A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8A8A8A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#141414",
                  border: "1px solid #262626",
                  borderRadius: 8,
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  formatCurrency(Number(value ?? 0)),
                  "Gelir",
                ]}
              />
              <Area
                type="monotone"
                dataKey="gelir"
                stroke="#DBFF2B"
                strokeWidth={2}
                fill="url(#limeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
