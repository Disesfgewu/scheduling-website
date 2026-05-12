// ─── Supabase-ready: replace these types with Supabase-generated types when connecting ───

export type EventCategory =
  | 'food'
  | 'transport'
  | 'culture'
  | 'shopping'
  | 'nature'
  | 'accommodation'
  | 'entertainment';

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface GeoLocation {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface TripEvent {
  id: string;
  tripId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime?: string;
  location?: GeoLocation;
  category: EventCategory;
  notes?: string;
  color: string;
  icon: string;
  isExpanded?: boolean;
  // Extended detail fields
  phone?: string;
  website?: string;
  openingHours?: string;
  priceNote?: string;
  reservationRequired?: boolean;
  bookingUrl?: string;
  duration?: number; // minutes
  fromCandidateId?: string;
}

export interface CandidatePlace {
  id: string;
  tripId: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$
  priceNote?: string;
  reservationRequired?: boolean;
  category: EventCategory;
  notes?: string;
  location?: GeoLocation;
  addedAt: string;
  scheduledEventId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  color: string;
}

export interface Member {
  id: string;
  userId: string;
  tripId: string;
  role: MemberRole;
  user: User;
  joinedAt: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  location: string;
  country: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  members: Member[];
  events: TripEvent[];
  ownerId: string;
  emoji: string;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location?: GeoLocation;
  category: EventCategory;
  notes?: string;
  color: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  priceNote?: string;
  reservationRequired?: boolean;
  bookingUrl?: string;
  duration?: number;
  fromCandidateId?: string;
}

export interface CreateCandidateInput {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  priceLevel?: 1 | 2 | 3 | 4;
  priceNote?: string;
  reservationRequired?: boolean;
  category: EventCategory;
  notes?: string;
  location?: GeoLocation;
}

export const PRICE_LEVEL_LABELS: Record<number, string> = {
  1: '$ 平價',
  2: '$$ 中等',
  3: '$$$ 較貴',
  4: '$$$$ 高檔',
};

export const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  food: { label: '餐飲', icon: '🍽️', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  transport: { label: '交通', icon: '✈️', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  culture: { label: '文化', icon: '🏛️', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  shopping: { label: '購物', icon: '🛍️', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  nature: { label: '自然', icon: '🌿', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  accommodation: { label: '住宿', icon: '🏨', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  entertainment: { label: '娛樂', icon: '🎭', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
};
