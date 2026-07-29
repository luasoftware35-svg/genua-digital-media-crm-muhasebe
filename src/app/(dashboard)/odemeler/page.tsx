"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { formatCurrency, formatShortDate, daysUntil } from "@/lib/format";
import {
  RECEIVABLE_KIND_LABELS,
  RECEIVABLE_STATUS_LABELS,
  type Receivable,
  type ReceivableKind,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ReceivableStatusBadge } from "@/components/shared/status-badges";
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
  title: z.string().min(2, "Açıklama gerekli"),
  amount: z.coerce.number().positive("Tutar pozitif olmalı"),
  kind: z.enum(["is_bedeli", "on_odeme", "diger"]),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const defaultForm: FormData = {
  company_id: "",
  title: "",
  amount: 0,
  kind: "is_bedeli",
  due_date: "",
  notes: "",
};

function isOverdue(r: Receivable) {
  return (
    r.status === "gecikti" ||
    (r.status === "bekliyor" && r.due_date && daysUntil(r.due_date) < 0)
  );
}

export default function OdemelerPage() {
  const {
    companies,
    receivables,
    addReceivable,
    updateReceivable,
    updateReceivableStatus,
    deleteReceivable,
  } = useData();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const openReceivables = receivables.filter(
    (r) => r.status === "bekliyor" || r.status === "gecikti"
  );
  const totalOpen = openReceivables.reduce((s, r) => s + r.amount, 0);
  const totalCollected = receivables
    .filter((r) => r.status === "odendi")
    .reduce((s, r) => s + r.amount, 0);
  const overdueTotal = receivables
    .filter((r) => isOverdue(r))
    .reduce((s, r) => s + r.amount, 0);
  const workUnpaid = receivables
    .filter(
      (r) =>
        r.kind === "is_bedeli" &&
        (r.status === "bekliyor" || r.status === "gecikti")
    )
    .reduce((s, r) => s + r.amount, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return receivables
      .filter((r) => {
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "open"
            ? r.status === "bekliyor" || r.status === "gecikti"
            : r.status === statusFilter);
        const matchKind = kindFilter === "all" || r.kind === kindFilter;
        const matchCompany =
          companyFilter === "all" || r.company_id === companyFilter;
        const company = companies.find((c) => c.id === r.company_id);
        const matchSearch =
          !q ||
          r.title.toLowerCase().includes(q) ||
          company?.name.toLowerCase().includes(q);
        return matchStatus && matchKind && matchCompany && matchSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [receivables, statusFilter, kindFilter, companyFilter, search, companies]);

  const addForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const openEdit = (r: Receivable) => {
    setEditingId(r.id);
    editForm.reset({
      company_id: r.company_id,
      title: r.title,
      amount: r.amount,
      kind: r.kind,
      due_date: r.due_date ?? "",
      notes: r.notes ?? "",
    });
    setEditOpen(true);
  };

  const onAdd = async (data: FormData) => {
    const ok = await addReceivable({
      company_id: data.company_id,
      title: data.title.trim(),
      amount: data.amount,
      kind: data.kind,
      status: "bekliyor",
      due_date: data.due_date || undefined,
      notes: data.notes?.trim() || undefined,
    });
    if (!ok) return;
    toast.success("Alacak eklendi");
    setAddOpen(false);
    addForm.reset(defaultForm);
  };

  const onEdit = async (data: FormData) => {
    if (!editingId) return;
    const ok = await updateReceivable(editingId, {
      company_id: data.company_id,
      title: data.title.trim(),
      amount: data.amount,
      kind: data.kind,
      due_date: data.due_date || undefined,
      notes: data.notes?.trim() || undefined,
    });
    if (!ok) return;
    toast.success("Alacak güncellendi");
    setEditOpen(false);
    setEditingId(null);
  };

  const markCollected = async (id: string) => {
    const ok = await updateReceivableStatus(id, "odendi");
    if (ok) toast.success("Tahsil edildi olarak işaretlendi");
  };

  const deleteTarget = receivables.find((r) => r.id === deleteId);

  const FormFields = ({
    form,
  }: {
    form: ReturnType<typeof useForm<FormData>>;
  }) => (
    <>
      <div className="space-y-1.5">
        <Label>Firma</Label>
        <Select
          value={form.watch("company_id")}
          onValueChange={(v) => form.setValue("company_id", v)}
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
      <div className="space-y-1.5">
        <Label>Ne için alacaksın?</Label>
        <Input
          placeholder="Örn: Sosyal medya yönetimi — Ocak"
          {...form.register("title")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tutar (₺)</Label>
          <Input type="number" {...form.register("amount")} />
        </div>
        <div className="space-y-1.5">
          <Label>Tür</Label>
          <Select
            value={form.watch("kind")}
            onValueChange={(v) => form.setValue("kind", v as ReceivableKind)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RECEIVABLE_KIND_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Beklenen tarih (opsiyonel)</Label>
        <Input type="date" {...form.register("due_date")} />
      </div>
      <div className="space-y-1.5">
        <Label>Not (opsiyonel)</Label>
        <Textarea rows={2} {...form.register("notes")} />
      </div>
    </>
  );

  return (
    <PageMotion className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Toplam Alacak", value: totalOpen },
          { label: "İş Bedeli (açık)", value: workUnpaid },
          { label: "Tahsil Edilen", value: totalCollected },
          { label: "Geciken", value: overdueTotal, danger: overdueTotal > 0 },
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
              placeholder="Firma veya açıklama ara..."
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
                <SelectItem value="open">Açık alacaklar</SelectItem>
                <SelectItem value="all">Tümü</SelectItem>
                {Object.entries(RECEIVABLE_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-10">
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm türler</SelectItem>
                {Object.entries(RECEIVABLE_KIND_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-11 sm:h-10 col-span-2 sm:col-span-1">
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

        <div className="flex justify-stretch sm:justify-end">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-auto h-11 sm:h-10"
                disabled={companies.length === 0}
              >
                <Plus className="h-4 w-4" />
                Alacak Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Alacak</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={addForm.handleSubmit(onAdd)}
                className="space-y-3"
              >
                <FormFields form={addForm} />
                <DialogFooter>
                  <Button type="submit">Kaydet</Button>
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
              icon={Banknote}
              message={
                receivables.length === 0
                  ? "Henüz alacak yok — yapılan iş veya beklenen ödemeyi ekle"
                  : "Filtreye uygun alacak bulunamadı"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#262626] bg-surface -mx-1 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Firma</th>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">
                    Tür
                  </th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    Tarih
                  </th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium w-28"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const company = companies.find((c) => c.id === r.company_id);
                  const overdue = isOverdue(r);
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b border-[#262626] last:border-0 hover:bg-surface-hover",
                        overdue && "border-l-[3px] border-l-danger"
                      )}
                    >
                      <td className="px-4 py-3 font-medium">
                        {company?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p>{r.title}</p>
                        {r.notes && (
                          <p className="font-mono text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                            {r.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary hidden sm:table-cell">
                        {RECEIVABLE_KIND_LABELS[r.kind]}
                      </td>
                      <td className="px-4 py-3 font-mono text-accent">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden md:table-cell">
                        {r.due_date
                          ? formatShortDate(r.due_date)
                          : r.status === "odendi" && r.paid_at
                            ? formatShortDate(r.paid_at)
                            : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ReceivableStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {r.status !== "odendi" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-accent"
                              title="Tahsil edildi"
                              onClick={() => markCollected(r.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-accent"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-danger"
                            onClick={() => setDeleteId(r.id)}
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
            <DialogTitle>Alacak Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
            <FormFields form={editForm} />
            <DialogFooter>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Alacağı sil"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" kaydı kalıcı olarak silinecek.`
            : undefined
        }
        onConfirm={async () => {
          if (deleteId) {
            const ok = await deleteReceivable(deleteId);
            if (ok) toast.success("Alacak silindi");
            setDeleteId(null);
          }
        }}
      />
    </PageMotion>
  );
}
