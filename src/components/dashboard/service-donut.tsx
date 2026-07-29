"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#DBFF2B", "#A8C922", "#6B7A1A", "#8A8A8A", "#4A4A4A"];

interface Props {
  data: { name: string; value: number }[];
}

export function ServiceDonut({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hizmet Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-xs text-text-secondary py-16 text-center">
            Veri yok — fatura/hizmet girince dolacak
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hizmet Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#141414",
                  border: "1px solid #262626",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1.5">
          {data.map((d, i) => (
            <li
              key={d.name}
              className="flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-2 text-text-secondary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {d.name}
              </span>
              <span className="font-mono">{formatCurrency(d.value)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
