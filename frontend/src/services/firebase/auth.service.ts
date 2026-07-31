import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../../lib/firebase.ts';

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
};

export const registerWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  return credential.user;
};

export const loginWithGoogle = async (): Promise<FirebaseUser> => {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
};

export const loginAnonymously = async (): Promise<FirebaseUser> => {
  const credential = await signInAnonymously(auth);
  return credential.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
