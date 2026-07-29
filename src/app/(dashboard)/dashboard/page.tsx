"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { useData } from "@/context/data-context";
import {
  buildMonthlyRevenue,
  buildServiceRevenue,
  calcMomChange,
} from "@/lib/charts";
import { formatCurrency, daysUntil } from "@/lib/format";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ServiceDonut } from "@/components/dashboard/service-donut";
import { EmptyState } from "@/components/ui/empty-state";
import { OnboardingCard } from "@/components/shared/onboarding";

export default function DashboardPage() {
  const { companies, invoices, projects, activities, proposals } = useData();

  const isEmpty =
    companies.length === 0 &&
    invoices.length === 0 &&
    projects.length === 0 &&
    proposals.length === 0;

  const activeCompanies = companies.filter((c) => c.status === "aktif");
  const mrr = activeCompanies.reduce((s, c) => s + c.monthly_fee, 0);

  const now = new Date();
  const thisMonthPaid = invoices
    .filter((i) => {
      const d = new Date(i.issue_date);
      return (
        i.status === "odendi" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, i) => s + i.total, 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPaid = invoices
    .filter((i) => {
      const d = new Date(i.issue_date);
      return (
        i.status === "odendi" &&
        d.getMonth() === lastMonth.getMonth() &&
        d.getFullYear() === lastMonth.getFullYear()
      );
    })
    .reduce((s, i) => s + i.total, 0);

  const pending = invoices.filter(
    (i) => i.status === "bekliyor" || i.status === "gecikti"
  );
  const pendingTotal = pending.reduce((s, i) => s + i.total, 0);
  const openProjects = projects.filter((p) => p.status !== "tamamlandi");

  const monthly = useMemo(() => buildMonthlyRevenue(invoices), [invoices]);
  const serviceRev = useMemo(
    () => buildServiceRevenue(companies),
    [companies]
  );

  const upcoming = invoices
    .filter((i) => {
      if (i.status !== "bekliyor") return false;
      const d = daysUntil(i.due_date);
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date));

  const pipeline = [
    {
      name: "Gönderilen",
      count: proposals.filter((p) => p.status === "gonderildi").length,
    },
    {
      name: "Cevap",
      count: proposals.filter((p) => p.status === "cevap").length,
    },
    {
      name: "Teklif",
      count: proposals.filter((p) => p.status === "gorusme").length,
    },
    {
      name: "Kapanan",
      count: proposals.filter(
        (p) => p.status === "kazanildi" || p.status === "kaybedildi"
      ).length,
    },
  ];

  return (
    <PageMotion className="space-y-6">
      {isEmpty && (
        <MotionItem>
          <OnboardingCard />
        </MotionItem>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionItem>
          <KpiCard
            title="Aylık Gelir (MRR)"
            value={formatCurrency(mrr)}
            change={calcMomChange(thisMonthPaid || mrr, lastMonthPaid || mrr)}
          />
        </MotionItem>
        <MotionItem>
          <KpiCard
            title="Aktif Müşteri"
            value={String(activeCompanies.length)}
            change={0}
          />
        </MotionItem>
        <MotionItem>
          <KpiCard
            title="Bekleyen Ödeme"
            value={formatCurrency(pendingTotal)}
            change={0}
          />
        </MotionItem>
        <MotionItem>
          <KpiCard
            title="Açık Proje"
            value={String(openProjects.length)}
            change={0}
          />
        </MotionItem>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MotionItem className="lg:col-span-2">
          <RevenueChart data={monthly} />
        </MotionItem>
        <MotionItem>
          <ServiceDonut data={serviceRev} />
        </MotionItem>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MotionItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yaklaşan Ödemeler</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  message="7 gün içinde vadesi gelen yok — rahat nefes al"
                  className="py-8"
                />
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((inv) => {
                    const company = companies.find(
                      (c) => c.id === inv.company_id
                    );
                    const days = daysUntil(inv.due_date);
                    return (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-2 border-b border-[#262626] pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {company?.name}
                          </p>
                          <p className="font-mono text-xs text-text-secondary">
                            {days === 0
                              ? "Bugün"
                              : days === 1
                                ? "Yarın"
                                : `${days} gün`}
                          </p>
                        </div>
                        <span className="font-mono text-sm text-accent">
                          {formatCurrency(inv.total)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </MotionItem>

        <MotionItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="font-mono text-xs text-text-secondary py-8 text-center">
                  Henüz aktivite yok
                </p>
              ) : (
                <ul className="space-y-4">
                  {activities.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <div>
                        <p className="text-sm leading-snug">{a.description}</p>
                        <p className="font-mono text-[10px] text-text-secondary mt-1">
                          {formatDistanceToNow(new Date(a.created_at), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </MotionItem>

        <MotionItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeline}>
                    <XAxis
                      dataKey="name"
                      stroke="#8A8A8A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "#141414",
                        border: "1px solid #262626",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#DBFF2B"
                      radius={[4, 4, 0, 0]}
                      name="Adet"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </div>
    </PageMotion>
  );
}
