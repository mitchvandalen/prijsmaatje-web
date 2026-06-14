"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Store = "AH" | "Jumbo" | "Dirk";

type Product = {
  product_id: string | number;
  label?: string;
  name?: string;
  store?: Store;
  image_url?: string | null;
  price?: number | null;
  brand?: string | null;
  unit_size?: string | null;
  quantity?: number | null;
  unit?: string | null;
  product_url?: string | null;
  score?: number | null;
  status?: string | null;
  fallback_used?: boolean | null;
};

type CurrentMatchResponse = {
  found: boolean;
  ah?: Product | null;
  jumbo?: Product | null;
  dirk?: Product | null;
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

function productSearchText(p: Product | null) {
  if (!p) return "";

  const name = productName(p);
  const unitSize = p.unit_size ? ` ${p.unit_size}` : "";

  return `${name}${unitSize}`.trim();
}

function ProductCard({
  product,
  store,
  selected,
  onClick,
  label,
}: {
  product: Product;
  store?: Store;
  selected?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const clickable = Boolean(onClick);

  const inner = (
    <div
      className={`w-full rounded-lg border bg-white p-3 text-left transition ${
        selected ? "ring-2 ring-emerald-400" : ""
      } ${clickable ? "hover:bg-slate-50" : ""}`}
    >
      {label ? (
        <div className="mb-2 text-xs font-medium text-slate-500">{label}</div>
      ) : null}

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

          {product.score != null || product.status ? (
            <div className="mt-0.5 text-xs text-slate-400">
              {product.status ? `Status: ${product.status}` : null}
              {product.status && product.score != null ? " • " : null}
              {product.score != null ? `Score: ${product.score}` : null}
            </div>
          ) : null}
        </div>

        <div className="text-sm font-semibold">{euro(product.price)}</div>
      </div>
    </div>
  );

  if (!clickable) return inner;

  return (
    <button type="button" onClick={onClick} className="w-full">
      {inner}
    </button>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}

function SearchBlock({
  title,
  store,
  query,
  setQuery,
  loading,
  onSearch,
  results,
  selected,
  onSelect,
  placeholder,
}: {
  title: string;
  store: Store;
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  onSearch: () => void;
  results: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
  placeholder: string;
}) {
  return (
    <section className="pm-card">
      <h2 className="pm-h2">{title}</h2>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder={placeholder}
          className="text-base"
          style={{ fontSize: "16px" }}
        />

        <button
          type="button"
          className="pm-btn"
          onClick={onSearch}
          disabled={loading}
        >
          {loading ? "Zoeken…" : "Zoek"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {results.length ? (
          results.map((p) => (
            <ProductCard
              key={`${store}-${p.product_id}`}
              product={p}
              store={store}
              selected={selected?.product_id === p.product_id}
              onClick={() => onSelect(p)}
            />
          ))
        ) : (
          <div className="text-sm text-slate-500">
            Nog geen {store} producten gevonden.
          </div>
        )}
      </div>
    </section>
  );
}

export default function MatchSuggestiePage() {
  const [checkingUser, setCheckingUser] = useState(true);
  const [premium, setPremium] = useState(false);

  const [ahQuery, setAhQuery] = useState("");
  const [ahResults, setAhResults] = useState<Product[]>([]);
  const [selectedAh, setSelectedAh] = useState<Product | null>(null);

  const [currentMatch, setCurrentMatch] = useState<CurrentMatchResponse | null>(
    null
  );
  const [loadingCurrentMatch, setLoadingCurrentMatch] = useState(false);

  const [jumboQuery, setJumboQuery] = useState("");
  const [jumboResults, setJumboResults] = useState<Product[]>([]);
  const [selectedJumbo, setSelectedJumbo] = useState<Product | null>(null);

  const [dirkQuery, setDirkQuery] = useState("");
  const [dirkResults, setDirkResults] = useState<Product[]>([]);
  const [selectedDirk, setSelectedDirk] = useState<Product | null>(null);

  const [reason, setReason] = useState("");

  const [loadingAh, setLoadingAh] = useState(false);
  const [loadingJumbo, setLoadingJumbo] = useState(false);
  const [loadingDirk, setLoadingDirk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api<{ is_premium: boolean }>("/auth/me")
      .then((me) => setPremium(Boolean(me.is_premium)))
      .catch(() => setPremium(false))
      .finally(() => setCheckingUser(false));
  }, []);

  async function searchProducts(store: Store, query: string): Promise<Product[]> {
    const q = query.trim();

    if (q.length < 2) {
      throw new Error("Typ minimaal 2 tekens om te zoeken.");
    }

    const rows = await api<Product[]>(
      `/products/search?q=${encodeURIComponent(q)}&store=${encodeURIComponent(
        store
      )}&limit=30`
    );

    return Array.isArray(rows) ? rows : [];
  }

  async function searchAh() {
    setError("");
    setSuccess("");
    setSelectedAh(null);
    setCurrentMatch(null);
    setSelectedJumbo(null);
    setSelectedDirk(null);

    setLoadingAh(true);
    try {
      const rows = await searchProducts("AH", ahQuery);
      setAhResults(rows);
    } catch (e: any) {
      setError(e?.message || "AH producten zoeken mislukt.");
      setAhResults([]);
    } finally {
      setLoadingAh(false);
    }
  }

  async function searchJumbo() {
    setError("");
    setSuccess("");
    setSelectedJumbo(null);

    setLoadingJumbo(true);
    try {
      const rows = await searchProducts("Jumbo", jumboQuery);
      setJumboResults(rows);
    } catch (e: any) {
      setError(e?.message || "Jumbo producten zoeken mislukt.");
      setJumboResults([]);
    } finally {
      setLoadingJumbo(false);
    }
  }

  async function searchDirk() {
    setError("");
    setSuccess("");
    setSelectedDirk(null);

    setLoadingDirk(true);
    try {
      const rows = await searchProducts("Dirk", dirkQuery);
      setDirkResults(rows);
    } catch (e: any) {
      setError(e?.message || "Dirk producten zoeken mislukt.");
      setDirkResults([]);
    } finally {
      setLoadingDirk(false);
    }
  }

  async function loadCurrentMatch(product: Product) {
    const productId = product.product_id;

    if (productId === null || productId === undefined || productId === "") {
      setCurrentMatch(null);
      return;
    }

    setLoadingCurrentMatch(true);
    try {
      const row = await api<CurrentMatchResponse>(
        `/match-suggestions/current-match/${encodeURIComponent(
          String(productId)
        )}`
      );

      setCurrentMatch(row);
    } catch (e: any) {
      setCurrentMatch(null);
      setError(e?.message || "Bestaande match ophalen mislukt.");
    } finally {
      setLoadingCurrentMatch(false);
    }
  }

  function selectAhProduct(product: Product) {
    setSelectedAh(product);
    setSuccess("");
    setError("");

    setJumboQuery(ahQuery);
    setDirkQuery(ahQuery);

    setJumboResults([]);
    setDirkResults([]);
    setSelectedJumbo(null);
    setSelectedDirk(null);

    loadCurrentMatch(product);
  }

  async function submitSuggestion() {
    setError("");
    setSuccess("");

    if (!selectedAh) {
      setError("Selecteer eerst een AH product.");
      return;
    }

    if (!selectedJumbo && !selectedDirk) {
      setError("Selecteer minimaal een Jumbo of Dirk product.");
      return;
    }

    setSubmitting(true);

    try {
      await api("/match-suggestions/submit", {
        method: "POST",
        body: JSON.stringify({
          ah_product: selectedAh,
          jumbo_product: selectedJumbo,
          dirk_product: selectedDirk,
          reason: reason.trim() || null,
        }),
      });

      setSuccess(
        "Bedankt! Je matchsuggestie is opgeslagen en wordt later gecontroleerd."
      );

      setSelectedJumbo(null);
      setSelectedDirk(null);
      setJumboResults([]);
      setDirkResults([]);
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
          juiste Jumbo- en/of Dirk-match voor.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Je voorstel wordt opgeslagen en later handmatig gecontroleerd voordat de
        match definitief wordt aangepast.
      </div>

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

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {ahResults.length ? (
            ahResults.map((p) => (
              <ProductCard
                key={`ah-${p.product_id}`}
                product={p}
                store="AH"
                selected={selectedAh?.product_id === p.product_id}
                onClick={() => selectAhProduct(p)}
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
        <h2 className="pm-h2">2. Huidige matches</h2>

        {!selectedAh ? (
          <EmptyCard text="Selecteer eerst een AH product om bestaande matches te bekijken." />
        ) : loadingCurrentMatch ? (
          <EmptyCard text="Bestaande matches laden…" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="pm-label">AH product</div>
              <ProductCard product={selectedAh} store="AH" />
            </div>

            <div>
              <div className="pm-label">Huidige Jumbo match</div>
              {currentMatch?.jumbo ? (
                <ProductCard product={currentMatch.jumbo} store="Jumbo" />
              ) : (
                <EmptyCard text="Geen huidige Jumbo match gevonden." />
              )}
            </div>

            <div>
              <div className="pm-label">Huidige Dirk match</div>
              {currentMatch?.dirk ? (
                <ProductCard product={currentMatch.dirk} store="Dirk" />
              ) : (
                <EmptyCard text="Geen huidige Dirk match gevonden." />
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SearchBlock
          title="3. Zoek nieuwe Jumbo match"
          store="Jumbo"
          query={jumboQuery}
          setQuery={setJumboQuery}
          loading={loadingJumbo}
          onSearch={searchJumbo}
          results={jumboResults}
          selected={selectedJumbo}
          onSelect={setSelectedJumbo}
          placeholder="Zoek product in Jumbo"
        />

        <SearchBlock
          title="4. Zoek nieuwe Dirk match"
          store="Dirk"
          query={dirkQuery}
          setQuery={setDirkQuery}
          loading={loadingDirk}
          onSearch={searchDirk}
          results={dirkResults}
          selected={selectedDirk}
          onSelect={setSelectedDirk}
          placeholder="Zoek product in Dirk"
        />
      </div>

      <section className="pm-card">
        <h2 className="pm-h2">5. Controleer en verstuur</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <div className="pm-label">AH product</div>
            {selectedAh ? (
              <ProductCard product={selectedAh} store="AH" />
            ) : (
              <EmptyCard text="Geen AH product geselecteerd." />
            )}
          </div>

          <div>
            <div className="pm-label">Nieuwe Jumbo match</div>
            {selectedJumbo ? (
              <ProductCard product={selectedJumbo} store="Jumbo" />
            ) : (
              <EmptyCard text="Geen Jumbo product geselecteerd." />
            )}
          </div>

          <div>
            <div className="pm-label">Nieuwe Dirk match</div>
            {selectedDirk ? (
              <ProductCard product={selectedDirk} store="Dirk" />
            ) : (
              <EmptyCard text="Geen Dirk product geselecteerd." />
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
            {submitting ? "Versturen…" : "Matchsuggestie opslaan"}
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