"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import {
  COMPANY_COLORS,
  CONTENT_PLATFORMS,
  type ContentItem,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

export default function TakvimPage() {
  const {
    companies,
    contentItems,
    addContent,
    updateContent,
    deleteContent,
  } = useData();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_id: "",
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    platform: "Instagram",
    notes: "",
  });

  const companyColor = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach((c, i) => {
      map[c.id] = COMPANY_COLORS[i % COMPANY_COLORS.length];
    });
    return map;
  }, [companies]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const itemsByDay = (day: Date) =>
    contentItems.filter((c) => isSameDay(new Date(c.date), day));

  const openCreate = (date?: string) => {
    setEditing(null);
    setForm({
      company_id: companies[0]?.id ?? "",
      title: "",
      date: date ?? format(new Date(), "yyyy-MM-dd"),
      platform: "Instagram",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({
      company_id: item.company_id,
      title: item.title,
      date: item.date,
      platform: item.platform,
      notes: item.notes ?? "",
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.company_id || !form.title.trim()) {
      toast.error("Firma ve başlık zorunlu");
      return;
    }
    if (editing) {
      updateContent(editing.id, {
        company_id: form.company_id,
        title: form.title.trim(),
        date: form.date,
        platform: form.platform,
        notes: form.notes || undefined,
      });
      toast.success("İçerik güncellendi");
    } else {
      addContent({
        company_id: form.company_id,
        title: form.title.trim(),
        date: form.date,
        platform: form.platform,
        notes: form.notes || undefined,
      });
      toast.success("İçerik eklendi");
    }
    setOpen(false);
  };

  return (
    <PageMotion className="space-y-4">
      <MotionItem className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg min-w-[140px] text-center capitalize">
            {format(cursor, "LLLL yyyy", { locale: tr })}
          </h2>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto h-11 sm:h-10"
              onClick={() => openCreate()}
              disabled={companies.length === 0}
            >
              <Plus className="h-4 w-4" />
              İçerik Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "İçerik Düzenle" : "Yeni İçerik"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Firma</Label>
                <Select
                  value={form.company_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, company_id: v }))
                  }
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
                <Label>Başlık</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select
                    value={form.platform}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, platform: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Not</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MotionItem>

      {companies.length === 0 ? (
        <MotionItem>
          <div className="rounded-xl border border-[#262626] bg-surface">
            <EmptyState
              icon={CalendarDays}
              message="Önce firma ekle — sonra içerik planla"
            />
          </div>
        </MotionItem>
      ) : (
        <MotionItem>
          <div className="rounded-xl border border-[#262626] bg-surface overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#262626]">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                <div
                  key={d}
                  className="px-1 py-2 text-center font-mono text-[10px] text-text-secondary"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const items = itemsByDay(day);
                const inMonth = isSameMonth(day, cursor);
                const today = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => openCreate(format(day, "yyyy-MM-dd"))}
                    className={cn(
                      "min-h-[88px] sm:min-h-[110px] border-b border-r border-[#262626] p-1 sm:p-1.5 text-left align-top transition-colors hover:bg-surface-hover",
                      !inMonth && "opacity-35",
                      today && "bg-accent/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]",
                        today && "bg-accent text-background font-medium"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {items.slice(0, 3).map((item) => {
                        return (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(item);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                openEdit(item);
                              }
                            }}
                            className="group flex items-start gap-1 rounded px-1 py-0.5 text-[10px] leading-tight"
                            style={{
                              background: `${companyColor[item.company_id]}22`,
                              borderLeft: `2px solid ${companyColor[item.company_id]}`,
                            }}
                          >
                            <span className="truncate flex-1">
                              {item.title}
                            </span>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(item.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                      {items.length > 3 && (
                        <p className="font-mono text-[9px] text-text-secondary px-1">
                          +{items.length - 3}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {companies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {companies.map((c) => (
                <Badge
                  key={c.id}
                  variant="secondary"
                  className="gap-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: companyColor[c.id] }}
                  />
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
        </MotionItem>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="İçeriği sil?"
        description="Bu içerik planı kalıcı olarak silinir."
        onConfirm={() => {
          if (deleteId) {
            deleteContent(deleteId);
            toast.success("Silindi");
          }
        }}
      />
    </PageMotion>
  );
}
