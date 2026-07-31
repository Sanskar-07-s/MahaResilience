import React, { createContext, useContext, useState, useEffect } from 'react';

export type NotificationCategory = 'EMERGENCY' | 'HEALTHCARE' | 'GOVERNMENT' | 'COMMUNITY' | 'TRANSPORT' | 'TOURISM' | 'WASTE' | 'PEST_CONTROL' | 'INFRASTRUCTURE';
export type NotificationPriority = 'CRITICAL' | 'MEDIUM' | 'LOW';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  isPinned: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (title: string, body: string, category: NotificationCategory, priority: NotificationPriority) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  togglePin: (id: string) => void;
  dismissNotification: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  getFilteredNotifications: () => NotificationItem[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Load from local storage cache
  useEffect(() => {
    const cached = localStorage.getItem('ch_notifications');
    if (cached) {
      try {
        setNotifications(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default notification items
      const seeds: NotificationItem[] = [
        { id: 'n1', title: 'Evacuation Shelter Setups', body: 'Safe shelters configured at Versova Sports ground.', category: 'EMERGENCY', priority: 'CRITICAL', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), isRead: false, isPinned: true },
        { id: 'n2', title: 'Sanjay Gandhi Scheme verification update', body: 'APMC center starts biometric audits on Sunday.', category: 'GOVERNMENT', priority: 'LOW', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), isRead: true, isPinned: false },
        { id: 'n3', title: 'Pune Medical PHC camp schedules', body: 'Free medical diagnosis camp active in Kothrud PHC from 9 AM.', category: 'HEALTHCARE', priority: 'MEDIUM', timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), isRead: false, isPinned: false },
      ];
      setNotifications(seeds);
      localStorage.setItem('ch_notifications', JSON.stringify(seeds));
    }
  }, []);

  const saveCache = (list: NotificationItem[]) => {
    setNotifications(list);
    localStorage.setItem('ch_notifications', JSON.stringify(list));
  };

  const addNotification = (title: string, body: string, category: NotificationCategory, priority: NotificationPriority) => {
    const newItem: NotificationItem = {
      id: 'notif-' + Math.floor(Math.random() * 100000),
      title,
      body,
      category,
      priority,
      timestamp: new Date().toISOString(),
      isRead: false,
      isPinned: false
    };
    saveCache([newItem, ...notifications]);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(item => item.id === id ? { ...item, isRead: true } : item);
    saveCache(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(item => ({ ...item, isRead: true }));
    saveCache(updated);
  };

  const togglePin = (id: string) => {
    const updated = notifications.map(item => item.id === id ? { ...item, isPinned: !item.isPinned } : item);
    saveCache(updated);
  };

  const dismissNotification = (id: string) => {
    const updated = notifications.filter(item => item.id !== id);
    saveCache(updated);
  };

  const getFilteredNotifications = () => {
    let list = [...notifications];

    // Category filter
    if (filterCategory !== 'ALL') {
      list = list.filter(item => item.category === filterCategory);
    }

    // Search query match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q));
    }

    // Sort: Pinned first, then date newer first
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
        addNotification,
        markAsRead,
        markAllAsRead,
        togglePin,
        dismissNotification,
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        getFilteredNotifications
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
