import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  driveToken: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  driveToken: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driveToken, setDriveToken] = useState<string | null>(() => {
    return sessionStorage.getItem('driveToken') || null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Unblock UI immediately
      
      if (currentUser) {
        // Check if admin
        const adminEmails = ['taikhoanphubg4@gmail.com', 'ngominhthuanbg1612007@gmail.com'];
        let adminStatus = adminEmails.includes(currentUser.email || '');
        
        // Sync user to firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: adminStatus ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              isOnline: true
            });
          } else {
            if (userSnap.data().role === 'admin') {
              adminStatus = true;
            }
            await setDoc(userRef, {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              lastLoginAt: new Date().toISOString(),
              isOnline: true
            }, { merge: true });
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setDriveToken(credential.accessToken);
        sessionStorage.setItem('driveToken', credential.accessToken);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { isOnline: false }, { merge: true });
      }
      setDriveToken(null);
      sessionStorage.removeItem('driveToken');
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        if (document.visibilityState === 'hidden') {
          setDoc(userRef, { isOnline: false }, { merge: true });
        } else {
          setDoc(userRef, { isOnline: true, lastLoginAt: new Date().toISOString() }, { merge: true });
        }
      }
    };

    const handleBeforeUnload = () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { isOnline: false }, { merge: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, driveToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
