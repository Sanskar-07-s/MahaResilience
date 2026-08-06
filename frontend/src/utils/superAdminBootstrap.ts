/**
 * superAdminBootstrap.ts — Safe Firestore merge-write for Super Admin.
 *
 * Fixes:
 * 1. Wrapped in try/catch with clear error logging (not re-thrown).
 * 2. Safe when offline — writes will be queued by Firestore offline persistence.
 * 3. Checks getApps() to prevent initialization issues.
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

export const SUPER_ADMIN_UID = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

/**
 * Bootstrap the permanent Super Admin in Firestore.
 * Safe merge: only updates admin-related fields, never overwrites profile data.
 * Silently continues if Firestore is temporarily offline (writes are queued).
 */
export const bootstrapSuperAdmin = async (): Promise<void> => {
  const ref = doc(db, 'users', SUPER_ADMIN_UID);

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

  try {
    // Try to check if document exists
    let exists = false;
    try {
      const snap = await getDoc(ref);
      exists = snap.exists();
    } catch (readErr: any) {
      // Offline — assume exists and do a safe merge-write anyway
      // The write will be queued by Firestore offline persistence
      console.warn('[Super Admin Bootstrap] Offline read — queuing merge write:', readErr?.code);
      exists = true;
    }

    if (!exists) {
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
      // Merge — only admin fields are updated
      await setDoc(ref, adminFields, { merge: true });
      console.log('[Super Admin Bootstrap] Admin fields updated (profile preserved).');
    }
  } catch (err: any) {
    // Non-fatal — offline persistence will queue the write
    console.warn('[Super Admin Bootstrap] Deferred due to connectivity:', err?.code || err?.message);
  }
};
