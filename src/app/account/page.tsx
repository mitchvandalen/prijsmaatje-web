import { Suspense } from "react";
import AccountInner from "./AccountInner";

export default function Page() {
  return (
    <Suspense fallback={<div className="pm-page">Laden…</div>}>
      <AccountInner />
    </Suspense>
  );
}