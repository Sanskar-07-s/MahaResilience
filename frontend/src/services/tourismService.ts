/**
 * tourismService.ts — Production Location-Aware Tourism & Community Places API Service
 * Integrated directly with Firebase Firestore Database ('places', 'placeReviews', 'placeReports')
 */
import { getApiUrl } from '../config/api.config.ts';
import { haversineDistance } from './locationService.ts';
import { db } from '../lib/firebase.ts';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

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
 * Utility to strip undefined properties from an object so Firestore addDoc/updateDoc never fails
 */
const sanitizeFirestoreData = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      sanitized[key] = obj[key];
    }
  });
  return sanitized as T;
};

const SEED_PLACES: TouristPlace[] = [
  {
    id: 'p-pune-1',
    name: 'Shaniwar Wada Fort',
    description: '18th-century seat of the Peshwas of the Maratha Empire, known for its grand teak gates and sound & light show.',
    category: 'Forts',
    latitude: 18.5196,
    longitude: 73.8553,
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
    latitude: 18.3663,
    longitude: 73.7558,
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
    openingHours: '05:00 AM - 07:00 PM',
    entryFee: '₹50 Toll',
    facilities: ['Local Food Stalls', 'Trekking Trail', 'Parking'],
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-kolhapur-1',
    name: 'Shree Mahalakshmi Temple (Ambaabai)',
    description: 'One of the 51 Shakti Peethas of India built in the 7th century by Chalukya Dynasty.',
    category: 'Temples',
    latitude: 16.6962,
    longitude: 74.2237,
    address: 'Bhavani Mandap Road, Kolhapur',
    district: 'Kolhapur',
    taluka: 'Karveer',
    village: 'Bhavani Peth',
    city: 'Kolhapur',
    state: 'Maharashtra',
    images: ['https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80'],
    ratingAvg: 4.9,
    ratingCount: 4120,
    reviewCount: 1100,
    openingHours: '04:30 AM - 10:00 PM',
    entryFee: 'Free',
    facilities: ['Prasad Counter', 'Shoe Stand', 'Restrooms'],
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-kolhapur-2',
    name: 'Rankala Lake & Promenade',
    description: 'Picturesque historic lake commissioned by Chhatrapati Shahu Maharaj with boating and street food.',
    category: 'Lakes',
    latitude: 16.6917,
    longitude: 74.2155,
    address: 'Rankala Lake Road, Kolhapur',
    district: 'Kolhapur',
    taluka: 'Karveer',
    village: 'Rankala',
    city: 'Kolhapur',
    state: 'Maharashtra',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    ratingAvg: 4.7,
    ratingCount: 2310,
    reviewCount: 510,
    openingHours: '24 Hours Open',
    entryFee: 'Free',
    facilities: ['Boating Club', 'Children Park', 'Food Plaza'],
    source: 'VERIFIED',
    status: 'APPROVED',
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Fetch nearby tourist attractions from BOTH Firebase Firestore DB and Geoapify API Proxy
 */
export const fetchNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusMeters = 200000,
  category = 'ALL',
  limit = 100
): Promise<TouristPlace[]> => {
  const combinedMap = new Map<string, TouristPlace>();

  // 1. Fetch places directly from Firebase Firestore Database
  try {
    const snap = await getDocs(collection(db, 'places'));
    snap.docs.forEach((d) => {
      const p = { id: d.id, ...d.data() } as TouristPlace;
      if (p.name && p.latitude && p.longitude) {
        combinedMap.set(p.name.toLowerCase().trim(), p);
      }
    });
  } catch (err) {
    console.warn('[tourismService] Firestore places fetch error:', err);
  }

  // 2. Fetch places from Render backend Geoapify Proxy
  try {
    const url = getApiUrl(
      `/api/tourism/nearby?lat=${lat}&lon=${lng}&radius=${radiusMeters}&category=${encodeURIComponent(category)}&limit=${limit}`
    );
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        data.places.forEach((p: TouristPlace) => {
          const key = p.name.toLowerCase().trim();
          if (!combinedMap.has(key)) {
            combinedMap.set(key, p);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[tourismService] Geoapify proxy fetch error:', err);
  }

  // 3. Fallback seed places if database is empty
  if (combinedMap.size === 0) {
    SEED_PLACES.forEach((p) => combinedMap.set(p.name.toLowerCase().trim(), p));
  }

  let allPlaces = Array.from(combinedMap.values());

  // Filter by category if specified
  if (category !== 'ALL') {
    allPlaces = allPlaces.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const rCat = category.toLowerCase();
      return pCat.includes(rCat) || rCat.includes(pCat);
    });
  }

  // Compute exact distance and sort closest first
  return allPlaces
    .map((p) => {
      const dist = haversineDistance(lat, lng, p.latitude, p.longitude);
      return { ...p, distanceKm: dist };
    })
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
};

/**
 * Search places across Firestore & Geoapify
 */
export const searchPlaces = async (
  queryText: string,
  lat: number,
  lng: number
): Promise<TouristPlace[]> => {
  const all = await fetchNearbyPlaces(lat, lng, 200000, 'ALL', 100);
  const q = queryText.toLowerCase().trim();
  if (!q) return all;

  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
  );
};

/**
 * Fetch details for a specific place
 */
export const fetchPlaceDetails = async (
  id: string
): Promise<{ place: TouristPlace; reviews: PlaceReview[]; ratingBreakdown: Record<number, number> } | null> => {
  try {
    const docRef = doc(db, 'places', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const p = { id: docSnap.id, ...docSnap.data() } as TouristPlace;

      const revSnap = await getDocs(collection(db, 'placeReviews'));
      const revs = revSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as PlaceReview))
        .filter((r) => r.placeId === id);

      return {
        place: p,
        reviews: revs,
        ratingBreakdown: { 5: 15, 4: 8, 3: 2, 2: 0, 1: 0 },
      };
    }
  } catch (e) {}

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
  } catch (err) {}
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
  } catch (err) {}
  return null;
};

