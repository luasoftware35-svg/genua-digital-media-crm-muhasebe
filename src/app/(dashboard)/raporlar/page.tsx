"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/data-context";
import { formatCurrency } from "@/lib/format";
import { buildServiceRevenue } from "@/lib/charts";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function RaporlarPage() {
  const { receivables, expenses, companies } = useData();
  const now = new Date();
  const currentYear = now.getFullYear();
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(currentYear));

  const m = Number(month);
  const y = Number(year);

  const monthReceivables = receivables.filter((r) => {
    const d = new Date(r.paid_at ?? r.created_at);
    return d.getMonth() === m && d.getFullYear() === y;
  });

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });

  const gelir = monthReceivables
    .filter((r) => r.status === "odendi")
    .reduce((s, r) => s + r.amount, 0);
  const acikAlacak = receivables
    .filter((r) => r.status === "bekliyor" || r.status === "gecikti")
    .reduce((s, r) => s + r.amount, 0);
  const gider = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const kar = gelir - gider;
  const tahsilEdilenAdet = monthReceivables.filter(
    (r) => r.status === "odendi"
  ).length;

  const newCompanies = companies.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === m && d.getFullYear() === y;
  }).length;

  const lostCompanies = companies.filter((c) => {
    if (c.status !== "pasif") return false;
    const d = new Date(c.updated_at ?? c.created_at);
    return d.getMonth() === m && d.getFullYear() === y;
  }).length;

  const years = useMemo(() => {
    const set = new Set<number>([currentYear]);
    receivables.forEach((r) =>
      set.add(new Date(r.paid_at ?? r.created_at).getFullYear())
    );
    expenses.forEach((e) => set.add(new Date(e.date).getFullYear()));
    companies.forEach((c) =>
      set.add(new Date(c.created_at).getFullYear())
    );
    return Array.from(set).sort((a, b) => b - a);
  }, [receivables, expenses, companies, currentYear]);

  const yearlyByCompany = useMemo(() => {
    return companies
      .map((c) => {
        const total = receivables
          .filter(
            (r) =>
              r.company_id === c.id &&
              r.status === "odendi" &&
              new Date(r.paid_at ?? r.created_at).getFullYear() === y
          )
          .reduce((s, r) => s + r.amount, 0);
        return { name: c.name, total };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [companies, receivables, y]);

  const topService = buildServiceRevenue(companies)[0]?.name ?? "—";

  return (
    <PageMotion className="space-y-6">
      <MotionItem className="flex flex-wrap gap-2">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((label, i) => (
              <SelectItem key={label} value={String(i)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((yr) => (
              <SelectItem key={yr} value={String(yr)}>
                {yr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MotionItem>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Tahsil Edilen", value: formatCurrency(gelir) },
          { label: "Açık Alacak (toplam)", value: formatCurrency(acikAlacak) },
          { label: "Gider", value: formatCurrency(gider) },
          {
            label: "Net Kâr",
            value: formatCurrency(kar),
            accent: kar >= 0,
          },
          {
            label: "Tahsil Kaydı",
            value: String(tahsilEdilenAdet),
          },
          { label: "Yeni Müşteri", value: String(newCompanies) },
          { label: "Pasif / Kaybedilen", value: String(lostCompanies) },
          { label: "En Kârlı Hizmet", value: topService },
        ].map((s) => (
          <MotionItem key={s.label}>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-text-secondary">{s.label}</p>
                <p
                  className={`mt-2 font-mono text-2xl ${
                    "accent" in s && s.accent !== undefined
                      ? s.accent
                        ? "text-accent"
                        : "text-danger"
                      : ""
                  }`}
                >
                  {s.value}
                </p>
              </CardContent>
            </Card>
          </MotionItem>
        ))}
      </div>

      <MotionItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {y} Firma Bazlı Tahsilat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#262626] text-left text-text-secondary">
                    <th className="pb-3 font-medium">Firma</th>
                    <th className="pb-3 font-medium text-right">Tahsilat</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyByCompany.map((r) => (
                    <tr
                      key={r.name}
                      className="border-b border-[#262626] last:border-0"
                    >
                      <td className="py-3">{r.name}</td>
                      <td className="py-3 text-right font-mono text-accent">
                        {formatCurrency(r.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </MotionItem>
    </PageMotion>
  );
}
