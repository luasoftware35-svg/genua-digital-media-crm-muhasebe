"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  activities as seedActivities,
  companies as seedCompanies,
  companyDocuments as seedDocs,
  companyNotes as seedNotes,
  contentItems as seedContent,
  currentUser,
  expenses as seedExpenses,
  invoices as seedInvoices,
  profiles as seedProfiles,
  projects as seedProjects,
  proposals as seedProposals,
  tasks as seedTasks,
} from "@/lib/mock-data";
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

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface DataContextValue {
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

  addCompany: (data: Omit<Company, "id" | "created_at">) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addInvoice: (
    data: Omit<Invoice, "id" | "created_at" | "invoice_no" | "total"> & {
      invoice_no?: string;
    }
  ) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;

  addProject: (data: Omit<Project, "id" | "created_at">) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;

  toggleTask: (id: string) => void;
  addTask: (projectId: string, title: string) => void;
  deleteTask: (id: string) => void;

  addProposal: (data: Omit<Proposal, "id" | "created_at">) => void;
  updateProposal: (id: string, data: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;

  addExpense: (data: Omit<Expense, "id">) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addNote: (companyId: string, note: string) => void;
  deleteNote: (id: string) => void;

  addDocument: (
    data: Omit<CompanyDocument, "id" | "created_at">
  ) => void;
  deleteDocument: (id: string) => void;

  addContent: (data: Omit<ContentItem, "id" | "created_at">) => void;
  updateContent: (id: string, data: Partial<ContentItem>) => void;
  deleteContent: (id: string) => void;

  updateProfile: (data: Partial<Profile>) => void;

  getCompany: (id: string) => Company | undefined;
  getCompanyInvoices: (id: string) => Invoice[];
  getCompanyNotes: (id: string) => CompanyNote[];
  getCompanyDocs: (id: string) => CompanyDocument[];
  getProjectTasks: (id: string) => Task[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState(seedProfiles);
  const [companies, setCompanies] = useState(seedCompanies);
  const [invoices, setInvoices] = useState(seedInvoices);
  const [projects, setProjects] = useState(seedProjects);
  const [tasks, setTasks] = useState(seedTasks);
  const [proposals, setProposals] = useState(seedProposals);
  const [expenses, setExpenses] = useState(seedExpenses);
  const [activities, setActivities] = useState(seedActivities);
  const [notes, setNotes] = useState(seedNotes);
  const [documents, setDocuments] = useState(seedDocs);
  const [contentItems, setContentItems] = useState(seedContent);

  const user = profiles[0] ?? currentUser;

  const overdueCount = useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.status === "gecikti" ||
          (i.status === "bekliyor" && new Date(i.due_date) < new Date())
      ).length,
    [invoices]
  );

  const pushActivity = useCallback((type: string, description: string) => {
    setActivities((prev) => [
      {
        id: uid("a"),
        type,
        description,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const addCompany = useCallback(
    (data: Omit<Company, "id" | "created_at">) => {
      const company: Company = {
        ...data,
        id: uid("c"),
        created_at: new Date().toISOString(),
      };
      setCompanies((prev) => [company, ...prev]);
      pushActivity("company", `${company.name} eklendi`);
    },
    [pushActivity]
  );

  const updateCompany = useCallback((id: string, data: Partial<Company>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  }, []);

  const deleteCompany = useCallback(
    (id: string) => {
      const c = companies.find((x) => x.id === id);
      setCompanies((prev) => prev.filter((x) => x.id !== id));
      setInvoices((prev) => prev.filter((x) => x.company_id !== id));
      setProjects((prev) => prev.filter((x) => x.company_id !== id));
      setNotes((prev) => prev.filter((x) => x.company_id !== id));
      setDocuments((prev) => prev.filter((x) => x.company_id !== id));
      setContentItems((prev) => prev.filter((x) => x.company_id !== id));
      if (c) pushActivity("company", `${c.name} silindi`);
    },
    [companies, pushActivity]
  );

  const addInvoice = useCallback(
    (
      data: Omit<Invoice, "id" | "created_at" | "invoice_no" | "total"> & {
        invoice_no?: string;
      }
    ) => {
      const year = new Date().getFullYear();
      const no =
        data.invoice_no ||
        `GDA-${year}-${String(invoices.length + 1).padStart(3, "0")}`;
      const invoice: Invoice = {
        ...data,
        id: uid("inv"),
        invoice_no: no,
        total: calcTotal(data.amount, data.vat_rate),
        created_at: new Date().toISOString(),
      };
      setInvoices((prev) => [invoice, ...prev]);
      const company = companies.find((c) => c.id === data.company_id);
      pushActivity(
        "invoice",
        `${company?.name ?? "Firma"} için ${no} kesildi`
      );
    },
    [companies, invoices.length, pushActivity]
  );

  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const next = { ...inv, ...data };
        if (data.amount != null || data.vat_rate != null) {
          next.total = calcTotal(next.amount, next.vat_rate);
        }
        return next;
      })
    );
  }, []);

  const updateInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
      );
      if (status === "odendi") {
        const inv = invoices.find((i) => i.id === id);
        const company = companies.find((c) => c.id === inv?.company_id);
        if (inv && company) {
          pushActivity(
            "payment",
            `${company.name} faturası ödendi — ₺${inv.total.toLocaleString("tr-TR")}`
          );
        }
      }
    },
    [companies, invoices, pushActivity]
  );

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addProject = useCallback(
    (data: Omit<Project, "id" | "created_at">) => {
      const project: Project = {
        ...data,
        id: uid("p"),
        created_at: new Date().toISOString(),
      };
      setProjects((prev) => [project, ...prev]);
      pushActivity("project", `${project.title} projesi oluşturuldu`);
    },
    [pushActivity]
  );

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }, []);

  const updateProjectStatus = useCallback(
    (id: string, status: ProjectStatus) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.project_id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const addTask = useCallback((projectId: string, title: string) => {
    setTasks((prev) => [
      ...prev,
      { id: uid("t"), project_id: projectId, title, done: false },
    ]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addProposal = useCallback(
    (data: Omit<Proposal, "id" | "created_at">) => {
      const proposal: Proposal = {
        ...data,
        id: uid("pr"),
        created_at: new Date().toISOString(),
      };
      setProposals((prev) => [proposal, ...prev]);
      pushActivity("proposal", `${proposal.company_name} teklifi gönderildi`);
    },
    [pushActivity]
  );

  const updateProposal = useCallback(
    (id: string, data: Partial<Proposal>) => {
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
    },
    []
  );

  const deleteProposal = useCallback((id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addExpense = useCallback((data: Omit<Expense, "id">) => {
    setExpenses((prev) => [{ ...data, id: uid("e") }, ...prev]);
  }, []);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addNote = useCallback((companyId: string, note: string) => {
    setNotes((prev) => [
      {
        id: uid("n"),
        company_id: companyId,
        note,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addDocument = useCallback(
    (data: Omit<CompanyDocument, "id" | "created_at">) => {
      setDocuments((prev) => [
        {
          ...data,
          id: uid("d"),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    []
  );

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addContent = useCallback(
    (data: Omit<ContentItem, "id" | "created_at">) => {
      setContentItems((prev) => [
        {
          ...data,
          id: uid("ci"),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    []
  );

  const updateContent = useCallback(
    (id: string, data: Partial<ContentItem>) => {
      setContentItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    },
    []
  );

  const deleteContent = useCallback((id: string) => {
    setContentItems((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateProfile = useCallback((data: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p, i) => (i === 0 ? { ...p, ...data } : p))
    );
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      user,
      profiles,
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
      getCompanyInvoices: (id) =>
        invoices.filter((i) => i.company_id === id),
      getCompanyNotes: (id) => notes.filter((n) => n.company_id === id),
      getCompanyDocs: (id) => documents.filter((d) => d.company_id === id),
      getProjectTasks: (id) => tasks.filter((t) => t.project_id === id),
    }),
    [
      user,
      profiles,
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

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
