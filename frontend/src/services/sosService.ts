/**
 * sosService.ts — Production Emergency SOS Engine & Audio Siren Launcher
 *
 * Saves `sosEvents` records directly to Firestore (`sosEvents`).
 * Calls backend `/api/sos/send`. If backend SMS provider (Twilio/Fast2SMS) is not configured,
 * handles gracefully with `deliveryStatus: 'SMS_SERVICE_NOT_CONFIGURED'`.
 */

import { db } from '../lib/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';
import { getApiUrl } from '../config/api.config.ts';

export interface SOSEvent {
  id?: string;
  userId: string;
  userName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  emergencyContacts: string[];
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  deliveryStatus: 'SENT' | 'SMS_SERVICE_NOT_CONFIGURED' | 'FAILED';
}

let sirenAudioCtx: AudioContext | null = null;
let sirenIntervalId: any = null;

/**
 * Synthesizes a continuous, repetitive emergency alarm siren sound using Web Audio API
 * Repeatedly sweeps frequency between 600Hz and 1200Hz until stopped.
 */
export const playEmergencySirenSound = (): void => {
  try {
    stopEmergencySirenSound();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    sirenAudioCtx = new AudioContextClass();
    if (sirenAudioCtx.state === 'suspended') {
      sirenAudioCtx.resume().catch(() => {});
    }

    const playTone = () => {
      if (!sirenAudioCtx || sirenAudioCtx.state === 'closed') return;
      const now = sirenAudioCtx.currentTime;

      const osc = sirenAudioCtx.createOscillator();
      const gain = sirenAudioCtx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.58);

      osc.connect(gain);
      gain.connect(sirenAudioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    };

    playTone();
    sirenIntervalId = setInterval(playTone, 600);
  } catch (_) {}
};

/**
 * Stops repetitive emergency siren sound
 */
export const stopEmergencySirenSound = (): void => {
  if (sirenIntervalId) {
    clearInterval(sirenIntervalId);
    sirenIntervalId = null;
  }
  if (sirenAudioCtx) {
    try {
      sirenAudioCtx.close().catch(() => {});
    } catch (_) {}
    sirenAudioCtx = null;
  }
};

/**
 * Triggers SOS workflow:
 * 1. Creates `sosEvents` record in Firestore
 * 2. Attempts backend SMS API
 * 3. Plays emergency siren audio
 */
export const triggerEmergencySOS = async (
  lat: number,
  lng: number,
  district: string,
  address: string,
  user: any,
  contacts: string[],
  emails?: string[]
): Promise<{ success: boolean; deliveryStatus: string; eventId?: string; message: string }> => {
  // Play emergency siren sound audio
  playEmergencySirenSound();

  let deliveryStatus: 'SENT' | 'SMS_SERVICE_NOT_CONFIGURED' | 'FAILED' = 'SMS_SERVICE_NOT_CONFIGURED';
  let statusMessage = 'SOS broadcast logged to Firestore.';

  // 1. Try SMS & Email backend endpoint
  try {
    const url = getApiUrl('/api/sms/sos');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        location: `${lat}, ${lng}`,
        district,
        address,
        reporter: user?.name || 'Citizen User',
        email: user?.email || '',
        emergencyContacts: contacts,
        emergencyEmails: emails || [],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.smsSent) {
        deliveryStatus = 'SENT';
        statusMessage = 'Emergency SMS sent to contacts and local authorities.';
      } else {
        deliveryStatus = 'SMS_SERVICE_NOT_CONFIGURED';
        statusMessage = 'SMS service is not configured. Local emergency call active.';
      }
    }
  } catch (err) {
    console.warn('[SOS Engine] SMS Backend endpoint unavailable, falling back to Firestore event.');
  }

  // 2. Write SOS Event document directly to Firestore `sosEvents`
  try {
    const sosDoc: Omit<SOSEvent, 'id'> = {
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Local Citizen',
      timestamp: new Date().toISOString(),
      latitude: lat,
      longitude: lng,
      address,
      district,
      emergencyContacts: contacts.length > 0 ? contacts : ['112'],
      status: 'ACTIVE',
      deliveryStatus,
    };

    const docRef = await addDoc(collection(db, 'sosEvents'), sosDoc);
    return {
      success: true,
      deliveryStatus,
      eventId: docRef.id,
      message: statusMessage,
    };
  } catch (err: any) {
    console.error('[SOS Engine] Firestore write error:', err);
    return {
      success: false,
      deliveryStatus,
      message: 'Failed to record SOS event in database.',
    };
  }
};
