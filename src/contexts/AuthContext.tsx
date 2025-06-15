
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // Import Firebase auth instance
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from "firebase/auth";
import { APP_NAME } from "@/lib/constants";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  mockLogin: (details: { displayName: string; email: string; contactNumber: string }) => void; // Kept for mock form
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          contactNumber: null, // Firebase Google Auth doesn't provide phone by default
          dataAiHint: "profile avatar"
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user and redirecting
      router.push("/dashboard");
    } catch (error) {
      console.error("Firebase Google Sign-In Error:", error);
      // Handle error (e.g., show toast to user)
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  // Kept for the manual form, acts as a mock and does NOT use Firebase.
  const mockLogin = useCallback((details: { displayName: string; email: string; contactNumber: string }) => {
    setLoading(true);
    const mockUser: User = {
      uid: `mock-user-${Date.now()}`, // Ensure unique mock UID
      displayName: details.displayName,
      email: details.email,
      contactNumber: details.contactNumber,
      photoURL: "https://placehold.co/100x100.png",
      dataAiHint: "profile avatar"
    };
    setUser(mockUser); // This user is NOT in Firebase
    setLoading(false);
    router.push("/dashboard");
     console.warn(
      `${APP_NAME} Dev Note: Manual form login is currently a MOCK and does NOT use Firebase. User data is not persisted in Firebase for this login type. Please use Google Sign-In for Firebase integration.`
    );
  }, [router]);


  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null); // onAuthStateChanged will also set user to null
      router.push("/");
    } catch (error) {
      console.error("Firebase Sign-Out Error:", error);
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, mockLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
