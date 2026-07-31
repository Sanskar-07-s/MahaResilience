import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase.ts';
import { getDocument, setDocument } from '../services/firebase/firestore.service.ts';
import { logoutUser } from '../services/firebase/auth.service.ts';

export type UserRole = 'CITIZEN' | 'VOLUNTEER' | 'OFFICIAL' | 'ADMIN' | 'TOURIST' | 'MUNICIPAL_STAFF' | 'EMERGENCY_STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  phone?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. First recover local cache if offline/loading
    const savedUser = localStorage.getItem('ch_user');
    const savedToken = localStorage.getItem('ch_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        // Corrupt cache
      }
    }

    // 2. Subscribe to Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const userToken = await firebaseUser.getIdToken();
          setToken(userToken);
          localStorage.setItem('ch_token', userToken);

          // Get profile from firestore
          let userProfile = await getDocument('users', firebaseUser.uid) as User | null;

          if (!userProfile) {
            // Document does not exist yet. Initialize profile
            const email = firebaseUser.email || 'anonymous@maharesilience.org';
            const name = firebaseUser.displayName || email.split('@')[0];
            
            // Map default role. Google logs default to citizen.
            const newProfile: User = {
              id: firebaseUser.uid,
              email,
              name,
              role: firebaseUser.isAnonymous ? 'TOURIST' : 'CITIZEN',
              isVerified: false,
              phone: firebaseUser.phoneNumber || undefined,
              profileImage: firebaseUser.photoURL || undefined
            };

            await setDocument('users', firebaseUser.uid, newProfile);
            userProfile = newProfile;
          }

          setUser(userProfile);
          localStorage.setItem('ch_user', JSON.stringify(userProfile));
        } catch (error) {
          console.error('[Auth Service] Syncing user profile failed:', error);
          // If offline, we keep our localStorage fallback user state active
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

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('ch_token', newToken);
    localStorage.setItem('ch_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updatedFields };
      setUser(updated);
      localStorage.setItem('ch_user', JSON.stringify(updated));

      // Sync to Firestore
      try {
        await setDocument('users', user.id, updatedFields);
      } catch (e) {
        console.error('[Auth Service] Syncing profile modifications to DB failed:', e);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
