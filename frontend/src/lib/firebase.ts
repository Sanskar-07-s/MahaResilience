import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
