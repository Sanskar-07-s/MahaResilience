/**
 * AlertContext.tsx — Resilient Location-Aware Geographic Alert Engine for MahaResilience
 *
 * Geographic Filtering Rules:
 * 1. Consumes global LocationContext (`district`, `city`, `ward`, `latitude`, `longitude`).
 * 2. `isAlertRelevantToLocation`: Strict geographic evaluator. An alert is local ONLY IF:
 *    - `scope === 'STATEWIDE'` or `scope === 'NATIONAL'` or `district === 'All Districts'`, OR
 *    - `alert.district` matches user's active `district` (e.g. Kolhapur vs Pune), OR
 *    - `alert.city`/`ward` matches active city/ward, OR
 *    - Haversine distance from user coordinates is <= `alert.radiusKm`.
 * 3. `localAlerts`: Alerts affecting the active user location ONLY.
 * 4. `broaderAlerts`: Alerts from other areas (routed to notifications drawer).
 * 5. `activeCriticalAlert`: Populated ONLY if a valid critical alert affects active location.
 *    (e.g., Kolhapur user NEVER sees Pune flood alert on main banner/overlay).
 * 6. Dismissed alerts (`dismissedAlertIds`) persist in localStorage to prevent repeat overlays.
 * 7. Sound repeat control (`soundRepeat`, default OFF). Alarm sound plays ONCE per new alert ID.
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
  ward?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  scope?: 'LOCALITY' | 'WARD' | 'VILLAGE' | 'CITY' | 'TALUKA' | 'DISTRICT' | 'RADIUS' | 'STATE' | 'STATEWIDE' | 'NATIONAL';
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  expiresAt?: string;
  createdBy?: string;
  officialLink: string;
}

interface AlertContextType {
  alerts: DisasterAlert[];
  localAlerts: DisasterAlert[];
  broaderAlerts: DisasterAlert[];
  activeCriticalAlert: DisasterAlert | null;
  dismissCriticalAlert: (alertId?: string) => void;
  isLoading: boolean;
  soundEnabled: boolean;
  soundRepeat: boolean;
  toggleAlertSounds: () => void;
  toggleSoundRepeat: () => void;
  triggerAlarmSound: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// ─── Seed Alerts with Exact Geographic Tagging ────────────────────────────────
const SEED_ALERTS: DisasterAlert[] = [
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
    city: 'Kolhapur',
    latitude: 16.705,
    longitude: 74.2433,
    radiusKm: 35,
    scope: 'DISTRICT',
    status: 'ACTIVE',
    officialLink: 'https://sachet.ndma.gov.in',
  },
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
    city: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    radiusKm: 40,
    scope: 'DISTRICT',
    status: 'ACTIVE',
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
    city: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882,
    radiusKm: 50,
    scope: 'DISTRICT',
    status: 'ACTIVE',
    officialLink: 'https://sachet.ndma.gov.in',
  },
  {
    id: 'seed-mumbai-1',
    title: 'WEATHER ADVISORY: Mumbai Suburban Heavy Rainfall',
    description:
      'Moderate to heavy rain showers predicted over next 24 hours. Traffic diversions active on Eastern Express Highway.',
    publishedDate: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    severity: 'MEDIUM',
    category: 'WEATHER',
    state: 'MAHARASHTRA',
    district: 'Mumbai Suburban',
    city: 'Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    radiusKm: 30,
    scope: 'DISTRICT',
    status: 'ACTIVE',
    officialLink: 'https://sachet.ndma.gov.in',
  },
];

/**
 * Single Reusable Geographic Alert Relevance Evaluator
 */
export const isAlertRelevantToLocation = (
  alert: DisasterAlert,
  loc: { district?: string; city?: string; ward?: string; latitude?: number | null; longitude?: number | null }
): boolean => {
  if (!loc.district || !loc.district.trim()) {
    // If user's location is not determined, match ONLY genuine statewide/national alerts
    const scope = (alert.scope || '').toUpperCase();
    return scope === 'STATE' || scope === 'STATEWIDE' || scope === 'NATIONAL' || alert.district === 'All Districts';
  }

  const uDist = loc.district.toLowerCase().trim();
  const uCity = (loc.city || '').toLowerCase().trim();
  const uWard = (loc.ward || '').toLowerCase().trim();

  const alertDist = (alert.district || '').toLowerCase().trim();
  const alertCity = (alert.city || '').toLowerCase().trim();
  const alertWard = (alert.ward || '').toLowerCase().trim();
  const alertScope = (alert.scope || '').toUpperCase().trim();

  // 1. Statewide / National alerts
  if (
    alertScope === 'STATE' ||
    alertScope === 'STATEWIDE' ||
    alertScope === 'NATIONAL' ||
    alertDist === 'all districts' ||
    alertDist === 'maharashtra'
  ) {
    return true;
  }

  // 2. Haversine Distance Check if coordinates exist on both
  if (loc.latitude != null && loc.longitude != null && alert.latitude != null && alert.longitude != null) {
    const distKm = haversineDistance(loc.latitude, loc.longitude, alert.latitude, alert.longitude);
    const maxRadius = alert.radiusKm || 35;
    if (distKm <= maxRadius) return true;
  }

  // 3. Exact Ward match
  if (uWard && alertWard && uWard === alertWard) return true;

  // 4. Exact City match
  if (uCity && alertCity && uCity === alertCity) return true;

  // 5. District match
  if (alertDist && (alertDist === uDist || alertDist.includes(uDist) || uDist.includes(alertDist))) {
    return true;
  }

  return false;
};

