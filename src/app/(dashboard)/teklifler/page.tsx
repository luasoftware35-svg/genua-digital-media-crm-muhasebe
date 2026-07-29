"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pencil, Plus, Search, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import {
  PROPOSAL_STATUS_LABELS,
  type Proposal,
  type ProposalSource,
  type ProposalStatus,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProposalStatusBadge } from "@/components/shared/status-badges";
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

const SOURCES: ProposalSource[] = [
  "DOSB",
  "BOSB",
  "EKAP",
  "Referans",
  "Instagram",
  "Diger",
];

const schema = z.object({
  company_name: z.string().min(2, "Firma adı gerekli"),
  source: z.enum(["DOSB", "BOSB", "EKAP", "Referans", "Instagram", "Diger"]),
  sent_date: z.string().min(1),
  amount: z.coerce.number().min(0),
  status: z.enum([
    "gonderildi",
    "cevap",
    "gorusme",
    "kazanildi",
    "kaybedildi",
  ]),
  notes: z.string().optional(),
  tender_deadline: z.string().optional(),
  deposit_note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const defaultForm: FormData = {
  company_name: "",
  source: "DOSB",
  sent_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  status: "gonderildi",
  notes: "",
  tender_deadline: "",
  deposit_note: "",
};

export default function TekliflerPage() {
  const { proposals, addProposal, updateProposal, deleteProposal } = useData();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const closed = proposals.filter(
    (p) => p.status === "kazanildi" || p.status === "kaybedildi"
  );
  const won = proposals.filter((p) => p.status === "kazanildi");
  const winRate = closed.length
    ? Math.round((won.length / closed.length) * 100)
    : 0;

  const bySource = useMemo(() => {
    return SOURCES.map((source) => {
      const items = proposals.filter((p) => p.source === source);
      const closedSrc = items.filter(
        (p) => p.status === "kazanildi" || p.status === "kaybedildi"
      );
      const wonSrc = items.filter((p) => p.status === "kazanildi");
      return {
        source,
        total: items.length,
        winRate: closedSrc.length
          ? Math.round((wonSrc.length / closedSrc.length) * 100)
          : 0,
      };
    }).filter((s) => s.total > 0);
  }, [proposals]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return proposals.filter((p) => {
      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;
      const matchSource =
        sourceFilter === "all" || p.source === sourceFilter;
      const matchSearch =
        !q || p.company_name.toLowerCase().includes(q);
      return matchStatus && matchSource && matchSearch;
    });
  }, [proposals, statusFilter, sourceFilter, search]);

  const addForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const openEdit = (p: Proposal) => {
    setEditingId(p.id);
    editForm.reset({
      company_name: p.company_name,
      source: p.source,
      sent_date: p.sent_date,
      amount: p.amount,
      status: p.status,
      notes: p.notes ?? "",
      tender_deadline: p.tender_deadline ?? "",
      deposit_note: p.deposit_note ?? "",
    });
    setEditOpen(true);
  };

  const onAdd = (data: FormData) => {
    addProposal({
      company_name: data.company_name,
      source: data.source,
      sent_date: data.sent_date,
      amount: data.amount,
      status: "gonderildi",
      notes: data.notes,
      tender_deadline: data.tender_deadline || undefined,
      deposit_note: data.deposit_note || undefined,
    });
    toast.success("Teklif eklendi");
    setAddOpen(false);
    addForm.reset(defaultForm);
  };

  const onEdit = (data: FormData) => {
    if (!editingId) return;
    updateProposal(editingId, {
      company_name: data.company_name,
      source: data.source,
      sent_date: data.sent_date,
      amount: data.amount,
      status: data.status,
      notes: data.notes,
      tender_deadline: data.tender_deadline || undefined,
      deposit_note: data.deposit_note || undefined,
    });
    toast.success("Teklif güncellendi");
    setEditOpen(false);
    setEditingId(null);
  };

  const deleteTarget = proposals.find((p) => p.id === deleteId);

  const ProposalFormFields = ({
    form,
    showStatus,
  }: {
    form: ReturnType<typeof useForm<FormData>>;
    showStatus?: boolean;
  }) => (
    <>
      <div className="space-y-1.5">
        <Label>Firma / İhale adı</Label>
        <Input {...form.register("company_name")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kaynak</Label>
          <Select
            value={form.watch("source")}
            onValueChange={(v) => form.setValue("source", v as ProposalSource)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Gönderim</Label>
          <Input type="date" {...form.register("sent_date")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tutar</Label>
        <Input type="number" {...form.register("amount")} />
      </div>
      {showStatus && (
        <div className="space-y-1.5">
          <Label>Durum</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as ProposalStatus)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>İhale son tarih (opsiyonel)</Label>
        <Input type="date" {...form.register("tender_deadline")} />
      </div>
      <div className="space-y-1.5">
        <Label>Teminat notu</Label>
        <Input {...form.register("deposit_note")} />
      </div>
      <div className="space-y-1.5">
        <Label>Notlar</Label>
        <Textarea {...form.register("notes")} />
      </div>
    </>
  );

  return (
    <PageMotion className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <MotionItem>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-text-secondary">Win Rate</p>
              <p className="mt-2 font-mono text-4xl text-accent">{winRate}%</p>
              <p className="mt-1 text-xs text-text-secondary">
                {won.length}/{closed.length} kapanan teklif
              </p>
            </CardContent>
          </Card>
        </MotionItem>
        <MotionItem className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kaynak Bazlı Dönüşüm</CardTitle>
            </CardHeader>
            <CardContent>
              {bySource.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-secondary">
                  Henüz kaynak verisi yok
                </p>
              ) : (
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bySource}>
                      <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="source"
                        stroke="#8A8A8A"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#8A8A8A"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#141414",
                          border: "1px solid #262626",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v, _n, item) => [
                          `${v}% (${item.payload.total} teklif)`,
                          "Win rate",
                        ]}
                      />
                      <Bar
                        dataKey="winRate"
                        fill="#DBFF2B"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionItem>
      </div>

      <MotionItem className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="relative w-full sm:flex-1 sm:min-w-[180px] sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Firma ara..."
              className="pl-9 h-11 sm:h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-10">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-11 sm:h-10">
                <SelectValue placeholder="Kaynak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm kaynaklar</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-11 sm:h-10">
                <Plus className="h-4 w-4" />
                Teklif Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Teklif / İhale</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={addForm.handleSubmit(onAdd)}
                className="space-y-3"
              >
                <ProposalFormFields form={addForm} />
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
              icon={Target}
              message={
                proposals.length === 0
                  ? "Pipeline boş — cold mail at 📬"
                  : "Filtreye uygun teklif bulunamadı"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#262626] bg-surface -mx-1 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Firma</th>
                  <th className="px-4 py-3 font-medium">Kaynak</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">
                    Tarih
                  </th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">
                    İhale
                  </th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const countdown = p.tender_deadline
                    ? daysUntil(p.tender_deadline)
                    : null;
                  const isActive =
                    p.status !== "kazanildi" && p.status !== "kaybedildi";
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[#262626] last:border-0 hover:bg-surface-hover"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.company_name}</p>
                        {p.deposit_note && (
                          <p className="font-mono text-[10px] text-text-secondary mt-0.5">
                            {p.deposit_note}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {p.source}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden sm:table-cell">
                        {formatDate(p.sent_date)}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={p.status}
                          onValueChange={(v) => {
                            updateProposal(p.id, {
                              status: v as ProposalStatus,
                            });
                            toast.success("Durum güncellendi");
                          }}
                        >
                          <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent p-0 focus:ring-0">
                            <ProposalStatusBadge status={p.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PROPOSAL_STATUS_LABELS).map(
                              ([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {countdown != null ? (
                          <span
                            className={cn(
                              "font-mono text-xs",
                              !isActive || countdown < 0
                                ? "text-text-secondary"
                                : countdown <= 3
                                  ? "text-warning"
                                  : "text-accent"
                            )}
                          >
                            {!isActive || countdown < 0
                              ? "Kapandı"
                              : `${countdown}g kaldı`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-accent"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-danger"
                            onClick={() => setDeleteId(p.id)}
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
            <DialogTitle>Teklif Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
            <ProposalFormFields form={editForm} showStatus />
            <DialogFooter>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Teklifi sil"
        description={
          deleteTarget
            ? `${deleteTarget.company_name} teklifi kalıcı olarak silinecek.`
            : undefined
        }
        onConfirm={() => {
          if (deleteId) {
            deleteProposal(deleteId);
            toast.success("Teklif silindi");
            setDeleteId(null);
          }
        }}
      />
    </PageMotion>
  );
}
