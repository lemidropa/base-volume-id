-- Enable extensions commonly available on Supabase
create extension if not exists pgcrypto;

-- profiles: one row per Supabase auth.user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  referral_code text unique default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: users can manage their own profile
create policy if not exists "profiles_select_self_or_public"
  on public.profiles for select
  using (true);

create policy if not exists "profiles_upsert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy if not exists "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid());

-- wallets: many wallets per user
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address text not null unique,
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

create index if not exists wallets_user_id_idx on public.wallets(user_id);
create index if not exists wallets_address_lower_idx on public.wallets((lower(address)));

-- RLS: users can see their own wallets and insert/delete their own
create policy if not exists "wallets_select_own"
  on public.wallets for select
  using (user_id = auth.uid());

create policy if not exists "wallets_insert_own"
  on public.wallets for insert
  with check (user_id = auth.uid());

create policy if not exists "wallets_delete_own"
  on public.wallets for delete
  using (user_id = auth.uid());

-- auth_nonces: short-lived nonces for SIWE
create table if not exists public.auth_nonces (
  nonce text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null
);

alter table public.auth_nonces enable row level security;

create policy if not exists "nonces_select_own"
  on public.auth_nonces for select
  using (user_id = auth.uid());

create policy if not exists "nonces_insert_own"
  on public.auth_nonces for insert
  with check (user_id = auth.uid());

create policy if not exists "nonces_delete_own"
  on public.auth_nonces for delete
  using (user_id = auth.uid());

-- referrals: inviter -> invitee
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  code text,
  created_at timestamptz not null default now(),
  unique(inviter_id, invitee_id)
);

alter table public.referrals enable row level security;

create policy if not exists "referrals_view_own"
  on public.referrals for select
  using (inviter_id = auth.uid() or invitee_id = auth.uid());

create policy if not exists "referrals_insert_invitee"
  on public.referrals for insert
  with check (invitee_id = auth.uid());

-- volume_aggregates: cached total USD volume per user
create table if not exists public.volume_aggregates (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_usd numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.volume_aggregates enable row level security;

create policy if not exists "volume_select_all"
  on public.volume_aggregates for select using (true);

create policy if not exists "volume_update_self"
  on public.volume_aggregates for insert with check (user_id = auth.uid());

create policy if not exists "volume_modify_self"
  on public.volume_aggregates for update using (user_id = auth.uid());

-- Helper: lower-case addresses before insert via constraint trigger
create or replace function public.normalize_address()
returns trigger language plpgsql as $$
begin
  new.address := lower(new.address);
  return new;
end; $$;

create trigger wallets_normalize_address
  before insert on public.wallets
  for each row execute function public.normalize_address();

-- Awards for referral tiers
create table if not exists public.onboarder_awards (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null, -- e.g., 'bronze','silver','gold'
  tx_hash text,
  status text not null default 'recorded', -- 'recorded'|'minted'|'failed'
  created_at timestamptz not null default now(),
  unique(inviter_id, tier)
);

alter table public.onboarder_awards enable row level security;

create policy if not exists "awards_select_public"
  on public.onboarder_awards for select using (true);

create policy if not exists "awards_modify_admin_only"
  on public.onboarder_awards for all using (false) with check (false);
