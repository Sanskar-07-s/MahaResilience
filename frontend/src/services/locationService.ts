/**
 * locationService.ts — Reusable location helper service.
 */

export interface LocationModel {
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  state: string;
  pincode?: string;
  accuracy?: number;
  timestamp: string;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  source: 'gps' | 'manual' | 'cache' | 'fallback';
}

const STORAGE_KEY = 'ch_active_location';

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const getSavedLocation = (): LocationModel | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const saveLocation = (loc: LocationModel): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch (_) {}
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<{ city: string; district: string; state: string; pincode?: string }> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const district =
        addr.state_district ||
        addr.district ||
        addr.county ||
        addr.city ||
        'Pune';
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        district;
      const state = addr.state || 'Maharashtra';
      const pincode = addr.postcode || '';
      return { city, district, state, pincode };
    }
  } catch (err) {
    console.warn('[locationService] Reverse geocode failed, using defaults:', err);
  }
  return { city: 'Pune', district: 'Pune', state: 'Maharashtra' };
};
