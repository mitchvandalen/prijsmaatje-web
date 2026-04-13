import ResetPasswordClient from "./ResetPasswordClient";

export default function Page() {
  return <ResetPasswordClient />;
}

"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prijsmaatje.nl";

export default function ResetPasswordClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!token) {
      setError("Ongeldige resetlink.");
      return;
    }

    if (password !== passwordRepeat) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw data;
      }

      router.replace("/login");
    } catch (err: any) {
      setError(err?.detail || "Fout bij resetten");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pm-page">
      <div className="pm-card">
        <h2>Nieuw wachtwoord</h2>

        <form onSubmit={onSubmit}>
          <input
            type="password"
            placeholder="Nieuw wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Herhaal wachtwoord"
            value={passwordRepeat}
            onChange={(e) => setPasswordRepeat(e.target.value)}
          />

          {error && <div style={{ color: "red" }}>{error}</div>}

          <button disabled={submitting}>
            {submitting ? "Bezig..." : "Opslaan"}
          </button>
        </form>
      </div>
    </div>
  );
}