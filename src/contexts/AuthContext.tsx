import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { ref, set, get, update, onValue, off } from "firebase/database";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  hostel?: string;
  college?: string;
  upiId?: string;
  bankingName?: string;
  rating: number;
  total_ratings: number;
  total_deliveries: number;
  total_earnings: number;
  created_at: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const userRef = ref(db, `users/${uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      setProfile(snap.val() as UserProfile);
    }
    // Subscribe to realtime updates for reactive stats
    const handler = (snapshot: import("firebase/database").DataSnapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.val() as UserProfile);
      }
    };
    onValue(userRef, handler);
    return () => off(userRef, "value", handler);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        unsubProfile = await fetchProfile(u.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsub();
      unsubProfile?.();
    };
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      rating: 0,
      total_ratings: 0,
      total_deliveries: 0,
      total_earnings: 0,
      created_at: Date.now(),
    };
    await set(ref(db, `users/${cred.user.uid}`), newProfile);
    setProfile(newProfile);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}`), data);
    setProfile((p) => (p ? { ...p, ...data } : p));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, updateUserProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
