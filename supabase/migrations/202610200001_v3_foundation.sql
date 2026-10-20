-- Instituto VibraSer 3.0
-- Migration: initial learning platform schema
-- Apply only to the dedicated V3 Supabase project after reviewing this file.
-- This migration has not been executed against a live database.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'instructor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default '',
  short_description text not null default '',
  description text not null default '',
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, sort_order)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  summary text not null default '',
  content text not null default '',
  video_url text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, sort_order)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  status text not null default 'active' check (status in ('pending', 'active', 'suspended', 'completed', 'cancelled')),
  enrolled_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  last_viewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index course_modules_course_sort_idx on public.course_modules(course_id, sort_order);
create index lessons_module_sort_idx on public.lessons(module_id, sort_order);
create index enrollments_student_status_idx on public.enrollments(student_id, status);
create index lesson_progress_student_idx on public.lesson_progress(student_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger course_modules_set_updated_at before update on public.course_modules
for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Trigger functions are invoked by their triggers, not directly by app clients.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::public.app_role
      and p.is_active = true
  );
$$;

revoke all on function public.is_admin() from public;


alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- Profiles: users can read their own profile; only admins can read all profiles.
create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

-- New profiles are created by the auth trigger. Students can update their own
-- name, but cannot use this policy to promote themselves or reactivate access.
create policy "profiles_update_own_student"
on public.profiles for update to authenticated
using (id = (select auth.uid()) and role = 'student'::public.app_role and is_active = true)
with check (id = (select auth.uid()) and role = 'student'::public.app_role and is_active = true);

create policy "profiles_admin_all"
on public.profiles for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Public visitors can read published course catalogue entries only.
create policy "courses_read_published"
on public.courses for select to anon, authenticated
using (status = 'published' or (select public.is_admin()));

create policy "courses_admin_manage"
on public.courses for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "modules_read_published_course"
on public.course_modules for select to anon, authenticated
using (
  (status = 'published' and exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'published'
  ))
  or (select public.is_admin())
  or (
    (select auth.uid()) is not null
    and exists (
      select 1 from public.enrollments e
      where e.student_id = (select auth.uid())
        and e.course_id = course_modules.course_id
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
  )
);

create policy "modules_admin_manage"
on public.course_modules for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "lessons_read_published_or_enrolled"
on public.lessons for select to anon, authenticated
using (
  (status = 'published' and exists (
    select 1
    from public.course_modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id and m.status = 'published' and c.status = 'published'
  ))
  or (select public.is_admin())
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.course_modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = module_id
        and e.student_id = (select auth.uid())
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
  )
);

create policy "lessons_admin_manage"
on public.lessons for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "enrollments_read_own_or_admin"
on public.enrollments for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "enrollments_admin_manage"
on public.enrollments for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "progress_read_own_or_admin"
on public.lesson_progress for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "progress_insert_own_enrolled"
on public.lesson_progress for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where l.id = lesson_id
      and e.student_id = (select auth.uid())
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
);

create policy "progress_update_own_enrolled"
on public.lesson_progress for update to authenticated
using (student_id = (select auth.uid()))
with check (
  student_id = (select auth.uid())
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where l.id = lesson_id
      and e.student_id = (select auth.uid())
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
);

create policy "progress_admin_manage"
on public.lesson_progress for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Remove default broad privileges and grant only operations required by the app.
revoke all on public.profiles, public.courses, public.course_modules, public.lessons,
  public.enrollments, public.lesson_progress from anon, authenticated;

grant select on public.courses, public.course_modules, public.lessons to anon;
grant select on public.profiles, public.courses, public.course_modules, public.lessons,
  public.enrollments, public.lesson_progress to authenticated;
-- RLS prevents students from changing role or is_active; admins may manage profiles.
grant update on public.profiles to authenticated;
grant insert, update, delete on public.courses, public.course_modules, public.lessons to authenticated;
grant insert, update, delete on public.enrollments to authenticated;
grant insert, update on public.lesson_progress to authenticated;

grant usage on schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
