"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prijsmaatje.nl";

function errorToText(err: any): string {
  if (!err) return "Onbekende fout";
  if (typeof err === "string") return err;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;

  if (err?.detail) {
    if (Array.isArray(err.detail)) {
      const msgs = err.detail
        .map((d: any) => d?.msg || d?.message || "")
        .filter(Boolean);
      if (msgs.length) return msgs.join(", ");
    }
    if (typeof err.detail === "string") return err.detail;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return "Onbekende fout";
  }
}

export default function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSuccessText(null);

    if (!token) {
      setError("Ongeldige resetlink.");
      return;
    }

    if (password !== passwordRepeat) {
      setError("De wachtwoorden zijn niet gelijk.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw data;
      }

      setSuccessText(data?.message || "Je wachtwoord is succesvol gewijzigd.");

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (err: any) {
      setError(errorToText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div className="pm-title">Nieuw wachtwoord 🔐</div>
        <div className="pm-subtitle">
          Stel een nieuw wachtwoord in voor je account.
        </div>
      </div>

      <div className="pm-sep" />

      <div style={{ maxWidth: 520 }}>
        <div className="pm-card">
          <div className="pm-h2">Wachtwoord resetten</div>
          <div className="pm-text" style={{ marginBottom: 12 }}>
            Vul hieronder je nieuwe wachtwoord in.
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="pm-text" style={{ fontWeight: 600 }}>
                Nieuw wachtwoord
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Nieuw wachtwoord"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="pm-text" style={{ fontWeight: 600 }}>
                Herhaal wachtwoord
              </span>
              <input
                type="password"
                value={passwordRepeat}
                onChange={(e) => setPasswordRepeat(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Herhaal wachtwoord"
              />
            </label>

            {successText && (
              <div
                className="pm-text"
                style={{
                  color: "#166534",
                  fontWeight: 600,
                  background: "rgba(22,101,52,0.06)",
                  border: "1px solid rgba(22,101,52,0.18)",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                {successText}
              </div>
            )}

            {error && (
              <div
                className="pm-text"
                style={{
                  color: "#dc2626",
                  fontWeight: 600,
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.18)",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                {error}
              </div>
            )}

            <button className="pm-btn" disabled={submitting}>
              {submitting ? "Bezig..." : "Opslaan"}
            </button>
          </form>

          <div className="pm-caption" style={{ marginTop: 14 }}>
            Terug naar{" "}
            <Link
              href="/login"
              style={{ color: "var(--pm-indigo)", fontWeight: 700 }}
            >
              inloggen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}