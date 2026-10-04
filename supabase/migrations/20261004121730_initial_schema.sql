-- Initial schema. RLS is intentionally NOT enabled here; it is added in the next migration.

-- Keeps updated_at current on every UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table public.supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  brand text,
  color_code text,
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  quantity numeric not null default 0 check (quantity >= 0),
  unit text,
  notes text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed')),
  cover_path text,
  pattern_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  supply_id uuid references public.supplies (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  brand text,
  color_code text,
  quantity_needed numeric not null default 1 check (quantity_needed > 0),
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes on every foreign key (primary keys are already indexed).
create index supplies_user_id_category_id_idx on public.supplies (user_id, category_id);
create index supplies_category_id_idx on public.supplies (category_id);
create index projects_user_id_idx on public.projects (user_id);
create index project_items_project_id_idx on public.project_items (project_id);
create index project_items_supply_id_idx on public.project_items (supply_id);
create index project_items_category_id_idx on public.project_items (category_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger supplies_set_updated_at
  before update on public.supplies
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger project_items_set_updated_at
  before update on public.project_items
  for each row execute function public.set_updated_at();

-- Creates the profile and default 'user' role for every new auth user.
-- security definer is required because the signing-up user has no rights on these tables yet.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
