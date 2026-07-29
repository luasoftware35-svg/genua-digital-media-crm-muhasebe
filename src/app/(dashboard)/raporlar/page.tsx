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
  const { invoices, expenses, companies } = useData();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(now.getFullYear()));

  const m = Number(month);
  const y = Number(year);

  const monthInvoices = invoices.filter((i) => {
    const d = new Date(i.issue_date);
    return d.getMonth() === m && d.getFullYear() === y;
  });

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });

  const gelir = monthInvoices
    .filter((i) => i.status === "odendi")
    .reduce((s, i) => s + i.total, 0);
  const kesilen = monthInvoices.reduce((s, i) => s + i.total, 0);
  const gider = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const kar = gelir - gider;
  const tahsilatOrani = kesilen
    ? Math.round((gelir / kesilen) * 100)
    : 0;

  const newCompanies = companies.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === m && d.getFullYear() === y;
  }).length;

  const lostCompanies = companies.filter((c) => c.status === "pasif").length;

  const yearlyByCompany = useMemo(() => {
    return companies
      .map((c) => {
        const total = invoices
          .filter(
            (i) =>
              i.company_id === c.id &&
              new Date(i.issue_date).getFullYear() === y &&
              i.status === "odendi"
          )
          .reduce((s, i) => s + i.total, 0);
        return { name: c.name, total };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [companies, invoices, y]);

  const topService =
    buildServiceRevenue(companies)[0]?.name ?? "—";

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
            {[2025, 2026].map((yr) => (
              <SelectItem key={yr} value={String(yr)}>
                {yr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MotionItem>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Gelir (tahsil)", value: formatCurrency(gelir) },
          { label: "Gider", value: formatCurrency(gider) },
          {
            label: "Net Kâr",
            value: formatCurrency(kar),
            accent: kar >= 0,
          },
          {
            label: "Kesilen Fatura",
            value: String(monthInvoices.length),
          },
          { label: "Tahsilat Oranı", value: `%${tahsilatOrani}` },
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
              {y} Firma Bazlı Gelir
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
