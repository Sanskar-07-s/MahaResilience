import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { useAuth } from './AuthContext.tsx';

export type NotificationCategory =
  | 'EMERGENCY'
  | 'HEALTHCARE'
  | 'GOVERNMENT'
  | 'COMMUNITY'
  | 'TRANSPORT'
  | 'TOURISM'
  | 'WASTE'
  | 'INFRASTRUCTURE';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  isPinned?: boolean;
  district?: string;
  source?: string;
  sourceUrl?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (
    title: string,
    body: string,
    category: NotificationCategory,
    priority: NotificationPriority,
    district?: string
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  togglePin: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  getFilteredNotifications: () => NotificationItem[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  const [rawNotifications, setRawNotifications] = useState<NotificationItem[]>([]);
  const [readStateMap, setReadStateMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // 1. Listen to real-time public notifications from Firestore
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || 'Bulletin',
            body: data.body || data.description || '',
            category: data.category || 'COMMUNITY',
            priority: data.priority || 'MEDIUM',
            timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
            isRead: false,
            isPinned: !!data.isPinned,
            district: data.district,
            source: data.source || 'MahaResilience System',
            sourceUrl: data.sourceUrl,
          };
        });
        setRawNotifications(list);
      },
      (err) => {
        console.warn('[Notification Engine] Firestore stream warning:', err?.code);
      }
    );

    return () => unsub();
  }, []);

  // 2. Listen to real-time user-specific read states from Firestore (`userNotifications`)
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'userNotifications'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const map: Record<string, boolean> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (data.userId === userId) {
            map[data.notificationId] = !!data.isRead;
          }
        });
        setReadStateMap(map);
      },
      () => {}
    );

    return () => unsub();
  }, [userId]);

  // Combine raw notifications with user read states
  const notifications: NotificationItem[] = rawNotifications.map((item) => ({
    ...item,
    isRead: !!readStateMap[item.id],
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    setReadStateMap((prev) => ({ ...prev, [id]: true }));
    try {
      await setDoc(
        doc(db, 'userNotifications', `${userId}_${id}`),
        {
          userId,
          notificationId: id,
          isRead: true,
          readAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    const updatedMap: Record<string, boolean> = {};
    notifications.forEach((n) => {
      updatedMap[n.id] = true;
    });
    setReadStateMap(updatedMap);

    try {
      for (const n of notifications) {
        if (!n.isRead) {
          await setDoc(
            doc(db, 'userNotifications', `${userId}_${n.id}`),
            {
              userId,
              notificationId: n.id,
              isRead: true,
              readAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }
    } catch (_) {}
  };

  const clearAllNotifications = async () => {
    await markAllAsRead();
  };

  const addNotification = async (
    title: string,
    body: string,
    category: NotificationCategory,
    priority: NotificationPriority,
    district?: string
  ) => {
    const notifObj = {
      title,
      body,
      category,
      priority,
      timestamp: new Date().toISOString(),
      district: district || 'All Districts',
      source: 'MahaResilience Administrator',
    };
    try {
      const docRef = doc(collection(db, 'notifications'));
      await setDoc(docRef, notifObj);
    } catch (_) {}
  };

  const togglePin = (id: string) => {
    // Local toggle for pin state
    setRawNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item))
    );
  };

  const getFilteredNotifications = () => {
    let list = [...notifications];

    if (filterCategory !== 'ALL') {
      list = list.filter((item) => item.category === filterCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        togglePin,
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        getFilteredNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useSmartNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useSmartNotifications must be used within a NotificationProvider');
  return context;
};
