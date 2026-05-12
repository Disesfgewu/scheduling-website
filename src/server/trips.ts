import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type {
  CandidatePlace,
  CreateCandidateInput,
  CreateEventInput,
  EventCategory,
  GeoLocation,
  Member,
  Trip,
  TripEvent,
  User,
} from '@/types';

// ── Supabase client（Service Role 繞過 RLS，只限 server 使用）────
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { db: { schema: 'tripsync' } });
}

// ── Row types（對應 DB column 名稱）─────────────────────────────
type ProfileRow = {
  id: string; name: string; email?: string;
  initials: string; color: string; avatar_url: string | null;
};

type MemberRow = {
  id: string; trip_id: string; user_id: string;
  role: 'owner' | 'editor' | 'viewer'; joined_at: string;
  profiles: ProfileRow;
};

type TripRow = {
  id: string; title: string; description: string | null;
  cover_image: string | null; location: string | null; country: string | null;
  start_date: string; end_date: string; emoji: string; owner_id: string;
  trip_members: MemberRow[];
};

type EventRow = {
  id: string; trip_id: string; title: string; date: string; time: string;
  end_time: string | null; category: EventCategory; notes: string | null;
  color: string; icon: string; phone: string | null; website: string | null;
  opening_hours: string | null; price_note: string | null;
  reservation_required: boolean; booking_url: string | null;
  duration_minutes: number | null; location_name: string | null;
  location_address: string | null; lat: number | null; lng: number | null;
  from_candidate_id: string | null;
};

type CandidateRow = {
  id: string; trip_id: string; name: string; address: string | null;
  phone: string | null; website: string | null; opening_hours: string | null;
  price_level: number | null; price_note: string | null;
  reservation_required: boolean; category: EventCategory; notes: string | null;
  location_name: string | null; location_address: string | null;
  lat: number | null; lng: number | null;
  scheduled_event_id: string | null; added_at: string;
};

// ── Row → TypeScript 轉換 ─────────────────────────────────────
function toLocation(row: Pick<EventRow | CandidateRow, 'location_name' | 'location_address' | 'lat' | 'lng'>): GeoLocation | undefined {
  if (!row.lat || !row.location_name) return undefined;
  return { name: row.location_name, address: row.location_address ?? undefined, lat: row.lat, lng: row.lng! };
}

function toUser(p: ProfileRow): User {
  return { id: p.id, name: p.name, email: p.email ?? '', initials: p.initials, color: p.color, avatarUrl: p.avatar_url ?? undefined };
}

function toMember(r: MemberRow): Member {
  return { id: r.id, userId: r.user_id, tripId: r.trip_id, role: r.role, joinedAt: r.joined_at, user: toUser(r.profiles) };
}

function toEvent(r: EventRow): TripEvent {
  return {
    id: r.id, tripId: r.trip_id, title: r.title, date: r.date, time: r.time,
    endTime: r.end_time ?? undefined, category: r.category, notes: r.notes ?? undefined,
    color: r.color, icon: r.icon, phone: r.phone ?? undefined, website: r.website ?? undefined,
    openingHours: r.opening_hours ?? undefined, priceNote: r.price_note ?? undefined,
    reservationRequired: r.reservation_required, bookingUrl: r.booking_url ?? undefined,
    duration: r.duration_minutes ?? undefined, fromCandidateId: r.from_candidate_id ?? undefined,
    location: toLocation(r),
  };
}

function toCandidate(r: CandidateRow): CandidatePlace {
  return {
    id: r.id, tripId: r.trip_id, name: r.name, address: r.address ?? undefined,
    phone: r.phone ?? undefined, website: r.website ?? undefined,
    openingHours: r.opening_hours ?? undefined,
    priceLevel: (r.price_level as 1 | 2 | 3 | 4) ?? undefined,
    priceNote: r.price_note ?? undefined, reservationRequired: r.reservation_required,
    category: r.category, notes: r.notes ?? undefined,
    scheduledEventId: r.scheduled_event_id ?? undefined,
    addedAt: r.added_at, location: toLocation(r),
  };
}

function toTrip(r: TripRow, events: TripEvent[] = []): Trip {
  return {
    id: r.id, title: r.title, description: r.description ?? '',
    coverImage: r.cover_image ?? undefined, location: r.location ?? '',
    country: r.country ?? '', startDate: r.start_date, endDate: r.end_date,
    emoji: r.emoji, ownerId: r.owner_id,
    members: (r.trip_members ?? []).map(toMember), events,
  };
}

