"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

export type User = {
  user_id: string;
  email: string;
  is_premium: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const me = await apiFetch<User>("/auth/me", { method: "GET" });
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string, rememberMe: boolean) {
    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });
    await refresh();
  }

  async function register(email: string, password: string) {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // Jouw backend zet cookie direct bij register, dus /me moet daarna werken. :contentReference[oaicite:6]{index=6}
    await refresh();
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
