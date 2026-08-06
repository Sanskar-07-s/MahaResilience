import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../../lib/firebase.ts';
import {
  createOrUpdateUserProfile,
  recordLoginHistory,
  recordVerificationLog,
  clearFailedLoginAttempts
} from './firestore.service.ts';

const googleProvider = new GoogleAuthProvider();

// ==================== EMAIL & PASSWORD ====================

export const loginWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  // Clear failed attempt counters on success
  clearFailedLoginAttempts(email);

  // Update last login and record history
  await createOrUpdateUserProfile(user.uid, {
    lastLogin: new Date().toISOString(),
    isEmailVerified: user.emailVerified,
  });

  await recordLoginHistory(user.uid, 'EMAIL', 'SUCCESS');

  return user;
};

export const registerWithEmail = async (
  email: string,
  pass: string,
  extraProfileData: Record<string, any> = {}
): Promise<FirebaseUser> => {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  // Send verification email
  try {
    await sendEmailVerification(user);
    await recordVerificationLog({
      uid: user.uid,
      type: 'EMAIL',
      email: user.email || email,
      status: 'SUCCESS',
      attempts: 1,
    });
  } catch (e) {
    console.warn('[Firebase Auth] Verification email dispatch warning:', e);
  }

  // Create initial user profile in Firestore
  await createOrUpdateUserProfile(user.uid, {
    email: user.email || email,
    name: extraProfileData.name || email.split('@')[0],
    role: extraProfileData.role || 'CITIZEN',
    district: extraProfileData.district || '',
    taluka: extraProfileData.taluka || '',
    village: extraProfileData.village || '',
    state: extraProfileData.state || 'Maharashtra',
    isEmailVerified: user.emailVerified,
    isPhoneVerified: false,
    isProfileComplete: true,
  });

  await recordLoginHistory(user.uid, 'EMAIL', 'SUCCESS');

  return user;
};

export const sendPasswordResetLink = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const sendEmailVerificationLink = async (user: FirebaseUser): Promise<void> => {
  await sendEmailVerification(user);
};

// ==================== GOOGLE SIGN IN ====================

export const loginWithGoogle = async (): Promise<FirebaseUser> => {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  await createOrUpdateUserProfile(user.uid, {
    email: user.email || '',
    name: user.displayName || 'Google Citizen',
    photoURL: user.photoURL || '',
    isEmailVerified: true,
    lastLogin: new Date().toISOString(),
  });

  await recordLoginHistory(user.uid, 'GOOGLE', 'SUCCESS');

  return user;
};

// ==================== PHONE NUMBER OTP (reCAPTCHA) ====================

export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  if ((window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier.clear();
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // Response expired
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

export const sendPhoneOTP = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult;
};

export const verifyPhoneOTP = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<FirebaseUser> => {
  const userCredential = await confirmationResult.confirm(otpCode);
  const user = userCredential.user;

  await createOrUpdateUserProfile(user.uid, {
    phone: user.phoneNumber || '',
    isPhoneVerified: true,
    lastLogin: new Date().toISOString(),
  });

  await recordVerificationLog({
    uid: user.uid,
    type: 'PHONE',
    phone: user.phoneNumber || '',
    status: 'SUCCESS',
    attempts: 1,
  });

  await recordLoginHistory(user.uid, 'PHONE_OTP', 'SUCCESS');

  return user;
};

// ==================== LOGOUT ====================

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
