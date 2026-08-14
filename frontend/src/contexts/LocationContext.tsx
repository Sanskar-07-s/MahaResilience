import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  state: string;
  district: string;
  city: string;
  taluka: string;
  ward: string;
  village: string;
  source: 'gps' | 'manual';
  locationLoading: boolean;
  locationError: string | null;
  isPermissionDenied: boolean;
}

export interface DistrictHierarchy {
  district: string;
  lat: number;
  lng: number;
  talukas: {
    name: string;
    wards: string[];
  }[];
}

export const MAHARASHTRA_DISTRICTS: DistrictHierarchy[] = [
  {
    district: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    talukas: [
      { name: 'Pune City', wards: ['Shivajinagar', 'Kothrud', 'Erandwane', 'Pashan', 'Aundh', 'Hadapsar', 'Viman Nagar', 'Camp'] },
      { name: 'Haveli', wards: ['Wakad', 'Hinjawadi', 'Pimple Saudagar', 'Bhosari', 'Nigdi'] },
      { name: 'Baramati', wards: ['Town Center', 'MIDC Phase 1', 'Katphal', 'Songaon'] },
      { name: 'Shirur', wards: ['Ranjangaon', 'Sanaswadi', 'Nabalag', 'Talegaon Dhamdhere'] },
      { name: 'Maval', wards: ['Lonavala', 'Talaegaon Dabhade', 'Kamshet', 'Kanhe'] },
    ],
  },
  {
    district: 'Mumbai Suburban',
    lat: 19.0760,
    lng: 72.8777,
    talukas: [
      { name: 'Andheri', wards: ['Bandra West', 'Bandra East', 'Juhu', 'Versova', 'Lokhandwala', 'Marol'] },
      { name: 'Borivali', wards: ['Malad West', 'Kandivali East', 'Gorai', 'Dahisar', 'IC Colony'] },
      { name: 'Kurla', wards: ['Ghatkopar West', 'Powai', 'Chembur', 'Vidyavihar', 'Tilak Nagar'] },
    ],
  },
  {
    district: 'Mumbai City',
    lat: 18.9388,
    lng: 72.8353,
    talukas: [
      { name: 'Colaba', wards: ['Fort', 'Marine Drive', 'Nariman Point', 'Churchgate'] },
      { name: 'Dadar', wards: ['Parel', 'Wadala', 'Sion', 'Prabhadevi', 'Mahim'] },
    ],
  },
  {
    district: 'Nagpur',
    lat: 21.1458,
    lng: 79.0882,
    talukas: [
      { name: 'Nagpur Urban', wards: ['Sitabuldi', 'Dharampeth', 'Civil Lines', 'Hanuman Nagar', 'Sadar'] },
      { name: 'Nagpur Rural', wards: ['Kamptee', 'Hingna', 'Kalameshwar', 'Mahadula'] },
    ],
  },
  {
    district: 'Nashik',
    lat: 19.9975,
    lng: 73.7898,
    talukas: [
      { name: 'Nashik City', wards: ['Panchavati', 'College Road', 'Indira Nagar', 'Satpur', 'CIDCO'] },
      { name: 'Malegaon', wards: ['Camp Area', 'Sangameshwar', 'Soygaon', 'Mausam Pool'] },
    ],
  },
  {
    district: 'Kolhapur',
    lat: 16.7050,
    lng: 74.2433,
    talukas: [
      { name: 'Karveer', wards: ['Rajarampuri', 'Shahupuri', 'Rankala', 'Tarabai Park', 'Nagala Park'] },
      { name: 'Ichalkaranji', wards: ['Jawahar Nagar', 'Vikram Nagar', 'Industrial Area'] },
    ],
  },
  {
    district: 'Chhatrapati Sambhajinagar',
    lat: 19.8762,
    lng: 75.3433,
    talukas: [
      { name: 'Aurangabad City', wards: ['CIDCO', 'Nirala Bazar', 'Kranti Chowk', 'Garkheda', 'Padampura'] },
    ],
  },
  {
    district: 'Thane',
    lat: 19.2183,
    lng: 72.9781,
    talukas: [
      { name: 'Thane Urban', wards: ['Ghodbunder Road', 'Naupada', 'Vartak Nagar', 'Kopri', 'Majiwada'] },
      { name: 'Kalyan-Dombivli', wards: ['Kalyan West', 'Dombivli East', 'Thakurli', 'Titaghar'] },
    ],
  },
];

/**
 * Calculates Haversine distance in kilometers between two GPS points
 */
