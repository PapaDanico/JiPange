-- JiPange MVP schema: profiles, plans, share_events, ai_calls
-- Row Level Security is enabled on every table; users may only
-- read/write rows that belong to them.

create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  age integer,
  county text,
  gross_monthly_salary numeric,
  dependants integer default 0,
  chama_member boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  version integer default 1,
  net_monthly numeric,
  savings_capacity numeric,
  savings_rate numeric,
  projected_wealth_60 numeric,
  ai_recommendations jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.share_events (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.plans(id) not null,
  channel text check (channel in ('whatsapp', 'email', 'copy')),
  created_at timestamptz default now()
);

-- Cost/monitoring log for every Claude API call made by generate-plan.
create table if not exists public.ai_calls (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  plan_id uuid references public.plans(id),
  input_tokens integer,
  output_tokens integer,
  cost_estimate_usd numeric,
  success boolean not null,
  error_message text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.share_events enable row level security;
alter table public.ai_calls enable row level security;

create policy "Users manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage their own plans"
  on public.plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own share events"
  on public.share_events for all
  using (
    exists (
      select 1 from public.plans
      where public.plans.id = share_events.plan_id
        and public.plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plans
      where public.plans.id = share_events.plan_id
        and public.plans.user_id = auth.uid()
    )
  );

create policy "Users read their own ai_calls"
  on public.ai_calls for select
  using (auth.uid() = user_id);

create policy "Users insert their own ai_calls"
  on public.ai_calls for insert
  with check (auth.uid() = user_id);
