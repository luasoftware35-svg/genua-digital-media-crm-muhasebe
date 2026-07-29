"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
  type DocumentData,
} from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { resolveStorageUrl } from "@/lib/firebase/upload";
import type {
  Activity,
  Company,
  CompanyDocument,
  CompanyNote,
  ContentItem,
  Expense,
  Invoice,
  InvoiceStatus,
  Profile,
  Project,
  ProjectStatus,
  Proposal,
  Task,
} from "@/lib/types";
import { calcTotal } from "@/lib/format";

function mapDocs<T extends { id: string }>(docs: { id: string; data: () => DocumentData }[]): T[] {
  return docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

function nextInvoiceNo(invoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `GDA-${year}-`;
  const nums = invoices
    .filter((i) => i.invoice_no.startsWith(prefix))
    .map((i) => parseInt(i.invoice_no.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

const SNAPSHOT_LISTENERS = 11;

interface DataContextValue {
  loading: boolean;
  user: Profile;
  profiles: Profile[];
  companies: Company[];
  invoices: Invoice[];
  projects: Project[];
  tasks: Task[];
  proposals: Proposal[];
  expenses: Expense[];
  activities: Activity[];
  notes: CompanyNote[];
  documents: CompanyDocument[];
  contentItems: ContentItem[];
  overdueCount: number;

  addCompany: (data: Omit<Company, "id" | "created_at">) => Promise<boolean>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<boolean>;
  deleteCompany: (id: string) => Promise<boolean>;

  addInvoice: (
    data: Omit<Invoice, "id" | "created_at" | "invoice_no" | "total"> & {
      invoice_no?: string;
    }
  ) => Promise<boolean>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<boolean>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;

  addProject: (data: Omit<Project, "id" | "created_at">) => Promise<boolean>;
  updateProject: (id: string, data: Partial<Project>) => Promise<boolean>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;

  toggleTask: (id: string) => Promise<boolean>;
  addTask: (projectId: string, title: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;

  addProposal: (data: Omit<Proposal, "id" | "created_at">) => Promise<boolean>;
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<boolean>;
  deleteProposal: (id: string) => Promise<boolean>;

  addExpense: (data: Omit<Expense, "id">) => Promise<boolean>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;

  addNote: (companyId: string, note: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;

  addDocument: (data: Omit<CompanyDocument, "id" | "created_at">) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;

  addContent: (data: Omit<ContentItem, "id" | "created_at">) => Promise<boolean>;
  updateContent: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  deleteContent: (id: string) => Promise<boolean>;

  updateProfile: (data: Partial<Profile>) => Promise<boolean>;

  getCompany: (id: string) => Company | undefined;
  getCompanyInvoices: (id: string) => Invoice[];
  getCompanyNotes: (id: string) => CompanyNote[];
  getCompanyDocs: (id: string) => CompanyDocument[];
  getProjectTasks: (id: string) => Task[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { configured, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  const initialLoadRef = useRef(true);
  const loadedCountRef = useRef(0);

  const user = useMemo(() => {
    if (!profile) {
      return {
        id: "",
        full_name: "Yükleniyor...",
        role: "admin" as const,
        email: "",
      };
    }
    return profiles.find((p) => p.id === profile.id) ?? profile;
  }, [profile, profiles]);
  const db = configured ? getClientDb() : null;

  useEffect(() => {
    if (!db || !profile) {
      setLoading(false);
      return;
    }

    initialLoadRef.current = true;
    loadedCountRef.current = 0;
    setLoading(true);

    const markLoaded = () => {
      if (!initialLoadRef.current) return;
      loadedCountRef.current += 1;
      if (loadedCountRef.current >= SNAPSHOT_LISTENERS) {
        initialLoadRef.current = false;
        setLoading(false);
      }
    };

    const unsubs = [
      onSnapshot(collection(db, COLLECTIONS.profiles), (snap) => {
        setProfiles(mapDocs<Profile>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.companies), (snap) => {
        setCompanies(mapDocs<Company>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.invoices), (snap) => {
        setInvoices(mapDocs<Invoice>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.projects), (snap) => {
        setProjects(mapDocs<Project>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.tasks), (snap) => {
        setTasks(mapDocs<Task>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.proposals), (snap) => {
        setProposals(mapDocs<Proposal>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.expenses), (snap) => {
        setExpenses(mapDocs<Expense>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.activities), (snap) => {
        const items = mapDocs<Activity>(snap.docs);
        items.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setActivities(items);
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.companyNotes), (snap) => {
        setNotes(mapDocs<CompanyNote>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.companyDocuments), (snap) => {
        setDocuments(mapDocs<CompanyDocument>(snap.docs));
        markLoaded();
      }),
      onSnapshot(collection(db, COLLECTIONS.contentItems), (snap) => {
        setContentItems(mapDocs<ContentItem>(snap.docs));
        markLoaded();
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [db, profile]);

  const overdueCount = useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.status === "gecikti" ||
          (i.status === "bekliyor" && new Date(i.due_date) < new Date())
      ).length,
    [invoices]
  );

  const syncedOverdue = useRef(new Set<string>());

  useEffect(() => {
    if (!db || !profile) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach((inv) => {
      if (inv.status !== "bekliyor") return;
      if (new Date(inv.due_date) >= today) return;
      if (syncedOverdue.current.has(inv.id)) return;
      syncedOverdue.current.add(inv.id);
      updateDoc(doc(db, COLLECTIONS.invoices, inv.id), { status: "gecikti" }).catch(
        () => syncedOverdue.current.delete(inv.id)
      );
    });
  }, [db, profile, invoices]);

  const pushActivity = useCallback(
    async (type: string, description: string) => {
      if (!db) return;
      await addDoc(collection(db, COLLECTIONS.activities), {
        type,
        description,
        created_at: new Date().toISOString(),
      });
    },
    [db]
  );

  const addCompany = useCallback(
    async (data: Omit<Company, "id" | "created_at">) => {
      if (!db || !profile) return false;
      try {
        const logo_url = await resolveStorageUrl(
          data.logo_url,
          `logos/${Date.now()}-logo`
        );
        await addDoc(collection(db, COLLECTIONS.companies), {
          ...data,
          logo_url,
          created_at: new Date().toISOString(),
        });
        await pushActivity("company", `${data.name} eklendi`);
        return true;
      } catch {
        toast.error("Firma eklenemedi");
        return false;
      }
    },
    [db, pushActivity]
  );

  const updateCompany = useCallback(
    async (id: string, data: Partial<Company>) => {
      if (!db || !profile) return false;
      try {
        const logo_url = data.logo_url
          ? await resolveStorageUrl(data.logo_url, `logos/${id}-${Date.now()}`)
          : data.logo_url;
        const payload: Record<string, unknown> = {
          ...data,
          ...(logo_url !== undefined ? { logo_url } : {}),
        };
        if (data.status != null) {
          payload.updated_at = new Date().toISOString();
        }
        await updateDoc(doc(db, COLLECTIONS.companies, id), payload);
        return true;
      } catch {
        toast.error("Firma güncellenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteRelated = useCallback(
    async (collectionName: string, field: string, value: string) => {
      if (!db) return;
      const q = query(collection(db, collectionName), where(field, "==", value));
      const snap = await getDocs(q);
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 500) {
        const batch = writeBatch(db);
        docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    },
    [db]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        const c = companies.find((x) => x.id === id);
        const projectIds = projects
          .filter((p) => p.company_id === id)
          .map((p) => p.id);
        for (const projectId of projectIds) {
          await deleteRelated(COLLECTIONS.tasks, "project_id", projectId);
        }
        await deleteRelated(COLLECTIONS.invoices, "company_id", id);
        await deleteRelated(COLLECTIONS.projects, "company_id", id);
        await deleteRelated(COLLECTIONS.companyNotes, "company_id", id);
        await deleteRelated(COLLECTIONS.companyDocuments, "company_id", id);
        await deleteRelated(COLLECTIONS.contentItems, "company_id", id);
        await deleteDoc(doc(db, COLLECTIONS.companies, id));
        if (c) await pushActivity("company", `${c.name} silindi`);
        return true;
      } catch {
        toast.error("Firma silinemedi");
        return false;
      }
    },
    [db, profile, companies, projects, deleteRelated, pushActivity]
  );

  const addInvoice = useCallback(
    async (
      data: Omit<Invoice, "id" | "created_at" | "invoice_no" | "total"> & {
        invoice_no?: string;
      }
    ) => {
      if (!db || !profile) return false;
      try {
        const no = data.invoice_no || nextInvoiceNo(invoices);
        const total = calcTotal(data.amount, data.vat_rate);
        await addDoc(collection(db, COLLECTIONS.invoices), {
          ...data,
          invoice_no: no,
          total,
          created_at: new Date().toISOString(),
        });
        const company = companies.find((c) => c.id === data.company_id);
        await pushActivity("invoice", `${company?.name ?? "Firma"} için ${no} kesildi`);
        return true;
      } catch {
        toast.error("Fatura eklenemedi");
        return false;
      }
    },
    [db, companies, invoices.length, pushActivity]
  );

  const updateInvoice = useCallback(
    async (id: string, data: Partial<Invoice>) => {
      if (!db || !profile) return false;
      try {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return false;
        const next = { ...inv, ...data };
        const payload: Record<string, unknown> = { ...data };
        if (data.amount != null || data.vat_rate != null) {
          payload.total = calcTotal(next.amount, next.vat_rate);
        }
        await updateDoc(doc(db, COLLECTIONS.invoices, id), payload);
        return true;
      } catch {
        toast.error("Fatura güncellenemedi");
        return false;
      }
    },
    [db, invoices]
  );

  const updateInvoiceStatus = useCallback(
    async (id: string, status: InvoiceStatus) => {
      if (!db || !profile) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.invoices, id), { status });
        if (status === "odendi") {
          const inv = invoices.find((i) => i.id === id);
          const company = companies.find((c) => c.id === inv?.company_id);
          if (inv && company) {
            await pushActivity(
              "payment",
              `${company.name} faturası ödendi — ₺${inv.total.toLocaleString("tr-TR")}`
            );
          }
        }
        return true;
      } catch {
        toast.error("Durum güncellenemedi");
        return false;
      }
    },
    [db, companies, invoices, pushActivity]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.invoices, id));
        return true;
      } catch {
        toast.error("Fatura silinemedi");
        return false;
      }
    },
    [db]
  );

  const addProject = useCallback(
    async (data: Omit<Project, "id" | "created_at">) => {
      if (!db || !profile) return false;
      try {
        await addDoc(collection(db, COLLECTIONS.projects), {
          ...data,
          created_at: new Date().toISOString(),
        });
        await pushActivity("project", `${data.title} projesi oluşturuldu`);
        return true;
      } catch {
        toast.error("Proje eklenemedi");
        return false;
      }
    },
    [db, pushActivity]
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Project>) => {
      if (!db || !profile) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.projects, id), data);
        return true;
      } catch {
        toast.error("Proje güncellenemedi");
        return false;
      }
    },
    [db]
  );

  const updateProjectStatus = useCallback(
    async (id: string, status: ProjectStatus) => {
      if (!db || !profile) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.projects, id), { status });
        return true;
      } catch {
        toast.error("Durum güncellenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteRelated(COLLECTIONS.tasks, "project_id", id);
        await deleteDoc(doc(db, COLLECTIONS.projects, id));
        return true;
      } catch {
        toast.error("Proje silinemedi");
        return false;
      }
    },
    [db, deleteRelated]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      const task = tasks.find((t) => t.id === id);
      if (!task) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.tasks, id), { done: !task.done });
        return true;
      } catch {
        toast.error("Görev güncellenemedi");
        return false;
      }
    },
    [db, tasks]
  );

  const addTask = useCallback(
    async (projectId: string, title: string) => {
      if (!db || !profile) return false;
      try {
        await addDoc(collection(db, COLLECTIONS.tasks), {
          project_id: projectId,
          title,
          done: false,
        });
        return true;
      } catch {
        toast.error("Görev eklenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.tasks, id));
        return true;
      } catch {
        toast.error("Görev silinemedi");
        return false;
      }
    },
    [db]
  );

  const addProposal = useCallback(
    async (data: Omit<Proposal, "id" | "created_at">) => {
      if (!db || !profile) return false;
      try {
        await addDoc(collection(db, COLLECTIONS.proposals), {
          ...data,
          created_at: new Date().toISOString(),
        });
        await pushActivity("proposal", `${data.company_name} teklifi gönderildi`);
        return true;
      } catch {
        toast.error("Teklif eklenemedi");
        return false;
      }
    },
    [db, pushActivity]
  );

  const updateProposal = useCallback(
    async (id: string, data: Partial<Proposal>) => {
      if (!db || !profile) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.proposals, id), data);
        return true;
      } catch {
        toast.error("Teklif güncellenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteProposal = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.proposals, id));
        return true;
      } catch {
        toast.error("Teklif silinemedi");
        return false;
      }
    },
    [db]
  );

  const addExpense = useCallback(
    async (data: Omit<Expense, "id">) => {
      if (!db || !profile) return false;
      try {
        await addDoc(collection(db, COLLECTIONS.expenses), data);
        return true;
      } catch {
        toast.error("Gider eklenemedi");
        return false;
      }
    },
    [db]
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<Expense>) => {
      if (!db || !profile) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.expenses, id), data);
        return true;
      } catch {
        toast.error("Gider güncellenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.expenses, id));
        return true;
      } catch {
        toast.error("Gider silinemedi");
        return false;
      }
    },
    [db]
  );

  const addNote = useCallback(
    async (companyId: string, note: string) => {
      if (!db || !profile) return false;
      try {
        await addDoc(collection(db, COLLECTIONS.companyNotes), {
          company_id: companyId,
          note,
          created_at: new Date().toISOString(),
        });
        return true;
      } catch {
        toast.error("Not eklenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.companyNotes, id));
        return true;
      } catch {
        toast.error("Not silinemedi");
        return false;
      }
    },
    [db]
  );

  const addDocument = useCallback(
    async (data: Omit<CompanyDocument, "id" | "created_at">) => {
      if (!db || !profile) return false;
      try {
        const file_path = await resolveStorageUrl(
          data.file_path,
          `documents/${data.company_id}/${Date.now()}-${data.name}`
        );
        if (!file_path) throw new Error("Dosya yüklenemedi");
        await addDoc(collection(db, COLLECTIONS.companyDocuments), {
          ...data,
          file_path,
          created_at: new Date().toISOString(),
        });
        return true;
      } catch {
        toast.error("Dosya yüklenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.companyDocuments, id));
        return true;
      } catch {
        toast.error("Dosya silinemedi");
        return false;
      }
    },
    [db]
  );

  const addContent = useCallback(
    async (data: Omit<ContentItem, "id" | "created_at">) => {
      if (!db || !profile) return false;
      try {
        await addDoc(collection(db, COLLECTIONS.contentItems), {
          ...data,
          created_at: new Date().toISOString(),
        });
        return true;
      } catch {
        toast.error("İçerik eklenemedi");
        return false;
      }
    },
    [db]
  );

  const updateContent = useCallback(
    async (id: string, data: Partial<ContentItem>) => {
      if (!db || !profile) return false;
      try {
        await updateDoc(doc(db, COLLECTIONS.contentItems, id), data);
        return true;
      } catch {
        toast.error("İçerik güncellenemedi");
        return false;
      }
    },
    [db]
  );

  const deleteContent = useCallback(
    async (id: string) => {
      if (!db || !profile) return false;
      try {
        await deleteDoc(doc(db, COLLECTIONS.contentItems, id));
        return true;
      } catch {
        toast.error("İçerik silinemedi");
        return false;
      }
    },
    [db]
  );

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!db || !profile) return false;
      try {
        const avatar_url = data.avatar_url
          ? await resolveStorageUrl(data.avatar_url, `avatars/${profile.id}-${Date.now()}`)
          : data.avatar_url;
        await updateDoc(doc(db, COLLECTIONS.profiles, profile.id), {
          ...data,
          ...(avatar_url !== undefined ? { avatar_url } : {}),
        });
        return true;
      } catch {
        toast.error("Profil güncellenemedi");
        return false;
      }
    },
    [db, profile]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      user,
      profiles: profiles.length ? profiles : profile ? [profile] : [],
      companies,
      invoices,
      projects,
      tasks,
      proposals,
      expenses,
      activities,
      notes,
      documents,
      contentItems,
      overdueCount,
      addCompany,
      updateCompany,
      deleteCompany,
      addInvoice,
      updateInvoice,
      updateInvoiceStatus,
      deleteInvoice,
      addProject,
      updateProject,
      updateProjectStatus,
      deleteProject,
      toggleTask,
      addTask,
      deleteTask,
      addProposal,
      updateProposal,
      deleteProposal,
      addExpense,
      updateExpense,
      deleteExpense,
      addNote,
      deleteNote,
      addDocument,
      deleteDocument,
      addContent,
      updateContent,
      deleteContent,
      updateProfile,
      getCompany: (id) => companies.find((c) => c.id === id),
      getCompanyInvoices: (id) => invoices.filter((i) => i.company_id === id),
      getCompanyNotes: (id) => notes.filter((n) => n.company_id === id),
      getCompanyDocs: (id) => documents.filter((d) => d.company_id === id),
      getProjectTasks: (id) => tasks.filter((t) => t.project_id === id),
    }),
    [
      loading,
      user,
      profiles,
      profile,
      companies,
      invoices,
      projects,
      tasks,
      proposals,
      expenses,
      activities,
      notes,
      documents,
      contentItems,
      overdueCount,
      addCompany,
      updateCompany,
      deleteCompany,
      addInvoice,
      updateInvoice,
      updateInvoiceStatus,
      deleteInvoice,
      addProject,
      updateProject,
      updateProjectStatus,
      deleteProject,
      toggleTask,
      addTask,
      deleteTask,
      addProposal,
      updateProposal,
      deleteProposal,
      addExpense,
      updateExpense,
      deleteExpense,
      addNote,
      deleteNote,
      addDocument,
      deleteDocument,
      addContent,
      updateContent,
      deleteContent,
      updateProfile,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
