import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { db } from '../lib/firebase.ts';
import { collection, addDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';

interface EmergencyModeContextType {
  isEmergencyMode: boolean;
  activateEmergencyMode: () => Promise<void>;
  deactivateEmergencyMode: () => Promise<void>;
}

const EmergencyModeContext = createContext<EmergencyModeContextType | undefined>(undefined);

export const EmergencyModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(() => {
    return localStorage.getItem('mr_emergency_mode') === 'true';
  });

  // 1. Real-time Firestore synchronization for platform-wide Emergency Mode
  useEffect(() => {
    const modeDocRef = doc(db, 'systemSettings', 'emergencyMode');
    const unsub = onSnapshot(modeDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const active = snapshot.data().active === true;
        setIsEmergencyMode(active);
        localStorage.setItem('mr_emergency_mode', active ? 'true' : 'false');
      }
    }, (err) => {
      console.warn('[Emergency Mode Sync Warning]:', err);
    });

    return () => unsub();
  }, []);

  // 2. Apply/remove emergency CSS class on root DOM body
  useEffect(() => {
    if (isEmergencyMode) {
      document.documentElement.classList.add('emergency-mode');
      document.body.style.setProperty('--emergency-active', '1');
    } else {
      document.documentElement.classList.remove('emergency-mode');
      document.body.style.removeProperty('--emergency-active');
    }
  }, [isEmergencyMode]);

  const activateEmergencyMode = async () => {
    setIsEmergencyMode(true);
    localStorage.setItem('mr_emergency_mode', 'true');

    try {
      // Sync to Firestore so all connected citizens & admins see it live
      await setDoc(doc(db, 'systemSettings', 'emergencyMode'), {
        active: true,
        activatedBy: user?.email || user?.name || 'Super Admin',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Audit Log
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.id || (user as any)?.uid || 'super-admin',
        action: 'ACTIVATE_EMERGENCY_MODE',
        target: 'SYSTEM',
        details: 'Emergency Mode activated — platform-wide high priority emergency state.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Emergency Mode Activation Sync Notice]:', err);
    }
  };

  const deactivateEmergencyMode = async () => {
    setIsEmergencyMode(false);
    localStorage.setItem('mr_emergency_mode', 'false');

    try {
      await setDoc(doc(db, 'systemSettings', 'emergencyMode'), {
        active: false,
        deactivatedBy: user?.email || user?.name || 'Super Admin',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.id || (user as any)?.uid || 'super-admin',
        action: 'DEACTIVATE_EMERGENCY_MODE',
        target: 'SYSTEM',
        details: 'Emergency Mode deactivated — platform returned to normal state.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Emergency Mode Deactivation Sync Notice]:', err);
    }
  };

  return (
    <EmergencyModeContext.Provider value={{ isEmergencyMode, activateEmergencyMode, deactivateEmergencyMode }}>
      {children}
    </EmergencyModeContext.Provider>
  );
};

export const useEmergencyMode = (): EmergencyModeContextType => {
  const ctx = useContext(EmergencyModeContext);
  if (!ctx) throw new Error('useEmergencyMode must be used within EmergencyModeProvider');
  return ctx;
};
