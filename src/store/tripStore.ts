import { create } from 'zustand';
import {
  ApiError,
  createCandidate as createCandidateRequest,
  createEvent as createEventRequest,
  createTrip as createTripRequest,
  deleteEvent as deleteEventRequest,
  fetchPublicTripSnapshot,
  fetchTripSnapshot,
  fetchTrips,
  removeCandidate as removeCandidateRequest,
  scheduleCandidate as scheduleCandidateRequest,
  updateEvent as updateEventRequest,
  type CreateTripPayload,
  type TripSnapshotPayload,
} from '@/lib/tripsApi';
import type {
  CandidatePlace,
  CreateCandidateInput,
  CreateEventInput,
  Trip,
  TripEvent,
} from '@/types';

interface TripState {
  trips: Trip[];
  selectedTripId: string | null;
  selectedEventId: string | null;
  candidatePlaces: Record<string, CandidatePlace[]>;
  isTripsLoading: boolean;
  hasLoadedTrips: boolean;
  tripsError: string | null;
  loadingTripIds: Record<string, boolean>;
  loadedTripIds: Record<string, boolean>;
  missingTripIds: Record<string, boolean>;
  tripErrors: Record<string, string | null>;

  loadTrips: () => Promise<void>;
  loadTrip: (id: string, force?: boolean) => Promise<Trip | undefined>;
  loadSharedTrip: (id: string, token: string) => Promise<Trip | undefined>;
  hasLoadedTrip: (id: string) => boolean;
  isTripLoading: (id: string) => boolean;
  isTripMissing: (id: string) => boolean;
  getTripError: (id: string) => string | null;

  getTrip: (id: string) => Trip | undefined;
  getCandidates: (tripId: string) => CandidatePlace[];
  selectTrip: (id: string | null) => void;
  selectEvent: (id: string | null) => void;

  addTrip: (input: CreateTripPayload) => Promise<Trip>;
  addEvent: (tripId: string, input: CreateEventInput) => Promise<void>;
  deleteEvent: (tripId: string, eventId: string) => Promise<void>;
  updateEvent: (tripId: string, eventId: string, updates: Partial<TripEvent>) => Promise<void>;
  addCandidate: (tripId: string, input: CreateCandidateInput) => Promise<CandidatePlace | undefined>;
  removeCandidate: (tripId: string, candidateId: string) => Promise<void>;
  scheduleCandidate: (tripId: string, candidateId: string, date: string, time: string, endTime?: string) => Promise<void>;
}

function upsertTrip(trips: Trip[], nextTrip: Trip): Trip[] {
  const index = trips.findIndex((trip) => trip.id === nextTrip.id);

  if (index === -1) {
    return [nextTrip, ...trips];
  }

  const next = [...trips];
  next[index] = nextTrip;
  return next;
}

function sortTrips(trips: Trip[]): Trip[] {
  return [...trips].sort((left, right) => {
    if (left.startDate !== right.startDate) {
      return right.startDate.localeCompare(left.startDate);
    }

    return right.id.localeCompare(left.id);
  });
}

function normalizeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}

