-- ============================================================
-- Migration 006: Trip Invite Links
-- ============================================================

create table tripsync.trip_invites (
  id         uuid        primary key default extensions.uuid_generate_v4(),
  trip_id    uuid        not null references tripsync.trips(id) on delete cascade,
  token      text        unique not null
               default encode(extensions.gen_random_bytes(16), 'hex'),
  role       text        not null default 'editor'
               check (role in ('editor', 'viewer')),
  created_by uuid        references tripsync.profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

alter table tripsync.trip_invites enable row level security;

-- 任何人都可以讀（驗證 token 用）
create policy "invite_select_all"
  on tripsync.trip_invites for select using (true);

-- 只有 owner / editor 可以建立邀請
create policy "invite_insert_member"
  on tripsync.trip_invites for insert
  with check (
    exists (
      select 1 from tripsync.trip_members
      where trip_id = trip_invites.trip_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

-- 只有建立者可以刪除
create policy "invite_delete_creator"
  on tripsync.trip_invites for delete
  using (created_by = auth.uid());

create index idx_ts_invites_token   on tripsync.trip_invites(token);
create index idx_ts_invites_trip_id on tripsync.trip_invites(trip_id);
