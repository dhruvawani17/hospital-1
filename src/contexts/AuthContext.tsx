
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
  type AuthError
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          dataAiHint: firebaseUser.photoURL ? "user profile" : undefined,
        };
        setUser(appUser);
        // console.log("User set from onAuthStateChanged:", appUser);
      } else {
        setUser(null);
        // console.log("User set to null from onAuthStateChanged");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = useCallback(() => {
    // Read searchParams directly from window.location on client-side success event
    const currentSearchParams = new URLSearchParams(window.location.search);
    const redirectUrl = currentSearchParams.get('redirect') || '/dashboard';
    router.push(redirectUrl);
  }, [router]);

  const handleAuthError = (error: AuthError) => {
    console.error("Firebase Auth Error Code:", error.code); 
    console.error("Firebase Auth Error Message:", error.message);
    
    let message = "An unknown error occurred.";
    switch (error.code) {
        case "auth/email-already-in-use":
            message = "This email address is already in use.";
            break;
        case "auth/invalid-email":
            message = "The email address is not valid.";
            break;
        case "auth/operation-not-allowed":
            message = "Email/password accounts are not enabled.";
            break;
        case "auth/weak-password":
            message = "The password is too weak.";
            break;
        case "auth/user-disabled":
            message = "This user account has been disabled.";
            break;
        case "auth/user-not-found": 
        case "auth/invalid-credential": 
            message = "Invalid credentials. Please check your email and password.";
            break;
        case "auth/wrong-password": 
            message = "Incorrect password. Please try again.";
            break;
        case "auth/popup-closed-by-user":
            message = "Sign-in popup was closed before completing. Please try again.";
            break;
        case "auth/popup-blocked":
            message = "Sign-in popup was blocked by the browser. Please allow popups for this site.";
            break;
        case "auth/unauthorized-domain":
            message = "This domain is not authorized for Firebase operations. Please check your Firebase project settings.";
            break;
        default:
            message = error.message || "Failed to authenticate. Please try again.";
    }
    toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: message,
    });
  };

  const loginWithGoogle = useCallback(async () => { 
    setLoading(true);
    console.log("Attempting Google Sign-In...");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleAuthSuccess();
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  }, [handleAuthSuccess, toast]);
  
  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      handleAuthSuccess();
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleAuthSuccess, toast]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleAuthSuccess, toast]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      router.push("/"); 
    } catch (error) {
      console.error("Firebase Sign-Out Error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: (error as AuthError).message });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, signUpWithEmail, signInWithEmail, logout }}>
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
