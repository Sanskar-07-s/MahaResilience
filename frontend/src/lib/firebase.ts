import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'mock-auth-domain.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || 'mock-sender-id',
  appId: metaEnv.VITE_FIREBASE_APP_ID || 'mock-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
