import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';

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
