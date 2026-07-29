"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useData } from "@/context/data-context";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const { companies, invoices, projects, proposals } = useData();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];

    const items: {
      href: string;
      label: string;
      meta: string;
      type: string;
    }[] = [];

    companies.forEach((c) => {
      if (
        c.name.toLowerCase().includes(query) ||
        c.contact_name.toLowerCase().includes(query) ||
        c.city.toLowerCase().includes(query)
      ) {
        items.push({
          href: `/firmalar/${c.id}`,
          label: c.name,
          meta: `${c.city} · ${c.sector}`,
          type: "Firma",
        });
      }
    });

    invoices.forEach((inv) => {
      const company = companies.find((c) => c.id === inv.company_id);
      if (
        inv.invoice_no.toLowerCase().includes(query) ||
        company?.name.toLowerCase().includes(query)
      ) {
        items.push({
          href: "/odemeler",
          label: inv.invoice_no,
          meta: `${company?.name ?? "—"} · ${formatCurrency(inv.total)}`,
          type: "Fatura",
        });
      }
    });

    projects.forEach((p) => {
      if (p.title.toLowerCase().includes(query)) {
        items.push({
          href: "/projeler",
          label: p.title,
          meta: p.type,
          type: "Proje",
        });
      }
    });

    proposals.forEach((p) => {
      if (p.company_name.toLowerCase().includes(query)) {
        items.push({
          href: "/teklifler",
          label: p.company_name,
          meta: formatCurrency(p.amount),
          type: "Teklif",
        });
      }
    });

    return items.slice(0, 8);
  }, [q, companies, invoices, projects, proposals]);

  return (
    <div className="relative hidden md:block w-56 lg:w-64">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary pointer-events-none" />
      <Input
        placeholder="Ara: firma, fatura..."
        className="h-9 pl-9 bg-surface border-[#262626]"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-[#262626] bg-surface shadow-lg overflow-hidden">
          <ul>
            {results.map((r, i) => (
              <li key={`${r.href}-${r.label}-${i}`}>
                <Link
                  href={r.href}
                  className={cn(
                    "flex items-start justify-between gap-2 px-3 py-2.5 text-sm hover:bg-surface-hover"
                  )}
                  onClick={() => {
                    setQ("");
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.label}</p>
                    <p className="font-mono text-[10px] text-text-secondary truncate">
                      {r.meta}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-accent">
                    {r.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
