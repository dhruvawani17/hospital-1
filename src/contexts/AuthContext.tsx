
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (details?: { displayName?: string; email?: string; contactNumber?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_KEY = "healthfirst_mock_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(MOCK_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem(MOCK_USER_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback((details?: { displayName?: string; email?: string; contactNumber?: string }) => {
    setLoading(true);
    // Simulate Sign-In
    const mockUser: User = {
      uid: "mock-user-123",
      displayName: details?.displayName || "Demo User",
      email: details?.email || "demo.user@example.com",
      contactNumber: details?.contactNumber || null,
      photoURL: "https://placehold.co/100x100.png", 
      dataAiHint: "profile avatar" 
    };
    try {
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
    setUser(mockUser);
    setLoading(false);
    router.push("/dashboard");
  }, [router]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(MOCK_USER_KEY);
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
