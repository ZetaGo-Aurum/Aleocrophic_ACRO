'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  acronBalance: number;
  licenses: License[];
  createdAt: string;
}

export interface License {
  key: string;
  tier: 'proplus' | 'ultimate';
  tierName: string;
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnon: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  updateUserPhoto: (photoURL: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data() as UserData);
    }
    return userDoc.exists() ? userDoc.data() as UserData : null;
  };

  const createUserData = async (user: User) => {
    const newUserData: UserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      acronBalance: 0,
      licenses: [],
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid), newUserData);
    setUserData(newUserData);
    return newUserData;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const data = await fetchUserData(user.uid);
        if (!data) {
          await createUserData(user);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInAnon = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserName = async (name: string) => {
    if (!user) return;
    await updateProfile(user, { displayName: name });
    await updateDoc(doc(db, 'users', user.uid), { displayName: name });
    await refreshUserData();
  };

  const updateUserPhoto = async (photoURL: string) => {
    if (!user) return;
    await updateProfile(user, { photoURL: photoURL });
    await updateDoc(doc(db, 'users', user.uid), { photoURL: photoURL });
    await refreshUserData();
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInAnon,
      logout,
      updateUserName,
      updateUserPhoto,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
