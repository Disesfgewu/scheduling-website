import { useTripStore } from '@/store/tripStore';

export function useTrip(tripId: string) {
  const { getTrip, selectedEventId, selectEvent, addEvent, deleteEvent } = useTripStore();
  const trip = getTrip(tripId);

  return {
    trip,
    selectedEventId,
    selectEvent,
    addEvent: (input: Parameters<typeof addEvent>[1]) => addEvent(tripId, input),
    deleteEvent: (eventId: string) => deleteEvent(tripId, eventId),
  };
}
