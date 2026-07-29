"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Building2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { formatCurrency } from "@/lib/format";
import {
  COMPANY_STATUS_LABELS,
  SERVICE_TYPES,
  type Company,
  type CompanyStatus,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CompanyStatusBadge } from "@/components/shared/status-badges";
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
  name: z.string().min(2, "Firma adı gerekli"),
  sector: z.string().min(1),
  city: z.string().min(1),
  contact_name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email(),
  status: z.enum(["aktif", "pasif", "potansiyel", "gorusmede"]),
  monthly_fee: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

function CompanyFormFields({
  form,
  selectedServices,
  toggleService,
}: {
  form: ReturnType<typeof useForm<FormData>>;
  selectedServices: string[];
  toggleService: (s: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Firma adı</Label>
          <Input {...form.register("name")} className="h-11 sm:h-10" />
        </div>
        <div className="space-y-1.5">
          <Label>Sektör</Label>
          <Input {...form.register("sector")} />
        </div>
        <div className="space-y-1.5">
          <Label>Şehir</Label>
          <Input {...form.register("city")} />
        </div>
        <div className="space-y-1.5">
          <Label>Yetkili</Label>
          <Input {...form.register("contact_name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input {...form.register("phone")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>E-posta</Label>
          <Input type="email" {...form.register("email")} />
        </div>
        <div className="space-y-1.5">
          <Label>Durum</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as FormData["status"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMPANY_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Aylık tutar</Label>
          <Input type="number" {...form.register("monthly_fee")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Hizmetler</Label>
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_TYPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleService(s)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                selectedServices.includes(s)
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-[#262626] text-text-secondary hover:border-accent/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function FirmalarPage() {
  const { companies, addCompany, updateCompany, deleteCompany } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [editServices, setEditServices] = useState<string[]>([]);

  const cities = useMemo(
    () => Array.from(new Set(companies.map((c) => c.city))).sort(),
    [companies]
  );

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.contact_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchCity = cityFilter === "all" || c.city === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  const addForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sector: "",
      city: "Denizli",
      contact_name: "",
      phone: "",
      email: "",
      status: "potansiyel",
      monthly_fee: 0,
    },
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sector: "",
      city: "",
      contact_name: "",
      phone: "",
      email: "",
      status: "potansiyel",
      monthly_fee: 0,
    },
  });

  useEffect(() => {
    if (!editingCompany) return;
    editForm.reset({
      name: editingCompany.name,
      sector: editingCompany.sector,
      city: editingCompany.city,
      contact_name: editingCompany.contact_name,
      phone: editingCompany.phone,
      email: editingCompany.email,
      status: editingCompany.status,
      monthly_fee: editingCompany.monthly_fee,
    });
    setEditServices(editingCompany.services);
  }, [editingCompany, editForm]);

  const onAddSubmit = (data: FormData) => {
    addCompany({
      ...data,
      services: selectedServices,
      status: data.status as CompanyStatus,
    });
    toast.success(`${data.name} eklendi`);
    setAddOpen(false);
    addForm.reset();
    setSelectedServices([]);
  };

  const onEditSubmit = (data: FormData) => {
    if (!editingCompany) return;
    updateCompany(editingCompany.id, {
      ...data,
      services: editServices,
      status: data.status as CompanyStatus,
    });
    toast.success(`${data.name} güncellendi`);
    setEditOpen(false);
    setEditingCompany(null);
  };

  const handleDelete = () => {
    if (!deletingCompany) return;
    deleteCompany(deletingCompany.id);
    toast.success(`${deletingCompany.name} silindi`);
    setDeletingCompany(null);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setEditOpen(true);
  };

  const openDelete = (company: Company) => {
    setDeletingCompany(company);
    setDeleteOpen(true);
  };

  const toggleService = (
    s: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <PageMotion className="space-y-4">
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
              <SelectTrigger className="w-full sm:w-[140px] h-11 sm:h-10">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                {Object.entries(COMPANY_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-11 sm:h-10">
                <SelectValue placeholder="Şehir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm şehirler</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-11 sm:h-10">
              <Plus className="h-4 w-4" />
              Firma Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Firma</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={addForm.handleSubmit(onAddSubmit)}
              className="space-y-3"
            >
              <CompanyFormFields
                form={addForm}
                selectedServices={selectedServices}
                toggleService={(s) => toggleService(s, setSelectedServices)}
              />
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
              icon={Building2}
              message="Firma yok — gidip müşteri bul 🤝"
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#262626] bg-surface -mx-1 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Firma</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    Sektör
                  </th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">
                    Şehir
                  </th>
                  <th className="px-4 py-3 font-medium">Aylık</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">
                    Hizmetler
                  </th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium w-[88px]">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#262626] last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/firmalar/${c.id}`}
                        className="flex items-center gap-3 group"
                      >
                        {c.logo_url ? (
                          <img
                            src={c.logo_url}
                            alt={c.name}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-display text-xs text-accent">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium group-hover:text-accent transition-colors">
                            {c.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {c.contact_name}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {c.sector}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                      {c.city}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {c.monthly_fee > 0
                        ? formatCurrency(c.monthly_fee)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.services.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CompanyStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => openDelete(c)}
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

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingCompany(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Firmayı Düzenle</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-3"
          >
            <CompanyFormFields
              form={editForm}
              selectedServices={editServices}
              toggleService={(s) => toggleService(s, setEditServices)}
            />
            <DialogFooter>
              <Button type="submit">Güncelle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Firmayı sil"
        description={
          deletingCompany
            ? `${deletingCompany.name} ve ilişkili kayıtlar kalıcı olarak silinecek.`
            : undefined
        }
        confirmLabel="Sil"
        onConfirm={handleDelete}
      />
    </PageMotion>
  );
}
