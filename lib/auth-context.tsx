'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

const SUPER_ADMIN_EMAILS = [
  'jalalmahmoud8000@gmail.com',
];

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userEmail = (currentUser.email || '').toLowerCase().trim();
          const isSuperAdminEmail = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);

          // Check admin collection in Firestore
          let isDocAdmin = false;
          try {
            const adminDocRef = doc(db, 'admins', currentUser.uid);
            const adminSnap = await getDoc(adminDocRef);
            if (adminSnap.exists() && adminSnap.data()?.role === 'admin') {
              isDocAdmin = true;
            } else if (isSuperAdminEmail) {
              // Auto-seed admin document for super admin
              await setDoc(adminDocRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'المدير العام',
                role: 'admin',
                createdAt: new Date().toISOString(),
              }, { merge: true });
              isDocAdmin = true;
            }
          } catch (err) {
            console.warn('Admin check error in Firestore, evaluating email rule:', err);
          }

          setIsAdmin(isSuperAdminEmail || isDocAdmin);
        } catch (err: any) {
          console.error('Error verifying admin permissions:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else {
        setAuthError(err.message || 'فشل تسجيل الدخول عبر Google.');
      }
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        loginWithGoogle,
        logout,
        clearError: () => setAuthError(null),
      }}
    >
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
