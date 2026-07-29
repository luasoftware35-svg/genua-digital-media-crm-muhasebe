"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import {
  formatCurrency,
  formatShortDate,
  calcTotal,
  daysUntil,
} from "@/lib/format";
import {
  INVOICE_STATUS_LABELS,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InvoiceStatusBadge } from "@/components/shared/status-badges";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const schema = z.object({
  company_id: z.string().min(1, "Firma seçin"),
  amount: z.coerce.number().positive("Tutar pozitif olmalı"),
  vat_rate: z.coerce.number().min(0).max(100),
  issue_date: z.string().min(1),
  due_date: z.string().min(1),
  description: z.string().optional(),
  is_recurring: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const defaultForm: FormData = {
  company_id: "",
  amount: 0,
  vat_rate: 20,
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  description: "",
  is_recurring: false,
};

function isOverdue(inv: Invoice) {
  return (
    inv.status === "gecikti" ||
    (inv.status === "bekliyor" && daysUntil(inv.due_date) < 0)
  );
}

export default function OdemelerPage() {
  const {
    companies,
    invoices,
    addInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
  } = useData();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthInvoices = invoices.filter((i) => {
    const d = new Date(i.issue_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const kesilen = monthInvoices.reduce((s, i) => s + i.total, 0);
  const tahsil = monthInvoices
    .filter((i) => i.status === "odendi")
    .reduce((s, i) => s + i.total, 0);
  const bekleyen = invoices
    .filter((i) => i.status === "bekliyor")
    .reduce((s, i) => s + i.total, 0);
  const geciken = invoices
    .filter((i) => isOverdue(i))
    .reduce((s, i) => s + i.total, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return invoices.filter((inv) => {
      const matchStatus =
        statusFilter === "all" || inv.status === statusFilter;
      const matchCompany =
        companyFilter === "all" || inv.company_id === companyFilter;
      const matchSearch =
        !q || inv.invoice_no.toLowerCase().includes(q);
      return matchStatus && matchCompany && matchSearch;
    });
  }, [invoices, statusFilter, companyFilter, search]);

  const addForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const addAmount = addForm.watch("amount");
  const addVat = addForm.watch("vat_rate");
  const addPreviewTotal = useMemo(
    () => calcTotal(Number(addAmount) || 0, Number(addVat) || 0),
    [addAmount, addVat]
  );

  const editAmount = editForm.watch("amount");
  const editVat = editForm.watch("vat_rate");
  const editPreviewTotal = useMemo(
    () => calcTotal(Number(editAmount) || 0, Number(editVat) || 0),
    [editAmount, editVat]
  );

  const openEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    editForm.reset({
      company_id: inv.company_id,
      amount: inv.amount,
      vat_rate: inv.vat_rate,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      description: inv.description ?? "",
      is_recurring: inv.is_recurring,
    });
    setEditOpen(true);
  };

  const onAdd = (data: FormData) => {
    addInvoice({
      company_id: data.company_id,
      amount: data.amount,
      vat_rate: data.vat_rate,
      issue_date: data.issue_date,
      due_date: data.due_date,
      status: "bekliyor",
      is_recurring: data.is_recurring,
      description: data.description,
    });
    toast.success("Fatura oluşturuldu");
    setAddOpen(false);
    addForm.reset(defaultForm);
  };

  const onEdit = (data: FormData) => {
    if (!editingId) return;
    updateInvoice(editingId, {
      company_id: data.company_id,
      amount: data.amount,
      vat_rate: data.vat_rate,
      issue_date: data.issue_date,
      due_date: data.due_date,
      description: data.description,
      is_recurring: data.is_recurring,
    });
    toast.success("Fatura güncellendi");
    setEditOpen(false);
    setEditingId(null);
  };

  const exportCsv = () => {
    const header = [
      "Fatura No",
      "Firma",
      "Tutar",
      "KDV%",
      "Toplam",
      "Kesim",
      "Vade",
      "Durum",
    ];
    const rows = filtered.map((inv) => {
      const c = companies.find((x) => x.id === inv.company_id);
      return [
        inv.invoice_no,
        c?.name ?? "",
        inv.amount,
        inv.vat_rate,
        inv.total,
        inv.issue_date,
        inv.due_date,
        INVOICE_STATUS_LABELS[inv.status],
      ].join(";");
    });
    const blob = new Blob([[header.join(";"), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genua-faturalar-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV indirildi");
  };

  const deleteTarget = invoices.find((i) => i.id === deleteId);

  return (
    <PageMotion className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Bu Ay Kesilen", value: kesilen },
          { label: "Tahsil Edilen", value: tahsil },
          { label: "Bekleyen", value: bekleyen },
          { label: "Geciken", value: geciken, danger: geciken > 0 },
        ].map((s) => (
          <MotionItem key={s.label}>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-text-secondary">{s.label}</p>
                <p
                  className={cn(
                    "mt-1 font-mono text-xl",
                    s.danger && "text-danger"
                  )}
                >
                  {formatCurrency(s.value)}
                </p>
              </CardContent>
            </Card>
          </MotionItem>
        ))}
      </div>

      <MotionItem className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="relative w-full sm:flex-1 sm:min-w-[180px] sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Fatura no ara..."
              className="pl-9 h-11 sm:h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-11 sm:h-10">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-11 sm:h-10">
                <SelectValue placeholder="Firma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm firmalar</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={exportCsv}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            <Download className="h-4 w-4" />
            CSV Export
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-11 sm:h-10">
                <Plus className="h-4 w-4" />
                Fatura Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Fatura</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={addForm.handleSubmit(onAdd)}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label>Firma</Label>
                  <Select
                    value={addForm.watch("company_id")}
                    onValueChange={(v) => addForm.setValue("company_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Firma seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tutar (KDV hariç)</Label>
                    <Input type="number" {...addForm.register("amount")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>KDV %</Label>
                    <Select
                      value={String(addForm.watch("vat_rate"))}
                      onValueChange={(v) =>
                        addForm.setValue("vat_rate", Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 10, 20].map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            %{r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                  <p className="text-xs text-text-secondary">
                    Toplam (KDV dahil)
                  </p>
                  <p className="font-mono text-lg text-accent">
                    {formatCurrency(addPreviewTotal)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kesim tarihi</Label>
                    <Input type="date" {...addForm.register("issue_date")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vade tarihi</Label>
                    <Input type="date" {...addForm.register("due_date")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Açıklama</Label>
                  <Textarea {...addForm.register("description")} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={addForm.watch("is_recurring")}
                    onCheckedChange={(c) =>
                      addForm.setValue("is_recurring", c === true)
                    }
                  />
                  Tekrarlayan fatura
                </label>
                <DialogFooter>
                  <Button type="submit">Oluştur</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </MotionItem>

      <MotionItem>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#262626] bg-surface">
            <EmptyState
              icon={Receipt}
              message={
                invoices.length === 0
                  ? "Henüz fatura yok — gidip para kazan 🤝"
                  : "Filtreye uygun fatura bulunamadı"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#262626] bg-surface -mx-1 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Fatura No</th>
                  <th className="px-4 py-3 font-medium">Firma</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    KDV
                  </th>
                  <th className="px-4 py-3 font-medium">Toplam</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">
                    Kesim
                  </th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">
                    Vade
                  </th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const company = companies.find((c) => c.id === inv.company_id);
                  const overdue = isOverdue(inv);
                  return (
                    <tr
                      key={inv.id}
                      className={cn(
                        "border-b border-[#262626] last:border-0 hover:bg-surface-hover",
                        overdue && "border-l-[3px] border-l-danger"
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {inv.invoice_no}
                      </td>
                      <td className="px-4 py-3">{company?.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden md:table-cell">
                        %{inv.vat_rate}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden lg:table-cell">
                        {formatShortDate(inv.issue_date)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden sm:table-cell">
                        {formatShortDate(inv.due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={inv.status}
                          onValueChange={(v) => {
                            updateInvoiceStatus(inv.id, v as InvoiceStatus);
                            toast.success("Durum güncellendi");
                          }}
                        >
                          <SelectTrigger className="h-8 w-[120px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
                            <InvoiceStatusBadge status={inv.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INVOICE_STATUS_LABELS).map(
                              ([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-accent"
                            onClick={() => openEdit(inv)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-danger"
                            onClick={() => setDeleteId(inv.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </MotionItem>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fatura Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Firma</Label>
              <Select
                value={editForm.watch("company_id")}
                onValueChange={(v) => editForm.setValue("company_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Firma seç" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tutar (KDV hariç)</Label>
                <Input type="number" {...editForm.register("amount")} />
              </div>
              <div className="space-y-1.5">
                <Label>KDV %</Label>
                <Select
                  value={String(editForm.watch("vat_rate"))}
                  onValueChange={(v) =>
                    editForm.setValue("vat_rate", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 10, 20].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        %{r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
              <p className="text-xs text-text-secondary">Toplam (KDV dahil)</p>
              <p className="font-mono text-lg text-accent">
                {formatCurrency(editPreviewTotal)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kesim tarihi</Label>
                <Input type="date" {...editForm.register("issue_date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Vade tarihi</Label>
                <Input type="date" {...editForm.register("due_date")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea {...editForm.register("description")} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={editForm.watch("is_recurring")}
                onCheckedChange={(c) =>
                  editForm.setValue("is_recurring", c === true)
                }
              />
              Tekrarlayan fatura
            </label>
            <DialogFooter>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Faturayı sil"
        description={
          deleteTarget
            ? `${deleteTarget.invoice_no} numaralı fatura kalıcı olarak silinecek.`
            : undefined
        }
        onConfirm={() => {
          if (deleteId) {
            deleteInvoice(deleteId);
            toast.success("Fatura silindi");
            setDeleteId(null);
          }
        }}
      />
    </PageMotion>
  );
}
