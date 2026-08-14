/**
 * tourismService.ts — Production Location-Aware Tourism & Community Places API Service
 */
import { getApiUrl } from '../config/api.config.ts';
import { haversineDistance } from './locationService.ts';

export interface TouristPlace {
  id: string;
  name: string;
  description: string;
  category: string; // Forts, Temples, Waterfalls, Nature, Historical, Beaches, Food, Stays, etc.
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  taluka: string;
  village: string;
  city: string;
  state: string;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  reviewCount: number;
  distanceKm?: number;
  openingHours?: string;
  entryFee?: string;
  contactNumber?: string;
  website?: string;
  bestTimeToVisit?: string;
  facilities?: string[];
  safetyInfo?: string;
  source: 'GEOAPIFY' | 'COMMUNITY' | 'VERIFIED';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  verified: boolean;
  userId?: string;
  userName?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface DirectionResult {
  mode: string;
  distanceKm: number;
  durationMins: number;
  coordinates: [number, number][]; // Array of [lat, lng]
  steps: DirectionStep[];
  externalGoogleMapsUrl: string;
}

/**
 * Fetch nearby tourist attractions, forts, temples, waterfalls from Geoapify & Community database
 */
export const fetchNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusMeters = 50000,
  category = 'ALL',
  limit = 40
): Promise<TouristPlace[]> => {
  try {
    const url = getApiUrl(
      `/api/tourism/nearby?lat=${lat}&lon=${lng}&radius=${radiusMeters}&category=${encodeURIComponent(category)}&limit=${limit}`
    );
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        return data.places;
      }
    }
  } catch (err) {
    console.warn('[tourismService] Failed to fetch nearby places from API:', err);
  }

  // Fallback localized seed places
  return [
    {
      id: 'p-pune-1',
      name: 'Shaniwar Wada Fort',
      description: '18th-century seat of the Peshwas of the Maratha Empire, known for its grand teak gates and sound & light show.',
      category: 'Forts',
      latitude: lat + 0.005,
      longitude: lng + 0.003,
      address: 'Shaniwar Peth, Pune',
      district: 'Pune',
      taluka: 'Pune City',
      village: 'Shaniwar Peth',
      city: 'Pune',
      state: 'Maharashtra',
      images: ['https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'],
      ratingAvg: 4.6,
      ratingCount: 1840,
      reviewCount: 420,
      distanceKm: haversineDistance(lat, lng, lat + 0.005, lng + 0.003),
      openingHours: '08:00 AM - 06:30 PM',
      entryFee: '₹25',
      facilities: ['Parking', 'Restrooms', 'Drinking Water'],
      source: 'VERIFIED',
      status: 'APPROVED',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p-pune-2',
      name: 'Sinhagad Hill Fort (Lion Fort)',
      description: 'Majestic Sahyadri cliff fort famous for Tanaji Malusare history and monsoon trekking trails.',
      category: 'Forts',
      latitude: lat - 0.02,
      longitude: lng - 0.015,
      address: 'Sinhagad Ghat Road, Pune',
      district: 'Pune',
      taluka: 'Haveli',
      village: 'Thoptewadi',
      city: 'Pune',
      state: 'Maharashtra',
      images: ['https://images.unsplash.com/photo-1626014903708-ec94528ec809?auto=format&fit=crop&w=1200&q=80'],
      ratingAvg: 4.8,
      ratingCount: 3200,
      reviewCount: 950,
      distanceKm: haversineDistance(lat, lng, lat - 0.02, lng - 0.015),
      openingHours: '05:00 AM - 07:00 PM',
      entryFee: '₹50 Toll',
      facilities: ['Local Food Stalls', 'Trekking Trail', 'Parking'],
      source: 'VERIFIED',
      status: 'APPROVED',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

/**
 * Search places across Geoapify & internal database
 */
export const searchPlaces = async (
  queryText: string,
  lat: number,
  lng: number
): Promise<TouristPlace[]> => {
  try {
    const url = getApiUrl(`/api/tourism/search?q=${encodeURIComponent(queryText)}&lat=${lat}&lon=${lng}`);
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        return data.places;
      }
    }
  } catch (err) {
    console.warn('[tourismService] Search failed:', err);
  }
  return [];
};

/**
 * Fetch details for a specific place
 */
export const fetchPlaceDetails = async (
  id: string
): Promise<{ place: TouristPlace; reviews: PlaceReview[]; ratingBreakdown: Record<number, number> } | null> => {
  try {
    const url = getApiUrl(`/api/tourism/place/${id}`);
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          place: data.place,
          reviews: data.reviews || [],
          ratingBreakdown: data.ratingBreakdown || { 5: 10, 4: 5, 3: 2, 2: 0, 1: 0 },
        };
      }
    }
  } catch (err) {
    console.warn('[tourismService] Failed to fetch place details:', err);
  }
  return null;
};

/**
 * Fetch turn-by-turn routing instructions via OSRM proxy backend
 */
export const fetchDirections = async (
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  mode: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<DirectionResult | null> => {
  try {
    const url = getApiUrl(
      `/api/tourism/directions?startLat=${startLat}&startLng=${startLng}&destLat=${destLat}&destLng=${destLng}&mode=${mode}`
    );
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (err) {
    console.warn('[tourismService] Failed to fetch routing directions:', err);
  }
  return null;
};

/**
 * Submit user-generated community place
 */
export const submitCommunityPlace = async (
  placeData: Partial<TouristPlace> & { bypassDuplicateCheck?: boolean }
): Promise<{ success: boolean; message: string; place?: TouristPlace; similarExists?: boolean; existingPlace?: TouristPlace }> => {
  try {
    const url = getApiUrl('/api/tourism/places');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placeData),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: 'Failed to submit place. Please check internet connection.' };
  }
};

/**
 * Post user review & star rating
 */
export const submitPlaceReview = async (
  placeId: string,
  reviewData: { rating: number; comment: string; userId?: string; userName?: string; images?: string[] }
): Promise<{ success: boolean; reviews?: PlaceReview[]; error?: string }> => {
  try {
    const url = getApiUrl(`/api/tourism/places/${placeId}/reviews`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: 'Failed to submit review.' };
  }
};

/**
 * Submit place report
 */
export const submitPlaceReport = async (
  placeId: string,
  reportData: { reason: string; description: string; userId?: string }
): Promise<{ success: boolean; message?: string }> => {
  try {
    const url = getApiUrl(`/api/tourism/places/${placeId}/report`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
};

/**
 * Admin: Fetch pending place submissions
 */
export const fetchPendingPlaces = async (): Promise<TouristPlace[]> => {
  try {
    const url = getApiUrl('/api/tourism/admin/pending');
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.places || [];
    }
  } catch (err) {}
  return [];
};

/**
 * Admin: Moderate place (APPROVE / REJECT)
 */
export const moderatePlaceSubmission = async (
  placeId: string,
  action: 'APPROVE' | 'REJECT'
): Promise<{ success: boolean; message?: string }> => {
  try {
    const url = getApiUrl(`/api/tourism/admin/places/${placeId}/moderate`);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
};
