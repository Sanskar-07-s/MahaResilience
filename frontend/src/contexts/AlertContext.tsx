/**
 * AlertContext.tsx — Resilient Location-Aware Geographic Alert Engine
 *
 * Key fixes:
 * 1. Consumes LocationContext (`district`, `latitude`, `longitude`) for real-time geographic filtering.
 * 2. `localAlerts`: Contains ONLY alerts matching active user location (District, City, Haversine radius, or Statewide).
 * 3. `broaderAlerts`: Notifications for other districts (moved to Notifications drawer).
 * 4. `activeCriticalAlert`: Populated ONLY if a critical alert affects the active user location.
 *    (e.g., Kolhapur user never sees Pune flood alert on main banner).
 * 5. Real-time Firestore stream + API + IDB + Seed fallback.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { getAllData, putData } from '../utils/db.ts';
import { useLocation, haversineDistance } from './LocationContext.tsx';

export interface DisasterAlert {
  id?: string;
  title: string;
  description: string;
  publishedDate: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  state: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  officialLink: string;
}

interface AlertContextType {
  alerts: DisasterAlert[];
  localAlerts: DisasterAlert[];
  broaderAlerts: DisasterAlert[];
  activeCriticalAlert: DisasterAlert | null;
  dismissCriticalAlert: () => void;
  isLoading: boolean;
  soundEnabled: boolean;
  toggleAlertSounds: () => void;
  triggerAlarmSound: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// ─── Hardcoded seed alerts ────────────────────────────────────────────────────
const SEED_ALERTS: DisasterAlert[] = [
  {
    id: 'seed-pune-1',
    title: 'RED ALERT: Severe Flooding Warning for Pune-East',
    description:
      'Mutha river discharge exceeded critical limits. Heavy rainfall expected in next 6 hours. Residents near river beds must evacuate immediately to safe shelters.',
    publishedDate: new Date().toISOString(),
    severity: 'CRITICAL',
    category: 'FLOOD',
    state: 'MAHARASHTRA',
    district: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    radiusKm: 40,
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    id: 'seed-kolhapur-1',
    title: 'MONSOON ADVISORY: Kolhapur Panchganga River Level Warning',
    description:
      'Panchganga river level at Rajaram Weir approaching warning threshold. Low-lying areas in Karveer and Prayag Chikhali on alert.',
    publishedDate: new Date().toISOString(),
    severity: 'HIGH',
    category: 'FLOOD',
    state: 'MAHARASHTRA',
    district: 'Kolhapur',
    latitude: 16.705,
    longitude: 74.2433,
    radiusKm: 35,
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    id: 'seed-nagpur-1',
    title: 'HEATWAVE WARNING: Nagpur District',
    description:
      'Nagpur and adjacent Vidarbha districts are experiencing peak temperatures up to 46°C. Keep hydrated and avoid direct sunlight between 12 PM–4 PM.',
    publishedDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    severity: 'CRITICAL',
    category: 'HEATWAVE',
    state: 'MAHARASHTRA',
    district: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882,
    radiusKm: 50,
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    id: 'seed-mumbai-1',
    title: 'WEATHER ADVISORY: Mumbai Suburban Rainfall',
    description:
      'Moderate to heavy rain showers predicted over next 24 hours. Traffic diversions active on Eastern Express Highway.',
    publishedDate: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    severity: 'MEDIUM',
    category: 'WEATHER',
    state: 'MAHARASHTRA',
    district: 'Mumbai Suburban',
    latitude: 19.076,
    longitude: 72.8777,
    radiusKm: 30,
    officialLink: 'https://sachet.ndma.gov.in',
  },
];

// ─── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
const cacheAlertsToIDB = async (alerts: DisasterAlert[]) => {
  try {
    for (let i = 0; i < alerts.length; i++) {
      await putData('alerts', { id: String(i), ...alerts[i] });
    }
  } catch (_) {}
};

const getAlertsFromIDB = async (): Promise<DisasterAlert[]> => {
  try {
    const rows = await getAllData('alerts');
    return rows.map(({ id, ...rest }) => rest as DisasterAlert);
  } catch (_) {
    return [];
  }
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { latitude, longitude, district, city } = useLocation();

  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState<DisasterAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const hasFirestoreData = useRef(false);

  // ─── Audio Context for Sirens ─────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleAlertSounds = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContextClass();
            }
            if (audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume().catch(() => {});
            }
          }
        } catch (_) {}
      }
      return next;
    });
  };

  const triggerAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (ctx.state !== 'running') return;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(523.25, ctx.currentTime, 0.4);
      playTone(659.25, ctx.currentTime + 0.2, 0.4);
      playTone(783.99, ctx.currentTime + 0.4, 0.6);
    } catch (_) {}
  };

  // ─── Geographic Relevance Checker ─────────────────────────────────────────
  const isAlertRelevant = useCallback(
    (alert: DisasterAlert): boolean => {
      if (!district) return true;
      const uDist = district.toLowerCase().trim();
      const alertDist = (alert.district || alert.state || '').toLowerCase().trim();
      const alertTitle = (alert.title || '').toLowerCase();
      const alertDesc = (alert.description || '').toLowerCase();

      // 1. Statewide / All Districts
      if (
        alertDist === 'all districts' ||
        alertDist === 'maharashtra' ||
        alertDist === 'statewide' ||
        alertDist === 'all'
      ) {
        return true;
      }

      // 2. District Match
      if (alertDist.includes(uDist) || uDist.includes(alertDist)) {
        return true;
      }

      // 3. Title / Description mentions active district or city
      if (
        alertTitle.includes(uDist) ||
        alertDesc.includes(uDist) ||
        (city && alertTitle.includes(city.toLowerCase()))
      ) {
        return true;
      }

      // 4. Coordinates Haversine Distance Check
      if (latitude !== null && longitude !== null && alert.latitude && alert.longitude) {
        const distKm = haversineDistance(latitude, longitude, alert.latitude, alert.longitude);
        const radKm = alert.radiusKm || 50;
        if (distKm <= radKm) return true;
      }

      return false;
    },
    [district, city, latitude, longitude]
  );

  const localAlerts = alerts.filter(isAlertRelevant);
  const broaderAlerts = alerts.filter((a) => !isAlertRelevant(a));

  // ─── Update activeCriticalAlert dynamically when location or localAlerts change
  useEffect(() => {
    const critical = localAlerts.find(
      (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH'
    );
    if (critical) {
      setActiveCriticalAlert((prev) => {
        if (prev?.title !== critical.title) {
          triggerAlarmSound();
          return critical;
        }
        return prev;
      });
    } else {
      setActiveCriticalAlert(null);
    }
  }, [district, latitude, longitude, alerts]);

  // ─── Process and set raw alerts ───────────────────────────────────────────
  const applyAlerts = (data: DisasterAlert[], source: string) => {
    if (!data || data.length === 0) return;
    console.info(`[Alert Engine] Loaded ${data.length} alerts from ${source}`);
    setAlerts(data);
  };

  // ─── Backend API fetch ───────────────────────────────────────────────────
  const fetchFromAPI = async (): Promise<DisasterAlert[] | null> => {
    const baseUrl = (import.meta as any).env?.VITE_API_URL ?? '';
    const url = `${baseUrl}/api/alerts?state=maharashtra`;
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) return null;
      const text = await response.text();
      if (!text) return null;
      const data = JSON.parse(text) as DisasterAlert[];
      await cacheAlertsToIDB(data);
      return data;
    } catch (_) {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // ─── 1. Firestore Stream
    const unsubscribe = onSnapshot(
      query(collection(db, 'alerts'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          hasFirestoreData.current = true;
          const firestoreAlerts: DisasterAlert[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || 'Alert',
              description: data.description || '',
              publishedDate:
                typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
              severity:
                data.priority === 'Critical'
                  ? 'CRITICAL'
                  : data.priority === 'High'
                  ? 'HIGH'
                  : data.priority === 'Low'
                  ? 'LOW'
                  : 'MEDIUM',
              category: data.category || 'GENERAL',
              state: data.state || 'MAHARASHTRA',
              district: data.district || data.state || 'Pune',
              latitude: data.latitude || undefined,
              longitude: data.longitude || undefined,
              radiusKm: data.radiusKm || 50,
              officialLink: 'https://sachet.ndma.gov.in',
            };
          });
          applyAlerts(firestoreAlerts, 'Firestore');
          setIsLoading(false);
        }
      },
      () => {}
    );

    // ─── 2. Fallbacks
    const loadFallback = async () => {
      await new Promise<void>((r) => setTimeout(r, 1500));
      if (!isMounted || hasFirestoreData.current) return;

      const apiData = await fetchFromAPI();
      if (isMounted && apiData && apiData.length > 0) {
        applyAlerts(apiData, 'API');
        setIsLoading(false);
        return;
      }

      const cachedData = await getAlertsFromIDB();
      if (isMounted && cachedData.length > 0) {
        applyAlerts(cachedData, 'IndexedDB cache');
        setIsLoading(false);
        return;
      }

      if (isMounted) {
        applyAlerts(SEED_ALERTS, 'seed');
        setIsLoading(false);
      }
    };

    loadFallback();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const dismissCriticalAlert = () => setActiveCriticalAlert(null);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        localAlerts,
        broaderAlerts,
        activeCriticalAlert,
        dismissCriticalAlert,
        isLoading,
        soundEnabled,
        toggleAlertSounds,
        triggerAlarmSound,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useDisasterAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useDisasterAlerts must be used inside AlertProvider');
  return context;
};

export const useAlert = useDisasterAlerts;
