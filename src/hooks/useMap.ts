import { useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';
import { isFallbackCoordinates } from '@/lib/nominatim';
import { useUIStore } from '@/store/uiStore';

export function useMapSync(tripId: string) {
  const { getTrip, selectedEventId } = useTripStore();
  const { setMapCenter, setActiveTripTab } = useUIStore();
  const trip = getTrip(tripId);

  useEffect(() => {
    if (!selectedEventId || !trip) return;
    const event = trip.events.find((e) => e.id === selectedEventId);
    if (
      !event?.location ||
      event.location.lat == null ||
      event.location.lng == null ||
      isFallbackCoordinates(event.location.lat, event.location.lng)
    ) return;
    setMapCenter([event.location.lat, event.location.lng]);
  }, [selectedEventId, trip, setMapCenter]);

  const focusOnMap = (eventId: string) => {
    const event = trip?.events.find((e) => e.id === eventId);
    if (
      event?.location &&
      event.location.lat != null &&
      event.location.lng != null &&
      !isFallbackCoordinates(event.location.lat, event.location.lng)
    ) {
      setActiveTripTab('map');
      setMapCenter([event.location.lat, event.location.lng]);
    }
  };

  return { focusOnMap };
}
