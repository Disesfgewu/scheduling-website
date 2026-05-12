-- ============================================================
-- Migration 001: Initial Schema
-- Project: TripSync
-- Schema: tripsync (獨立 schema，避免與其他專案衝突)
--
-- Run via:
--   supabase db push
--   或貼入 Supabase SQL Editor 執行
--
-- ⚠️  執行前請先在 Supabase Dashboard 做：
--     Settings → API → Extra Schema → 輸入 tripsync → Save
-- ============================================================

-- ── 1. 建立專屬 schema & 授權 ────────────────────────────────
create schema if not exists tripsync;

grant usage on schema tripsync to anon, authenticated, service_role;

alter default privileges for role postgres in schema tripsync
  grant all on tables    to anon, authenticated, service_role;
alter default privileges for role postgres in schema tripsync
  grant all on routines  to anon, authenticated, service_role;
alter default privileges for role postgres in schema tripsync
  grant all on sequences to anon, authenticated, service_role;

-- UUID extension（通常已存在，schema extensions 是 Supabase 預設位置）
create extension if not exists "uuid-ossp" schema extensions;


-- ── 2. 建立所有 table（先建完再加 policy，避免交叉參考錯誤）──

-- profiles
create table tripsync.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  name        text        not null,
  initials    text        not null,
  color       text        not null default '#6366f1',
  avatar_url  text,
  role        text        not null default 'user'
                check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- trips
create table tripsync.trips (
  id          uuid        primary key default extensions.uuid_generate_v4(),
  title       text        not null,
  description text,
  cover_image text,
  location    text,
  country     text,
  start_date  date        not null,
  end_date    date        not null,
  emoji       text        not null default '🗺️',
  owner_id    uuid        not null references tripsync.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- trip_members
create table tripsync.trip_members (
  id         uuid        primary key default extensions.uuid_generate_v4(),
  trip_id    uuid        not null references tripsync.trips(id)    on delete cascade,
  user_id    uuid        not null references tripsync.profiles(id) on delete cascade,
  role       text        not null default 'viewer'
               check (role in ('owner', 'editor', 'viewer')),
  joined_at  timestamptz not null default now(),
  unique (trip_id, user_id)
);

-- trip_events
create table tripsync.trip_events (
  id                   uuid        primary key default extensions.uuid_generate_v4(),
  trip_id              uuid        not null references tripsync.trips(id) on delete cascade,
  title                text        not null,
  date                 date        not null,
  time                 time        not null,
  end_time             time,
  category             text        not null default 'culture'
                         check (category in (
                           'food','transport','culture','shopping',
                           'nature','accommodation','entertainment'
                         )),
  notes                text,
  color                text        not null default '#6366f1',
  icon                 text        not null default '📍',
  phone                text,
  website              text,
  opening_hours        text,
  price_note           text,
  reservation_required boolean              default false,
  booking_url          text,
  duration_minutes     integer,
  location_name        text,
  location_address     text,
  lat                  double precision,
  lng                  double precision,
  from_candidate_id    uuid,  -- FK 補在 migration 002（candidate_places 尚未建立）
  created_by           uuid        references tripsync.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- candidate_places
create table tripsync.candidate_places (
  id                   uuid        primary key default extensions.uuid_generate_v4(),
  trip_id              uuid        not null references tripsync.trips(id) on delete cascade,
  name                 text        not null,
  address              text,
  phone                text,
  website              text,
  opening_hours        text,
  price_level          integer     check (price_level between 1 and 4),
  price_note           text,
  reservation_required boolean     default false,
  category             text        not null default 'culture'
                         check (category in (
                           'food','transport','culture','shopping',
                           'nature','accommodation','entertainment'
                         )),
  notes                text,
  location_name        text,
  location_address     text,
  lat                  double precision,
  lng                  double precision,
  scheduled_event_id   uuid        references tripsync.trip_events(id) on delete set null,
  added_by             uuid        references tripsync.profiles(id),
  added_at             timestamptz not null default now()
);


-- ── 3. 啟用 RLS（所有 table 建完後統一開啟）────────────────────
alter table tripsync.profiles        enable row level security;
alter table tripsync.trips           enable row level security;
alter table tripsync.trip_members    enable row level security;
alter table tripsync.trip_events     enable row level security;
alter table tripsync.candidate_places enable row level security;


-- ── 4. RLS Policies（table 都存在了，交叉參考不會出錯）──────────

-- profiles
create policy "profiles_select_all"
  on tripsync.profiles for select using (true);

create policy "profiles_insert_own"
  on tripsync.profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on tripsync.profiles for update using (auth.uid() = id);

-- trips（引用 trip_members，需等 trip_members table 建好）
create policy "trips_select_member"
  on tripsync.trips for select
  using (
    owner_id = auth.uid() or
    exists (
      select 1 from tripsync.trip_members
      where trip_id = trips.id and user_id = auth.uid()
    )
  );

create policy "trips_insert_own"
  on tripsync.trips for insert
  with check (auth.uid() = owner_id);

create policy "trips_update_owner"
  on tripsync.trips for update
  using (owner_id = auth.uid());

create policy "trips_delete_owner"
  on tripsync.trips for delete
  using (owner_id = auth.uid());

-- trip_members
create policy "trip_members_select"
  on tripsync.trip_members for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from tripsync.trips
      where id = trip_id and owner_id = auth.uid()
    )
  );

create policy "trip_members_manage_owner"
  on tripsync.trip_members for all
  using (
    exists (
      select 1 from tripsync.trips
      where id = trip_id and owner_id = auth.uid()
    )
  );

-- trip_events
create policy "events_select_member"
  on tripsync.trip_events for select
  using (
    exists (
      select 1 from tripsync.trips t
      left join tripsync.trip_members m on m.trip_id = t.id
      where t.id = trip_id
        and (t.owner_id = auth.uid() or m.user_id = auth.uid())
    )
  );

create policy "events_manage_editor"
  on tripsync.trip_events for all
  using (
    exists (
      select 1 from tripsync.trips t
      left join tripsync.trip_members m
             on m.trip_id = t.id and m.user_id = auth.uid()
      where t.id = trip_id
        and (t.owner_id = auth.uid() or m.role in ('owner', 'editor'))
    )
  );

-- candidate_places
create policy "candidates_select_member"
  on tripsync.candidate_places for select
  using (
    exists (
      select 1 from tripsync.trips t
      left join tripsync.trip_members m on m.trip_id = t.id
      where t.id = trip_id
        and (t.owner_id = auth.uid() or m.user_id = auth.uid())
    )
  );

create policy "candidates_manage_editor"
  on tripsync.candidate_places for all
  using (
    exists (
      select 1 from tripsync.trips t
      left join tripsync.trip_members m
             on m.trip_id = t.id and m.user_id = auth.uid()
      where t.id = trip_id
        and (t.owner_id = auth.uid() or m.role in ('owner', 'editor'))
    )
  );


-- ── 5. updated_at 觸發器 ─────────────────────────────────────
create or replace function tripsync.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tripsync_profiles_updated_at
  before update on tripsync.profiles
  for each row execute procedure tripsync.handle_updated_at();

create trigger tripsync_trips_updated_at
  before update on tripsync.trips
  for each row execute procedure tripsync.handle_updated_at();

create trigger tripsync_events_updated_at
  before update on tripsync.trip_events
  for each row execute procedure tripsync.handle_updated_at();
