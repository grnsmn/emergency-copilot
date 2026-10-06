-- Emergency Copilot — initial schema (MVP foundation)
-- Tables: profiles (= app users), patient_profiles, documents, extractions,
-- summaries, audit_events. Storage + review state only: no clinical logic.
--
-- Write model:
--   * client (authenticated, RLS)  → profiles, patient_profiles, documents,
--                                    review of extractions, own audit events
--   * Edge Functions (service role) → OCR text, extractions, summaries
-- Users can review AI output but never fabricate it from the client.

-- ---------------------------------------------------------------------------
-- Shared: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: app user, 1:1 extension of auth.users ("users" in the spec;
-- auth.users itself is managed by Supabase Auth).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  preferred_locale text not null default 'it' check (preferred_locale in ('it', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile + patient profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.patient_profiles (user_id) values (new.id);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- patient_profiles: the person the Emergency Card is about.
-- MVP: exactly one per user (the user themselves). Kept separate from
-- profiles so account settings and patient data don't mix.
-- ---------------------------------------------------------------------------
create table public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger patient_profiles_set_updated_at
  before update on public.patient_profiles
  for each row execute function public.set_updated_at();

alter table public.patient_profiles enable row level security;

create policy "patient_profiles_select_own" on public.patient_profiles
  for select using (auth.uid() = user_id);

create policy "patient_profiles_update_own" on public.patient_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- documents: uploaded health documents (files live in Storage)
-- ---------------------------------------------------------------------------
create type public.document_status as enum (
  'uploaded',
  'processing',
  'processed',
  'failed'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text,
  status public.document_status not null default 'uploaded',
  ocr_text text,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index documents_user_id_idx on public.documents (user_id);

alter table public.documents enable row level security;

create policy "documents_select_own" on public.documents
  for select using (auth.uid() = user_id);

create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id and status = 'uploaded' and ocr_text is null);

create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = user_id);
-- No client UPDATE: status / ocr_text are written by Edge Functions only.

-- ---------------------------------------------------------------------------
-- extractions: structured facts extracted from a document, pending review.
-- One row per fact, always traceable to its source document (+ page).
-- ---------------------------------------------------------------------------
create type public.review_status as enum (
  'pending_review',
  'confirmed',
  'rejected'
);

create table public.extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,          -- e.g. allergy, medication, condition, procedure
  label text not null,             -- e.g. "Penicillin"
  value text,                      -- optional detail, e.g. dosage or date
  source_page integer,
  source_excerpt text,             -- verbatim snippet the fact came from
  review_status public.review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index extractions_user_id_idx on public.extractions (user_id);
create index extractions_document_id_idx on public.extractions (document_id);

alter table public.extractions enable row level security;

create policy "extractions_select_own" on public.extractions
  for select using (auth.uid() = user_id);

-- Clients may only change review fields; enforced by column grants below.
create policy "extractions_update_own" on public.extractions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.extractions from authenticated;
grant update (review_status, reviewed_at) on public.extractions to authenticated;

-- ---------------------------------------------------------------------------
-- summaries: short, non-prescriptive summaries generated from confirmed
-- extractions, with citations. Never diagnostic or therapeutic.
-- ---------------------------------------------------------------------------
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  locale text not null check (locale in ('it', 'en')),
  content text not null,
  source_extraction_ids uuid[] not null default '{}',
  provider text not null,          -- which AI adapter produced it
  created_at timestamptz not null default now()
);

create index summaries_user_id_idx on public.summaries (user_id);

alter table public.summaries enable row level security;

create policy "summaries_select_own" on public.summaries
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- audit_events: append-only log of sensitive actions (upload, review,
-- delete, processing). No updates or deletes, from anyone via the API.
-- ---------------------------------------------------------------------------
create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,        -- e.g. document.uploaded, extraction.confirmed
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_events_user_id_idx on public.audit_events (user_id, created_at desc);

alter table public.audit_events enable row level security;

create policy "audit_events_select_own" on public.audit_events
  for select using (auth.uid() = user_id);

create policy "audit_events_insert_own" on public.audit_events
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for uploaded documents.
-- Path convention: `<user_id>/<document_id>.<ext>`. RLS scopes access by the
-- first path segment.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520, -- 20 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do nothing;

create policy "documents_bucket_select_own" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_bucket_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_bucket_delete_own" on storage.objects
  for delete using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
