"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

function errorToText(err: any): string {
  if (!err) return "Onbekende fout";
  if (typeof err === "string") return err;

  if (typeof err?.message === "string" && err.message.trim()) return err.message;

  // FastAPI validation errors: { detail: [{loc,msg,type,...}, ...] }
  if (err?.detail) {
    if (Array.isArray(err.detail)) {
      const msgs = err.detail
        .map((d: any) => d?.msg || d?.message || "")
        .filter(Boolean);
      if (msgs.length) return msgs.join(", ");
      return "Ongeldige invoer (detail)";
    }
    if (typeof err.detail === "string") return err.detail;
  }

  // Soms komt het als { error: "..."} of { msg: "..." }
  if (typeof err?.error === "string") return err.error;
  if (typeof err?.msg === "string") return err.msg;

  try {
    return JSON.stringify(err);
  } catch {
    return "Onbekende fout";
  }
}

export default function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextQuery = useMemo(() => sp.get("next"), [sp]);

  function safeNext(): string | null {
    const next = nextQuery;
    if (!next) return null;

    try {
      const decoded = decodeURIComponent(next);
      // voorkom open redirect: alleen interne paden
      if (decoded.startsWith("/")) return decoded;
      return null;
    } catch {
      return null;
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      // ✅ 3e argument is boolean
      await login(email, password, false);

      const next = safeNext();
      router.replace(next || "/");
    } catch (err: any) {
      // ✅ Altijd omzetten naar string zodat React nooit een object rendert
      setError(errorToText(err));
    } finally {
      setSubmitting(false);
    }
  }

  const registerHref = `/register${nextQuery ? `?next=${encodeURIComponent(nextQuery)}` : ""}`;

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div className="pm-title">PrijsMaatje 🛒</div>
        <div className="pm-subtitle">
          Log in om je geschiedenis, vaste lijstjes en Premium te gebruiken.
        </div>
      </div>

      <div className="pm-sep" />

      <div style={{ maxWidth: 520 }}>
        <div className="pm-card">
          <div className="pm-h2">Inloggen</div>
          <div className="pm-text" style={{ marginBottom: 12 }}>
            Welkom terug! Log in om verder te gaan.
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
                Wachtwoord
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Je wachtwoord"
              />
            </label>

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
              {submitting ? "Bezig..." : "Inloggen"}
            </button>
          </form>

          <div className="pm-caption" style={{ marginTop: 14 }}>
            Nog geen account?{" "}
            <Link href={registerHref} style={{ color: "var(--pm-indigo)", fontWeight: 700 }}>
              Registreren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
