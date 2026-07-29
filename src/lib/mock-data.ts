import type {
  Activity,
  Company,
  CompanyDocument,
  CompanyNote,
  ContentItem,
  Expense,
  Invoice,
  Profile,
  Project,
  Proposal,
  Task,
} from "./types";

export const currentUser: Profile = {
  id: "user-1",
  full_name: "Umut Can Avcı",
  role: "admin",
  email: "umut@genuadigital.com",
};

export const profiles: Profile[] = [currentUser];

export const companies: Company[] = [];
export const invoices: Invoice[] = [];
export const projects: Project[] = [];
export const tasks: Task[] = [];
export const proposals: Proposal[] = [];
export const expenses: Expense[] = [];
export const activities: Activity[] = [];
export const companyNotes: CompanyNote[] = [];
export const companyDocuments: CompanyDocument[] = [];
export const contentItems: ContentItem[] = [];
