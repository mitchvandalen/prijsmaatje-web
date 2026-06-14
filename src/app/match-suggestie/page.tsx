"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Store = "AH" | "Jumbo" | "Dirk";
type TargetStore = "Jumbo" | "Dirk";

type Product = {
  product_id: string | number;
  label?: string;
  name?: string;
  store?: Store;
  image_url?: string | null;
  price?: number | null;
  brand?: string | null;
  unit_size?: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prijsmaatje.nl";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(((init?.headers as Record<string, string>) || {})),
  };

  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
    );
  }

  return (await res.json()) as T;
}

function euro(n: number | undefined | null) {
  if (typeof n !== "number" || !isFinite(n)) return "—";

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function productName(p: Product | null) {
  if (!p) return "—";
  return p.name || p.label || "Onbekend product";
}

function ProductCard({
  product,
  store,
  selected,
  onClick,
}: {
  product: Product;
  store?: Store;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border bg-white p-3 text-left transition hover:bg-slate-50 ${
        selected ? "ring-2 ring-emerald-400" : ""
      }`}
    >
      <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
        <div className="h-12 w-12">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-slate-100" />
          )}
        </div>

        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-medium leading-snug">
            {productName(product)}
          </div>

          <div className="mt-0.5 text-xs text-slate-500">
            {store || product.store || "—"}
            {product.unit_size ? ` • ${product.unit_size}` : ""}
          </div>
        </div>

        <div className="text-sm font-semibold">
          {euro(product.price)}
        </div>
      </div>
    </button>
  );
}

export default function MatchSuggestiePage() {
  const [checkingUser, setCheckingUser] = useState(true);
  const [premium, setPremium] = useState(false);

  const [ahQuery, setAhQuery] = useState("");
  const [ahResults, setAhResults] = useState<Product[]>([]);
  const [selectedAh, setSelectedAh] = useState<Product | null>(null);

  const [targetStore, setTargetStore] = useState<TargetStore>("Jumbo");
  const [targetQuery, setTargetQuery] = useState("");
  const [targetResults, setTargetResults] = useState<Product[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Product | null>(null);

  const [reason, setReason] = useState("");
  const [loadingAh, setLoadingAh] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api<{ is_premium: boolean }>("/auth/me")
      .then((me) => setPremium(Boolean(me.is_premium)))
      .catch(() => setPremium(false))
      .finally(() => setCheckingUser(false));
  }, []);

  async function searchAh() {
    setError("");
    setSuccess("");
    setSelectedAh(null);

    const q = ahQuery.trim();
    if (q.length < 2) {
      setError("Typ minimaal 2 tekens om te zoeken.");
      return;
    }

    setLoadingAh(true);
    try {
      const rows = await api<Product[]>(
        `/products/search?q=${encodeURIComponent(q)}&store=AH&limit=30`
      );
      setAhResults(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || "AH producten zoeken mislukt.");
      setAhResults([]);
    } finally {
      setLoadingAh(false);
    }
  }

  async function searchTarget() {
    setError("");
    setSuccess("");
    setSelectedTarget(null);

    const q = targetQuery.trim();
    if (q.length < 2) {
      setError("Typ minimaal 2 tekens om te zoeken.");
      return;
    }

    setLoadingTarget(true);
    try {
      const rows = await api<Product[]>(
        `/products/search?q=${encodeURIComponent(q)}&store=${encodeURIComponent(
          targetStore
        )}&limit=30`
      );
      setTargetResults(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || `${targetStore} producten zoeken mislukt.`);
      setTargetResults([]);
    } finally {
      setLoadingTarget(false);
    }
  }

  async function submitSuggestion() {
    setError("");
    setSuccess("");

    if (!selectedAh) {
      setError("Selecteer eerst een AH product.");
      return;
    }

    if (!selectedTarget) {
      setError(`Selecteer eerst een ${targetStore} product.`);
      return;
    }

    setSubmitting(true);

    try {
      await api("/match-suggestions/submit", {
        method: "POST",
        body: JSON.stringify({
          ah_product: selectedAh,
          store: targetStore.toLowerCase(),
          suggested_product: selectedTarget,
          reason: reason.trim() || null,
        }),
      });

      setSuccess(
        "Bedankt! Je matchsuggestie is opgeslagen en wordt later gecontroleerd."
      );

      setSelectedTarget(null);
      setTargetResults([]);
      setTargetQuery("");
      setReason("");
    } catch (e: any) {
      setError(e?.message || "Matchsuggestie opslaan mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingUser) {
    return (
      <div className="space-y-6">
        <div className="pm-header">
          <h1 className="pm-title">Match voorstellen 🔧</h1>
          <p className="pm-subtitle">Gebruiker controleren…</p>
        </div>
      </div>
    );
  }

  if (!premium) {
    return (
      <div className="space-y-6">
        <div className="pm-header">
          <h1 className="pm-title">Match voorstellen 🔧</h1>
          <p className="pm-subtitle">
            Help PrijsMaatje betere productmatches maken.
          </p>
        </div>

        <div className="pm-card">
          <h2 className="pm-h2">💎 Premium vereist</h2>
          <p className="pm-text">
            Matchsuggesties indienen is beschikbaar voor Premium gebruikers.
          </p>

          <div className="pm-ctaWrap">
            <Link href="/premium" className="pm-ctaBtn">
              Bekijk Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pm-header">
        <h1 className="pm-title">Match voorstellen 🔧</h1>
        <p className="pm-subtitle">
          Klopt een productmatch niet of ontbreekt er een match? Stel hier de
          juiste match voor.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Je voorstel wordt opgeslagen en later handmatig gecontroleerd voordat de
        match definitief wordt aangepast.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="pm-card">
          <h2 className="pm-h2">1. Zoek AH product</h2>

          <div className="flex gap-2">
            <input
              value={ahQuery}
              onChange={(e) => setAhQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchAh();
              }}
              placeholder="Bijv. melk, kaas, cola..."
              className="text-base"
              style={{ fontSize: "16px" }}
            />

            <button
              type="button"
              className="pm-btn"
              onClick={searchAh}
              disabled={loadingAh}
            >
              {loadingAh ? "Zoeken…" : "Zoek"}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {ahResults.length ? (
              ahResults.map((p) => (
                <ProductCard
                  key={`ah-${p.product_id}`}
                  product={p}
                  store="AH"
                  selected={selectedAh?.product_id === p.product_id}
                  onClick={() => {
                    setSelectedAh(p);
                    if (!targetQuery.trim()) {
                      setTargetQuery(productName(p));
                    }
                  }}
                />
              ))
            ) : (
              <div className="text-sm text-slate-500">
                Nog geen AH producten gevonden.
              </div>
            )}
          </div>
        </section>

        <section className="pm-card">
          <h2 className="pm-h2">2. Zoek juiste match</h2>

          <div className="pm-checkRow mb-4">
            {(["Jumbo", "Dirk"] as TargetStore[]).map((s) => (
              <label key={s} className="pm-checkPill">
                <input
                  type="radio"
                  checked={targetStore === s}
                  onChange={() => {
                    setTargetStore(s);
                    setSelectedTarget(null);
                    setTargetResults([]);
                  }}
                />
                {s}
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchTarget();
              }}
              placeholder={`Zoek product in ${targetStore}`}
              className="text-base"
              style={{ fontSize: "16px" }}
            />

            <button
              type="button"
              className="pm-btn"
              onClick={searchTarget}
              disabled={loadingTarget}
            >
              {loadingTarget ? "Zoeken…" : "Zoek"}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {targetResults.length ? (
              targetResults.map((p) => (
                <ProductCard
                  key={`${targetStore}-${p.product_id}`}
                  product={p}
                  store={targetStore}
                  selected={selectedTarget?.product_id === p.product_id}
                  onClick={() => setSelectedTarget(p)}
                />
              ))
            ) : (
              <div className="text-sm text-slate-500">
                Nog geen {targetStore} producten gevonden.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="pm-card">
        <h2 className="pm-h2">3. Controleer en verstuur</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="pm-label">AH product</div>
            {selectedAh ? (
              <ProductCard product={selectedAh} store="AH" />
            ) : (
              <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
                Geen AH product geselecteerd.
              </div>
            )}
          </div>

          <div>
            <div className="pm-label">{targetStore} product</div>
            {selectedTarget ? (
              <ProductCard product={selectedTarget} store={targetStore} />
            ) : (
              <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
                Geen {targetStore} product geselecteerd.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="pm-label">Opmerking</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijv. dit is exact hetzelfde product, huidige match klopt niet..."
            style={{ fontSize: "16px" }}
          />
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="pm-btn"
            disabled={submitting}
            onClick={submitSuggestion}
          >
            {submitting ? "Versturen…" : "Match voorstellen"}
          </button>
        </div>

        {success ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  );
}