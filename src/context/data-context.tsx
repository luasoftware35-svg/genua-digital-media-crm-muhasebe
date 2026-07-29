"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { currentUser } from "@/lib/mock-data";
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

  addCompany: (data: Omit<Company, "id" | "created_at">) => Promise<void>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  addInvoice: (
    data: Omit<Invoice, "id" | "created_at" | "invoice_no" | "total"> & {
      invoice_no?: string;
    }
  ) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addProject: (data: Omit<Project, "id" | "created_at">) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  toggleTask: (id: string) => Promise<void>;
  addTask: (projectId: string, title: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addProposal: (data: Omit<Proposal, "id" | "created_at">) => Promise<void>;
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;

  addExpense: (data: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addNote: (companyId: string, note: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addDocument: (data: Omit<CompanyDocument, "id" | "created_at">) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  addContent: (data: Omit<ContentItem, "id" | "created_at">) => Promise<void>;
  updateContent: (id: string, data: Partial<ContentItem>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;

  updateProfile: (data: Partial<Profile>) => Promise<void>;

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

  const user = profile ?? currentUser;
  const db = configured ? getClientDb() : null;

  useEffect(() => {
    if (!db || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubs = [
      onSnapshot(collection(db, COLLECTIONS.profiles), (snap) => {
        setProfiles(mapDocs<Profile>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.companies), (snap) => {
        setCompanies(mapDocs<Company>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.invoices), (snap) => {
        setInvoices(mapDocs<Invoice>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.projects), (snap) => {
        setProjects(mapDocs<Project>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.tasks), (snap) => {
        setTasks(mapDocs<Task>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.proposals), (snap) => {
        setProposals(mapDocs<Proposal>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.expenses), (snap) => {
        setExpenses(mapDocs<Expense>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.activities), (snap) => {
        const items = mapDocs<Activity>(snap.docs);
        items.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setActivities(items);
      }),
      onSnapshot(collection(db, COLLECTIONS.companyNotes), (snap) => {
        setNotes(mapDocs<CompanyNote>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.companyDocuments), (snap) => {
        setDocuments(mapDocs<CompanyDocument>(snap.docs));
      }),
      onSnapshot(collection(db, COLLECTIONS.contentItems), (snap) => {
        setContentItems(mapDocs<ContentItem>(snap.docs));
      }),
    ];

    setLoading(false);
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
      if (!db) return;
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
      } catch {
        toast.error("Firma eklenemedi");
      }
    },
    [db, pushActivity]
  );

  const updateCompany = useCallback(
    async (id: string, data: Partial<Company>) => {
      if (!db) return;
      try {
        const logo_url = data.logo_url
          ? await resolveStorageUrl(data.logo_url, `logos/${id}-${Date.now()}`)
          : data.logo_url;
        await updateDoc(doc(db, COLLECTIONS.companies, id), {
          ...data,
          ...(logo_url !== undefined ? { logo_url } : {}),
        });
      } catch {
        toast.error("Firma güncellenemedi");
      }
    },
    [db]
  );

  const deleteRelated = useCallback(
    async (collectionName: string, field: string, value: string) => {
      if (!db) return;
      const q = query(collection(db, collectionName), where(field, "==", value));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      if (snap.size > 0) await batch.commit();
    },
    [db]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        const c = companies.find((x) => x.id === id);
        await deleteRelated(COLLECTIONS.invoices, "company_id", id);
        await deleteRelated(COLLECTIONS.projects, "company_id", id);
        await deleteRelated(COLLECTIONS.companyNotes, "company_id", id);
        await deleteRelated(COLLECTIONS.companyDocuments, "company_id", id);
        await deleteRelated(COLLECTIONS.contentItems, "company_id", id);
        await deleteDoc(doc(db, COLLECTIONS.companies, id));
        if (c) await pushActivity("company", `${c.name} silindi`);
      } catch {
        toast.error("Firma silinemedi");
      }
    },
    [db, companies, deleteRelated, pushActivity]
  );

  const addInvoice = useCallback(
    async (
      data: Omit<Invoice, "id" | "created_at" | "invoice_no" | "total"> & {
        invoice_no?: string;
      }
    ) => {
      if (!db) return;
      try {
        const year = new Date().getFullYear();
        const no =
          data.invoice_no ||
          `GDA-${year}-${String(invoices.length + 1).padStart(3, "0")}`;
        const total = calcTotal(data.amount, data.vat_rate);
        await addDoc(collection(db, COLLECTIONS.invoices), {
          ...data,
          invoice_no: no,
          total,
          created_at: new Date().toISOString(),
        });
        const company = companies.find((c) => c.id === data.company_id);
        await pushActivity("invoice", `${company?.name ?? "Firma"} için ${no} kesildi`);
      } catch {
        toast.error("Fatura eklenemedi");
      }
    },
    [db, companies, invoices.length, pushActivity]
  );

  const updateInvoice = useCallback(
    async (id: string, data: Partial<Invoice>) => {
      if (!db) return;
      try {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return;
        const next = { ...inv, ...data };
        const payload: Record<string, unknown> = { ...data };
        if (data.amount != null || data.vat_rate != null) {
          payload.total = calcTotal(next.amount, next.vat_rate);
        }
        await updateDoc(doc(db, COLLECTIONS.invoices, id), payload);
      } catch {
        toast.error("Fatura güncellenemedi");
      }
    },
    [db, invoices]
  );

  const updateInvoiceStatus = useCallback(
    async (id: string, status: InvoiceStatus) => {
      if (!db) return;
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
      } catch {
        toast.error("Durum güncellenemedi");
      }
    },
    [db, companies, invoices, pushActivity]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.invoices, id));
      } catch {
        toast.error("Fatura silinemedi");
      }
    },
    [db]
  );

  const addProject = useCallback(
    async (data: Omit<Project, "id" | "created_at">) => {
      if (!db) return;
      try {
        await addDoc(collection(db, COLLECTIONS.projects), {
          ...data,
          created_at: new Date().toISOString(),
        });
        await pushActivity("project", `${data.title} projesi oluşturuldu`);
      } catch {
        toast.error("Proje eklenemedi");
      }
    },
    [db, pushActivity]
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Project>) => {
      if (!db) return;
      try {
        await updateDoc(doc(db, COLLECTIONS.projects, id), data);
      } catch {
        toast.error("Proje güncellenemedi");
      }
    },
    [db]
  );

  const updateProjectStatus = useCallback(
    async (id: string, status: ProjectStatus) => {
      if (!db) return;
      try {
        await updateDoc(doc(db, COLLECTIONS.projects, id), { status });
      } catch {
        toast.error("Durum güncellenemedi");
      }
    },
    [db]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteRelated(COLLECTIONS.tasks, "project_id", id);
        await deleteDoc(doc(db, COLLECTIONS.projects, id));
      } catch {
        toast.error("Proje silinemedi");
      }
    },
    [db, deleteRelated]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      if (!db) return;
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      try {
        await updateDoc(doc(db, COLLECTIONS.tasks, id), { done: !task.done });
      } catch {
        toast.error("Görev güncellenemedi");
      }
    },
    [db, tasks]
  );

  const addTask = useCallback(
    async (projectId: string, title: string) => {
      if (!db) return;
      try {
        await addDoc(collection(db, COLLECTIONS.tasks), {
          project_id: projectId,
          title,
          done: false,
        });
      } catch {
        toast.error("Görev eklenemedi");
      }
    },
    [db]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.tasks, id));
      } catch {
        toast.error("Görev silinemedi");
      }
    },
    [db]
  );

  const addProposal = useCallback(
    async (data: Omit<Proposal, "id" | "created_at">) => {
      if (!db) return;
      try {
        await addDoc(collection(db, COLLECTIONS.proposals), {
          ...data,
          created_at: new Date().toISOString(),
        });
        await pushActivity("proposal", `${data.company_name} teklifi gönderildi`);
      } catch {
        toast.error("Teklif eklenemedi");
      }
    },
    [db, pushActivity]
  );

  const updateProposal = useCallback(
    async (id: string, data: Partial<Proposal>) => {
      if (!db) return;
      try {
        await updateDoc(doc(db, COLLECTIONS.proposals, id), data);
      } catch {
        toast.error("Teklif güncellenemedi");
      }
    },
    [db]
  );

  const deleteProposal = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.proposals, id));
      } catch {
        toast.error("Teklif silinemedi");
      }
    },
    [db]
  );

  const addExpense = useCallback(
    async (data: Omit<Expense, "id">) => {
      if (!db) return;
      try {
        await addDoc(collection(db, COLLECTIONS.expenses), data);
      } catch {
        toast.error("Gider eklenemedi");
      }
    },
    [db]
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<Expense>) => {
      if (!db) return;
      try {
        await updateDoc(doc(db, COLLECTIONS.expenses, id), data);
      } catch {
        toast.error("Gider güncellenemedi");
      }
    },
    [db]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.expenses, id));
      } catch {
        toast.error("Gider silinemedi");
      }
    },
    [db]
  );

  const addNote = useCallback(
    async (companyId: string, note: string) => {
      if (!db) return;
      try {
        await addDoc(collection(db, COLLECTIONS.companyNotes), {
          company_id: companyId,
          note,
          created_at: new Date().toISOString(),
        });
      } catch {
        toast.error("Not eklenemedi");
      }
    },
    [db]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.companyNotes, id));
      } catch {
        toast.error("Not silinemedi");
      }
    },
    [db]
  );

  const addDocument = useCallback(
    async (data: Omit<CompanyDocument, "id" | "created_at">) => {
      if (!db) return;
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
      } catch {
        toast.error("Dosya yüklenemedi");
      }
    },
    [db]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.companyDocuments, id));
      } catch {
        toast.error("Dosya silinemedi");
      }
    },
    [db]
  );

  const addContent = useCallback(
    async (data: Omit<ContentItem, "id" | "created_at">) => {
      if (!db) return;
      try {
        await addDoc(collection(db, COLLECTIONS.contentItems), {
          ...data,
          created_at: new Date().toISOString(),
        });
      } catch {
        toast.error("İçerik eklenemedi");
      }
    },
    [db]
  );

  const updateContent = useCallback(
    async (id: string, data: Partial<ContentItem>) => {
      if (!db) return;
      try {
        await updateDoc(doc(db, COLLECTIONS.contentItems, id), data);
      } catch {
        toast.error("İçerik güncellenemedi");
      }
    },
    [db]
  );

  const deleteContent = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, COLLECTIONS.contentItems, id));
      } catch {
        toast.error("İçerik silinemedi");
      }
    },
    [db]
  );

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!db || !profile) return;
      try {
        const avatar_url = data.avatar_url
          ? await resolveStorageUrl(data.avatar_url, `avatars/${profile.id}-${Date.now()}`)
          : data.avatar_url;
        await updateDoc(doc(db, COLLECTIONS.profiles, profile.id), {
          ...data,
          ...(avatar_url !== undefined ? { avatar_url } : {}),
        });
      } catch {
        toast.error("Profil güncellenemedi");
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
