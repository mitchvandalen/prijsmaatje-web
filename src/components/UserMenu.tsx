"use client";

import Link from "next/link";
import { useAuth } from "@lib/auth";

export function UserMenu() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/login">Inloggen</Link>
        <Link href="/register">Registreren</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span>Ingelogd als {user.email}</span>
      <button onClick={logout}>Uitloggen</button>
    </div>
  );
}
