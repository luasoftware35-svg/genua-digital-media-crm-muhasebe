"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/types";
import { PageMotion, MotionItem } from "@/components/ui/page-motion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const COLUMNS: ProjectStatus[] = [
  "teklif",
  "devam",
  "revizyon",
  "teslim",
  "tamamlandi",
];

const PROJECT_TYPES = ["Web", "Kimlik", "Kampanya", "SEO", "Diğer"];

function ProjectCard({
  project,
  companyName,
  onClick,
  dragging,
}: {
  project: Project;
  companyName: string;
  onClick?: () => void;
  dragging?: boolean;
}) {
  const days = project.deadline ? daysUntil(project.deadline) : null;
  const deadlineColor =
    days === null
      ? "text-text-secondary"
      : days < 0
        ? "text-danger"
        : days <= 3
          ? "text-warning"
          : "text-text-secondary";

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border border-[#262626] bg-surface p-3 transition-all hover:border-accent/20 hover:shadow-glow-sm",
        dragging && "opacity-90 shadow-glow rotate-1"
      )}
    >
      <p className="text-xs text-text-secondary">{companyName}</p>
      <p className="mt-1 text-sm font-medium leading-snug">{project.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {project.type && <Badge variant="secondary">{project.type}</Badge>}
        {project.budget != null && (
          <span className="font-mono text-[10px] text-accent">
            {formatCurrency(project.budget)}
          </span>
        )}
      </div>
      {project.deadline && (
        <p className={cn("mt-2 font-mono text-[10px]", deadlineColor)}>
          {formatDate(project.deadline)}
          {days != null && days < 0
            ? ` · ${Math.abs(days)}g geçti`
            : days != null && days <= 3
              ? ` · ${days}g kaldı`
              : ""}
        </p>
      )}
    </div>
  );
}

function SortableCard({
  project,
  companyName,
  onClick,
}: {
  project: Project;
  companyName: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard
        project={project}
        companyName={companyName}
        onClick={onClick}
      />
    </div>
  );
}

