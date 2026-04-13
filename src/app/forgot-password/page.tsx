"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccessText(null);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw data;
      }

      setSuccessText(
        data?.message ||
          "Als er een account bestaat voor dit e-mailadres, is er een resetlink verstuurd."
      );
    } catch (err: any) {
      setError(errorToText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div className="pm-title">Wachtwoord vergeten 🔑</div>
        <div className="pm-subtitle">
          Vul je e-mailadres in. Als er een account bestaat, sturen we een resetlink.
        </div>
      </div>

      <div className="pm-sep" />

      <div style={{ maxWidth: 520 }}>
        <div className="pm-card">
          <div className="pm-h2">Resetlink aanvragen</div>
          <div className="pm-text" style={{ marginBottom: 12 }}>
            We sturen je een link waarmee je een nieuw wachtwoord kunt instellen.
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="pm-text" style={{ fontWeight: 600 }}>
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="jij@voorbeeld.nl"
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
              {submitting ? "Bezig..." : "Verstuur resetlink"}
            </button>
          </form>

          <div className="pm-caption" style={{ marginTop: 14 }}>
            Weet je je wachtwoord toch weer?{" "}
            <Link
              href="/login"
              style={{ color: "var(--pm-indigo)", fontWeight: 700 }}
            >
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}