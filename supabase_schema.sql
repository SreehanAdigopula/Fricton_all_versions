create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    email text,
    theme text default 'classic',
    paper_tint text default '#fdfbf7',
    background_shape text default 'doodles',
    pet_appearance text default 'dragon',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_app_stats (
    user_id uuid primary key references auth.users(id) on delete cascade,
    session_duration integer not null default 30,
    completed_count integer not null default 0,
    failed_count integer not null default 0,
    distraction_count integer not null default 0,
    break_count integer not null default 0,
    weekly_completed integer not null default 0,
    weekly_distraction_total integer not null default 0,
    weekly_session_count integer not null default 0,
    success_streak integer not null default 0,
    fail_streak integer not null default 0,
    pet_level integer not null default 1,
    next_pet_reward_threshold integer not null default 5,
    app_state jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    result text not null check (result in ('completed', 'failed')),
    duration_minutes integer not null,
    distractions integer not null default 0,
    breaks integer not null default 0,
    started_at timestamptz,
    ended_at timestamptz not null default now(),
    session_state jsonb not null default '{}'::jsonb
);

alter table public.user_profiles enable row level security;
alter table public.user_app_stats enable row level security;
alter table public.focus_sessions enable row level security;

create policy "Users can read their own profile"
on public.user_profiles for select
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.user_profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.user_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own stats"
on public.user_app_stats for select
using (auth.uid() = user_id);

create policy "Users can insert their own stats"
on public.user_app_stats for insert
with check (auth.uid() = user_id);

create policy "Users can update their own stats"
on public.user_app_stats for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own sessions"
on public.focus_sessions for select
using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
on public.focus_sessions for insert
with check (auth.uid() = user_id);
