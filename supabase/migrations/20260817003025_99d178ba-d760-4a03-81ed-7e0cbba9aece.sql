
-- roles
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "users can read own roles" on public.user_roles
for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;

-- account activation status
create table public.user_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.user_status to authenticated;
grant all on public.user_status to service_role;
alter table public.user_status enable row level security;

create policy "users can read own status" on public.user_status
for select to authenticated using (auth.uid() = user_id);

-- existing accounts stay active
insert into public.user_status (user_id, is_active)
select id, true from auth.users
on conflict (user_id) do nothing;

-- seed admin
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users where email = 'hamagoldm@gmail.com'
on conflict do nothing;

-- enforce activation on data access
create or replace function public.is_active_user(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_active from public.user_status where user_id = _user_id), false)
$$;
revoke all on function public.is_active_user(uuid) from public, anon, authenticated;
grant execute on function public.is_active_user(uuid) to service_role;