function applySnapshot(
  state: TripState,
  tripId: string,
  snapshot: TripSnapshotPayload,
): Partial<TripState> {
  return {
    trips: sortTrips(upsertTrip(state.trips, snapshot.trip)),
    candidatePlaces: {
      ...state.candidatePlaces,
      [tripId]: snapshot.candidates,
    },
    loadedTripIds: {
      ...state.loadedTripIds,
      [tripId]: true,
    },
    loadingTripIds: {
      ...state.loadingTripIds,
      [tripId]: false,
    },
    missingTripIds: {
      ...state.missingTripIds,
      [tripId]: false,
    },
    tripErrors: {
      ...state.tripErrors,
      [tripId]: null,
    },
  };
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  selectedTripId: null,
  selectedEventId: null,
  candidatePlaces: {},
  isTripsLoading: false,
  hasLoadedTrips: false,
  tripsError: null,
  loadingTripIds: {},
  loadedTripIds: {},
  missingTripIds: {},
  tripErrors: {},

  loadTrips: async () => {
    if (get().isTripsLoading) {
      return;
    }

    set({ isTripsLoading: true, tripsError: null });

    try {
      const trips = await fetchTrips();
      set({
        trips: sortTrips(trips),
        isTripsLoading: false,
        hasLoadedTrips: true,
        tripsError: null,
      });
    } catch (error) {
      set({
        isTripsLoading: false,
        hasLoadedTrips: true,
        tripsError: normalizeError(error),
      });
    }
  },

  loadTrip: async (id, force = false) => {
    const state = get();

    if (state.loadingTripIds[id]) {
      return state.getTrip(id);
    }

    if (!force && state.loadedTripIds[id] && state.candidatePlaces[id]) {
      return state.getTrip(id);
    }

    set((current) => ({
      selectedTripId: id,
      loadingTripIds: {
        ...current.loadingTripIds,
        [id]: true,
      },
      tripErrors: {
        ...current.tripErrors,
        [id]: null,
      },
    }));

    try {
      const snapshot = await fetchTripSnapshot(id);
      set((current) => applySnapshot(current, id, snapshot));
      return snapshot.trip;
    } catch (error) {
      const message = normalizeError(error);
      const isMissing = error instanceof ApiError && error.status === 404;

      set((current) => ({
        loadingTripIds: {
          ...current.loadingTripIds,
          [id]: false,
        },
        loadedTripIds: {
          ...current.loadedTripIds,
          [id]: true,
        },
        missingTripIds: {
          ...current.missingTripIds,
          [id]: isMissing,
        },
        tripErrors: {
          ...current.tripErrors,
          [id]: isMissing ? null : message,
        },
      }));

      return undefined;
    }
  },

  loadSharedTrip: async (id, token) => {
    const state = get();

    if (state.loadingTripIds[id]) {
      return state.getTrip(id);
    }

    set((current) => ({
      selectedTripId: id,
      loadingTripIds: {
        ...current.loadingTripIds,
        [id]: true,
      },
      tripErrors: {
        ...current.tripErrors,
        [id]: null,
      },
    }));

    try {
      const snapshot = await fetchPublicTripSnapshot(id, token);
      set((current) => applySnapshot(current, id, snapshot));
      return snapshot.trip;
    } catch (error) {
      const message = normalizeError(error);
      const isMissing =
        error instanceof ApiError &&
        error.status === 404;

      set((current) => ({
        loadingTripIds: {
          ...current.loadingTripIds,
          [id]: false,
        },
        loadedTripIds: {
          ...current.loadedTripIds,
          [id]: true,
        },
        missingTripIds: {
          ...current.missingTripIds,
          [id]: isMissing,
        },
        tripErrors: {
          ...current.tripErrors,
          [id]: isMissing ? null : message,
        },
      }));

      return undefined;
    }
  },

  hasLoadedTrip: (id) => !!get().loadedTripIds[id],
  isTripLoading: (id) => !!get().loadingTripIds[id],
  isTripMissing: (id) => !!get().missingTripIds[id],
  getTripError: (id) => get().tripErrors[id] ?? null,

  getTrip: (id) => get().trips.find((trip) => trip.id === id),

  getCandidates: (tripId) => get().candidatePlaces[tripId] ?? [],

  selectTrip: (id) => set({ selectedTripId: id, selectedEventId: null }),

  selectEvent: (id) => set({ selectedEventId: id }),

  addTrip: async (input) => {
    const trip = await createTripRequest(input);

    set((state) => ({
      trips: sortTrips(upsertTrip(state.trips, trip)),
      candidatePlaces: {
        ...state.candidatePlaces,
        [trip.id]: state.candidatePlaces[trip.id] ?? [],
      },
      selectedTripId: trip.id,
    }));

    return trip;
  },

  addEvent: async (tripId, input) => {
    const snapshot = await createEventRequest(tripId, input);
    set((state) => applySnapshot(state, tripId, snapshot));
  },

  deleteEvent: async (tripId, eventId) => {
    const snapshot = await deleteEventRequest(tripId, eventId);
    set((state) => applySnapshot(state, tripId, snapshot));
  },

  updateEvent: async (tripId, eventId, updates) => {
    const snapshot = await updateEventRequest(tripId, eventId, updates);
    set((state) => applySnapshot(state, tripId, snapshot));
  },

  addCandidate: async (tripId, input) => {
    const snapshot = await createCandidateRequest(tripId, input);
    set((state) => applySnapshot(state, tripId, snapshot));
    return snapshot.candidates[snapshot.candidates.length - 1];
  },

  removeCandidate: async (tripId, candidateId) => {
    const snapshot = await removeCandidateRequest(tripId, candidateId);
    set((state) => applySnapshot(state, tripId, snapshot));
  },

  scheduleCandidate: async (tripId, candidateId, date, time, endTime) => {
    const snapshot = await scheduleCandidateRequest(tripId, candidateId, {
      date,
      time,
      endTime,
    });
    set((state) => applySnapshot(state, tripId, snapshot));
  },
}));
