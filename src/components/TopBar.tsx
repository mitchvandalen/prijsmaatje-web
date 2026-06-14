"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { useAuth } from "@/lib/auth";

const mobileNav = [
  { href: "/", label: "Home" },
  { href: "/vergelijken", label: "🔎 Vergelijken" },
  { href: "/match-suggestie", label: "🔧 Match voorstellen" },
  { href: "/premium", label: "💎 Premium" },
  { href: "/geschiedenis", label: "🕒 Geschiedenis" },
];

export default function TopBar() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPremium = !!user?.is_premium;

  return (
    <div className="pm-topbarWrap">
      <div className="pm-topbar">
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-xl shadow-sm hover:bg-slate-50"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <Link href="/" className="text-sm font-semibold text-slate-800">
            PrijsMaatje
          </Link>
        </div>

        <div className="pm-topbarRight">
          <Link
            href="/premium"
            className={`pm-badge ${isPremium ? "pm-badgeOn" : "pm-badgeOff"}`}
            style={{ pointerEvents: loading ? "none" : "auto" }}
          >
            <span>💎 Premium</span>
            <span className="pm-badgeText">
              {loading ? "..." : isPremium ? "Actief" : "Upgrade"}
            </span>
          </Link>

          <AuthButtons />
        </div>
      </div>

      {menuOpen ? (
        <div className="border-b bg-white px-4 py-3 shadow-sm md:hidden">
          <nav className="flex flex-col gap-2">
            {mobileNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}