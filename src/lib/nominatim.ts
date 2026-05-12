// OpenStreetMap Nominatim — free geocoding, no API key required
// Rate limit: 1 request/second, max 1 per second, no bulk requests

export interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  category: string;
  address: {
    amenity?: string;
    road?: string;
    city?: string;
    country?: string;
    postcode?: string;
  };
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  displayName: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '10',
    addressdetails: '1',
    'accept-language': 'zh-TW,zh,en',
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'User-Agent': 'TripSync/1.0 (travel planning app)' },
      signal,
    },
  );

  if (!res.ok) throw new Error('Search failed');

  const data: NominatimResult[] = await res.json();

  return data.map((item) => {
    const parts = item.display_name.split(', ');
    const name = item.address.amenity ?? parts[0];
    const address = parts.slice(1, 4).join(', ');

    return {
      id: String(item.place_id),
      name,
      displayName: item.display_name,
      address,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    };
  });
}

export function openNavigation(lat: number, lng: number, label?: string) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const encodedLabel = label ? encodeURIComponent(label) : '';

  if (isIOS) {
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d${encodedLabel ? `&q=${encodedLabel}` : ''}`, '_blank');
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${encodedLabel ? `&destination_place_id=${encodedLabel}` : ''}`, '_blank');
  }
}