function Column({
  status,
  projects,
  companyMap,
  onOpen,
}: {
  status: ProjectStatus;
  projects: Project[];
  companyMap: Record<string, string>;
  onOpen: (p: Project) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[min(240px,78vw)] sm:w-[260px] shrink-0 snap-start flex-col rounded-xl border bg-background/50 transition-colors",
        isOver ? "border-accent/40" : "border-[#262626]"
      )}
    >
      <div className="flex items-center justify-between border-b border-[#262626] px-3 py-2.5">
        <h3 className="text-sm font-medium">{PROJECT_STATUS_LABELS[status]}</h3>
        <span className="font-mono text-xs text-text-secondary">
          {projects.length}
        </span>
      </div>
      <SortableContext
        items={projects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-[120px] flex-col gap-2 p-2">
          {projects.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-6 font-mono text-[10px] text-text-secondary">
              Boş — buraya sürükle
            </p>
          ) : (
            projects.map((p) => (
              <SortableCard
                key={p.id}
                project={p}
                companyName={companyMap[p.company_id] ?? "—"}
                onClick={() => onOpen(p)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

type EditForm = {
  company_id: string;
  title: string;
  type: string;
  status: ProjectStatus;
  deadline: string;
  budget: string;
  assigned_to: string;
  description: string;
  time_spent: string;
};

function emptyEditForm(): EditForm {
  return {
    company_id: "",
    title: "",
    type: "Web",
    status: "teklif",
    deadline: "",
    budget: "",
    assigned_to: "",
    description: "",
    time_spent: "",
  };
}

function projectToEditForm(p: Project): EditForm {
  return {
    company_id: p.company_id,
    title: p.title,
    type: p.type,
    status: p.status,
    deadline: p.deadline ?? "",
    budget: p.budget != null ? String(p.budget) : "",
    assigned_to: p.assigned_to ?? "",
    description: p.description ?? "",
    time_spent: p.time_spent ?? "",
  };
}

export default function ProjelerPage() {
  const {
    projects,
    companies,
    profiles,
    addProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    getProjectTasks,
    toggleTask,
    addTask,
    deleteTask,
  } = useData();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    company_id: "",
    title: "",
    type: "Web",
    deadline: "",
    budget: "",
    assigned_to: "",
  });
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  const selected = selectedId
    ? projects.find((p) => p.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (selected) {
      setEditForm(projectToEditForm(selected));
    }
  }, [selected]);

  const byStatus = (s: ProjectStatus) =>
    projects.filter((p) => p.status === s);

  const activeProject = projects.find((p) => p.id === activeId);
  const tasks = selected ? getProjectTasks(selected.id) : [];

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const projectId = String(active.id);
    let newStatus: ProjectStatus | null = null;

    if (COLUMNS.includes(over.id as ProjectStatus)) {
      newStatus = over.id as ProjectStatus;
    } else {
      const overProject = projects.find((p) => p.id === over.id);
      if (overProject) newStatus = overProject.status;
    }

    const current = projects.find((p) => p.id === projectId);
    if (newStatus && current && current.status !== newStatus) {
      const ok = await updateProjectStatus(projectId, newStatus);
      if (ok) toast.success(`→ ${PROJECT_STATUS_LABELS[newStatus]}`);
    }
  };

  const handleAdd = async () => {
    if (!addForm.title.trim() || !addForm.company_id) {
      toast.error("Firma ve başlık zorunlu");
      return;
    }
    const ok = await addProject({
      company_id: addForm.company_id,
      title: addForm.title.trim(),
      type: addForm.type,
      status: "teklif",
      deadline: addForm.deadline || undefined,
      budget: addForm.budget ? Number(addForm.budget) : undefined,
      assigned_to: addForm.assigned_to || undefined,
    });
    if (!ok) return;
    toast.success("Proje eklendi");
    setAddOpen(false);
    setAddForm({
      company_id: "",
      title: "",
      type: "Web",
      deadline: "",
      budget: "",
      assigned_to: "",
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!editForm.title.trim() || !editForm.company_id) {
      toast.error("Firma ve başlık zorunlu");
      return;
    }
    const ok = await updateProject(selected.id, {
      company_id: editForm.company_id,
      title: editForm.title.trim(),
      type: editForm.type,
      status: editForm.status,
      deadline: editForm.deadline || undefined,
      budget: editForm.budget ? Number(editForm.budget) : undefined,
      assigned_to: editForm.assigned_to || undefined,
      description: editForm.description || undefined,
      time_spent: editForm.time_spent || undefined,
    });
    if (!ok) return;
    toast.success("Proje güncellendi");
  };

  const handleDeleteProject = async () => {
    if (!selected) return;
    const ok = await deleteProject(selected.id);
    if (!ok) return;
    setSelectedId(null);
    toast.success("Proje silindi");
  };

  return (
    <PageMotion className="space-y-4">
      <MotionItem className="flex justify-stretch sm:justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 w-full sm:h-10 sm:w-auto">
              <Plus className="h-4 w-4" />
              Proje Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Proje</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Firma</Label>
                <Select
                  value={addForm.company_id}
                  onValueChange={(v) =>
                    setAddForm((f) => ({ ...f, company_id: v }))
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
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tip</Label>
                  <Select
                    value={addForm.type}
                    onValueChange={(v) =>
                      setAddForm((f) => ({ ...f, type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bütçe</Label>
                  <Input
                    type="number"
                    value={addForm.budget}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, budget: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={addForm.deadline}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, deadline: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Atanan</Label>
                  <Select
                    value={addForm.assigned_to || "none"}
                    onValueChange={(v) =>
                      setAddForm((f) => ({
                        ...f,
                        assigned_to: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kişi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MotionItem>

      <MotionItem>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="mobile-snap-x lg:pb-4">
            {COLUMNS.map((status) => (
              <motion.div
                key={status}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Column
                  status={status}
                  projects={byStatus(status)}
                  companyMap={companyMap}
                  onOpen={(p) => setSelectedId(p.id)}
                />
              </motion.div>
            ))}
          </div>
          <DragOverlay>
            {activeProject ? (
              <ProjectCard
                project={activeProject}
                companyName={companyMap[activeProject.company_id] ?? "—"}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </MotionItem>

      <Sheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      >
        <SheetContent className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Proje Düzenle</SheetTitle>
                <p className="text-sm text-text-secondary">
                  {companyMap[selected.company_id]} · {selected.type}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Başlık</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Firma</Label>
                  <Select
                    value={editForm.company_id}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, company_id: v }))
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tip</Label>
                    <Select
                      value={editForm.type}
                      onValueChange={(v) =>
                        setEditForm((f) => ({ ...f, type: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Durum</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) =>
                        setEditForm((f) => ({
                          ...f,
                          status: v as ProjectStatus,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {PROJECT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bütçe</Label>
                    <Input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, budget: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deadline</Label>
                    <Input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, deadline: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Atanan</Label>
                  <Select
                    value={editForm.assigned_to || "none"}
                    onValueChange={(v) =>
                      setEditForm((f) => ({
                        ...f,
                        assigned_to: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kişi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Açıklama</Label>
                  <Textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Harcanan süre</Label>
                  <Input
                    placeholder="örn. 12s"
                    value={editForm.time_spent}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        time_spent: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" onClick={handleSave}>
                    Kaydet
                  </Button>
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Projeyi sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border-t border-[#262626] pt-4">
                  <p className="mb-2 text-xs text-text-secondary">Görevler</p>
                  <ul className="space-y-2">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={t.done}
                          onCheckedChange={() => toggleTask(t.id)}
                        />
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            t.done && "line-through text-text-secondary"
                          )}
                        >
                          {t.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-text-secondary hover:text-danger"
                          onClick={() => deleteTask(t.id)}
                          aria-label="Görevi sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                    {tasks.length === 0 && (
                      <p className="font-mono text-[10px] text-text-secondary">
                        Henüz görev yok
                      </p>
                    )}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Yeni görev..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTask.trim()) {
                          addTask(selected.id, newTask.trim());
                          setNewTask("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newTask.trim()) return;
                        addTask(selected.id, newTask.trim());
                        setNewTask("");
                      }}
                    >
                      Ekle
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Projeyi sil?"
        description="Proje ve tüm görevleri kalıcı olarak silinir."
        onConfirm={handleDeleteProject}
      />
    </PageMotion>
  );
}
