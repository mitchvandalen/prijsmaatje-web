"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// ---------- helpers ----------
function getUserId() {
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
      const line = String(it.label || it.query || "").trim();
      if (line) lines.push(line);
    } else if (it != null) {
      const line = String(it).trim();
      if (line) lines.push(line);
    }
  }
  return lines.join("\n");
}

/**
 * ✅ GEFIXTE api helper
 * - Content-Type alleen bij requests met body
 * - voorkomt CORS preflight + Failed to fetch
 */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
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
type FixedList = {
  id: number | string;
  name?: string;
  created_at?: string;
  items?: any[];
};

type HistoryItem = {
  id: number | string;
  name?: string;
  created_at?: string;
  payload?: {
    items?: any[];
    stores?: string[];
  };
};

export default function GeschiedenisPage() {
  const router = useRouter();
  const userId = useMemo(() => getUserId(), []);

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [fixedLists, setFixedLists] = useState<FixedList[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // UI state
  const [renameFixed, setRenameFixed] = useState<Record<string, string>>({});
  const [renameHist, setRenameHist] = useState<Record<string, string>>({});
  const [saveAsFixedName, setSaveAsFixedName] = useState<Record<string, string>>({});

  // 🔐 Premium status uit backend
  useEffect(() => {
    api<{ user_id: string; is_premium: boolean }>(
      `/premium/status?user_id=${encodeURIComponent(userId)}`
    )
      .then((r) => setIsPremium(Boolean(r.is_premium)))
      .catch(() => setIsPremium(false));
  }, [userId]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const listsResp = await api<{ lists: FixedList[] }>(
        `/premium/lists?user_id=${encodeURIComponent(userId)}`
      );
      const histResp = await api<{ history: HistoryItem[] }>(
        `/premium/history?user_id=${encodeURIComponent(userId)}&limit=30`
      );

      setFixedLists(listsResp.lists ?? []);
      setHistory(histResp.history ?? []);

      const rf: Record<string, string> = {};
      for (const l of listsResp.lists ?? []) rf[String(l.id)] = l.name ?? "Zonder naam";
      setRenameFixed(rf);

      const rh: Record<string, string> = {};
      const sf: Record<string, string> = {};
      for (const h of histResp.history ?? []) {
        rh[String(h.id)] = h.name ?? "Zonder naam";
        sf[String(h.id)] = h.name ?? "Zonder naam";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  function useItems(items: any[]) {
    const text = itemsToText(items);
    const list = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    localStorage.setItem("pm_manual_items_list", JSON.stringify(list));
    localStorage.setItem("pm_loaded_from_history", "true");
    router.push("/vergelijken");
  }

  // ---------- actions ----------
  async function renameFixedList(listId: string) {
    const name = (renameFixed[listId] ?? "").trim() || "Zonder naam";
    await api(`/premium/lists/${encodeURIComponent(listId)}/rename`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, name }),
    });
    loadAll();
  }

  async function deleteFixedList(listId: string) {
    await api(`/premium/lists/${encodeURIComponent(listId)}?user_id=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    loadAll();
  }

  async function renameHistoryItem(histId: string) {
    const name = (renameHist[histId] ?? "").trim() || "Zonder naam";
    await api(`/premium/history/${encodeURIComponent(histId)}/name`, {
      method: "PATCH",
      body: JSON.stringify({ user_id: userId, name }),
    });
    loadAll();
  }

  async function saveHistoryAsFixed(histId: string, items: any[]) {
    const name = (saveAsFixedName[histId] ?? "").trim() || "Vaste lijst";
    await api(`/premium/save_list`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, name, items }),
    });
    loadAll();
  }

  async function deleteHistoryItem(histId: string) {
    await api(`/premium/history/${encodeURIComponent(histId)}?user_id=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
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
                {/* Vaste lijsten */}
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

                {/* Geschiedenis */}
                <section className="pm-card">
                  <h2 className="pm-h2">🧾 Geschiedenis</h2>

                  {history.length === 0 ? (
                    <p className="pm-caption">Nog geen opgeslagen vergelijkingen.</p>
                  ) : (
                    history.map((h) => {
                      const hid = String(h.id);
                      const ts = (h.created_at || "").replace("T", " ").slice(0, 19);
                      const name = h.name || "Zonder naam";
                      const payload = h.payload || {};
                      const items = payload.items || [];
                      const stores = payload.stores || [];

                      const text = itemsToText(items);
                      const count = text ? text.split("\n").filter(Boolean).length : 0;

                      return (
                        <details key={hid} className="mt-3">
                          <summary>
                            {name} — {ts} — Winkels: {stores.join(", ")} — Items: {count}
                          </summary>

                          <pre className="pm-code">{text || "—"}</pre>

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
                            <button
                              className="pm-btn"
                              onClick={() => saveHistoryAsFixed(hid, items)}
                            >
                              ⭐ Opslaan als vaste lijst
                            </button>
                            <button
                              className="pm-btn"
                              onClick={() => deleteHistoryItem(hid)}
                            >
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
