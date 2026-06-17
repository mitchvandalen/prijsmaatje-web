"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prijsmaatje.nl";

export default function AccountInner() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleteError("");
    setDeleting(true);

    try {
      const res = await fetch(`${API_BASE}/account/delete`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Account verwijderen mislukt.");
      }

      await logout();
      router.push("/");
    } catch (e: any) {
      setDeleteError(
        e?.message ||
          "Account verwijderen mislukt. Controleer of je Premium-abonnement eerst is opgezegd."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="pm-page">
        <div className="pm-content">Laden…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pm-page">
        <div className="pm-content">
          <div className="pm-card">
            <h2 className="pm-h2">🔒 Inloggen vereist</h2>
            <p className="pm-caption">
              Log in om je accountinstellingen te bekijken.
            </p>
            <button className="pm-btn mt-3" onClick={() => router.push("/login")}>
              Inloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-page">
      <div className="pm-content">
        <header className="pm-header">
          <h1 className="pm-title">👤 Account beheren</h1>
          <p className="pm-subtitle">
            Beheer je account, abonnement en opgeslagen gegevens.
          </p>
        </header>

        <section className="pm-card mb-6">
          <h2 className="pm-h2">📧 Profiel</h2>
          <p className="pm-caption">Ingelogd als:</p>
          <p>
            <strong>{user.email}</strong>
          </p>
        </section>

        <section className="pm-card mb-6">
          <h2 className="pm-h2">💎 Abonnement beheren</h2>
          <p className="pm-caption">
            Bekijk je Premium-status, proefperiode of abonnement.
          </p>
          <button className="pm-btn mt-3" onClick={() => router.push("/premium")}>
            Naar Premium
          </button>
        </section>

        <section className="pm-card mb-6">
          <h2 className="pm-h2">🕒 Vergelijkingsgeschiedenis</h2>
          <p className="pm-caption">
            Bekijk eerdere vergelijkingen en opgeslagen lijsten.
          </p>
          <button
            className="pm-btn mt-3"
            onClick={() => router.push("/geschiedenis")}
          >
            Geschiedenis bekijken
          </button>
        </section>

        <section className="pm-card mb-6">
          <h2 className="pm-h2">🚪 Uitloggen</h2>
          <p className="pm-caption">Log uit op dit apparaat.</p>
          <button className="pm-btn mt-3" onClick={logout}>
            Uitloggen
          </button>
        </section>

        <section className="pm-card border border-red-200">
          <h2 className="pm-h2 text-red-700">🗑️ Account verwijderen</h2>

          <p className="pm-caption">
            Het verwijderen van je account is permanent. Je accountgegevens,
            vergelijkingsgeschiedenis en vaste lijsten worden verwijderd.
          </p>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Let op:</strong>
            <br />
            Heb je een actief Premium-abonnement? Zeg dit eerst op via de
            Premium-pagina. Zolang Premium actief is, kan je account niet worden
            verwijderd.
          </div>

          {!confirmDelete ? (
            <button
              className="pm-btn mt-4"
              type="button"
              onClick={() => setConfirmDelete(true)}
            >
              Account verwijderen
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-red-700">
                Weet je zeker dat je je account definitief wilt verwijderen?
                Deze actie kan niet ongedaan worden gemaakt.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  className="pm-btn"
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Annuleren
                </button>

                <button
                  className="pm-btn"
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting}
                >
                  {deleting
                    ? "Verwijderen…"
                    : "Ja, verwijder mijn account definitief"}
                </button>
              </div>
            </div>
          )}

          {deleteError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {deleteError}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}