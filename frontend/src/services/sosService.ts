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

/**
 * Synthesizes an emergency alarm sound using Web Audio API
 * Triggered strictly upon explicit user interaction (SOS button click)
 */
export const playEmergencySirenSound = (): void => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Siren oscillator 1 (high pitch sweep)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.linearRampToValueAtTime(900, now + 0.3);
    osc1.frequency.linearRampToValueAtTime(600, now + 0.6);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.8);
  } catch (_) {}
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
  contacts: string[]
): Promise<{ success: boolean; deliveryStatus: string; eventId?: string; message: string }> => {
  // Play emergency siren sound audio
  playEmergencySirenSound();

  let deliveryStatus: 'SENT' | 'SMS_SERVICE_NOT_CONFIGURED' | 'FAILED' = 'SMS_SERVICE_NOT_CONFIGURED';
  let statusMessage = 'SOS broadcast logged to Firestore.';

  // 1. Try SMS backend endpoint
  try {
    const url = getApiUrl('/api/sos/send');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        district,
        address,
        reporter: user?.name || 'Citizen User',
        emergencyContacts: contacts,
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
