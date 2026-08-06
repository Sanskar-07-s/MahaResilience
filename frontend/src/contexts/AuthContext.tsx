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
import { auth } from '../lib/firebase.ts';
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
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        setIsLoading(true);

        if (firebaseUser) {
          try {
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

            // Try to get Firestore profile (falls back to localStorage on failure)
            let profile = await getUserProfile(firebaseUser.uid);

            if (!profile) {
              // No profile in Firestore and no cache — create new
              const email = firebaseUser.email || 'citizen@maharesilience.org';
              const name = firebaseUser.displayName || email.split('@')[0];

              let role: UserRole = firebaseUser.isAnonymous ? 'TOURIST' : 'CITIZEN';
              if (isSuperAdminLogin) role = 'SUPER_ADMIN';
              else if (isDefaultAdmin) role = 'ADMIN';

              const newProfile: Partial<UserProfile> = {
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

              // Fire-and-forget Firestore write — don't block login
              createOrUpdateUserProfile(firebaseUser.uid, newProfile).catch(() => {});

              profile = newProfile as UserProfile;
            } else {
              // Ensure role is correct for special accounts
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

            // Always update lastLogin (non-blocking)
            createOrUpdateUserProfile(firebaseUser.uid, {
              lastLogin: new Date().toISOString(),
              isEmailVerified: firebaseUser.emailVerified,
            }).catch(() => {});

            setUser(profile);
            setCachedUser(profile);

            // Non-critical fire-and-forget writes
            createOrUpdateUserSession(firebaseUser.uid).catch(() => {});
          } catch (error: any) {
            console.error('[Auth Context] Profile sync error:', error?.code || error?.message);
            // Recover from cache — auth state is still valid even if Firestore fails
            const cached = getCachedUser();
            if (cached && cached.uid === firebaseUser.uid) {
              console.info('[Auth Context] Recovered from localStorage cache.');
              setUser(cached);
            }
          }
        } else {
          // Signed out
          setUser(null);
          setToken(null);
          setCachedToken(null);
          setCachedUser(null);
        }

        setIsLoading(false);
      },
      (error: any) => {
        // onAuthStateChanged observer error (rare — network issues)
        console.error('[Auth Context] Auth state observer error:', error?.code);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = useCallback(
    (newToken: string, profileData: Partial<UserProfile>) => {
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