export function haversineDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number,
  lon2: number
): number {
  if (lat1 === null || lon1 === null) return 0;
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
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

interface LocationContextType extends LocationData {
  detectLocation: () => Promise<void>;
  requestGpsLocation: () => Promise<void>;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  isFirstVisitPromptOpen: boolean;
  setIsFirstVisitPromptOpen: (open: boolean) => void;
  setManualLocation: (loc: {
    state?: string;
    district: string;
    city?: string;
    taluka?: string;
    ward?: string;
    village?: string;
    lat?: number;
    lng?: number;
  }) => void;
  refreshLocation: () => void;
}

const STORAGE_KEY = 'community_hub_location';

const DEFAULT_LOCATION: LocationData = {
  latitude: 18.5204,
  longitude: 73.8567,
  state: 'Maharashtra',
  district: 'Pune',
  city: 'Pune',
  taluka: 'Pune City',
  ward: 'Shivajinagar',
  village: 'Shivajinagar',
  source: 'gps',
  locationLoading: false,
  locationError: null,
  isPermissionDenied: false,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstVisitPromptOpen, setIsFirstVisitPromptOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return false;
    }
  });

  const [location, setLocation] = useState<LocationData>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}
    return DEFAULT_LOCATION;
  });

  const saveLocationToCache = (newLoc: LocationData) => {
    setLocation(newLoc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
    } catch (_) {}
  };

  /**
   * Finds closest Maharashtra district from given coordinates
   */
  const findClosestDistrict = (lat: number, lng: number) => {
    let closest = MAHARASHTRA_DISTRICTS[0];
    let minDist = Infinity;
    for (const dist of MAHARASHTRA_DISTRICTS) {
      const d = haversineDistance(lat, lng, dist.lat, dist.lng);
      if (d < minDist) {
        minDist = d;
        closest = dist;
      }
    }
    return closest;
  };

  /**
   * Reverse geocode GPS coordinates to city/district
   */
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const state = addr.state || 'Maharashtra';
        const district = (addr.state_district || addr.county || addr.city_district || '').replace(' District', '') || findClosestDistrict(lat, lng).district;
        const city = addr.city || addr.town || addr.municipality || addr.suburb || district;
        const taluka = addr.suburb || addr.taluk || addr.county || city;
        const ward = addr.neighbourhood || addr.suburb || addr.quarter || 'Central Ward';

        return { state, district, city, taluka, ward, village: ward };
      }
    } catch (_) {}

    // Fallback to spatial proximity match
    const match = findClosestDistrict(lat, lng);
    return {
      state: 'Maharashtra',
      district: match.district,
      city: match.district + ' City',
      taluka: match.talukas[0].name,
      ward: match.talukas[0].wards[0],
      village: match.talukas[0].wards[0],
    };
  };

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        locationLoading: false,
        locationError: 'Geolocation is not supported by your browser.',
        isPermissionDenied: true,
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, locationLoading: true, locationError: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const geoDetails = await reverseGeocode(lat, lng);

        saveLocationToCache({
          latitude: lat,
          longitude: lng,
          state: geoDetails.state,
          district: geoDetails.district,
          city: geoDetails.city,
          taluka: geoDetails.taluka,
          ward: geoDetails.ward,
          village: geoDetails.village,
          source: 'gps',
          locationLoading: false,
          locationError: null,
          isPermissionDenied: false,
        });
      },
      (error) => {
        // Quiet fallback to Pune default or cached location on timeout/permission denial
        setLocation((prev) => ({
          ...prev,
          source: 'manual',
          locationLoading: false,
          locationError: null,
          isPermissionDenied: error.code === error.PERMISSION_DENIED,
        }));
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
    );
  }, []);

  const setManualLocation = useCallback(
    ({
      state = 'Maharashtra',
      district,
      city,
      taluka,
      ward,
      village,
      lat,
      lng,
    }: {
      state?: string;
      district: string;
      city?: string;
      taluka?: string;
      ward?: string;
      village?: string;
      lat?: number;
      lng?: number;
    }) => {
      const match = MAHARASHTRA_DISTRICTS.find((d) => d.district.toLowerCase() === district.toLowerCase()) || MAHARASHTRA_DISTRICTS[0];

      const targetLat = lat ?? match.lat;
      const targetLng = lng ?? match.lng;
      const targetTaluka = taluka || match.talukas[0].name;
      const targetWard = ward || match.talukas[0].wards[0];
      const targetCity = city || district + ' City';

      saveLocationToCache({
        latitude: targetLat,
        longitude: targetLng,
        state,
        district: match.district,
        city: targetCity,
        taluka: targetTaluka,
        ward: targetWard,
        village: village || targetWard,
        source: 'manual',
        locationLoading: false,
        locationError: null,
        isPermissionDenied: false,
      });
    },
    []
  );

  const refreshLocation = useCallback(() => {
    if (location.source === 'gps') {
      detectLocation();
    } else {
      // Re-trigger reverse geocode or refresh
      saveLocationToCache({ ...location });
    }
  }, [location, detectLocation]);

  // Attempt auto-detect once on mount if source was GPS
  useEffect(() => {
    if (location.source === 'gps') {
      detectLocation();
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        ...location,
        detectLocation,
        requestGpsLocation: detectLocation,
        permissionStatus: location.isPermissionDenied ? 'denied' : 'granted',
        isFirstVisitPromptOpen,
        setIsFirstVisitPromptOpen,
        setManualLocation,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return ctx;
};
