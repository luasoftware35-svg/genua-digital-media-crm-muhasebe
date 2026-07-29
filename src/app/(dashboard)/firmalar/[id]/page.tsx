"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Phone,
  FileText,
  Send,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  COMPANY_STATUS_LABELS,
  SERVICE_TYPES,
  type CompanyDocument,
  type CompanyStatus,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CompanyStatusBadge,
  InvoiceStatusBadge,
} from "@/components/shared/status-badges";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  contract_start: z.string().optional(),
  notes: z.string().optional(),
  logo_url: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FirmaDetayPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const {
    getCompany,
    getCompanyInvoices,
    getCompanyNotes,
    getCompanyDocs,
    addNote,
    deleteNote,
    addDocument,
    deleteDocument,
    updateCompany,
  } = useData();
  const company = getCompany(id);
  const invoices = getCompanyInvoices(id);
  const notes = getCompanyNotes(id);
  const docs = getCompanyDocs(id);

  const [noteText, setNoteText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDocOpen, setDeleteDocOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<CompanyDocument | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | undefined>();

  const form = useForm<FormData>({
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
      contract_start: "",
      notes: "",
      logo_url: "",
    },
  });

  useEffect(() => {
    if (!company) return;
    form.reset({
      name: company.name,
      sector: company.sector,
      city: company.city,
      contact_name: company.contact_name,
      phone: company.phone,
      email: company.email,
      status: company.status,
      monthly_fee: company.monthly_fee,
      contract_start: company.contract_start ?? "",
      notes: company.notes ?? "",
      logo_url: company.logo_url ?? "",
    });
    setSelectedServices(company.services);
    setLogoPreview(company.logo_url);
  }, [company, form]);

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-text-secondary">Firma bulunamadı</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href="/firmalar">Geri dön</Link>
        </Button>
      </div>
    );
  }

  const wa = company.phone.replace(/\D/g, "").replace(/^0/, "90");
  const renewal = company.contract_start
    ? (() => {
        const d = new Date(company.contract_start);
        d.setFullYear(new Date().getFullYear() + 1);
        if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().slice(0, 10);
      })()
    : null;

  const handleNote = async () => {
    if (!noteText.trim()) return;
    const ok = await addNote(id, noteText.trim());
    if (!ok) return;
    setNoteText("");
    toast.success("Not eklendi");
  };

  const handleDeleteNote = async (noteId: string) => {
    const ok = await deleteNote(noteId);
    if (!ok) return;
    toast.success("Not silindi");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      form.setValue("logo_url", dataUrl);
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await addDocument({
        company_id: id,
        name: file.name,
        file_path: reader.result as string,
        file_type: file.type || "application/octet-stream",
      });
      if (ok) toast.success(`${file.name} yüklendi`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteDoc = async () => {
    if (!deletingDoc) return;
    const ok = await deleteDocument(deletingDoc.id);
    if (!ok) return;
    toast.success(`${deletingDoc.name} silindi`);
    setDeletingDoc(null);
  };

  const onEditSubmit = async (data: FormData) => {
    const ok = await updateCompany(id, {
      ...data,
      services: selectedServices,
      status: data.status as CompanyStatus,
      contract_start: data.contract_start || undefined,
      notes: data.notes || undefined,
      logo_url: data.logo_url || undefined,
    });
    if (!ok) return;
    toast.success(`${data.name} güncellendi`);
    setEditOpen(false);
  };

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const displayLogo = company.logo_url;

  return (
    <PageMotion className="space-y-6">
      <MotionItem>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/firmalar">
            <ArrowLeft className="h-4 w-4" />
            Firmalar
          </Link>
        </Button>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt={company.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 font-display text-lg text-accent">
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl">{company.name}</h2>
                    <CompanyStatusBadge status={company.status} />
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {company.sector} · {company.city}
                  </p>
                  <p className="mt-2 text-sm">
                    {company.contact_name}
                    <span className="text-text-secondary"> · </span>
                    <span className="font-mono text-xs">{company.phone}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {company.services.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-11 sm:h-8 justify-center"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Düzenle
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="h-11 sm:h-8 justify-center"
                >
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="h-11 sm:h-8 justify-center"
                >
                  <a href={`mailto:${company.email}`}>
                    <Mail className="h-4 w-4" />
                    E-posta
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-11 sm:h-8 justify-center"
                >
                  <a href={`tel:${company.phone}`}>
                    <Phone className="h-4 w-4" />
                    Ara
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionItem>

      <MotionItem>
        <Tabs defaultValue="genel">
          <TabsList>
            <TabsTrigger value="genel">Genel Bakış</TabsTrigger>
            <TabsTrigger value="odemeler">Ödemeler</TabsTrigger>
            <TabsTrigger value="notlar">Notlar</TabsTrigger>
            <TabsTrigger value="dosyalar">Dosyalar</TabsTrigger>
          </TabsList>

          <TabsContent value="genel">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-text-secondary font-sans font-medium">
                    Aylık tutar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-2xl">
                    {formatCurrency(company.monthly_fee)}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">+ KDV</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-text-secondary font-sans font-medium">
                    Sözleşme başlangıç
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-lg">
                    {company.contract_start
                      ? formatDate(company.contract_start)
                      : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-text-secondary font-sans font-medium">
                    Yenileme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-lg">
                    {renewal ? formatDate(renewal) : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>
            {company.notes && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm text-text-secondary font-sans font-medium">
                    Firma notu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="odemeler">
            <div className="rounded-xl border border-[#262626] bg-surface overflow-x-auto">
              {invoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  message="Henüz fatura yok — gidip para kazan 🤝"
                />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#262626] text-left text-text-secondary">
                      <th className="px-4 py-3 font-medium">Fatura No</th>
                      <th className="px-4 py-3 font-medium">Tutar</th>
                      <th className="px-4 py-3 font-medium">Vade</th>
                      <th className="px-4 py-3 font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-[#262626] last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {inv.invoice_no}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notlar">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Hızlı not ekle..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNote()}
                  />
                  <Button onClick={handleNote} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {notes.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    message="Not yok — görüşmeyi yaz ki unutma"
                    className="py-8"
                  />
                ) : (
                  <ul className="space-y-4">
                    {notes.map((n) => (
                      <li key={n.id} className="flex gap-3 group">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{n.note}</p>
                          <p className="font-mono text-[10px] text-text-secondary mt-1">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                          onClick={() => handleDeleteNote(n.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dosyalar">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label
                    htmlFor="doc-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#262626] px-4 py-3 text-sm text-text-secondary hover:border-accent/30 hover:text-accent transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Dosya yükle
                  </Label>
                  <input
                    id="doc-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {docs.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    message="Dosya yok — sözleşme veya belge yükle"
                  />
                ) : (
                  <ul className="space-y-2">
                    {docs.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between rounded-lg border border-[#262626] px-4 py-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-accent" />
                          <div className="min-w-0">
                            <a
                              href={d.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:text-accent transition-colors truncate block"
                            >
                              {d.name}
                            </a>
                            <p className="font-mono text-[10px] text-text-secondary">
                              {formatDate(d.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary">
                            {d.file_type.split("/").pop()?.toUpperCase() ??
                              "DOSYA"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => {
                              setDeletingDoc(d);
                              setDeleteDocOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionItem>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Firmayı Düzenle</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onEditSubmit)}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo önizleme"
                    className="h-16 w-16 rounded-lg object-cover border border-[#262626]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-accent/10 font-display text-sm text-accent">
                    {form.watch("name").slice(0, 2).toUpperCase() || "?"}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Firma adı</Label>
                <Input {...form.register("name")} />
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
              <div className="col-span-2 space-y-1.5">
                <Label>Sözleşme başlangıç</Label>
                <Input type="date" {...form.register("contract_start")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Firma notu</Label>
                <Input {...form.register("notes")} placeholder="Genel not..." />
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

            <DialogFooter>
              <Button type="submit">Güncelle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDocOpen}
        onOpenChange={setDeleteDocOpen}
        title="Dosyayı sil"
        description={
          deletingDoc
            ? `${deletingDoc.name} kalıcı olarak silinecek.`
            : undefined
        }
        confirmLabel="Sil"
        onConfirm={handleDeleteDoc}
      />
    </PageMotion>
  );
}
