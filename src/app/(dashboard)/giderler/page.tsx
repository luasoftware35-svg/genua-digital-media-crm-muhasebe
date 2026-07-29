"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pencil, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { buildIncomeVsExpense } from "@/lib/charts";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

const schema = z.object({
  category: z.string().min(1),
  title: z.string().min(2, "Başlık gerekli"),
  amount: z.coerce.number().positive("Tutar pozitif olmalı"),
  date: z.string().min(1),
  is_recurring: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const defaultForm: FormData = {
  category: "Yazılım",
  title: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  is_recurring: false,
};

export default function GiderlerPage() {
  const {
    invoices,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useData();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const chartData = useMemo(
    () => buildIncomeVsExpense(invoices, expenses),
    [invoices, expenses]
  );

  const filtered = useMemo(() => {
    return expenses.filter(
      (e) => categoryFilter === "all" || e.category === categoryFilter
    );
  }, [expenses, categoryFilter]);

  const now = new Date();
  const thisMonthTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, e) => s + e.amount, 0);

  const addForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultForm,
  });

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    editForm.reset({
      category: e.category,
      title: e.title,
      amount: e.amount,
      date: e.date,
      is_recurring: e.is_recurring,
    });
    setEditOpen(true);
  };

  const onAdd = async (data: FormData) => {
    const ok = await addExpense(data);
    if (!ok) return;
    toast.success("Gider eklendi");
    setAddOpen(false);
    addForm.reset(defaultForm);
  };

  const onEdit = async (data: FormData) => {
    if (!editingId) return;
    const ok = await updateExpense(editingId, data);
    if (!ok) return;
    toast.success("Gider güncellendi");
    setEditOpen(false);
    setEditingId(null);
  };

  const deleteTarget = expenses.find((e) => e.id === deleteId);

  const ExpenseFormFields = ({
    form,
  }: {
    form: ReturnType<typeof useForm<FormData>>;
  }) => (
    <>
      <div className="space-y-1.5">
        <Label>Kategori</Label>
        <Select
          value={form.watch("category")}
          onValueChange={(v) => form.setValue("category", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Başlık</Label>
        <Input {...form.register("title")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tutar</Label>
          <Input type="number" {...form.register("amount")} />
        </div>
        <div className="space-y-1.5">
          <Label>Tarih</Label>
          <Input type="date" {...form.register("date")} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.watch("is_recurring")}
          onCheckedChange={(c) => form.setValue("is_recurring", c === true)}
        />
        Tekrarlayan (abonelik)
      </label>
    </>
  );

  return (
    <PageMotion className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <MotionItem>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-text-secondary">Bu Ay Gider</p>
              <p className="mt-2 font-mono text-2xl">
                {formatCurrency(thisMonthTotal)}
              </p>
            </CardContent>
          </Card>
        </MotionItem>
        <MotionItem className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gelir vs Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
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
                      tickFormatter={(v) => `₺${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#141414",
                        border: "1px solid #262626",
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                      formatter={(v) => formatCurrency(Number(v ?? 0))}
                    />
                    <Legend />
                    <Bar
                      dataKey="gelir"
                      fill="#DBFF2B"
                      radius={[4, 4, 0, 0]}
                      name="Gelir"
                    />
                    <Bar
                      dataKey="gider"
                      fill="#4A4A4A"
                      radius={[4, 4, 0, 0]}
                      name="Gider"
                    />
                    <Line
                      type="monotone"
                      dataKey="kar"
                      stroke="#FAFAFA"
                      strokeWidth={2}
                      dot={false}
                      name="Net Kâr"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </div>

      <MotionItem className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-11 sm:h-10">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kategoriler</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-11 sm:h-10">
              <Plus className="h-4 w-4" />
              Gider Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Gider</DialogTitle>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-3">
              <ExpenseFormFields form={addForm} />
              <DialogFooter>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </MotionItem>

      <MotionItem>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#262626] bg-surface">
            <EmptyState
              icon={Wallet}
              message={
                expenses.length === 0
                  ? "Gider yok — ya çok zengin ya kayıt unuttun"
                  : "Filtreye uygun gider bulunamadı"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#262626] bg-surface -mx-1 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Başlık</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium"></th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[#262626] last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{e.category}</Badge>
                    </td>
                    <td className="px-4 py-3">{e.title}</td>
                    <td className="px-4 py-3 font-mono">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-4 py-3">
                      {e.is_recurring && (
                        <RefreshCw className="h-3.5 w-3.5 text-text-secondary" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-secondary hover:text-accent"
                          onClick={() => openEdit(e)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-secondary hover:text-danger"
                          onClick={() => setDeleteId(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MotionItem>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gider Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
            <ExpenseFormFields form={editForm} />
            <DialogFooter>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Gideri sil"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" gideri kalıcı olarak silinecek.`
            : undefined
        }
        onConfirm={async () => {
          if (deleteId) {
            const ok = await deleteExpense(deleteId);
            if (ok) toast.success("Gider silindi");
            setDeleteId(null);
          }
        }}
      />
    </PageMotion>
  );
}
