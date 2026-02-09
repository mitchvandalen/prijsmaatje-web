import { Suspense } from "react";
import PremiumSuccessInner from "./PremiumSuccessInner";

export default function PremiumSuccessPage() {
  return (
    <Suspense fallback={<div className="pm-page">Laden…</div>}>
      <PremiumSuccessInner />
    </Suspense>
  );
}

