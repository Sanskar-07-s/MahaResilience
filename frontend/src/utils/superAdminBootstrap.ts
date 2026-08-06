import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

const SUPER_ADMIN_UID = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

/**
 * Bootstrap the permanent Super Admin in Firestore.
 * Safe merge: only updates admin-related fields, never overwrites profile data.
 */
export const bootstrapSuperAdmin = async (): Promise<void> => {
  const ref = doc(db, 'users', SUPER_ADMIN_UID);

  try {
    const snap = await getDoc(ref);

    const adminFields = {
      uid: SUPER_ADMIN_UID,
      role: 'SUPER_ADMIN',
      displayRole: 'Super Administrator',
      isAdmin: true,
      permissions: ['*'],
      verified: true,
      accountStatus: 'ACTIVE',
      createdBy: 'SYSTEM',
      updatedAt: new Date().toISOString(),
    };

    if (!snap.exists()) {
      // Create minimal document, profile will be filled on first login
      await setDoc(ref, {
        ...adminFields,
        email: '',
        name: 'Super Administrator',
        language: 'en',
        theme: 'dark',
        notificationsEnabled: true,
        locationPermission: true,
        accessibilityMode: false,
        isEmailVerified: false,
        isPhoneVerified: false,
        isProfileComplete: false,
        emergencyContactsConfigured: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
      console.log('[Super Admin Bootstrap] Document created in Firestore.');
    } else {
      // Merge update — only admin fields, NEVER overwrite profile
      await setDoc(ref, adminFields, { merge: true });
      console.log('[Super Admin Bootstrap] Document updated with admin fields (profile preserved).');
    }
  } catch (err) {
    console.error('[Super Admin Bootstrap Error]:', err);
  }
};
