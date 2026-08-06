import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import {
  UserProfile,
  LoginHistoryItem,
  VerificationLog,
  UserSession,
  DeviceToken,
  EmergencyContactItem,
  UserPreferences,
  AuditLog,
  SecurityLog
} from '../../types/user.ts';
import { getDeviceInfo } from '../../utils/deviceDetector.ts';

// ==================== USER PROFILE METHODS ====================

export const createOrUpdateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);

  const now = new Date().toISOString();

  if (!docSnap.exists()) {
    const defaultProfile: UserProfile = {
      uid,
      name: data.name || 'Citizen User',
      email: data.email || '',
      phone: data.phone || '',
      photoURL: data.photoURL || '',
      role: data.role || 'CITIZEN',
      language: data.language || 'en',
      theme: data.theme || 'light',
      notificationsEnabled: data.notificationsEnabled ?? true,
      locationPermission: data.locationPermission ?? false,
      accessibilityMode: data.accessibilityMode ?? false,
      district: data.district || '',
      taluka: data.taluka || '',
      village: data.village || '',
      state: data.state || 'Maharashtra',
      isEmailVerified: data.isEmailVerified ?? false,
      isPhoneVerified: data.isPhoneVerified ?? false,
      isProfileComplete: data.isProfileComplete ?? false,
      emergencyContactsConfigured: data.emergencyContactsConfigured ?? false,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
    };
    await setDoc(userRef, defaultProfile);
  } else {
    await updateDoc(userRef, {
      ...data,
      updatedAt: now,
      lastLogin: data.lastLogin || now,
    });
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

// ==================== LOGIN HISTORY & SESSIONS ====================

export const recordLoginHistory = async (
  uid: string,
  method: LoginHistoryItem['method'],
  status: LoginHistoryItem['status'] = 'SUCCESS'
): Promise<string> => {
  const deviceInfo = getDeviceInfo();
  const historyRef = collection(db, 'loginHistory');

  const historyItem: Omit<LoginHistoryItem, 'id'> = {
    uid,
    method,
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    loginTime: new Date().toISOString(),
    status,
  };

  const docRef = await addDoc(historyRef, historyItem);
  return docRef.id;
};

export const createOrUpdateUserSession = async (uid: string): Promise<string> => {
  const deviceInfo = getDeviceInfo();
  const sessionId = `sess_${uid}_${Date.now()}`;
  const sessionRef = doc(db, 'userSessions', sessionId);

  const sessionData: UserSession = {
    sessionId,
    uid,
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    platform: deviceInfo.platform,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    isActive: true,
  };

  await setDoc(sessionRef, sessionData);
  return sessionId;
};

// ==================== VERIFICATION LOGS ====================

export const recordVerificationLog = async (
  logData: Omit<VerificationLog, 'id' | 'timestamp'>
): Promise<string> => {
  const logsRef = collection(db, 'verificationLogs');
  const docRef = await addDoc(logsRef, {
    ...logData,
    timestamp: new Date().toISOString(),
  });
  return docRef.id;
};

// ==================== DEVICE TOKENS (FCM) ====================

export const saveDeviceToken = async (uid: string, fcmToken: string): Promise<void> => {
  const deviceInfo = getDeviceInfo();
  const tokenRef = doc(db, 'deviceTokens', `${uid}_${fcmToken.slice(0, 10)}`);

  const tokenData: DeviceToken = {
    uid,
    fcmToken,
    device: deviceInfo.platform,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };

  await setDoc(tokenRef, tokenData, { merge: true });
};

// ==================== EMERGENCY CONTACTS ====================

export const addEmergencyContact = async (
  uid: string,
  contact: Omit<EmergencyContactItem, 'id' | 'uid' | 'createdAt'>
): Promise<string> => {
  const contactsRef = collection(db, 'emergencyContacts');
  const docRef = await addDoc(contactsRef, {
    ...contact,
    uid,
    createdAt: new Date().toISOString(),
  });

  // Mark user as having emergency contacts configured
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { emergencyContactsConfigured: true });

  return docRef.id;
};

// ==================== SECURITY & AUDIT LOGS ====================

export const recordSecurityLog = async (
  uid: string,
  type: SecurityLog['type'],
  reason: string
): Promise<string> => {
  const deviceInfo = getDeviceInfo();
  const securityRef = collection(db, 'securityLogs');

  const logData: Omit<SecurityLog, 'id'> = {
    uid,
    type,
    reason,
    userAgent: `${deviceInfo.browser} on ${deviceInfo.os}`,
    timestamp: new Date().toISOString(),
  };

  const docRef = await addDoc(securityRef, logData);
  return docRef.id;
};

export const recordAuditLog = async (
  uid: string,
  action: string,
  details: string
): Promise<string> => {
  const auditRef = collection(db, 'auditLogs');

  const logData: Omit<AuditLog, 'id'> = {
    adminId: uid,
    action,
    target: details,
    details,
    timestamp: new Date().toISOString(),
  };

  const docRef = await addDoc(auditRef, logData);
  return docRef.id;
};

// ==================== ACCOUNT LOCKOUT TRACKER ====================

const FAILED_LOGIN_LIMIT = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const checkAccountLockout = (emailOrUid: string): { isLocked: boolean; remainingSeconds: number } => {
  const lockKey = `lockout_${emailOrUid}`;
  const lockedUntil = localStorage.getItem(lockKey);

  if (!lockedUntil) return { isLocked: false, remainingSeconds: 0 };

  const lockTime = parseInt(lockedUntil, 10);
  const now = Date.now();

  if (now < lockTime) {
    const remainingSeconds = Math.ceil((lockTime - now) / 1000);
    return { isLocked: true, remainingSeconds };
  } else {
    // Lock expired
    localStorage.removeItem(lockKey);
    localStorage.removeItem(`failed_attempts_${emailOrUid}`);
    return { isLocked: false, remainingSeconds: 0 };
  }
};

export const registerFailedLoginAttempt = async (emailOrUid: string): Promise<boolean> => {
  const attemptsKey = `failed_attempts_${emailOrUid}`;
  const currentAttempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10) + 1;
  localStorage.setItem(attemptsKey, currentAttempts.toString());

  if (currentAttempts >= FAILED_LOGIN_LIMIT) {
    const lockTime = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(`lockout_${emailOrUid}`, lockTime.toString());
    await recordSecurityLog(emailOrUid, 'ACCOUNT_LOCKED', `Locked after ${FAILED_LOGIN_LIMIT} consecutive failed attempts`);
    return true; // Now locked
  }

  await recordSecurityLog(emailOrUid, 'FAILED_LOGIN', `Failed login attempt ${currentAttempts}/${FAILED_LOGIN_LIMIT}`);
  return false;
};

export const clearFailedLoginAttempts = (emailOrUid: string): void => {
  localStorage.removeItem(`failed_attempts_${emailOrUid}`);
  localStorage.removeItem(`lockout_${emailOrUid}`);
};

// ==================== GENERIC HELPER WRAPPERS ====================

export const addDocument = async (collectionName: string, data: any): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

export const setDocument = async (collectionName: string, docId: string, data: any): Promise<void> => {
  await setDoc(doc(db, collectionName, docId), data, { merge: true });
};

export const getDocument = async (collectionName: string, docId: string): Promise<DocumentData | null> => {
  const docSnap = await getDoc(doc(db, collectionName, docId));
  return docSnap.exists() ? docSnap.data() : null;
};

export const getCollectionDocs = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<any[]> => {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToCollection = (
  collectionName: string,
  callback: (docs: any[]) => void,
  constraints: QueryConstraint[] = []
) => {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
};
