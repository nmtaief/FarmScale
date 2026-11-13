-- ==============================================================================
-- FarmScale: Supabase PostgreSQL Schema with Row Level Security (RLS)
-- Pilot Zone: Rajshahi Division (8 Districts, 67 Upazilas)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. User Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  language_preference text default 'bn' check (language_preference in ('bn', 'en')),
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. User Farms (My Farm) Table
create table if not exists public.user_farms (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  district_en text not null,
  district_bn text not null,
  upazila_en text not null,
  upazila_bn text not null,
  lat double precision not null,
  lon double precision not null,
  land_size double precision default 1.0 not null,
  land_unit text default 'bigha' check (land_unit in ('bigha', 'decimal', 'acre')),
  soil_type text default 'clay_loam',
  irrigation_access text default 'deep_tubewell',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Saved Crop Rotation Plans Table
create table if not exists public.saved_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  farm_id uuid references public.user_farms on delete set null,
  rotation_key text not null, -- 'profit' | 'shift' | 'easy'
  crops text[] not null,
  start_season text default 'rabi', -- 'rabi' | 'kharif_1' | 'kharif_2'
  start_date date,
  custom_cost_adjustments jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Recommendation History Table
create table if not exists public.recommendation_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  district_en text not null,
  upazila_en text not null,
  lat double precision not null,
  lon double precision not null,
  options jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Daily Weather Cache Table (Populated by early morning cron job)
create table if not exists public.weather_cache (
  upazila_id text primary key,
  district_en text not null,
  upazila_en text not null,
  upazila_bn text not null,
  lat double precision not null,
  lon double precision not null,
  forecast_7days jsonb not null,
  temp_min double precision,
  temp_max double precision,
  rain_sum double precision,
  rain_probability integer,
  humidity_avg integer,
  wind_max double precision,
  alerts_bn text[],
  alerts_en text[],
  last_updated timestamptz default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_user_farms_user on public.user_farms(user_id);
create index if not exists idx_saved_plans_user on public.saved_plans(user_id);
create index if not exists idx_weather_cache_district on public.weather_cache(district_en);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.user_farms enable row level security;
alter table public.saved_plans enable row level security;
alter table public.recommendation_history enable row level security;
alter table public.weather_cache enable row level security;

-- Profiles: Users can only read and update their own record
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- User Farms: Users can only read, insert, update, delete their own farm records
create policy "Users can view own farms"
  on public.user_farms for select
  using (auth.uid() = user_id);

create policy "Users can insert own farms"
  on public.user_farms for insert
  with check (auth.uid() = user_id);

create policy "Users can update own farms"
  on public.user_farms for update
  using (auth.uid() = user_id);

create policy "Users can delete own farms"
  on public.user_farms for delete
  using (auth.uid() = user_id);

-- Saved Plans: Users can only read, insert, update their own plans
create policy "Users can view own saved plans"
  on public.saved_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved plans"
  on public.saved_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved plans"
  on public.saved_plans for update
  using (auth.uid() = user_id);

-- Recommendation History: Users can only view their own history
create policy "Users can view own recommendation history"
  on public.recommendation_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own recommendation history"
  on public.recommendation_history for insert
  with check (auth.uid() = user_id);

-- Weather Cache: Public read-only access for all farmers (guests and signed-in)
create policy "Anyone can read weather cache"
  on public.weather_cache for select
  using (true);

-- Weather Cache: Only service role / authenticated cron jobs can write
create policy "Service role can modify weather cache"
  on public.weather_cache for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated');
