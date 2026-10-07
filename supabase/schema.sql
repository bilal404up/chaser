-- Chaser demo schema. Safe to run more than once.
-- All rows are sample data. The public (anon) key can do nothing here; signed-in users reach only their own rows.

create table if not exists public.ch_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Freelancer' check (char_length(display_name) between 1 and 60),
  is_admin boolean not null default false,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ch_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 120),
  amount_cents integer not null check (amount_cents between 1 and 100000000),
  issued_on date not null,
  due_on date not null,
  status text not null default 'open' check (status in ('open', 'paid')),
  paid_on date,
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  check (due_on >= issued_on),
  check (status = 'paid' or paid_on is null)
);
create index if not exists ch_invoices_user_status_due on public.ch_invoices (user_id, status, due_on);

create table if not exists public.ch_stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.ch_profiles enable row level security;
alter table public.ch_invoices enable row level security;
alter table public.ch_stripe_events enable row level security;

-- Privileges: start from nothing, then grant only what the app needs.
revoke all on public.ch_profiles, public.ch_invoices, public.ch_stripe_events from anon, authenticated;
grant select on public.ch_profiles to authenticated;
grant update (display_name) on public.ch_profiles to authenticated;   -- plan and Stripe columns are never writable by a user
-- A table-level revoke does not remove column privileges, so take the sensitive ones away explicitly.
revoke update (id, is_admin, plan, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, created_at) on public.ch_profiles from anon, authenticated;
grant select, insert, update, delete on public.ch_invoices to authenticated;

drop policy if exists "profile: read own" on public.ch_profiles;
create policy "profile: read own" on public.ch_profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile: update own" on public.ch_profiles;
create policy "profile: update own" on public.ch_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "invoices: read own" on public.ch_invoices;
create policy "invoices: read own" on public.ch_invoices for select to authenticated using (user_id = auth.uid());
drop policy if exists "invoices: insert own" on public.ch_invoices;
create policy "invoices: insert own" on public.ch_invoices for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "invoices: update own" on public.ch_invoices;
create policy "invoices: update own" on public.ch_invoices for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "invoices: delete own" on public.ch_invoices;
create policy "invoices: delete own" on public.ch_invoices for delete to authenticated using (user_id = auth.uid());
-- ch_stripe_events has RLS on and no policy: only the server (service role) can touch it.

-- The free plan allows 5 open invoices. The database enforces it, so no client can get around it.
create or replace function public.ch_enforce_free_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  user_plan text;
  open_count integer;
begin
  if new.status = 'open' and (tg_op = 'INSERT' or old.status <> 'open') then
    select plan into user_plan from public.ch_profiles where id = new.user_id;
    if coalesce(user_plan, 'free') = 'free' then
      select count(*) into open_count from public.ch_invoices where user_id = new.user_id and status = 'open' and id <> new.id;
      if open_count >= 5 then
        raise exception 'free_plan_limit' using errcode = 'P0001', hint = 'The free plan allows 5 open invoices.';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists ch_free_limit on public.ch_invoices;
create trigger ch_free_limit before insert or update on public.ch_invoices
  for each row execute function public.ch_enforce_free_limit();
