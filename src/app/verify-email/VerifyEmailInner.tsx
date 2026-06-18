"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function VerifyEmailInner({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccessText(null);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw data;
      }

      setSuccessText(
        data?.message || "Je e-mailadres is geverifieerd. Je kunt nu inloggen."
      );

      setTimeout(() => {
        router.replace(`/login?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (err: any) {
      setError(errorToText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (resending) return;

    setResending(true);
    setError(null);
    setSuccessText(null);

    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification-code`, {
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

      setSuccessText(data?.message || "Nieuwe verificatiecode verstuurd.");
    } catch (err: any) {
      setError(errorToText(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div className="pm-title">E-mailadres verifiëren ✉️</div>
        <div className="pm-subtitle">
          Vul de verificatiecode in die we naar je e-mailadres hebben gestuurd.
        </div>
      </div>

      <div className="pm-sep" />

      <div style={{ maxWidth: 520 }}>
        <div className="pm-card">
          <div className="pm-h2">Verificatiecode</div>

          <div className="pm-text" style={{ marginBottom: 12 }}>
            Controleer je inbox en eventueel je spammap. De code is tijdelijk
            geldig.
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

            <label style={{ display: "grid", gap: 6 }}>
              <span className="pm-text" style={{ fontWeight: 600 }}>
                Code
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                style={{
                  fontSize: 24,
                  letterSpacing: 4,
                  textAlign: "center",
                }}
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
              {submitting ? "Controleren..." : "E-mailadres verifiëren"}
            </button>
          </form>

          <div className="pm-caption" style={{ marginTop: 14 }}>
            Geen code ontvangen?{" "}
            <button
              type="button"
              onClick={resendCode}
              disabled={resending || !email}
              style={{
                color: "var(--pm-indigo)",
                fontWeight: 700,
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
              }}
            >
              {resending ? "Versturen..." : "Nieuwe code sturen"}
            </button>
          </div>

          <div className="pm-caption" style={{ marginTop: 10 }}>
            Al geverifieerd?{" "}
            <Link
              href="/login"
              style={{ color: "var(--pm-indigo)", fontWeight: 700 }}
            >
              Inloggen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}