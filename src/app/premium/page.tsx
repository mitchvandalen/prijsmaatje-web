"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {};
  if (init?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }

  return (await res.json()) as T;
}

type BillingStatus = {
  is_premium: boolean;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_used?: boolean;
  trial_started_at?: string | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
}

export default function PremiumPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, loading } = useAuth();

  const nextRaw = sp.get("next");
  const nextPath =
    nextRaw && decodeURIComponent(nextRaw).startsWith("/")
      ? decodeURIComponent(nextRaw)
      : null;

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setBilling(null);
      return;
    }
    api<BillingStatus>("/billing/status")
      .then(setBilling)
      .catch(() => setBilling(null));
  }, [user]);

  const isPremium = Boolean(billing?.is_premium);

  async function activatePremium() {
    setError("");

    if (!user) {
      router.push(`/register?next=${encodeURIComponent("/premium")}`);
      return;
    }

    try {
      setBusy(true);
      const { url } = await api<{ url: string }>("/billing/checkout-session", {
        method: "POST",
      });
      window.location.href = url;
    } catch (e: any) {
      setError(e?.message || "Doorsturen naar betaling mislukt");
      setBusy(false);
    }
  }

  async function openPortal() {
    setError("");

    if (!user) {
      router.push(`/register?next=${encodeURIComponent("/premium")}`);
      return;
    }

    try {
      setBusy(true);
      const { url } = await api<{ url: string }>("/billing/portal-session", {
        method: "POST",
      });
      window.location.href = url;
    } catch (e: any) {
      setError(e?.message || "Portal openen mislukt");
      setBusy(false);
    }
  }

  if (loading) return <div className="pm-page">Laden…</div>;

  return (
    <div className="pm-page">
      <div className="pm-content">
        <div className="pm-header">
          <h1 className="pm-title">PrijsMaatje Premium 💎</h1>
          <p className="pm-subtitle">Meer besparen, meer overzicht, geen limieten.</p>
        </div>

        <div className="pm-sep" />

        <div className="pm-card">
          <h2 className="pm-h2">Wat krijg je met Premium?</h2>

          <ul className="pm-bullets">
            <li>🔓 Onbeperkt vergelijken</li>
            <li>💾 Vergelijkingen opslaan</li>
            <li>📊 Geschiedenis & vaste lijstjes</li>
            <li>🔔 Prijsalerts (binnenkort)</li>
            <li>🧪 7 dagen gratis proefperiode (1x)</li>
          </ul>

          {isPremium ? (
            <>
              <div className="pm-status pm-status--active">Premium is actief 💎</div>

              {billing?.current_period_end && (
                <p className="pm-text" style={{ marginTop: 8 }}>
                  {billing.cancel_at_period_end ? (
                    <>
                      Je abonnement stopt op <b>{formatDate(billing.current_period_end)}</b>.
                    </>
                  ) : (
                    <>
                      Volgende verlenging op <b>{formatDate(billing.current_period_end)}</b>.
                    </>
                  )}
                </p>
              )}

              <div style={{ marginTop: 12 }}>
                <button className="pm-btn" onClick={openPortal} disabled={busy}>
                  {busy ? "Even wachten…" : "Abonnement beheren"}
                </button>
              </div>

              {nextPath && (
                <p className="pm-text" style={{ marginTop: 10, opacity: 0.85 }}>
                  Tip: je kunt nu terug naar je vorige pagina.
                </p>
              )}
            </>
          ) : (
            <>
              <button className="pm-btn" onClick={activatePremium} disabled={busy}>
                {busy ? "Doorsturen…" : "Activeer Premium (7 dagen gratis)"}
              </button>

              {billing?.trial_used && (
                <p className="pm-text" style={{ marginTop: 8, opacity: 0.85 }}>
                  Je gratis proefperiode is al gebruikt. Je start direct met een betaald abonnement.
                </p>
              )}
            </>
          )}

          {error && (
            <p className="pm-text" style={{ color: "#dc2626", marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
