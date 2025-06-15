
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase"; // Import Firebase auth instance
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
import { APP_NAME } from "@/lib/constants";
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
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          // contactNumber remains as per type definition (optional)
          // dataAiHint is also optional
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    router.push(redirectUrl);
  };

  const handleAuthError = (error: AuthError) => {
    console.error("Firebase Auth Error:", error);
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
            message = "No user found with this email.";
            break;
        case "auth/wrong-password":
            message = "Incorrect password. Please try again.";
            break;
        case "auth/invalid-credential":
             message = "Invalid credentials. Please check your email and password.";
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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user
      handleAuthSuccess();
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [router, toast, searchParams]);
  
  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // onAuthStateChanged will update user state, then redirect
      handleAuthSuccess();
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [router, toast, searchParams]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will update user state, then redirect
      handleAuthSuccess();
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [router, toast, searchParams]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setUser(null); // onAuthStateChanged will also set user to null
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
