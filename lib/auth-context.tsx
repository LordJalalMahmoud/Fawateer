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
  projectId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const projectId = 'goldclean-48343';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userEmail = (currentUser.email || '').toLowerCase().trim();
          const isSuperAdminEmail = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);

          let hasAdminRole = isSuperAdminEmail;

          // 1. Check authorized_admins document in 'system' collection
          try {
            const systemAdminsRef = doc(db, 'system', 'authorized_admins');
            const systemSnap = await getDoc(systemAdminsRef);
            if (systemSnap.exists()) {
              const emails: string[] = systemSnap.data()?.emails || [];
              if (emails.some(e => e.toLowerCase().trim() === userEmail)) {
                hasAdminRole = true;
              }
            } else if (isSuperAdminEmail) {
              await setDoc(systemAdminsRef, {
                emails: SUPER_ADMIN_EMAILS,
                createdAt: new Date().toISOString(),
              }, { merge: true });
            }
          } catch (err) {
            console.warn('System admins check error:', err);
          }

          // 2. Check in 'admins' collection
          try {
            const adminDocRef = doc(db, 'admins', currentUser.uid);
            const adminSnap = await getDoc(adminDocRef);
            if (adminSnap.exists()) {
              const data = adminSnap.data();
              if (data?.role === 'admin' || data?.isAdmin === true) {
                hasAdminRole = true;
              }
            } else if (hasAdminRole) {
              await setDoc(adminDocRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'مدير',
                role: 'admin',
                isAdmin: true,
                createdAt: new Date().toISOString(),
              }, { merge: true });
            }
          } catch (err) {
            console.warn('Admin collection check error:', err);
          }

          // 3. Check / update in 'users' collection
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              if (data?.role === 'admin' || data?.role === 'manager' || data?.isAdmin === true) {
                hasAdminRole = true;
              }
            }
            
            // Sync user profile to users collection
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || 'مستخدم',
              photoURL: currentUser.photoURL || null,
              role: hasAdminRole ? 'admin' : 'user',
              isAdmin: hasAdminRole,
              lastLoginAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }, { merge: true });
          } catch (err) {
            console.warn('User document sync error:', err);
          }

          setIsAdmin(hasAdminRole);
        } catch (err: any) {
          console.error('Error verifying user permissions:', err);
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
        projectId,
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
