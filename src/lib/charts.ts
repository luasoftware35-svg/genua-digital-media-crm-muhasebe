import type { Company, Expense, Receivable } from "./types";

const MONTH_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** Son 12 ay — tahsil edilen alacaklardan */
export function buildMonthlyRevenue(receivables: Receivable[]) {
  const now = new Date();
  const result: { month: string; gelir: number; key: string }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: MONTH_TR[d.getMonth()],
      gelir: 0,
      key: monthKey(d),
    });
  }

  const map = Object.fromEntries(result.map((r) => [r.key, r]));

  receivables
    .filter((r) => r.status === "odendi")
    .forEach((r) => {
      const d = new Date(r.paid_at ?? r.created_at);
      const k = monthKey(d);
      if (map[k]) map[k].gelir += r.amount;
    });

  return result.map(({ month, gelir }) => ({ month, gelir }));
}

/** Aktif firmaların hizmetlerine göre MRR dağılımı */
export function buildServiceRevenue(companies: Company[]) {
  const map = new Map<string, number>();
  companies
    .filter((c) => c.status === "aktif" && c.monthly_fee > 0)
    .forEach((c) => {
      const services = c.services.length ? c.services : ["Diğer"];
      const share = c.monthly_fee / services.length;
      services.forEach((s) => {
        map.set(s, (map.get(s) ?? 0) + share);
      });
    });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}

/** Son 6 ay gelir vs gider */
export function buildIncomeVsExpense(
  receivables: Receivable[],
  expenses: Expense[]
) {
  const now = new Date();
  const result: {
    month: string;
    gelir: number;
    gider: number;
    key: string;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: MONTH_TR[d.getMonth()],
      gelir: 0,
      gider: 0,
      key: monthKey(d),
    });
  }

  const map = Object.fromEntries(result.map((r) => [r.key, r]));

  receivables
    .filter((r) => r.status === "odendi")
    .forEach((r) => {
      const k = monthKey(new Date(r.paid_at ?? r.created_at));
      if (map[k]) map[k].gelir += r.amount;
    });

  expenses.forEach((e) => {
    const k = monthKey(new Date(e.date));
    if (map[k]) map[k].gider += e.amount;
  });

  return result.map(({ month, gelir, gider }) => ({
    month,
    gelir,
    gider,
    kar: gelir - gider,
  }));
}

export function calcMomChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