// Cache helpers
const cacheAlertsToIDB = async (alertsList: DisasterAlert[]) => {
  try {
    for (let i = 0; i < alertsList.length; i++) {
      await putData('alerts', { id: String(i), ...alertsList[i] });
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
  const { latitude, longitude, district, city, ward } = useLocation();

  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState<DisasterAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mr_sound_enabled') === 'true';
  });
  const [soundRepeat, setSoundRepeat] = useState<boolean>(() => {
    return localStorage.getItem('mr_sound_repeat') === 'true';
  });

  const hasFirestoreData = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playedAlertIdsRef = useRef<Set<string>>(new Set());

  // Track dismissed alert IDs in localStorage to prevent repeat popups
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mr_dismissed_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveDismissedIds = (ids: string[]) => {
    setDismissedIds(ids);
    try {
      localStorage.setItem('mr_dismissed_alerts', JSON.stringify(ids));
    } catch (_) {}
  };

  const toggleAlertSounds = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('mr_sound_enabled', next ? 'true' : 'false');
      if (next) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
            if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume().catch(() => {});
          }
        } catch (_) {}
      }
      return next;
    });
  };

  const toggleSoundRepeat = () => {
    setSoundRepeat((prev) => {
      const next = !prev;
      localStorage.setItem('mr_sound_repeat', next ? 'true' : 'false');
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
        gain.gain.setValueAtTime(0.25, start);
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

  // ─── Filter local vs broader alerts using strict algorithm ─────────────────
  const localAlerts = alerts.filter((a) =>
    isAlertRelevantToLocation(a, { district, city, ward, latitude, longitude })
  );

  const broaderAlerts = alerts.filter(
    (a) => !isAlertRelevantToLocation(a, { district, city, ward, latitude, longitude })
  );

  // ─── Evaluate activeCriticalAlert strictly for active location ──────────────
  useEffect(() => {
    const activeLoc = { district, city, ward, latitude, longitude };
    const criticalCandidate = localAlerts.find((a) => {
      if (a.status === 'EXPIRED' || a.status === 'CANCELLED') return false;
      const isCrit = a.severity === 'CRITICAL' || a.severity === 'HIGH';
      const isNotDismissed = a.id ? !dismissedIds.includes(a.id) : true;
      return isCrit && isNotDismissed && isAlertRelevantToLocation(a, activeLoc);
    });

    if (criticalCandidate) {
      const alertId = criticalCandidate.id || criticalCandidate.title;
      setActiveCriticalAlert(criticalCandidate);

      // Play alert sound ONCE per alert ID unless repeat is ON
      if (!playedAlertIdsRef.current.has(alertId) || soundRepeat) {
        triggerAlarmSound();
        playedAlertIdsRef.current.add(alertId);
      }
    } else {
      setActiveCriticalAlert(null);
    }
  }, [district, city, ward, latitude, longitude, alerts, dismissedIds, soundRepeat]);

  const dismissCriticalAlert = (targetId?: string) => {
    const idToDismiss = targetId || activeCriticalAlert?.id || activeCriticalAlert?.title;
    if (idToDismiss) {
      saveDismissedIds([...dismissedIds.filter((id) => id !== idToDismiss), idToDismiss]);
    }
    setActiveCriticalAlert(null);
  };

  // ─── Firestore Stream & Fallback Listeners ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;

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
              title: data.title || 'Disaster Alert',
              description: data.description || '',
              publishedDate: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
              severity:
                data.priority === 'Critical' || data.severity === 'CRITICAL'
                  ? 'CRITICAL'
                  : data.priority === 'High' || data.severity === 'HIGH'
                  ? 'HIGH'
                  : data.priority === 'Low' || data.severity === 'LOW'
                  ? 'LOW'
                  : 'MEDIUM',
              category: data.category || 'GENERAL',
              state: data.state || 'MAHARASHTRA',
              district: data.district || undefined,
              city: data.city || undefined,
              ward: data.ward || undefined,
              latitude: data.latitude || undefined,
              longitude: data.longitude || undefined,
              radiusKm: data.radiusKm || 35,
              scope: data.scope || 'DISTRICT',
              status: data.status || 'ACTIVE',
              expiresAt: data.expiresAt || undefined,
              createdBy: data.createdBy || undefined,
              officialLink: data.officialLink || 'https://sachet.ndma.gov.in',
            };
          });
          setAlerts(firestoreAlerts);
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('[Alert Engine] Firestore stream notice:', err);
      }
    );

    const loadFallback = async () => {
      await new Promise<void>((r) => setTimeout(r, 1200));
      if (!isMounted || hasFirestoreData.current) return;

      const cachedData = await getAlertsFromIDB();
      if (isMounted && cachedData.length > 0) {
        setAlerts(cachedData);
        setIsLoading(false);
        return;
      }

      if (isMounted) {
        setAlerts(SEED_ALERTS);
        setIsLoading(false);
      }
    };

    loadFallback();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
        soundRepeat,
        toggleAlertSounds,
        toggleSoundRepeat,
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
