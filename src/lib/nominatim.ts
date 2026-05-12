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

// 國家名稱 → ISO 3166-1 alpha-2 code 對應表
const COUNTRY_CODE_MAP: Record<string, string> = {
  台灣: 'tw', 台湾: 'tw', Taiwan: 'tw',
  日本: 'jp', Japan: 'jp',
  韓國: 'kr', 韓国: 'kr', '南韓': 'kr', Korea: 'kr',
  中國: 'cn', 中国: 'cn', China: 'cn',
  美國: 'us', USA: 'us', 'United States': 'us',
  泰國: 'th', Thailand: 'th',
  越南: 'vn', Vietnam: 'vn',
  新加坡: 'sg', Singapore: 'sg',
  馬來西亞: 'my', Malaysia: 'my',
  印尼: 'id', Indonesia: 'id',
  菲律賓: 'ph', Philippines: 'ph',
  香港: 'hk', 'Hong Kong': 'hk',
  澳門: 'mo', Macau: 'mo',
  法國: 'fr', France: 'fr',
  德國: 'de', Germany: 'de',
  義大利: 'it', Italy: 'it',
  英國: 'gb', UK: 'gb', 'United Kingdom': 'gb',
  澳洲: 'au', Australia: 'au',
};

export function countryNameToCode(country: string): string | undefined {
  return COUNTRY_CODE_MAP[country.trim()];
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  countryCode?: string,
): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '10',
    addressdetails: '1',
    'accept-language': 'zh-TW,zh,en',
  });

  // 限制在行程目的地國家內搜尋，避免搜到其他國家同名地點
  if (countryCode) {
    params.set('countrycodes', countryCode);
  }

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

/**
 * 開啟原生地圖導航，直接用座標定位（最精準）
 * iOS → Apple Maps, 其他 → Google Maps
 */
export function openNavigation(lat: number, lng: number) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // Apple Maps：daddr=緯度,經度
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`, '_blank');
  } else {
    // Google Maps：destination=緯度,經度（只用座標，不加其他 query 參數）
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  }
}
