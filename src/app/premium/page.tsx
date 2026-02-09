import { Suspense } from "react";
import PremiumInner from "./PremiumInner";

export default function Page() {
  return (
    <Suspense fallback={<div className="pm-page">Laden…</div>}>
      <PremiumInner />
    </Suspense>
  );
}

