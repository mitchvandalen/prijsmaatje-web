"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthButtons() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link href="/login">Inloggen</Link>
        <Link href="/register">Registreren</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ opacity: 0.85 }}>{user.email}</span>

      {user.is_premium ? (
        <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999, border: "1px solid #ddd" }}>
          Premium
        </span>
      ) : (
        <Link href="/premium">Upgrade</Link>
      )}

      <button
        onClick={async () => {
          await logout();
          router.refresh();
        }}
      >
        Uitloggen
      </button>
    </div>
  );
}
