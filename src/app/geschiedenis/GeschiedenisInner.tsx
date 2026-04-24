"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prijsmaatje.nl";

// ---------- helpers ----------
function getUserId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const key = "pm_user_id";
  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

function itemsToText(items: any[]): string {
  const lines: string[] = [];

  for (const it of items ?? []) {
    if (it && typeof it === "object") {
      const line = String(
        it.label || it.query || it.product_query || ""
      ).trim();
      if (line) lines.push(line);
    } else if (it != null) {
      const line = String(it).trim();
      if (line) lines.push(line);
    }
  }

  return lines.join("\n");
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
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
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }

  return (await res.json()) as T;
}

// ---------- types ----------
type FixedListItem = {
  id?: number | string;
  product_query?: string;
  quantity?: number | null;
  note?: string | null;
  meta?: any;
  sort_order?: number;
};

type FixedList = {
  id: number | string;
  name?: string;
  created_at?: string;
  items?: FixedListItem[];
};

type HistoryItem = {
  id: number | string;
  name?: string;
  created_at?: string;
  saved_amount?: number;
  payload?: {
    name?: string;
    items?: any[];
    stores?: string[];
  };
  result?: {
    totals?: Array<{
      store: string;
      total: number;
    }>;
  };
};

export default function GeschiedenisInner() {
  const router = useRouter();
  const userId = useMemo(() => getUserId(), []);

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fixedLists, setFixedLists] = useState<FixedList[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);

  const [renameFixed, setRenameFixed] = useState<Record<string, string>>({});
  const [renameHist, setRenameHist] = useState<Record<string, string>>({});
  const [saveAsFixedName, setSaveAsFixedName] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId || userId === "server") return;

    api<{ user_id: string; is_premium: boolean }>(
      `/premium/status?user_id=${encodeURIComponent(userId)}`
    )
      .then((r) => setIsPremium(Boolean(r.is_premium)))
      .catch(() => setIsPremium(false));
  }, [userId]);

  async function loadAll() {
    if (!userId || userId === "server") return;

    setLoading(true);
    setError("");

    try {
      const listsResp = await api<{ lists: FixedList[] }>(
        `/premium/lists?user_id=${encodeURIComponent(userId)}`
      );
      const histResp = await api<{ history: HistoryItem[]; total_saved: number }>(
        `/premium/history?user_id=${encodeURIComponent(userId)}&limit=30`
      );

      setFixedLists(listsResp.lists ?? []);
      setHistory(histResp.history ?? []);
      setTotalSaved(Number(histResp.total_saved ?? 0));

      const rf: Record<string, string> = {};
      for (const l of listsResp.lists ?? []) {
        rf[String(l.id)] = l.name ?? "Zonder naam";
      }
      setRenameFixed(rf);

      const rh: Record<string, string> = {};
      const sf: Record<string, string> = {};
      for (const h of histResp.history ?? []) {
        const fallbackName = h.payload?.name ?? h.name ?? "Zonder naam";
        rh[String(h.id)] = fallbackName;
        sf[String(h.id)] = fallbackName;
      }
      setRenameHist(rh);
      setSaveAsFixedName(sf);
    } catch (e: any) {
      setError(e?.message || "Kon data niet laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isPremium) return;
    loadAll();
  }, [isPremium]);

  function useItems(items: any[]) {
    const text = itemsToText(items);
    const list = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (typeof window !== "undefined") {
      localStorage.setItem("pm_manual_items_list", JSON.stringify(list));
      localStorage.setItem("pm_loaded_from_history", "true");
    }

    router.push("/vergelijken");
  }

  async function renameFixedList(listId: string) {
    if (!userId || userId === "server") return;

    const name = (renameFixed[listId] ?? "").trim() || "Zonder naam";
    await api(`/premium/lists/${encodeURIComponent(listId)}/rename`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, name }),
    });
    loadAll();
  }

  async function deleteFixedList(listId: string) {
    if (!userId || userId === "server") return;

    await api(
      `/premium/lists/${encodeURIComponent(listId)}?user_id=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      }
    );
    loadAll();
  }

  async function renameHistoryItem(histId: string) {
    if (!userId || userId === "server") return;

    const name = (renameHist[histId] ?? "").trim() || "Zonder naam";
    await api(`/premium/history/${encodeURIComponent(histId)}/name`, {
      method: "PATCH",
      body: JSON.stringify({ user_id: userId, name }),
    });
    loadAll();
  }

  async function saveHistoryAsFixed(histId: string, items: any[]) {
    if (!userId || userId === "server") return;

    const name = (saveAsFixedName[histId] ?? "").trim() || "Vaste lijst";
    await api(`/premium/lists`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, name, items }),
    });
    loadAll();
  }

  async function deleteHistoryItem(histId: string) {
    if (!userId || userId === "server") return;

    await api(
      `/premium/history/${encodeURIComponent(histId)}?user_id=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      }
    );
    loadAll();
  }

  return (
    <div className="pm-page">
      <div className="pm-content">
        <header className="pm-header">
          <h1 className="pm-title">Geschiedenis 🕒</h1>
          <p className="pm-subtitle">Je opgeslagen vergelijkingen en vaste lijsten (Premium).</p>
        </header>

        {!isPremium && (
          <div className="pm-card">
            <h2 className="pm-h2">🔒 Premium vereist</h2>
            <p className="pm-caption">
              Activeer Premium om je vergelijkingsgeschiedenis en vaste lijsten te bekijken.
            </p>
            <div className="mt-3">
              <button className="pm-btn" onClick={() => router.push("/premium")}>
                Ga naar Premium
              </button>
            </div>
          </div>
        )}

        {isPremium && (
          <>
            {loading && <p className="pm-caption">Laden…</p>}
            {!!error && <div className="pm-status">{error}</div>}

            {!loading && !error && (
              <>
                <section className="pm-card mb-6">
                  <h2 className="pm-h2">💰 Totale besparing</h2>
                  <p className="pm-caption">
                    Tot nu toe heb je met vergelijken <strong>€{totalSaved.toFixed(2)}</strong> kunnen besparen.
                  </p>
                </section>

                <section className="pm-card mb-6">
                  <h2 className="pm-h2">⭐ Vaste lijsten</h2>

                  {fixedLists.length === 0 ? (
                    <p className="pm-caption">
                      Nog geen vaste lijsten. Je kunt er één maken vanuit je geschiedenis hieronder.
                    </p>
                  ) : (
                    fixedLists.map((lst) => {
                      const lid = String(lst.id);
                      const name = lst.name || "Zonder naam";
                      const created = (lst.created_at || "").replace("T", " ").slice(0, 19);
                      const items = lst.items || [];
                      const text = itemsToText(items);
                      const count = text ? text.split("\n").filter(Boolean).length : 0;

                      return (
                        <details key={lid} className="mt-3">
                          <summary>
                            {name} — {created} — {count} items
                          </summary>

                          <pre className="pm-code">{text || "—"}</pre>

                          <div className="pm-twoCol mt-3">
                            <button className="pm-btn" onClick={() => useItems(items)}>
                              📋 Gebruik deze lijst
                            </button>
                            <button className="pm-btn" onClick={() => deleteFixedList(lid)}>
                              🗑️ Verwijder vaste lijst
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className="pm-label">Hernoem</label>
                            <input
                              type="text"
                              value={renameFixed[lid] ?? name}
                              onChange={(e) =>
                                setRenameFixed((p) => ({ ...p, [lid]: e.target.value }))
                              }
                            />
                            <div className="mt-2">
                              <button className="pm-btn" onClick={() => renameFixedList(lid)}>
                                💾 Opslaan naam
                              </button>
                            </div>
                          </div>
                        </details>
                      );
                    })
                  )}
                </section>

                <section className="pm-card">
                  <h2 className="pm-h2">🧾 Geschiedenis</h2>

                  {history.length === 0 ? (
                    <p className="pm-caption">Nog geen opgeslagen vergelijkingen.</p>
                  ) : (
                    history.map((h) => {
                      const hid = String(h.id);
                      const ts = (h.created_at || "").replace("T", " ").slice(0, 19);
                      const name = h.payload?.name || h.name || "Zonder naam";
                      const payload = h.payload || {};
                      const items = payload.items || [];
                      const stores = payload.stores || [];
                      const saved = Number(h.saved_amount ?? 0);

                      const text = itemsToText(items);
                      const count = text ? text.split("\n").filter(Boolean).length : 0;

                      return (
                        <details key={hid} className="mt-3">
                          <summary>
                            {name} — {ts} — Winkels: {stores.join(", ")} — Items: {count}
                          </summary>

                          <pre className="pm-code">{text || "—"}</pre>

                          <div className="mt-3">
                            <strong>Besparing bij deze vergelijking:</strong> €{saved.toFixed(2)}
                          </div>

                          <div className="mt-3">
                            <label className="pm-label">Naam</label>
                            <input
                              type="text"
                              value={renameHist[hid] ?? name}
                              onChange={(e) =>
                                setRenameHist((p) => ({ ...p, [hid]: e.target.value }))
                              }
                            />
                          </div>

                          <div className="pm-twoCol mt-3">
                            <button className="pm-btn" onClick={() => useItems(items)}>
                              📋 Gebruik deze lijst
                            </button>
                            <button className="pm-btn" onClick={() => renameHistoryItem(hid)}>
                              💾 Opslaan naam
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className="pm-label">Naam vaste lijst</label>
                            <input
                              type="text"
                              value={saveAsFixedName[hid] ?? name}
                              onChange={(e) =>
                                setSaveAsFixedName((p) => ({ ...p, [hid]: e.target.value }))
                              }
                            />
                          </div>

                          <div className="pm-twoCol mt-3">
                            <button className="pm-btn" onClick={() => saveHistoryAsFixed(hid, items)}>
                              ⭐ Opslaan als vaste lijst
                            </button>
                            <button className="pm-btn" onClick={() => deleteHistoryItem(hid)}>
                              🗑️ Verwijder uit geschiedenis
                            </button>
                          </div>
                        </details>
                      );
                    })
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}