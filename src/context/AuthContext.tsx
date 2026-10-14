import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/api';
import { UserProfile, Role } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  effectiveRole: Role | null;
  loading: boolean;
  devMode: boolean;
  toggleDevModeRole: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  effectiveRole: null,
  loading: true,
  devMode: false,
  toggleDevModeRole: () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [devModeRole, setDevModeRole] = useState<Role | null>(null);

  const fetchProfile = async (uid: string) => {
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
        setDevModeRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toggleDevModeRole = () => {
    const current = devModeRole || profile?.role;
    setDevModeRole(current === 'Customer' ? 'Bidder' : 'Customer');
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  const effectiveRole = devModeRole || profile?.role || null;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      effectiveRole,
      loading,
      devMode: !!devModeRole,
      toggleDevModeRole,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
