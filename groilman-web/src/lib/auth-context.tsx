"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut, IdTokenResult } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { API_URL } from "@/lib/config";

export interface AuthUser {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const verifyToken = async (idToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  };

  const createUser = async (idToken: string) => {
    try {
      await fetch(`${API_URL}/api/auth/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
    } catch (error) {
      console.error("User creation failed:", error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Set session cookie
      document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;
      
      const userData = await verifyToken(idToken);
      
      if (!userData) {
        await createUser(idToken);
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Set session cookie
          document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;
          
          const userData = await verifyToken(idToken);
          
          if (userData) {
            setUser(userData);
          } else {
            const tokenResult: IdTokenResult = await firebaseUser.getIdTokenResult();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              displayName: firebaseUser.displayName
            });
            await createUser(idToken);
          }
        } catch (error) {
          console.error("Auth state error:", error);
          setUser(null);
        }
      } else {
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}