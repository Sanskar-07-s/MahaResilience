import { useState, useEffect } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import {
  addDocument,
  setDocument,
  getDocument,
  getCollectionDocs,
  subscribeToCollection
} from '../services/firebase/firestore.service.ts';

export const useFirestore = (collectionName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Read collection snapshot
  const loadData = async (constraints: QueryConstraint[] = []) => {
    setLoading(true);
    try {
      const docs = await getCollectionDocs(collectionName, constraints);
      setData(docs);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time syncs
  const subscribe = (constraints: QueryConstraint[] = []) => {
    setLoading(true);
    const unsubscribe = subscribeToCollection(
      collectionName,
      (docs) => {
        setData(docs);
        setLoading(false);
      },
      constraints
    );
    return unsubscribe;
  };

  const createDoc = async (docData: any) => {
    return addDocument(collectionName, docData);
  };

  const updateDoc = async (id: string, docData: any) => {
    return setDocument(collectionName, id, docData);
  };

  const fetchDoc = async (id: string) => {
    return getDocument(collectionName, id);
  };

  return {
    data,
    loading,
    error,
    loadData,
    subscribe,
    createDoc,
    updateDoc,
    fetchDoc
  };
};
