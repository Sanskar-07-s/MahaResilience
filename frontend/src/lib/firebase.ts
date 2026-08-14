/**
 * firebase.ts — Firebase initialization with full offline persistence.
 *
 * Key fixes:
 * 1. Uses initializeFirestore() instead of getFirestore() to enable
 *    IndexedDB offline persistence from the start (not as an addon).
 * 2. persistentLocalCache with persistentMultipleTabManager() supports
 *    multiple browser tabs and reads work even when offline.
 * 3. All service initializations are guarded against browser-only APIs.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyDRYv7HlvD8EzPHXpS-yLh2g2u56QRrbiY',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'mahareilience.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'mahareilience',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'mahareilience.firebasestorage.app',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '378865034465',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:378865034465:web:e081b4889e0a994d2e83a0',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || 'G-0PR4LPCMLN',
};

// Prevent duplicate app initialization (important for HMR / Vite dev mode)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

if ((import.meta as any).env?.DEV) {
  console.log('[Firebase] Initialized with config projectId:', firebaseConfig.projectId);
}

export const auth = getAuth(app);

// ─── Firestore with full offline persistence ──────────────────────────────────
// initializeFirestore lets us set the cache layer at initialization time.
// persistentLocalCache uses IndexedDB so reads/writes work when the device
// is offline or has intermittent connectivity.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage = getStorage(app);

// ─── Safe Analytics (browser-only, non-blocking) ──────────────────────────────
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => {});
}

// ─── Safe Firebase Cloud Messaging ───────────────────────────────────────────
export let messaging: any = null;
if (typeof window !== 'undefined') {
  isMessagingSupported()
    .then((supported) => {
      if (supported) messaging = getMessaging(app);
    })
    .catch(() => {});
}

export default app;
