import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { db } from '../lib/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';
import { isSuperAdmin, canAccessAdmin } from '../utils/permissions.ts';

interface EmergencyModeContextType {
  isEmergencyMode: boolean;
  activateEmergencyMode: () => Promise<void>;
  deactivateEmergencyMode: () => Promise<void>;
}

const EmergencyModeContext = createContext<EmergencyModeContextType | undefined>(undefined);

export const EmergencyModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Persist emergency mode in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('mr_emergency_mode');
    if (stored === 'true') setIsEmergencyMode(true);
  }, []);

  useEffect(() => {
    // Apply/remove emergency CSS class on root body
    if (isEmergencyMode) {
      document.documentElement.classList.add('emergency-mode');
      document.body.style.setProperty('--emergency-active', '1');
    } else {
      document.documentElement.classList.remove('emergency-mode');
      document.body.style.removeProperty('--emergency-active');
    }
  }, [isEmergencyMode]);

  const activateEmergencyMode = async () => {
    if (!user || !canAccessAdmin(user)) return;

    setIsEmergencyMode(true);
    sessionStorage.setItem('mr_emergency_mode', 'true');

    // Log audit entry
    try {
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user.id || (user as any).uid || 'admin',
        action: 'ACTIVATE_EMERGENCY_MODE',
        target: 'SYSTEM',
        details: 'Emergency Mode activated — all critical systems prioritized.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Emergency Mode] Audit log failed:', err);
    }

    console.log('[Emergency Mode] ACTIVATED by', user.name);
  };

  const deactivateEmergencyMode = async () => {
    if (!user || !canAccessAdmin(user)) return;

    setIsEmergencyMode(false);
    sessionStorage.removeItem('mr_emergency_mode');

    try {
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user.id || (user as any).uid || 'admin',
        action: 'DEACTIVATE_EMERGENCY_MODE',
        target: 'SYSTEM',
        details: 'Emergency Mode deactivated — platform returned to normal operations.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Emergency Mode] Audit log failed:', err);
    }

    console.log('[Emergency Mode] DEACTIVATED by', user.name);
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
