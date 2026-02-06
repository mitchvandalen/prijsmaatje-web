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
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
}

export default function PremiumSuccessPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { refresh } = useAuth();

  // optioneel: als je vanuit paywall kwam: /premium/success?next=%2Fvergelijken
  const nextRaw = sp.get("next");
  const nextPath =
    nextRaw && decodeURIComponent(nextRaw).startsWith("/")
      ? decodeURIComponent(nextRaw)
      : "/vergelijken";

  const [countdown, setCountdown] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  useEffect(() => {
    // 1) refresh auth/user info
    refresh().catch(() => {});

    // 2) haal billing status op (optioneel maar nice)
    api<BillingStatus>("/billing/status")
      .then(setBilling)
      .catch(() => setBilling(null));

    // 3) countdown + redirect (stabiel)
    const intervalId = window.setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      router.push(nextPath);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [refresh, router, nextPath]);

  async function openPortal() {
    setError("");
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

  return (
    <div className="pm-page">
      <div className="pm-content">
        <div className="pm-card">
          <h1 className="pm-title">🎉 Premium geactiveerd</h1>

          <p className="pm-text" style={{ marginTop: 8 }}>
            Bedankt voor je betaling! Je Premium-account is actief.
          </p>

          {billing?.current_period_end && (
            <p className="pm-text" style={{ marginTop: 8, opacity: 0.9 }}>
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

          <p className="pm-text" style={{ marginTop: 8 }}>
            Je wordt automatisch doorgestuurd over <b>{countdown}</b> seconden.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button className="pm-btn" onClick={() => router.push(nextPath)}>
              Ga vergelijken →
            </button>

            <button className="pm-btn" onClick={openPortal} disabled={busy}>
              {busy ? "Even wachten…" : "Abonnement beheren"}
            </button>
          </div>

          {error && (
            <p className="pm-text" style={{ color: "#dc2626", marginTop: 10 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
