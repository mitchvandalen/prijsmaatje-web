"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Store = "AH" | "Jumbo" | "Dirk";

type CompareMatchRow = {
  product: string;
  AH: number | null;
  Jumbo: number | null;
  Dirk: number | null;

  AH_naam: string | null;
  AH_img: string | null;

  Jumbo_naam: string | null;
  Jumbo_img: string | null;

  Dirk_naam: string | null;
  Dirk_img: string | null;
};

type CheapestRow = {
  product: string;
  store: Store | null;
  price: number | null;
};

type CompareResponse = {
  matches: CompareMatchRow[];
  cheapest_per_product: CheapestRow[];
  totals: { store: Store; total: number }[];
};

type Suggestion = {
  product_id: number;
  label: string;
  store: Store;
  image_url?: string | null;
};

type CompareItem = {
  store: Store;
  product_id?: number | null;
  label?: string | null;
  query?: string | null;
  image_url?: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prijsmaatje.nl";

const PREMIUM_INTENT_KEY = "pm_premium_intent_v1";
const DRAFT_KEY = "pm_compare_draft_v8";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(((init?.headers as Record<string, string>) || {}) ?? {}),
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
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

function safeNumber(n: unknown): number | null {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function normalizeLine(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of lines) {
    const line = normalizeLine(raw);
    const key = line.toLowerCase();
    if (!line || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }

  return out;
}

function ReceiptCard({
  store,
  isWinner,
  subtitle,
  children,
}: {
  store: Store;
  isWinner?: boolean;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        isWinner ? "ring-2 ring-emerald-400" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{store}</div>
        {isWinner ? (
          <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            ✅ Goedkoopste totaal
          </div>
        ) : null}
      </div>

      {subtitle ? (
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      ) : null}

      <div className="mt-3">{children}</div>
    </div>
  );
}

function LineItem({
  img,
  name,
  price,
}: {
  img?: string | null;
  name: string;
  price: number | null;
}) {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-2 py-1">
      <div className="h-9 w-9">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-9 w-9 rounded object-cover" />
        ) : (
          <div className="h-9 w-9 rounded bg-slate-100" />
        )}
      </div>

      <div className="text-sm">
        <div className="line-clamp-2">{name || "—"}</div>
      </div>

      <div className="text-sm font-semibold">
        {price != null ? euro(price) : "—"}
      </div>
    </div>
  );
}

