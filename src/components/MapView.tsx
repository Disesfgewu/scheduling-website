'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import type { TripEvent } from '@/types';
import { getGoogleMapsDirectionsUrl, isFallbackCoordinates } from '@/lib/nominatim';

interface MapViewProps {
  events: TripEvent[];
  selectedEventId: string | null;
  onMarkerClick: (eventId: string) => void;
  className?: string;
}

const DAY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function MapView({ events, selectedEventId, onMarkerClick, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const initializingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const container = containerRef.current;
      if (!container || mapRef.current || initializingRef.current) return;
      initializingRef.current = true;

      const L = (await import('leaflet')).default;
      if (cancelled || !container) { initializingRef.current = false; return; }

      // Remove stale Leaflet state from the DOM node if it exists
      const el = container as HTMLDivElement & { _leaflet_id?: number };
      if (el._leaflet_id) delete el._leaflet_id;

      const eventsWithLoc = events.filter(
        (e) =>
          e.location?.lat != null &&
          e.location?.lng != null &&
          !isFallbackCoordinates(e.location.lat, e.location.lng),
      );
      const center: [number, number] =
        eventsWithLoc.length > 0
          ? [eventsWithLoc[0].location!.lat!, eventsWithLoc[0].location!.lng!]
          : [35.6762, 139.6503];

      const map = L.map(container, { center, zoom: 13, zoomControl: false });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Route lines by day
      const byDate: Record<string, TripEvent[]> = {};
      eventsWithLoc.forEach((e) => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
      });
      Object.keys(byDate).sort().forEach((date, di) => {
        const dayEvents = byDate[date].sort((a, b) => a.time.localeCompare(b.time));
        if (dayEvents.length < 2) return;
        const points = dayEvents.map((e) => [e.location!.lat!, e.location!.lng!] as [number, number]);
        L.polyline(points, {
          color: DAY_COLORS[di % DAY_COLORS.length],
          weight: 2.5, opacity: 0.5, dashArray: '8, 10',
        }).addTo(map);
      });

      // Markers
      eventsWithLoc.forEach((event) => {
        const iconHtml = `
          <div style="width:36px;height:44px;display:flex;flex-direction:column;align-items:center;">
            <div style="width:36px;height:36px;border-radius:12px;display:flex;align-items:center;
              justify-content:center;background:white;box-shadow:0 2px 12px rgba(0,0,0,.2);
              border:2.5px solid #6366f1;">
              <span style="font-size:18px;line-height:1;">${event.icon}</span>
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;
              border-right:5px solid transparent;border-top:8px solid #6366f1;"></div>
          </div>`;
        const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44] });

        const navUrl = getGoogleMapsDirectionsUrl({
          lat: event.location!.lat,
          lng: event.location!.lng,
        }) ?? '#';
        const popupContent = `
          <div style="font-family:system-ui,sans-serif;min-width:180px;padding:2px 0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:20px;">${event.icon}</span>
              <strong style="font-size:14px;color:#111;">${event.title}</strong>
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:2px;">🕐 ${event.time}${event.endTime ? ` – ${event.endTime}` : ''}</div>
            ${event.location ? `<div style="font-size:12px;color:#666;margin-bottom:2px;">📍 ${event.location.name}</div>` : ''}
            ${event.phone ? `<a href="tel:${event.phone}" style="font-size:11px;color:#6366f1;display:block;margin-bottom:2px;">📞 ${event.phone}</a>` : ''}
            ${event.openingHours ? `<div style="font-size:11px;color:#666;margin-bottom:6px;">⏰ ${event.openingHours}</div>` : ''}
            <a href="${navUrl}" target="_blank" style="display:block;padding:5px 10px;border-radius:8px;
              background:#6366f1;color:white;text-align:center;font-size:11px;
              font-family:system-ui;text-decoration:none;">🧭 導航</a>
          </div>`;

        const marker = L.marker([event.location!.lat!, event.location!.lng!], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { maxWidth: 240 });
        marker.on('click', () => onMarkerClick(event.id));
        markersRef.current.set(event.id, marker);
      });

      if (eventsWithLoc.length > 1) {
        const bounds = L.latLngBounds(eventsWithLoc.map((e) => [e.location!.lat!, e.location!.lng!]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      }

      mapRef.current = map;
      initializingRef.current = false;
    }

    initMap();

    return () => {
      cancelled = true;
      initializingRef.current = false;
      const map = mapRef.current;
      const markers = markersRef.current;
      if (map) {
        map.remove();
        mapRef.current = null;
        markers.clear();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync map to selected event
  useEffect(() => {
    if (!selectedEventId || !mapRef.current) return;
    const event = events.find((e) => e.id === selectedEventId);
    if (
      !event?.location ||
      event.location.lat == null ||
      event.location.lng == null ||
      isFallbackCoordinates(event.location.lat, event.location.lng)
    ) return;
    mapRef.current.setView([event.location.lat, event.location.lng], 16, { animate: true, duration: 0.8 });
    markersRef.current.get(selectedEventId)?.openPopup();
  }, [selectedEventId, events]);

  return <div ref={containerRef} className={className ?? 'w-full h-full'} style={{ minHeight: 300 }} />;
}
