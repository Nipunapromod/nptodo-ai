-- NPtodo AI initial schema. Safe to apply to a new Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Colombo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  category text not null default 'Personal',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_at);
create index if not exists tasks_user_created_idx on public.tasks (user_id, created_at desc);

create table if not exists public.recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  category text not null default 'Personal',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  recurrence_rule jsonb not null,
  timezone text not null default 'Asia/Colombo',
  local_time text not null default '07:00' check (local_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  next_run_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recurring_schedules_due_idx on public.recurring_schedules (next_run_at) where active = true;

create table if not exists public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid references public.recurring_schedules(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  occurrence_key text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, occurrence_key)
);
create index if not exists reminder_deliveries_pending_idx on public.reminder_deliveries (scheduled_for) where status in ('pending', 'failed');

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  code text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  topic text not null default '',
  status text not null default 'not_started' check (status in ('not_started', 'learning', 'practising', 'revised', 'mastered')),
  sort_order integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  studied_on date not null default current_date,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  assessment_name text not null check (char_length(trim(assessment_name)) between 1 and 180),
  score numeric(7,2) not null check (score >= 0),
  max_score numeric(7,2) not null check (max_score > 0 and score <= max_score),
  assessed_on date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.seed_default_subjects()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subjects (user_id, name, code, sort_order)
  values
    (new.id, 'Combined Mathematics', 'combined-mathematics', 1),
    (new.id, 'Physics', 'physics', 2),
    (new.id, 'Chemistry', 'chemistry', 3)
  on conflict (user_id, code) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_subjects_after_profile on public.profiles;
create trigger seed_subjects_after_profile
after insert on public.profiles
for each row execute procedure public.seed_default_subjects();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.reminder_deliveries enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.subjects enable row level security;
alter table public.lessons enable row level security;
alter table public.study_records enable row level security;
alter table public.marks enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists tasks_all_own on public.tasks;
create policy tasks_all_own on public.tasks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists recurring_schedules_all_own on public.recurring_schedules;
create policy recurring_schedules_all_own on public.recurring_schedules for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists reminder_deliveries_select_own on public.reminder_deliveries;
create policy reminder_deliveries_select_own on public.reminder_deliveries for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists push_subscriptions_all_own on public.push_subscriptions;
create policy push_subscriptions_all_own on public.push_subscriptions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists subjects_all_own on public.subjects;
create policy subjects_all_own on public.subjects for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists lessons_all_own on public.lessons;
create policy lessons_all_own on public.lessons for all to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
);
drop policy if exists study_records_all_own on public.study_records;
create policy study_records_all_own on public.study_records for all to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
);
drop policy if exists marks_all_own on public.marks;
create policy marks_all_own on public.marks for all to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
);

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.recurring_schedules to authenticated;
grant select on public.reminder_deliveries to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.study_records to authenticated;
grant select, insert, update, delete on public.marks to authenticated;
