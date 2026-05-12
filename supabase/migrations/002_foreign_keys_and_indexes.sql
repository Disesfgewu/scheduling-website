-- ============================================================
-- Migration 002: Foreign Keys & Indexes
-- Schema: tripsync
-- ============================================================

-- FK: trip_events.from_candidate_id → candidate_places
alter table tripsync.trip_events
  add constraint fk_event_from_candidate
  foreign key (from_candidate_id)
  references tripsync.candidate_places(id)
  on delete set null;

-- ── 效能索引 ─────────────────────────────────────────────────
create index idx_ts_events_trip_id      on tripsync.trip_events(trip_id);
create index idx_ts_events_date         on tripsync.trip_events(date);
create index idx_ts_candidates_trip_id  on tripsync.candidate_places(trip_id);
create index idx_ts_members_trip_id     on tripsync.trip_members(trip_id);
create index idx_ts_members_user_id     on tripsync.trip_members(user_id);
create index idx_ts_trips_owner_id      on tripsync.trips(owner_id);
create index idx_ts_trips_dates         on tripsync.trips(start_date, end_date);
