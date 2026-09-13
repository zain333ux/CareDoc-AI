"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initial load: check saved session in localStorage or supabase
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("caredoc_token");
        const savedUserStr = localStorage.getItem("caredoc_user");

        if (savedToken && savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            setUser(parsedUser);
            setToken(savedToken);
          } catch (e) {
            console.error("Failed to parse cached user", e);
          }
        }

        // Also check Supabase directly
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const supaUser: User = {
            id: session.user.id,
            email: session.user.email || "",
          };
          setUser(supaUser);
          setToken(session.access_token);
          localStorage.setItem("caredoc_user", JSON.stringify(supaUser));
          localStorage.setItem("caredoc_token", session.access_token);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const supaUser: User = {
            id: session.user.id,
            email: session.user.email || "",
          };
          setUser(supaUser);
          setToken(session.access_token);
          localStorage.setItem("caredoc_user", JSON.stringify(supaUser));
          localStorage.setItem("caredoc_token", session.access_token);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setToken(null);
          localStorage.removeItem("caredoc_user");
          localStorage.removeItem("caredoc_token");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Invalid login credentials." };
      }

      if (data.session?.access_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        setToken(data.session.access_token);
        localStorage.setItem("caredoc_token", data.session.access_token);
      }

      const loggedUser: User = {
        id: data.user.id,
        email: data.user.email,
      };
      setUser(loggedUser);
      localStorage.setItem("caredoc_user", JSON.stringify(loggedUser));

      return { success: true };
    } catch (err: any) {
      console.error("Login request error:", err);
      const msg = err.message === "Failed to fetch" 
        ? "Cannot connect to server. Please ensure the backend is running at " + API_BASE
        : err.message || "Failed to reach authentication server.";
      return { success: false, error: msg };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Registration failed. Please check your details." };
      }

      if (data.session?.access_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        setToken(data.session.access_token);
        localStorage.setItem("caredoc_token", data.session.access_token);
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email,
        };
        setUser(newUser);
        localStorage.setItem("caredoc_user", JSON.stringify(newUser));
      }

      return { success: true };
    } catch (err: any) {
      console.error("Signup request error:", err);
      const msg = err.message === "Failed to fetch"
        ? "Cannot connect to server. Please ensure the backend is running at " + API_BASE
        : err.message || "Failed to reach registration server.";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out from Supabase:", e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("caredoc_user");
    localStorage.removeItem("caredoc_token");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