function categoryToIcon(category: EventCategory): string {
  const map: Record<EventCategory, string> = {
    food: '🍽️', transport: '✈️', culture: '🏛️',
    shopping: '🛍️', nature: '🌿', accommodation: '🏨', entertainment: '🎭',
  };
  return map[category] ?? '📍';
}

// ── TripSnapshot ─────────────────────────────────────────────
export interface TripSnapshot {
  trip: Trip;
  candidates: CandidatePlace[];
}

export interface CreateTripInput {
  title: string; description: string; location: string; country: string;
  startDate: string; endDate: string; emoji: string; coverImage?: string;
  ownerId?: string;
  owner?: { id: string; name: string; email: string; initials: string; color: string };
}

// ── Exported API functions（全部 async）──────────────────────

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await getDb()
    .from('trips')
    .select('*, trip_members(id, role, joined_at, profiles(*))')
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: TripRow) => toTrip(r));
}

export async function getTripSnapshot(tripId: string): Promise<TripSnapshot | null> {
  const db = getDb();
  const [tripRes, eventsRes, candidatesRes] = await Promise.all([
    db.from('trips').select('*, trip_members(id, role, joined_at, profiles(*))').eq('id', tripId).single(),
    db.from('trip_events').select('*').eq('trip_id', tripId).order('date').order('time'),
    db.from('candidate_places').select('*').eq('trip_id', tripId).order('added_at'),
  ]);

  if (tripRes.error || !tripRes.data) {
    console.error('[getTripSnapshot] trip fetch error:', tripRes.error?.message);
    return null;
  }
  if (eventsRes.error) {
    console.error('[getTripSnapshot] events fetch error:', eventsRes.error.message, eventsRes.error.details);
  }
  if (candidatesRes.error) {
    console.error('[getTripSnapshot] candidates fetch error:', candidatesRes.error.message);
  }

  return {
    trip: toTrip(tripRes.data as TripRow, (eventsRes.data ?? []).map((r: EventRow) => toEvent(r))),
    candidates: (candidatesRes.data ?? []).map((r: CandidateRow) => toCandidate(r)),
  };
}

export async function getPublicTripSnapshot(
  tripId: string,
  token: string,
): Promise<TripSnapshot | null> {
  const db = getDb();
  const { data: invite, error } = await db
    .from('trip_invites')
    .select('trip_id, expires_at')
    .eq('trip_id', tripId)
    .eq('token', token)
    .single();

  if (error || !invite) {
    return null;
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new Error('Invite link expired');
  }

  return getTripSnapshot(tripId);
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const db = getDb();
  const ownerId = input.ownerId ?? input.owner?.id;
  if (!ownerId) throw new Error('owner_id is required');

  // Ensure profile row exists (handles case where auth trigger hasn't run yet)
  if (input.owner) {
    const { error: profileErr } = await db.from('profiles').upsert(
      {
        id: ownerId,
        name: input.owner.name || 'User',
        initials: input.owner.initials || input.owner.name?.slice(0, 2).toUpperCase() || 'U',
        color: input.owner.color || '#6366f1',
      },
      { onConflict: 'id' },
    );
    if (profileErr) {
      // Log but don't throw — profile may already exist via trigger
      console.error('[createTrip] profile upsert error:', profileErr.message);
    }
  }

  const { data: trip, error: tripErr } = await db.from('trips').insert({
    title: input.title,
    description: input.description || null,
    cover_image: input.coverImage || null,
    location: input.location || null,
    country: input.country || null,
    start_date: input.startDate,
    end_date: input.endDate,
    emoji: input.emoji,
    owner_id: ownerId,
  }).select().single();

  if (tripErr) {
    console.error('[createTrip] trips insert error:', tripErr.message, tripErr.details, tripErr.hint);
    throw new Error(tripErr.message);
  }

  const { error: memberErr } = await db.from('trip_members').insert({
    trip_id: trip.id, user_id: ownerId, role: 'owner',
  });
  if (memberErr) {
    console.error('[createTrip] trip_members insert error:', memberErr.message);
  }

  const { data: full, error: fullErr } = await db.from('trips')
    .select('*, trip_members(id, role, joined_at, profiles(*))')
    .eq('id', trip.id).single();

  if (fullErr) {
    console.error('[createTrip] final fetch error:', fullErr.message);
    throw new Error(fullErr.message);
  }

  return toTrip(full as TripRow);
}