/**
 * Submit user-generated community place DIRECTLY to Firebase Firestore 'places' collection!
 */
export const submitCommunityPlace = async (
  placeData: Partial<TouristPlace> & { bypassDuplicateCheck?: boolean }
): Promise<{ success: boolean; message: string; place?: TouristPlace; similarExists?: boolean; existingPlace?: TouristPlace }> => {
  try {
    const rawPlaceObj = {
      name: placeData.name?.trim() || 'Community Attraction',
      description: placeData.description?.trim() || '',
      category: placeData.category || 'Tourist Spots',
      latitude: placeData.latitude || 18.5204,
      longitude: placeData.longitude || 73.8567,
      address: placeData.address || 'Maharashtra, India',
      district: placeData.district || 'Pune',
      taluka: placeData.taluka || 'Central',
      village: placeData.village || 'Locality',
      city: placeData.city || placeData.district || 'Pune',
      state: 'Maharashtra',
      images: placeData.images && placeData.images.length > 0 ? placeData.images : ['https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'],
      ratingAvg: 5.0,
      ratingCount: 1,
      reviewCount: 1,
      openingHours: placeData.openingHours || '',
      entryFee: placeData.entryFee || '',
      contactNumber: placeData.contactNumber || '',
      website: placeData.website || '',
      bestTimeToVisit: placeData.bestTimeToVisit || '',
      facilities: placeData.facilities || [],
      safetyInfo: placeData.safetyInfo || '',
      source: 'COMMUNITY',
      status: 'APPROVED', // Immediately active and visible on map and list
      verified: true,
      userId: placeData.userId || 'anonymous',
      createdByName: placeData.userName || 'Local Resident',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sanitize object so no undefined values are passed to Firestore
    const cleanData = sanitizeFirestoreData(rawPlaceObj);

    // Save directly to Firebase Firestore collection 'places'
    const docRef = await addDoc(collection(db, 'places'), cleanData);
    const createdPlace: TouristPlace = { id: docRef.id, ...cleanData } as TouristPlace;

    // Async notify Render backend proxy
    try {
      fetch(getApiUrl('/api/tourism/places'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeData),
      }).catch(() => {});
    } catch (e) {}

    return {
      success: true,
      message: 'Place saved to Firebase Firestore and displayed on your map!',
      place: createdPlace,
    };
  } catch (err: any) {
    console.error('[tourismService] Firestore submit error:', err);
    return { success: false, message: 'Failed to save place to Firebase database.' };
  }
};

/**
 * Post user review & star rating to Firebase Firestore 'placeReviews'
 */
export const submitPlaceReview = async (
  placeId: string,
  reviewData: { rating: number; comment: string; userId?: string; userName?: string; images?: string[] }
): Promise<{ success: boolean; reviews?: PlaceReview[]; error?: string }> => {
  try {
    const revObj: PlaceReview = {
      id: `rev-${Date.now()}`,
      placeId,
      userId: reviewData.userId || 'anonymous',
      userName: reviewData.userName || 'Local Explorer',
      rating: reviewData.rating,
      comment: reviewData.comment,
      images: reviewData.images || [],
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'placeReviews'), sanitizeFirestoreData(revObj));

    const snap = await getDocs(collection(db, 'placeReviews'));
    const updatedRevs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as PlaceReview))
      .filter((r) => r.placeId === placeId);

    return { success: true, reviews: updatedRevs };
  } catch (err) {
    return { success: false, error: 'Failed to post review to Firebase database.' };
  }
};

/**
 * Submit place report to Firebase Firestore 'placeReports'
 */
export const submitPlaceReport = async (
  placeId: string,
  reportData: { reason: string; description: string; userId?: string }
): Promise<{ success: boolean; message?: string }> => {
  try {
    await addDoc(collection(db, 'placeReports'), sanitizeFirestoreData({
      placeId,
      reason: reportData.reason,
      description: reportData.description || '',
      userId: reportData.userId || 'anonymous',
      createdAt: new Date().toISOString(),
    }));
    return { success: true, message: 'Report saved to Firestore.' };
  } catch (err) {
    return { success: false };
  }
};

/**
 * Admin: Fetch pending place submissions
 */
export const fetchPendingPlaces = async (): Promise<TouristPlace[]> => {
  try {
    const snap = await getDocs(collection(db, 'places'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as TouristPlace))
      .filter((p) => p.status === 'PENDING');
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
