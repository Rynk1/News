-- NewsIntel initial schema
-- Run against a Supabase project (SQL editor or `supabase db push`).
-- All tables are protected by row-level security so users only ever see
-- their own rows. `auth.users` is managed by Supabase Auth.

-- ---------------------------------------------------------------------------
-- Helper: keep an `updated_at` column current on every UPDATE.
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
-- profiles: one row per auth user, holding profile + subscription state.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'starter', 'professional', 'enterprise')),
  subscription_status text not null default 'trial'
    check (subscription_status in ('active', 'inactive', 'trial', 'expired')),
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, trial_ends_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    now() + interval '14 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- agents: user-configured monitoring agents.
-- ---------------------------------------------------------------------------
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  sources text[] not null default '{}',
  topics text[] not null default '{}',
  entities text[] not null default '{}',
  frequency text not null default 'daily'
    check (frequency in ('hourly', 'daily', 'weekly')),
  status text not null default 'idle'
    check (status in ('active', 'idle', 'error')),
  articles_collected integer not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_user_id_idx on public.agents (user_id);
alter table public.agents enable row level security;

drop policy if exists "Agents are managed by owner" on public.agents;
create policy "Agents are managed by owner"
  on public.agents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- articles: news items collected by agents (written by the ingestion
-- pipeline in a later phase).
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  title text not null,
  source text not null default '',
  url text,
  summary text not null default '',
  key_points text[] not null default '{}',
  implications text not null default '',
  category text not null default '',
  sentiment text not null default 'neutral'
    check (sentiment in ('positive', 'negative', 'neutral')),
  image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists articles_user_id_idx on public.articles (user_id);
create index if not exists articles_agent_id_idx on public.articles (agent_id);
alter table public.articles enable row level security;

drop policy if exists "Articles are managed by owner" on public.articles;
create policy "Articles are managed by owner"
  on public.articles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- saved_articles: which articles a user has bookmarked.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_articles (
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.saved_articles enable row level security;

drop policy if exists "Saved articles are managed by owner" on public.saved_articles;
create policy "Saved articles are managed by owner"
  on public.saved_articles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- annotations: user notes attached to articles.
-- ---------------------------------------------------------------------------
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists annotations_article_idx on public.annotations (article_id);
alter table public.annotations enable row level security;

drop policy if exists "Annotations are managed by owner" on public.annotations;
create policy "Annotations are managed by owner"
  on public.annotations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- usage_events: append-only usage log for limits + analytics.
-- ---------------------------------------------------------------------------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_idx on public.usage_events (user_id, created_at);
alter table public.usage_events enable row level security;

drop policy if exists "Usage events are managed by owner" on public.usage_events;
create policy "Usage events are managed by owner"
  on public.usage_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