export async function createEvent(tripId: string, input: CreateEventInput): Promise<TripSnapshot> {
  const { error } = await getDb().from('trip_events').insert({
    trip_id: tripId, title: input.title, date: input.date, time: input.time,
    end_time: input.endTime ?? null, category: input.category,
    notes: input.notes ?? null, color: input.color, icon: categoryToIcon(input.category),
    phone: input.phone ?? null, website: input.website ?? null,
    opening_hours: input.openingHours ?? null, price_note: input.priceNote ?? null,
    reservation_required: input.reservationRequired ?? false,
    booking_url: input.bookingUrl ?? null, duration_minutes: input.duration ?? null,
    from_candidate_id: input.fromCandidateId ?? null,
    location_name: input.location?.name ?? null, location_address: input.location?.address ?? null,
    lat: input.location?.lat ?? null, lng: input.location?.lng ?? null,
  });
  if (error) throw new Error(error.message);
  const snap = await getTripSnapshot(tripId);
  if (!snap) throw new Error('Trip not found');
  return snap;
}

export async function updateEvent(tripId: string, eventId: string, updates: Partial<TripEvent>): Promise<TripSnapshot> {
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.date !== undefined) patch.date = updates.date;
  if (updates.time !== undefined) patch.time = updates.time;
  if (updates.endTime !== undefined) patch.end_time = updates.endTime;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.website !== undefined) patch.website = updates.website;
  if (updates.openingHours !== undefined) patch.opening_hours = updates.openingHours;
  if (updates.priceNote !== undefined) patch.price_note = updates.priceNote;

  const { error } = await getDb().from('trip_events').update(patch).eq('id', eventId);
  if (error) throw new Error(error.message);
  const snap = await getTripSnapshot(tripId);
  if (!snap) throw new Error('Trip not found');
  return snap;
}

export async function deleteEvent(tripId: string, eventId: string): Promise<TripSnapshot> {
  const { error } = await getDb().from('trip_events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);
  const snap = await getTripSnapshot(tripId);
  if (!snap) throw new Error('Trip not found');
  return snap;
}

export async function createCandidate(tripId: string, input: CreateCandidateInput): Promise<TripSnapshot> {
  const { error } = await getDb().from('candidate_places').insert({
    trip_id: tripId, name: input.name, address: input.address ?? null,
    phone: input.phone ?? null, website: input.website ?? null,
    opening_hours: input.openingHours ?? null, price_level: input.priceLevel ?? null,
    price_note: input.priceNote ?? null, reservation_required: input.reservationRequired ?? false,
    category: input.category, notes: input.notes ?? null,
    location_name: input.location?.name ?? null, location_address: input.location?.address ?? null,
    lat: input.location?.lat ?? null, lng: input.location?.lng ?? null,
  });
  if (error) throw new Error(error.message);
  const snap = await getTripSnapshot(tripId);
  if (!snap) throw new Error('Trip not found');
  return snap;
}

export async function deleteCandidate(tripId: string, candidateId: string): Promise<TripSnapshot> {
  const { error } = await getDb().from('candidate_places').delete().eq('id', candidateId);
  if (error) throw new Error(error.message);
  const snap = await getTripSnapshot(tripId);
  if (!snap) throw new Error('Trip not found');
  return snap;
}

export async function scheduleCandidate(
  tripId: string, candidateId: string,
  payload: { date: string; time: string; endTime?: string },
): Promise<TripSnapshot> {
  const db = getDb();
  const { data: c, error: fetchErr } = await db.from('candidate_places').select('*').eq('id', candidateId).single();
  if (fetchErr || !c) throw new Error('Candidate not found');
  const candidate = c as CandidateRow;

  const { data: event, error: eventErr } = await db.from('trip_events').insert({
    trip_id: tripId, title: candidate.name, date: payload.date, time: payload.time,
    end_time: payload.endTime ?? null, category: candidate.category,
    notes: candidate.notes ?? null, color: '#6366f1',
    icon: categoryToIcon(candidate.category),
    phone: candidate.phone ?? null, website: candidate.website ?? null,
    opening_hours: candidate.opening_hours ?? null, price_note: candidate.price_note ?? null,
    reservation_required: candidate.reservation_required ?? false,
    from_candidate_id: candidateId,
    location_name: candidate.location_name ?? null, location_address: candidate.location_address ?? null,
    lat: candidate.lat ?? null, lng: candidate.lng ?? null,
  }).select().single();
  if (eventErr) throw new Error(eventErr.message);

  await db.from('candidate_places').update({ scheduled_event_id: event.id }).eq('id', candidateId);

  const snap = await getTripSnapshot(tripId);
  if (!snap) throw new Error('Trip not found');
  return snap;
}
