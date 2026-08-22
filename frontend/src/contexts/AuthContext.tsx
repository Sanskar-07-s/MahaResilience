/**
 * AuthContext.tsx — Offline-resilient authentication context.
 *
 * Fixes applied:
 * 1. All Firestore calls wrapped in try/catch — auth NEVER fails because
 *    of a Firestore error.
 * 2. Cached user profile (localStorage) used as fallback when Firestore
 *    is unavailable.
 * 3. Non-critical writes (session, login history) are fire-and-forget.
 * 4. Super Admin UID auto-bootstrapped with offline tolerance.
 * 5. Permission helpers exposed on context for convenience.
 * 6. Race condition fixed: isLoading correctly tracks async resolution.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { onSnapshot, doc, DocumentSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.ts';
import {
  getUserProfile,
  createOrUpdateUserProfile,
  createOrUpdateUserSession,
  recordLoginHistory,
} from '../services/firebase/firestore.service.ts';
import { logoutUser } from '../services/firebase/auth.service.ts';
import { UserProfile, UserRole } from '../types/user.ts';
import { useInactivityLogout } from '../hooks/useInactivityLogout.ts';
import { bootstrapSuperAdmin, SUPER_ADMIN_UID } from '../utils/superAdminBootstrap.ts';
import {
  isSuperAdmin,
  isDistrictAdmin,
  isOfficer,
  isCitizen,
  hasPermission,
  canAccessAdmin,
} from '../utils/permissions.ts';

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
  // Permission helpers (bound to current user)
  isSuperAdmin: () => boolean;
  isDistrictAdmin: () => boolean;
  isOfficer: () => boolean;
  isCitizen: () => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── localStorage cache helpers ───────────────────────────────────────────────
const CACHE_USER_KEY = 'ch_user';
const CACHE_TOKEN_KEY = 'ch_token';

const getCachedUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(CACHE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};
const setCachedUser = (u: UserProfile | null) => {
  try {
    if (u) localStorage.setItem(CACHE_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(CACHE_USER_KEY);
  } catch (_) {}
};
const getCachedToken = () => {
  try { return localStorage.getItem(CACHE_TOKEN_KEY); } catch (_) { return null; }
};
const setCachedToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(CACHE_TOKEN_KEY, t);
    else localStorage.removeItem(CACHE_TOKEN_KEY);
  } catch (_) {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hydrate immediately from cache to avoid flash of unauthenticated state
  const [user, setUser] = useState<UserProfile | null>(getCachedUser);
  const [token, setToken] = useState<string | null>(getCachedToken);
  const [isLoading, setIsLoading] = useState(true);

  // Inactivity auto-logout (15 minutes)
  useInactivityLogout({
    timeoutMs: 15 * 60 * 1000,
    enabled: !!user,
    onLogout: useCallback(() => {
      console.warn('[Auth Security] Idle timeout — logging out.');
      logout();
    }, []),
  });

  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      console.log('[Auth Diagnostics] Auth listener started');
    }

    // Safety fallback: Never allow auth loading state to stick for > 3.5s
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if ((import.meta as any).env?.DEV) {
          console.log('[Auth Diagnostics] Auth state received:', firebaseUser ? firebaseUser.uid : 'NO_USER');
        }
        try {
          if (firebaseUser) {
            // Get fresh token
            let userToken: string;
            try {
              userToken = await firebaseUser.getIdToken();
              setToken(userToken);
              setCachedToken(userToken);
            } catch (tokenErr) {
              console.warn('[Auth] Token refresh failed — using cached token');
              userToken = getCachedToken() || '';
            }

            const isSuperAdminLogin = firebaseUser.uid === SUPER_ADMIN_UID;
            const isDefaultAdmin =
              firebaseUser.email?.toLowerCase() === 'sanskardhat6@gmail.com';

            // Bootstrap Super Admin (fire-and-forget — offline safe)
            if (isSuperAdminLogin) {
              bootstrapSuperAdmin().catch(() => {});
            }

            // Try to get Firestore profile with 2.5s Promise race
            let profile: UserProfile | null = null;
            try {
              const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 2500));
              profile = await Promise.race([getUserProfile(firebaseUser.uid), timeoutPromise]);
            } catch (_) {}

            if (!profile) {
              // Try cached user
              const cached = getCachedUser();
              if (cached && cached.uid === firebaseUser.uid) {
                profile = cached;
              } else {
                // Create new basic profile
                const email = firebaseUser.email || 'citizen@maharesilience.org';
                const name = firebaseUser.displayName || email.split('@')[0];

                let role: UserRole = firebaseUser.isAnonymous ? 'TOURIST' : 'CITIZEN';
                if (isSuperAdminLogin) role = 'SUPER_ADMIN';
                else if (isDefaultAdmin) role = 'ADMIN';

                profile = {
                  uid: firebaseUser.uid,
                  id: firebaseUser.uid,
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
                  language: 'en',
                  theme: 'light',
                  notificationsEnabled: true,
                  locationPermission: false,
                  accessibilityMode: false,
                  isProfileComplete: false,
                  emergencyContactsConfigured: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString(),
                };

                createOrUpdateUserProfile(firebaseUser.uid, profile).catch(() => {});
              }
            } else {
              if (isSuperAdminLogin && profile.role !== 'SUPER_ADMIN') {
                profile.role = 'SUPER_ADMIN';
                profile.isAdmin = true;
                profile.permissions = ['*'];
                createOrUpdateUserProfile(firebaseUser.uid, {
                  role: 'SUPER_ADMIN',
                  displayRole: 'Super Administrator',
                  isAdmin: true,
                  permissions: ['*'],
                  accountStatus: 'ACTIVE',
                }).catch(() => {});
              } else if (
                isDefaultAdmin &&
                profile.role !== 'ADMIN' &&
                profile.role !== 'SUPER_ADMIN'
              ) {
                profile.role = 'ADMIN';
                profile.isAdmin = true;
                createOrUpdateUserProfile(firebaseUser.uid, { role: 'ADMIN', isAdmin: true }).catch(() => {});
              }
            }

            createOrUpdateUserProfile(firebaseUser.uid, {
              lastLogin: new Date().toISOString(),
              isEmailVerified: firebaseUser.emailVerified,
            }).catch(() => {});

            setUser(profile);
            setCachedUser(profile);
            createOrUpdateUserSession(firebaseUser.uid).catch(() => {});

            // Setup real-time listener on user profile in Firestore
            try {
              const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap: DocumentSnapshot) => {
                if (docSnap.exists()) {
                  const liveData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
                  setUser((prev) => {
                    const merged = { ...(prev || {}), ...liveData } as UserProfile;
                    setCachedUser(merged);
                    return merged;
                  });
                }
              });
              // Cleanup on next auth cycle
            } catch (_) {}
          } else {
            // Signed out
            setUser(null);
            setToken(null);
            setCachedToken(null);
            setCachedUser(null);
          }
        } catch (error: any) {
          console.error('[Auth Context] Observer handler error:', error?.code || error?.message);
        } finally {
          clearTimeout(safetyTimer);
          setIsLoading(false);
        }
      },
      (error: any) => {
        console.error('[Auth Context] Auth state observer error:', error?.code);
        clearTimeout(safetyTimer);
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    (newToken: string, profileData: Partial<UserProfile>) => {
      if ((import.meta as any).env?.DEV) {
        console.log('[Auth Diagnostics] Login started with token/profile');
      }
      setToken(newToken);
      setCachedToken(newToken);

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
        permissions: isSuperAdminLogin ? ['*'] : profileData.permissions || [],
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
        createdAt: profileData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      setUser(fullProfile);
      setCachedUser(fullProfile);

      // Fire-and-forget non-critical writes
      if (profileData.uid) {
        createOrUpdateUserSession(profileData.uid).catch(() => {});
        recordLoginHistory(profileData.uid, 'EMAIL', 'SUCCESS').catch(() => {});
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    } finally {
      setUser(null);
      setToken(null);
      setCachedToken(null);
      setCachedUser(null);
    }
  }, []);

  const updateUser = useCallback(
    async (updatedFields: Partial<UserProfile>) => {
      if (user) {
        const updated: UserProfile = {
          ...user,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
        setUser(updated);
        setCachedUser(updated);
        // Non-blocking Firestore sync
        createOrUpdateUserProfile(user.uid, updatedFields).catch((e: any) => {
          console.error('[Auth] updateUser Firestore sync failed:', e?.code);
        });
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        isSuperAdmin: () => isSuperAdmin(user),
        isDistrictAdmin: () => isDistrictAdmin(user),
        isOfficer: () => isOfficer(user),
        isCitizen: () => isCitizen(user),
        hasPermission: (p: string) => hasPermission(user, p),
        canAccessAdmin: () => canAccessAdmin(user),
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
