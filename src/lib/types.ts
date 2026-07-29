export type UserRole = "admin" | "editor" | "viewer";

export type CompanyStatus = "aktif" | "pasif" | "potansiyel" | "gorusmede";

export type InvoiceStatus = "odendi" | "bekliyor" | "gecikti" | "iptal";

export type ProjectStatus =
  | "teklif"
  | "devam"
  | "revizyon"
  | "teslim"
  | "tamamlandi";

export type ProposalStatus =
  | "gonderildi"
  | "cevap"
  | "gorusme"
  | "kazanildi"
  | "kaybedildi";

export type ProposalSource =
  | "DOSB"
  | "BOSB"
  | "EKAP"
  | "Referans"
  | "Instagram"
  | "Diger";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  email: string;
  panel_settings?: {
    vat_rate?: string;
    currency?: string;
    service_types?: string[];
  };
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  city: string;
  contact_name: string;
  phone: string;
  email: string;
  status: CompanyStatus;
  monthly_fee: number;
  services: string[];
  contract_start?: string;
  logo_url?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_no: string;
  amount: number;
  vat_rate: number;
  total: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  is_recurring: boolean;
  description?: string;
  created_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  title: string;
  type: string;
  status: ProjectStatus;
  deadline?: string;
  budget?: number;
  assigned_to?: string;
  description?: string;
  time_spent?: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  done: boolean;
}

export interface Proposal {
  id: string;
  company_name: string;
  company_id?: string;
  source: ProposalSource;
  sent_date: string;
  amount: number;
  status: ProposalStatus;
  notes?: string;
  tender_deadline?: string;
  deposit_note?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  title: string;
  amount: number;
  date: string;
  is_recurring: boolean;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

export interface CompanyNote {
  id: string;
  company_id: string;
  note: string;
  created_at: string;
}

export interface CompanyDocument {
  id: string;
  company_id: string;
  name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface ContentItem {
  id: string;
  company_id: string;
  title: string;
  date: string;
  platform: string;
  notes?: string;
  created_at: string;
}

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  aktif: "Aktif",
  pasif: "Pasif",
  potansiyel: "Potansiyel",
  gorusmede: "Görüşmede",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  odendi: "Ödendi",
  bekliyor: "Bekliyor",
  gecikti: "Gecikti",
  iptal: "İptal",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  teklif: "Teklif",
  devam: "Devam Ediyor",
  revizyon: "Revizyon",
  teslim: "Teslim",
  tamamlandi: "Tamamlandı",
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  gonderildi: "Gönderildi",
  cevap: "Cevap Geldi",
  gorusme: "Görüşme",
  kazanildi: "Kazanıldı",
  kaybedildi: "Kaybedildi",
};

export const SERVICE_TYPES = [
  "Meta Ads",
  "SMM",
  "Web Tasarım",
  "SEO",
  "Reklam Yönetimi",
  "SaaS",
  "Kimlik Tasarımı",
];

export const EXPENSE_CATEGORIES = [
  "Yazılım",
  "Ofis",
  "Reklam",
  "Freelancer",
  "Vergi",
  "Diğer",
];

export const CONTENT_PLATFORMS = [
  "Instagram",
  "TikTok",
  "LinkedIn",
  "YouTube",
  "Facebook",
  "Diğer",
];

export const COMPANY_COLORS = [
  "#DBFF2B",
  "#FFB02B",
  "#4DA6FF",
  "#FF6B9D",
  "#A78BFA",
  "#34D399",
  "#F97316",
  "#22D3EE",
];
