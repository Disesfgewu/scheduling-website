import type {
  CandidatePlace,
  CreateCandidateInput,
  CreateEventInput,
  Trip,
  TripEvent,
} from '@/types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface TripSnapshotPayload {
  trip: Trip;
  candidates: CandidatePlace[];
}

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(payload?.error ?? `Request failed: ${response.status}`, response.status);
  }

  if (!payload) {
    throw new ApiError('Empty response payload', response.status);
  }

  return payload.data;
}

export interface CreateTripPayload {
  title: string;
  description: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  emoji: string;
  coverImage?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    initials: string;
    color: string;
  };
}

export async function fetchTrips(): Promise<Trip[]> {
  const data = await request<{ trips: Trip[] }>('/api/trips');
  return data.trips;
}

export async function fetchTripSnapshot(tripId: string): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}`);
}

export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const data = await request<{ trip: Trip }>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return data.trip;
}

export async function createEvent(
  tripId: string,
  payload: CreateEventInput,
): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(
  tripId: string,
  eventId: string,
  payload: Partial<TripEvent>,
): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(
  tripId: string,
  eventId: string,
): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}/events/${eventId}`, {
    method: 'DELETE',
  });
}

export async function createCandidate(
  tripId: string,
  payload: CreateCandidateInput,
): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}/candidates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function removeCandidate(
  tripId: string,
  candidateId: string,
): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}/candidates/${candidateId}`, {
    method: 'DELETE',
  });
}

export async function scheduleCandidate(
  tripId: string,
  candidateId: string,
  payload: { date: string; time: string; endTime?: string },
): Promise<TripSnapshotPayload> {
  return request<TripSnapshotPayload>(`/api/trips/${tripId}/candidates/${candidateId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
