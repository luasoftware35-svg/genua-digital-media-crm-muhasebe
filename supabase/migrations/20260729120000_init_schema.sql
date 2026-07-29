-- Genua Digital Agency Panel Schema
-- profiles, companies, invoices, projects, tasks, proposals, expenses, activities, company_notes

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Companies (CRM)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  city text,
  contact_name text,
  phone text,
  email text,
  status text not null default 'aktif' check (status in ('aktif', 'pasif', 'potansiyel', 'gorusmede')),
  monthly_fee numeric not null default 0,
  services text[] not null default '{}',
  contract_start date,
  logo_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  invoice_no text,
  amount numeric not null,
  vat_rate numeric not null default 20,
  total numeric not null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'bekliyor' check (status in ('odendi', 'bekliyor', 'gecikti', 'iptal')),
  is_recurring boolean not null default false,
  recurring_day integer,
  description text,
  created_at timestamptz not null default now()
);

-- Projects (agency work)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies on delete set null,
  title text not null,
  type text,
  status text not null default 'teklif' check (status in ('teklif', 'devam', 'revizyon', 'teslim', 'tamamlandi')),
  deadline date,
  budget numeric,
  assigned_to uuid references public.profiles on delete set null,
  description text,
  time_spent text,
  created_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Proposals / Pipeline
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  source text check (source in ('DOSB', 'BOSB', 'EKAP', 'Referans', 'Instagram', 'Diger')),
  sent_date date,
  amount numeric,
  status text not null default 'gonderildi' check (status in ('gonderildi', 'cevap', 'gorusme', 'kazanildi', 'kaybedildi')),
  notes text,
  tender_deadline date,
  deposit_note text,
  created_at timestamptz not null default now()
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  amount numeric not null,
  date date not null default current_date,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

-- Activity feed
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- Company notes
create table if not exists public.company_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- Company documents metadata
create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  name text not null,
  file_path text not null,
  file_type text,
  created_at timestamptz not null default now()
);

-- Settings (service types, etc.)
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_invoices_company on public.invoices(company_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_due on public.invoices(due_date);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_company on public.projects(company_id);
create index if not exists idx_companies_status on public.companies(status);
create index if not exists idx_activities_created on public.activities(created_at desc);
create index if not exists idx_expenses_date on public.expenses(date);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-mark overdue invoices
create or replace function public.mark_overdue_invoices()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.invoices
  set status = 'gecikti'
  where status = 'bekliyor'
    and due_date is not null
    and due_date < current_date;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.invoices enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.proposals enable row level security;
alter table public.expenses enable row level security;
alter table public.activities enable row level security;
alter table public.company_notes enable row level security;
alter table public.company_documents enable row level security;
alter table public.app_settings enable row level security;

-- Authenticated full access policies (internal agency panel)
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'companies', 'invoices', 'projects', 'tasks',
    'proposals', 'expenses', 'activities', 'company_notes',
    'company_documents', 'app_settings'
  ]
  loop
    execute format('drop policy if exists "authenticated_all" on public.%I', t);
    execute format(
      'create policy "authenticated_all" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$$;

-- Storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated read documents" on storage.objects;
drop policy if exists "Authenticated upload documents" on storage.objects;
drop policy if exists "Authenticated update documents" on storage.objects;
drop policy if exists "Authenticated delete documents" on storage.objects;

create policy "Authenticated read documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "Authenticated upload documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');

create policy "Authenticated update documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');

create policy "Authenticated delete documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents');

-- Default settings
insert into public.app_settings (key, value)
values
  ('service_types', '["Meta Ads", "SMM", "Web Tasarım", "SEO", "Reklam Yönetimi", "SaaS", "Kimlik Tasarımı"]'::jsonb),
  ('vat_rate', '20'::jsonb),
  ('currency', '"TRY"'::jsonb)
on conflict (key) do nothing;
