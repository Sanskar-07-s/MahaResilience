import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.ts';
import {
  getUserProfile,
  createOrUpdateUserProfile,
  createOrUpdateUserSession,
  recordLoginHistory
} from '../services/firebase/firestore.service.ts';
import { logoutUser } from '../services/firebase/auth.service.ts';
import { UserProfile, UserRole } from '../types/user.ts';
import { useInactivityLogout } from '../hooks/useInactivityLogout.ts';
import { bootstrapSuperAdmin } from '../utils/superAdminBootstrap.ts';
import { isSuperAdmin, isDistrictAdmin, isOfficer, isCitizen, hasPermission, SUPER_ADMIN_UID } from '../utils/permissions.ts';

export type { UserRole };
export type User = UserProfile;

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userProfile: Partial<UserProfile>) => void;
  logout: () => void;
  updateUser: (fields: Partial<UserProfile>) => Promise<void>;
  // Permission Helpers
  isSuperAdmin: () => boolean;
  isDistrictAdmin: () => boolean;
  isOfficer: () => boolean;
  isCitizen: () => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inactivity Auto-Logout (15 minutes idle threshold)
  const { resetTimer } = useInactivityLogout({
    timeoutMs: 15 * 60 * 1000,
    enabled: !!user,
    onLogout: () => {
      console.warn('[Auth Security] User idle for 15 minutes. Automatically logging out...');
      logout();
    },
  });

  useEffect(() => {
    // 1. Recover local storage profile cache if offline
    const savedUser = localStorage.getItem('ch_user');
    const savedToken = localStorage.getItem('ch_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        // Corrupt cache — ignore
      }
    }

    // 2. Subscribe to Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const userToken = await firebaseUser.getIdToken();
          setToken(userToken);
          localStorage.setItem('ch_token', userToken);

          // Bootstrap Super Admin if this is the Super Admin UID
          const isSuperAdminLogin = firebaseUser.uid === SUPER_ADMIN_UID;
          if (isSuperAdminLogin) {
            await bootstrapSuperAdmin();
          }

          // Get or create Firestore UserProfile
          let profile = await getUserProfile(firebaseUser.uid);

          // Determine correct role
          const isDefaultAdmin = firebaseUser.email?.toLowerCase() === 'sanskardhat6@gmail.com';

          if (!profile) {
            const email = firebaseUser.email || 'citizen@maharesilience.org';
            const name = firebaseUser.displayName || email.split('@')[0];

            let role: UserRole = firebaseUser.isAnonymous ? 'TOURIST' : 'CITIZEN';
            if (isSuperAdminLogin) role = 'SUPER_ADMIN';
            else if (isDefaultAdmin) role = 'ADMIN';

            await createOrUpdateUserProfile(firebaseUser.uid, {
              uid: firebaseUser.uid,
              email,
              name,
              photoURL: firebaseUser.photoURL || '',
              phone: firebaseUser.phoneNumber || '',
              role,
              isAdmin: isSuperAdminLogin || isDefaultAdmin,
              permissions: isSuperAdminLogin ? ['*'] : [],
              accountStatus: 'ACTIVE',
              isEmailVerified: firebaseUser.emailVerified,
              isPhoneVerified: !!firebaseUser.phoneNumber,
              state: 'Maharashtra',
            });

            profile = await getUserProfile(firebaseUser.uid);
          } else {
            // Update existing profile for special roles
            if (isSuperAdminLogin && profile.role !== 'SUPER_ADMIN') {
              await createOrUpdateUserProfile(firebaseUser.uid, {
                role: 'SUPER_ADMIN',
                displayRole: 'Super Administrator',
                isAdmin: true,
                permissions: ['*'],
                accountStatus: 'ACTIVE',
              });
              profile.role = 'SUPER_ADMIN';
              profile.isAdmin = true;
              profile.permissions = ['*'];
            } else if (isDefaultAdmin && profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
              await createOrUpdateUserProfile(firebaseUser.uid, { role: 'ADMIN', isAdmin: true });
              profile.role = 'ADMIN';
            }
          }

          if (profile) {
            setUser(profile);
            localStorage.setItem('ch_user', JSON.stringify(profile));
            createOrUpdateUserSession(firebaseUser.uid).catch(console.error);
          }
        } catch (error) {
          console.error('[Auth Context] User profile sync error:', error);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('ch_token');
        localStorage.removeItem('ch_user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (newToken: string, profileData: Partial<UserProfile>) => {
    setToken(newToken);
    const uid = profileData.uid || profileData.id || 'user-' + Date.now();
    const userEmail = (profileData.email || '').toLowerCase();
    const isSuperAdminLogin = uid === SUPER_ADMIN_UID;
    const isDefaultAdmin = userEmail === 'sanskardhat6@gmail.com';

    let role: UserRole = profileData.role || 'CITIZEN';
    if (isSuperAdminLogin) role = 'SUPER_ADMIN';
    else if (isDefaultAdmin && role !== 'SUPER_ADMIN') role = 'ADMIN';

    const fullProfile: UserProfile = {
      uid,
      id: uid,
      name: profileData.name || 'Citizen User',
      email: profileData.email || '',
      phone: profileData.phone || '',
      photoURL: profileData.photoURL || '',
      role,
      displayRole: isSuperAdminLogin ? 'Super Administrator' : profileData.displayRole,
      isAdmin: isSuperAdminLogin || isDefaultAdmin || profileData.isAdmin || false,
      permissions: isSuperAdminLogin ? ['*'] : (profileData.permissions || []),
      accountStatus: 'ACTIVE',
      language: profileData.language || 'en',
      theme: profileData.theme || 'light',
      notificationsEnabled: profileData.notificationsEnabled ?? true,
      locationPermission: profileData.locationPermission ?? false,
      accessibilityMode: profileData.accessibilityMode ?? false,
      district: profileData.district || '',
      taluka: profileData.taluka || '',
      village: profileData.village || '',
      state: profileData.state || 'Maharashtra',
      isEmailVerified: profileData.isEmailVerified ?? false,
      isPhoneVerified: profileData.isPhoneVerified ?? false,
      isProfileComplete: profileData.isProfileComplete ?? true,
      emergencyContactsConfigured: profileData.emergencyContactsConfigured ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    setUser(fullProfile);
    localStorage.setItem('ch_user', JSON.stringify(fullProfile));

    if (profileData.uid) {
      createOrUpdateUserSession(profileData.uid).catch(console.error);
      recordLoginHistory(profileData.uid, 'EMAIL', 'SUCCESS').catch(console.error);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ch_token');
      localStorage.removeItem('ch_user');
    }
  };

  const updateUser = async (updatedFields: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updatedFields, updatedAt: new Date().toISOString() };
      setUser(updated);
      localStorage.setItem('ch_user', JSON.stringify(updated));

      try {
        await createOrUpdateUserProfile(user.uid, updatedFields);
      } catch (e) {
        console.error('[Auth Context] Updating profile error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUser,
        // Bound permission helpers
        isSuperAdmin: () => isSuperAdmin(user),
        isDistrictAdmin: () => isDistrictAdmin(user),
        isOfficer: () => isOfficer(user),
        isCitizen: () => isCitizen(user),
        hasPermission: (p: string) => hasPermission(user, p),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