export default function VergelijkenPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);

  const [stores, setStores] = useState<Record<Store, boolean>>({
    AH: true,
    Jumbo: true,
    Dirk: true,
  });

  const [manualText, setManualText] = useState("");
  const [manualList, setManualList] = useState<string[]>([]);
  const [listName, setListName] = useState("");

  const [suggestQuery, setSuggestQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const [selectionMap, setSelectionMap] = useState<Record<string, CompareItem>>(
    {}
  );

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState("");
  const [paywall, setPaywall] = useState<null | { message: string }>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const suggestCache = useRef(new Map<string, Suggestion[]>());
  const abortRef = useRef<AbortController | null>(null);
  const loadedFromHistoryRef = useRef(false);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    api<{ user_id: string; email: string; is_premium: boolean }>("/auth/me")
      .then((me) => {
        setUserId(me.user_id);
        setPremium(Boolean(me.is_premium));
      })
      .catch(() => {
        setUserId(null);
        setPremium(false);
      });
  }, []);

  useEffect(() => {
    try {
      const fromHistory = localStorage.getItem("pm_loaded_from_history");
      const rawList = localStorage.getItem("pm_manual_items_list");

      if (!fromHistory || !rawList) return;

      const parsed = JSON.parse(rawList);
      if (!Array.isArray(parsed)) return;

      const cleaned = uniqueLines(
        parsed.map((x) => String(x ?? "")).filter(Boolean)
      );

      if (!cleaned.length) return;

      loadedFromHistoryRef.current = true;
      setManualText(cleaned.join("\n") + "\n");
      setSelectionMap({});
      setListName("");

      localStorage.removeItem("pm_manual_items_list");
      localStorage.removeItem("pm_loaded_from_history");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (loadedFromHistoryRef.current) return;

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (typeof parsed?.manualText === "string") {
        setManualText(parsed.manualText);
      }
      if (parsed?.stores) {
        setStores(parsed.stores);
      }
      if (typeof parsed?.listName === "string") {
        setListName(parsed.listName);
      }
      if (parsed?.selectionMap) {
        setSelectionMap(parsed.selectionMap);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          manualText,
          stores,
          listName,
          selectionMap,
        })
      );
    } catch {
      // ignore
    }
  }, [manualText, stores, listName, selectionMap]);

  useEffect(() => {
    const lines = uniqueLines(
      manualText
        .split("\n")
        .map((line) => normalizeLine(line))
        .filter(Boolean)
    );

    setManualList(lines);

    setSelectionMap((prev) => {
      const next: Record<string, CompareItem> = {};
      for (const line of lines) {
        if (prev[line]) {
          next[line] = prev[line];
        }
      }
      return next;
    });

    autoGrow();
  }, [manualText]);

  const selectedStores = useMemo(
    () => (Object.keys(stores) as Store[]).filter((store) => stores[store]),
    [stores]
  );

  const totalsMap = useMemo(() => {
    const m = new Map<Store, number>();
    (data?.totals || []).forEach((t) => m.set(t.store, Number(t.total || 0)));
    selectedStores.forEach((s) => {
      if (!m.has(s)) m.set(s, 0);
    });
    return m;
  }, [data, selectedStores]);

  const cheapestStoreTotal = useMemo(() => {
    if (!selectedStores.length) return null;

    let best: Store | null = null;
    let bestVal = Number.POSITIVE_INFINITY;

    selectedStores.forEach((s) => {
      const v = totalsMap.get(s) ?? 0;
      if (v < bestVal) {
        bestVal = v;
        best = s;
      }
    });

    return best;
  }, [selectedStores, totalsMap]);

  useEffect(() => {
    const q = suggestQuery.trim();
    setSuggestError("");

    if (!suggestOpen || q.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    const cacheKey = `ALL|${q.toLowerCase()}`;
    const cached = suggestCache.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setSuggestLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setSuggestLoading(true);

      fetch(`${API_BASE}/products/search?q=${encodeURIComponent(q)}&limit=20`, {
        signal: controller.signal,
        credentials: "include",
        cache: "no-store",
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(
              `${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
            );
          }
          return (await res.json()) as Suggestion[];
        })
        .then((rows) => {
          const list = Array.isArray(rows) ? rows : [];
          suggestCache.current.set(cacheKey, list);
          setSuggestions(list);
        })
        .catch((e: any) => {
          if (e?.name === "AbortError") return;
          setSuggestions([]);
          setSuggestError(e?.message || "Zoeken mislukt.");
        })
        .finally(() => {
          setSuggestLoading(false);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [suggestOpen, suggestQuery]);

  function syncManualTextWithList(nextList: string[]) {
    setManualText(nextList.length ? `${nextList.join("\n")}\n` : "");
  }

  function addSuggestionToList(s: Suggestion) {
    const label = normalizeLine(s.label || "");
    if (!label) return;

    const nextList = uniqueLines([...manualList, label]);
    syncManualTextWithList(nextList);

    setSelectionMap((prev) => ({
      ...prev,
      [label]: {
        store: s.store,
        product_id: s.product_id,
        label: s.label,
        query: s.label,
        image_url: s.image_url ?? null,
      },
    }));

    setSuggestQuery("");
    setSuggestOpen(false);
    setSuggestions([]);
  }

  function removeSelected(label: string) {
    const nextList = manualList.filter(
      (item) =>
        normalizeLine(item).toLowerCase() !== normalizeLine(label).toLowerCase()
    );

    syncManualTextWithList(nextList);

    setSelectionMap((prev) => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
  }

  function buildItemsToSend(): Array<string | CompareItem> {
    return manualList.map((line) => {
      const mapped = selectionMap[line];

      if (mapped?.product_id) {
        return {
          store: mapped.store,
          product_id: mapped.product_id,
          label: mapped.label ?? line,
          query: mapped.query ?? line,
        };
      }

      return line;
    });
  }

  function buildPayload(itemsToSend: Array<string | CompareItem>) {
    return {
      stores: selectedStores,
      items: itemsToSend,
    };
  }

  function startPremiumIntentSave(
    payload: { stores: Store[]; items: Array<string | CompareItem> },
    result: CompareResponse | null
  ) {
    if (!userId) {
      router.push(
        `/premium?next=${encodeURIComponent("/vergelijken")}&intent=save_compare`
      );
      return;
    }

    const intent = {
      intent: "save_compare",
      from: "vergelijken",
      created_at: new Date().toISOString(),
      user_id: userId,
      name: (listName || "").trim() || null,
      draft: {
        manualText,
        stores,
        selectionMap,
      },
      compare: {
        payload,
        result,
      },
    };

    localStorage.setItem(PREMIUM_INTENT_KEY, JSON.stringify(intent));
    router.push("/premium?intent=save_compare");
  }

  async function runCompare() {
    setError("");
    setPaywall(null);
    setData(null);
    setSaveStatus("idle");

    if (!manualList.length) {
      setError("Voeg minimaal 1 product toe.");
      return;
    }

    if (!selectedStores.length) {
      setError("Selecteer minimaal 1 supermarkt.");
      return;
    }

    setLoading(true);

    try {
      const itemsToSend = buildItemsToSend();
      const payload = buildPayload(itemsToSend);

      const res = await api<CompareResponse>("/compare", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setData(res);

      if (premium && userId) {
        setSaveStatus("saving");
        try {
          await api("/premium/save_compare", {
            method: "POST",
            body: JSON.stringify({
              user_id: userId,
              payload,
              result: res,
              name: (listName || "").trim() || null,
            }),
          });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("failed");
        }
      }
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.startsWith("402")) {
        setPaywall({
          message:
            "Je hebt je gratis limiet bereikt. Bekijk Premium om onbeperkt te vergelijken en je resultaten op te slaan.",
        });
        return;
      }

      setError(e?.message || "Er ging iets mis tijdens vergelijken.");
    } finally {
      setLoading(false);
    }
  }

  const cheapestByStore = useMemo(() => {
    const buckets: Record<Store, CheapestRow[]> = {
      AH: [],
      Jumbo: [],
      Dirk: [],
    };
    const unpriced: string[] = [];

    for (const row of data?.cheapest_per_product || []) {
      if (!row?.store) {
        unpriced.push(row?.product || "—");
        continue;
      }
      buckets[row.store].push(row);
    }

    const subtotals: Record<Store, number> = {
      AH: 0,
      Jumbo: 0,
      Dirk: 0,
    };

    (Object.keys(buckets) as Store[]).forEach((s) => {
      subtotals[s] = buckets[s].reduce(
        (acc, r) => acc + (safeNumber(r.price) ?? 0),
        0
      );
    });

    return { buckets, subtotals, unpriced };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="pm-header">
        <h1 className="pm-title">Vergelijken 🔎</h1>
        <p className="pm-subtitle">
          Vergelijk je boodschappen tussen supermarkten.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        {premium ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <div className="font-semibold">💎 Premium is actief</div>
              <div className="text-slate-500">
                Je vergelijking wordt automatisch opgeslagen in{" "}
                <Link className="underline" href="/geschiedenis">
                  Geschiedenis
                </Link>
                .
              </div>

              {data ? (
                <div className="mt-1 text-xs text-slate-500">
                  {saveStatus === "saving" ? "Opslaan…" : null}
                  {saveStatus === "saved" ? "✅ Opgeslagen" : null}
                  {saveStatus === "failed"
                    ? "⚠️ Kon niet opslaan (probeer opnieuw)"
                    : null}
                </div>
              ) : null}
            </div>

            <div className="text-xs text-slate-500">
              Tip: geef je vergelijking een naam voor je historie.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <div className="font-semibold">
                Wil je je vergelijkingen bewaren?
              </div>
              <div className="text-slate-500">
                Met Premium kun je je vergelijkingen{" "}
                <span className="font-medium">opslaan</span>, later{" "}
                <span className="font-medium">terugkijken</span>,{" "}
                <span className="font-medium">aanpassen</span> en{" "}
                <span className="font-medium">hergebruiken</span>.
              </div>
              <div className="mt-1 text-xs text-slate-500">
                💡 Tip: geef je lijst een naam, dan vind je ’m sneller terug in
                Geschiedenis.
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Status: {userId ? "ingelogd" : "niet ingelogd"}
              </div>
            </div>

            <button
              type="button"
              className="pm-btn"
              onClick={() => {
                const itemsToSend = buildItemsToSend();
                const payload = buildPayload(itemsToSend);
                startPremiumIntentSave(payload, data);
              }}
              title="Premium nodig om op te slaan"
            >
              💾 Sla vergelijking op (Premium)
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="pm-h2">Kies winkels</h2>
          <div className="pm-checkRow">
            {(["AH", "Jumbo", "Dirk"] as Store[]).map((s) => (
              <label key={s} className="pm-checkPill">
                <input
                  type="checkbox"
                  checked={stores[s]}
                  onChange={(e) =>
                    setStores((prev) => ({
                      ...prev,
                      [s]: e.target.checked,
                    }))
                  }
                />
                {s === "AH" ? "Albert Heijn" : s}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="pm-h2">Producten kiezen</h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr_3fr]">
            <div>
              <label className="pm-label">
                Kies producten uit de suggestielijst
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={suggestQuery}
                  placeholder="Begin met typen..."
                  onChange={(e) => {
                    setSuggestQuery(e.target.value);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setSuggestOpen(false), 120);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const first = suggestions[0];
                      if (first) {
                        addSuggestionToList(first);
                      }
                    }
                  }}
                />

                {suggestOpen ? (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white p-1 shadow">
                    {suggestQuery.trim().length < 2 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Typ minimaal 2 letters
                      </div>
                    ) : suggestLoading ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Zoeken…
                      </div>
                    ) : suggestError ? (
                      <div className="px-3 py-2 text-sm text-red-700">
                        {suggestError}
                      </div>
                    ) : suggestions.length ? (
                      <ul className="max-h-56 overflow-auto">
                        {suggestions.map((opt) => (
                          <li key={`${opt.store}-${opt.product_id}`}>
                            <button
                              type="button"
                              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => addSuggestionToList(opt)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 shrink-0">
                                  {opt.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={opt.image_url}
                                      alt=""
                                      className="h-8 w-8 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-slate-100" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate">{opt.label}</div>
                                  <div className="text-xs text-slate-500">
                                    ({opt.store})
                                  </div>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Geen resultaten
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="pm-help">
                De backend bepaalt de logica van de suggesties; de frontend doet
                geen eigen matching.
              </div>
            </div>

            <div>
              <div className="pm-label">
                Geselecteerd (klik om te verwijderen)
              </div>

              <div className="rounded-lg border bg-white p-3">
                {manualList.length ? (
                  <ul className="space-y-2">
                    {manualList.map((label) => {
                      const meta = selectionMap[label];

                      return (
                        <li key={label}>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 shrink-0">
                              {meta?.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={meta.image_url}
                                  alt=""
                                  className="h-8 w-8 rounded object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-slate-100" />
                              )}
                            </div>

                            <button
                              type="button"
                              className="flex-1 text-left text-sm hover:underline"
                              onClick={() => removeSelected(label)}
                              title="Klik om te verwijderen"
                            >
                              <div className="truncate">{label}</div>
                              {meta?.store ? (
                                <div className="text-xs text-slate-500">
                                  ({meta.store})
                                </div>
                              ) : null}
                            </button>

                            <button
                              type="button"
                              className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                              onClick={() => removeSelected(label)}
                            >
                              Verwijder
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">
                    Nog geen producten geselecteerd.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="pm-label">
                Boodschappenlijst (één product per regel)
              </label>
              <textarea
                ref={textareaRef}
                placeholder={"Bijv.\nhalfvolle melk\nbananen\nbrood volkoren"}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                style={{ overflow: "hidden", resize: "none" }}
              />
              <div className="pm-help">
                Vrije tekst blijft simpel; de backend doet de matchdata-first
                compare-logica.
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="pm-label">Naam voor deze lijst (optioneel)</label>
          <input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Bijv. Weekboodschappen"
          />
        </div>

        {paywall && (
          <div className="pm-card">
            <div className="space-y-3">
              <div className="pm-h2">🔒 Premium vereist</div>

              <p className="pm-text">{paywall.message}</p>

              <ul className="pm-bullets">
                <li>Onbeperkt vergelijken</li>
                <li>Vergelijkingen opslaan</li>
                <li>Geschiedenis & vaste lijstjes gebruiken</li>
              </ul>

              <div className="pm-ctaWrap">
                <button
                  type="button"
                  className="pm-ctaBtn"
                  onClick={() => {
                    router.push(
                      `/premium?next=${encodeURIComponent("/vergelijken")}`
                    );
                  }}
                >
                  💎 Bekijk Premium
                </button>
              </div>

              <p className="pm-caption" style={{ textAlign: "center" }}>
                Lees eerst wat Premium je oplevert — activeren kan daarna.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={runCompare}
          disabled={loading}
          className="pm-btn"
          type="button"
        >
          {loading ? "Bezig…" : "Vergelijk prijzen"}
        </button>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="text-xs text-slate-500">
          API: <span className="font-mono">{API_BASE}</span>
        </div>
      </div>

      {data ? (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            {selectedStores.map((s) => (
              <div
                key={s}
                className={`rounded-lg border bg-white p-4 ${
                  cheapestStoreTotal === s ? "ring-2 ring-emerald-400" : ""
                }`}
              >
                <div className="text-sm text-slate-500">{s}</div>
                <div className="mt-1 text-xl font-semibold">
                  {euro(totalsMap.get(s))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="pm-h2" style={{ marginBottom: 0 }}>
                Alle producten per winkel
              </h2>

              {premium ? (
                <div className="text-xs text-slate-500">
                  Premium: opgeslagen in{" "}
                  <Link className="underline" href="/geschiedenis">
                    Geschiedenis
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Tip: premium → bewaar je compares & historie
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectedStores.map((store) => (
                <ReceiptCard
                  key={store}
                  store={store}
                  isWinner={cheapestStoreTotal === store}
                  subtitle="Alle gekozen producten (— = niet gevonden)"
                >
                  <div className="space-y-1">
                    {data.matches.map((row, idx) => {
                      const price = safeNumber((row as any)?.[store]);
                      const name =
                        (row as any)?.[`${store}_naam`] || row.product || "—";
                      const img = (row as any)?.[`${store}_img`];

                      return (
                        <LineItem
                          key={idx}
                          img={img}
                          name={String(name)}
                          price={price}
                        />
                      );
                    })}
                  </div>
                </ReceiptCard>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-3">
            <h2 className="pm-h2" style={{ marginBottom: 0 }}>
              Goedkoopste product per winkel
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {selectedStores.map((store) => {
                const items = cheapestByStore.buckets[store] || [];
                const subtotal = cheapestByStore.subtotals[store] || 0;

                const byProduct = new Map<string, CompareMatchRow>();
                data.matches.forEach((m) => byProduct.set(String(m.product), m));

                return (
                  <ReceiptCard
                    store={store}
                    key={store}
                    subtitle="Alleen producten die hier het goedkoopst zijn"
                  >
                    {items.length ? (
                      <div className="space-y-1">
                        {items.map((it, idx) => {
                          const match = byProduct.get(String(it.product));
                          const name =
                            (match as any)?.[`${store}_naam`] ||
                            it.product ||
                            "—";
                          const img =
                            (match as any)?.[`${store}_img`] || null;

                          return (
                            <LineItem
                              key={idx}
                              img={img}
                              name={String(name)}
                              price={safeNumber(it.price)}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">—</div>
                    )}

                    <div className="my-3 border-t" />
                    <div className="text-base font-semibold">
                      Totaal: <span className="font-bold">{euro(subtotal)}</span>
                    </div>
                  </ReceiptCard>
                );
              })}
            </div>

            {cheapestByStore.unpriced.length ? (
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                Niet gevonden in de vergelijking:{" "}
                {cheapestByStore.unpriced.join(", ")}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}