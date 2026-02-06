"use client";

import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { useAuth } from "@/lib/auth";

export default function TopBar() {
  const { user, loading } = useAuth();

  const isPremium = !!user?.is_premium;

  return (
    <div className="pm-topbar">
      <div className="pm-topbarRight">
        {/* Premium badge: linkt naar /premium als je niet premium bent */}
        <Link
          href={isPremium ? "/premium" : "/premium"}
          className={`pm-badge ${isPremium ? "pm-badgeOn" : "pm-badgeOff"}`}
          style={{ pointerEvents: loading ? "none" : "auto" }}
        >
          <span>💎 Premium</span>
          <span className="pm-badgeText">
            {loading ? "..." : isPremium ? "Actief" : "Upgrade"}
          </span>
        </Link>

        {/* Login / Register of user + logout */}
        <AuthButtons />
      </div>
    </div>
  );
}
